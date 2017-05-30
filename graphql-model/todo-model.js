const {
  GraphQLInt,
  GraphQLList,
  GraphQLString,
  GraphQLFloat,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLNonNull,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLUnionType
} = require("graphql");

const {Delete, DeleteType, MessageType, Message} = require("./base-model");

const TodoInput = new GraphQLInputObjectType({
  name:"TodoInput",
  description:"todo item",
  fields:{
    text:{
      type:new GraphQLNonNull(GraphQLString),
      description:"todo text or description"
    },//end todo field
    completed:{
      type:new GraphQLNonNull(GraphQLBoolean),
      description:"boolean value to show if todo is completed"
    }//end completed
  }//end fields
});//end TodoInput

const TodoType = new GraphQLObjectType({
  name:"TodoType",
  description:"Todo",
  fields:{
    text:{
      type:new GraphQLNonNull(GraphQLString),
      description:"todo text"
    },//end text fields
    completed:{
      type:new GraphQLNonNull(GraphQLBoolean),
      description:"boolean value to show if todo is completed"
    },//end completed fields
    _id:{
      type:new GraphQLNonNull(GraphQLID),
      description:"todo _id"
    }//end todo _id
  }//end fields
});//end TodoType

const TodoListType = new GraphQLObjectType({
  name:"TodoListType",
  description:"...",
  fields:{
    todos:{
      type:new GraphQLNonNull(new GraphQLList(TodoType)),
      description:"array of todo"
    }//end todoList field
  }//end fields
});//end TodoListType

const TodoIDListType = new GraphQLObjectType({
  name:"TodoIDListType",
  description:"todo ids that was removed in batch from database",
  fields:{
    todoIds:{
      type:new GraphQLList(new GraphQLNonNull(GraphQLID)),
      description:"array of todo ids"
    }//end todoIds
  }//end fields
});

class Todo{
  constructor(todo){
    this.text = todo.text;
    this.completed = todo.completed;
    this._id = todo._id;
  }//end constructor
}//end Todo class

class TodoList{
  constructor(todos){
    this.todos = todos;
  }//end constructor
};//end TodoList

class TodoIDList{
  constructor(todoIds){
    this.todoIds = todoIds;
  }//end constructor
};//end class

const TodoResponseType = new GraphQLObjectType({
  name:"TodoResponseType",
  description:"todo response",
  fields:{
    success:{
      type:new GraphQLNonNull(GraphQLBoolean),
      description:"show if request is successful or not"
    }, //end success field
    payload:{
      type:new GraphQLNonNull(new GraphQLUnionType({
        name:"TodoResponsePayload",
        description:"todo response payload",
        types:[DeleteType, MessageType, TodoType, TodoListType, TodoIDListType],
        resolveType(value){
          if(value instanceof Message) return MessageType;
          if(value instanceof Todo) return TodoType;
          if(value instanceof Delete) return DeleteType;
          if(value instanceof TodoList) return TodoListType;
          if(value instanceof TodoIDList) return TodoIDListType;
        }//end resolve function
      })),//end type
      description:"data to be sent back to client"
    }//end payload
  }//end fields
});//end todo response  type

module.exports = registry=>{
  //get todo service
  const todoServ = registry.get("todoServ");

  //get utility
  const {getID, logError} = registry.get("utility");

  return {
    todoMutation:{
      addTodo:{
        type:TodoResponseType,
        description:"add a new todo",
        args:{
          //todo object to be added
          todo:{
            type:new GraphQLNonNull(TodoInput),
            description:"todo to add"
          }//end todo args
        },//end args
        resolve(_, {todo}, req){
          //get new id
          const _id = getID();
          //add _id to todo
          todo._id = _id;
          //add to db
          return todoServ.addTodo({todo, _id})
          .then(todo=>({success:true, payload:new Todo(todo.value)}))
          .catch(e=>logError(e));
        }//end resolve
      },//end add todo mutation
      editTodo:{
        type:TodoResponseType,
        description:"edit todo",
        args:{
          _id:{
            type:new GraphQLNonNull(GraphQLID),
            description:"The _id of the todo to edit"
          },//end _id arg
          todo:{
            type:new GraphQLNonNull(TodoInput),
            description:"todo to edit"
          }//end todo args
        },//end args

        resolve(_, {_id, todo}){
          //add id to todo
          todo._id = _id;
          return todoServ.editTodo({_id, todo})
          .then(todo=>{
            
            //if todo is false return cannot find todo error
            if(!todo)
              return {success:false, payload:new Message(`Todo with ${_id} cannot be found`)};
            //return success
            return {success:true, payload:new Todo(todo.value)};
          })
          .catch(e=>logError(e));
        }//end resolve
      },//end edit todo
      deleteTodo:{
        type:TodoResponseType,
        description:"remove a todo",
        args:{
          _id:{
            type:new GraphQLNonNull(GraphQLID),
            description:"the _id of the todo to remove"
          }//end _id args
        },//end args
        resolve(_, {_id}, req){
          return todoServ.deleteTodo({_id})
          .then(result=>{
            if(!result) return {success:false, payload:new Message(`Todo with ${_id} cannot be found`)};

            return {success:true, payload:new Delete(_id)};
          })
          .catch(e=>logError(e));
        }//end resolve
      },//end delete todo
      batchTodoComplete:{
        type:TodoResponseType,
        description:"mark all todo as completed",
        args:{
          todoIds:{
            type:new GraphQLNonNull(new GraphQLList(GraphQLID)),
            description:"todo id array to be set as completed",
          },//end todoIds arg
          trueOrFalse:{
            type:new GraphQLNonNull(GraphQLBoolean),
            description:"set all as completed if true else incomplete"
          }
        },//end args
        resolve(_, {todoIds, trueOrFalse}, req){
          return todoServ.batchTodoComplete(todoIds, trueOrFalse)
          .then(todos=>{
            return {success:true, payload:new TodoList(todos)};
          })
          .catch(e=>logError(e));
        }//end resolve
      },//end batchTodoComplete
      batchTodoDelete:{
        type:TodoResponseType,
        description:"delete all completed todo",
        args:{
          todoIds:{
            type:new GraphQLNonNull(new GraphQLList(GraphQLID)),
            description:"todo id array to be deleted",
          }//end todoIds arg
        },//end args
        resolve(_, {todoIds}, req){
          return todoServ.batchTodoDelete(todoIds)
          .then(todoIds=>{
            if(todoIds === false)
              return {success:false, payload:new Message("invalid id sent among the todo Ids")};
            return {success:true, payload:new TodoIDList(todoIds)};
          })
        }//end resolve
      }//end batchTodoComplete
    },//end todo mutation

    todoQuery:{
      getAllTodo:{
        type:TodoResponseType,
        description:"get all todo item from database",
        resolve(_, {}, req){
          return todoServ.getAllTodo()
          .then(todos=>({success:true, payload:new TodoList(todos)}))
          .catch(e=>logError(e))
        }//end resolve
      }//end getAllTodo
    }//end todoQuery
  }//end object
}//end anonymous function
