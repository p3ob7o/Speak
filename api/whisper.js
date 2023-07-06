module.exports = async (req, res) => {
  const formData = new FormData();

  // Busboy instance for parsing multipart form data
  const parser = new Busboy({ headers: req.headers });

  parser.on('file', async (fieldname, file, filename, encoding, mimetype) => {
      // appending the audio to form data
      formData.append('audio', file, { filename, mimetype });
  });

  // finishing the parser
  parser.on('finish', async () => {
      // make a post request to Whisper API
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

      // return the transcription to the client
      res.json(whisperResponse.data);
  });

  req.pipe(parser);
};
