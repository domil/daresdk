const sgMail = require('@sendgrid/mail');
sgMail.setApiKey("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");
const msg = {
  to: 'hare.kushwaha@wipro.com ',
  from: 'hk34447@gmail.com ',
  subject: 'Sending with SendGrid is Fun',
  text: 'HAHA hare your account is hacked. You know me. Give me party otherwise I will change the password of your laptop.. HAHAHAHA',
  };
sgMail.send(msg, function(err,res){
    console.log(res)
 });