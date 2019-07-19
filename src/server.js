// Load configuration
const config = require('./config')
// Load logging
const oLogger = require('./logger')
// Load main bot module
const bot = require('./bot')
// Load i18n features to internationalize strings
const strings = require('./strings')
// Load backend integration module handling OData services
const scpUtils = require('./scpUtils')

// Load modules
const express = require('express')
const helmet = require('helmet')
const xsenv = require('@sap/xsenv')
const JWTStrategy = require('@sap/xssec').JWTStrategy
const passport = require('passport')
const bodyParser = require('body-parser')

process.on('uncaughtException', (err) => {
  console.log("ERROR", err);
});

function getUnauthorizedResponse(req){
  return req.auth
        ? ('Credentials ' + req.auth.user + ':' + req.auth.password + ' rejected')
        : 'No credentials provided';
}

// Function defintions
/* Edit distance for fuzzy matching */
String.prototype.editDistance = function(string) {
  var a = this.toLowerCase();
	var b = (string + "").toLowerCase();
	var c = [];
	var min = Math.min;
	var i, j;

  if (!(a && b)) return (b || a).length;

  for (i = 0; i <= b.length; c[i] = [i++]);
  for (j = 0; j <= a.length; c[0][j] = j++);

  for (i = 1; i <= b.length; i++) {
      for (j = 1; j <= a.length; j++) {
          c[i][j] = b.charAt(i - 1) == a.charAt(j - 1) ? c[i - 1][j - 1] : c[i][j] = min(c[i - 1][j - 1] + 1, min(c[i][j - 1] + 1, c[i - 1 ][j] + 1))
      }
  }

  return c[b.length][a.length];
}

/* Array contains function */
Array.prototype.contains = function(element){
  return this.indexOf(element) > -1;
}

/* Array get closest strings by edit distance */
Array.prototype.sortByEditDistance = function(element, key){
	m = [];

	for(var i = 0; i < this.length; ++i){
		this[i].distance = this[i][key].editDistance(element);
	}

	this.sort((a, b) => {
	  if(a.distance < b.distance){
	    return -1;
	  }else{
	    return 1;
	  }
	  return 0;
	});

	return this;
}

var getFormattedDate = (oDate, sLocale) => {
  var sAt;
  if(/.*de.*/.test(sLocale)){
    sAt = " um ";
  }else{
    sAt = " at ";
  }
  return oDate.toLocaleString(sLocale, {weekday: 'long'}) + ", " + oDate.getUTCDate() + ". " + oDate.toLocaleString(sLocale, { month: "long" }) + " " + oDate.getUTCFullYear()
          + sAt + oDate.getHours() + ":" + (oDate.getMinutes() < 10 ? "0": "") + oDate.getMinutes();
}

// Create Express server
const app = express();
app.set('port', process.env.PORT || 5000);
app.use(bodyParser.json());
app.use(helmet());

// Authentication
const services = xsenv.getServices({ uaa: 'amsxsuaa' });
passport.use(new JWTStrategy(services.uaa));
app.use(passport.initialize());
app.use(passport.authenticate('JWT', { session: false }));

// Root route
app.get('/', (req, res) => {
	res.send("This is the API of the AMS chatbot.")
});

app.use('/errors', (req, res) => {
  oLogger.log("error", "Error on recast.ai:")
  oLogger.log("error", req.body)
  res.status(200).send()
});

app.use('/api/userInput', (req, res) => {
  bot.reply(req, res).then(success => {
    res.status(200).send(success);
  }).catch(error => {
    oLogger.log("error", "Error in the bot backend: " + JSON.stringify(error));
    if (!res.headersSent) { res.sendStatus(error.status) }
  });
});

app.use('/api/registerSelectedRoles', (req, res) => {
	bot.registerSelectedRoles(req.body)
		.then(bSuccess => {
			res.status(200).send(bSuccess);
		})
		.catch(error => {
			oLogger.log("error", error);
			res.status(500).send(error);
		})
});


// Start Express server
app.listen(app.get('port'), () => {
  oLogger.log("info", 'The AMS bot application is running on port ' + app.get('port'))
});
