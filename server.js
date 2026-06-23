require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const { verifyAdmin } = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());

const productsFile = path.join(__dirname, 'products.json');

const getProducts = () => {
  if (!fs.existsSync(productsFile)) return [];
  return JSON.parse(fs.readFileSync(productsFile));
};

const saveProducts = (products) => {
  fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
};

app.use('/api/auth', authRoutes);

app.get('/api/products', (req, res) => {
  let products = getProducts();
  const { search, category } = req.query;
  if (search) products = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  if (category) products = products.filter(p => p.category === category);
  res.json(products);
});

app.get('/api/products/:id', (req, res) => {
  const products = getProducts();
  const product = products.find(p => p._id === req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

app.post('/api/products', verifyAdmin, (req, res) => {
  const products = getProducts();
  const newProduct = { ...req.body, _id: Date.now().toString() };
  products.push(newProduct);
  saveProducts(products);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', verifyAdmin, (req, res) => {
  let products = getProducts();
  products = products.map(p => p._id === req.params.id ? { ...p, ...req.body } : p);
  saveProducts(products);
  res.json(products.find(p => p._id === req.params.id));
});

app.delete('/api/products/:id', verifyAdmin, (req, res) => {
  let products = getProducts();
  products = products.filter(p => p._id !== req.params.id);
  saveProducts(products);
  res.json({ message: 'Product deleted' });
});

app.listen(5000, () => console.log('🚀 Server running on port 5000'));