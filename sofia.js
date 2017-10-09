const borq = require('borq');
let fs = require('fs');

const winston = require('winston');
const expressWinston = require('express-winston');

const i18next = require('i18next');
const Backend = require('i18next-node-fs-backend');

const {
  facebookUtils,
  facebookBot,
  services,
  config,
  http,
  localeUtils,
} = borq;

const {
  nextConversation,
  goto,
  generateButtonTemplate,
  generateQuickReply,
} = facebookUtils;

const language = config.defaultLanguage;
const sofia = facebookBot.spawn({});

/**
* The english translations
* @global
* @const {object}
*/
const enTranslation = JSON.parse(fs.readFileSync('translations/en.json'));

// To remove
const childName = 'your child';
const genderPronoun = 'she';
/*
const mockChild = {
  momId: 1234,
  childID: 4321,
  gender: female,
  childName,
  motherSMSnumber: 254722124323,
};
*/

/**
* Get the language data from localeUtils.languages for
* the bot's languages
* @param {string} langs - The languages supported
* @return {array} - array of language objects
*/
function getNs(langs) {
  return localeUtils.languages.filter((e) => {
    return langs.includes(e.iso6391);
  });
}

const i18nextOptions = {
  debug: config.debugTranslations,
  ns: getNs(['en', 'in']).map(({iso6391}) => iso6391),
  defaultNS: config.defaultLanguage,
  fallbackLng: config.defaultLanguage,
  backend: {
    loadPath: 'translations/{{{ns}}}.json',
  },
  interpolation: {
    prefix: '{{{',
    suffix: '}}}',
  },
};

i18next
  .use(Backend)
  .init(i18nextOptions,
        (err, t) => {
          if (err) {
            winston.log('error',
                        `Something went wrong loading transaltion ${t}`,
                        err);
          }
          winston.log('info', 'Translations loaded successfully');
        });


facebookBot.setupWebserver(config.PORT, (err, webserver) => {
  if (config.environment === 'production') {
    webserver.use(services.sentry.requestHandler());
  }

  webserver.use(expressWinston.logger({
    transports: [
      new winston.transports.File({
        filename: 'karma.access.log',
        logstash: true,
        zippedArchive: true,
      })],
  }));

  facebookBot.createWebhookEndpoints(webserver, sofia, () => {});

  webserver.get('/', (req, res) => {
    const html = '<h3>Sofia is a bot for ECD</h3>';
    res.send(html);
  });

  if (config.environment === 'production') {
    webserver.use(services.sentry.errorHandler());
  }
});

/**
* The SRQ 20 conversation
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
*/
function srq20(err, convo) {
  const srq20QuestionKeys = Object.keys(enTranslation.SRQ20);
  srq20QuestionKeys.map((key) => {
    if (/intro./.test(key)) {
      convo.addMessage(i18next.t(`${language}:SRQ20.${key}`), 'srq 20');
      return goto('srq 20');
    } else {
      return convo.addQuestion(
        generateButtonTemplate(i18next.t(`${language}:SRQ20.${key}`),
                               [i18next.t(`${language}:generic.yes`),
                                i18next.t(`${language}:generic.no`)]),
        nextConversation,
        {},
        'srq 20');
    }
});
}

/**
* The Caregiver knowledge conversation meant to test the caregiver's knowledge.
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
*/
function caregiverKnowledge(err, convo) {
  const caregiverKnowledgeQuestionKeys = Object.keys(
    enTranslation.caregiverKnowledge);
  caregiverKnowledgeQuestionKeys.map((key) => {
    if (/intro./.test(key)) {
      convo.addMessage(i18next.t(`${language}:caregiverKnowledge.${key}`),
                       'caregiver knowledge');
      return goto('caregiver knowledge');
    } else {
      return convo.addQuestion(
      generateQuickReply(i18next.t(`${language}:caregiverKnowledge.${key}`),
                         [i18next.t(`${language}:caregiverKnowledge.birth`),
                          i18next.t(`${language}:caregiverKnowledge.2`),
                          i18next.t(`${language}:caregiverKnowledge.4to5`),
                          i18next.t(`${language}:caregiverKnowledge.7to9`),
                          i18next.t(`${language}:caregiverKnowledge.9to14`)]),
      nextConversation,
      {},
      'caregiver knowledge');
    }
});
}

