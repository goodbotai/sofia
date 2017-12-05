const borq = require('borq');
const fs = require('fs');
const {
  facebookUtils,
  facebook,
  services,
  config,
  http,
  translate: t,
  localeUtils,
} = borq;
const {
  nextConversation,
  goto,
  generateButtonTemplate,
  generateQuickReply,
} = facebookUtils;

const enTranslation = JSON.parse(fs.readFileSync('translations/en.json'));

/**
* The DMC 3 conversation
* @param {string} err an error. Should be null unless there's an error
* @param {object} convo a conversation object
* @param {object} RapidProContact User RapidPro contact
*/
function psed (err,
              convo,
              {
                language,
                childName,
                fatherName,
                motherName,
                genderPronoun,
              }) {
const psedQuestionKeys = Object.keys(enTranslation.PSED);
psedQuestionKeys.map((key) => {
  if (/^intro*/gi.test(key)) {
    convo.addMessage(t(`${language}:PSED.${key}`),'psed');
    return goto('psed');
  } else {
    return convo.addQuestion(
      generateButtonTemplate(t(`${language}:PSED.${key}`, {childName}),
                                null,
                                [{title: t(`${language}:PSED.${key}0`, {childName}),payload:"0"},
                                {title: t(`${language}:PSED.${key}1`, {childName}),payload:"1"},
                                {title: t(`${language}:PSED.${key}2`, {childName}),payload:"2"}]),
      nextConversation,
      {key},
      'psed'
  )}
});
}

module.exports = psed;
