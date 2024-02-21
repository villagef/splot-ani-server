const mongoose = require("mongoose");
const express = require("express");
const { gql } = require("apollo-server-express");
const { ApolloServer } = require("apollo-server-express");
const dotenv = require("dotenv");
const cors = require("cors");

const db = process.env.MONGODB_URI || dotenv.config().parsed.MONGODB_URI;

mongoose.connect(db, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const productSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: Number,
  previousPrice: Number,
  smallestPrice: Number,
  category: String,
  quantity: Number,
  slug: String,
  images: [String],
});

const Product = mongoose.model("Product", productSchema);

const typeDefs = gql`
  type Product {
    id: ID!
    name: String!
    description: String!
    price: Float!
    previousPrice: Float
    smallestPrice: Float
    category: String!
    quantity: Int!
    slug: String!
    images: [String]!
  }

  type Query {
    products(page: Int, limit: Int): [Product]
    product(id: ID!): Product
    categoryProducts(category: String!): [Product]
  }

  input ProductInput {
    name: String!
    description: String!
    price: Float!
    previousPrice: Float
    smallestPrice: Float
    category: String!
    quantity: Int!
    slug: String!
    images: [String]!
  }

  type Mutation {
    createProduct(input: ProductInput): Product
    updateProduct(id: ID!, input: ProductInput): Product
    deleteProduct(id: ID!): Product
  }
`;

const resolvers = {
  Query: {
    products: async (parent, args, context, info) => {
      const { page = 1, limit = 4, category } = args;
      const query = category ? { category } : {};

      const products = await Product.find(query)
        .limit(limit)
        .skip((page - 1) * limit);
      return products;
    },
    product: async (parent, args, context, info) => {
      const { id } = args;

      const product = await Product.findById(id);
      return product;
    },
  },
  Mutation: {
    createProduct: async (parent, args, context, info) => {
      const { input } = args;
      const product = await Product.create(input);
      return product;
    },
    updateProduct: async (parent, args, context, info) => {
      const { id, input } = args;

      const product = await Product.findByIdAndUpdate(id, input, { new: true });
      return product;
    },
    deleteProduct: async (parent, args, context, info) => {
      const { id } = args;

      const product = await Product.findByIdAndRemove(id);
      return product;
    },
  },
};

const app = express();
app.use(cors());
const server = new ApolloServer({ typeDefs, resolvers });

async function startApolloServer() {
  await server.start();
  server.applyMiddleware({ app });
}

startApolloServer();

const port = process.env.PORT || 5000;

app.listen({ port: port }, () => {
  console.log("Server ready" + server.graphqlPath);
});
