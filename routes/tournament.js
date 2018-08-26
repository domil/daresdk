var db= require('../db/db');
var express= require('express');
var jwtauth = require('../helpers/jwt-verify')
var crypto = require('crypto');
var convert=require("xml-js");
var js2xmlparser = require("js2xmlparser");
var MatchController = require('./matchController.js');
var leaguejs = require('./league.js')
console.log(leaguejs)

var router = express.Router();



function newbalance(playerId, money,tournamentId){
	//return Promise(function(resolve,reject){
		db.Participant.findOrCreate( { where : {
          PublisherTempEmail: playerId,
          TournamentTournamentId: tournamentId
        }});
		db.Tournament.find({where:{tournamentId:tournamentId}})
		.then(function(tournament){
			var updatedspots = tournament.spotsLeft -1;
			tournament.updateAttributes({spotsLeft:updatedspots})
		});
		db.Balance.find({where:{userEmail:playerId}})
	    .then(function(user){
	      user.updateAttributes({balance:money}); 
	 // resolve();
	//})
	})
}

 function getBalance(playerId){
	 return new Promise(function(resolve,reject){
	db.Balance.find({where:{userEmail:playerId}})
    .then(function(user){
		console.log('user balance is ', user.balance);
     resolve(user.balance);
		})  
    }) 
}

function getFees(tournamentId){
	return new Promise(function(resolve,reject){
	db.Tournament.find({where:{tournamentId:tournamentId}, attributes:['fee']})
    .then(function(tournament){
		if(Date() > tournament.registrationEndDate){
			reject('Registration Time is over');
		} else{
		console.log('feestournament is ', tournament.fee);
        resolve(tournament.fee);  
		}
    }) 
	})
}

//playerId, gameKey, tournamentId,  
router.post('/join',jwtauth,(req,res)=>{
	 var type = req.query.id;
	 if(type[0] == 'l'){
       leaguejs.joinLeague(req,res,type);
	 } else if(type[0] == 't'){
		 joinTournament(req,res,type);
	 }
	 else{
		let output= {status:false,message:"Invalid id"};
		res.send(js2xmlparser.parse("Balance", output));  
	 }
})


function joinTournament(req,res,type){
	var balance; var fee;
	var playerId = req.userData.email;
	var gameKey = req.query.gameKey;
	//var tournamentId = req.query.tournamentId;
	var tournamentId = type;
	console.log('joining league,', tournamentId,playerId)
	//var mykey = crypto.createDecipher('aes-128-cbc', 'mypassword');
	//let mystr = mykey.update(req.query.gameKey, 'hex', 'utf8') + mykey.final('utf8')        
	db.Participant.find({where:{PublisherTempEmail:playerId, TournamentTournamentId:tournamentId}})
	.then(function(participation){
	if(participation){
		let list = {result:"You have already registered." }
		res.send(js2xmlparser.parse("Result", list));

	}else{	
	return Promise.all([
	getBalance(playerId),
	getFees(tournamentId)
	])
	.then(function(balfees){
		balance = balfees[0];
		fee = balfees[1];
		console.log('fees is ', balance, fee);
		if(balance > fee){
		var updatedBalance=balance-fee;
		newbalance(playerId,updatedBalance,tournamentId)
	     let output= {status:true,balance:updatedBalance,message:"You have successfully joined"}
         res.send(js2xmlparser.parse("Balance", output));  
		} else{
			console.log('diff is fee-balance', (fee-balance))
			let output= {status:false,requiredSum:(fee-balance)};
            res.send(js2xmlparser.parse("Balance", output));  
		}
	})
}
})
	.catch(function(error){
		console.log('some error is coming', error);
		let output= {status:false,message:'You are unable to join this tournament'};
        res.send(js2xmlparser.parse("Balance", output));  

	})
}


router.get('/tournaments',jwtauth, (req,res)=>{
	var playerId = req.userData.email;
	db.Participant.findAll({where:{PublisherTempEmail:playerId}})
	.then(function(tournament){
		res.send(tournament);
	})
})

// tournament scores
//router.post('/score',(req,res)=>{
function tournamentScore(req,res){
	var matchId = req.query.matchid;
	var keys = Object.keys(req.body);
	var values = Object.values(req.body);
	console.log('keys = ',keys)
	console.log('req.body = ',req.body);
	db.tournamentMatch.find({where:{id:matchId}})
	.then(function(match){
		if(match.count==0){
			console.log(keys.indexOf(match.PlayerOneEmail),keys.indexOf(match.PlayerTwoEmail));
			if(keys.indexOf(match.PlayerOneEmail) >= 0 && keys.indexOf(match.PlayerTwoEmail) >= 0)
			{
			console.log('hey man getting value',match.PlayerOneEmail, match.PlayerTwoEmail);
			//console.log(keys.indexOf(match.team1Id),keys.indexOf(match.team2Id));
			match.updateAttributes(
				{team1Score: values[keys.indexOf(match.PlayerOneEmail)],
					team2Score:values[keys.indexOf(match.PlayerTwoEmail)],
					count:match.count+1}
			);
			let output= {message:'Scores saved'}
			res.send(js2xmlparser.parse("List", output));	
			}
			else{
				let output= {message:'These players are not playing. You sent some wrong info.'}
			res.send(js2xmlparser.parse("List", output));
			}
				

		} else if(match.count==1){
			console.log(values[keys.indexOf(match.PlayerOneEmail)],values[keys.indexOf(match.PlayerTwoEmail)]);
         if(match.team1Score== values[keys.indexOf(match.PlayerOneEmail)] && match.team2Score==values[keys.indexOf(match.PlayerTwoEmail)]){
		    match.updateAttributes(
				{
					count:match.count+1
					}
			);
			var match = JSON.stringify(match);
		    var match = JSON.parse(match);
	// call update match API to update match winner move the winner to the up stack.
	
	// [
	// matchid	{"id":2},
	// playerOneEmail	{"id":"domil@g.com"},
	// 	1
	//   ]
	
		if(match.team1Score>match.team2Score){
			var callUpdateApi = [{'id':matchId}, {'id':match.PlayerOneEmail}, 1];
			MatchController.updateMatch(callUpdateApi);
			match.winner = match.PlayerOneEmail;
		} else{
			var callUpdateApi = [{'id':matchId}, {'id':match.PlayerTwoEmail}, 1]
			MatchController.updateMatch(callUpdateApi);
			match.winner = match.PlayerTwoEmail;
		}
		console.log('***', match);
	//	db.PastMatch.create(match)
		//.then(function(match){
			let output= {message:'Scores confirmed and saved'}
			res.send(js2xmlparser.parse("List", output));
			console.log('**',match);
			//db.Match.destroy({where:{roomId:matchId}});
		//})
		}
		else{
			let output= {message:"Scores doesnt match"}
			res.send(js2xmlparser.parse("List", output));			
		}

		}else if(match.count >1){
			let output= {message:"Scores already saved and winner progressed to the next round."}
			res.send(js2xmlparser.parse("List", output));		
		}else{
			let output= {message:"You are making wrong API request. Check docs and remove your mistakes."}
			res.send(js2xmlparser.parse("List", output));	
		}

	})

}



exports.router = router;
exports.tournamentScore = tournamentScore;