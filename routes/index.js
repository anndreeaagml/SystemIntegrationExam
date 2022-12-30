var express = require("express");
var ensureLogIn = require("connect-ensure-login").ensureLoggedIn;
var nodemailer = require("nodemailer");
const { token } = require("morgan");
const passport = require("passport");
uuidv4 = require("uuid").v4;
var ensureLoggedIn = ensureLogIn();
const multer = require('multer');
const fs = require('fs');
const uplDB = require('../uploads/notimportant');

var options = {
  root: __dirname + "/../var/db/",
  dotfiles: "deny",
  headers: {
    "x-timestamp": Date.now(),
    "x-sent": true,
  },
};
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});
var upload = multer({ storage: storage });

const { BlobServiceClient, StorageSharedKeyCredential } = require("@azure/storage-blob");


const account = "sysint";
const sas = "?sv=2021-06-08&ss=bfqt&srt=sco&sp=rwdlacupyx&se=2023-01-31T20:54:39Z&st=2022-12-01T12:54:39Z&sip=0.0.0.0-255.255.255.255&spr=https,http&sig=UUFZl8OMYLIpv75pNpcDFJOvf3%2FFRrnm8VHpVC9Ijyw%3D";

const blobServiceClient = new BlobServiceClient(`https://${account}.blob.core.windows.net${sas}`);

goatcontainer = blobServiceClient.getContainerClient("goat");

const Database = require("better-sqlite3");
const db2 = new Database("./var/db/giftshop.db", { verbose: console.log });

var crypto = require("crypto");

var router = express.Router();
LINK = "https://threeam.onrender.com/invite?token=";
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

/**
 * @swagger
 * tags:
 *   name: API
 *   description: API for the Goat Gift Shop
 */

/**
 * @swagger
 * /sendinvite:
 *   post:
 *     summary: Send an invite to a user
 *     tags: [Invite]
 *     requestBody:
 *       description: Send an invite to a user
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               toemail:
 *                 type: string
 *                 description: The email address to send the invite to
 *                 example: examlple@email.com
 *               url:
 *                 type: string
 *                 description: The url to the site where the token will be used
 *                 example: https://example.com/invite
 *               manual_input:
 *                 type: string
 *                 description: Optional. If it has any value, the invite will be sent with a token that the user will have to manually input in the url.
 *                 example: Overwrite this with any value to send a manual input invite. Leave it blank to send a link with the token in the url i.e. https://example.com/?token=123456789
 *                 required: false
 *     responses:
 *       400:
 *         description: You must be logged in to send invites.
 *       401:
 *         description: You must provide an email address to send an invite to.
 *       402:
 *         description: Oh..you forgot to put the url to the site
 *       200:
 *         description: Send an invite to a user
 */

router.post("/sendinvite", async function (req, res, next) {
  if (!req.user) {
    res.send(400, { message: "You must be logged in to send invites." });
    return;
  }
  if (!req.body.toemail) {
    res.send(401, { message: "You must provide an email address to send an invite to." });
    return;
  }
  if (!req.body.url) {
    res.send(402, { message: "Oh..you forgot to put the url to the site" });
    return;
  }
  var user = req.user.username;
  var email = await db2.prepare("SELECT email FROM users WHERE name = ?").get(user);
  var toemail = req.body.toemail;
  var url = req.body.url;
  var subject = "Invitation to join my app";
  var token = uuidv4();
  var text = "You have been invited by " + email.email + " to join my app. Please click on the link below to join: " + url + token;
  if (req.body.manual_input) {
    text = "You have been invited by " + email.email + " to join my app. Please enter the token: " + token + " in the following link: " + url;
  }
  var mailOptions = {
    from: email.email,
    to: toemail,
    subject: subject,
    text: text,
  };
  try {
  db2.prepare("INSERT INTO invites (token, invitee_email, invited_email) VALUES (?, ? ,?)").run(token, email.email, toemail);
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
  res.send({ message: "Invitation sent" });
  uplDB();
  } catch (err) {
    console.log(err);
    if (err.code == "SQLITE_CONSTRAINT_UNIQUE") {
      res.send({ message: "You have already sent an invite to this email address." });
      return;
    }
    res.send({ message: "Error sending invitation" });
    return;
  }

});

/**
 * @swagger
 * /updateuser:
 *   put:
 *     summary: Updates a user's information
 *     tags: [API]
 *     requestBody:
 *       description: Uploads a image to update the user's profile picture
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: image
 *                 description: The image to update the user's profile picture with
 *                 example: image
 *     responses:
 *       200:
 *         description: User updated
 */

