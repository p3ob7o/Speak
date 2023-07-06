const Busboy = require('busboy');
const { Writable } = require('stream');
const util = require('util');
const finished = util.promisify(require('stream').finished);
const axios = require('axios');
const FormData = require('form-data');

async function parseForm(req) {
  const busboy = new Busboy({ headers: req.headers });
  const dataBuffers = [];

  await new Promise((resolve, reject) => {
    busboy.on('file', (fieldname, file) => {
      const dataBuffer = [];

      file.on('data', data => {
        dataBuffer.push(data);
      });

      file.on('end', () => {
        dataBuffers.push(Buffer.concat(dataBuffer));
      });
    });

    busboy.on('finish', resolve);
    busboy.on('error', reject);

    busboy.write(req.body);
    busboy.end();
  });

  return Buffer.concat(dataBuffers);
}

module.exports = async (req, res) => {
  try {
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
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
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
