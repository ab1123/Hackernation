const axios = require("axios");
const Article = require("../model/article"); // Adjust the path as necessary
const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/[\s+]/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");

const api_list = [
  {
    name: "NewsAPI.ai",
    url: "https://newsapi.ai/api/v1/article/getArticles?query=%7B%22%24query%22%3A%7B%22keyword%22%3A%22GENAI%22%2C%22keywordLoc%22%3A%22body%22%2C%22language%22%3A%22en%22%7D%2C%22%24filter%22%3A%7B%22forceMaxDataTimeWindow%22%3A%2231%22%7D%7D&resultType=articles&articlesSortBy=date&apiKey=c7bf79f2-9e7d-4ac6-b047-888cf1b303a3",
  },
  {
    name: "NewsData.io",
    url: "https://newsdata.io/api/1/latest?apikey=pub_53431c4cd9820a4453315adc2b380ed45ec25&q=genAI&language=en", // Added NewsData.io API
  },
  {
    name: "Google News",
    url: "https://news.google.com/rss/search?q=genAI&hl=en-US&gl=US&ceid=US:en", // Added Google News RSS Feed
  },
];

// Common Postman-like headers
const commonHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
};

const formatArticle = async (apiName, article) => {
  // Validate title to contain only English letters, numbers, and basic punctuation
  const englishTitleRegex = /^[a-zA-Z0-9\s,.!?-]+$/;
  const isValidEnglishTitle = englishTitleRegex.test(article.title);

  let fullContent =
    article.content ||
    article.description ||
    article.body ||
    "No content available";
  return {
    title: isValidEnglishTitle ? article.title : "Title not in English",
    slug: slugify(isValidEnglishTitle ? article.title : "no-title"),
    description: article.description || "No description",
    content: fullContent,
    keywords:
      "GenAI,AI," +
      (article.source && article.source.name
        ? article.source.name
        : "No keywords"),
    type: "blog",
    website: apiName,
    about: "GenAI",
    image:
      article.urlToImage || article.image || article.image_url || "No image",
  };
};

const fetchNewsData = async () => {
  for (let api of api_list) {
    try {
      console.log(`Fetching data from ${api.name}...`);
      const response = await axios.get(api.url, {
        headers: { ...commonHeaders, ...(api.headers || {}) },
        decompress: true,
      });

      let articles = [];
      if (api.name === "Google News") {
        const xml2js = require("xml2js");
        const parser = new xml2js.Parser();
        const feed = await parser.parseStringPromise(response.data);
        articles.push(...feed.rss.channel[0].item);
      } else if (api.name === "NewsAPI.ai") {
        articles.push(...response.data.articles.results);
      }

      for (const article of articles) {
        const formattedArticle = await formatArticle(api.name, article);
        // Check if article with the same slug already exists to avoid duplicates
        const existingArticle = await Article.findOne({
          slug: formattedArticle.slug,
        });
        if (!existingArticle) {
          await new Article(formattedArticle).save();
          console.log("Article saved:", formattedArticle.title);
        } else {
          console.log("Duplicate article skipped:", formattedArticle.title);
        }
      }
    } catch (error) {
      console.error(`Error fetching data from ${api.name}:`, error);
    }
  }
};

module.exports = fetchNewsData;
