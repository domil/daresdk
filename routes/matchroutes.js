
var MatchController = require('./matchController.js');
var db= require('../db/db');
var express= require('express');
var jwtauth = require('../helpers/jwt-verify')
var crypto = require('crypto');
var convert=require("xml-js");
var js2xmlparser = require("js2xmlparser");

var router = express.Router();


  router.route('/')
    .get(MatchController.allMatches)
    .post(MatchController.generateBracket)
    .put(MatchController.updateMatch);



module.exports = router;


