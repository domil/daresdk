var db = require('./db/db.js');
var bluebird = require('bluebird');
var jwt = require('jsonwebtoken');
var bcrypt = require('bcryptjs');
var bodyparser= require('body-parser')
var express= require('express');
var nodemailer = require('nodemailer');
var games= require('./routes/games');
var tournament= require('./routes/tournament');
var participants= require('./routes/participants.js');
var android= require('./routes/android');
var matchroutes= require('./routes/matchroutes');
var join= require('./routes/join');
var convert=require("xml-js");
var options = {compact: true, ignoreComment: true, spaces: 4};
var js2xmlparser = require("js2xmlparser");
var crypto = require('crypto');

var app= express();
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));


app.use('/games',games);
app.use('/stream',android);
app.use('/matches',matchroutes);
app.use('/join', join);


app.use('/participants', participants);
app.use('/tournament', tournament);

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
                                  token:rand } })
    
    .then(function (publisher) {
      db.Balance.create({userEmail:email});
      var token = jwt.sign({email:email}, 'dt');
      let output1 = {token: token, email: email};
       if (req.query.gameKey) {
           var mykey = crypto.createDecipher('aes-128-cbc', 'mypassword');
           let mystr = mykey.update(req.query.gameKey, 'hex', 'utf8') + mykey.final('utf8')
           
           db.PlayerGame.findOrCreate({where:{gameId:mystr,
                              playerId:email}})
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
         let output1={ Authenticated: true, token: token1,Tournaments:["tournament1"], Leagues:["league1"]};
       // res.send(convert.js2xml(output1, options));
         if (req.query.gameKey) {
           var mykey = crypto.createDecipher('aes-128-cbc', 'mypassword');
           let mystr = mykey.update(req.query.gameKey, 'hex', 'utf8') + mykey.final('utf8')
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
                              playerId:email ,country:"India" }})
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

var port = process.env.port || 1337;
app.listen(port,() => {
  console.log('listening', port);
});


























