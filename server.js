// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

var Masto = require('mastodon')

var M = new Masto({
  access_token: process.env.ACCESS_TOKEN,
  timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
  api_url: process.env.API_URL, // optional, defaults to https://mastodon.social/api/v1/
})

var ram = require('random-access-memory')
var memoryStore = function (file) {
  return ram()
}

var LogFeed = require('./log-feed')

var feed = new LogFeed(memoryStore, process.env.FEED_KEY, {
  valueEncoding: 'json',
  secretKey: process.env.FEED_ACCESS_KEY
})

feed.open(function () {
  feed.on('log', function (message) {
    console.log('\nNew Content: ', message.content)
  })
  



  setTimeout(pollForTimeline, 5000)

  function pollForTimeline() {
    console.log('getting timeline')
    M.get('timelines/home', {}).then(resp => {
      resp.data.forEach(function (message) {
        if (!hasBeenRecorded(message)) feed.append(message)
      })
    })
    setTimeout(pollForTimeline, 5000)
  }

  function hasBeenRecorded (message) {
    return feed.log.find(function (item) {
      return item.id === message.id
    })
  }
})


// http://expressjs.com/en/starter/basic-routing.html

app.get("/", function (request, response) {
  response.send(feed);
});
// Here are the original express routes for public/index.html
/*
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});



app.get("/dreams", function (request, response) {
  response.send(dreams);
});

// could also use the POST body instead of query string: http://expressjs.com/en/api.html#req.body
app.post("/dreams", function (request, response) {
  dreams.push(request.query.dream);
  response.sendStatus(200);
});

// Simple in-memory store for now
var dreams = [
  "Find and count some sheep",
  "Climb a really tall mountain",
  "Wash the dishes"
];
*/

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
