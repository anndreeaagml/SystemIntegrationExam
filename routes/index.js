var express = require('express');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var db = require('../db');
var nodemailer = require('nodemailer');
const { token } = require('morgan');
const passport = require('passport');
uuidv4 = require('uuid').v4;
var ensureLoggedIn = ensureLogIn();

var options = {
  root: __dirname + '/../var/db/',
  dotfiles: 'deny',
  headers: {
    'x-timestamp': Date.now(),
    'x-sent': true
  }
};
const Database = require('better-sqlite3');
const db2 = new Database('./var/db/todos.db', { verbose: console.log });

var crypto = require('crypto');

var router = express.Router();
LINK = "http://localhost:3000/invite?token="
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('home', { title: 'Express' });
});

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '3am.noreply@gmail.com',
    pass: 'jiupqoryzvotgxvf'
  }
});

router.post('/sendinvite', function (req, res, next) {
  //res.locals.currentUser = req.user;
  var user = req.user.username;
  db.getEmail(user, function (err, result) { //get email of user
    if (err) {
      console.log(err);
    }
    else {
      var email = result.email;
      var toemail = req.body.toemail;
      var subject = 'Invitation to join my app';
      var token = uuidv4();
      var text = 'You have been invited by ' + email + ' to join my app. Please click on the link below to join.' + LINK + token;
      var mailOptions = {
        from: email,
        to: toemail,
        subject: subject,
        text: text
      };
      db.createInvitation(toemail, email, token, function (err, result) {
        if (err) {
          console.log(err);
        }
        else {
          console.log(result.email);
        }
      });
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }

      });
      res.redirect('/');
    }
  });
});

router.post('/invite', async function (req, res, next) {
  var token = req.query.token;
  var salt = crypto.randomBytes(16);
  db2.prepare('INSERT INTO users (username, hashed_password,email, salt) VALUES (?, ?, ?, ?)').run(req.body.username, crypto.pbkdf2Sync(req.body.password, salt, 1000, 64, 'sha512').toString('hex'),req.body.email , salt.toString('hex'));
  var friend = await db2.prepare('SELECT invitedby FROM invitations WHERE token = ?').get(token);
  db2.prepare('DELETE FROM invitations WHERE token = ?').run(token);
  db2.prepare('INSERT INTO friends (username, friend) VALUES (?, ?)').run(req.body.username, friend.invitedby);

  res.redirect('/login');
  
});


module.exports = router;
