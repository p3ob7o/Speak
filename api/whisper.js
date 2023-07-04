const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const response = await fetch('https://api.openai.com/v1/whisper/recognize', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'audio_data': req.body.audio_data
        })
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        console.error('Whisper API error:', errorMessage);
        res.status(response.status).send(errorMessage);
    } else {
        const data = await response.json();
        res.json(data);
    }
};
