const borq = require('borq');
let fs = require('fs');

const winston = require('winston');
const expressWinston = require('express-winston');

const i18next = require('i18next');
const middleware = require('i18next-express-middleware');
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
  sendMessage,
} = facebookUtils;

const lang = config.defaultLanguage;
const sofia = facebookBot.spawn({});

// To remove
const childName = 'Baby Boo';
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

function getNs (langs) {
  return localeUtils.languages.filter((e) => {
    return langs.includes(e.iso6391);
  });
}

const i18nextOptions = {
  debug: config.debugTranslations,
  ns: getNs(['en', 'in']).map(({iso6391}) => iso6391),   // the function call is repititve
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
    const html = '<h3>This is karma</h3>';
    res.send(html);
  });

  if (config.environment === 'production') {
    webserver.use(services.sentry.errorHandler());
  }
});

const enTranslation = JSON.parse(fs.readFileSync('translations/en.json'));

/**
* The FCI conversation
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
*/
function fci(err, convo) {
  const fciQuestionKeys = Object.keys(enTranslation.FCI);
  fciQuestionKeys.map((key) => {
    if (/intro./.test(key)) {
      convo.addMessage(i18next.t(`${lang}:FCI.${key}`), 'fci');
      return goto('fci');
    } else {
      return convo.addQuestion(
        generateButtonTemplate(i18next.t(`${lang}:FCI.${key}`, {childName}),
                               null,
                               [{title: i18next.t(`${lang}:generic.yes`),
                                 payload: 'yes'},
                                {title: i18next.t(`${lang}:generic.no`),
                                 payload: 'no'},
                                {title: i18next.t(`${lang}:generic.idk`),
                                 payload: 'idk'}]),
        nextConversation,
        {key},
        'fci');
    }
});
}

/**
* The SRQ 20 conversation
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
*/
function srq20(err, convo) {
  const srq20QuestionKeys = Object.keys(enTranslation.SRQ20);
  srq20QuestionKeys.map((key) => {
    if (/intro./.test(key)) {
      convo.addMessage(i18next.t(`${lang}:SRQ20.${key}`), 'srq 20');
      return goto('srq 20');
    } else {
      return convo.addQuestion(
        generateButtonTemplate(i18next.t(`${lang}:SRQ20.${key}`),
                               [i18next.t(`${lang}:generic.yes`),
                                i18next.t(`${lang}:generic.no`)]),
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
      convo.addMessage(i18next.t(`${lang}:caregiverKnowledge.${key}`),
                       'caregiver knowledge');
      return goto('caregiver knowledge');
    } else {
      return convo.addQuestion(
      generateQuickReply(i18next.t(`${lang}:caregiverKnowledge.${key}`),
                         [i18next.t(`${lang}:caregiverKnowledge.birth`),
                          i18next.t(`${lang}:caregiverKnowledge.2`),
                          i18next.t(`${lang}:caregiverKnowledge.4to5`),
                          i18next.t(`${lang}:caregiverKnowledge.7to9`),
                          i18next.t(`${lang}:caregiverKnowledge.9to14`)]),
      nextConversation,
      {},
      'caregiver knowledge');
    }
});
}

/**
* This function will likely be removed and replaced by a scheduler.
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
*/
function pickConversation(err, convo) {
  convo.addQuestion(
    generateButtonTemplate('Pick a survey',
                           ['FCI', 'SRQ 20', 'Caregiver Knowledge']),
    [{
      pattern: 'FCI',
      callback: goto('fci'),
    }, {
      pattern: 'SRQ 20',
      callback: goto('srq 20'),
    }, {
      pattern: 'CAREGIVER KNOWLEDGE',
      callback: goto('caregiver knowledge'),
    }],
    {key: 'survey'});

  fci(err, convo);
  srq20(err, convo);
  caregiverKnowledge(err, convo);

  convo.on('end', function(convo) {
    if (convo.status=='completed' || convo.status=='interrupted') {
      winston.log('info', `>   [${convo.status}] ...`);
      services.genAndPostSubmissionToOna(convo);
    }
});

  convo.onTimeout((convo) => {
    convo.addMessage(i18next.t(`${lang}:generic.timeoutMessage`),
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
  composer_input_disabled: false,
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
          payload: 'en',
        },
        {
          title: 'Bahasa',
          type: 'postback',
          payload: 'in',
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


// Listeners
facebookBot.on('facebook_postback', (bot, message) => {
  const {payload} = message;
  if (['restart',
       'get_started'].includes(payload)) {
    if (message.referral) {
      services.genAndPostRapidproContact(config.rapidproGroups,
                                         lookupISO6392code[lang],
                                         message.user,
                                         {opensrp_id: message.referral.ref});
    }
    bot.startConversation(message, pickConversation);
  } else if (['en', 'in'].includes(payload)) {
    bot.reply(message, i18next.t(`${payload}:languageChangeText`));
    lang = payload;
    bot.startConversation(message, pickConversation);
  }
});

facebookBot.hears(['restart', 'restart survey'],
               'message_received',
               function(bot, message) {
                 bot.startConversation(message, pickConversation);
               });

                 facebookBot.hears(['👋', 'hello', 'halo', 'hi', 'hai', 'tally'],
               'message_received',
               function(bot, message) {
                 bot.reply(message,
                           generateButtonTemplate(
                             i18next.t(`${lang}:generic.helpMessage`),
                             null,
                             [{
                               title: i18next.t(`${lang}:generic.yes`),
                               payload: 'restart',
                             }, {
                               title: i18next.t(`${lang}:generic.no`),
                               payload: 'quit',
                             }]));
               });

facebookBot.hears(['quit', 'quiet', 'shut up', 'stop', 'end'],
               'message_received',
               function(bot, message) {
                 bot.reply(message, i18next.t(`${lang}:generic.quitMessage`));
               });

facebookBot.hears([/([a-z])\w+/gi],
               'message_received',
               function(bot, message) {
                 bot.reply(message, i18next.t(`${lang}:generic.idkw`));
               });
