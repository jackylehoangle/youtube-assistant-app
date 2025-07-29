import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { text, voice } = req.body;

    // Log a message to confirm the function started
    console.log("Received request to generate audio for voice:", voice);

    if (!text || !voice) {
      return res.status(400).json({ error: 'Missing text or voice in request body' });
    }

    const APP_ID = process.env.VBEE_APP_ID;
    const API_KEY = process.env.VBEE_API_KEY;

    if (!APP_ID || !API_KEY) {
        console.error('VBee credentials are not set on the server.');
        return res.status(500).json({ error: 'API credentials not configured on server' });
    }

    // Call VBee
    const vbeeResponse = await axios.post(
  'https://vbee.vn/api/v1/tts',
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

    // IMPORTANT: Log the full response from VBee
    console.log("Full response received from VBee:", JSON.stringify(vbeeResponse.data, null, 2));

    // Send the response back to the browser
    res.status(200).json(vbeeResponse.data);

  } catch (error) {
    // IMPORTANT: Log the full error if the call to VBee fails
    console.error('Error calling VBee API. Status:', error.response?.status);
    console.error('Error details from VBee:', JSON.stringify(error.response?.data, null, 2));
    
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to generate audio',
      details: error.response?.data
    });
  }
}