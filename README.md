# github-telegram
A Github webhook which sends a message to Telegram using AWS Lambda and AWS API Gateway

## Setup
1. Create a Telegram bot

    See: https://core.telegram.org/bots#6-botfather

2. Add the bot to your chat and check the chat id on its getUpdates API

    See: https://core.telegram.org/bots/api#getupdates

3. Create an AWS Lambda function and paste the code from [handler.js](handler.js) into the function, inserting your Telegram configuration

    See: https://console.aws.amazon.com/lambda/home?region=us-east-1#/create/configure-function?bp=https-request

4. Create an API Gateway pointing to your AWS Lambda handler

    See: https://docs.aws.amazon.com/apigateway/latest/developerguide/integrating-api-with-aws-services-lambda.html

5. Go to your Github repository settings and add a webhook pointing to your API resource URL


### (optional) Parse references to Trello cards and add them to the commit message

1. Get your Trello API key and create a token at https://trello.com/app-key.

2. Open your Trello board and copy the id portion of its URL.

3. Edit your AWS Lambda function and paste the code from [handler_plus_trello.js](handler_plus_trello.js) into the function, inserting your Telegram and Trello configurations
