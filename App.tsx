import React, { useState, useCallback, useEffect } from 'react';
import { VideoIdea, Step, StructuredScriptScene, YouTubeMetadata, ThumbnailConcept, KeywordAnalysisResult, ScriptOutline, MusicPrompt } from './types';
import { 
    generateIdeas, generateOutline, generateScript, generateImage, reviewAndStructureScript, 
    generatePublishingKit, generateKeywordAnalysis, generateMusicPrompts, generateVbeeAudio, 
    generateGoogleTtsAudio, startRunwayGeneration, checkRunwayStatus 
} from './services/geminiService';
import Header from './components/Header';
import Stepper from './components/Stepper';
import LoadingSpinner from './components/LoadingSpinner';
import Card from './components/Card';
import CopyButton from './components/CopyButton';

interface ImageState {
    dataUrl?: string;
    isLoading: boolean;
    error?: string;
}

interface AudioState {
    isLoading: boolean;
    audioUrl?: string;
    error?: string;
}

interface RunwayJobState {
    uuid?: string;
    status: 'idle' | 'polling' | 'succeeded' | 'failed';
    videoUrl?: string;
    error?: string;
}

const vbeeVoices = [
    { id: 'hn_male_manhdung_48k-fhg', name: 'Hà Nội - Nam Mạnh Dũng' },
    { id: 'hn_female_thuylinh_48k-fhg', name: 'Hà Nội - Nữ Thùy Linh' },
    { id: 'sg_male_minhhoang_48k-fhg', name: 'Sài Gòn - Nam Minh Hoàng' },
    { id: 'sg_female_lananh_48k-fhg', name: 'Sài Gòn - Nữ Lan Anh' },
    { id: 'hue_female_huonggiang_48k-fhg', name: 'Huế - Nữ Hương Giang' },
];

const googleVoices = [
    { id: 'vi-VN-Standard-D', name: 'Nam - Giọng Miền Nam' },
    { id: 'vi-VN-Standard-B', name: 'Nam - Giọng Miền Bắc' },
    { id: 'vi-VN-Standard-A', name: 'Nữ - Giọng Miền Bắc' },
    { id: 'vi-VN-Standard-C', name: 'Nữ - Giọng Miền Nam' },
    { id: 'vi-VN-Wavenet-D', name: 'Nam - Giọng Miền Nam (Cao cấp)' },
    { id: 'vi-VN-Wavenet-B', name: 'Nam - Giọng Miền Bắc (Cao cấp)' },
    { id: 'vi-VN-Wavenet-A', name: 'Nữ - Giọng Miền Bắc (Cao cấp)' },
    { id: 'vi-VN-Wavenet-C', name: 'Nữ - Giọng Miền Nam (Cao cấp)' },
];

const LOCAL_STORAGE_KEY = 'youtubeProductionAssistantState_v6';

