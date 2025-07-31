import React, { useState, useCallback, useEffect } from 'react';
import { VideoIdea, Step, StructuredScriptScene, YouTubeMetadata, ThumbnailConcept, KeywordAnalysisResult, ScriptOutline, MusicPrompt } from './types';
// Thêm generateGoogleTtsAudio và generateVbeeAudio vào import
import { generateIdeas, generateOutline, generateScript, generateImage, reviewAndStructureScript, generatePublishingKit, generateKeywordAnalysis, generateMusicPrompts, generateVbeeAudio, generateGoogleTtsAudio } from './services/geminiService';
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

const vbeeVoices = [
    { id: 'hn_male_manhdung_48k-fhg', name: 'Hà Nội - Nam Mạnh Dũng' },
    { id: 'hn_female_thuylinh_48k-fhg', name: 'Hà Nội - Nữ Thùy Linh' },
    { id: 'sg_male_minhhoang_48k-fhg', name: 'Sài Gòn - Nam Minh Hoàng' },
    { id: 'sg_female_lananh_48k-fhg', name: 'Sài Gòn - Nữ Lan Anh' },
    { id: 'hue_female_huonggiang_48k-fhg', name: 'Huế - Nữ Hương Giang' },
];

const googleVoices = [
    { id: 'vi-VN-Standard-A', name: 'Nữ - Giọng Miền Bắc 1' },
    { id: 'vi-VN-Standard-C', name: 'Nữ - Giọng Miền Nam' },
    { id: 'vi-VN-Standard-B', name: 'Nam - Giọng Miền Bắc' },
    { id: 'vi-VN-Standard-D', name: 'Nam - Giọng Miền Nam 1' },
    { id: 'vi-VN-Wavenet-A', name: 'Nữ - Giọng Miền Bắc 2 (Cao cấp)' },
    { id: 'vi-VN-Wavenet-B', name: 'Nam - Giọng Miền Bắc 2 (Cao cấp)' },
    { id: 'vi-VN-Wavenet-C', name: 'Nữ - Giọng Miền Nam 2 (Cao cấp)' },
    { id: 'vi-VN-Wavenet-D', name: 'Nam - Giọng Miền Nam 2 (Cao cấp)' },
];


