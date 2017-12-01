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


// To remove
const childName = 'your child';
const motherName = 'mom';
const fatherName = 'dad';
const genderPronoun = 'she';

/**
* The FCI conversation
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
* @param {string} language An ISO6391 language code string
*/
function fci(err, convo, language) {
  const fciQuestionKeys = Object.keys(enTranslation.FCI);
  fciQuestionKeys.map((key) => {
    if (/^intro*/gi.test(key)) {
      return convo.addMessage({text: t(`${language}:FCI.${key}`, {childName}),
                               action: 'fci'},
                              'fci intro');
    } else if (/^transition*/gi.test(key)) {
      return convo.addMessage({text: t(`${language}:FCI.${key}`, {childName}),
                               action: 'fci activities'},
                              'fci');
    } else if (/count$/gi.test(key)) {
      return convo.addQuestion(t(`${language}:FCI.${key}`),
                               nextConversation,
                               {key},
                               'fci');
    } else if (['read',
                'narrate',
                'sing',
                'outing',
                'play',
                'nameCountOrDraw'].includes(key)) {
      return convo.addQuestion(
        generateButtonTemplate(
          t(`${language}:FCI.${key}`,
            {childName, genderPronoun, motherName, fatherName}),
          null,
          [{title: t(`${language}:choices.yes`),
            payload: 'yes'},
           {title: t(`${language}:choices.no`),
            payload: 'no'},
           {title: t(`${language}:choices.idk`),
            payload: 'idk'}]),
        [{
          pattern: 'yes',
          callback: goto('fci optional'),
        }, {
          default: true,
          callback: nextConversation,
        }],
        {key},
        'fci activities');
    } else if (/optional$/gi.test(key)) {
      return convo.addQuestion(
        generateButtonTemplate(
          t(`${language}:FCI.${key}`,
            {childName, genderPronoun, motherName, fatherName}),
          null,
          [{title: t(`${language}:choices.yes`),
            payload: 'yes'},
           {title: t(`${language}:choices.no`),
            payload: 'no'},
           {title: t(`${language}:choices.idk`),
            payload: 'idk'}]),
          /^caregiver*/gi.test(key) ?
          (res, conv) => {
            conv.gotoThread('fci activities');
            conv.next();
          }
        : nextConversation,
        {key: key.replace(/optional$/gi, '')},
        'fci optional');
    } else {
      return convo.addQuestion(
        generateButtonTemplate(
          t(`${language}:FCI.${key}`,
            {childName, genderPronoun, motherName, fatherName}),
          null,
          [{title: t(`${language}:choices.yes`),
            payload: 'yes'},
           {title: t(`${language}:choices.no`),
            payload: 'no'},
           {title: t(`${language}:choices.idk`),
            payload: 'idk'}]),
        nextConversation,
        {key},
        'fci');
    }
});
}

module.exports = fci;
