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
        //console.log("Shortened URL: " + shortUrl);
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
  return new Promise(async function(resolve, reject){
    mongoClient.connect(dbConn, async function (err, db) {
      if (err) {
        console.log("Unable to connect to server [getShortUrl]", err);
        reject(new DataBaseConnectionException(err));
      } else {
        console.log("Connected to server [getShortUrl]");
        db.collection("urls").find({"original_url": url}).toArray(async function(err, data){
          if (err) throw new err;
          if(data.length === 0) {
            console.log("No record found for " + url);
            resolve(-1);
          } else {
            //console.log(data[0].short_url);
            resolve(data[0].short_url);  
          }
        });
        db.close();
      }
    })
  })
}

async function findShortUrl(url) {
  return new Promise(async function(resolve, reject){
    mongoClient.connect(dbConn, async function (err, db) {
      if (err) {
        console.log("Unable to connect to server [getShortUrl]", err);
        reject(new DataBaseConnectionException(err));
      } else {
        console.log("Connected to server [getShortUrl]");
        db.collection("urls").find({"short_url": url}).toArray(async function(err, data){
          if (err) throw new err;
          if(data.length === 0) {
            console.log("No record found for " + url);
            resolve(-1);
          } else {
            //console.log(data[0].short_url);
            resolve(data[0].short_url);  
          }
        });
        db.close();
      }
    })
  })
}

async function getUrl(url) {
  return new Promise(async function(resolve, reject){
    mongoClient.connect(dbConn, async function (err, db) {
      if (err) {
        console.log("Unable to connect to server [getUrl]", err);
        reject(new DataBaseConnectionException(err));
      } else {
        console.log("Connected to server [getUrl]");
        db.collection("urls").find({"original_url": url}, {"original_url" : 1}).toArray( async function(err, data){
          if (err) throw new err;
          //console.log(data.length);
          if (data.length === 0) {
            console.log(url + " doesn't exist in the DB...");
            resolve(-1);
          } else {
            //console.log("[getUrl] DATA: " + data[0].original_url);
            resolve(data[0].original_url);   
          }
          db.close();
        })
      }
    })
  })
}
      
async function shortenUrl(oldUrl){
  return new Promise(async function (resolve, reject){
    var shortLink;
    var longUrl = await getUrl(oldUrl);
    console.log("longUrl: " + longUrl);
    if(longUrl !== -1) {
      console.log("URL " + oldUrl + " already in DB...");
      var s =  await getShortUrl(oldUrl);
      console.log("Short URL: " + s);
      resolve(s);
    } else {
      do {
        shortLink = generateShortLink();
        var short =  await  findShortUrl(shortLink);
        //console.log("short: " + short);
      } while (short !== -1);
      var doc = {
          "original_url": oldUrl, 
          "short_url": shortLink
        }
      insertUrl(doc);
      resolve (shortLink);
    }
  });     
}

function generateShortLink(){
  var num = Math.floor(100000 + Math.random() * 900000);
      //console.log("Num: " + num.toString());
  return process.env.BASE_DOMAIN + num.toString();
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
        
function insertUrl(doc){
  return new Promise(function (resolve, reject) {
    console.log("dbConn: " + dbConn);
    mongoClient.connect(dbConn, function (err, db) {
      if (err) {
        console.log("Unable to connect to server", err);
        reject(new DataBaseConnectionException(err));
      } else {
        console.log("Adding doc to DB...");
        var collection = db.collection('urls');
        collection.insert(doc);
        db.close();
      }
    });
  })
};

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
