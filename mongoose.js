// const mongoose= require('mongoose');

//  var env={
// 	accountName: 'cosmongo1',
//   databaseName: 'statedb',
//   key: 'KfmEHgiaanFu6VFmbJSOX6fJyXTOBTtEzJ014088kgZG8digokHSMALftaQ58gxcsTwvMLcQiuXEDVs7My4pIg%3D%3D',
//   port: 10255
// } 
 
// mongoose.Promise = global.Promise;

// const mongoUri = `mongodb://${env.accountName}:${env.key}@${env.accountName}.documents.azure.com:${env.port}/${env.databaseName}?ssl=true`;


// function connect(){
// mongoose.set('debug', true);
// return mongoose.connect(mongoUri);	
// }

// module.exports = {
// connect,
// mongoose
// };



 function async promise1(){
  setTimeout(function(){
      return new promise(function(resolve,reject){
          resolve(5);
      },3000); 
  })    
}

var a= await promise1()
console.log(1);
console.log(a);
console.log(6);
