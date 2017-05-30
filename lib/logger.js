const winston = require("winston");
//log path
const logpath = require("path").join(__dirname, "../log/logs.log");

module.exports = function(env){
  //get transport
  const transports = [new winston.transports.File({filename: logpath})];
  //log to console for development only
  if(env == "development"){
    transports.push(new winston.transports.Console({colorize: true}));
  }//end if
  //return logger object
  return new winston.Logger({transports: transports});
};
