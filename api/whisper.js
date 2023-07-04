const fetch = require('node-fetch');

module.exports = async (req, res) => {
  try {
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: req.body.audio_data,
        model: 'whisper-1',
        prompt: '', // Enter your prompt here if needed
        response_format: 'json', // Set the desired response format (json, text, srt, verbose_json, vtt)
        temperature: 0, // Set the desired temperature value (0 to 1)
        language: '', // Set the input audio language in ISO-639-1 format if known
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
