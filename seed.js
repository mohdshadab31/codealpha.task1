require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const products = [
  {
    name: "Wireless Headphones",
    description: "Comfortable Bluetooth headphones with deep bass and long battery life.",
    price: 1499,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    stock: 25
  },
  {
    name: "Smart Watch",
    description: "Fitness tracking, notifications and a bright touch display.",
    price: 2299,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80",
    stock: 18
  },
  {
    name: "Running Shoes",
    description: "Lightweight everyday running shoes with comfortable cushioning.",
    price: 1999,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    stock: 30
  },
  {
    name: "Backpack",
    description: "Water-resistant backpack suitable for college and travel.",
    price: 999,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    stock: 40
  },
  {
    name: "Mechanical Keyboard",
    description: "Tactile mechanical keyboard designed for coding and gaming.",
    price: 2499,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80",
    stock: 12
  },
  {
    name: "Classic Hoodie",
    description: "Soft cotton-blend hoodie for a clean casual look.",
    price: 1299,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80",
    stock: 22
  }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Product.deleteMany({});
  await Product.insertMany(products);
  console.log("Products seeded successfully.");
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
