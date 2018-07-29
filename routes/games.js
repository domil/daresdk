var db= require('../db/db');
var express= require('express');
var jwtauth = require('../helpers/jwt-verify')
var crypto = require('crypto');
var convert=require("xml-js");
var js2xmlparser = require("js2xmlparser");

var router = express.Router();
var options = {compact: true, ignoreComment: true, spaces: 4};
router.get('/gameKey',(req,res) => {
	var gameKey= req.query.key;
	db.GamesDetails.find({where:{gameKey:gameKey}})
	.then(function(game){
		if(!game){
			//res.json({text:"invalid"})
			let output= {text:"invalid"};
			res.send(js2xmlparser.parse("List", output));
		}
		else{
			var mykey = crypto.createDecipher('aes-128-cbc', 'mypassword');
			var mystr = mykey.update(gameKey, 'hex', 'utf8') + mykey.final('utf8')
			return Promise.all([
			db.Tournament.findAll({where:{gameId:mystr}}),
			db.LeagueDetails.findAll({where:{gameId:mystr}})
			])
			.then(function(results){
				if(!results){
					var output= {Authentication:false, message:"No registered leagues or tournaments of this game"};
					//res.send(convert.js2xml(output, options))
				res.send(js2xmlparser.parse("List", output));
				}
				
			console.log('**********************');
			var tournaments=results[0];
			tournaments=JSON.stringify(tournaments);
			tournaments=JSON.parse(tournaments);
			//var c= {Tournament:tournaments};
			console.log(tournaments);
			console.log('**********************');
			var leagues=results[1];
			leagues=JSON.stringify(leagues);
			leagues=JSON.parse(leagues);
			//var c= {Tournament:tournaments};
			console.log(leagues);
			
			var jsdata= {tournaments:tournaments, leagues:leagues};
			console.log(convert.js2xml(jsdata, options));
			//res.send(convert.js2xml(jsdata, options)) 
			res.send(js2xmlparser.parse("List", jsdata));
			})
			.catch(function(error){
				console.log(error);
				let output= {message:"Something went wrong."}
				res.send(js2xmlparser.parse("List", output));
				//res.send(error);
			})
		}
	})
})


router.get('/getplayers',(req,res)=>{
  var gameKey = req.query.gameKey;
  var mykey = crypto.createDecipher('aes-128-cbc', 'mypassword');
  var mystr = mykey.update(gameKey, 'hex', 'utf8') + mykey.final('utf8')
 db.PlayerGame.findAll({ attributes: ['playerId', 'country'],where:{gameID: mystr}})
 .then(function(players){
    console.log('**********************');
			var players=JSON.stringify(players);
			players=JSON.parse(players);
			let list= {players:players};
			res.send(js2xmlparser.parse("List", list));
 })
 .catch(function(error){
   console.log(error);
   res.send('Some error');
 })
})


router.post('/registerGame',jwtauth,function(req,res){
var gameId = req.body.gameName + "@" + req.userData.email;
var mykey = crypto.createCipher('aes-128-cbc', 'mypassword');
var mystr = mykey.update(gameId, 'utf8', 'hex')+ mykey.final('hex');

var newGame={
gameId:gameId,	
publisherId: req.userData.email, 
gameName:req.body.gameName,
orientation:req.body.orientation,
playersAllowed:req.body.playersAllowed,
genre:req.body.genre,
gameIcon:req.body.gameIcon,
live:req.body.live,
creationTime:req.body.creationTime,
gameKey:mystr
};


db.GamesDetails.create(newGame)
.then(function(game){
	console.log(game);
	res.status(200).json({text:"Game Registered", gameKey:mystr});
})
.catch(function(error){
	res.send(error);
	console.log(error)
})

})

router.get('/',(req,res)=>{
	db.GamesDetails.findAll({where:{publisherId: req.query.id}})
	.then(function(games){
		res.json(games);
		})
    .catch(function(error){
		console.log(error);
		res.send("Something went wrong");
	})
})

// var score = {
// 	matcheId:1,
// 	Team1score:21,
// 	Team2score:20,
// 	team1playerscores:{player1:21,player2:10},
// 	team2playerscores:{player1:21,player2:10},
// }
router.post('/score', (req,res)=>{
    var matchId = req.query.matchid;
	var team1Score = req.body.p1Score;
	var team2Score = req.body.p2Score;
	db.Match.find({where:{roomId:matchId}})
	.then(function(match){
		if(match.count==0){
			match.updateAttributes(
				{team1Score:team1Score,
					team2Score:team2Score,
					count:match.count+1}
			);
			let output= {message:'Scores saved'}
			res.send(js2xmlparser.parse("List", output));		
		} else{
		if(match.team1Score==team1Score && match.team2Score==team2Score){
            match.updateAttributes(
				{
					count:match.count+1}
			);
			var match = JSON.stringify(match);
		    var match = JSON.parse(match);
		      
		if(team1Score>team2Score){
			match.winner = match.team1Id;
		} else{
			match.winner = match.team2Id;
		}
		console.log('***', match);
		db.PastMatch.create(match)
		.then(function(match){
			let output= {message:'Scores confirmed and saved'}
			res.send(js2xmlparser.parse("List", output));
			console.log('**',match);
			//db.Match.destroy({where:{roomId:matchId}});
		})
		}
		else{
			let output= {message:"Scores doesnt match"}
			res.send(js2xmlparser.parse("List", output));			
		}
		}	
	})
	.catch(function(err){
		let output= {message:"Something went wrong. Try again."}
			res.send(js2xmlparser.parse("List", output));			
	
	})
	
})
module.exports=router