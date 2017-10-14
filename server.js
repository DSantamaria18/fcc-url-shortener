// server.js
// where your node app starts

// init project
var validUrl = require('valid-url');
var express = require('express');
var app = express();

var mongodb = require('mongodb');
var dbUser = process.env.DB_USER;
var dbPass = process.env.DB_PASS;
var dbHost = process.env.DB_HOST;
var dbPort = process.env.DB_PORT;
var dbName = process.env.DB_NAME;

var dbConn = 'mongodb://'+dbUser+':'+dbPass+'@'+dbHost+':'+dbPort+'/'+dbName;
var mongoClient = mongodb.MongoClient;



// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('/new/:url(*)', handleShortenUrl);

function handleShortenUrl(request, response){
  return new Promise( async function(resolve, reject){
    var result;
    var oldUrl = request.params.url;
    console.log("Shortening: " + oldUrl);
    if(!validUrl.isUri(oldUrl)){
      result = {
        "error": "Invalid URL format",
        "input url": oldUrl
      }
      reject(new InvalidURLException(oldUrl));
    } else {
      console.log(oldUrl + " is a valid URI");
      try{
        var shortUrl = await shortenUrl(oldUrl);
        console.log("ShortURL: " + shortUrl);
        var result = {
          "original_url": oldUrl, 
          "short_url": shortUrl 
        }
      } catch (ex) {
        reject(new ShortenException(ex));
      }
    }
    response.send(result);
  })
}

async function getShortUrl(url) {
  return new Promise(function(resolve, reject){
    mongoClient.connect(dbConn, async function (err, db) {
      if (err) {
        console.log("Unable to connect to server", err);
        reject(new DataBaseConnectionException(err));
      } else {
        console.log("Connected to server");
        db.collection('urls').find().toArray((err, data) => {
          if (err) throw new err;
          var shortUrlList = data.map((obj) => {
            return obj.shortUrl;
          });
          return shortUrlList.indexOf(url);
        })   
      }
    })
  })
}

async function getUrl(url) {
  return new Promise(function(resolve, reject){
    mongoClient.connect(dbConn, async function (err, db) {
      if (err) {
        console.log("Unable to connect to server", err);
        reject(new DataBaseConnectionException(err));
      } else {
        console.log("Connected to server");
        db.collection('urls').find().toArray((err, data) => {
          if (err) throw new err;

          var urlList = data.map((obj) => {
            return obj.url;
          });

          var shortUrlList = data.map((obj) => {
            return obj.shortUrl;
          });
        })
      }
    })
  })
}
      
      

async function shortenUrl(oldUrl){
  return new Promise(function (resolve, reject){
    mongoClient.connect(dbConn, async function (err, db) {
      if (err) {
        console.log("Unable to connect to server", err);
        reject(new DataBaseConnectionException(err));
      } else {
        console.log("Connected to server");
        db.collection('urls').find().toArray((err, data) => {
        if (err) throw new err;

        var shortUrlList = data.map((obj) => {
          return obj.shortUrl;
        });
        var shortLink;
        do {
          var num = Math.floor(100000 + Math.random() * 900000);
          //console.log("Num: " + num.toString());
          shortLink = process.env.BASE_DOMAIN + num.toString();
        } //while (getShortUrl(shortLink) != -1);
          /while (shortUrlList.indexOf(shortLink) != -1);
          //console.log("ShortLink: " + shortLink);
          resolve (shortLink);
        });     
      }
    })
  })
}

function DataBaseConnectionException(err) {
  this.type = this.constructor.name;
  this.description = " BD Connection Exception: " + err;
  this.key = err;
}

function ShortenException(ex){
  this.type = this.constructor.name;
  this.description = "Exception Shortening: " + ex;
  this.key = ex;   
}

function InvalidURLException(url) {
  this.type = this.constructor.name;
  this.description = "Invalid URL string for " + url;
  this.key = url;
}
        
function handleShortenUrl2 (req, res) {
  var result;
  var oldUrl = req.params.url;
  console.log("Shortening: " + oldUrl);
  if (validUrl.isUri(oldUrl)){
    insertUrl(oldUrl, res);
  
    result = {
      "original_url": oldUrl, 
      "short_url": "https://fccus.glitch.me/8170" 
    } 
  } else {
    result = {
      "error": "Invalid URL format",
      "input url": oldUrl
    }
  };
  res.send(result);
};

/*
 function insertUrl(url, res, db, callback){
  console.log("dbConn: " + dbConn);
  mongoClient.connect(dbConn, function (err, db) {
    if (err) {
      console.log("Unable to connect to server", err);
    } else {
      console.log("Connected to server");
      var collection = db.collection('urls');
      var short = shortenUrl(oldUrl);
      console.log("Short: " + short);
      var doc = { 
        url: url,
        shortUrl: short
      };
      collection.insert(doc);
      db.close();
    };
  });
};
*/

 function save(err, url, newLink, res, db) {
    if (err) throw err;

    // Create new object
    var urlObj = {
      "original_url": url,
      "short_url": newLink
    };

    // Save object into db.
    var sites = db.collection('sites');
    sites.save(urlObj, function(err, result) {
      if (err) throw err;

      // Send response object
      // We need to create the object again because
      // urlObj now contains database id
      res.send({
        "original_url": url,
        "short_url": newLink
      });
      console.log('Saved ' + result);
    });
  }




// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
