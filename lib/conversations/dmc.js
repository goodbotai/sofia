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
* @param {string} language An ISO6391 language code string
* @param {object} RapidProContact User RapidPro contact
*/
function dmc (err,
              convo,
              {
                language,
                childName,
                fatherName,
                motherName,
                genderPronoun,
              }) {
  const Dmc3QuestionKeys = Object.keys(enTranslation.DMC3);
  Dmc3QuestionKeys.map(key => {
    if (/^intro*/gi.test(key)) {
      return convo.addMessage(
        {
          text: t(`${language}:DMC3.${key}`, {childName}),
          action: 'dmc'
        },
        'dmc intro');
    } else if (/zzz/gi.test(key)) {
      // do nothing for now
      return null;
    } else {
      return convo.addQuestion(
        generateQuickReply(t(`${language}:DMC3.${key}`),
                               [t(`${language}:choices.yes`),
                                t(`${language}:choices.no`),
                                t(`${language}:choices.tell`),
                                t(`${language}:choices.how`),
                               ]),
        nextConversation,
        {key},
        'dmc3');
    }});
}


module.exports = dmc;
