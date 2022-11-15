var express = require('express');
var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
var db = require('../db');
var nodemailer = require('nodemailer');
const { token } = require('morgan');

var ensureLoggedIn = ensureLogIn();

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
    pass: 'Parola_123'
  }
});

var mailOptions = {
  from: 'youremail@gmail.com',
  to: 'myfriend@yahoo.com',
  subject: 'Sending Email using Node.js',
  text: 'That was easy!'
};



router.post('/sendinvite', function (req, res, next) {
  var email = req.body.email;
  var toemail = req.body.toemail;
  var subject = 'Invitation to join my app';
  var text = 'You have been invited to join my app. Please click on the link below to join.' + LINK + token;
  var mailOptions = {
    from: email,
    to: toemail,
    subject: subject,
    text: text
  };
  db.createInvitation(email, toemail, token, function (err, result) {
    if (err) {
      console.log(err);
    }
    else {
      console.log(result);
    }
  });
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
});

router.post('/frominvite', function (req, res, next) {
  var token = req.body.token;
  var salt = crypto.randomBytes(16);
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function (err, hashedPassword) {
    if (err) { return next(err); }
    db.run('INSERT INTO users (username, hashed_password, email, salt) VALUES (?, ?, ?, ?)', [
      req.body.username,
      hashedPassword,
      req.body.email,
      salt
    ], function (err) {
      if (err) { return next(err); }
      
    });
    friend=db.run('SELECT username FROM invites WHERE token = ?', [token], function (err) {
      if (err) { return next(err); }
    });
    db.run('DELETE FROM invites WHERE token = ?', [token], function (err) {
      if (err) { return next(err); }
    });
    db.run('INSERT INTO friends (username, friend) VALUES (?, ?)', [
      req.body.username,
      friend
    ], function (err) {
      if (err) { return next(err); }
      var user = {
        id: this.lastID,
        username: req.body.username
      };
      req.login(user, function (err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
    });
  });
});


module.exports = router;
