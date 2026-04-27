const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files and root assets
app.use(express.static(path.join(__dirname, 'frontend/public')));
app.use(express.static(path.join(__dirname))); // To serve logo1.png and logo2.png from root

// Database connection
const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/carbuddy';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));

// Fallback to index.html for SPA (though we use multiple html files, it's good practice)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
