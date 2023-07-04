const fetch = require('node-fetch');
const multer = require('multer');
const upload = multer();

module.exports = upload.single('file'), async (req, res) => {
  try {
    const buffer = req.file.buffer;
    const base64Audio = buffer.toString('base64');
    
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64Audio,
        model: 'whisper-1',
        language: 'en',
      }),
    });

    if (!response.ok) {
      const errorResponse = await response.json(); // Get the error response
      console.error('Whisper API error:', errorResponse.error.message);
      throw new Error('Whisper API request failed');
    }

    const data = await response.json();
    console.log('Whisper API response:', data); // Log the API response
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Whisper API request failed' });
  }
};
