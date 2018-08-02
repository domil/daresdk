var db= require('../db/db');
var express= require('express');
var jwtauth = require('../helpers/jwt-verify')
var crypto = require('crypto');
var convert=require("xml-js");
var js2xmlparser = require("js2xmlparser");
var request = require('request');
var uuid = require('uuid/v4');
var Sequelize = require('sequelize');
const Op = Sequelize.Op;
const operatorsAliases = {
  $between: Op.between 
}

var options = {compact: true, ignoreComment: true, spaces: 4};

var router = express.Router();

function balancecheck(){
	return true;
}


router.get('/balance',jwtauth,(req,res)=>{
    db.Balance.find({where:{userEmail:req.userData.email}})
    .then(function(user){
        let output= {balance:user.balance}
	//res.send(convert.js2xml(output, options));
     res.send(js2xmlparser.parse("Balance", output));  
    }) 
})

router.get('/balance/add',jwtauth,(req,res)=>{
    var amount = req.query.amount;
    db.Balance.find({where:{userEmail:req.userData.email}})
    .then(function(user){
        var updatedBalance = Number(user.balance) + Number(amount) ; 
        user.updateAttributes({balance:Number(updatedBalance)});
        let output= {balance:updatedBalance}
	//res.send(convert.js2xml(output, options));
     res.send(js2xmlparser.parse("Balance", output));  
    })
})


router.get('/balance/set',jwtauth,(req,res)=>{
    var amount = req.query.amount;
    db.Balance.find({where:{userEmail:req.userData.email}})
    .then(function(user){
         var updatedBalance = req.query.amount;
      user.updateAttributes({balance:req.query.amount}); 
      let output= {balance:updatedBalance}
	//res.send(convert.js2xml(output, options));
     res.send(js2xmlparser.parse("Balance", output)); 
    })
})
router.post('/',jwtauth,(req,res)=>{
	var tournamentId= req.body.tournamentId;
	var userId= req.userData.email;
	
	// check balance and fee of tournament
	
	// if fee is more ask the user to add money
	
	// if balance is more
	// update balance
	// update spots left in tournament table
	//update participants table
	let output= {balance:100,Joined:true}
	//res.send(convert.js2xml(output, options));
    res.send(js2xmlparser.parse("Join", output));
})

//const Op = Sequelize.Op;

router.get('/dare',jwtauth,(req,res)=>{
	var playerId= req.query.playerId;
	var gameKey = req.query.gameKey;
    var dareAmount = req.query.dareAmount;
    //[Op.or]: [{authorId: 12}, {authorId: 13}]
    db.Balance.findAll({where:{[Op.or]:[{userEmail:req.userData.email},{userEmail:playerId}]}})
    .then(function(users){
        console.log('users ******', users);
        var user = users[0];
        console.log('user ',user);
        var to = users[1];
        var balance = user.balance;
        if(user && user.balance >= dareAmount){
            var updatedBalance= user.balance - dareAmount
            //user.updateAttributes({balance:updatedBalance})
        
	    var mykey = crypto.createDecipher('aes-128-cbc', 'mypassword');
        let mystr = mykey.update(req.query.gameKey, 'hex', 'utf8') + mykey.final('utf8')        
	   console.log('fetching ****', playerId);
         db.StoreDeviceId.find({where:{userEmail:playerId,
		                         gameId: mystr}})
	.then(function(deviceid){
		if(!deviceid){
			let list = {result:'We are unable to notify this user'}
            res.send(js2xmlparser.parse("Result", list));
		} 
        else{
		var deviceId = deviceid.deviceId;
        console.log('******', deviceId);
		let dareId= uuid();
		db.Dare.findOrCreate({where:{
			  id:dareId,
			  fromEmail:req.userData.email,
			  toEmail: playerId,
			  gameId:mystr,
              dareAmount:dareAmount
				 }});
            //   let list = {result:'just testing'}
            // res.send(js2xmlparser.parse("Result", list));
            
            
	    console.log('********to*******', to.balance);
           var data=   {
        "notification":{
        "title": " Dare Invitation ",
        "body": req.userData.email
    },
    "data": {
        "balanceStatus":true,
        "dareId": dareId,
        "time": "30",
        "dareAmount":dareAmount
    }
} 
 
  var tob = dareAmount-to.balance;
     var data2={
        "notification":{
        "title": " Dare Invitation ",
        "body": req.userData.email
    },
    "data": {
        "balanceStatus":false,
        "dareId": dareId,
        "time": "10",
        "dareAmount":dareAmount,
        "amount": tob
    }
}   
     var dataNew = to.balance >= dareAmount?data:data2
		sendToAll( dataNew, deviceId, res, dareId); 
		}
	})
	
    }
    else{
        let list = {result:"Insufficient balance", requiredSum:`${dareAmount - balance}`,link:"add money by clicking on this link" }
            res.send(js2xmlparser.parse("Result", list));
    }
    })
    .catch(function(error){
		let list = {result:"Something went wrong", requiredSum:`${dareAmount - balance}` }
            res.send(js2xmlparser.parse("Result", list));
 	})
})

