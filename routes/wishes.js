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
 *     tags: [Wishlist]
 *     requestBody:
 *       description: Add a wish to a user's wishlist
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: string
 *                 description: The product_id of the product to add to the wishlist
 *                 example: 1444
 *     responses:
 *       401:
 *         description: You must be logged in to add wishes.
 *       400:
 *         description: You must specify a product_id to add
 *       200:
 *         description: Add a wish to a user's wishlist
 */

router.post("/wishes", async function (req, res, next) {
  if (!req.user) {
    res.send(401, { message: "You must be logged in to add wishes." });
    return;
  }
  if (!req.body.product_id) {
    res.send(400, { message: "You must specify a product_id to add" });
    return;
  }
  var user = req.user.username;
  var date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  var user_id = await db2.prepare("SELECT user_id FROM users WHERE name = ?").get(user);
  var prod_id = req.body.product_id;

  db2.prepare("INSERT INTO wishes (user_id, product_id, date_added) VALUES (?, ?, ?)").run(user_id.user_id, prod_id, date);
  uplDB();
  res.send({ message: "Wish added" });
});

/**
 * @swagger
 * /wishes:
 *   delete:
 *     summary: Remove a wish from a user's wishlist
 *     tags: [Wishlist]
 *     requestBody:
 *       description: Remove a wish from a user's wishlist
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: string
 *                 description: The product_id of the product to remove from the wishlist
 *                 example: 1444
 *     responses:
 *       401:
 *         description: You must be logged in to remove wishes.
 *       400:
 *         description: You must specify a product_id to remove
 *       200:
 *         description: Remove a wish from a user's wishlist
 */

router.delete("/wishes", async function (req, res, next) {
  if (!req.user) {
    res.send(401, { message: "You must be logged in to remove wishes." });
    return;
  }
  if (!req.body.product_id) {
    res.send(400, { message: "You must specify a product_id to remove" });
    return;
  }
  var user = req.user.username;
  var user_id = await db2.prepare("SELECT user_id FROM users WHERE name = ?").get(user);
  var prod_id = req.body.product_id;


  db2.prepare("DELETE FROM wishes WHERE user_id = ? AND product_id = ?").run(user_id.user_id, prod_id);
  uplDB();
  res.send({ message: "Wish removed" });
});

/**
 * @swagger
 * /wishes:
 *   get:
 *     summary: Get a user's wishlist
 *     tags: [Wishlist]
 *     responses:
 *       401:
 *         description: You must be logged in to get your wishlist.
 *       400:
 *         description: You must specify a product_id to remove
 *       200:
 *         description: Get a user's wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 wishes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       product_id:
 *                         type: string
 *                         description: The product_id of the product to remove from the wishlist
 *                         example: 1444
 *                       date_added:
 *                         type: string
 *                         description: The date the product was added to the wishlist
 *                         example: 2021-04-01 12:00:00
 *                       user_id:
 *                         type: string
 *                         description: The user_id of the user who added the product to the wishlist
 *                         example: 1
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

/**
 * @swagger
 * /feed:
 *   get:
 *     summary: Get a user's wishlist
 *     tags: [Wishlist]
 *     responses:
 *       200:
 *         description: Get the wishlist feed
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 */
router.get("/feed", async function (req, res, next) {
  var feed = new Feed({
    title: "Feed Goat",
    description: "This is the feed for the Goat Gift Shop",
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

  var wishes = await db2.prepare("SELECT * from wishes ORDER BY date_added DESC LIMIT 10").all();
  wishes.forEach(wish => {
    console.log(wish);
    feed.addItem({
      title: "New Wish",
      description: wish.user_id + " added a new item to their wishlist",
      content: wish.user_id + " added item no." + wish.product_id + " to their wishlist",
      author: [
        {
          name: wish.user_id
        }
      ],
      date: new Date(wish.date_added)
    });
  });

  res.send(200, feed.atom1());
});

module.exports = router;
