module.exports = (registry)=>{
  const express = require("express");
  //get the app object from express
  const app = express();
  //get join
  const join = require("path").join;
  //body parser
  const bodyParser = require("body-parser");
  //security
  const hemlet = require('helmet')
  //morgan
  const morgan = require('morgan');
  const graphqlHTTP = require("express-graphql");

  const  {graphql, buildSchema} = require('graphql');
  //get logger from cache
  const logger = registry.get("logger");
  const utility = registry.get("utility");

  //set view engine
  app.set("view engine", "ejs");
  //set path to view
  app.set("views", join(__dirname, "views"));
  //set port
  app.set("port", process.env.PORT || 6091);

  app.use(express.static(join(__dirname,'/dist')));
  app.use(bodyParser.json()); // for parsing application/json
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(hemlet());

  app.use(morgan("dev"));

  //end connection for res.end;
  app.get("/favicon.ico",(req, res, next)=>res.end());

  app.use("/api/", graphqlHTTP({
     graphiql:true,
     schema:require("./graphql-model")(registry)
  }));

  app.get("/", (req, res, next)=>{
    res.render("index.ejs");
  });

  //handle not found error
  app.use((req, res, next)=>{
    //call next with error
    next(utility.getError("Not Found", 404));
  });

  //handle error
  app.use((e, req, res, next)=>{
    //log error
    logger.error(e);

  	if(req.xhr){
  		//client does not have authorization to perform an action
  		if(e.status == 401){
  			return res.status(e.status)
        .send({msg:"You do not have the necessary authorization to access this path."});
  		}
  		if(e.status == 404){
  			return res.status(404).send({msg:(e.msg || "Not Found")});
  		}

  		if(e.status && e.msg)
  			return res.status(e.status).end(e.msg);

			//other error display message
			return res.status(500).send({
				msg:"Internal Server Error, We are trying all we can to resolve the error."
			});
  	}//end if
    if(e.status == 404){
      return res.status(404).end(e.msg || "Not Found");
    }
    res.status(500).end((e.msg || "Internal server error, please try again later"));
  });
  return app;
};
