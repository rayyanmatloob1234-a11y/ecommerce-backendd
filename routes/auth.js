const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');

const usersFilePath = path.join(__dirname, '..', 'users.json');

function readUsers() {
  return JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
}
function writeUsers(users) {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}
function publicUser(u) {
  const { password, ...rest } = u;
  return rest;
}

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, address, billing } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const users = readUsers();
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      role: users.length === 0 ? 'admin' : 'user',
      phone: phone || null,
      address: address || null,
      billing: billing || null,
    };

    users.push(newUser);
    writeUsers(users);

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user: publicUser(newUser) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Please fill all fields' });

    const users = readUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/profile', verifyToken, (req, res) => {
  try {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === req.user.id);
    if (idx === -1) return res.status(404).json({ message: 'User not found' });

    const { phone, address, billing, name } = req.body;
    if (name) users[idx].name = name;
    if (phone) users[idx].phone = phone;
    if (address) users[idx].address = address;
    if (billing) users[idx].billing = billing;

    writeUsers(users);
    res.json({ user: publicUser(users[idx]) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;