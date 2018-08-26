//image link
//https://storage.googleapis.com/streaming-208913/15315658879531.jpg

var db = require('./db/db.js');
var bluebird = require('bluebird');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var bodyparser= require('body-parser')
var jwtauth = require('./helpers/jwt-verify')
var express= require('express');
var nodemailer = require('nodemailer');
var games= require('./routes/games');
var tournament= require('./routes/tournament');
var participants = require('./routes/participants.js');
var android = require('./routes/android');
var league = require('./routes/league');
var matchroutes= require('./routes/matchroutes');
var join= require('./routes/join');
var convert=require("xml-js");
var options = {compact: true, ignoreComment: true, spaces: 4};
var js2xmlparser = require("js2xmlparser");
var crypto = require('crypto');
const ejs = require('ejs');
var paypal = require('paypal-rest-sdk');
const path = require('path');


paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AZFkRmvOZTA_8whe0aX8iETxfkvf4xR_pql29v4lRBdVpPpwQ4q7S0ZXo1mXU20Fo7RZproR4FVimwTT',
  'client_secret': 'EOrOsepW32jVRxY7vn-Eugc-czgzJbNnxiZU9hKEml34cm-mx0gf46EuDQab1VhvFndViQizi5pWdO4_'
});


var app= express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));


app.use('/games',games.router);
app.use('/stream',android);
app.use('/matches',matchroutes);
app.use('/join', join);
app.use('/league', league.router);
app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'))

app.use('/participants', participants);
app.use('/tournament', tournament.router);

var convert=require("xml-js");
var transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'bpdemochatbot@gmail.com',
    pass: 'bpdemochatbot1'
  }
});



app.post('/register',(req,res)=>{
  let email= {email:req.body.email};
  db.email.create(email)
  .then(function(email){
    console.log(email);
    res.send();
  })
  .catch(function(error){
    console.log(error);
  })
})

app.post('/signup', function(req,res){
	var email= req.body.email;
  var username = req.body.username;
	var password= req.body.password;
	var rand=Math.floor((Math.random() * 100) + 54);
	var host=req.get('host');
	var link="http://"+req.get('host')+"/verify?id="+rand+"&email="+email;
	console.log("link====", link);
  var mailOptions={
		to : email,
		subject : "Please confirm your Email account",
		html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>"	
	}
	transporter.sendMail(mailOptions, function (error, info) {
               if (error) {
                   console.log("Email Error: ",error);
               } else {
                   console.log('Email sent: ' + info.response);
               }
           });
  
bcrypt.genSalt(10,function(err,salt){
bcrypt.hash(password,salt,function(err,hash){
if(err) throw err;
password=hash;

db.PublisherTemp.findOrCreate({ where: {  
                                  email: email, 
                                  password: password,
                                  username:username,
                                  token:rand,
                                // country:"India",
                                // avatar:"https://storage.googleapis.com/streaming-208913/15315658879531.jpg"
                                 } })
    
    .then(function (publisher) {
      db.Balance.create({userEmail:email});
      var token = jwt.sign({email:email}, 'dt');
      let output1 = {token: token, email: email};
       if (req.query.gameKey) {
           var mykey = crypto.createDecipher('aes-128-cbc', 'mypassword');
           let mystr = mykey.update(req.query.gameKey, 'hex', 'utf8') + mykey.final('utf8')
           
           db.PlayerGame.findOrCreate({where:{gameId:mystr,
                              userEmail:email,
                              }})
             .then(function (user) {
             console.log("created user ",user);
            res.send(js2xmlparser.parse("Authenticate", output1));
                  })
                  .catch(function(error){
                    console.log(error);
                    res.send(js2xmlparser.parse("Authenticate", output1));
                  })
         }else{
            res.send(js2xmlparser.parse("Authenticate", output1));
         }
     // res.send(js2xmlparser.parse("Authenticate", output));
    })
    .catch(function (error) {
    let output= {text:error};
    res.send(js2xmlparser.parse("Authenticate", output));
    });
});
})
})

