var db = require('../db/db.js');
var logic = require('../db/logic.js');
//var q= require('q');
var async = require('async');
var uuid = require('uuid/v4');
var js2xmlparser = require("js2xmlparser");

module.exports = {

  
  allMatches: function(req, res, next) {
    console.log('Hey I am running');
    db.tournamentMatch.findAll({
      attributes:{exclude:['createdAt', 'updatedAt',,'PlayerOneEmail','PlayerTwoEmail']},
      include: [
      //db.Tournament, 
      { model: db.PublisherTemp, as: 'Winner',attributes:['username','email'] },
      { model: db.PublisherTemp, as: 'PlayerOne',attributes:['username','email'] },
      { model: db.PublisherTemp, as: 'PlayerTwo' , attributes:['username','email']}
    ],
     where:{TournamentTournamentId:req.query.tournamentId}})
    .then(function(matches){
      var matches = JSON.stringify(matches);
      matches = JSON.parse(matches);

      console.log('2345645678',matches);

      var matches1 = matches.map(function(match){
        match.players = {};
        match.type = 'knockout'
        match.players.PlayerOne = match.PlayerOne ;
        match.players.PlayerTwo = match.PlayerTwo;
        delete match.PlayerOne ;
        delete match.PlayerTwo ;
        return match;
      })
      console.log('matches1*****', matches1);
      
      matches = matches1;

      console.log('mathes134589109384', matches);

      var jsdata= {matches:matches};
			//console.log(convert.js2xml(jsdata, options));
			//res.send(convert.js2xml(jsdata, options)) 
			res.send(js2xmlparser.parse("List", jsdata));
     // res.status(200).send(matches);
    });
  },

  //updateMatch: function(req, res, next) {
   updateMatch: function(parameters){
    // If the tournament is completed
      // you can't do anything anymore
    // otherwise you can update the stuff
   console.log('inside update match will work on it. Go on');
    // var updateMatch = req.body[0];
    // var updateWinner = req.body[1];
    // var matchIndex = req.body[2];
    var updateMatch = parameters[0];
    var updateWinner = parameters[1];
    var matchIndex = parameters[2];


    //var numberRounds = req.body[3];

    //console.log(numberRounds);

    return db.tournamentMatch.find( { where: { id: updateMatch.id } })
    .then(function (match) {
      if(updateWinner.id != match.PlayerOneEmail && updateWinner.id != match.PlayerTwoEmail)
        res.status(403).send("This player was not part of this match");
      else {

      match.WinnerEmail = updateWinner.id;
      match.status = "Completed";
      match.save();

      // if final round
      return db.Tournament.find({where : {tournamentId : match.TournamentTournamentId}})
      .then(function(tournament){

      if ( match.round === tournament.rounds ) {
        // update tournament
        // then you need to update the state of the tournament to COMPLETED
        // and set the tournament winner to the person's name

        console.log("It's the final round");
          tournament.winners = match.WinnerEmail; 
          tournament.status = "Completed";
          tournament.save();
        
          res.status(200).send(tournament);
        
      }
     else {

        //Once the winner is selected, then it needs to go into the parent match
        return db.tournamentMatch.find( { where: { id: match.ParentId } })
        .then(function (nextMatch) {

          console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
          console.log("matchIndex is: ", matchIndex);

          if ( matchIndex % 2 !== 0 ) {
            nextMatch.PlayerOneEmail = match.WinnerEmail;
            nextMatch.save();
          } else {
            nextMatch.PlayerTwoEmail = match.WinnerEmail;
            nextMatch.save();
          }

        })
        .then(function(){
          return db.tournamentMatch.findAll({include: [
          db.Tournament, 
          { model: db.PublisherTemp, as: 'Winner' },
          { model: db.PublisherTemp, as: 'PlayerOne' },
          { model: db.PublisherTemp, as: 'PlayerTwo' }
          ]})
          .then(function(matches){
           // res.status(200).send(matches);
           return ;
          })
          .catch(function(error){
            console.log('Something went wrong', error);
            return ;
          });
        });
        
      }
    })
    }

    });

  },

  createMatch: function (round, parentId, tournamentId) {
    var sessionTime = 10;
    if (round === 0) {
      return;
    }

    return db.Tournament.find( { where: { tournamentId: tournamentId } })
    .then(function (tournament) {
      
      if ( tournament.status === "Inprogress") {
        var roomId = 'T'+uuid();
       var eventDate = tournament.startTime;
       console.log('tournament start date', eventDate)
      // var event = new Date(eventDate); 
      var event = eventDate ;
       var date = event.getDate() + Math.floor(round/3.5);
        var min  = event.getMinutes() + ((round-1)%3)*(sessionTime);
        console.log('min ==', min);
        event.setDate(date);
        event.setMinutes(min);
        console.log('match time ', event);
        return db.tournamentMatch.create( {
          id:roomId,
          TournamentTournamentId: tournamentId,
          round: round,
          status: "Upcoming",
          ParentId: parentId,
          PlayerOneEmail: null,
          PlayerTwoEmail: null,
          WinnerEmail: null,
          startTime:event
        });

      }

    });

  },

  createMatchRecursively: function (round, parentId, tournamentId,teams) {

    var matchArray = [];

    if (round === 0) {
      return;
    }

    // check the tournament id
    return db.Tournament.find( { where: { tournamentId: tournamentId } })
    .then(function (tournament) {
      var sessionTime = 10;
      // add the check for status of 1
      if ( tournament.status === "Inprogress" ) {
        var roomId1 = 'T'+uuid();
        var roomId2 = 'T'+uuid();
         var eventDate = tournament.startTime;
        var event = new Date(eventDate); 
       var date = event.getDate() + Math.floor(round/3.5);
        var min  = event.getMinutes() + ((round-1)%3)*(sessionTime);
        event.setDate(date);
        event.setMinutes(min);

        return Promise.all([
           db.tournamentMatch.create( {
            id:roomId1,
            TournamentTournamentId: tournamentId,
            round: round,
            status: "Upcoming",
            ParentId: parentId,
            PlayerOneEmail: null,
            PlayerTwoEmail: null,
            WinnerEmail: null,
            startTime:event
          }),
          db.tournamentMatch.create( {
            id:roomId2,
            TournamentTournamentId: tournamentId,
            round: round,
            status: 'Upcoming',
            ParentId: parentId,
            PlayerOneEmail: null,
            PlayerTwoEmail: null,
            WinnerEmail: null,
            startTime:event
          })
       ])
         .then(function(matches){
          return Promise.all([
            module.exports.createMatchRecursively(round - 1, matches[0].dataValues.id, tournamentId )
          ])
          .then(function() {
            return Promise.all([
              module.exports.createMatchRecursively(round - 1, matches[1].dataValues.id, tournamentId )
            ]);
          });  
        });
      }
    });
  },

 

  generateBracket: function(req, res, next) {
    
    // RESET
      // db.Tournament.find( { where: { shortname: req.body.shortname } })
      //   .then(function (tournament) {
      //     tournament.StatusId = 1;
      //     tournament.save();
      // });

    // ACTUAL
    var tournamentId = req.body.id;
    var tournamentStatus = req.body.StatusId;
    
    db.tournamentMatch.destroy({where:{TournamentTournamentId:tournamentId}})
    .then(function(){
    //var sessionTime = req.body.sessionTime;
    var numRounds = 0;
    var teams=0;
    var playerCount=0;
    // need to make sure that status is 2 or 3

    console.log("STATUS!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log('******',tournamentStatus);
    console.log(req.body);
    if ( tournamentStatus === "Upcoming" ) {
      
      // Get all the participants in this tournament
     
    return db.Participant.findAll( { where: {TournamentTournamentId: tournamentId} })
        .then (function(participants) {
             playerCount = participants.length;
            console.log('!!!!!!!!participants', playerCount);
           return db.Tournament.find( { where: { tournamentId: req.body.id } })
          })
            .then(function(tournament){
             teams= 2;
            // calculate the number of rounds in tournament
              console.log('teams = ',teams)
              numRounds = logic.numberOfRounds(playerCount,teams);
              console.log('numrounds', numRounds);
            
          // Create the final match
              console.log('creating final match', tournamentId);
              return module.exports.createMatch(numRounds, null, tournamentId);
        })
        .then(function (createdMatch) {

          if (numRounds > 1) {
            console.log('creating recursive matches');
            return module.exports.createMatchRecursively(numRounds- 1, createdMatch.id, tournamentId,teams);
          }
        
        })
        .then(function () {
          return db.Tournament.find( { where: { tournamentId: req.body.id } })
        })
            .then(function (tournament) {
              tournament.status = "Inprogress";
              tournament.rounds=numRounds;
              tournament.save();
          console.log('updated tournament');
          // pack the first round matches with participants          
           return db.Participant.findAll( { where: {TournamentTournamentId: req.body.id} })
          .then (function(participants) {
            
            var players = participants;
              console.log('players=====', players);
            return db.tournamentMatch.findAll( {attributes:['id','PlayerOneEmail','PlayerTwoEmail','round'],where: { TournamentTournamentId: tournamentId } })
            .then(function (matches) {
                console.log('matchees', matches);
                var abandonedParents = [];

                 var firstRoundMatches = [];
                for (var k = 0; k < matches.length; k++ ) {
                  if (matches[k].round === 1) {
                    firstRoundMatches.push(matches[k]);
                  }
                }

                for ( var i = 0; i < firstRoundMatches.length; i++ ) {
                  
                  var playerOne = null;
                  var playerTwo = null;

                  if ( players.length > 0 ) {
                    playerOne = players.shift();
                  }

                  if ( players.length > 0 ) {
                    playerTwo = players.shift();
                  }

                  if ( playerOne && playerTwo ) {                  
                    firstRoundMatches[i].updateAttributes({ 
                      PlayerOneEmail: playerOne.dataValues.PublisherTempEmail,
                      PlayerTwoEmail: playerTwo.dataValues.PublisherTempEmail
                    });
                  } else if (playerOne || playerTwo ) {
                    firstRoundMatches[i].updateAttributes({ 
                      PlayerOneEmail: playerOne.dataValues.PublisherTempEmail
                    });
                  } else {
                    
                    // var parentId = firstRoundMatches[i].ParentId;
                    // abandonedParents.push(parentId);
                    firstRoundMatches[i].destroy();
                  }    
                    }
                     
                        res.status(200).send(matches);
                     
                // send the results
                
            })
            .catch(function (error) {
              console.error(error);
            });
        })
        .catch(function (error) {
          console.log("error packing the first round matches");
          console.error(error);
          });
        });
      } // close if statement
})
  }


};