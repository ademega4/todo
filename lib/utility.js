
module.exports = (registry)=>{
  
  const logger = registry.get("logger");

  const util = {
    /**
    *get error object
    *@param {String} msg the message to be passed to client
    *@param {Number} status the response status
    *@return {Error} return Error object
    */
    getError(msg = "Server Error"){
      const e = new Error(msg);
      e.msg = msg;
      //e.status = status;
      return e;
    },//end getError

    getInternalServerError(){
      return util.getError("internal server error, please try again later");
    },
    
    getID(){
      return (Math.random() * Math.random()).toString(16).replace(".", "");
    },//end method

    logError(e, throwError=true){
      //log error
      logger.error(e);
      //default error to be sent to client
      let newError = util.getInternalServerError();
      //if its a cast error of row _id modify the error message i.e client sent invalid _id
      if(e.name && e.name == "CastError"){
        newError = util.getError("Invalid record _id");
      }//end if
      else if(e.msg){
        newError = e;
      }
      //send custom error so as not to expose the app to hacker
      //if only throwError is true
      if(throwError) return Promise.reject(newError);
    },
  };//end object
  return util;
};//end module
