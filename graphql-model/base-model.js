const {
  GraphQLString,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID
} = require("graphql");

exports.MessageType = new GraphQLObjectType({
  name:"MessageType",
  description:"use to pass message to client",
  fields:{
    msg:{
      type:new GraphQLNonNull(GraphQLString),
      description:"message being sent to client"
    }
  }//end fields
});

exports.DeleteType = new GraphQLObjectType({
  name:"DeleteType",
  description:"return the _id of the deleted record",
  fields:{
    _id:{
      type:new GraphQLNonNull(GraphQLID),
      description:"The _id of the deleted record"
    }//end _id field
  }//end fields
});//end DeleteType

/**
*
*/
exports.Delete = class{
  /**
  *@param {String} _id id of the deleted object
  */
  constructor(_id){
    this._id = _id;
  }//end constructor
};//nd constructor

/**
*/
exports.Message = class{
  /**
  *@param {String} msg message to be sent back to client
  */
  constructor(msg){
    this.msg = msg;
  }//end constructor
}//end message class
