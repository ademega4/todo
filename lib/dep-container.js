const registry = {};
module.exports = {
  /**
  *@param {String} name the depedency name, serve as key to the depedency
  *@param {function|Object} depedency the depedency object to be saved
  */
  set(name, depedency){
    registry[name] = depedency;
  },
  /**
  *@param {String} name the depedency name to retrive from registry
  *@return {Object} the object
  */
  get(name){
    //if the depedency is cache return immediately
    if(registry[name]){
      return registry[name];
    }//end if
    //finally throw error
    throw new Error(`Cannot find module: ${name}`);
  },//end method get
};//end object
