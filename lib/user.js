const fs = require('fs');
const borq = require('borq');
const winston = require('winston');
const setup = require('./../setup.js');
const {
  pickConversation,
} = require('./conversations/master.js');
const {
  facebookUtils,
  facebook,
  services,
  config,
  http,
  translate,
  localeUtils,
} = borq;
const {
  nextConversation,
  goto,
  utterances,
  generateButtonTemplate,
  generateYesNoButtonTemplate,
  generateQuickReply,
} = facebookUtils;
const t = translate;

/**
* Create a karma user and start a conversation with them
* @param {object} message a message object also created by the controller
* @param {object} bot a bot instance created by the controller
*/

function createUserAndStartConversation(message, bot) {
  const referrer = message.referral ? {opensrp_id: message.referral.ref} : 'none';
  services.getFacebookProfile(message.user)
    .then((profile) => {
      const {
            first_name: firstName,
            last_name: lastName,
            profile_pic,
            locale,
            timezone,
            gender,
            is_payment_enabled,
          } = profile;
      services.createUser(`${firstName} ${lastName}`,
                          localeUtils.pickLanguage(profile),
                          [`facebook:${message.user}`],
                          Object.values(config.rapidproGroups),
                          {
                            profile_pic,
                            locale,
                            timezone,
                            gender,
                            is_payment_enabled,
                            referrer,
                          })
        .then((rapidProContact) =>{
          console.log(rapidProContact);
          bot.startConversation(message, (err, convo) => {
            pickConversation(err, convo, rapidProContact);
          })
        })
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
    services.updateUser({urn}, {language})
      .then((rapidProContact) =>
            bot.startConversation(message, (err, convo) => {
              pickConversation(err, convo, rapidProContact);
            }))
      .catch((reason) =>
             http.genericCatchRejectedPromise(
               'Failed to updateRapidProContact in prepareConversation:' +
                 ` ${reason}`));
  } else {
    services.getUser({urn:urn})
      .then(({results: [rapidProContact]}) =>
            bot.startConversation(message, (err, convo) => {
              pickConversation(err, convo, rapidProContact);
      }))
      .catch((reason) =>
           http.genericCatchRejectedPromise(
             `Failed to getRapidProContact in prepareConversation: ${reason}`));
  }
}

/**
 * Help conversation
 * @param {object} bot - Bot object from botkit
 * @param {object} message - Conversation message object from botkit
 * @param {string} lang - ISO6391 language code
 * @return {undefined}
 */
function helpConversation(bot, message, lang) {
  bot.startConversation(message, (err, convo) => {
    convo.addQuestion(
      generateButtonTemplate(t(`${lang}:utils.helpMessage`),
                             [t(`${lang}:yes`), t(`${lang}:no`)]
                             ['yes', 'no']),
      [
        {
          pattern: utterances.yes,
          callback: (res, convo) => {
            convo.stop();
            prepareConversation(bot, message);
          },
        }, {
          pattern: utterances.no,
          callback: (res, convo) => {
            convo.stop();
            bot.reply(message, t(`${lang}:utils.quitMessage`));
          },
        }, {
          default: true,
          callback: (res, conv) => {
            conv.say(t(`${lang}:utils.pressYN`));
            conv.repeat();
            conv.next();
          },
        }
      ]);
  });
}

module.exports = {
  createUserAndStartConversation,
  prepareConversation,
  helpConversation,
};