app.post('/login',(req,res)=>{
  var email = req.body.email;
	var password= req.body.password;
  
	db.PublisherTemp.find({where:{email:email}})
  .then(function(publisher){
	  if(!publisher){
		  let output= {Authenticated: false,message:"No user with this emailid"};
	  res.send(js2xmlparser.parse("Authenticate", output));
    }
	  else {
      bcrypt.compare(req.body.password, publisher.password, function (err, isMatch) {
        if (err) throw err;
        if (isMatch) {
          var token1 = jwt.sign({ email:email }, "secret",
            {
              expiresIn: "10h"
            });
         let output1={ Authenticated: true, token: token1,username:publisher.username};
       // res.send(convert.js2xml(output1, options));
         if (req.query.gameKey) {
           console.log('in login api call')
           var mykey = crypto.createDecipher('aes-128-cbc', 'mypassword');
           let mystr = mykey.update(req.query.gameKey, 'hex', 'utf8') + mykey.final('utf8')
           console.log(mystr);
           if(req.query.deviceId){
             let deviceinfo = {
                deviceId:req.query.deviceId,
                userEmail:email,
                gameId:mystr
             }
          //   db.StoreDeviceId.findOrCreate({where:{ deviceId: req.query.deviceId,
          //                                           userEmail:email,
          //                                           gameId:mystr}})
          // }
          db.StoreDeviceId.find({where:{userEmail:email,
                                                    gameId:mystr}})
          .then(function(user){
            if(!user){
              return Promise.all([
              db.StoreDeviceId.create(deviceinfo),
              db.PlayerGame.findOrCreate({where:{gameId:mystr,
                              userEmail:email ,country:"India",
                               }})
              ])
          } else{
             console.log("found user ",user);
             db.StoreDeviceId.update(deviceinfo,{where:{userEmail:email,
                                                    gameId:mystr}})
            // .then(function(){
            //   res.send(js2xmlparser.parse("Authenticate", output1));
            // })
          }
          })
           .then(function () {
             
            res.send(js2xmlparser.parse("Authenticate", output1));
                  })
                  .catch(function(error){
                    console.log(error);
                    res.send(js2xmlparser.parse("Authenticate", output1));
                  })
           }
         }
          else{
            res.send(js2xmlparser.parse("Authenticate", output1));
         }
       
         }
         else {
         let output= {Authenticated: false, message:"Password Incorrect"};
        // res.send(convert.js2xml(output, options));
         res.send(js2xmlparser.parse("Authenticate", output));
        }
      })		  
	 
  }
  })
  .catch(function(error){
    res.status(500).json({text:"Something went wrong"});
  })
})

app.post('/score',jwtauth,(req,res)=>{
  var matchId = req.query.matchid;
  if(matchId[0] == "D"){
     games.dareScore(req,res)
  }else if(matchId[0]=="T"){
    tournament.tournamentScore(req,res);
  }else if(matchId[0] == "L"){
    league.leagueScore(req,res);
  }else{
    console.log(matchid);
    let list1 = {message:'MatchId incorrect'};
    res.send(js2xmlparser.parse("Result", list1));
  }
    
})




























// app.post('/signup', function(req,res){
// 	var email= req.body.email;
// 	var password= req.body.password;
	
  
// bcrypt.genSalt(10,function(err,salt){
// bcrypt.hash(password,salt,function(err,hash){
// if(err) throw err;
// password=hash;

// var token = 15;
// db.PublisherTemp.findOrCreate({ where: {  
//                                   email: email, 
//                                   password: password,
//                                   token:token } })
    
//     .then(function (publisher) {
//       var token = jwt.sign({email:email}, 'dt');
//       let output1 = {token: token, email: email};
//        if (req.query.gameKey) {
//            var mykey = crypto.createDecipher('aes-128-cbc', 'mypassword');
//            let mystr = mykey.update(req.query.gameKey, 'hex', 'utf8') + mykey.final('utf8')
           
//            db.PlayerGame.findOrCreate({where:{gameId:mystr,
//                               playerId:email}})
//              .then(function (user) {
//              console.log("created user ",user);
//             res.send(js2xmlparser.parse("Authenticate", output1));
//                   })
//                   .catch(function(error){
//                     console.log(error);
//                     res.send(js2xmlparser.parse("Authenticate", output1));
//                   })
//          }else{
//             res.send(js2xmlparser.parse("Authenticate", output1));
//          }
//      // res.send(js2xmlparser.parse("Authenticate", output));
//     })
//     .catch(function (error) {
//     let output= {text:error};
//     res.send(js2xmlparser.parse("Authenticate", output));
//     });
// });
// })
// })






 app.post('/users/login',(req,res)=>{
  var email = req.body.email;
	var password= req.body.password;
  
	db.PublisherTemp.find({where:{email:email}})
  .then(function(publisher){
	  if(!publisher){
		  let output= {Authenticated: false,message:"No user with this emailid"};
	  res.json(output);
    }
	  else{
      bcrypt.compare(req.body.password, publisher.password, function (err, isMatch) {
        if (err) throw err;
        if (isMatch) {
         
          var token1 = jwt.sign({ email:email }, "secret",
            {
              expiresIn: "10h"
            });
         let output1={ Authenticated: true, token: token1, username:"Domil", id:123, gender:"Male",email:email};
       // res.send(convert.js2xml(output1, options));
                    res.json(output1);
                 
        }   
         else {
         let output= {Authenticated: false, message:"Password Incorrect"};
        // res.send(convert.js2xml(output, options));
         res.json(output);
        }
      })
      }
      		  
	  })
  
  .catch(function(error){
    res.status(500).json({text:"Something went wrong"});
  })
})



