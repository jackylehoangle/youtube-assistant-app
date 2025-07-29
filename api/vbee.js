import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { text, voice } = req.body;

    if (!text || !voice) {
      return res.status(400).json({ error: 'Missing text or voice in request body' });
    }

    const APP_ID = process.env.VBEE_APP_ID;
    const API_KEY = process.env.VBEE_API_KEY;

    if (!APP_ID || !API_KEY) {
        console.error('VBee credentials are not set on the server.');
        return res.status(500).json({ error: 'API credentials not configured on server' });
    }

    const vbeeResponse = await axios.post(
      'https://app.vbee.vn/api/v1/convert-text',
      {
        input_text: text,
        voice_code: voice,
        app_id: APP_ID,
        bit_rate: '128000',
        sample_rate: '44100',
        audio_format: 'mp3',
      },
      {
        headers: {
          'api-key': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json(vbeeResponse.data);

  } catch (error) {
    console.error('Error calling VBee API:', error.response ? error.response.data : error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to generate audio',
      details: error.response?.data
    });
  }
}