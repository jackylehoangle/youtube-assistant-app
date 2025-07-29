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
    const prompt = `Bạn là một chuyên gia chiến lược nội dung cho mạng xã hội. Dựa trên các tiêu chí sau, hãy tạo ra chính xác 5 ý tưởng nội dung video cụ thể và hấp dẫn.

    - **Nền tảng:** ${platform}
    - **Định dạng Video:** ${videoType}
    - **Chủ đề cốt lõi:** "${topic}"

    Đối với mỗi ý tưởng, hãy cung cấp:
    1.  **Tiêu đề (title):** Một tiêu đề hấp dẫn được tối ưu hóa cho nền tảng.
    2.  **Mô tả (description):** Một mô tả ngắn (2-3 câu).
    3.  **Đối tượng khán giả (targetAudience):** Đối tượng khán giả cụ thể.
    4.  **Giá trị mang lại (valueProposition):** Lợi ích hoặc giá trị cốt lõi mà người xem sẽ nhận được (ví dụ: 'Học một kỹ năng mới', 'Giải trí', 'Cảm hứng sáng tạo').

    Các ý tưởng phải phù hợp với quy ước và các phương pháp hay nhất của nền tảng và định dạng đã chỉ định. Ví dụ, đối với "TikTok" và "Video ngắn", các ý tưởng nên có một khởi đầu mạnh mẽ, ngay lập tức và thân thiện với video dọc. Đối với "YouTube" và "Video dài", các ý tưởng có thể sâu sắc hơn.
    
    QUAN TRỌNG: Toàn bộ nội dung trả về PHẢI bằng tiếng Việt.`;
    
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: "Tiêu đề hấp dẫn của video." },
                description: { type: Type.STRING, description: "Mô tả ngắn gọn, 2-3 câu về nội dung video." },
                targetAudience: { type: Type.STRING, description: "Đối tượng khán giả cụ thể cho video này." },
                valueProposition: { type: Type.STRING, description: "Giá trị cốt lõi hoặc lợi ích cho người xem." },
            },
            required: ["title", "description", "targetAudience", "valueProposition"],
        },
    };

    return callGenerativeModel<VideoIdea[]>(prompt, schema);
};

export const generateOutline = async (idea: VideoIdea): Promise<ScriptOutline> => {
    const prompt = `Bạn là một nhà biên kịch giàu kinh nghiệm. Dựa vào ý tưởng video sau, hãy tạo một dàn ý chi tiết cho kịch bản.

    **Tiêu đề:** ${idea.title}
    **Mô tả:** ${idea.description}
    **Đối tượng khán giả:** ${idea.targetAudience}

    Dàn ý cần bao gồm các phần sau:
    1.  **Mở đầu/Thu hút (hook):** Một câu hoặc ý tưởng cực kỳ hấp dẫn để giữ chân người xem trong 3-5 giây đầu tiên.
    2.  **Giới thiệu (introduction):** Giới thiệu ngắn gọn về chủ đề và những gì video sẽ đề cập.
    3.  **Các điểm chính (mainPoints):** Chia nội dung chính thành 3-5 điểm hoặc phần chính. Với mỗi điểm, cung cấp một 'tiêu đề' (title) và 'mô tả' (description) ngắn gọn.
    4.  **Kêu gọi hành động (cta):** Gợi ý một lời kêu gọi hành động (like, share, subscribe) tự nhiên, phù hợp với nội dung.
    5.  **Kết luận (outro):** Tóm tắt lại nội dung và chào kết.

    QUAN TRỌNG: Toàn bộ nội dung trả về PHẢI bằng tiếng Việt.`;
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            hook: { type: Type.STRING },
            introduction: { type: Type.STRING },
            mainPoints: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ["title", "description"],
                },
            },
            cta: { type: Type.STRING },
            outro: { type: Type.STRING },
        },
        required: ["hook", "introduction", "mainPoints", "cta", "outro"],
    };

    return callGenerativeModel<ScriptOutline>(prompt, schema);
};


