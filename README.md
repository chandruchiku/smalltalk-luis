# Small Talk Module for the Microsoft Bot Framework #

**Update: Now supports the npm Natural package**

Ever had the problem of needing to handle countless types of conversational chatter (e.g. "hello", "good afternoon", "goodbye", "you're terrible", "what's up")? This is an easy to use, plug-n-play small talk module, using QnA maker or the open source Natural npm package. This module is also combinable with LUIS. 

*Note: This is a port over from API.AI/Dialogflow's small talk module. It uses the same intents and scripted replies.*

**How it works:** An excel containing the question and intent matches is uploaded to [QnA maker](https://qnamaker.ai). In the bot, the result from QnA maker is mapped to a list of possible responses (see *smalltalk.js* in the *lib* folder), which are selected at random. 


## Demo ##

![demo](http://i.imgur.com/mxbqRfh.gif)


## Installation and Usage ##

First of all, clone this repo by running the following in the command line:
```bash
git clone https://github.com/alyssaong1/botframework-smalltalk.git
```

Now you have 2 options, either using QnA maker or the Natural package to power your bot's NLP capabilities. 

## Option 1: Using QnA maker

### Configure QnA Maker
Create a QnA maker service for free [here](https://qnamaker.ai).

Click on "Replace knowledge base". Upload the smalltalkkb.tsv file. Publish it as a web service.

![qnasetup](http://i.imgur.com/2ABvOpS.gif)

### Populate the environment variables
Go into the .env file and replace with knowledge base id and subscription key which you can find in the settings page of the QnA maker portal.

![envsetup](http://i.imgur.com/GtzQZ9s.gif)

### Running the sample

Build using `npm install` then run it using `npm start`. You can now test it in the Bot Framework emulator.

### Example: calling the smalltalk module in your bot code 

```js
var QnAClient = require('../lib/client');
...
var qnaClient = new QnAClient({
    knowledgeBaseId: process.env.KB_ID,
    subscriptionKey: process.env.QNA_KEY,
    scoreThreshold: 0.5 // OPTIONAL: Default value is 0.2
});
...
// Post user's question to QnA smalltalk kb
qnaClient.post({ question: session.message.text }, function (err, res) {
    if (err) {
        console.error('Error from callback:', err);
        session.send('Oops - something went wrong.');
        return;
    }

    if (res) {
        // Send reply from QnA back to user
        session.send(res);
    } else {
        // Confidence in top result is not high enough - discard result
        session.send('Hmm, I didn\'t quite understand you there. Care to rephrase?')
    }
});
```

The `scoreThreshold` field is modifiable. It is the confidence level required for the reply to be sent back to the user. A high value means that QnA maker has to be very sure of what the user has said before sending the reply back.

## Option 2: Using the npm Natural package

This is an open source option which you may like to explore. It's got a bit more setup than Option 1, especially if you would like to serve this model on a separate server to your bot. 

Documentation on Natural [here](https://www.npmjs.com/package/natural).

### Train your classification model

First of all, restore our npm packages using the following command:

```
npm install
```

Go into natural/train-model.js. This contains the code to train your classifier using the Node Natural package. To run the code, do the following:

```bash
node natural/train-model.js
```

You should see the following output from running the command:
```bash
Training complete for Small talk classifier.
Small talk classifier saved as smalltalk-classifier.json.
```

You should see a new file under the `natural` folder called `smalltalk-classifier.json`. This contains your trained classifier model, which you will now load into the bot code and use. 

### Use your smalltalk classifier in your bot code

The `bot/index-natural.js` file contains the bot code that uses the Natural classifier you just trained (instead of QnA maker). To run this bot, go into the `app.js` file and modify the following line when initializing the bot:

```js
var bot = require('./bot/index-natural.js');
```

Now run the bot using `npm start`. You can now test it in the Bot Framework emulator.\

### Example: calling the smalltalk Natural classifier in your bot code 

```js
const natural = require('natural');
const smallTalkReplies = require('../lib/smalltalk');

let st_classifier = null;
natural.BayesClassifier.load('natural/smalltalk-classifier.json', null, function(err, classifier) {
   st_classifier = classifier;
});

...

bot.dialog('/', [
    (session, args) => {
        // Post user's question to classifier
        var intent = st_classifier.classify(session.message.text);
        // Obtain the response based on intent
        var botreplylist = smallTalkReplies[intent];
        var botreply = botreplylist[Math.floor(Math.random() * botreplylist.length)];
        // Send response back to user
        session.send(botreply);
    }
]);
```

More details on configuring the Natural classifier [here](https://www.npmjs.com/package/natural#classifiers).

## Extensions ##

### Integrating with your existing LUIS model

We are going to create an intent called "smalltalk" and upload all the smalltalk utterances into this intent through the LUIS API. 

Go to the LUIS portal, create an intent called "smalltalk". 

You will need to update the .env file in the luis folder. Obtain your LUIS app id, subscription key and version from the LUIS portal. Make sure to use the **starter key** for the LUIS subscription key, because the LUIS API requires this specific key.

Then `cd` into the luis folder, and run `node uploadtoluis`. Wait for all the utterances to be uploaded to LUIS (you'll see the batch request success message about ~10 times). You should see on your intents dashboard that there are 1400+ utterances in the smalltalk intent. 

![smalltalk-luis](http://i.imgur.com/tZMQH3H.png)

Retrain and publish your LUIS model - any smalltalk from the user will now be routed to the smalltalk intent, which you can pass to the QnA maker smalltalk module in your code. 

### Adding a new type of smalltalk

Let's say you wanted your smalltalk module to handle when the user wants a joke. Add the following to the smalltalkkb.tsv file:

![addsmalltalk](http://i.imgur.com/Shwnb9e.png)

Replace your knowledge base in QnA maker with the updated one and publish.

Then, add the following to the smalltalk.js file.

```js
[
    ...
    "smalltalk.agent.tell_joke": [
        "Standing in the park, I was wondering why a Frisbee gets larger the closer it gets. Then it hit me.",
        "I needed a password eight characters long so I picked Snow White and the Seven Dwarfs.",
        "The early bird gets the worm but the late worm gets to live."
    ]
]
```

### Improving the smalltalk module

You may find that the current smalltalk module is still not accurate enough. Please note that even the smalltalk module on API.AI is not totally accurate - it will still require additional training and refinement on your part.

You can continue to train the smalltalk module to be more accurate or handle more types of smalltalk by adding or removing utterances in the smalltalkkb.tsv file (then reupload to QnA maker), or directly train it using the QnA maker portal. 

### Modifying the responses

To modify the responses by the smalltalk module, you can go into smalltalk.js to add/remove the responses for the various types of smalltalk. 


## Contributing ##

Feel free to contribute to this project! Use the following guidelines:

1. Fork the repo on GitHub
2. Clone the project to your own machine
3. Commit changes to your own branch
4. Push your work back up to your fork
5. Submit a Pull Request on Github so that I can review your change

## Additional Links ##

- Microsoft's [Project Personality Chat](https://github.com/Microsoft/BotBuilder-PersonalityChat), a .NET SDK for integrating small talk into your bot
- [BestMatchDialog (C#) to handle greetings by Gary Pretty](http://www.garypretty.co.uk/2016/08/01/bestmatchdialog-for-microsoft-bot-framework-now-available-via-nuget/)
- [1000 must have utterances in LUIS by Benjamin Perkins](https://blogs.msdn.microsoft.com/benjaminperkins/2016/12/13/1000-must-have-utterances-for-your-chatbot-using-luis/)

## TO-DOs ##
- Publish npm package for this
