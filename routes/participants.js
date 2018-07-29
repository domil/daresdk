var db= require('../db/db');
var express= require('express');
var jwtauth = require('../helpers/jwt-verify')
var crypto = require('crypto');
var convert=require("xml-js");
var js2xmlparser = require("js2xmlparser");

var router = express.Router();

router.get('/participants',(req,res)=>{
	 db.Participant.findAll({include: [db.Tournament, db.PublisherTemp]})
    .then(function(participants){
      res.status(200).send(participants);
    });
})


router.post('/newparticipant',(req,res)=>{
	
	var tournamentId = req.body.tournamentId;
    var userId = req.body.email;

    console.log(req.body);
	
        db.Participant.findOrCreate( { where : {
          UserId: userId,
          TournamentId: tournamentId
        }})
      .then(function (createdParticipant){
        if (createdParticipant){
          res.json(createdParticipant);
        }
      })
      .catch(function (error){
       console.log(error);
      });
})

module.exports = router;