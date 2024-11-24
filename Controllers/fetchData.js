const axios = require("axios");
const Article = require("../model/article"); // Adjust the path as necessary
const xml2js = require("xml2js"); // For parsing XML (Google News)
const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/[\s+]/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");

// Tags to search for
const tags = [
  "Startups",
  "Top Stories",
  "Remote Work",
  "Tech Stories",
  "Life Hacking",
  "Gaming",
  "Data Science",
  "Programming",
  "Science",
  "Tech Companies",
  "AI",
  "Management",
  "Cybersecurity",
  "Society",
  "Cloud",
  "Web3",
  "Finance",
  "Hackernoon",
  "Product Management",
  "Writing",
  "Business",
  "Futurism",
  "Media",
];

// API configurations
const api_list = [
  {
    name: "NewsAPI.ai",
    baseUrl: "https://newsapi.ai/api/v1/article/getArticles",
    apiKey: "c7bf79f2-9e7d-4ac6-b047-888cf1b303a3",
    type: "json",
    buildUrl: (tag) =>
      `https://newsapi.ai/api/v1/article/getArticles?query=%7B%22%24query%22%3A%7B%22keyword%22%3A%22${encodeURIComponent(
        tag
      )}%22%2C%22keywordLoc%22%3A%22body%22%2C%22language%22%3A%22en%22%7D%2C%22%24filter%22%3A%7B%22forceMaxDataTimeWindow%22%3A%2231%22%7D%7D&resultType=articles&articlesSortBy=date&apiKey=${this.apiKey}`,
  },
  {
    name: "NewsData.io",
    baseUrl: "https://newsdata.io/api/1/latest",
    apiKey: "pub_53431c4cd9820a4453315adc2b380ed45ec25",
    type: "json",
    buildUrl: (tag) =>
      `https://newsdata.io/api/1/latest?apikey=${this.apiKey}&q=${encodeURIComponent(
        tag
      )}&language=en`,
  },
  {
    name: "Google News",
    baseUrl: "https://news.google.com/rss/search",
    type: "rss",
    buildUrl: (tag) =>
      `https://news.google.com/rss/search?q=${encodeURIComponent(
        tag
      )}&hl=en-US&gl=US&ceid=US:en`,
  },
];

// Common headers
const commonHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
};

// Format fetched articles
const formatArticle = async (apiName, article, tag) => {
  const englishTitleRegex = /^[a-zA-Z0-9\s,.!?-]+$/;
  const isValidEnglishTitle = englishTitleRegex.test(article.title);

  return {
    title: isValidEnglishTitle ? article.title : "Title not in English",
    slug: slugify(isValidEnglishTitle ? article.title : "no-title"),
    description: article.description || article.summary || "No description",
    content: article.content || article.description || "No content available",
    keywords: tag,
    type: "blog",
    website: apiName,
    about: tag,
    source: article.source && article.source.name ? article.source.name : "Unknown",
    publishedAt: article.pubDate || article.publishedAt || new Date().toISOString(),
    image: article.urlToImage || article.image || "No image",
  };
};

// Fetch news data for a specific tag
const fetchNewsForTag = async (tag) => {
  for (let api of api_list) {
    try {
      console.log(`Fetching data for tag "${tag}" from ${api.name}...`);
      const response = await axios.get(api.buildUrl(tag), {
        headers: { ...commonHeaders, ...api.headers },
        decompress: true,
      });

      let articles = [];

      // Handle different API response formats
      if (api.type === "rss") {
        const parser = new xml2js.Parser({ explicitArray: false });
        const feed = await parser.parseStringPromise(response.data);
        if (feed.rss && feed.rss.channel && feed.rss.channel.item) {
          articles = feed.rss.channel.item.map((item) => ({
            title: item.title,
            description: item.description || "No description available",
            content: item["content:encoded"] || item.description || "No content",
            link: item.link,
            pubDate: new Date(item.pubDate),
            source: { name: "Google News" },
            urlToImage: "No image",
          }));
        }
      } else if (api.name === "NewsAPI.ai") {
        articles = response.data.articles.results.map((item) => ({
          title: item.title,
          description: item.description,
          content: item.body || item.description,
          link: item.url,
          pubDate: new Date(item.publishedAt),
          source: item.source,
          urlToImage: item.urlToImage,
        }));
      } else if (api.name === "NewsData.io") {
        articles = response.data.results.map((item) => ({
          title: item.title,
          description: item.description,
          content: item.content || item.description,
          link: item.link,
          pubDate: new Date(item.pubDate),
          source: { name: "NewsData.io" },
          urlToImage: item.image_url || "No image",
        }));
      }

      // Process articles
      for (const article of articles) {
        const formattedArticle = await formatArticle(api.name, article, tag);

        // Avoid duplicates based on slug
        const existingArticle = await Article.findOne({ slug: formattedArticle.slug });
        if (!existingArticle) {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

          // Skip outdated articles
          if (new Date(formattedArticle.publishedAt) >= oneWeekAgo) {
            await new Article(formattedArticle).save();
            console.log("Article saved:", formattedArticle.title);
          } else {
            console.log("Outdated article skipped:", formattedArticle.title);
          }
        } else {
          console.log("Duplicate article skipped:", formattedArticle.title);
        }
      }
    } catch (error) {
      console.error(`Error fetching data for tag "${tag}" from ${api.name}:`, error.message);
    }
  }
};

// Fetch news data for all tags
const fetchNewsData = async () => {
  for (const tag of tags) {
    await fetchNewsForTag(tag);
  }
};

module.exports = fetchNewsData;
