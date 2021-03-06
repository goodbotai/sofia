const fci = require('./fci.js');
const srq20 = require('./srq.js');
const caregiverKnowledge = require('./caregiver.js');

const fs = require('fs');
const borq = require('borq');
const winston = require('winston');
const setup = require('./../../setup.js');
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
* Get ONA Form ID string given a conversation name
* Lowercase everything and compare
* @param {string} conversationName - The name of the current conversation
* should have a corresponding key in ONA_FORM_IDS env var
* @return {string} - ONA form ID string
*/
function getFormId(conversationName) {
  // to do: move to borq
  const keys = Object.keys(config.onaFormIds);
  const lowercasedFormIds = keys.reduce((acc, key) => {
    const lowercaseKey = key.toLowerCase();
    acc[lowercaseKey] = config.onaFormIds[key].toLowerCase();
    return acc;
  }, {});
  return lowercasedFormIds[conversationName.toLowerCase()];
}

/**
* This function will likely be removed and replaced by a scheduler.
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
* @param {object} contact a rapidpro contact object
*/
function pickConversation(err, convo, {language: lang, name}, bot) {
  const language = localeUtils.lookupISO6391(lang);
  let idString;
  fci(err, convo, language);
  srq20(err, convo, language);
  caregiverKnowledge(err, convo, language);

  convo.addQuestion(generateButtonTemplate('Sofia trial pick a survey',
                                           ['FCI',
                                            'Caregiver Knowledge',
                                            'SRQ 20']),
                    [{
                      pattern: /fci/ig,
                      callback: (res, convo) => {
                        idString = getFormId('fci');
                        convo.gotoThread('fci intro');
                        convo.next();
                      },
                    }, {
                      pattern: /caregiver knowledge/ig,
                      callback: (res, convo) => {
                        idString = getFormId('caregiverKnowledge');
                        convo.gotoThread('caregiver knowledge');
                        convo.next();
                      },
                    }, {
                      pattern: /srq 20/ig,
                      callback: (res, convo) => {
                        idString = getFormId('srq20');
                        convo.gotoThread('srq 20');
                        convo.next();
                      },
                    }, {
                      default: true,
                      callback: (res, convo) => {
                        convo.say(t(`Click on one of the choices`));
                        convo.repeat();
                        convo.next();
                      }
                    }],
                    {key: 'intro'});

  convo.on('end', function(convo) {
    if (convo.status=='completed' || convo.status=='interrupted') {
      if (convo.status=='completed') {
        services.genAndPostSubmissionToOna(convo, {name, idString});
        bot.say({text: t(`${language}:utils.outro`),
                 channel: convo.context.user,});
      }
      winston.log('info', `>   [${convo.status}] ...`);
    }
  });

  convo.onTimeout((convo) => {
    services.genAndPostSubmissionToOna(convo, {name, idString});
    bot.say({text: t(`${language}:utils.timeoutMessage`),
             channel: convo.context.user,});
  });
}



module.exports = {
  pickConversation,
}
