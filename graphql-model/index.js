const {GraphQLObjectType, GraphQLSchema} = require("graphql");

module.exports = registry=>{
  //get todo
  const {todoQuery, todoMutation} = require("./todo-model")(registry);

  return new GraphQLSchema({
    query:new GraphQLObjectType({
      name:"Query",
      description:"todo query",
      fields:{
        get_todos:todoQuery.getAllTodo
      }//end fields
    }),

    mutation:new GraphQLObjectType({
      name:"Mutation",
      description:"todo mutation",
      fields:{
        add_todo:todoMutation.addTodo,
        edit_todo:todoMutation.editTodo,
        delete_todo:todoMutation.deleteTodo,
        clear_completed:todoMutation.batchTodoDelete,
        toggle_todos:todoMutation.batchTodoComplete
      }//end fields
    })//end new GraphQLObjectType
  });
}
