
const typeDefs = `#graphql 
type Product {
    id: Int!
    product_name: String!
    product_sub_title: String
    product_description: String
    main_category: String
    sub_category: String
    price: Double
    link: String
    overall_rating: Double
}
`;
exports.typeDefs = typeDefs;