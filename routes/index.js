var express = require("express");
var ensureLogIn = require("connect-ensure-login").ensureLoggedIn;
var db = require("../db");
var nodemailer = require("nodemailer");
const { token } = require("morgan");
const passport = require("passport");
uuidv4 = require("uuid").v4;
var ensureLoggedIn = ensureLogIn();

var options = {
  root: __dirname + "/../var/db/",
  dotfiles: "deny",
  headers: {
    "x-timestamp": Date.now(),
    "x-sent": true,
  },
};
const Database = require("better-sqlite3");
const db2 = new Database("./var/db/giftshop.db", { verbose: console.log });

var crypto = require("crypto");

var router = express.Router();
LINK = "http://localhost:3000/invite?token=";
/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("home", { title: "Express" });
});

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "3am.noreply@gmail.com",
    pass: "jiupqoryzvotgxvf",
  },
});

router.post("/sendinvite", async function (req, res, next) {
  //res.locals.currentUser = req.user;
  var user = req.user.username;
  console.log(user);
  console.log(req.user);
  var email = await db2.prepare("SELECT email FROM users WHERE name = ?").get(user);
  console.log(email);
  var toemail = req.body.toemail;
  var subject = "Invitation to join my app";
  var token = uuidv4();
  var text = "You have been invited by " + email.email + " to join my app. Please click on the link below to join." + LINK + token;
  var mailOptions = {
    from: email.email,
    to: toemail,
    subject: subject,
    text: text,
  };

  db2.prepare("INSERT INTO invites (token, invitee_email, invited_email) VALUES (?, ? ,?)").run(token, email.email, toemail);
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
  res.redirect("/");

});

router.post("/invite", async function (req, res, next) {
  var token = req.query.token;
  var salt = crypto.randomBytes(16);
  db2.prepare("INSERT INTO users (name, password,email, salt) VALUES (?, ?, ?, ?)")
    .run(
      req.body.username,
      crypto
        .pbkdf2Sync(req.body.password, salt, 1000, 64, "sha512")
        .toString("hex"),
      req.body.email,
      salt.toString("hex")
    );
  var friend = await db2.prepare("SELECT invited_email FROM invites WHERE token = ?").get(token);
  db2.prepare("DELETE FROM invites WHERE token = ?").run(token);
  db2.prepare("INSERT INTO friends (name, friend) VALUES (?, ?)").run(req.body.username, friend.invited_email);

  res.redirect("/login");
});

router.get("/logo", async function (req, res, next) {
  res.send('<img src="https://sysint.blob.core.windows.net/public/314588897_649909553448250_8583662883149238973_n.png" alt="logo" />');
});

module.exports = router;
