var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var crypto = require('crypto');
var db = require('../db');
const app = require('../app');
const signature = require('cookie-signature');


/* Configure password authentication strategy.
 *
 * The `LocalStrategy` authenticates users by verifying a username and password.
 * The strategy parses the username and password from the request and calls the
 * `verify` function.
 *
 * The `verify` function queries the database for the user record and verifies
 * the password by hashing the password supplied by the user and comparing it to
 * the hashed password stored in the database.  If the comparison succeeds, the
 * user is authenticated; otherwise, not.
 */
passport.use(new LocalStrategy(function verify(username, password, cb) {
  db.get('SELECT * FROM users WHERE name = ?', [username], function (err, row) {
    if (err) { return cb(err); }
    if (!row) { return cb(null, false, { message: 'Incorrect username or password.' }); }

    crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', function (err, Password) {
      if (err) { return cb(err); }
      if (!crypto.timingSafeEqual(row.password, Password)) {
        return cb(null, false, { message: 'Incorrect username or password.' });
      }
      return cb(null, row);
    });
  });
}));

/* Configure session management.
 *
 * When a login session is established, information about the user will be
 * stored in the session.  This information is supplied by the `serializeUser`
 * function, which is yielding the user ID and username.
 *
 * As the user interacts with the app, subsequent requests will be authenticated
 * by verifying the session.  The same user information that was serialized at
 * session establishment will be restored when the session is authenticated by
 * the `deserializeUser` function.
 *
 * Since every request to the app needs the user ID and username, in order to
 * fetch todo records and render the user element in the navigation bar, that
 * information is stored in the session.
 */
passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { id: user.user_id, username: user.name });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});


var router = express.Router();

/* GET /login
 *
 * This route prompts the user to log in.
 *
 * The 'login' view renders an HTML form, into which the user enters their
 * username and password.  When the user submits the form, a request will be
 * sent to the `POST /login/password` route.

router.get('/login', function (req, res, next) {
  res.render('login');
});

/* POST /login/password
 *
 * This route authenticates the user by verifying a username and password.
 *
 * A username and password are submitted to this route via an HTML form, which
 * was rendered by the `GET /login` route.  The username and password is
 * authenticated using the `local` strategy.  The strategy will parse the
 * username and password from the request and call the `verify` function.
 *
 * Upon successful authentication, a login session will be established.  As the
 * user interacts with the app, by clicking links and submitting forms, the
 * subsequent requests will be authenticated by verifying the session.
 *
 * When authentication fails, the user will be re-prompted to login and shown
 * a message informing them of what went wrong.
 */


/**
 * @swagger
 * /login:
 *   get:
 *     summary: Login page
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Login page
 */

router.get('/login', function (req, res) {
  res.send({ message: 'Here you can log in' });
});

/**
 * @swagger
 * /login/password:
 *   post:
 *     summary: Login with password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username
 *               password:
 *                 type: string
 *                 description: Password
 *             example:
 *               username: JohnnyBoy
 *               password: Password123
 *     responses:
 *       400:
 *         description: Please fill out all fields
 *       401:
 *         description: authentication failed
 *       500:
 *         description: Internal server error
 *       200:
 *         description: Logged in successfully
 */

router.post('/login/password', function (req, res, next) {
  
  if (!req.body.username || !req.body.password) {
    return res.status(400).send({ message: 'Please fill out all fields' });
  }
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      return next(err); // will generate a 500 error
    }
    // Generate a JSON response reflecting authentication status
    if (!user) {
      return res.send(401, { success: false, message: 'authentication failed' });
    }
    
    req.login(user, function (err) {
      if (err) {
        return next(err);
      }
      
      return res.cookie('connect.sid', 's:' + signature.sign(req.sessionID, 'keyboard cat'), { httpOnly: true }).status(200).send(JSON.stringify({ message: 'Logged in successfully' }));

    });
  })(req, res, next);
});

/* POST /logout
 *
 * This route logs the user out.
 */

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logout page
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Loged out successfully
 */

router.post('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.status(200).send({ message: 'Logout successful' });
  });
});

/**
 * @swagger
 * /:
 *   GET:
 *     summary: Get home page
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Get home page
 */

router.get('/', function (req, res) {
  res.send({ message: 'Hello there! Group 3am in the house!' });
});
/* GET /signup
 *
 * This route prompts the user to sign up.
 *
 * The 'signup' view renders an HTML form, into which the user enters their
 * desired username and password.  When the user submits the form, a request
 * will be sent to the `POST /signup` route.
 *
router.get('/signup', function (req, res, next) {
  res.render('signup');
});
*/
/* POST /signup
 *
 * This route creates a new user account.
 *
 * A desired username and password are submitted to this route via an HTML form,
 * which was rendered by the `GET /signup` route.  The password is hashed and
 * then a new user record is inserted into the database.  If the record is
 * successfully created, the user is logged in.
 */

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Signup page
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Username
 *               password:
 *                 type: string
 *                 description: Password
 *               email:
 *                 type: string
 *                 description: Email
 *             example:
 *               username: JohnnyBoy
 *               password: Password123
 *               email: email@email.com
 *     responses:
 *      400:
 *        description: Bad request
 *      500:
 *        description: Internal server error
 *      200:
 *        description: Signup successful
 */

router.post('/signup', function (req, res, next) {
  if (!req.body.username || !req.body.password) {
    return res.status(400).send({ message: 'Please fill out all fields' });
  }
  if (req.body.password.length < 8) {
    return res.status(400).send({ message: 'Password must be at least 8 characters long' });
  }
  if (req.body.username.length < 5) {
    return res.status(400).send({ message: 'Username must be at least 5 characters long' });
  }
  if (req.body.username.length > 20) {
    return res.status(400).send({ message: 'Username must be less than 20 characters long' });
  }
  if (req.body.password.length > 20) {
    return res.status(400).send({ message: 'Password must be less than 20 characters long' });
  }
  if (req.body.username.match(/^[a-zA-Z0-9]+$/) == null) {
    return res.status(400).send({ message: 'Username can only contain letters and numbers' });
  }

  if (req.body.email.match(/^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]+$/) == null) {
    return res.status(400).send({ message: 'Email must be in the format of example@example.example' });
  }
  if (req.body.email.length > 50) {
    return res.status(400).send({ message: 'Email must be less than 50 characters long' });
  }
  if (req.body.email.length < 5) {
    return res.status(400).send({ message: 'Email must be at least 5 characters long' });
  }

  var salt = crypto.randomBytes(16);
  db.run(
    "INSERT INTO users (name, password, salt, email) VALUES (?, ?, ?, ?)",
    [
      req.body.username,
      crypto.pbkdf2Sync(req.body.password, salt, 310000, 32, "sha256"),
      salt,
      req.body.email,
    ],
    function (err) {
      if (err) { return next(err); }
      req.login({ id: this.lastID, username: req.body.username }, function (err) {
        if (err) { return next(err); }
        res.send({ message: 'username: ' + req.body.username + ' email: ' + req.body.email });
      });
    }
  );
});


module.exports = router;
