const DB_DIR = require("path").join(__dirname, "../db");
//use to store todo items
const db = require("level-sublevel")(require("level")(DB_DIR, {valueEncoding:"json"}));

const subleveldbBase = sublevelDb=>({
  sublevelDb,
  /**
  *@param {String} key
  *@param {Mixed} val
  *@return {Promise}
  */
  put(key, value){
    return new Promise((resolve, reject)=>{
      //if error occur reject with error else resolve
      this.sublevelDb.put(key, value, (e)=>(e && reject(e) || resolve({key, value})));
    });
  },

  /**
  *@param {String} key
  *@return {Promise} val
  */
  get(key){
    return new Promise((resolve, reject)=>{
      this.sublevelDb.get(key, (e, value)=>{
        //if error occur
        if(e){
          //if error is NotFoundError just resolve to false;
          //
          //e.type == "NotFoundError" can also be used
          if(e.notFound) return resolve(false);
          //else reject with error
          return reject(e);
        }//end if
        resolve({value, key});//resolve the value fetch from store
      });//end callback
    });//end promise
  },

  /**
  *@param {String} key
  *@return {Promise}
  */
  del(key){
    return new Promise((resolve, reject)=>{
      this.sublevelDb.del(key, (e)=>{
        if(e){
          if(e.notFound) return resolve(false);
          else return reject(e);
        }
        resolve(key);
      });//end delete
    });//end promise
  },//end delete

  /**
  *@param {String} key
  *@return {Promise}
  */
  exist(key){
    return this.get(key)
    .then(v=>(v && Promise.resolve(true) || Promise.resolve(false)));
  },//end exist

  /**
   * @return {Promsie} return promise to caller
   */
  getAll({keys, value}){
    //return promise
    return new Promise((resolve, reject)=>{
      //store all output
      const output = [];
      //read all todo item(s) from level db
      this.sublevelDb.createReadStream({keys, value})
      .on("data", function(data){
        //push data to array
        output.push(data);
      })//end on data
      .on("close", function(){
        //resolve with array
        resolve(output);
      })//end on close
      .once("error", function(e){
        console.log(e.stack);
        //if error occur reject
        reject(e);
      });//end on error
    });//end promise
  },//end get all

  batchTodoDelete(_idArray){
    return new Promise((resolve, reject)=>{
      //loop thru id array to ensure all no null or undefined in the array
      //to prevent error
      const batch = [];
      let key = null;
      for(let i = 0; i < _idArray.length; i++){
        //get _id as key
        key = _idArray[i];
        if(typeof(key) === "string"){
          batch.push({type:"del", key});
        }//end if
        //the operation was not successful
        else return resolve(false);
      }//end for loop
      this.sublevelDb.batch(batch, (e)=>{
        if(e) return reject(e);
        resolve(_idArray);
      });
    });//end promise
  },//end method

  /**
   * @param {Array} _idArray
   * @param {Boolean} completed
   */
  batchTodoComplete(_idArray, completed=true){
    //store db for later use
    const db = this.sublevelDb;
    return new Promise((resolve, reject)=>{
      //store key
      let key = null;
      //store the batch operation to be performed
      const batchTask = [];
      //todos
      const todos = [];
      //keep track of the number of time our callback is called
      let c = 0;
      //callback to given to task
      const callback = (e, todo)=>{
        //if error return
        if(e){
          //if not just skip and continue but for other error
          //reject
          if(!e.NotFoundError) return reject(e);
        }else{
          //set completed to true
          todo.completed = completed;
          //push to array
          batchTask.push({type:"put", key:todo._id, value:todo});
          //save todos it'll be sent back to client later
          todos.push(todo);
        }//end else
        //if batch array length is equal to that of  _idArray
        //then perform batch put
        if(++c == _idArray.length){
          //save
          db.batch(batchTask, (e)=>{
            //if error occur reject
            if(e) return reject(e);
            //resolve with the array
            resolve(todos);
          });//end batch
        }//end if
      };//end callback

      //loop thru _id array to ensure that
      //there is no null in the array
      for(let i = 0; i < _idArray.length; i++){
        key = _idArray[i];
        //if _id is string
        if(typeof (key) === "string"){
          task(db, key, callback);
        }//end if
      }//end for loop
    });//end Promise
  }//end batch todo complete
});//end

//I needed to perform a lot of get from db
const task = (db, key, callback)=>db.get(key, callback);

module.exports = (registry)=>{
  const logger = registry.get("logger");
  /**
   * Todo store
   */
  const todoStore = subleveldbBase(db.sublevel("todo"));

  return {
    //store db object
    todoStore,
    close(){
      return new Promise((resolve, reject)=>{
        db.close((e)=>{
          if(e) return reject(e);
          resolve();
        });//end close
      });//end promise
    },//end close
  };//end the return object
};//end function
