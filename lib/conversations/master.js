const fci = require('./fci.js');
const srq20 = require('./srq.js');
const caregiverKnowledge = require('./caregiver.js');

const fs = require('fs');
const borq = require('borq');
const winston = require('winston');
const setup = require('./setup.js');
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
  srq20(err, convo);
  caregiverKnowledge(err, convo);

  convo.addQuestion(
    generateButtonTemplate('Sofia trial pick a survey',
                           null,
                           [{title: 'FCI',
                             payload: 'fci'},
                            {title: 'Caregiver Knowledge',
                             payload: 'caregiver_knowledge'},
                            {title: 'SRQ 20',
                             payload: 'srq20'}]),
    [{
      pattern: 'fci',
      callback: (res, conv) => {
        idString = getFormId('fci');
        convo.gotoThread('fci intro');
        convo.next();
      },
    }, {
      pattern: 'caregiver_knowledge',
      callback: (res, conv) => {
        idString = getFormId('caregiverKnowledge');
        convo.gotoThread('caregiver knowledge');
        convo.next();
      },
    }, {
      pattern: 'srq20',
      callback: (res, conv) => {
        idString = getFormId('srq20');
        convo.gotoThread('srq 20');
        convo.next();
      },
    }],
    {key: 'intro'});

  convo.on('end', function(convo) {
    if (convo.status=='completed' || convo.status=='interrupted') {
      if (convo.status=='completed') {
        services.genAndPostSubmissionToOna(convo, {name, idString});
        bot.say({text: t(`${language}:generic.outro`),
                 channel: convo.context.user,});
      }
      winston.log('info', `>   [${convo.status}] ...`);
    }
  });

  convo.onTimeout((convo) => {
    services.genAndPostSubmissionToOna(convo, {name, idString});
    bot.say({text: t(`${language}:generic.timeoutMessage`),
             channel: convo.context.user,});
  });
}



module.exports = {
  helpConversation,
  pickConversation,
}
