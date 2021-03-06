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

const maxRetries = 3;

/**
* Create a karma user and start a conversation with them
* @param {object} message a message object also created by the controller
* @param {object} bot a bot instance created by the controller
*/

function createUserAndStartConversation(message, bot, retries=0) {
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
                          });

    })
    .then((rapidProContact) => {
      bot.startConversation(message, (err, convo) => {
        pickConversation(err, convo, rapidProContact);
      });
    })
    .catch((reason) => {
      if (retries < maxRetries) {
        prepareConversation(bot, message, undefined, retries+1);
      } else {
        http.genericCatchRejectedPromise(
          `Failed to create user in createUserAndStartConversation:
${reason}`);
      }});
}

/**
* Fetch facebook user profile get the reponent's language and name
* No return statement.
* We use it to start the conversation and get the user profile from Facebook.
* @param {object} bot A bot instance created by the controller
* @param {object} message a message object also created by the controller
* @param {string} language An ISO6392 language code string
*/
function prepareConversation(bot, message, language, retries=0) {
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
      .then(({results: [rapidProContact]}) => {
        bot.startConversation(message, (err, convo) => {
          pickConversation(err, convo, rapidProContact);
        });
      })
      .catch((reason) => {
        if (retries < maxRetries) {
          createUserAndStartConversation(bot, message, retries+1);
        } else {
          http.genericCatchRejectedPromise(
            `Failed to getRapidProContact in prepareConversation:
${reason}`);
        }});
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
                             null,
                             [{
                               title: t(`${lang}:utils.yes`),
                               payload: 'yes',
                              }, {
                                title: t(`${lang}:utils.no`),
                                payload: 'no'
                              }
                             ]),
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
