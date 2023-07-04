const fetch = require('node-fetch');
const multer = require('multer');
const upload = multer();

module.exports = async (req, res) => {
  upload.any()(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
      res.status(500).json({ error: 'Multer error: ' + err.message });
      return;
    } else if (err) {
      res.status(500).json({ error: 'Unknown error: ' + err.message });
      return;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file: req.files[0].buffer.toString('base64'),
          model: 'whisper-1',
          language: 'en',
        }),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Whisper API error:', errorResponse.error.message);
        throw new Error('Whisper API request failed');
      }

      const data = await response.json();
      console.log('Whisper API response:', data);
      res.json(data);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Whisper API request failed' });
    }
  });
};
