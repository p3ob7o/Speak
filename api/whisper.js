// Import axios and FormData
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const util = require('util');
const streamPipeline = util.promisify(require('stream').pipeline);

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const file = req.files.audio.data;
        const formData = new FormData();
        formData.append('audio', file, {
            filename: 'audio.wav',
            contentType: 'audio/wav',
            knownLength: file.length
        });

        const whisperResponse = await axios.post('https://api.openai.com/v1/whisper/recognize', formData, {
            headers: {
                ...formData.getHeaders(),
                'Authorization': `Bearer ${process.env.OPENAI_KEY}`
            }
        });

        res.status(200).json(whisperResponse.data);
    } else {
        res.status(405).send('Method not allowed');
    }
};