export const generateKeywordAnalysis = async (idea: VideoIdea): Promise<KeywordAnalysisResult> => {
    const prompt = `Bạn là một chuyên gia SEO YouTube có quyền truy cập vào dữ liệu xu hướng. Hãy phân tích ý tưởng video sau đây:
    - Tiêu đề: "${idea.title}"
    - Mô tả: "${idea.description}"
    - Đối tượng khán giả: "${idea.targetAudience}"
    
    Cung cấp một phân tích SEO chi tiết bao gồm:
    1.  **Từ khóa chính**: 3-5 từ khóa quan trọng nhất.
    2.  **Từ khóa phụ**: 5-7 từ khóa liên quan hoặc từ khóa đuôi dài.
    3.  **Mục đích tìm kiếm**: Một lời giải thích ngắn gọn về những gì người dùng có khả năng đang tìm kiếm.
    4.  **Tiêu đề SEO**: Một phiên bản tiêu đề được tinh chỉnh, có tỷ lệ nhấp cao, được tối ưu hóa SEO.
    5.  **Phân tích xu hướng**: Một bản tóm tắt định tính về xu hướng quan tâm tìm kiếm cho các từ khóa chính (ví dụ: 'Xu hướng tăng trong 90 ngày qua', 'Lượng tìm kiếm ổn định cao với các đỉnh theo mùa vào mùa hè', 'Sự quan tâm giảm dần').
    
    QUAN TRỌNG: Toàn bộ nội dung trả về PHẢI bằng tiếng Việt.`;

    const schema = {
        type: Type.OBJECT,
        properties: {
            primaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            secondaryKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            searchIntent: { type: Type.STRING },
            seoTitle: { type: Type.STRING },
            trendAnalysis: { type: Type.STRING, description: "Một bản tóm tắt định tính về xu hướng tìm kiếm cho các từ khóa chính." }
        },
        required: ["primaryKeywords", "secondaryKeywords", "searchIntent", "seoTitle", "trendAnalysis"]
    };

    return callGenerativeModel<KeywordAnalysisResult>(prompt, schema);
};


export const generateScript = async (idea: VideoIdea, analysis: KeywordAnalysisResult, outline: ScriptOutline, lengthPreference: string): Promise<string> => {
    const lengthInstruction = {
        short: 'khoảng 1000 từ (5-7 phút video)',
        medium: 'khoảng 2000 từ (10-12 phút video)',
        long: 'hơn 3000 từ (15+ phút video)',
    }[lengthPreference] || 'khoảng 2000 từ';

    const prompt = `Bạn là một nhà biên kịch chuyên nghiệp. Dựa trên các thông tin dưới đây, hãy viết một kịch bản video chi tiết, hấp dẫn và đầy đủ.

    **Thông tin đầu vào:**
    - **Tiêu đề SEO để sử dụng:** "${analysis.seoTitle}"
    - **Dàn ý chi tiết:**
        - Mở đầu: ${outline.hook}
        - Giới thiệu: ${outline.introduction}
        - Các điểm chính: ${outline.mainPoints.map(p => `\n  - ${p.title}: ${p.description}`)}
        - Kêu gọi hành động: ${outline.cta}
        - Kết luận: ${outline.outro}
    - **Từ khóa để lồng ghép:** ${analysis.primaryKeywords.join(', ')}, ${analysis.secondaryKeywords.join(', ')}
    - **Độ dài mong muốn:** ${lengthInstruction}

    **Yêu cầu:**
    1.  **Bám sát dàn ý:** Phát triển chi tiết từng phần của dàn ý đã cung cấp.
    2.  **Lồng ghép từ khóa:** Tích hợp các từ khóa chính và phụ một cách tự nhiên vào lời thoại.
    3.  **Văn phong hấp dẫn:** Sử dụng ngôn ngữ gần gũi, kể chuyện lôi cuốn, phù hợp với đối tượng khán giả của video.
    4.  **Định dạng rõ ràng:** Sử dụng markdown để định dạng kịch bản với các tiêu đề cho từng phần (ví dụ: "## Mở đầu", "## Phần 1: [Tên phần]").
    5.  **Bao gồm chỉ dẫn sản xuất:** Trong kịch bản, hãy chèn các gợi ý về hình ảnh và âm thanh vào những vị trí phù hợp. Ví dụ:
        - \`[VISUAL: Cận cảnh sản phẩm trên bàn xoay, ánh sáng dịu]\`
        - \`[SOUND: Nhạc nền tò mò, bí ẩn bắt đầu nổi lên]\`
    6.  **Đảm bảo độ dài:** Viết kịch bản có độ dài tương ứng với yêu cầu.
    
    QUAN TRỌNG: Toàn bộ nội dung trả về PHẢI bằng tiếng Việt.`;
    
    return callGenerativeModelText(prompt);
};