router.get('/dare/decline', (req,res)=>{
    var dareId = req.query.dareId;
    var gameKey = req.query.gameKey;
	 var mykey = crypto.createDecipher('aes-128-cbc', 'mypassword');
  var mystr = mykey.update(req.query.gameKey, 'hex', 'utf8') + mykey.final('utf8')        
	
    db.Dare.find({where:{id:dareId}})
    .then(function(dare){
        console.log('declinedare**', dare);
        var from = dare.fromEmail;
        db.StoreDeviceId.find({where:{userEmail:from,
                                      gameId:mystr}})
       .then(function(deviceId){
           deviceId= deviceId.deviceId;
           console.log('from, device', deviceId, from);
          var declinedata=  {
    "notification":{
        "title": "Dare Declined",
        "body": "Dare challenge is declined by the player"
    },
    "data": {
        "declined": true,
         "message": ""
    }
}     
            sendToAll(declinedata, deviceId, res ); 
       })
        
})
.catch(function(error){
    console.log(error);
    let list1 = {message:'Some problem with the endpoint. Try again later'};
    res.send(js2xmlparser.parse("Result", list1));
}) 
})


router.get('/dare/accept',(req,res)=>{
    var fromtoEmail;
    var fromEmail;
    var fromtodareAmount;
	var playerId= req.query.dareId;
    var deviceId= new Array();
    let matchId;
	db.Dare.find({where:{id:req.query.dareId}})
	.then(function(fromto){
        fromtoEmail = fromto.fromEmail;
        fromEmail = fromto.toEmail;
        fromtodareAmount = fromto.dareAmount;
        console.log('fromto ', fromto);
        if(!fromto){
            let list1 = {message:'invalid dareid'};
            res.send(js2xmlparser.parse("Result", list1));
        }else{
            
		return Promise.all([
	   db.StoreDeviceId.find({where:{userEmail:fromto.fromEmail}}),
	   db.StoreDeviceId.find({where:{userEmail:fromto.toEmail}})		
        ])
        }
	})
	.then(function(deviceid){
        console.log('deviceids ********', deviceid);
        if(deviceid.length <2){
            let list1 = {message:'Unable to notify both users'};
            res.send(js2xmlparser.parse("Result", list1));
        }else{
        matchId= "D"+ uuid();
        console.log('match****',deviceid[0].fromEmail,deviceid[1].toEmail  )
        var newmatch = {
            roomId:matchId,
            team1Id:deviceid[0].userEmail,
            team2Id:deviceid[1].userEmail,
            status:"Upcoming"
        }
        db.Match.create(newmatch)
        .then(function(){
            
		 deviceId.push(deviceid[0].deviceId);
         deviceId.push(deviceid[1].deviceId);
         console.log('matchid******', deviceId, matchId);
        

       return db.Balance.findAll({where:{[Op.or]:[{userEmail:fromtoEmail},{userEmail:fromEmail}]}})
     }) 
    .then(function(users){
          var data1 = {
    "notification":{
        "title": "Open game and play",
        "body": " Dare Accepted"
    },
    "data": {
        "message":"Accepted",
        "roomId": matchId,
         "time": "10",
         "players":[fromtoEmail,fromEmail]
    }
}  
  console.log('users1111', users[1].balance);
  let endflag = true;
       if(users[1].balance - fromtodareAmount < 0 ||  users[0].balance - fromtodareAmount < 0){
           endflag=false;
         let list1 = {message:'Insufficient Balance', balanceStatus:false};
            res.send(js2xmlparser.parse("Result", list1));
            console.log('not sending notification')
            throw Error; 
       } else{
        users.forEach(function(user){
           let newBalance = (user.balance - fromtodareAmount); 
         console.log('newBalance ******', newBalance);
        user.updateAttributes({balance:newBalance})
        })
        if(endflag){
		sendToAll2(data1, deviceId, res); 
        }
       }
        })
    
        }
})
	.catch(function(error){
		res.send(error);
	})
   
})