const LOCAL_STORAGE_KEY = 'youtubeProductionAssistantState_v5'; // Tăng phiên bản để tránh lỗi dữ liệu cũ

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
    
    // Audio States
    const [selectedVbeeVoice, setSelectedVbeeVoice] = useState<string>(vbeeVoices[0].id);
    const [vbeeAudioStates, setVbeeAudioStates] = useState<Record<number, AudioState>>({});
    const [selectedGoogleVoice, setSelectedGoogleVoice] = useState<string>(googleVoices[0].id);
    const [googleAudioStates, setGoogleAudioStates] = useState<Record<number, AudioState>>({});


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
                setSelectedVbeeVoice(savedState.selectedVbeeVoice || vbeeVoices[0].id)
                setSelectedGoogleVoice(savedState.selectedGoogleVoice || googleVoices[0].id)
                
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
            }
        } catch (error) {
            console.error("Failed to load state:", error);
            window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        try {
            const stateToSave = {
                currentStep, topic, platform, videoType, ideas, selectedIdea,
                scriptOutline, keywordAnalysis, script, structuredScript, musicPrompts,
                publishingKit, thumbnailImageState, imageStyle, images, selectedVbeeVoice,
                vbeeAudioStates, selectedGoogleVoice, googleAudioStates
            };
            window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (error) { console.error("Failed to save state:", error); }
    }, [currentStep, topic, platform, videoType, ideas, selectedIdea, scriptOutline, keywordAnalysis, script, structuredScript, musicPrompts, publishingKit, thumbnailImageState, imageStyle, images, selectedVbeeVoice, vbeeAudioStates, selectedGoogleVoice, googleAudioStates]);

    const handleReset = () => {
        setCurrentStep(Step.Ideation);
        setTopic('');
        setIdeas([]); setSelectedIdea(null); setScriptOutline(null);
        setKeywordAnalysis(null); setScript(''); setStructuredScript([]); setMusicPrompts([]);
        setImages({}); setPublishingKit(null); setThumbnailImageState({ isLoading: false });
        setError(null); setIsLoading(false); setIsCopied(false);
        setVbeeAudioStates({});
        setGoogleAudioStates({});
        try {
            window.localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (error) { console.error("Failed to clear local storage:", error); }
    };

    const handleNavigateToStep = (step: Step) => {
        if (step < currentStep) {
            setCurrentStep(step);
            setError(null);
        }
    };

    const handleGenerateIdeas = useCallback(async () => {
        if (!topic.trim()) { setError('Vui lòng nhập chủ đề.'); return; }
        setIsLoading(true); setError(null);
        try {
            const generatedIdeas = await generateIdeas(topic, platform, videoType);
            setIdeas(generatedIdeas);
            setCurrentStep(Step.IdeaSelection);
        } catch (err) { setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.'); } 
        finally { setIsLoading(false); }
    }, [topic, platform, videoType]);

    const handleGenerateOutline = useCallback(async (idea: VideoIdea) => {
        setIsLoading(true); setError(null); setSelectedIdea(idea);
        try {
            const outline = await generateOutline(idea);
            setScriptOutline(outline);
            setCurrentStep(Step.Outlining);
        } catch (err) { setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.'); }
        finally { setIsLoading(false); }
    }, []);

    const handleAnalyzeKeywords = useCallback(async () => {
        if (!selectedIdea) return;
        setIsLoading(true); setError(null);
        try {
            const analysis = await generateKeywordAnalysis(selectedIdea);
            setKeywordAnalysis(analysis);
            setCurrentStep(Step.KeywordAnalysis);
        } catch (err) { setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.'); }
        finally { setIsLoading(false); }
    }, [selectedIdea]);

    const handleGenerateScript = useCallback(async () => {
        if (!selectedIdea || !keywordAnalysis || !scriptOutline) return;
        setIsLoading(true); setError(null);
        try {
            const generatedScript = await generateScript(selectedIdea, keywordAnalysis, scriptOutline, scriptLength);
            setScript(generatedScript);
            setCurrentStep(Step.Scripting);
        } catch (err) { setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.'); }
        finally { setIsLoading(false); }
    }, [selectedIdea, keywordAnalysis, scriptOutline, scriptLength]);
    
    const handleReviewScript = useCallback(async () => {
        if (!script) return;
        setIsLoading(true); setError(null);
        try {
            const structured = await reviewAndStructureScript(script);
            setStructuredScript(structured);
            setCurrentStep(Step.ScriptReview);
        } catch (err) { setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.'); }
        finally { setIsLoading(false); }
    }, [script]);

    const handleGenerateMusic = useCallback(async () => {
        if (!structuredScript.length) return;
        setIsLoading(true); setError(null);
        try {
            const prompts = await generateMusicPrompts(structuredScript);
            setMusicPrompts(prompts);
            setCurrentStep(Step.MusicGeneration);
        } catch (err) { setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.'); }
        finally { setIsLoading(false); }
    }, [structuredScript]);

    const handleGenerateImage = useCallback(async (prompt: string) => {
        setImages(prev => ({ ...prev, [prompt]: { isLoading: true } }));
        try {
            const imageDataUrl = await generateImage(prompt, imageStyle);
            setImages(prev => ({ ...prev, [prompt]: { isLoading: false, dataUrl: imageDataUrl } }));
        } catch (err) {
            const message = err instanceof Error ? err.message : "Không thể tạo ảnh.";
            setImages(prev => ({ ...prev, [prompt]: { isLoading: false, error: message } }));
        }
    }, [imageStyle]);

    const handleGeneratePublishingKit = useCallback(async () => {
        if (!script || !selectedIdea) return;
        setIsLoading(true); setError(null);
        try {
            const kit = await generatePublishingKit(selectedIdea, script);
            setPublishingKit(kit);
            setCurrentStep(Step.Publishing);
        } catch (err) { setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định.'); }
        finally { setIsLoading(false); }
    }, [script, selectedIdea]);

    const handleGenerateThumbnail = useCallback(async (prompt: string) => {
        setThumbnailImageState({ isLoading: true });
        try {
            const imageDataUrl = await generateImage(prompt, 'Vibrant, eye-catching, high-contrast');
            setThumbnailImageState({ isLoading: false, dataUrl: imageDataUrl });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Không thể tạo ảnh bìa.";
            setThumbnailImageState({ isLoading: false, error: message });
        }
    }, []);

    const handleCopyFullProject = useCallback(() => {
        if (!selectedIdea || !script || !structuredScript.length || !publishingKit) {
            setError("Không thể sao chép, một số nội dung bị thiếu.");
            return;
        }

        const formattedContent = `...`; // Giữ nguyên nội dung format của bạn

        navigator.clipboard.writeText(formattedContent.trim())
            .then(() => { setIsCopied(true); setTimeout(() => setIsCopied(false), 3000); })
            .catch(err => { console.error('Failed to copy text: ', err); setError('Không thể sao chép nội dung vào bộ nhớ tạm.'); });
    }, [selectedIdea, script, structuredScript, publishingKit, scriptOutline, keywordAnalysis, musicPrompts]);
    
    const handleDownloadAsset = (dataUrl: string, filename: string) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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

    
    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-64"><LoadingSpinner text="AI đang suy nghĩ..." /></div>;
        }

        if (error) {
            return (
                <div className="text-center">
                    <p className="text-red-400 bg-red-900/50 p-4 rounded-md">{error}</p>
                    <button onClick={() => setError(null)} className="mt-4 px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-md font-semibold transition-colors">Đóng</button>
                </div>
            );
        }
        
        switch (currentStep) {
            // ... (Giữ nguyên tất cả các case khác: Ideation, IdeaSelection, v.v...)
            
            case Step.Voiceover: {
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-4 text-slate-100">Lồng tiếng cho kịch bản</h2>
                        <p className="text-center text-slate-400 mb-8 max-w-3xl mx-auto">Chọn một giọng nói, sau đó tạo âm thanh cho từng cảnh. Bạn có thể tải về các tệp MP3 để sử dụng trong phần mềm dựng phim của mình.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-md mx-auto mb-8">
                            <div>
                                <label htmlFor="vbee-voice-select" className="block text-sm font-medium text-slate-300 mb-2">Chọn giọng đọc VBee:</label>
                                <select id="vbee-voice-select" value={selectedVbeeVoice} onChange={(e) => setSelectedVbeeVoice(e.target.value)} className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition">
                                    {vbeeVoices.map(voice => (<option key={voice.id} value={voice.id}>{voice.name}</option>))}
                                </select>
                            </div>
                             <div>
                                <label htmlFor="google-voice-select" className="block text-sm font-medium text-slate-300 mb-2">Chọn giọng đọc Google:</label>
                                <select id="google-voice-select" value={selectedGoogleVoice} onChange={(e) => setSelectedGoogleVoice(e.target.value)} className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none transition">
                                    {googleVoices.map(voice => (<option key={voice.id} value={voice.id}>{voice.name}</option>))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-6 max-w-3xl mx-auto">
                            {structuredScript.map((scene) => {
                                const vbeeAudioState = vbeeAudioStates[scene.scene];
                                const googleAudioState = googleAudioStates[scene.scene];
                                return (
                                <Card key={scene.scene}>
                                    <h3 className="text-lg font-bold text-sky-400 mb-3">Cảnh {scene.scene}</h3>
                                    <p className="whitespace-pre-wrap text-slate-200 mb-4">{scene.dialogue}</p>
                                    
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <CopyButton textToCopy={scene.dialogue} buttonText="Sao chép lời thoại" className="w-full sm:w-auto" />
                                        
                                        <button onClick={() => handleGenerateVbeeAudio(scene.scene, scene.dialogue)} disabled={vbeeAudioState?.isLoading} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-md font-semibold text-sm text-white transition-colors disabled:bg-slate-700 disabled:cursor-wait">
                                            {vbeeAudioState?.isLoading ? <><LoadingSpinner size="sm" /><span>Đang tạo...</span></> : <> {/* Icon SVG */} <span>VBee</span></>}
                                        </button>
                                        
                                        <button onClick={() => handleGenerateGoogleTtsAudio(scene.scene, scene.dialogue)} disabled={googleAudioState?.isLoading} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-md font-semibold text-sm text-white transition-colors disabled:bg-slate-700 disabled:cursor-wait">
                                            {googleAudioState?.isLoading ? <><LoadingSpinner size="sm" /><span>Đang tạo...</span></> : <> {/* Icon SVG */} <span>Google</span></>}
                                        </button>
                                    </div>

                                    {/* VBee Player */}
                                    {vbeeAudioState?.error && <p className="text-red-400 text-xs mt-3 text-center sm:text-left">{vbeeAudioState.error}</p>}
                                    {vbeeAudioState?.audioUrl && (
                                        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
                                            <p className="text-xs text-slate-400 mb-2">Giọng đọc VBee:</p>
                                            <audio controls src={vbeeAudioState.audioUrl} className="w-full">Trình duyệt không hỗ trợ.</audio>
                                        </div>
                                    )}

                                    {/* Google Player */}
                                     {googleAudioState?.error && <p className="text-red-400 text-xs mt-3 text-center sm:text-left">{googleAudioState.error}</p>}
                                    {googleAudioState?.audioUrl && (
                                        <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
                                             <p className="text-xs text-slate-400 mb-2">Giọng đọc Google:</p>
                                            <audio controls src={googleAudioState.audioUrl} className="w-full">Trình duyệt không hỗ trợ.</audio>
                                        </div>
                                    )}
                                </Card>
                            )})}
                        </div>

                        <div className="text-center mt-8">
                           <button onClick={handleGeneratePublishingKit} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold transition-colors">Tiếp theo: Bộ công cụ xuất bản</button>
                        </div>
                    </div>
                );
            }
            
             // ... (Giữ nguyên các case khác: Publishing, v.v...)
        }
    };
    
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <Header onReset={handleReset} />
            <main className="w-full max-w-7xl mx-auto flex-grow">
                <Stepper currentStep={currentStep} onStepClick={handleNavigateToStep} />
                <div className="mt-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default App;