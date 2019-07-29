require('dotenv-extended').load();

const StreamArray = require('stream-json/streamers/StreamArray');
const path = require('path');
const fs = require('fs');

var rp = require('request-promise');

const jsonStream = StreamArray.withParser();

var appId = process.env.LUIS_APP_ID;
var subKey = process.env.LUIS_KEY;
var version = process.env.LUIS_VERSION;

var lables = [];
//You'll get json objects here
//Key is an array-index here
jsonStream.on('data', async({key, value}) =>  {
    console.log("Key", key);
    //console.log(value);

    //var intent = JSON.parse(value);
    var keys = Object.keys(value);
    var intentName = keys[0];
    var intentUtternaces = value[intentName]; 
    var batchlabels = [];
    console.log(intentName);

    var label = {};
    // change this to the intent name for smalltalk in your luis model

    intentUtternaces.forEach(function(utterance) {
        
        label.text = utterance;
        label.intentName = intentName; 
        batchlabels.push(label);
        label = {};
    });

    console.log(batchlabels);
    lables.push(batchlabels);
    
});

var waitForSecond = function() {
    console.log("Waiting for 2 seconds");
    return new Promise(resolve => {
      setTimeout(function() {
        resolve("done");
      }, 2000);
    });
};

jsonStream.on('end', async() => {
    console.log('Reading done');

    for(var lable of lables) {
        await uploadToLuis(lable);
    }
});

const filename = path.join(__dirname, 'intents3.json');
fs.createReadStream(filename).pipe(jsonStream.input);


function uploadToLuis(labels) {
    return new Promise(function(resolve, reject)
    {
        var options = {
            method: 'POST',
            uri: 'https://westus.api.cognitive.microsoft.com/luis/api/v2.0/apps/' + appId + '/versions/' + version + '/examples',
            json: true,
            body: labels,
            headers: {
                "Ocp-Apim-Subscription-Key": subKey,
                "Content-Type": "application/json"
            }
        };
        rp(options)
            .then(function (body) {
                // POST succeeded
                console.log('Batch post successful.');
                resolve('done');
            })
            .catch(function (err) {
                // POST failed
                console.log('Web request failed: ' + err);
                reject('fail');
            });
    });
    
}