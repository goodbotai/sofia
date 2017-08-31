const borq = require('borq');

const winston = require('winston');
const expressWinston = require('express-winston');

const i18next = require('i18next');
const middleware = require('i18next-express-middleware');
const Backend = require('i18next-node-fs-backend');

const lang = 'en';

const {
  facebookBot,
  facebookUtils,
  services,
  config,
} = borq;

const {
  goto,
  nextConversation,
  generateQuickReply,
  extractLanguageFromLocale,
  generateButtonTemplate,
} = facebookUtils;

const sofia = facebookBot.spawn({});

// To remove
const childName = 'Baby Boo';
/*
const mockChild = {
  momId: 1234,
  childID: 4321,
  childName,
  motherSMSnumber: 254722124323,
};
*/

const availableLanguages = [
  {
    locale: 'en_US',
    name: 'English',
  },
  {
    locale: 'pt_BR',
    name: 'Portuguese',
  },
];

i18next
  .use(middleware.LanguageDetector)
  .use(Backend)
  .init({
    preload: ['en', 'in'],
    ns: availableLanguages.map(({locale}) => extractLanguageFromLocale(locale)),
    debug: config.debugTranslations,
    defaultNS: 'en', // config.defaultLanguage,
    fallbackLng: 'en', // config.defaultLanguage,
    backend: {
      loadPath: 'translations/{{{ns}}}.json',
    },
    interpolation: {
      prefix: '{{{',
      suffix: '}}}',
    },
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

/**
* The FCI conversation
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
*/
function fci(err, convo) {
  const fciQuestionKeys = ['playWithHomemadeToys',
                           'playWithShopToys',
                           'playHouseholdObjects'];
  fciQuestionKeys.map((key) => {
    return convo.addQuestion(
      generateButtonTemplate(i18next.t(`${lang}:FCI.${key}`, {childName}),
                             [i18next.t(`${lang}:generic.yes`),
                              i18next.t(`${lang}:generic.no`),
                              i18next.t(`${lang}:generic.idk`)]),
      nextConversation,
      {},
      'fci');
  });
}

/**
* The SRQ 20 conversation
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
*/
function srq20(err, convo) {
  const srq20QuestionKeys = ['headaches',
                             'appetite',
                             'sleepBadly'];
  srq20QuestionKeys.map((key) => {
    return convo.addQuestion(
      generateButtonTemplate(i18next.t(`${lang}:SRQ20.${key}`),
                             [i18next.t(`${lang}:generic.yes`),
                              i18next.t(`${lang}:generic.no`)]),
      nextConversation,
      {},
      'srq 20');
  });
}

/**
* The Caregiver knowledge conversation meant to test the caregiver's knowledge.
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
*/
function caregiverKnowledge(err, convo) {
  const caregiverKnowledgeQuestionKeys = ['brainDevelopment',
                                          'sight',
                                          'follow'];
  caregiverKnowledgeQuestionKeys.map((key) => {
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
    }]);
  fci(err, convo);
  srq20(err, convo);
  caregiverKnowledge(err, convo);

  convo.on('end',function(convo) {
    if (convo.status=='completed') {
      // send to Ona
    } else if (convo.status=='interrupted') {
      // notify them
      // send to Ona
    }});
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
  const {payload, referral: {ref}} = message;
  if (['restart',
       'get_started'].includes(payload)) {
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

facebookBot.hears(['👋', 'hello', 'hi', 'tally'],
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