export const reviewAndStructureScript = async (script: string): Promise<StructuredScriptScene[]> => {
    const prompt = `Bạn là một trợ lý sản xuất video. Nhiệm vụ của bạn là phân tích kịch bản thô dưới đây và cấu trúc lại nó thành các cảnh (scenes) riêng biệt để tiện cho việc sản xuất.

    **Kịch bản thô:**
    ---
    ${script}
    ---

    **Yêu cầu:**
    1.  Chia kịch bản thành một chuỗi các cảnh tuần tự. Một cảnh mới thường bắt đầu khi có sự thay đổi về nội dung, địa điểm hoặc có một tiêu đề phần mới.
    2.  Với mỗi cảnh, hãy trích xuất các thông tin sau:
        - **dialogue**: Toàn bộ lời thoại được nói trong cảnh đó. Loại bỏ tất cả các ghi chú sản xuất như [VISUAL: ...] hoặc [SOUND: ...]. Làm sạch văn bản để sẵn sàng cho việc chuyển văn bản thành giọng nói.
        - **visualSuggestionVI (Tiếng Việt)**: Gộp tất cả các gợi ý về hình ảnh ([VISUAL:...]) trong cảnh đó thành một mô tả tiếng Việt duy nhất, mạch lạc, dễ hiểu cho người dùng. Nếu không có, trả về "Không có gợi ý cụ thể.".
        - **visualSuggestionEN (Tiếng Anh)**: Dựa trên gợi ý tiếng Việt, tạo một prompt tiếng Anh RẤT CHI TIẾT cho AI tạo ảnh (như Midjourney, Stable Diffusion). Prompt này phải mô tả cảnh, chủ thể, hành động, ánh sáng, góc máy, và phong cách. QUAN TRỌNG: Thêm các từ khóa phủ định để ngăn AI tạo ra chữ, văn bản, logo hoặc chữ ký, ví dụ: "--no text, writing, logos, signatures, watermarks". Nếu gợi ý gốc là không có, trả về "No specific visual suggestion.".
        - **soundSuggestion**: Gộp tất cả các gợi ý về âm thanh (bắt đầu bằng [SOUND:...) trong cảnh đó thành một mô tả duy nhất. Nếu không có, trả về "Không có gợi ý cụ thể."
    3.  Đánh số thứ tự các cảnh bắt đầu từ 1.

    QUAN TRỌNG: Toàn bộ nội dung trả về PHẢI bằng tiếng Việt, NGOẠI TRỪ 'visualSuggestionEN' phải bằng tiếng Anh.`;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                scene: { type: Type.INTEGER, description: "Số thứ tự của cảnh." },
                dialogue: { type: Type.STRING, description: "Lời thoại sạch cho cảnh này." },
                visualSuggestionVI: { type: Type.STRING, description: "Gợi ý hình ảnh bằng tiếng Việt cho người dùng xem." },
                visualSuggestionEN: { type: Type.STRING, description: "Gợi ý hình ảnh chi tiết bằng tiếng Anh cho AI tạo ảnh." },
                soundSuggestion: { type: Type.STRING, description: "Tất cả gợi ý âm thanh cho cảnh này." },
            },
            required: ["scene", "dialogue", "visualSuggestionVI", "visualSuggestionEN", "soundSuggestion"],
        },
    };

    return callGenerativeModel<StructuredScriptScene[]>(prompt, schema);
};

export const generateMusicPrompts = async (scenes: StructuredScriptScene[]): Promise<MusicPrompt[]> => {
    const soundSuggestions = scenes
        .filter(scene => scene.soundSuggestion !== "Không có gợi ý cụ thể.")
        .map(scene => `Cảnh ${scene.scene}: ${scene.soundSuggestion}`)
        .join('\n');

    if (!soundSuggestions) {
        return [];
    }

    const prompt = `Bạn là một nhà soạn nhạc và giám đốc âm nhạc. Dựa trên các gợi ý âm thanh từ kịch bản dưới đây, hãy tạo ra các prompt chi tiết để sử dụng trong các công cụ tạo nhạc AI (như Suno AI, Udio).

    **Gợi ý âm thanh từ kịch bản:**
    ${soundSuggestions}

    **Yêu cầu:**
    1.  Tạo một prompt cho mỗi cảnh có gợi ý âm thanh.
    2.  Mỗi prompt phải mô tả chi tiết:
        - **Thể loại/Tâm trạng:** (ví dụ: cinematic, epic, lofi, mysterious, upbeat)
        - **Nhạc cụ:** (ví dụ: piano, strings, synthesizer, acoustic guitar)
        - **Nhịp độ (BPM):** (ví dụ: slow, 80 BPM, fast, 140 BPM)
        - **Mô tả bổ sung:** Bất kỳ chi tiết nào khác để nắm bắt được không khí của cảnh.
    3.  Chỉ trả về prompt, không cần giải thích thêm.

    QUAN TRỌNG: Toàn bộ nội dung trả về PHẢI bằng tiếng Việt.`;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                scene: { type: Type.INTEGER, description: "Số cảnh tương ứng với prompt nhạc." },
                prompt: { type: Type.STRING, description: "Prompt chi tiết để tạo nhạc AI." },
            },
            required: ["scene", "prompt"],
        },
    };

    return callGenerativeModel<MusicPrompt[]>(prompt, schema);
};


