const {returnMessageWrapper} = require("../helpers/returnmessagewrapper");


const setToHashMap = async(client, key, type, data) => {
  const value = type + " " + data.toString();
  return await client.set(key, value, (err, reply) => {
    if(err){
      console.log("Error during setting to redis: " , err);
      return returnMessageWrapper(false, null, err);
    }
    else{
      return returnMessageWrapper(true, null, null);
    }
  });
}

const returnFromHashMap = async(client, key) => {
  return await client.get(key, (err, retrievedValue) => {
    if(err){
      console.log("Error retrieving value to redis: ", err);
      return returnMessageWrapper(false, null, err);
    }
    else{
      
      return returnMessageWrapper(true, retrievedValue, null);
    }
  })
}

const deleteFromHashMap = async(client, key) => {
  return await client.del(key, (err, reply) => {
    if(err){
      console.log("Error deleting key to redis: ", err);
      return returnMessageWrapper(false, null, err);
    }
    else if(reply === 1){
      console.log("Error key doesn't exist to redis");
      return returnMessageWrapper(false, null, "Key Doesn't exist");
    }
    else{
      return returnMessageWrapper(true, null, null);
    }
  })
}

module.exports = {setToHashMap, returnFromHashMap, deleteFromHashMap};