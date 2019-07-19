// Load configuration
const config = require('./config')
// Load logging
const oLogger = require('./logger')
// Load main bot module
const bot = require('./bot')
// Load i18n features to internationalize strings
const strings = require('./strings')

// Load modules
const express = require('express')
const basicAuth = require('express-basic-auth')
const helmet = require('helmet')
const agent = require('superagent')
const bodyParser = require('body-parser')

process.on('uncaughtException', (err) => {
  console.log("ERROR", err);
});

// Function defintions
/* Array contains function */
Array.prototype.contains = function(element){
    return this.indexOf(element) > -1;
}

/* Edit distance for fuzzy matching */
String.prototype.editDistance = function(string) {
    var a = this.toLowerCase(), b = (string + "").toLowerCase(), m = [], i, j, min = Math.min;

    if (!(a && b)) return (b || a).length;

    for (i = 0; i <= b.length; m[i] = [i++]);
    for (j = 0; j <= a.length; m[0][j] = j++);

    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            m[i][j] = b.charAt(i - 1) == a.charAt(j - 1)
                ? m[i - 1][j - 1]
                : m[i][j] = min(
                    m[i - 1][j - 1] + 1,
                    min(m[i][j - 1] + 1, m[i - 1 ][j] + 1))
        }
    }

    return m[b.length][a.length];
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

// Start Express server
const app = express();
app.set('port', process.env.PORT || 5000);
app.use(bodyParser.json());
app.use(helmet());

// ask question and forward it to recast.ai
app.use('/userinput', basicAuth({ users: config.CHAT_TECHNICAL_USER }), (req, res) => {
  bot.reply(req, res).then(success => {
    res.status(200).send(success);
  }).catch(error => {
    oLogger.log("error", "Error in the bot backend: " + JSON.stringify(error));
    if (!res.headersSent) { res.sendStatus(error.status) }
  });
});

app.post('/give-feedback', basicAuth({ users: config.ADMIN_USER }), (req, res) => {
  var oMemory = req.body.conversation.memory;
  var sLang = req.body.conversation.language;

  //TODO: log feedback to database
  oLogger.log("info", "FEEDBACK: " + oMemory.feedback);

  res.send({
    conversation: {
      memory: oMemory
    }
  });
});

app.listen(app.get('port'), () => {
  oLogger.log("info", 'Our bot is running on port ' + app.get('port'))
});
