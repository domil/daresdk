//var logic = require('./logic');
//var dbconfig = require('../config/dbconfig.js');
var Sequelize = require('sequelize');

//var dbname = dbconfig.production.database || dbconfig.development.database;
//var dbuser = dbconfig.production.username || dbconfig.development.username;
//var dbpw = dbconfig.production.password || dbconfig.development.password;

var orm = new Sequelize('sql_testing', 'domil@sqlserverd', 'qwert12345!', {
  host: 'sqlserverd.database.windows.net',
  dialect: 'mssql',
  driver: 'tedious',
  options: {
    encrypt: true,
    database: 'sql_testing'
  },
  port: 1433,
  pool: {
    max: 5,
    min: 0,
    idle: 10000
  },
  dialectOptions: {
    encrypt: true
  }
});

var Promise = require('bluebird');
var bcrypt = require('bcrypt-nodejs');
var SALT_WORK_FACTOR = 10;



  
///////////////////////////////////////////////////////
// Schema + Initialization with test data
///////////////////////////////////////////////////////

var email= orm.define('email',{
  email:{ type: Sequelize.STRING, allowNull: false, unique: true}
})

var StoreDeviceId= orm.define('StoreDeviceId', {
  deviceId: { type: Sequelize.STRING, allowNull: false },
  gameId:{ type: Sequelize.STRING, allowNull: false }
});


var PublisherTemp= orm.define('PublisherTemp',{
   email: { type: Sequelize.STRING, allowNull: false, unique: true, primaryKey:true},
  password: { type: Sequelize.STRING, allowNull: false },
   token :{type: Sequelize.INTEGER, allowNull: false}
})


var Balance = orm.define('Balance',{
  balance:{type:Sequelize.INTEGER, allowNull:false, defaultValue:0}  
})


var tournamentMatch = orm.define('tournamentMatch', {
  id:{type: Sequelize.STRING, allowNull: false, unique: true,primaryKey:true },
  round: { type: Sequelize.INTEGER, allowNull: false },
  status:{type: Sequelize.ENUM("Upcoming","Inprogress","Completed"), allowNull: false },
  startTime: { 
    type: Sequelize.DATE, 
         defaultValue: Sequelize.NOW 
}
});


var PublisherDetails= orm.define("PublisherDetails",{
  name: { type: Sequelize.STRING, allowNull: false },
  country: { type: Sequelize.STRING, allowNull: false },
  state: { type: Sequelize.STRING, allowNull: false },
  phone: { type: Sequelize.STRING, allowNull: false }
  });

  
var Publisher = orm.define('Publisher', {
  email: { type: Sequelize.STRING, allowNull: false, unique: true , primaryKey:true},
  password: { type: Sequelize.STRING, allowNull: false }
}, {
  instanceMethods: {
    comparePasswords: function(candidatePassword, cb) {
      bcrypt.compare(candidatePassword, this.getDataValue('password'), function(err, isMatch) {
        if (err) {
          cb(err, null);
        } else {
          cb(null, isMatch);
        }
      });
    }
  } 
});

var PlayerGame = orm.define('PlayerGame', {
  gameId: { type: Sequelize.STRING, allowNull: false },
  playerId: { type: Sequelize.STRING, allowNull: false },
  country:{type: Sequelize.STRING, allowNull: false}
});

var GamesDetails = orm.define('GamesDetails',{
  gameId:{type: Sequelize.STRING, allowNull: false, unique: true,primaryKey:true },
  publisherId:{ type: Sequelize.STRING, allowNull: false, unique: true },
  gameName:{ type: Sequelize.STRING, allowNull: false},
  orientation:{ type: Sequelize.STRING, allowNull: true},
  playersAllowed:{ type: Sequelize.STRING, allowNull: false},
  genre:{ type: Sequelize.STRING, allowNull: true},
  gameIcon:{ type: Sequelize.STRING, allowNull: false},
  live:{ type: Sequelize.BOOLEAN, allowNull: false},
  creationTime:{ type: Sequelize.STRING, allowNull: true},
  gameKey:{ type: Sequelize.STRING, allowNull: false}
})

var Match = orm.define('Match',{
  roomId:{type: Sequelize.STRING, allowNull: false, unique: true,primaryKey:true },
  status:{type: Sequelize.ENUM("Upcoming","Inprogress","Completed"), allowNull: false },
  team1Id:{type: Sequelize.STRING, allowNull: false},
  team2Id:{type: Sequelize.STRING, allowNull: false},
  startTime: { 
         type: Sequelize.DATE, 
         defaultValue: Sequelize.NOW 
    },
    team1Score:{type: Sequelize.INTEGER, allowNull: false,defaultValue:0},
    team2Score:{type: Sequelize.INTEGER, allowNull: false,defaultValue:0},
    winner:{type: Sequelize.STRING, allowNull: true},
    count:{type: Sequelize.INTEGER,allowNull: false,defaultValue:0}
})

