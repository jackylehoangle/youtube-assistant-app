// File: api/google-tts.js
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end(); // Method Not Allowed
  }

  try {
    const { text, voiceName } = req.body;
    const apiKey = process.env.VITE_API_KEY; // Dùng lại API key của Gemini

    if (!text || !voiceName) {
      return res.status(400).json({ error: 'Missing text or voiceName' });
    }
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured on server' });
    }

    const response = await axios.post(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        input: {
          text: text,
        },
        voice: {
          // Ví dụ: 'vi-VN-Standard-A' (Nữ), 'vi-VN-Standard-B' (Nam)
          // Xem thêm các giọng khác tại: https://cloud.google.com/text-to-speech/docs/voices
          languageCode: 'vi-VN',
          name: voiceName, 
        },
        audioConfig: {
          audioEncoding: 'MP3',
        },
      }
    );

    // Google trả về audio dưới dạng base64 trong trường audioContent
    res.status(200).json(response.data);

  } catch (error) {
    console.error('Google TTS API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to synthesize speech', details: error.response?.data });
  }
}