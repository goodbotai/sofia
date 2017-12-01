const borq = require('borq');
const fs = require('fs');
const setup = require('./../../setup.js');
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
* The Caregiver knowledge conversation meant to test the caregiver's knowledge.
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
*/
function caregiverKnowledge(err, convo, language) {
  const caregiverKnowledgeQuestionKeys = Object.keys(
    enTranslation.caregiverKnowledge);
  caregiverKnowledgeQuestionKeys.map((key) => {
    if (/^intro*/gi.test(key)) {
      convo.addMessage(t(`${language}:caregiverKnowledge.${key}`),
                       'caregiver knowledge');
      return goto('caregiver knowledge');
    } else {
      return convo.addQuestion(
        generateQuickReply(t(`${language}:caregiverKnowledge.${key}`),
                           (() => {
                             if (['brainDevelopment',
                                  'sight',
                                  'follow',
                                  'vocalize',
                                  'smile',
                                  'speech',
                                  'playWithToys',
                                 'talkToKids'].includes(key)) {
                               return [t(`${language}:choices.birth`),
                                       t(`${language}:choices.2`),
                                       t(`${language}:choices.4to5`),
                                       t(`${language}:choices.7to9`),
                                       t(`${language}:choices.9to14`)];
                             } else if (['reachForToys'].includes(key)) {
                               return [
                                       t(`${language}:choices.4to5`),
                                       t(`${language}:choices.7to9`),
                                       t(`${language}:choices.10to15`),
                                       t(`${language}:choices.15to24`)];
                             } else if (['graspTinyThings',
                                         'walkAlone'].includes(key)) {
                               return [t(`${language}:choices.2to3`),
                                       t(`${language}:choices.4to5`),
                                       t(`${language}:choices.7to9`),
                                       t(`${language}:choices.10to15`),
                                       t(`${language}:choices.15to24`)];
                             } else if (['practiceReaching'].includes(key)) {
                               return [t(`${language}:choices.2`),
                                       t(`${language}:choices.2to4`),
                                       t(`${language}:choices.4to5`),
                                       t(`${language}:choices.7to9`),
                                       t(`${language}:choices.9to14`)];
                             } else if (['teachCounting',
                                         'teachColors',
                                         'eatAlone',
                                         'paperAndCrayons'].includes(key)) {
                               return [t(`${language}:choices.9to12`),
                                       t(`${language}:choices.12to15`),
                                       t(`${language}:choices.15to24`),
                                       t(`${language}:choices.2to3y`),
                                       t(`${language}:choices.4to5y`)];
                             } else if (['sitWithSupport'].includes(key)) {
                               return [t(`${language}:choices.1to2`),
                                       t(`${language}:choices.3to4`),
                                       t(`${language}:choices.5to6`),
                                       t(`${language}:choices.14to15`),
                                       t(`${language}:choices.15to24`)];
                             } else {
                               return [t(`${language}:choices.1to3`),
                                       t(`${language}:choices.4to6`),
                                       t(`${language}:choices.9to10`),
                                       t(`${language}:choices.14to15`),
                                       t(`${language}:choices.15to24`)];
                             }
                           })()
                         ),
      nextConversation,
      {key},
      'caregiver knowledge');
    }
});
}
