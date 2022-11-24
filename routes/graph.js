var express = require('express');
var { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');


const Database = require("better-sqlite3");
const db2 = new Database("./var/db/giftshop.db", { verbose: console.log });

var schema = buildSchema(`

type Product {
    id: Int!
    product_name: String!
    product_sub_title: String
    product_description: String
    main_category: String
    sub_category: String
    price: Float
    link: String
    overall_rating: Float
}

type Query {
    wow(i:Int): String
  }
`);


// The root provides a resolver function for each API endpoint
var root = {
    wow: (args) => {
        return "Wow! That number you passed in is " + args.i + "!";
    },
};
var graphqlRouter = express.Router();
graphqlRouter.use('/', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));

module.exports = graphqlRouter;