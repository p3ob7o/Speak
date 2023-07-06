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
    try {
      if (req.method === 'POST') {
        const file = await parseForm(req);
        console.log(`File Length: ${file.length}`);
        const formData = new FormData();
  
        formData.append('audio', file, {
          filename: 'audio.wav',
          contentType: 'audio/wav',
          knownLength: file.length
        });
  
        console.log('Form Data:', formData);
  
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
    } catch (error) {
      console.error('An error occurred:', error);
      res.status(500).json({ message: 'An error occurred', error: error.message });
    }
  };  
