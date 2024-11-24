const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true },
  slug: String,
  description: String,
  content: String,
  keywords: String,
  type: String,
  website: String,
  about: String,
  image: String,
  source: { type: String, default: "Unknown" }, // New field for the source of the news
  publishedAt: { type: Date }, // New field for publish time
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Article', articleSchema);