export const generateImage = async (prompt: string, style: string): Promise<string> => {
    // The prompt from visualSuggestionEN is already detailed. We append the user's style choice and a final negative prompt for safety.
    const fullPrompt = `${prompt}, in the style of ${style}. --no text, writing, watermarks, signatures`;
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        } else {
            throw new Error("Không có ảnh nào được tạo.");
        }
    } catch (error) {
        console.error("Gemini image generation failed:", error);
        if (error instanceof Error && error.message.includes('filtered')) {
             throw new Error("Gợi ý đã bị chặn bởi bộ lọc an toàn. Vui lòng thử một gợi ý khác.");
        }
        throw new Error("Không thể tạo ảnh.");
    }
};

export const generatePublishingKit = async (idea: VideoIdea, script: string): Promise<{ metadata: YouTubeMetadata; thumbnailConcepts: ThumbnailConcept[] }> => {
    const prompt = `Bạn là một chuyên gia tăng trưởng YouTube. Dựa trên ý tưởng video "${idea.title}" và kịch bản được cung cấp, hãy tạo một bộ công cụ xuất bản toàn diện.

    Ý tưởng video: ${idea.title} - ${idea.description}
    Đối tượng khán giả: ${idea.targetAudience}
    
    Kịch bản video:
    ---
    ${script}
    ---
    
    Nhiệm vụ của bạn là tạo ra các tài sản sau:
    1.  **Siêu dữ liệu YouTube**:
        -   **Tiêu đề**: Tạo 6 tiêu đề hấp dẫn, được tối ưu hóa SEO dựa trên nội dung kịch bản.
        -   **Mô tả**: Viết một mô tả YouTube có cấu trúc tốt. Bao gồm một câu mở đầu, tóm tắt video và các phần giữ chỗ như "[Liên kết đến video/sản phẩm liên quan]" và "[Liên kết mạng xã hội của bạn]".
        -   **Thẻ**: Cung cấp một danh sách 10-15 từ khóa và cụm từ có liên quan cho các thẻ dựa trên kịch bản.
    2.  **Ý tưởng ảnh bìa**:
        -   Tạo chính xác 3 ý tưởng riêng biệt cho ảnh bìa video.
        -   Đối với mỗi ý tưởng, cung cấp một mô tả 'concept' ngắn gọn về ý tưởng hình ảnh (ví dụ: "Màn hình chia đôi hiển thị trước và sau...").
        -   Sau đó, tạo một 'prompt' chi tiết cao (bằng tiếng Anh) cho một trình tạo ảnh AI để tạo ảnh bìa đó. Prompt phải mô tả bố cục, chủ thể, màu sắc, phong cách (ví dụ: sống động, kịch tính, sạch sẽ) và thêm "--no text, logo" để tránh chữ.

    QUAN TRỌNG: Toàn bộ nội dung trả về PHẢI bằng tiếng Việt, NGOẠI TRỪ 'prompt' cho ảnh bìa phải bằng tiếng Anh để có kết quả tốt nhất.
    `;

    const metadataSchema = {
        type: Type.OBJECT,
        properties: {
            titles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-5 tiêu đề hấp dẫn, tối ưu hóa SEO." },
            description: { type: Type.STRING, description: "Một mô tả YouTube có cấu trúc tốt." },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "10-15 thẻ liên quan." },
        },
        required: ["titles", "description", "tags"],
    };

    const thumbnailConceptSchema = {
        type: Type.OBJECT,
        properties: {
            concept: { type: Type.STRING, description: "Một mô tả ngắn về ý tưởng hình ảnh của ảnh bìa." },
            prompt: { type: Type.STRING, description: "Một gợi ý chi tiết bằng tiếng Anh cho một trình tạo ảnh AI để tạo ảnh bìa." },
        },
        required: ["concept", "prompt"],
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            metadata: metadataSchema,
            thumbnailConcepts: { type: Type.ARRAY, items: thumbnailConceptSchema },
        },
        required: ["metadata", "thumbnailConcepts"],
    };

    return callGenerativeModel<{ metadata: YouTubeMetadata; thumbnailConcepts: ThumbnailConcept[] }>(prompt, responseSchema);
};
export async function generateVbeeAudio(text: string, voice: string): Promise<string> {
  try {
    // Gọi đến API /api/vbee của chính bạn
    const response = await fetch('/api/vbee.cjs', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Gửi văn bản và mã giọng đọc lên
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Lỗi từ server:', errorData);
      throw new Error('Không thể tạo âm thanh.');
    }

    const result = await response.json();
    
    // Giả sử VBee trả về URL trong trường `audio_link`
    if (result && result.audio_link) {
      return result.audio_link;
    } else {
      throw new Error('Không nhận được link audio từ VBee.');
    }

  } catch (error) {
    console.error('Thất bại khi gọi hàm tạo audio:', error);
    // Bạn có thể thêm logic hiển thị lỗi cho người dùng ở đây
    throw error;
  }
}