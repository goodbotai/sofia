const borq = require('borq');
const fs = require('fs');
const setup = require('./setup.js');
const winston = require('winston');
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
  generateButtonTemplate,
  generateQuickReply,
} = facebookUtils;
const t = translate;
/**
* The english translations
* @global
* @const {object}
*/
const enTranslation = JSON.parse(fs.readFileSync('translations/en.json'));

/**
* The SRQ 20 conversation
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
*/
function srq20(err, convo, language) {
  const srq20QuestionKeys = Object.keys(enTranslation.SRQ20);
  srq20QuestionKeys.map((key) => {
    if (/^intro*/gi.test(key)) {
      convo.addMessage(t(`${language}:SRQ20.${key}`), 'srq 20');
      return goto('srq 20');
    } else {
      return convo.addQuestion(
        generateButtonTemplate(t(`${language}:SRQ20.${key}`),
                               [t(`${language}:choices.yes`),
                                t(`${language}:choices.no`)]),
        nextConversation,
        {key},
        'srq 20');
    }
});
}

module.exports = srq20;
