// Import axios, FormData, micro, and busboy
const axios = require('axios');
const FormData = require('form-data');
const { buffer, run } = require('micro');
const { create } = require('micro');
const Busboy = require('busboy');

// Create a function to parse form data
const parseForm = req =>
  new Promise((resolve, reject) => {
    const busboy = new Busboy({ headers: req.headers });
    let fileData = [];

    busboy.on('file', (fieldname, file) => {
      file.on('data', data => {
        fileData.push(data);
      });
    });

    busboy.on('finish', () => {
      resolve(Buffer.concat(fileData));
    });

    req.pipe(busboy);
  });

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const file = await parseForm(req);
    const formData = new FormData();

    formData.append('audio', file, {
      filename: 'audio.wav',
      contentType: 'audio/wav',
      knownLength: file.length
    });

    const whisperResponse = await axios.post(
      'https://api.openai.com/v1/whisper/recognize',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.OPENAI_KEY}`
        }
      }
    );

    res.status(200).json(whisperResponse.data);
  } else {
    res.status(405).send('Method not allowed');
  }
};
