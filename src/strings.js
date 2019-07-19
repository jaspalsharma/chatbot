const config = require('./config')
const oLogger = require('./logger')
const i18n = require('./i18n')
const fs = require('fs')

if(! fs.existsSync(config.LOCALES_DIR + "/" + config.LOCALES[0] + ".json")) {
  oLogger.log("error", "Locale files not found in dir " + config.LOCALES_DIR);
}

i18n.configure({
  locales: config.LOCALES,
  directory: config.LOCALES_DIR,
  register: global,
  // watch for changes in json files to reload locale on updates
  autoReload: true,
  // whether to write new locale information to disk
  updateFiles: false,
});

function get(obj) {
  var a;
  var args = [];
  for(var i = 0; i < arguments.length; i++){
    args.push(arguments[i]);
  }

  a = __.apply(this, args);

  return a[0];
}

function getAll(obj) {
  var args = [];
  for(var i = 0; i < arguments.length; i++){
    args.push(arguments[i]);
  }

  return __.apply(this, args);
}

function getRandom(obj) {
  var a;
  var args = [];
  for(var i = 0; i < arguments.length; i++){
    args.push(arguments[i]);
  }

  a = __.apply(this, args);

  return a[Math.floor(Math.random() * a.length)]
}

module.exports = {
  get,
  getAll,
  getRandom,
  __
}
