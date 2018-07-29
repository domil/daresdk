var db= require('../db/db');
var express= require('express');
var jwtauth = require('../helpers/jwt-verify')
var router = express.Router();

router.get('/',(req,res)=>{
	var gameId= req.query.gameId;
	var newstream={
		gameId:gameId,
		streamURL:"rtmp://139.59.93.253/live/1231",
		chatRoom:"12345",
		thumbnail:"//sdlalsf;f;kk",
		followers:"2718",
		views:"2345",
		types:"vod or live"	
	}
	var newstream2={
		gameId:gameId,
		streamURL:"rtmp://139.59.93.253/live/1231",
		chatRoom:"12345",
		thumbnail:"//sdlalsf;f;kk",
		followers:"2718",
		views:"2345",
		types:"vod or live"	
	}
	if(req.query.gameId == "b861670f-204d-4cc7-9d5b-71fe238836c4"){
	res.send({status:true, result:[newstream,newstream2]});
	} else{
		res.json({status:false,result:"No streams found"});
	}
})


module.exports = router