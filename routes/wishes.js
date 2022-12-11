var express = require("express");
const Feed = require('feed').Feed;
var ensureLogIn = require("connect-ensure-login").ensureLoggedIn;
const { token } = require("morgan");
const passport = require("passport");
uuidv4 = require("uuid").v4;
var ensureLoggedIn = ensureLogIn();
const multer = require('multer');
const fs = require('fs');

const Database = require("better-sqlite3");
const db2 = new Database("./var/db/giftshop.db", { verbose: console.log });

var crypto = require("crypto");

var router = express.Router();

const feed = new Feed({
  title: "Feed Title",
  description: "This is my personal feed!",
  id: "http://example.com/",
  link: "http://example.com/",
  language: "en", // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
  image: "http://example.com/image.png",
  favicon: "http://example.com/favicon.ico",
  copyright: "All rights reserved 2013, John Doe",
  feedLinks: {
    json: "https://example.com/json",
    atom: "https://example.com/atom"
  },
  author: {
    name: "John Doe",
    email: "johndoe@example.com",
    link: "https://example.com/johndoe"
  }
});


/**
 * @swagger
 * tags:
 *   name: API
 *   description: API for the Goat Gift Shop
 */

/**
 * @swagger
 * /wishes:
 *   post:
 *     summary: Add a wish to a user's wishlist
 *     tags: [API]
 *     responses:
 *       200:
 *         description: Add a wish to a user's wishlist
 */

router.post("/wishes", async function (req, res, next) {
  if (!req.user) {
    res.send({ message: "You must be logged in to add wishes." });
    return;
  }
  if (!req.body.product_id) {
    res.send({ message: "You must specify a product_id to add" });
    return;
  }
  var user = req.user.username;
  var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  var user_id = await db2.prepare("SELECT user_id FROM users WHERE name = ?").get(user);
  var prod_id = req.body.product_id;





  db2.prepare("INSERT INTO wishes (user_id, product_id, date_added) VALUES (?, ?, ?)").run(user_id.user_id, prod_id, date);
  feed.addItem({
    title: "New Wish",
    id: "post.url",
    link: "post.url",
    description: "post.description",
    content: "post.content",
    author: [
      {
        name: "Jane Doe",
        email: "janedoe@example.com",
        link: "https://example.com/janedoe"
      }
    ],
    contributor: [
      {
        name: "Shawn Kemp",
        email: "shawnkemp@example.com",
        link: "https://example.com/shawnkemp"
      }
    ],
    date: new Date(),
    image: "post.image"
  });
  var x = feed.atom1();

  fs.writeFile('feed.xml', x, function (err) {
    if (err) throw err;
    console.log('Saved!');
  });
  res.send({ message: "Wish added" });
});

/**
 * @swagger
 * /wishes:
 *   delete:
 *     summary: Remove a wish from a user's wishlist
 *     tags: [API]
 *     responses:
 *       200:
 *         description: Remove a wish from a user's wishlist
 */

router.delete("/wishes", async function (req, res, next) {
  if (!req.user) {
    res.send({ message: "You must be logged in to remove wishes." });
    return;
  }
  if (!req.body.product_id) {
    res.send({ message: "You must specify a product_id to remove" });
    return;
  }
  var user = req.user.username;
  var user_id = await db2.prepare("SELECT user_id FROM users WHERE name = ?").get(user);
  var prod_id = req.body.product_id;


  db2.prepare("DELETE FROM wishes WHERE user_id = ? AND product_id = ?").run(user_id.user_id, prod_id);
  res.send({ message: "Wish removed" });
});

/**
 * @swagger
 * /wishes:
 *   get:
 *     summary: Get a user's wishlist
 *     tags: [API]
 *     responses:
 *       200:
 *         description: Get a user's wishlist
 */

router.get("/wishes", async function (req, res, next) {
  if (!req.user) {
    res.send({ message: "You must be logged in to view wishes." });
    return;
  }
  var user = req.user.username;
  var user_id = await db2.prepare("SELECT user_id FROM users WHERE name = ?").get(user);
  //var prod_id = req.body.product_id;


  var wishes = await db2.prepare("SELECT * from wishes where user_id = ?").all(user_id.user_id);
  res.send({ wishes });
});

module.exports = router;
