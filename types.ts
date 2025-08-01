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
    visualSuggestionVI: string;
    visualSuggestionEN: string;
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
    Publishing = 10,
}

// Interface cho trạng thái của hình ảnh và âm thanh
export interface ImageState {
    dataUrl?: string;
    isLoading: boolean;
    error?: string;
}

export interface AudioState {
    isLoading: boolean;
    audioUrl?: string;
    error?: string;
}

export interface RunwayJobState {
    uuid?: string;
    status: 'idle' | 'polling' | 'succeeded' | 'failed';
    videoUrl?: string;
    error?: string;
}


// Định nghĩa cấu trúc của một dự án được lưu (ĐÃ CẬP NHẬT ĐẦY ĐỦ)
export interface AppState {
    currentStep: Step;
    topic: string;
    platform: string;
    videoType: string;
    ideas: VideoIdea[];
    selectedIdea: VideoIdea | null;
    scriptOutline: ScriptOutline | null;
    keywordAnalysis: KeywordAnalysisResult | null;
    script: string;
    structuredScript: StructuredScriptScene[];
    musicPrompts: MusicPrompt[];
    imageStyle: string;
    images: Record<string, ImageState>;
    publishingKit: { metadata: YouTubeMetadata; thumbnailConcepts: ThumbnailConcept[] } | null;
    thumbnailImageState: ImageState;
    selectedVbeeVoice: string;
    vbeeAudioStates: Record<number, AudioState>;
    selectedGoogleVoice: string;
    googleAudioStates: Record<number, AudioState>;
    runwayJobs: Record<string, RunwayJobState>;
}