/**
* The FCI conversation
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
* @param {string} language An ISO6391 language code string
*/
function fci(err, convo, language) {
  const fciQuestionKeys = Object.keys(enTranslation.FCI);
  fciQuestionKeys.map((key) => {
    if (/intro./.test(key)) {
      convo.addMessage(
        i18next.t(`${language}:FCI.${key}`, {childName, genderPronoun}), 'fci');
      return goto('fci');
    } else {
      return convo.addQuestion(
        generateButtonTemplate(
          i18next.t(`${language}:FCI.${key}`, {childName, genderPronoun}),
          null,
          [{title: i18next.t(`${language}:generic.yes`),
            payload: 'yes'},
           {title: i18next.t(`${language}:generic.no`),
            payload: 'no'},
           {title: i18next.t(`${language}:generic.idk`),
            payload: 'idk'}]),
        nextConversation,
        {key},
        'fci');
    }
});
}

/**
* This function will likely be removed and replaced by a scheduler.
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
* @param {object} contact a rapidpro contact object
*/
function pickConversation(err, convo, contact) {
  const language = localeUtils.lookupISO6391(contact.language);
  fci(err, convo, language);
  srq20(err, convo);
  caregiverKnowledge(err, convo);

  convo.gotoThread('fci');

  convo.on('end', function(convo) {
    if (convo.status=='completed' || convo.status=='interrupted') {
      if (convo.status=='completed') {
        facebookUtils.sendMessage(sofia, convo.context.user, (err, convo) => {
          convo.say(i18next.t(`${language}:generic.outro`));
        });
      }
      winston.log('info', `>   [${convo.status}] ...`);
      services.genAndPostSubmissionToOna(convo);
    }
  });

  convo.onTimeout((convo) => {
    convo.addMessage(i18next.t(`${language}:generic.timeoutMessage`),
                     'timeout message');
    convo.gotoThread('timeout message');
    winston.log('info', '>   [TIMEOUT] ...');
  });
}

// Messenger configs
facebookBot.api.messenger_profile.greeting( 'Sofia is here to help with' +
                                                  ' your ECD needs.');
facebookBot.api.messenger_profile.get_started('get_started');
facebookBot.api.messenger_profile.menu([{
  locale: 'default',
  composer_input_disabled: true,
  call_to_actions: [
    {
      title: 'Help',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Restart survery',
          type: 'postback',
          payload: 'restart',
        },
      ],
    },
    {title: 'Change language',
      type: 'nested',
      call_to_actions: [
        {
          title: 'English',
          type: 'postback',
          payload: 'switch_en',
        },
        {
          title: 'Bahasa',
          type: 'postback',
          payload: 'switch_in',
        },
      ],
    },
    {
      type: 'web_url',
      title: 'FAQ',
      url: 'https://sofia.goodbot.ai/',
      webview_height_ratio: 'full',
    },
  ],
}, {
  locale: 'id_ID',
  composer_input_disabled: true,
  call_to_actions: [
    {
      title: 'Membantu',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Mengulang kembali',
          type: 'postback',
          payload: 'restart',
        },
      ],
    },
    {title: 'Ganti bahasa',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Inggris',
          type: 'postback',
          payload: 'switch_en',
        },
        {
          title: 'Bahasa',
          type: 'postback',
          payload: 'switch_in',
        },
      ],
    },
    {
      type: 'web_url',
      title: 'FAQ',
      url: 'https://sofia.goodbot.ai/',
      webview_height_ratio: 'full',
    },
  ],
},
]);

/**
* Get the region for a specific timezone
* @param {Integer} timezone The timezone of the user runs from 0 to 12
* @return {String} the region that the user is in
*/
function regionByTimeZone(timezone) {
  if (timezone > 3) {
    return 'ind';
  } else {
    return 'default';
  }
}

