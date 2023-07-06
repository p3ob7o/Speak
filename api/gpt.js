const axios = require('axios');

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        const prompt = req.body.prompt;
        const max_tokens = req.body.max_tokens;

        const gptResponse = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
            prompt,
            max_tokens
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_KEY}`
            }
        });

        res.status(200).json(gptResponse.data);
    } else {
        res.status(405).send('Method not allowed');
    }
};
