const express = require('express');
const axios = require('axios');
const _ = require('lodash');

const app = express();
const PORT = 3000;

// Data Retrieval Middleware
const fetchBlogData = async () => {
  try {
    const response = await axios.get('https://intent-kit-16.hasura.app/api/rest/blogs', {
      headers: {
        'x-hasura-admin-secret': '32qR4KmXOIpsGPQKMqEJHGJS27G5s7HdSKO3gdtQd2kv5e852SiYwWNfxkZOBuQ6'
      }
    });
    console.log(response)
    return response.data.blogs;
  } catch (error) {
    throw new Error('Error fetching blog data');
  }
};

// Data Analytics Middleware
const analyzeBlogData = _.memoize(async () => {
  try {
    const blogData = await fetchBlogData();

    const totalBlogs = blogData.length;
    const longestBlog = _.maxBy(blogData, 'title');
    const privacyBlogs = _.filter(blogData, (blog) => _.includes(blog.title, 'privacy'));
    const uniqueTitles = _.uniqBy(blogData, 'title');
    console.log(totalBlogs,longestBlog,privacyBlogs,uniqueTitles)

    return {
      totalBlogs: totalBlogs,
      longestBlog: longestBlog ? longestBlog.title : 'N/A',
      privacyBlogsCount: privacyBlogs.length,
      uniqueTitles: uniqueTitles.map((blog) => blog.title),
    };
  } catch (error) {
    throw new Error('Error analyzing blog data');
  }
}, () => 60000); //return the cached result

// Blog Stats Endpoint
app.get('/api/blog-stats', async (req, res) => {
  try {
    const blogStats = await analyzeBlogData();
    res.json(blogStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Blog Search Endpoint
// Blog Search Endpoint
app.get('/api/blog-search', (req, res) => {
  const query = req.query.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required.' });
  }

  try {
    const blogData = fetchBlogData();
    
    // Perform a case-insensitive search by converting both title and query to lowercase
    const searchResults = _.filter(blogData, (blog) => _.includes(blog.title.toLowerCase(), query.toLowerCase()));
    
    res.json(searchResults);
  } catch (error) {
    res.status(500).json({ error: 'Error occurred while searching for blogs.' });
  }
});

  
  

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
