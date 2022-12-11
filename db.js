var sqlite3 = require("sqlite3");
var mkdirp = require("mkdirp");
var crypto = require("crypto");
uuid4 = require("uuid").v4;
mkdirp.sync("./var/db");

var db = new sqlite3.Database("./var/db/giftshop.db");
var product_db = new sqlite3.Database("./var/db/products.db");

db.serialize(function () {
  // create the database schema for the todos app
  db.run(
    "CREATE TABLE IF NOT EXISTS users ( \
    user_id INTEGER PRIMARY KEY, \
    name TEXT UNIQUE, \
    password BLOB, \
    email TEXT UNIQUE, \
    salt BLOB, \
    image_url TEXT \
  )"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS wishes ( \
    id INTEGER PRIMARY KEY, \
    user_id INTEGER, \
    product_id INTEGER, \
    date_added TEXT \
  )"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS invites ( \
    token TEXT PRIMARY KEY, \
    invitee_email TEXT, \
    invited_email TEXT UNIQUE \
  )"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS friends ( \
    id INTEGER PRIMARY KEY, \
    name TEXT, \
    friend TEXT \
  )"
  );

  product_db.run(
    "CREATE TABLE IF NOT EXISTS products ( \
    id INTEGER PRIMARY KEY, \
    product_name TEXT, \
    product_sub_title TEXT, \
    product_description TEXT, \
    main_category TEXT, \
    sub_category TEXT, \
    price DOUBLE, \
    link TEXT, \
    overall_rating DOUBLE \
  )"
  );

  product_db.run(
    "CREATE TABLE IF NOT EXISTS product_images ( \
    product_id INTEGER PRIMARY KEY, \
    image_url TEXT, \
    alt_text TEXT, \
    additional_info TEXT \
  )"
  );

  product_db.run(
    "CREATE TABLE IF NOT EXISTS products_additional_info ( \
    product_id INTEGER PRIMARY KEY, \
    choices TEXT, \
    additional_info TEXT \
  )"
  );
});

module.exports = db;
