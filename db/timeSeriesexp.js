var Sequelize = require('sequelize');
//var db = require('./db.js');

const orm = new Sequelize('sdk', 'domil', 'qwert12345', {
    //timezone:'+05:30',
    host: '127.0.0.1',
    dialect: 'mysql',
    operatorsAliases: false,
    
    timezone: '+05:30',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
  });
  

var Promise = require('bluebird');
var bcrypt = require('bcrypt-nodejs');
var SALT_WORK_FACTOR = 10;

var Timeexp = orm.define('Timeexp', {
    id:{type: Sequelize.STRING, allowNull: false, unique: true,primaryKey:true },
    round: { type: Sequelize.INTEGER, allowNull: false , defaultValue:2 },
    
    startTime: { 
      type: Sequelize.DATE, 
      defaultValue: Sequelize.NOW 
  }
  });

  Timeexp.sync();

  var startDate = new Date('2018-08-01 12:59:00');
  var endDate = new Date('2018-08-30 11:59:00');

// Timeexp.findAll({
//     where:{
//         startTime: {
//     $between: [ startDate, endDate]
// //  initDate: new Date ('2018-08-01 14:40'),
// //  endDate: new Date('2018-08-20 14:50')
// }}})
// .then(function(match){
//     console.log('new found match is ', match);
// })

var startTime = "2018-08-04 06:30:00";
var endTime = '2018-08-06';

orm.query(`SELECT id,startTime FROM Timeexps WHERE startTime BETWEEN '${startTime}' AND '${endTime}'` , { model: Timeexp }).then(projects => {
    // Each record will now be a instance of Project
    var projects = JSON.stringify(projects);
    projects = JSON.parse(projects);
    console.log(projects);
  })

//   Timeexp.create({id:1, startTime:'2018-08-04 12:00:00'});
//   Timeexp.create({id:2, startTime:'2018-08-05 12:00:00'});
//   Timeexp.create({id:3, startTime:'2018-08-06 12:00:00'});
//   Timeexp.create({id:4, startTime:'2018-08-07 12:00:00'});
//   Timeexp.create({id:5, startTime:'2018-08-08 12:00:00'});