/**
* First try locale, if it fails try timezone, if that fails use default
* @param {String} locale of the user from FB
* @param {String} timezone of the user from FB
* @return {String} language as a ISO6392 string
*/
function pickLanguage({locale, timezone}) {
  if (locale) {
    const lang = localeUtils.extractLanguageFromLocale(locale);
    return localeUtils.lookupISO6392(lang) || config.defaultLanguage;
  } else {
    const region = regionByTimeZone(timezone);
    const lang = 'default' ? config.defaultLanguage : region;
    return localeUtils.lookupISO6392(lang);
  }
}

/**
* Create a karma user and start a conversation with them
* @param {object} message a message object also created by the controller
* @param {object} bot a bot instance created by the controller
*/
function createUserAndStartConversation(message, bot) {
  const extraArgs = message.referral ? {opensrp_id: message.referral.ref} : {};
  services.getFacebookProfile(message.user)
    .then((profile) => {
      services.createUser(message.user,
                          Object.values(config.rapidproGroups),
                          pickLanguage(profile),
                          profile,
                          extraArgs)
        .then((rapidProContact) =>
              bot.startConversation(message, (err, convo) => {
                pickConversation(err, convo, rapidProContact);
              }))
        .catch((reason) => http.genericCatchRejectedPromise(
          `Failed createUser: ${reason}`));
        })
    .catch((reason) => http.genericCatchRejectedPromise(
      'Failed to fetch Facebook profile' +
        `in createUserAndStartConversation: ${reason}`));
}

/**
* Fetch facebook user profile get the reponent's language and name
* No return statement.
* We use it to start the conversation and get the user profile from Facebook.
* @param {object} bot A bot instance created by the controller
* @param {object} message a message object also created by the controller
* @param {string} language An ISO6392 language code string
*/
function prepareConversation(bot, message, language) {
  const urn = `facebook:${message.user}`;
  if (language) {
    services.updateRapidProContact({urn}, {language})
      .then((rapidProContact) =>
            bot.startConversation(message, (err, convo) => {
              pickConversation(err, convo, rapidProContact);
            }))
      .catch((reason) =>
             http.genericCatchRejectedPromise(
               'Failed to updateRapidProContact in prepareConversation:' +
                 ` ${reason}`));
  } else {
    services.getRapidProContact({urn})
      .then(({results: [rapidProContact]}) =>
            bot.startConversation(message, (err, convo) => {
              pickConversation(err, convo, rapidProContact);
      }))
      .catch((reason) =>
           http.genericCatchRejectedPromise(
             `Failed to getRapidProContact in prepareConversation: ${reason}`));
  }
}

// Listeners
facebookBot.on('facebook_postback', (bot, message) => {
  const {payload} = message;
  if (['get_started'].includes(payload)) {
    createUserAndStartConversation(message, bot);
  } else if (['restart'].includes(payload)) {
    prepareConversation(bot, message);
  } else if (['switch_en', 'switch_in'].includes(payload)) {
    const lang = payload.split('_')[1];
    prepareConversation(bot, message, localeUtils.lookupISO6392(lang));
  }
});

facebookBot.hears(['👋', 'hello', 'halo', 'hi', 'hai'],
               'message_received',
               function(bot, message) {
                 bot.reply(message,
                           generateButtonTemplate(
                             i18next.t(`${language}:generic.helpMessage`),
                             null,
                             [{
                               title: i18next.t(`${language}:generic.yes`),
                               payload: 'restart',
                             }, {
                               title: i18next.t(`${language}:generic.no`),
                               payload: 'quit',
                             }]));
               });

facebookBot.hears(['quit', 'quiet', 'shut up', 'stop', 'end'],
               'message_received',
               function(bot, message) {
                 bot.reply(message,
                           i18next.t(`${language}:generic.quitMessage`));
               });

facebookBot.hears([''], 'message_received', (bot, message) => {});

facebookBot.hears([/([a-z])\w+/gi],
               'message_received',
               function(bot, message) {
                 bot.reply(message, i18next.t(`${language}:generic.idkw`));
               });
