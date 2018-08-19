var db = require('./db.js');
var bluebird = require('bluebird');

var express= require('express');

var tournament1=  {
	gameId:"Mario@domilgarg37@gmail.com",
	tournamentId: "tournament1",
	tournamentName:"Knockout Competitors",
	 payout:"300 200 50",
	status:"Upcoming",
	startTime:"28 August 2018 18:00:00",
	spotsLeft:16,
	fee:40,
	winners:"if any",
	rules:"tournament will be conducted between 6 and 9 pm ",
	registrationEndDate:"22 August 2018 18:00:00"
};

var league1= {
	gameId:"Mario@domilgarg37@gmail.com",
   leagueId: "league1",
   leagueName: "Compete",
   payout: "300 20 10",
   fee:100,
   status:"Upcoming",
   startTime:"24 August 2018 18:00:00",
   spotsLeft:40,
   winners:"if any",
   rules:"Play at your pace but within timelines",
   registrationEndDate:"12 August 2018 18:00:00"
};

//a@b.com
//b@c.com
// var participants  = {
// 	PublisherTempEmail:"domil@g.com",
// 	TournamentTournamentId:"tournament1"
// }


// //db.Participant.create(participants);
// db.Tournament.create(tournament1);
// db.LeagueDetails.create(league1)

// db.tournamentMatch.find({where:{id:"Tb06873c9-464b-4b25-a1d3-f75555b39376"}})
// .then(function(match){
// 	match.updateAttributes({count:0,team1Score:0,team2Score:0})
// })  


db.LeagueDetails.find({fee:200})
.then(function(league){
	league.updateAttributes({registrationEndDate:"1 Jan 2020 12:00:00"})
})


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


