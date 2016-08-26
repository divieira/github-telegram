'use strict';
let https = require('https');

//TODO
// Fill in your information below.
// See README.md for more details.
const TELEGRAM_CHAT_ID = /* YOUR_TELEGRAM_CHAT_ID */;
const TELEGRAM_BOT_TOKEN = /* YOUR_TELEGRAM_BOT_TOKEN */;
const TRELLO_API_KEY = /* YOUR_TRELLO_API_KEY */;
const TRELLO_API_TOKEN = /* YOUR_TRELLO_API_TOKEN */;
const TRELLO_BOARD_ID = /* YOUR_TRELLO_BOARD_ID */;


// Send an https request
// See https://nodejs.org/api/https.html
function sendRequest(callback, hostname, path, method, data)
{
    // Set the request options
    let options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    // Create and send the request
    let req = https.request(options, (res) => {
        let body = '';
        console.log(method, hostname + path);
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
}


// Send a message via the Telegram bot API
// See https://core.telegram.org/bots/api#making-requests
// and https://core.telegram.org/bots/api#sendmessage
function sendMessage(callback, text) {
    // Set the payload
    let data = {
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
    };

    // Send the HTTP API request
    sendRequest(
        callback,
        'api.telegram.org',
        `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        'POST',
        data
    );
}


// Get card object from the Trello API
// See
// and https://developers.trello.com/advanced-reference/board#get-1-boards-board-id-cards-idcard
function getTrelloCard(card_id, onsuccess, onerror) {
    // If no card id is provides, simply proceed to the callback and return
    if (card_id === null) {
        onsuccess(null);
        return;
    }

    // Send the HTTP API request and proceed with the appropriate callback
    sendRequest(
        function(error, body) { if (error === null) { onsuccess(body); } else { onerror(error, body); } },
        'api.trello.com',
        `/1/boards/${TRELLO_BOARD_ID}/cards/${card_id}?key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`,
        'GET'
    );
}


// Accumulate message lines in an array and send when we receive `_count` lines
// FIXME: Replace `_count` and `_lines` globals with a "deferred"-style object
var _count;
var _lines = [];
function appendToMessage(callback, index, line)
{
    // Set the indexed line in the global array
    _lines[index] = line;

    // Check if all expected lines have been appended
    _count--;
    if (_count === 0)
    {
        // Concatenate lines and send the Telegram message
        let text = _lines.join('\n');
        sendMessage(callback, text);
    }
}

function escapeMarkdown(text)
{
    // Escape special Markdown formatting characters, so we don't receive a
    // "Bad Request: Can't parse message text: Can't find end of the entity "
    // "starting at byte offset ___" error.
    // See https://core.telegram.org/bots/api#markdown-style for characters.
    return text.replace(/[\*_\[\]\(\)`]/g, '\\$&');
}

// AWS Lambda handler entry point
exports.handler = (e, context, callback) => {
    // Receive Github pull event payload, parse commit messages to find Trello
    // card references and send message via the Telegram bot API

    // Since we process Trello API requests asynchronously, accumulate message
    // lines until we have parsed them all
    // FIXME: Replace `_count` global with a "deferred"-style object
    _count = e.commits.length + 1;

    // Add preamble
    appendToMessage(callback, 0,
        `*${escapeMarkdown(e.pusher.name)}* has pushed ` +
        `[${e.commits.length} ${e.commits.length == 1 ? 'commit' : 'commits'}](${e.compare}) ` +
        `to [${escapeMarkdown(e.repository.name)}](${e.repository.url}) ` +
        `on [${e.ref.slice(11)}](${e.repository.url}/commits/${e.ref.slice(11)}):`,
        callback
    );

    // Helper function to parse commit message commit
    function processCommit(i, c)
    {
        // Look for a Trello card id in the #<card_id:int> form
        var re = /#(\d+)/;
        let card_id = re.exec(c.message);
        console.log(card_id);

        // Obtain the Trello card info asynchronously and append line to message
        getTrelloCard(card_id && card_id[1], function (card) {
                // Format commit line with the card info, if found
                appendToMessage(callback, i+1,
                    `• [${c.id.slice(0,6)}](${c.url}) ${escapeMarkdown(c.message.split('\n')[0])}` +
                    `${card !== null ? ` ([${escapeMarkdown(card.name)}](${card.url}))` : '' }`
                );
            }, callback
        );
    }

    // Iterate through each commit in the Github push event payload
    for (let i = 0; i < e.commits.length; i++) {
        processCommit(i, e.commits[i]);
    }
};
