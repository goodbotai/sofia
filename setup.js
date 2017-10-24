const borq = require('borq');
const facebook = borq.facebook;

function setup (bot) {
  facebook.start(bot, (err, webserver) => {
  webserver.get('/', (req, res) => {
    res.send('<h3>Sofia is a bot for ECD</h3>');
  });
});


facebook.setGreeting( 'Sofia is here to help with your ECD needs.');
facebook.setGetStarted('get_started');
facebook.setMenu([{
  locale: 'default',
  composer_input_disabled: false,
  call_to_actions: [
    {
      title: 'Help',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Restart survery',
          type: 'postback',
          payload: 'restart',
        },
      ],
    },
    {title: 'Change language',
      type: 'nested',
      call_to_actions: [
        {
          title: 'English',
          type: 'postback',
          payload: 'switch_en',
        },
        {
          title: 'Bahasa',
          type: 'postback',
          payload: 'switch_in',
        },
      ],
    },
    {
      type: 'web_url',
      title: 'FAQ',
      url: 'https://sofia.goodbot.ai/',
      webview_height_ratio: 'full',
    },
  ],
}, {
  locale: 'id_ID',
  composer_input_disabled: false,
  call_to_actions: [
    {
      title: 'Membantu',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Mengulang kembali',
          type: 'postback',
          payload: 'restart',
        },
      ],
    },
    {title: 'Ganti bahasa',
      type: 'nested',
      call_to_actions: [
        {
          title: 'Inggris',
          type: 'postback',
          payload: 'switch_en',
        },
        {
          title: 'Bahasa',
          type: 'postback',
          payload: 'switch_in',
        },
      ],
    },
    {
      type: 'web_url',
      title: 'FAQ',
      url: 'https://sofia.goodbot.ai/',
      webview_height_ratio: 'full',
    },
  ],
},
]);
}

module.exports = setup;