router.get('/dare/cancelled',(req,res)=>{
   // var dareId = req.query.dareId;
    var gameKey = req.query.gameKey;
    var gameKey = req.query.gameKey;
	 var mykey = crypto.createDecipher('aes-128-cbc', 'mypassword');
  var mystr = mykey.update(req.query.gameKey, 'hex', 'utf8') + mykey.final('utf8')        
	
    // delete match
    db.Dare.find({where:{id:req.query.dareId}})
	.then(function(fromto){
        console.log('fromto ', fromto);
        if(!fromto){
            let list1 = {message:'invalid dareid'};
            res.send(js2xmlparser.parse("Result", list1));
        }else{
            
		return Promise.all([
	   db.StoreDeviceId.find({where:{userEmail:fromto.fromEmail,
                             gameId:mystr}}),
	   db.StoreDeviceId.find({where:{userEmail:fromto.toEmail,
                             gameId:mystr}})		
        ])
        }
	})
	.then(function(deviceid){
        console.log('deviceids ********', deviceid);
        if(deviceid.length <2){
            let list1 = {message:'Unable to notify both users'};
            res.send(js2xmlparser.parse("Result", list1));
        }else{
        var deviceId= new Array();
		 deviceId.push(deviceid[0].deviceId);
         deviceId.push(deviceid[1].deviceId);
         console.log('matchid******', deviceId);
         var canceldata = {
    "notification":{
        "title": "Waiting time lapsed",
        "body": "Match Cancelled"
    },
    "data": {
        "message": "Cancelled",
         "cancelled": true
    }
}     
		sendToAll2(canceldata,deviceId, res); 
        }
        
})

})



const sendToAll = (data1, deviceid, response,dareId) => {
     var recipient = new Array();
//     const data = {

//     "notification":{
//         "title": "title",
//         "body": "msg"
//     },
//     "data": {
//         "dareId": dareId,
//         "Message": "time"
//     }
// }
        const data= data1;
        data['registration_ids'] = new Array(deviceid);
        console.log('*******sendtoall', data);
        sendNotification(data)
        //response.status(200).send('Invitation sent to other user.');
        let list = {result:data.notification.title};
        response.send(js2xmlparser.parse("Result", list));
}

const sendToAll2 = (data1, deviceid, response) => {
     var recipient = new Array();
//     var data = {
//     "notification":{
//         "title": "title",
//         "body": "msg"
//     },
//     "data": {
//         "room": roomId,
//         "Message": "time"
//     }
// }
       var  data = data1;
        data['registration_ids'] = deviceid;
        console.log('accept data ', data);
        sendNotification(data);
        //response.sendStatus(200);
        if(response != null){
        let list = {result:data.data.roomId};
        response.send(js2xmlparser.parse("Result", list));
        }
}


function sendNotification(data){
	const dataString = JSON.stringify(data)

    const headers = {
        'Authorization': 'key=AIzaSyA7tIcDjWE1HsbeR14kU2IkeG394F5dGIA',
        'Content-Type': 'application/json',
        'Content-Length': dataString.length
    }

    const options = {
        uri: 'https://fcm.googleapis.com/fcm/send',
        method: 'POST',
        headers: headers,
        json: data
    }

    request(options, function (err, res, body) {
        if (err) throw err
        else console.log(body)
    })
}

module.exports= router;






var endDate = new Date('2018-08-23T18:11:00.0000000+00:00')
var startDate = new Date('2018-08-23T18:00:00.0000000+00:00')
var a =3;
console.log(a);
setInterval(function(){
    db.tournamentMatch.findAll({attributes:['id','PlayerOneEmail','PlayerTwoEmail','startTime'],where:{
    startTime: {
        $between: [startDate, endDate]
    }
}}).
then(function(results){
    console.log('getting results');
    var results = JSON.stringify(results);
    console.log(JSON.parse(results));
    results = JSON.parse(results);
    results.map(function(match){
        if(match.PlayerOneEmail!=null && match.PlayerTwoEmail!=null){
            return Promise.all([
	   db.StoreDeviceId.find({where:{userEmail:match.PlayerOneEmail}}),
	   db.StoreDeviceId.find({where:{userEmail:match.PlayerTwoEmail}})		
        ])
        .then(function(deviceid){
        console.log('deviceids ********', deviceid);
        if(deviceid.length <2){
            let list1 = {message:'Unable to notify both users'};
            res.send(js2xmlparser.parse("Result", list1));
        }else{
            var deviceId = [];
             deviceId.push(deviceid[0].deviceId);
            deviceId.push(deviceid[1].deviceId);
             var data1 = {
    "notification":{
        "title": "Open Match",
        "body": " Tournament Match"
    },
    "data": {
        "message":"Accepted",
        "room":match.id,
        "startTime": match.startTime,
        "players":[match.PlayerOneEmail,match.PlayerTwoEmail]
         
    }
} 
        sendToAll2(data1, deviceId,null);  
          
        }
        
      
        })
        }
        else{
            console.log('Either 1 or both are null');
        }
    })
})
},30000000);