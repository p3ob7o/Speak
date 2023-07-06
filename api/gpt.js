const axios = require('axios');

module.exports = async (req, res) => {
  try {
    if (req.method === 'POST') {
      const gptResponse = await axios.post(
        'https://api.openai.com/v1/engines/davinci-codex/completions',
        req.body,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
          }
        }
      );
  
      res.status(200).json(gptResponse.data);
    } else {
      res.status(405).send('Method not allowed');
    }
  } catch (error) {
    console.error('An error occurred:', error);
    res.status(500).json({ message: 'An error occurred', error: error.message });
  }
};
