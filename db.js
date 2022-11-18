var sqlite3 = require('sqlite3');
var mkdirp = require('mkdirp');
var crypto = require('crypto');
uuid4= require('uuid').v4;
mkdirp.sync('./var/db');


var db = new sqlite3.Database('./var/db/todos.db');

db.serialize(function() {
  // create the database schema for the todos app
  db.run("CREATE TABLE IF NOT EXISTS users ( \
    id INTEGER PRIMARY KEY, \
    username TEXT UNIQUE, \
    hashed_password BLOB, \
    email TEXT UNIQUE, \
    salt BLOB \
  )");
  db.run("CREATE TABLE IF NOT EXISTS invitations ( \
    token TEXT PRIMARY KEY, \
    email TEXT UNIQUE, \
    invitedby TEXT \
  )");
  db.run("CREATE TABLE IF NOT EXISTS friends ( \
    id INTEGER PRIMARY KEY, \
    username TEXT, \
    friend TEXT \
  )");
  
  
});


db.createUser = function(username, password, email, callback) {
  var salt = crypto.randomBytes(16);
  db.run('INSERT INTO users (username, hashed_password, salt, email) VALUES (?, ?, ?, ?)', [
    username,
    crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256'),
    salt,
    email
  ], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, this.lastID);
  });
}

db.createInvitation = function(email,currentuser, token, callback) {
  db.run('INSERT INTO invitations (token, email, invitedby) VALUES (?, ? ,?)', [
    token,
    email,
    currentuser
  ], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, token);
  });
}

db.checkInvitation = function(token, callback) {
  db.get('SELECT email FROM invitations WHERE token = ?', token, function(err, row) {
    if (err) {
      return callback(err);
    }
    callback(null, row);
  });
}

db.getEmail = function(username, callback) {
  db.get('SELECT email FROM users WHERE username = ?', username, function(err, row) {
    if (err) {
      return callback(err);
    }
    callback(null, row);
  });
}

db.getEmailfromInvite = function(req, token, callback) {
  db.get('SELECT email FROM invitations WHERE token = ?', [token], function(err, row) {
    if (err) {
      return callback(err);
    }
    callback(null, row);
  });
}

db.DeleteAfterInvite = function(token, callback) {
  db.run('DELETE FROM invitations WHERE token = ?', [token], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null,this.lastID);
  });
}

db.addFriend = function(username, email, callback) {
  db.run('INSERT INTO friends (username, friend) VALUES (?, ?)', [
    username,
    email
  ], function(err) {
    if (err) {
      return callback(err);
    }
    callback(null, this.lastID);
  });
}

db.getEmailfromInvite222 = async function(req, token, callback) {
  var email = await db.get('SELECT email FROM invitations WHERE token = ?', token, function(err, row) {
    if (err) {
      return callback(err);
    }

  });
  
}

module.exports = db;

