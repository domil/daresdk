const express= require('express');
const promise= require('bluebird');

require('./mongoose').connect()
.then(function(){
	console.log('connected')
})
.catch(function(err){
	console.log(err);
})

var app = express();







































app.get('/',(req,res)=>{
	res.send('listening');
})


const port= 3000 ;
app.listen(port, () =>{
	console.log('listening');
})
