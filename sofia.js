const borq = require('borq');

const winston = require('winston');
const expressWinston = require('express-winston');

var i18next = require('i18next');
var middleware = require('i18next-express-middleware');
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
  extractLanguageFromLocale,
  generateButtonTemplate,
} = facebookUtils;

const sofia = facebookBot.spawn({});

// To remove
const childName = "Baby Boo";
const mockChild = {
  momId: 1234,
  childID: 4321,
  childName,
  motherSMSnumber: 254722124323
};

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
    defaultNS: 'en', //config.defaultLanguage,
    fallbackLng: 'en', // config.defaultLanguage,
    backend: {
      loadPath: 'translations/{{{ns}}}.json',
    },
    interpolation: {
      prefix: '{{{',
      suffix: '}}}',
    }
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

  facebookBot.createWebhookEndpoints(webserver, sofia, () => {
  });

  webserver.get('/', (req, res) => {
    const html = '<h3>This is karma</h3>';
    res.send(html);
  });

  webserver.post('/trigger', (req, res) => {
    // sendGreeting(req.body);
    const response = res;
    response.statusCode = 200;
    response.send();
  });

  if (config.environment === 'production') {
    webserver.use(services.sentry.errorHandler());
  }
});


function sofiaECD(err, convo, language) {
}

function fci(err, convo, language) {
}

function srq20(err, convo, language) {
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.headaches`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.appetite`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.sleepBadly`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.easilyFrightened`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.handsShake`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.feelNervous`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.poorDigestion`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.clearThought`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.feelHappy`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.cry`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.difficultyEnjoying`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.difficultyDecisions`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.workSuffering`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.useful`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.lostInterest`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.feelWorthless`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
    convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.suicidal`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.feelWorthless`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
    convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.alwaysTired`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
  convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.easilyTired`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
    convo.addQuestion(generateButtonTemplate(i18next.t(`${lang}:SRQ20.stomachDiscomfort`),
                                           i18next.t(`${lang}:generic.yes`),
                                           i18next.t(`${lang}:generic.no`)),
                    nextConversation);
}

function caregiverKnowledge(err, convo, language) {
}

function pickConversation(err, convo) {
  srq20(err, convo, lang);
}

/* Messenger Karma configs */
//facebookBot.karma.api.messenger_profile.greeting('I will ask you questions about' +
//                                     ' your daily well-being.');
//facebookBot.karma.api.messenger_profile.get_started('get_started');
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
       'get_started',
       'fYes'].includes(payload)) {
    console.log("wut");
    bot.createConversation(message, pickConversation);
  }  else if (['en', 'in'].includes(payload)) {
    bot.reply(message,  i18next.t(`${payload}:languageChangeText`));
    lang = payload;
    bot.createConversation(message, pickConversation);
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
                           generateButtonTemplate(i18next.t(`${lang}:generic.helpMessage`),
                                                  i18next.t(`${lang}:generic.yes`),
                                                  i18next.t(`${lang}:generic.no`)));
               });

facebookBot.hears(['quit', 'quiet', 'shut up', 'stop', 'end'],
               'message_received',
               function(bot, message) {
                 bot.reply(message,
                           generateButtonTemplate(i18next.t(`${lang}:generic.quitMessage`),
                                                  i18next.t(`${lang}:generic.yes`),
                                                  i18next.t(`${lang}:generic.no`)));
               });

facebookBot.hears([/([a-z])\w+/i],
               'message_received',
               function(bot, message) {
                 bot.reply(message, i18next.t(`${lang}:generic.idkw`));
               });
