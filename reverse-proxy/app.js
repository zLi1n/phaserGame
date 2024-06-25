const express = require('express');
const app = express();
const axios = require('axios');
const cors = require('cors');

app.use(cors({
  origin: '*'
}));

app.get('/*', async (req, res) => {
  const endpoint = req.originalUrl;
  const url = 'https://firebasestorage.googleapis.com' + endpoint;
  console.log('Requesting:', url);

  try {
    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'arraybuffer'
    });

    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Content-Length', response.headers['content-length']);
    
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching the image:', error.message);
    res.status(500).json({ error: 'Failed to load the image' });
  }
});

app.listen(3000, () => {
  console.log('Proxy server is running on http://localhost:3000');
});