router.put("/updateuser", upload.single('image'), async function (req, res, next) {
  if (!req.user) {
    res.send({ message: "You must be logged in to update your profile." });
    return;
  }
  var user = req.user.username;
  //var image = req.files[0];
  const image = req.image;
  const blobName = user + ".jpeg";
  console.log(req.file.originalname);
  // Get a block blob client
  const blockBlobClient = goatcontainer.getBlockBlobClient(blobName);

  // Display blob name and url
  console.log(
    `\nUploading to Azure storage as blob\n\tname: ${blobName}:\n\tURL: ${blockBlobClient.url}`
  );

  const path = "./uploads/" + req.file.originalname;
  // Upload data to the blob
  const data = 'Hello, World!';
  const uploadBlobResponse = await blockBlobClient.uploadFile(path);
  console.log(
    `Blob was uploaded successfully. requestId: ${uploadBlobResponse.requestId}`
  );
  db2.prepare("UPDATE users SET image_url = ? WHERE name = ?").run(blockBlobClient.url, user);
  uplDB();


  try {
    fs.unlinkSync(path)
    //file removed
  } catch (err) {
    console.error(err)
  }
  var link = db2.prepare("SELECT image_url FROM users WHERE name = ?").get(user);
  res.send({ message: link.image_url });

});

/**
 * @swagger
 * /invite:
 *   post:
 *     summary: Confirm an invite
 *     tags: [Invite]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *           example: aaaabaca-1234-4e96-b688-7c380d246d6d
 *         required: true
 *         description: The token of the invite
 *     requestBody:
 *       description: Confirm an invite
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The username of the user
 *                 example: JohnnyBoy
 *               password:
 *                 type: string
 *                 description: The password of the user
 *                 example: Password123
 *               email:
 *                 type: string
 *                 description: The email of the user
 *                 example: email@email.com
 *     responses:
 *       200:
 *         description: Confirmation of invite
 */

router.post("/invite", async function (req, res, next) {
  var token = req.query.token;
  var salt = crypto.randomBytes(16);
  try{
  db2.prepare("INSERT INTO users (name, password,email, salt) VALUES (?, ?, ?, ?)")
    .run(
      req.body.username,
      crypto
        .pbkdf2Sync(req.body.password, salt, 1000, 64, "sha512")
        .toString("hex"),
      req.body.email,
      salt.toString("hex")
    );
  } catch (err) {
    res.send({ message: "Username or email already exists" });
    return;
  }
  var friend = await db2.prepare("SELECT invited_email FROM invites WHERE token = ?").get(token);
  db2.prepare("DELETE FROM invites WHERE token = ?").run(token);
  db2.prepare("INSERT INTO friends (name, friend) VALUES (?, ?)").run(req.body.username, friend.invited_email);
  uplDB();
  res.send({ message: "Invitation accepted" });
});

/**
 * @swagger
 * /logo:
 *   get:
 *     summary: Get the logo
 *     tags: [API]
 *     responses:
 *       200:
 *         description: Get the logo
 */

router.get("/logo", async function (req, res, next) {
  res.send('<img src="https://sysint.blob.core.windows.net/goat/andreeafdf.jpeg?sv=2021-06-08&ss=bfqt&srt=sco&sp=rwdlacupyx&se=2023-01-31T20:54:39Z&st=2022-12-01T12:54:39Z&sip=0.0.0.0-255.255.255.255&spr=https,http&sig=UUFZl8OMYLIpv75pNpcDFJOvf3%2FFRrnm8VHpVC9Ijyw%3D" alt="logo" />');

});

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get the user's information
 *     tags: [API]
 *     responses:
 *       200:
 *        description: Get the user's information
 *        content:
 *         application/json:
 *             schema:
 *              type: object
 *              properties:
 *                username:
 *                  type: string
 *                  description: The username of the user
 *                  example: JohnnyBoy
 *                email:
 *                  type: string
 *                  description: The email of the user
 *                  example: example@example.com
 *                id:
 *                  type: integer
 *                  description: The id of the user
 *                  example: 1
 *                image_url:
 *                  type: string
 *                  description: The image url of the user
 *                  example: https://sysint.blob.core.windows.net/goat/andreeafdf.jpeg?sv=2021-06-08&ss=bfqt&srt=sco&sp=rwdlacupyx&se=2023-01-31T20:54:39Z&st=2022-12-01T12:54:39Z&sip=
 * 
 */

router.get('/user', function (req, res) {
  username = req.user.username;
  console.log(req);
  row = db2.prepare("SELECT * FROM users WHERE name = ?").get(username);
  return res.send({ username: username, email: row.email, id: row.user_id, image_url: row.image_url });
});
module.exports = router;