var PastMatch = orm.define('PastMatch',{
  roomId:{type: Sequelize.STRING, allowNull: false, unique: true,primaryKey:true },
  status:{type: Sequelize.ENUM("Upcoming","Inprogress","Completed"), allowNull: false },
  team1Id:{type: Sequelize.STRING, allowNull: false},
  team2Id:{type: Sequelize.STRING, allowNull: false},
  startTime: { 
         type: Sequelize.DATE, 
         defaultValue: Sequelize.NOW 
    },
    team1Score:{type: Sequelize.INTEGER, allowNull: false},
    team2Score:{type: Sequelize.INTEGER, allowNull: false},
    winner:{type: Sequelize.STRING, allowNull: false}
})


var Tournament = orm.define('Tournament',{
   gameId:{type: Sequelize.STRING, allowNull: false },
   tournamentId: {type: Sequelize.STRING, allowNull: false, unique: true ,primaryKey:true},
   tournamentName: {type: Sequelize.STRING, allowNull: false},
   payout: {type: Sequelize.STRING, allowNull: false },
   status:{type: Sequelize.ENUM("Upcoming","Inprogress","Completed"), allowNull: false },
   startTime: { 
         type: Sequelize.DATE, 
         defaultValue: Sequelize.NOW 
    },
     spotsLeft:{type: Sequelize.INTEGER, allowNull: false },
     rounds:{type: Sequelize.INTEGER, defaultValue:0 },
   fee:{type: Sequelize.INTEGER, allowNull: false },
   winners:{type: Sequelize.STRING, allowNull: true },
   rules:{type: Sequelize.STRING, allowNull: false },
  registrationEndDate: { 
         type: Sequelize.DATE, 
         defaultValue: Sequelize.NOW 
    }})

var LeagueDetails = orm.define('LeagueDetails',{
   gameId:{type: Sequelize.STRING, allowNull: false },
   leagueId: {type: Sequelize.STRING, allowNull: false, unique: true,primaryKey:true },
   leagueName: {type: Sequelize.STRING, allowNull: false},
   payout: {type: Sequelize.STRING, allowNull: false },
   fee:{type: Sequelize.INTEGER, allowNull: false },
   status:{type: Sequelize.ENUM("Upcoming","Inprogress","Completed"), allowNull: false },
   startTime: { 
         type: Sequelize.DATE, 
         defaultValue: Sequelize.NOW 
    },
   spotsLeft:{type: Sequelize.INTEGER, allowNull: false },
   winners:{type: Sequelize.STRING, allowNull: true },
   rules:{type: Sequelize.STRING, allowNull: false },
   registrationEndDate: { 
         type: Sequelize.DATE, 
         defaultValue: Sequelize.NOW 
    }}) 


var Dare = orm.define('Dare', {
  id:{type:Sequelize.STRING, alloNull:false,primaryKey:true},
  startTime: { 
         type: Sequelize.DATE, 
         defaultValue: Sequelize.NOW 
    },
    dareAmount:{type:Sequelize.INTEGER, allowNull:false},
    gameId: { type: Sequelize.STRING, allowNull: false }
})

var Participant = orm.define('Participant', {
});


tournamentMatch.belongsTo(Tournament);
tournamentMatch.belongsTo(tournamentMatch, { as: 'Parent'});
tournamentMatch.belongsTo(PublisherTemp, { as: 'PlayerOne'});
tournamentMatch.belongsTo(PublisherTemp, { as: 'PlayerTwo'});
tournamentMatch.belongsTo(PublisherTemp, { as: 'Winner'});
Participant.belongsTo(Tournament);
Participant.belongsTo(PublisherTemp);

Balance.belongsTo(PublisherTemp, {as:'user'});
StoreDeviceId.belongsTo(PublisherTemp, { as: 'user' });
PublisherDetails.belongsTo(Publisher, { as: 'Publisher' });
Dare.belongsTo(PublisherTemp, {as: 'from'});
Dare.belongsTo(PublisherTemp, {as: 'to'});

Promise.all([
  Publisher.sync(),
  PastMatch.sync(),
  PlayerGame.sync(),
  PublisherTemp.sync(),
  GamesDetails.sync(),
  LeagueDetails.sync(),
  Tournament.sync(),
  email.sync(),
  Match.sync(),
  
])
.then(function(){
  Balance.sync();
  tournamentMatch.sync();
  Participant.sync();
  return Participant.sync();
  return PublisherDetails.sync();
  
})
.then(function(){
  return StoreDeviceId.sync();
})
.then(function(){
  return Dare.sync();
  
})






exports.Publisher = Publisher;
exports.PastMatch = PastMatch;
exports.PublisherDetails = PublisherDetails ;
exports.PublisherTemp= PublisherTemp;
exports.GamesDetails= GamesDetails;
exports.Tournament = Tournament;
exports.LeagueDetails= LeagueDetails;
exports.PlayerGame = PlayerGame;
exports.StoreDeviceId = StoreDeviceId;
exports.email= email;
exports.Dare = Dare;
exports.Match = Match;
exports.Balance = Balance;
exports.Participant = Participant;
exports.tournamentMatch = tournamentMatch;
exports.Participant = Participant;