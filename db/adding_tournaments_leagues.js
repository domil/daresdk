var db = require('./db.js');
var bluebird = require('bluebird');
var Sequelize = require('sequelize')
const Op = Sequelize.Op;
var express= require('express');

var tournament1=  {
	gameId:"Mario@domilgarg37@gmail.com",
	tournamentId: "tournament2",
	tournamentName:"Knockout Competitors got it",
	 payout:"300 200 50",
	status:"Upcoming",
	startTime:"28 August 2018 18:00:00",
	spotsLeft:16,
	fee:40,
	winners:"if any",
	rules:"tournament will be conducted between 6 and 9 pm ",
	registrationEndDate:"22 August 2020 18:00:00"
};

var league1= {
	gameId:"Mario@domilgarg37@gmail.com",
	endTime:"31 August 2019 18:00:00",
	totalParticipants:10000,
   leagueId: "league1",
   leagueName: "Beat the Masters",
   payout: "300 20 10",
   fee:40,
   status:"Upcoming",
   startTime:"31 August 2018 18:00:00",
   spotsLeft:100000,
   winners:"if any",
   rules:"Play at your pace but within timelines",
   registrationEndDate:"30 August 2018 18:00:00"
};

var game = {
	gameId:"Endless@domilgarg37@gmail.com",
	publisherId:"domilgarg37@gmail.com",
	gameName:"Endless",
	orientation:"portrait",
	playersAllowed:"5",
	genre:"Action,Thriller",
	gameIcon:"hey amnn",
	live:true,
	creationTime:"25 August 2018 22:02:00",
	gameKey:"033c0382a9e2472b55fcc91162c1b19a4d89c54d58278ebefe3c42d8d1b4cf4c"
}

//db.GamesDetails.create(game);
		// db.LeagueDetails.create(league1);
		// db.Tournament.create(tournament1);
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


// db.LeagueDetails.find({fee:200})
// .then(function(league){
// 	league.updateAttributes({registrationEndDate:"1 Jan 2020 12:00:00"})
// })

var query = 'a';
db.PlayerGame.findAll({attributes: ['country'],include:[{model:db.PublisherTemp,as:'user',attributes:['username','email']}],where:{userEmail:{[Op.like]: query+'%'},gameID: "Mario@domilgarg37@gmail.com"}})
 .then(function(players){
    console.log('**********************');
			var players=JSON.stringify(players);
			players=JSON.parse(players);
			console.log(players);
		 })
 .catch(function(error){
   console.log(error);
   res.send('Some error');
 })

