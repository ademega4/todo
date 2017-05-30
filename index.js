//get gistry into which all depedency will be cache
const registry = require("./lib/dep-container");

//get logger
const logger = require("./lib/logger")((process.env.NODE_ENV || "development").trim());
//save logger in cache
registry.set("logger", logger);

//store
const store = require("./lib/store")(registry);

registry.set("store", store);

//cache in registry
registry.set("utility", (require("./lib/utility"))(registry));

registry.set("todoServ", require("./service/todo-service")(registry));

//start server in the
process.nextTick(()=>{
  require("http").createServer(app).listen(app.get("port"), function(){
    logger.info(`server started on ${this.address().address} and listening on port ${this.address().port}`);
  });
});

process.once("SIGINT", (code)=>{
  //close level db database
  store.close()
  .then(()=>logger.info("level db shutdown successully"))
  .catch(e=>logger.error(e))
  .then(()=>{
    if(code){
      logger.error("Server shutdown due to error");
      return process.exit(1);
    }
    logger.info("Server shutdown");
    process.exit();
  });
});

//get our app
const app = require("./app")(registry);
