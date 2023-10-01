const express = require('express');
const axios = require('axios');
const _ = require('lodash');

const app = express();
const port = 3000;

// Middleware to fetch blog data
const fetchBlogDataMiddleware = async (req, res, next) => {
  try {
    // Make the provided curl request to fetch the blog data
    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6',
      },
    });

    // Extract the blog data from the response
    const blogData = response.data;

    // Store the blog data in the request object
    req.blogData = blogData;
    next();
  } catch (error) {
    console.error('Error fetching blog data:', error.message);
    res.status(500).json({ error: 'Failed to fetch blog data' });
  }
};

// Middleware to analyze blog data
const analyzeBlogDataMiddleware = (req, res, next) => {
  const blogData = req.blogData;

  // Calculate the total number of blogs fetched
  const totalBlogs = blogData.length;

  // Find the blog with the longest title
  const longestBlog = _.maxBy(blogData, (blog) => blog.title.length);

  // Determine the number of blogs with "privacy" in the title
  const privacyBlogs = blogData.filter((blog) => blog.title.toLowerCase().includes('privacy')).length;

  // Create an array of unique blog titles (no duplicates)
  const uniqueBlogTitles = _.uniqBy(blogData, 'title').map((blog) => blog.title);

  // Store the analytics in the request object
  req.blogAnalytics = {
    totalBlogs,
    longestBlog: longestBlog.title,
    privacyBlogs,
    uniqueBlogTitles,
  };

  next();
};

// Route for /api/blog-stats
app.get('/api/blog-stats', fetchBlogDataMiddleware, analyzeBlogDataMiddleware, (req, res) => {
  // Retrieve the analytics data from the request object
  const blogAnalytics = req.blogAnalytics;

  // Respond with the calculated statistics
  res.json(blogAnalytics);
});

// Blog search functionality
app.get('/api/blog-search', (req, res) => {
  const query = req.query.query.toLowerCase();
  const blogData = req.blogData;

  // Filter blogs based on the provided query string (case-insensitive)
  const searchResults = blogData.filter((blog) => blog.title.toLowerCase().includes(query));

  // Respond with the search results
  res.json(searchResults);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the Express server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
