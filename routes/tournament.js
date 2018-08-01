var db= require('../db/db');
var express= require('express');
var jwtauth = require('../helpers/jwt-verify')
var crypto = require('crypto');
var convert=require("xml-js");
var js2xmlparser = require("js2xmlparser");

var router = express.Router();

//playerId, gameKey, tournamentId,  
router.post('/join',jwtauth,(req,res)=>{
	var balance; var fee;
	var playerId = req.userData.email;
	var gameKey = req.query.gameKey;
	var tournamentId = req.query.tournamentId;
	//var mykey = crypto.createDecipher('aes-128-cbc', 'mypassword');
	//let mystr = mykey.update(req.query.gameKey, 'hex', 'utf8') + mykey.final('utf8')        
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
	.catch(function(error){
		console.log('some error is coming', error);
		let output= {status:false,message:'You are unable to join this tournament'};
        res.send(js2xmlparser.parse("Balance", output));  

	})
})


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
module.exports = router;