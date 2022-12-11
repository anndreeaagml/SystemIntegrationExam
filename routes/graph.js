var express = require('express');
var { graphqlHTTP } = require('express-graphql');
var { buildSchema } = require('graphql');



const Database = require("better-sqlite3");
const db2 = new Database("./var/db/products.db", { verbose: console.log });

var schema = buildSchema(`

type Product {
    id: String!
    product_name: String!
    product_sub_title: String
    product_description: String
    main_category: String
    sub_category: String
    price: Float
    link: String
    overall_rating: Float
    product_images: [ProductImage]
    product_additional_info: [ProductAdditionalInfo]
}

type ProductImage {
    product_id: String!
    image_url: String
    alt_text: String
    additional_info: String
}

type ProductAdditionalInfo {
    product_id: String!
    choices: String
    additional_info: String
}

type Query {
    Search(keyword:String): [Product],
    GetProduct(id:String): Product,
    GetAllProducts: [Product]
  }
`);


// The root provides a resolver function for each API endpoint
var root = {
    Search: async (args) => {
        var x = await db2.prepare("SELECT * FROM products WHERE product_name LIKE ?").all("%" + args.keyword + "%");
        x.forEach(element => {
            element.product_images = db2.prepare("SELECT * FROM product_images WHERE product_id = ?").all(element.id);
            element.product_additional_info = db2.prepare("SELECT * FROM products_additional_info WHERE product_id = ?").all(element.id);
        });
        return x;
    },
    GetProduct: async (args) => {
        var x = await db2.prepare("SELECT * FROM products WHERE id = ?").get(args.id);
        if (x.price == null) x.price = 0;
        if (x.overall_rating == null) x.overall_rating = 0;

        x.product_images = db2.prepare("SELECT * FROM product_images WHERE product_id = ?").all(x.id);
        x.product_additional_info = db2.prepare("SELECT * FROM products_additional_info WHERE product_id = ?").all(x.id);
        return x;
    },
    GetAllProducts: async () => {
        var x = await db2.prepare("SELECT * FROM products").all();
        x.forEach(element => {
            if (element.price == null) x.price = 0;
            if (element.overall_rating == null) x.overall_rating = 0;
            element.product_images = db2.prepare("SELECT * FROM product_images WHERE product_id = ?").all(element.id);
            element.product_additional_info = db2.prepare("SELECT * FROM products_additional_info WHERE product_id = ?").all(element.id);
        });
        return x;
    },
};
var graphqlRouter = express.Router();

/**
 * @swagger
 * /graphql:
 *   post:
 *     summary: Search for a product
 *     tags: [API]
 *     responses:
 *       200:
 *         description: Search for a product
 */
graphqlRouter.use('/', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));

module.exports = graphqlRouter;