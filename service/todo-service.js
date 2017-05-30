/**
 * @param {Object} registry store all our depepency
 * @return {Object} return object back to caller
 */
module.exports = (registry)=>{
    //get todo database from store
    const {todoStore:store} = registry.get("store");

    return{
        addTodo({todo, _id}){
          //check for existence of _id
          if(!_id) throw new Error("please suply _id");

          //am using this to sort the todo based on the date of entry
          //it'll will be added only if we adding a new entry
          if(!todo.timestamp) todo.timestamp = Date.now();
          
          return store.put(_id, todo);
          
        },

        editTodo({todo:newTodo, _id}){
          //check if todo exist, before updating
          return store.get(_id)
          .then(oldTodo=>{
            //if todo does not exist return false
            if(!oldTodo) return false;
            //edit
            oldTodo = oldTodo.value;
            //i need to be notice this false || true
            newTodo.completed = (newTodo.completed === undefined || newTodo.completed === null) 
            ? oldTodo.completed : newTodo.completed;
            newTodo.text = newTodo.text || oldTodo.text;
            newTodo.timestamp = newTodo.timestamp || oldTodo.timestamp;
            newTodo._id = _id;
            //add todo
            return this.addTodo({todo:newTodo, _id});
          });
        },

        deleteTodo({_id}){
          return store.del(_id)
          .then(key=>(key && key || false));
        },

        getAllTodo({keys=false, value=true}={}){
          return store.getAll({keys, value})
          .then(todos=>{
            return todos.sort((a,b)=>{
              if(a.timestamp > b.timestamp) return -1;
              else if(a.timestamp < b.timestamp) return 1;
              return 0;
            });
          });
        },

        batchTodoDelete(_idArray){
          return store.batchTodoDelete(_idArray);
        },

        batchTodoComplete(_idArray, completed){
          return store.batchTodoComplete(_idArray, completed);
        }
    }//end object
};//end anonymous function
