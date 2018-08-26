var db= require('../db/db');
var express= require('express');
var jwtauth = require('../helpers/jwt-verify')
var crypto = require('crypto');
var convert=require("xml-js");
var js2xmlparser = require("js2xmlparser");
var uuid = require('uuid/v4');

var router = express.Router();

//router.get('/register',jwtauth,(req,res)=>{
function joinLeague(req,res,type){
	var registrationTime = new Date();
	var user = req.userData.email;
	//var leagueId = req.query.leagueId;
	var leagueId = type;
	console.log('joining league,', leagueId,user)
	db.LeagueScore.find({where:{userEmail:user, leagueLeagueId:leagueId}})
	.then(function(joined){
		if(joined){
			let list = {result:"You have already registered." }
            res.send(js2xmlparser.parse("Result", list));
		}
		else{
			db.LeagueDetails.find({where:{leagueId:leagueId}})
			.then(function(league){
				if(registrationTime < league.registrationEndDate){
					db.Balance.find({where:{userEmail:user}})
					.then(function(userBalance){
						if(userBalance && userBalance.balance >= league.fee){
							var updatedBalance =  userBalance.balance-league.fee;
							userBalance.updateAttributes({balance:updatedBalance})
							roomId= "L"+ uuid();
							db.LeagueScore.create({roomId:roomId,userEmail:user, leagueLeagueId:leagueId});
							let output= {status:true,balance:updatedBalance,message:'You have successfully joined the league.'}
							res.send(js2xmlparser.parse("List", output));
						} else{
							let list = {result:"Insufficient balance", requiredSum:`${userBalance.balance - league.fee}`,link:"add money by clicking on this link" }
							res.send(js2xmlparser.parse("Result", list));
						}
					})
				} else{
					let list = {result:"Sorry to inform you that registration time is over." }
					res.send(js2xmlparser.parse("Result", list));
				}
			})
			.catch(function(error){
				console.log(error);
				let list = {message:"Something went wrong. Try after sometime" }
				res.send(js2xmlparser.parse("Result", list));
			})
}})
}

router.post('/play',jwtauth,(req,res)=>{
	var presentTime = new Date(req.body.playTime);
	var user = req.userData.email;
	var leagueId = req.query.leagueId;
	db.LeagueScore.find({where:{userEmail:user, leagueLeagueId:leagueId}})
	.then(function(league){
		if(!league){
			let list = {message:"You have not joined this league. First join then play." }
			res.send(js2xmlparser.parse("Result", list));
		} else{
			db.LeagueDetails.find({where:{leagueId:leagueId}})
			.then(function(leaguedetail){
				if(presentTime > leaguedetail.registrationEndDate){
				 console.log('presenttime = ',presentTime,leaguedetail.registrationEndDate)
					let list = {message:"Sorry time lapsed." }
					res.send(js2xmlparser.parse("Result", list));
				}
				else{
					var roomId = league.roomId;
					let list1 = {status:true, roomId:roomId};
					res.send(js2xmlparser.parse("Result", list1));  
				}

			})

		}})
	
})

//router.post('/score',jwtauth,(req,res)=>{
function leagueScore(req,res){
	var matchId = req.query.matchid;
 	var presenTime = new Date();
	var user = req.userData.email;
	var leagueId = req.query.leagueId;
	//var score = req.body.score;
	var score = Object.values(req.body)[0];
	var scoreTime = req.body.scoreTime;
	db.LeagueScore.find({where:{userEmail:user, roomId:matchId}})
	.then(function(league){
		if(!league){
			let list = {message:"You have not joined this league. First join then play." }
			res.send(js2xmlparser.parse("Result", list));
		} else{
			var count = league.count;
			if(count === 0){
				let maxScore = Math.max(score,0)
				league.updateAttributes({count:count+1, Score1:score,Score1Time:scoreTime, maxScore:maxScore,maxScoreTime:scoreTime});
				let list = {lastTime:true,message:`Your first attempt score is ${score}. 2 Attempts left` }
				res.send(js2xmlparser.parse("Result", list));
			} else if(count === 1){ 
				let maxScoreTime;
				let maxScore = Math.max(league.Score1,score)
				if(maxScore == score){ maxScoreTime = scoreTime }
				else{ maxScoreTime = league.Score1Time}
				league.updateAttributes({count:count+1, Score2:score, Score2Time:scoreTime,maxScore:maxScore,maxScoreTime:maxScoreTime});
				let list = {lastTime:true,message:`Your second attempt score is ${score}. 1 Attempt left` }
				res.send(js2xmlparser.parse("Result", list));
			} else if(count === 2){
				let maxScoreTime;
				let maxScore = Math.max(league.Score1,league.Score2,score)
				if(maxScore == score){ maxScoreTime = scoreTime }
				else if(maxScore == league.Score2){maxScoreTime = league.Score2Time}
				else{ maxScoreTime = league.Score1Time}
				league.updateAttributes({count:count+1, Score3:score,Score3Time:scoreTime, maxScore:maxScore,maxScoreTime:maxScoreTime});
				let list = {lastTime:true,message:`Your third attempt score is ${score}` }
				res.send(js2xmlparser.parse("Result", list));
			} else{
				let list = {status:false,message:"You have played maximum permissible times." }
				res.send(js2xmlparser.parse("Result", list));
			}
		}
	})
}



router.get('/leaderboard',jwtauth, (req,res)=>{
	var leagueId = req.query.leagueId;
	db.LeagueScore.findAll({where:{leagueLeagueId:leagueId},limit:10000,order:[[db.orm.col('maxScore'),'DESC'],['maxScoreTime']],attributes:["maxScore","maxScoreTime"],include:[{model:db.PublisherTemp,as:'user',attributes:['username','email']}]})
	.then(function(league){
		if(!league){
			let list = {status:false,message:"No league registered with this name." }
			res.send(js2xmlparser.parse("Result", list));
		} else{
			let league1 = JSON.stringify(league);
			league1 = JSON.parse(league1)
			let list = {status:true,scores:league1 }
			res.send(js2xmlparser.parse("Result", list));
		}
	})
})

// router('/payout/leagues',(req,res)=>{
// 	var leagueId = req.query.leagueId;
// 	var participants;
// 	db.LeagueDetails.find({where:{leagueId:leagueId}})
// 	.then(function(ll){
// 		participants = ll.totalParticipants;
// 	})
// 	db.LeagueScore.findAll({where:{leagueLeagueId:leagueId},limit:10000,order:[[db.orm.col('maxScore'),'DESC'],['maxScoreTime']],attributes:["maxScore","maxScoreTime"],include:[{model:db.PublisherTemp,as:'user',attributes:['username','email']}]})
// 	.then(function(league){
// 		if(league){
// 			if(participants == 10000){
// 				league[0] = 2500;
// 				league[1] = 1500;
// 				league[2] = 1000;
// 			}else if(participants == 20000){

// 			}else if(participants == 5000){

// 			}
// 		}
// 	})
// })

exports.joinLeague = joinLeague;
exports.router = router;
exports.leagueScore = leagueScore;