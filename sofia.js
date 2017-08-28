const borq = require('borq');

const winston = require('winston');
const expressWinston = require('express-winston');

var i18next = require('i18next');
var middleware = require('i18next-express-middleware');
const Backend = require('i18next-node-fs-backend');

const lang = 'en';

const {
  facebook,
  facebookUtils,
  services,
  config,
} = borq;

const {
  goto,
  extractLanguageFromLocale,
  generateYesNoButtonTemplate,
} = facebookUtils;

const sofia = facebook.spawn({});

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


facebook.setupWebserver(config.PORT, (err, webserver) => {
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

  facebook.createWebhookEndpoints(webserver, sofia, () => {
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
  convo.addQuestion(
    generateYesNoButtonTemplate(i18next.t(`${language}:withSomeone`),
                                i18next.t(`${language}:yes`),
                                i18next.t(`${language}:no`),
                                'yes_with_someone',
                                'no_with_someone'),
    [{
      pattern: 'yes_with_someone',
      callback: goto('with whom name'),
    }, {
      pattern: 'no_with_someone',
      callback: goto('skip yes'),
    }],
      {key: 'with_someone'});
}

function pickConversation(err, convo) {
  sofiaECD(err, convo, lang);
}

/* Messenger Karma configs */
//facebook.karma.api.messenger_profile.greeting('I will ask you questions about' +
//                                     ' your daily well-being.');
//facebook.karma.api.messenger_profile.get_started('get_started');
facebook.api.messenger_profile.menu([{
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
facebook.on('facebook_postback', (bot, message) => {
  const {payload} = message;
  if (payload === 'get_started') {
    bot.createConversation(message, pickConversation);
  }  else if (['en', 'in'].includes(payload)) {
    bot.reply(message,  i18next.t(`${payload}:languageChangeText`));
    lang = payload;
    bot.createConversation(message, pickConversation);
  }
});

facebook.hears(['restart', 'restart survey'],
               'message_received',
               function(bot, message) {
                 bot.createConversation(message, pickConversation);
               });

facebook.hears(['👋', 'hello', 'hi', 'tally'],
               'message_received',
               function(bot, message) {
                 bot.reply(message,
                           generateYesNoButtonTemplate(i18next.t(`${lang}:helpMessage`),
                                                       i18next.t(`${lang}:yes`),
                                                       i18next.t(`${lang}:no`),
                                                       'restart',
                                                       'noQuit'));
               });

facebook.hears(['quit', 'quiet', 'shut up', 'stop', 'end'],
               'message_received',
               function(bot, message) {
                 bot.reply(message,
                            generateYesNoButtonTemplate(i18next.t(`${lang}:quitMessage`),
                                                        i18next.t(`${lang}:yes`),
                                                        i18next.t(`${lang}:no`),
                                                        'yesQuit',
                                                        'noQuit'));
               });

facebook.hears([/([a-z])\w+/i],
               'message_received',
               function(bot, message) {
                 bot.reply(message, i18next.t(`${lang}:idk`));
               });
