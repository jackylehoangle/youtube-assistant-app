import { GoogleGenAI, Type } from "@google/genai";
import { VideoIdea, StructuredScriptScene, YouTubeMetadata, ThumbnailConcept, KeywordAnalysisResult, ScriptOutline, MusicPrompt } from '../types';

if (!import.meta.env.VITE_API_KEY) {
    throw new Error("VITE_API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
const model = "gemini-2.5-flash";

// Helper function to handle API calls and JSON parsing
async function callGenerativeModel<T>(prompt: string, responseSchema: any): Promise<T> {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as T;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Không lấy được phản hồi hợp lệ từ AI. Vui lòng thử lại.");
    }
}

async function callGenerativeModelText(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        throw new Error("Không lấy được phản hồi hợp lệ từ AI. Vui lòng thử lại.");
    }
}

export const generateIdeas = async (topic: string, platform: string, videoType: string): Promise<VideoIdea[]> => {
    // ... (Giữ nguyên nội dung hàm này)
};

export const generateOutline = async (idea: VideoIdea): Promise<ScriptOutline> => {
    // ... (Giữ nguyên nội dung hàm này)
};


export const generateKeywordAnalysis = async (idea: VideoIdea): Promise<KeywordAnalysisResult> => {
    // ... (Giữ nguyên nội dung hàm này)
};

export const generateScript = async (idea: VideoIdea, analysis: KeywordAnalysisResult, outline: ScriptOutline, lengthPreference: string): Promise<string> => {
    // ... (Giữ nguyên nội dung hàm này)
};

export const reviewAndStructureScript = async (script: string): Promise<StructuredScriptScene[]> => {
    // ... (Giữ nguyên nội dung hàm này)
};

export const generateMusicPrompts = async (scenes: StructuredScriptScene[]): Promise<MusicPrompt[]> => {
    // ... (Giữ nguyên nội dung hàm này)
};

export const generateImage = async (prompt: string, style: string): Promise<string> => {
    // ... (Giữ nguyên nội dung hàm này)
};

export const generatePublishingKit = async (idea: VideoIdea, script: string): Promise<{ metadata: YouTubeMetadata; thumbnailConcepts: ThumbnailConcept[] }> => {
    // ... (Giữ nguyên nội dung hàm này)
};

// =======================================================
// == CÁC HÀM TẠO ÂM THANH ĐÃ SỬA LẠI ĐƯỜNG DẪN API ==
// =======================================================

export async function generateVbeeAudio(text: string, voice: string): Promise<string> {
    try {
      const response = await fetch('/api/vbee.js', { // Sửa lại đường dẫn API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Lỗi từ server VBee:', errorData);
        throw new Error('Không thể tạo âm thanh VBee.');
      }
  
      const result = await response.json();
      
      if (result && result.audio_link) {
        return result.audio_link;
      } else {
        throw new Error('Không nhận được link audio từ VBee.');
      }
  
    } catch (error) {
      console.error('Thất bại khi gọi hàm tạo audio VBee:', error);
      throw error;
    }
}
  
export async function generateGoogleTtsAudio(text: string, voiceName: string): Promise<string> {
    try {
      const response = await fetch('/api/google-tts.js', { // Sửa lại đường dẫn API
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Google TTS request failed');
      }
  
      const result = await response.json();
  
      if (result && result.audioContent) {
        const audioBytes = atob(result.audioContent);
        const byteArray = new Uint8Array(audioBytes.length);
        for (let i = 0; i < audioBytes.length; i++) {
          byteArray[i] = audioBytes.charCodeAt(i);
        }
        const blob = new Blob([byteArray], { type: 'audio/mpeg' });
        return URL.createObjectURL(blob);
      } else {
        throw new Error('No audio content received from Google TTS.');
      }
  
    } catch (error) {
      console.error('Failed to generate Google TTS audio:', error);
      throw error;
    }
}

export async function startRunwayGeneration(prompt: string): Promise<{ uuid: string }> {
    const response = await fetch('/api/runway.js', { // Sửa lại đường dẫn API
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!response.ok) {
      throw new Error('Failed to start Runway generation');
    }
    return response.json();
}
  
export async function checkRunwayStatus(uuid: string): Promise<any> {
    const response = await fetch(`/api/runway-status.js?uuid=${uuid}`); // Sửa lại đường dẫn API
    if (!response.ok) {
      throw new Error('Failed to check Runway status');
    }
    return response.json();
}