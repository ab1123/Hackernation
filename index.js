const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const articleRoutes = require('./routes/articleRoutes');
require('dotenv');

const app = express();
app.use(
  cors({
    origin: 'http://localhost:4321',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use('/api', articleRoutes);

const PORT = process.env.PORT || 3000;
mongoose
  .connect(
    'mongodb+srv://onlyforcocindia:OCbWfLiYTVGXi7e1@hackernation.9xavz.mongodb.net/?retryWrites=true&w=majority&appName=Hackernation'
  )
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => console.log('Failed to connect to MongoDB', err));
