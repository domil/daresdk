var db = require('./db.js');
var bluebird = require('bluebird');

var express= require('express');

var tournament1=  {
	gameId:"Mario@domilgarg37@gmail.com",
	tournamentId: "tournament1",
	tournamentName:"Spirit Of India",
	 payout:"300 200 50",
	status:"Inprogress",
	startTime:"23 Jun 2018 18:00:00",
	spotsLeft:20,
	fee:40,
	winners:"if any",
	rules:"tournament will be conducted between 6 and 9 pm ",
	registrationEndDate:"12 Jun 2018 18:00:00"
};

var league1= {
	gameId:"Mario@domilgarg37@gmail.com",
   leagueId: "league2",
   leagueName: "YOYO",
   payout: "300 20 10",
   fee:200,
   status:"Upcoming",
   startTime:"24 Jun 2018 18:00:00",
   spotsLeft:40,
   winners:"if any",
   rules:"Play at your pace but within timelines",
   registrationEndDate:"12 Jun 2018 18:00:00"
};

//a@b.com
//b@c.com
var participants  = {
	PublisherTempEmail:"domil@g.com",
	TournamentTournamentId:"tournament1"
}


db.Participant.create(participants);
//db.Tournament.create(tournament1)
// return Promise.all([
// 	db.Tournament.create(tournament1),
// 	db.LeagueDetails.create(league1)
// ])
// .then(function(results){
// 	console.log("added ***********");
// 	console.log(results);
// 	 return db.TournamentDetails.find({where:{
// 		tournamentId:"tournament1"
// 	}})
// })
// .then(function(tournament){
// 	console.log('****************');
// 	console.log(tournament);
// })

// db.Dare.findAll({where:{fromEmail:"a@b.c"}})
// .then(function(result){
// 	console.log(result);
// })