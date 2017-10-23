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

const language = config.defaultLanguage;
const sofia = facebook.controller.spawn({});
setup(sofia);

/**
* The english translations
* @global
* @const {object}
*/
const enTranslation = JSON.parse(fs.readFileSync('translations/en.json'));

// To remove
const childName = 'your child';
const genderPronoun = 'she';
/*
const mockChild = {
  momId: 1234,
  childID: 4321,
  gender: female,
  childName,
  motherSMSnumber: 254722124323,
};
*/

/**
* The SRQ 20 conversation
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
*/
function srq20(err, convo) {
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

/**
* The Caregiver knowledge conversation meant to test the caregiver's knowledge.
* @param {string} err an error. Should be null unless there's an error.
* @param {object} convo a conversation object
*/
function caregiverKnowledge(err, convo) {
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
                         [t(`${language}:choices.birth`),
                          t(`${language}:choices.2`),
                          t(`${language}:choices.4to5`),
                          t(`${language}:choices.7to9`),
                          t(`${language}:choices.9to14`)]),
      nextConversation,
      {key},
      'caregiver knowledge');
    }
});
}

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
      convo.addMessage(
        t(`${language}:FCI.${key}`, {childName, genderPronoun}), 'fci');
      return goto('fci');
    } else {
      return convo.addQuestion(
        generateButtonTemplate(
          t(`${language}:FCI.${key}`, {childName, genderPronoun}),
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
function pickConversation(err, convo, {language: lang, name}) {
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
        convo.gotoThread('fci');
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
    }], {
      key: 'intro',
    });

  convo.on('end', function(convo) {
    if (convo.status=='completed' || convo.status=='interrupted') {
      if (convo.status=='completed') {
        facebookUtils.sendMessage(sofia, convo.context.user, (err, convo) => {
          convo.say(t(`${language}:generic.outro`));
        });
        services.genAndPostSubmissionToOna(convo, {name, idString});
      }
      winston.log('info', `>   [${convo.status}] ...`);
    }
  });

  convo.onTimeout((convo) => {
    facebookUtils.sendMessage(sofia, convo.context.user, (err, convo) => {
      convo.say(t(`${language}:generic.timeoutMessage`));
    });
    services.genAndPostSubmissionToOna(convo, {name, idString});
    winston.log('info', '>   [TIMEOUT] ...');
  });
}


/**
* Get the region for a specific timezone
* @param {Integer} timezone The timezone of the user runs from 0 to 12
* @return {String} the region that the user is in
*/
function regionByTimeZone(timezone) {
  if (timezone > 3) {
    return 'ind';
  } else {
    return 'default';
  }
}

/**
* First try locale, if it fails try timezone, if that fails use default
* @param {String} locale of the user from FB
* @param {String} timezone of the user from FB
* @return {String} language as a ISO6392 string
*/
function pickLanguage({locale, timezone}) {
  if (locale) {
    const lang = localeUtils.extractLanguageFromLocale(locale);
    return localeUtils.lookupISO6392(lang) || config.defaultLanguage;
  } else {
    const region = regionByTimeZone(timezone);
    const lang = 'default' ? config.defaultLanguage : region;
    return localeUtils.lookupISO6392(lang);
  }
}

/**
* Create a karma user and start a conversation with them
* @param {object} message a message object also created by the controller
* @param {object} bot a bot instance created by the controller
*/
function createUserAndStartConversation(message, bot) {
  const extraArgs = message.referral ? {opensrp_id: message.referral.ref} : {};
  services.getFacebookProfile(message.user)
    .then((profile) => {
      services.createUser(message.user,
                          Object.values(config.rapidproGroups),
                          pickLanguage(profile),
                          profile,
                          extraArgs)
        .then((rapidProContact) =>
              bot.startConversation(message, (err, convo) => {
                pickConversation(err, convo, rapidProContact);
              }))
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
    services.updateRapidProContact({urn}, {language})
      .then((rapidProContact) =>
            bot.startConversation(message, (err, convo) => {
              pickConversation(err, convo, rapidProContact);
            }))
      .catch((reason) =>
             http.genericCatchRejectedPromise(
               'Failed to updateRapidProContact in prepareConversation:' +
                 ` ${reason}`));
  } else {
    services.getRapidProContact({urn})
      .then(({results: [rapidProContact]}) =>
            bot.startConversation(message, (err, convo) => {
              pickConversation(err, convo, rapidProContact);
      }))
      .catch((reason) =>
           http.genericCatchRejectedPromise(
             `Failed to getRapidProContact in prepareConversation: ${reason}`));
  }
}

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

facebook.controller.hears(['👋', 'hello', 'halo', 'hi', 'hai'],
               'message_received',
               function(bot, message) {
                 bot.reply(message,
                           generateButtonTemplate(
                             t(`${language}:generic.helpMessage`),
                             null,
                             [{
                               title: t(`${language}:generic.yes`),
                               payload: 'restart',
                             }, {
                               title: t(`${language}:generic.no`),
                               payload: 'quit',
                             }]));
               });

facebook.controller.hears(['quit', 'quiet', 'shut up', 'stop', 'end'],
               'message_received',
               function(bot, message) {
                 bot.reply(message,
                           t(`${language}:generic.quitMessage`));
               });

facebook.controller.hears([''], 'message_received', (bot, message) => {});

facebook.controller.hears([/([a-z])\w+/gi],
               'message_received',
               function(bot, message) {
                 bot.reply(message, t(`${language}:generic.idkw`));
               });