const App: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<Step>(Step.Ideation);
    const [topic, setTopic] = useState<string>('');
    const [platform, setPlatform] = useState<string>('YouTube');
    const [videoType, setVideoType] = useState<string>('Video dài (trên 1 phút)');
    const [ideas, setIdeas] = useState<VideoIdea[]>([]);
    const [selectedIdea, setSelectedIdea] = useState<VideoIdea | null>(null);
    const [scriptOutline, setScriptOutline] = useState<ScriptOutline | null>(null);
    const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysisResult | null>(null);
    const [scriptLength, setScriptLength] = useState<string>('medium');
    const [script, setScript] = useState<string>('');
    const [structuredScript, setStructuredScript] = useState<StructuredScriptScene[]>([]);
    const [musicPrompts, setMusicPrompts] = useState<MusicPrompt[]>([]);
    const [imageStyle, setImageStyle] = useState<string>('Cinematic, photorealistic');
    const [images, setImages] = useState<Record<string, ImageState>>({});
    const [imagePromptLang, setImagePromptLang] = useState<'vi' | 'en'>('vi');
    const [publishingKit, setPublishingKit] = useState<{ metadata: YouTubeMetadata; thumbnailConcepts: ThumbnailConcept[] } | null>(null);
    const [thumbnailImageState, setThumbnailImageState] = useState<ImageState>({ isLoading: false });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState<boolean>(false);
    
    // Audio & Video States
    const [selectedVbeeVoice, setSelectedVbeeVoice] = useState<string>(vbeeVoices[0].id);
    const [vbeeAudioStates, setVbeeAudioStates] = useState<Record<number, AudioState>>({});
    const [selectedGoogleVoice, setSelectedGoogleVoice] = useState<string>(googleVoices[0].id);
    const [googleAudioStates, setGoogleAudioStates] = useState<Record<number, AudioState>>({});
    const [runwayJobs, setRunwayJobs] = useState<Record<string, RunwayJobState>>({});

    useEffect(() => {
        try {
            const savedStateJSON = window.localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                setCurrentStep(savedState.currentStep || Step.Ideation);
                setTopic(savedState.topic || '');
                setPlatform(savedState.platform || 'YouTube');
                setVideoType(savedState.videoType || 'Video dài (trên 1 phút)');
                setIdeas(savedState.ideas || []);
                setSelectedIdea(savedState.selectedIdea || null);
                setScriptOutline(savedState.scriptOutline || null);
                setKeywordAnalysis(savedState.keywordAnalysis || null);
                setScript(savedState.script || '');
                setStructuredScript(savedState.structuredScript || []);
                setMusicPrompts(savedState.musicPrompts || []);
                setPublishingKit(savedState.publishingKit || null);
                setImageStyle(savedState.imageStyle || 'Cinematic, photorealistic');
                setSelectedVbeeVoice(savedState.selectedVbeeVoice || vbeeVoices[0].id);
                setSelectedGoogleVoice(savedState.selectedGoogleVoice || googleVoices[0].id);
                
                const restoredImages = savedState.images || {};
                Object.keys(restoredImages).forEach(key => { if (restoredImages[key]) restoredImages[key].isLoading = false; });
                setImages(restoredImages);

                const thumbnailState = savedState.thumbnailImageState || { isLoading: false };
                thumbnailState.isLoading = false; 
                setThumbnailImageState(thumbnailState);

                const restoredVbeeStates = savedState.vbeeAudioStates || {};
                Object.keys(restoredVbeeStates).forEach(key => { if(restoredVbeeStates[key]) restoredVbeeStates[key].isLoading = false; });
                setVbeeAudioStates(restoredVbeeStates);

                const restoredGoogleStates = savedState.googleAudioStates || {};
                Object.keys(restoredGoogleStates).forEach(key => { if(restoredGoogleStates[key]) restoredGoogleStates[key].isLoading = false; });
                setGoogleAudioStates(restoredGoogleStates);

                const restoredRunwayJobs = savedState.runwayJobs || {};
                Object.keys(restoredRunwayJobs).forEach(key => { if (restoredRunwayJobs[key]?.status === 'polling') restoredRunwayJobs[key].status = 'failed'; });
                setRunwayJobs(restoredRunwayJobs);
            }
        } catch (err) {
            console.error("Failed to load state:", err);
            window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        try {
            const stateToSave = {
                currentStep, topic, platform, videoType, ideas, selectedIdea,
                scriptOutline, keywordAnalysis, script, structuredScript, musicPrompts,
                publishingKit, thumbnailImageState, imageStyle, images, selectedVbeeVoice,
                vbeeAudioStates, selectedGoogleVoice, googleAudioStates, runwayJobs
            };
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (err) { console.error("Failed to save state:", err); }
    }, [currentStep, topic, platform, videoType, ideas, selectedIdea, scriptOutline, keywordAnalysis, script, structuredScript, musicPrompts, publishingKit, thumbnailImageState, imageStyle, images, selectedVbeeVoice, vbeeAudioStates, selectedGoogleVoice, googleAudioStates, runwayJobs]);

    const handleReset = () => {
        setCurrentStep(Step.Ideation);
        setTopic('');
        setIdeas([]); setSelectedIdea(null); setScriptOutline(null);
        setKeywordAnalysis(null); setScript(''); setStructuredScript([]); setMusicPrompts([]);
        setImages({}); setPublishingKit(null); setThumbnailImageState({ isLoading: false });
        setError(null); setIsLoading(false); setIsCopied(false);
        setVbeeAudioStates({});
        setGoogleAudioStates({});
        setRunwayJobs({});
        try {
            window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (err) { console.error("Failed to clear local storage:", err); }
    };

    // ... (Giữ nguyên các hàm handleGenerate... từ Ideas đến Thumbnail)

    const handleGenerateVbeeAudio = useCallback(async (sceneNumber: number, text: string) => {
        setVbeeAudioStates(prev => ({ ...prev, [sceneNumber]: { isLoading: true, error: undefined } }));
        try {
            const audioUrl = await generateVbeeAudio(text, selectedVbeeVoice);
            setVbeeAudioStates(prev => ({ ...prev, [sceneNumber]: { isLoading: false, audioUrl: audioUrl } }));
        } catch (err) {
            const message = err instanceof Error ? err.message : "Không thể tạo âm thanh VBee.";
            setVbeeAudioStates(prev => ({ ...prev, [sceneNumber]: { isLoading: false, error: message } }));
        }
    }, [selectedVbeeVoice]);

    const handleGenerateGoogleTtsAudio = useCallback(async (sceneNumber: number, text: string) => {
        setGoogleAudioStates(prev => ({ ...prev, [sceneNumber]: { isLoading: true, error: undefined } }));
        try {
            const audioUrl = await generateGoogleTtsAudio(text, selectedGoogleVoice);
            setGoogleAudioStates(prev => ({ ...prev, [sceneNumber]: { isLoading: false, audioUrl: audioUrl } }));
        } catch (err) {
            const message = err instanceof Error ? err.message : "Không thể tạo âm thanh Google.";
            setGoogleAudioStates(prev => ({ ...prev, [sceneNumber]: { isLoading: false, error: message } }));
        }
    }, [selectedGoogleVoice]);

    const handleGenerateRunwayVideo = useCallback(async (sceneNumber: number, prompt: string) => {
        const jobKey = `scene-${sceneNumber}`;
        setRunwayJobs(prev => ({ ...prev, [jobKey]: { status: 'polling', error: undefined, videoUrl: undefined } }));

        try {
            const { uuid } = await startRunwayGeneration(prompt);
            setRunwayJobs(prev => ({ ...prev, [jobKey]: { uuid, status: 'polling' } }));

            const intervalId = setInterval(async () => {
                try {
                    const result = await checkRunwayStatus(uuid);
                    if (result.status === 'SUCCEEDED') {
                        clearInterval(intervalId);
                        setRunwayJobs(prev => ({ ...prev, [jobKey]: { ...prev[jobKey], status: 'succeeded', videoUrl: result.output.video_url } }));
                    } else if (result.status === 'FAILED') {
                        clearInterval(intervalId);
                        setRunwayJobs(prev => ({ ...prev, [jobKey]: { ...prev[jobKey], status: 'failed', error: 'Runway task failed.' } }));
                    }
                } catch (err) {
                    clearInterval(intervalId);
                    setRunwayJobs(prev => ({ ...prev, [jobKey]: { ...prev[jobKey], status: 'failed', error: 'Error checking status.' } }));
                }
            }, 10000);

        } catch (err) {
            setRunwayJobs(prev => ({ ...prev, [jobKey]: { status: 'failed', error: 'Failed to start generation.' } }));
        }
    }, []);
    
    // ... (Giữ nguyên các hàm handle khác)
    
    const renderContent = () => {
        // ... (Giữ nguyên phần isLoading và error)

        switch (currentStep) {
            // ... (Giữ nguyên tất cả các case từ Ideation đến MusicGeneration)
            
            case Step.ImageGeneration: {
                const visualPrompts = structuredScript.filter(s => s.visualSuggestionEN !== "No specific visual suggestion.");
                return (
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <h2 className="text-2xl font-bold text-center sm:text-left text-slate-100">Tạo hình ảnh & Video cho kịch bản</h2>
                            {/* ... (Giữ nguyên phần input style và toggle VI/EN) ... */}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {visualPrompts.map((scene) => {
                                const promptKey = scene.visualSuggestionEN;
                                const imageState = images[promptKey];
                                const runwayJobKey = `scene-${scene.scene}`;
                                const runwayState = runwayJobs[runwayJobKey];
                                const displayPrompt = imagePromptLang === 'vi' ? scene.visualSuggestionVI : scene.visualSuggestionEN;
                                
                                return (
                                    <Card key={scene.scene} className="flex flex-col justify-between text-sm">
                                        <div>
                                            {/* ... (Giữ nguyên phần hiển thị ảnh) ... */}
                                            {runwayState?.status === 'succeeded' && runwayState.videoUrl ? (
                                                <video controls src={runwayState.videoUrl} className="w-full rounded-md mb-4 aspect-video object-cover" />
                                            ) : (
                                                imageState?.dataUrl ? <img src={imageState.dataUrl} alt={displayPrompt.substring(0, 50)} className="rounded-md mb-4 aspect-video object-cover" /> : <div className="aspect-video bg-slate-700/50 rounded-md mb-4 flex items-center justify-center">{/* ... (nội dung cũ) ... */}</div>
                                            )}
                                            <p className="text-slate-300 flex-grow text-xs leading-5">{displayPrompt}</p>
                                        </div>
                                        <div className="mt-4 flex flex-col gap-2">
                                            {/* ... (Giữ nguyên nút tạo ảnh và sao chép) ... */}
                                            
                                            <button 
                                                onClick={() => handleGenerateRunwayVideo(scene.scene, promptKey)}
                                                disabled={runwayState?.status === 'polling'}
                                                className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-md font-semibold text-sm text-white transition-colors disabled:bg-slate-700 disabled:cursor-wait"
                                            >
                                                {runwayState?.status === 'polling' ? <><LoadingSpinner size="sm" /><span>Đang xử lý...</span></> : <> {/* Icon Video */} <span>Tạo Video (Runway)</span></>}
                                            </button>

                                            {runwayState?.status === 'failed' && <p className="text-red-400 text-xs mt-2">{runwayState.error}</p>}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                         <div className="text-center mt-8">
                            <button onClick={() => setCurrentStep(Step.Voiceover)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold transition-colors">Tiếp theo: Lồng tiếng</button>
                        </div>
                    </div>
                );
            }

            // ... (Giữ nguyên các case còn lại)
        }
    };
    
    return (
        // ... (Giữ nguyên phần return chính)
    );
};

export default App;