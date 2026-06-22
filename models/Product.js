const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, default: '' },
  description: { type: String, required: true },
  category: { type: String, required: true },
  stock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  freeShipping: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);