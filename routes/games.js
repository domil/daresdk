var db= require('../db/db');
var express= require('express');
var jwtauth = require('../helpers/jwt-verify')
var crypto = require('crypto');
var convert=require("xml-js");
var js2xmlparser = require("js2xmlparser");

var router = express.Router();
var options = {compact: true, ignoreComment: true, spaces: 4};
router.get('/gameKey',jwtauth,(req,res) => {
	var userEmail = req.userData.email;
	var gameKey= req.query.key;
	db.GamesDetails.find({ where:{gameKey:gameKey}})
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
			db.Tournament.findAll({attributes:{exclude:['createdAt','updatedAt']},where:{gameId:mystr}}),
			db.LeagueDetails.findAll({attributes:{exclude:['createdAt','updatedAt']},where:{gameId:mystr}}),
			db.Participant.findAll({attributes:['TournamentTournamentId'],where:{publisherTempEmail:userEmail}}),
			db.LeagueScore.findAll({attributes:['leagueLeagueId'], where:{userEmail:userEmail}})
			])
			.then(function(results){
				if(!results){
					var output= {Authentication:false, message:"No registered leagues or tournaments of this game"};
					//res.send(convert.js2xml(output, options))
				res.send(js2xmlparser.parse("List", output));
				}
			var ids = results[2];
			ids = JSON.stringify(ids);
			ids = JSON.parse(ids);
			ids = ids.map(function(id){
				return id.TournamentTournamentId;
			})	
			console.log('ids*********',ids);
			console.log('**********************');
			var tournaments=results[0];
			tournaments=JSON.stringify(tournaments);
			tournaments=JSON.parse(tournaments);
			console.log('********', tournaments);
			var joinedt = [];
			var njoinedt = [];
			var tournamentss = tournaments.map(function(tournament){
				if(ids.includes(tournament.tournamentId)){
					tournament.joined = true;
					tournament.type = "knockout"
					joinedt.push(tournament);
					return tournament;
				} else{
					tournament.joined = false;
					tournament.type = "knockout";
					njoinedt.push(tournament);
					return tournament;
				}
			})
			
			var idss = results[3];
			idss = JSON.stringify(idss);
			idss = JSON.parse(idss);
			idss = idss.map(function(id){
				return id.leagueLeagueId;
			})	
			var joinedl = [];
			var njoinedl = [];
			var leagues=results[1];
			leagues=JSON.stringify(leagues);
			leagues=JSON.parse(leagues);
			
			var leaguess = leagues.map(function(league){
				if(idss.includes(league.leagueId)){
					league.joined = true;
					joinedl.push(league);
					return league;
				} else{
					league.joined = false;
					njoinedl.push(league);
					return league;
				}
			})
			
			//var c= {Tournament:tournaments};
			console.log(tournamentss);
			console.log('**********************');
			
			//var c= {Tournament:tournaments};
			console.log(leagues);
			
			var jsdata= {joinedtournaments:joinedt, notjoinedtournaments:njoinedt, joinedleagues:joinedl, notjoinedleagues:njoinedl };
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
 db.PlayerGame.findAll({ attributes: ['country'],include:[{model:db.PublisherTemp,as:'user',attributes:['username','email']}],where:{gameID: mystr}})
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

// dare Scores

//router.post('/score', (req,res)=>{
  
function dareScore(req,res){
	var matchId = req.query.matchid;
	var keys = Object.keys(req.body);
	var values = Object.values(req.body);
	console.log('keys = ',keys)
	console.log('req.body = ',req.body);
	db.Match.find({where:{roomId:matchId}})
	.then(function(match){
		if(match) console.log('truetrue');
		if(match.count==0){
			console.log(keys.indexOf(match.team1Id),keys.indexOf(match.team2Id));
			if(keys.indexOf(match.team1Id) >= 0 && keys.indexOf(match.team2Id) >= 0)
			{
			console.log('hey man getting value',match.team1Id, match.team2Id);
			console.log(keys.indexOf(match.team1Id),keys.indexOf(match.team2Id));
			match.updateAttributes(
				{
					team1Score: values[keys.indexOf(match.team1Id)],
					team2Score:values[keys.indexOf(match.team2Id)],
					count:match.count+1}
			);
			let output= {message:'Scores saved'}
			res.send(js2xmlparser.parse("List", output));	
			}
			else{
				let output= {message:'These players are not playing'}
			res.send(js2xmlparser.parse("List", output));
			}
				
				
		} else if(match.count==1){
		//if(match.team1Score==team1Score && match.team2Score==team2Score){
		console.log(values[keys.indexOf(match.team1Id)],values[keys.indexOf(match.team2Id)]);
         if(match.team1Score== values[keys.indexOf(match.team1Id)] && match.team2Score==values[keys.indexOf(match.team2Id)]){
		    match.updateAttributes(
				{
					count:match.count+1
					}
			);
			var match = JSON.stringify(match);
		    var match = JSON.parse(match);
		      
		if(match.team1Score>match.team2Score){
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
		else{
			let output= {message:"Scores already saved"}
			res.send(js2xmlparser.parse("List", output));	
		}	
	})
	.catch(function(err){
		console.log('error is', err);
		let output= {message:"Something went wrong. Try again."}
			res.send(js2xmlparser.parse("List", output));			
	
	})
	
}

exports.router=router;
exports.dareScore = dareScore;