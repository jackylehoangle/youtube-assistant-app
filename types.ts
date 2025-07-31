export interface VideoIdea {
    title: string;
    description: string;
    targetAudience: string;
    valueProposition: string;
}

export interface KeywordAnalysisResult {
    primaryKeywords: string[];
    secondaryKeywords: string[];
    searchIntent: string;
    seoTitle: string;
    trendAnalysis: string;
}

export interface ScriptOutline {
    hook: string;
    introduction: string;
    mainPoints: { title: string; description: string }[];
    cta: string;
    outro: string;
}

export interface StructuredScriptScene {
    scene: number;
    dialogue: string;
    visualSuggestionVI: string; // Vietnamese version for display
    visualSuggestionEN: string; // English version for image generation
    soundSuggestion: string;
}

export interface MusicPrompt {
    scene: number;
    prompt: string;
}

export interface YouTubeMetadata {
    titles: string[];
    description: string;
    tags: string[];
}

export interface ThumbnailConcept {
    concept: string;
    prompt: string;
}

export enum Step {
    Ideation = 1,
    IdeaSelection = 2,
    Outlining = 3,
    KeywordAnalysis = 4,
    Scripting = 5,
    ScriptReview = 6,
    MusicGeneration = 7,
    ImageGeneration = 8,
    Voiceover = 9,
    Publishing = 10, // Re-numbered
}

// File: types.ts (thêm vào cuối file)

// Định nghĩa cấu trúc của một dự án được lưu
export interface AppState {
  currentStep: number;
  videoTopic: string;
  videoIdeas: VideoIdea[];
  selectedIdea: VideoIdea | null;
  scriptOutline: ScriptOutline | null;
  keywordAnalysis: KeywordAnalysisResult | null;
  fullScript: string;
  structuredScript: StructuredScriptScene[];
  // Thêm bất kỳ dữ liệu nào khác bạn muốn lưu ở đây
}