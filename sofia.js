const borq = require('borq');
const setup = require('./setup.js');

const {
  helpConversation,
  createUserAndStartConversation,
  prepareConversation,
} = require('./lib/user.js');

const {
  config,
  facebook,
  services,
  facebookUtils,
  localeUtils,
  translate: t,
} = borq;

const {
  utterances,
} = facebookUtils;

const lang = config.defaultLanguage;
const sofia = facebook.controller.spawn({});
setup(sofia);

facebook.controller.on('facebook_postback', (bot, message) => {
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

facebook.controller.hears(
  utterances.greetings,
  'message_received',
  (bot, message) => {
    services.getUser({urn: `facebook:${message.user}`})
      .then(
      ({results: [{language}]}) => {
        helpConversation(bot, message, localeUtils.lookupISO6391(language));
      })
      .catch((err) => helpConversation(bot, message, lang));
  });

facebook.controller.hears(
  utterances.interrupts,
  'message_received',
  (bot, message) => {
    services.getUser({urn: `facebook:${message.user}`})
    .then(
      ({results: [{language}]}) => {
        bot.reply(message, t(`${language}:utils.quitMessage`));
      })
      .catch((err) => bot.reply(message, t(`${lang}:utils.quitMessage`)));
  }
);

facebook.controller.hears(
  [/\w+/],
  'message_received',
  (bot, message) => {
    services.getUser({urn: `facebook:${message.user}`})
    .then(
      ({results: [{language}]}) => {
        bot.reply(message, t(`${language}:utils.idkw`));
      })
      .catch((err) => bot.reply(message, t(`${lang}:utils.idkw`)));
  }
);
