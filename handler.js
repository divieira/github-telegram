'use strict';
let https = require('https');

//TODO
// Fill in your information below.
// See README.md for more details.
const TELEGRAM_CHAT_ID = /* YOUR_TELEGRAM_CHAT_ID */;
const TELEGRAM_BOT_TOKEN = /* YOUR_TELEGRAM_BOT_TOKEN */;


// AWS Lambda handler entry point
exports.handler = (e, context, callback) => {
    // Receive Github pull event payload and send message via the Telegram bot API

    // Send a message via the Telegram bot API
    // See https://core.telegram.org/bots/api#making-requests
    // and https://core.telegram.org/bots/api#sendmessage
    //
    // Add a preamble
    var text =
        `${e.pusher.name}* has pushed` +
        `${e.commits.length} ${e.commits.length == 1 ? 'commit' : 'commits'}`  +
        `to [${e.repository.name}](${e.repository.url}):\n`;

    // Add a line for each commit
    for (let c of e.commits) {
        text += `• [${c.id.slice(0,6)}](${c.url}) ${c.message}\n`;
    }

    // Set the payload
    let data = {
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
    };


    // Send an https request
    // See https://nodejs.org/api/https.html
    //
    // Set the request options
    let options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    };

    // Create and send the request
    let req = https.request(options, (res) => {
        let body = '';
        console.log(options.method, options.hostname + options.path);
        console.log('Status:', res.statusCode);
        //console.log('Headers:', JSON.stringify(res.headers));
        res.setEncoding('utf8');
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log('Successfully processed HTTPS response');
            //console.log('Data:', body);
            //// If we know it's JSON, parse it
            //if (res.headers['content-type'] === 'application/json') {
                body = JSON.parse(body);
            //}
            callback(null, body);
        });
    });
    req.on('error', callback);
    if (data !== undefined) req.write(JSON.stringify(data));
    req.end();
};
