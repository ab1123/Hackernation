const express = require("express");
const Article = require("../model/article");
const router = express.Router();

// Manual trigger for fetching news
router.post("/fetch-news", async (req, res) => {
  try {
    await require("../Controllers/fetchData")(); // Ensure controller path and name is correct
    res.status(200).send("News data fetched and stored.");
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch news", error: error.message });
  }
});

// Get all articles' titles and images
router.get("/articles", async (req, res) => {
  try {
    const articles = await Article.find({}, "title slug image -_id").exec();
    res.status(200).json(articles);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error accessing articles", error: error.message });
  }
});

// Get full article by slug instead of ID
router.get("/articles/:slug", async (req, res) => {
  const { slug } = req.params;
  try {
    const article = await Article.findOne({ slug: slug });
    if (!article) {
      return res.status(404).send("Article not found");
    }
    res.status(200).json(article);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error finding the article", error: error.message });
  }
});

module.exports = router;