app.get('/verify',function(req,res){
  console.log(req.protocol + ":/" + req.get('host'));
  console.log('*******************');
  console.log(req.query.email,req.query.id);
  console.log((req.protocol + "://" + req.get('host')));
  var host = req.get('host');
  console.log(host);
  //if ((req.protocol + "://" + req.get('host')) == ("http://" + host)) {
    if(true){
    console.log("Domain is matched. Information is from Authentic email");
    db.PublisherTemp.find({ where: {  
                                  email: req.query.email}})
    .then(function(publisher){
      if(!publisher){
        res.send("this user is not present");
      }
      else{
        console.log('************',req.query.id,publisher.token);
        if (req.query.id == publisher.token) {
      console.log("email is verified");
      db.Publisher.findOrCreate({where:{
                    email:publisher.email,
                    password: publisher.password
               
    }})
    .then(function(publisher1){
      if(!publisher1){
        res.send("Registration failed")
      }
      else{
        res.end("<h1>Email " + req.query.email + " is been Successfully verified");
   
      }
    })
    .catch(function(error){
      res.send(error);
    })
     
       }
    else {
      console.log("email is not verified");
      res.end("<h1>Bad Request</h1>");
    }
      }
    })
         
  }
  else {
    res.send("<h1>Request is from unknown source");
  }
});











// paypal integration
app.get('/pay', (req, res) => {
 // var amount = 400;
  console.log('req--',req)
  console.log('reqquery--',req.query)
  console.log('in pay ', req.body);
  var amount1= req.query.amount*1.2;
  var userEmail = req.query.email;
const create_payment_json = {
  "intent": "sale",
  "payer": {
      "payment_method": "paypal"
  },
  "redirect_urls": {
      "return_url": `https://daressdk.appspot.com/success?amount=${req.query.amount}&email=${userEmail}`,
      "cancel_url": "https://daressdk.appspot.com/cancel"
  },
  "transactions": [{
      "item_list": {
          "items": [{
              "name": "Add Wallet Balance",
              "sku": "001",
              "price": `${amount1}`,
              "currency": "INR",
              "quantity": 1
          }]
      },
      "amount": {
          "currency": "INR",
          "total": `${amount1}`
      },
      "description": "Add money to my wallet"
  }]
};

paypal.payment.create(create_payment_json, function (error, payment) {
if (error) {
    throw error;
} else {
    console.log(payment);
   // res.send('test successful');
    for(let i = 0;i < payment.links.length;i++){
      if(payment.links[i].rel === 'approval_url'){
        res.redirect(payment.links[i].href);
      }
    }
}
});
});


app.get('/success', (req, res) => {
  var amount1 = req.query.amount;
  var amount2 = amount1*1.2;
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;
  var userEmail = req.query.email;
  const execute_payment_json = {
    "payer_id": payerId,
    "transactions": [{
        "amount": {
            "currency": "INR",
            "total": `${amount2}`
        }
    }]
  };
  console.log('in success', execute_payment_json);
  paypal.payment.execute(paymentId, execute_payment_json, function (error, payment) {
    if (error) {
        console.log(error);
        throw error;
    } else {
        console.log(JSON.stringify(payment));
        db.Balance.find({where:{userEmail:userEmail}})
    .then(function(user){
        var updatedBalance = Number(user.balance) + Number(amount1) ; 
        user.updateAttributes({balance:Number(updatedBalance)});
        let output= {balance:updatedBalance}
	//res.send(convert.js2xml(output, options));
     res.send(js2xmlparser.parse("Balance", output));  
    })
        //res.send('Success');
    }
});
});

app.get('/cancel', (req, res) => res.send('Cancelled'));


var port = process.env.PORT || 1337;
app.listen(port,() => {
  console.log('listening', port);
});


























