var express = require('express');
var { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');


const Database = require("better-sqlite3");
const db2 = new Database("./var/db/products.db", { verbose: console.log });

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


type Product_test {
    id: Int
    product_name: String
}

type Query {
    Search(keyword:String): [Product_test]
  }
`);


// The root provides a resolver function for each API endpoint
var root = {
    Search: async (args) => {
        var x = await db2.prepare("SELECT * FROM products_test WHERE product_name LIKE ?").all("%" + args.keyword + "%");
        return x;
    }
};
var graphqlRouter = express.Router();
graphqlRouter.use('/', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));

module.exports = graphqlRouter;