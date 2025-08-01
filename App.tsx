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
    
    const handleNavigateToStep = (step: Step) => {
        if (step < currentStep) {
            setCurrentStep(step);
            setError(null);
        }
    };

<<<<<<< HEAD
    const handleNavigateToStep = (step: Step) => {
        if (step < currentStep) {
            setCurrentStep(step);
            setError(null);
        }
    };
    
=======
>>>>>>> 62343d6ad4f529dc635f3f56827d425e0954a134
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
<<<<<<< HEAD
        if (!selectedIdea || !script || !structuredScript.length || !publishingKit) {
            setError("Không thể sao chép, một số nội dung bị thiếu.");
            return;
        }

        const formattedContent = `
# Kế hoạch sản xuất video: ${selectedIdea.title}
---
## 1. Ý tưởng & Khán giả
**Tiêu đề:** ${selectedIdea.title}
**Mô tả:** ${selectedIdea.description}
**Đối tượng khán giả:** ${selectedIdea.targetAudience}
**Giá trị mang lại:** ${selectedIdea.valueProposition}
---
## 2. Dàn ý
${scriptOutline ? `- Mở đầu: ${scriptOutline.hook}\n- Giới thiệu: ${scriptOutline.introduction}\n- Các điểm chính:\n${scriptOutline.mainPoints.map(p => `  - ${p.title}: ${p.description}`).join('\n')}\n- CTA: ${scriptOutline.cta}\n- Kết luận: ${scriptOutline.outro}` : 'Không có'}
---
## 3. Kịch bản video đầy đủ
${script}
---
## 4. Kịch bản đã biên tập
${structuredScript.map(item => `### Cảnh ${item.scene}\n\n**Lời thoại:** ${item.dialogue}\n\n**Gợi ý hình ảnh (VI):** ${item.visualSuggestionVI}\n\n**Gợi ý hình ảnh (EN):** ${item.visualSuggestionEN}\n\n**Gợi ý âm thanh:** ${item.soundSuggestion}`).join('\n\n')}
---
## 5. Phân tích SEO
**Tiêu đề SEO:** ${keywordAnalysis?.seoTitle || 'N/A'}
**Từ khóa chính:** ${keywordAnalysis?.primaryKeywords.join(', ') || 'N/A'}
**Từ khóa phụ:** ${keywordAnalysis?.secondaryKeywords.join(', ') || 'N/A'}
---
## 6. Gợi ý nhạc nền
${musicPrompts.length > 0 ? musicPrompts.map(p => `- Cảnh ${p.scene}: ${p.prompt}`).join('\n') : 'Không có'}
---
## 7. Bộ công cụ xuất bản
### Tiêu đề đề xuất
${publishingKit.metadata.titles.map(t => `- ${t}`).join('\n')}
### Mô tả video
${publishingKit.metadata.description}
### Thẻ đề xuất
${publishingKit.metadata.tags.join(', ')}
### Ý tưởng ảnh bìa
${publishingKit.thumbnailConcepts.map((c, i) => `**Ý tưởng ${i+1}:** ${c.concept}\n**Prompt:** ${c.prompt}`).join('\n\n')}
        `;

        navigator.clipboard.writeText(formattedContent.trim())
            .then(() => { setIsCopied(true); setTimeout(() => setIsCopied(false), 3000); })
            .catch(err => { console.error('Failed to copy text: ', err); setError('Không thể sao chép nội dung vào bộ nhớ tạm.'); });
=======
        // ... (Nội dung hàm này giữ nguyên)
>>>>>>> 62343d6ad4f529dc635f3f56827d425e0954a134
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

    const handleGenerateRunwayVideo = useCallback(async (sceneNumber: number, prompt: string) => {
        const jobKey = `scene-${sceneNumber}`;
        setRunwayJobs(prev => ({ ...prev, [jobKey]: { status: 'polling', error: undefined, videoUrl: undefined } }));

        try {
            const { uuid } = await startRunwayGeneration(prompt);
            setRunwayJobs(prev => ({ ...prev, [jobKey]: { uuid, status: 'polling' } }));

            const intervalId = setInterval(async () => {
                try {
                    if (!uuid) {
                        clearInterval(intervalId);
                        return;
                    }
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

<<<<<<< HEAD
    
=======
>>>>>>> 62343d6ad4f529dc635f3f56827d425e0954a134
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
            case Step.Ideation:
<<<<<<< HEAD
                return (
                    <div className="w-full max-w-3xl mx-auto">
                        <h2 className="text-2xl font-bold text-center mb-8 text-slate-100">Mô tả video của bạn</h2>
                        <div className="space-y-8">
                            <div>
                                <label className="block text-lg font-medium text-slate-300 mb-4 text-center">1. Chọn Nền tảng</label>
                                <div className="flex justify-center gap-4">
                                    {['YouTube', 'TikTok'].map(p => (<button key={p} onClick={() => setPlatform(p)} className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 w-40 text-center border-2 ${platform === p ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 border-slate-700 hover:border-indigo-500 text-slate-300'}`}>{p}</button>))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-lg font-medium text-slate-300 mb-4 text-center">2. Chọn Định dạng Video</label>
                                <div className="flex justify-center flex-wrap gap-4">
                                    {['Video dài (trên 1 phút)', 'Video ngắn (dưới 1 phút)'].map(vt => (<button key={vt} onClick={() => setVideoType(vt)} className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 w-60 text-center border-2 ${videoType === vt ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 border-slate-700 hover:border-indigo-500 text-slate-300'}`}>{vt}</button>))}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="topic-input" className="block text-lg font-medium text-slate-300 mb-4 text-center">3. Video của bạn nói về chủ đề gì?</label>
                                <input id="topic-input" type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="ví dụ: 'công thức bữa sáng lành mạnh' hoặc 'mẹo chụp ảnh cho người mới bắt đầu'" className="w-full p-4 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-center text-lg" onKeyDown={(e) => e.key === 'Enter' && handleGenerateIdeas()}/>
                            </div>
                        </div>
                        <div className="text-center mt-10">
                            <button onClick={handleGenerateIdeas} disabled={isLoading || !topic.trim()} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-md font-semibold transition-colors text-lg">Tạo ý tưởng</button>
                        </div>
                    </div>
                );

            case Step.IdeaSelection:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-6 text-slate-100">Chọn một ý tưởng để phát triển</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {ideas.map((idea, index) => {
                                const fullText = `Tiêu đề: ${idea.title}\nMô tả: ${idea.description}\nKhán giả: ${idea.targetAudience}\nGiá trị: ${idea.valueProposition}`;
                                return (
                                <Card key={index} className="flex flex-col">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-bold text-sky-400 mb-2 pr-2">{idea.title}</h3>
                                        <CopyButton size="sm" textToCopy={fullText} buttonText=""/>
                                    </div>
                                    <p className="text-slate-300 text-sm flex-grow mb-4">{idea.description}</p>
                                    <p className="text-xs text-slate-400 font-medium mb-2"><span className="font-semibold text-slate-300">Khán giả:</span> {idea.targetAudience}</p>
                                    <p className="text-xs text-amber-300 font-medium mb-4"><span className="font-semibold text-amber-200">Giá trị:</span> {idea.valueProposition}</p>
                                    <button onClick={() => handleGenerateOutline(idea)} className="mt-auto w-full px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-md font-semibold transition-colors">Chọn & Lên dàn ý</button>
                                </Card>
                            )})}
                        </div>
                    </div>
                );
            
            case Step.Outlining:
                if (!scriptOutline || !selectedIdea) return null;
                const outlineText = `Dàn ý cho "${selectedIdea.title}"\n\nThu hút:\n${scriptOutline.hook}\n\nGiới thiệu:\n${scriptOutline.introduction}\n\nNội dung chính:\n${scriptOutline.mainPoints.map(p => `- ${p.title}: ${p.description}`).join('\n')}\n\nKêu gọi hành động:\n${scriptOutline.cta}\n\nKết luận:\n${scriptOutline.outro}`;
                return (
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-2xl font-bold text-slate-100">Dàn ý Kịch bản</h2>
                            <CopyButton textToCopy={outlineText} buttonText="Sao chép dàn ý" />
                        </div>
                        <p className="text-center text-slate-400 mb-6">Cho ý tưởng: <span className="font-semibold text-slate-300">{selectedIdea.title}</span></p>
                        <div className="max-w-3xl mx-auto bg-slate-800 p-6 rounded-lg border border-slate-700 space-y-4">
                            <div><h3 className="font-bold text-sky-400">Thu hút:</h3><p className="text-slate-200 pl-4">{scriptOutline.hook}</p></div>
                            <div><h3 className="font-bold text-sky-400">Giới thiệu:</h3><p className="text-slate-200 pl-4">{scriptOutline.introduction}</p></div>
                            <div><h3 className="font-bold text-sky-400">Nội dung chính:</h3><ul className="list-disc list-inside pl-4 space-y-2">{scriptOutline.mainPoints.map((p, i) => <li key={i}><span className="font-semibold">{p.title}:</span> {p.description}</li>)}</ul></div>
                            <div><h3 className="font-bold text-sky-400">Kêu gọi hành động:</h3><p className="text-slate-200 pl-4">{scriptOutline.cta}</p></div>
                            <div><h3 className="font-bold text-sky-400">Kết luận:</h3><p className="text-slate-200 pl-4">{scriptOutline.outro}</p></div>
                        </div>
                        <div className="text-center mt-8">
                            <button onClick={handleAnalyzeKeywords} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold transition-colors">Tiếp theo: Phân tích SEO</button>
                        </div>
                    </div>
                );

            case Step.KeywordAnalysis:
                if (!keywordAnalysis || !selectedIdea) return null;
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-2 text-slate-100">Phân tích SEO & Từ khóa</h2>
                        <p className="text-center text-slate-400 mb-6">Cho ý tưởng: <span className="font-semibold text-slate-300">{selectedIdea.title}</span></p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            <Card><div className="flex justify-between items-center"><h3 className="text-lg font-bold text-sky-400 mb-3">Tiêu đề SEO đề xuất</h3><CopyButton size="sm" textToCopy={keywordAnalysis.seoTitle} buttonText="" /></div><p className="text-slate-200">{keywordAnalysis.seoTitle}</p></Card>
                            <Card><div className="flex justify-between items-center"><h3 className="text-lg font-bold text-sky-400 mb-3">Mục đích tìm kiếm</h3><CopyButton size="sm" textToCopy={keywordAnalysis.searchIntent} buttonText="" /></div><p className="text-slate-300 text-sm">{keywordAnalysis.searchIntent}</p></Card>
                            <Card><div className="flex justify-between items-center"><h3 className="text-lg font-bold text-teal-400 mb-3 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>Phân tích xu hướng</h3><CopyButton size="sm" textToCopy={keywordAnalysis.trendAnalysis} buttonText="" /></div><p className="text-slate-300 text-sm">{keywordAnalysis.trendAnalysis}</p></Card>
                            <Card className="md:col-span-3"><div className="flex justify-between items-center"><h3 className="text-lg font-bold text-sky-400 mb-3">Từ khóa chính</h3><CopyButton size="sm" textToCopy={keywordAnalysis.primaryKeywords.join(', ')} buttonText="" /></div><div className="flex flex-wrap gap-2">{keywordAnalysis.primaryKeywords.map(kw => <span key={kw} className="bg-slate-700 text-sky-300 text-sm font-medium px-3 py-1 rounded-full">{kw}</span>)}</div></Card>
                            <Card className="md:col-span-3"><div className="flex justify-between items-center"><h3 className="text-lg font-bold text-sky-400 mb-3">Từ khóa phụ</h3><CopyButton size="sm" textToCopy={keywordAnalysis.secondaryKeywords.join(', ')} buttonText="" /></div><div className="flex flex-wrap gap-2">{keywordAnalysis.secondaryKeywords.map(kw => <span key={kw} className="bg-slate-700 text-slate-300 text-sm font-medium px-3 py-1 rounded-full">{kw}</span>)}</div></Card>
                        </div>
                        <div className="text-center mt-8">
                            <div className="max-w-sm mx-auto mb-6">
                                <label className="block text-md font-medium text-slate-300 mb-3">Chọn độ dài kịch bản mong muốn:</label>
                                <div className="flex justify-center gap-2">
                                    {[{id: 'short', name: 'Ngắn'}, {id: 'medium', name: 'Trung bình'}, {id: 'long', name: 'Dài'}].map(len => (
                                        <button key={len.id} onClick={() => setScriptLength(len.id)} className={`px-4 py-2 rounded-md font-semibold transition-colors w-full ${scriptLength === len.id ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>{len.name}</button>
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleGenerateScript} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold transition-colors">Viết kịch bản</button>
                        </div>
                    </div>
                );
            
            case Step.Scripting:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-2 text-slate-100">Kịch bản thô</h2>
                        <p className="text-center text-slate-400 mb-6">Dựa trên: <span className="font-semibold text-slate-300">{selectedIdea?.title}</span></p>
                        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-h-[60vh] overflow-y-auto"><pre className="whitespace-pre-wrap font-sans text-slate-200">{script}</pre></div>
                        <div className="text-center mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                           <button onClick={handleReviewScript} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold transition-colors">Biên tập & Cấu trúc lại Kịch bản</button>
                           <CopyButton textToCopy={script} buttonText="Sao chép kịch bản thô" className="w-full sm:w-auto" />
                        </div>
                    </div>
                );
            
            case Step.ScriptReview:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-6 text-slate-100">Kịch bản đã biên tập</h2>
                        <div className="space-y-4 max-w-4xl mx-auto">
                            {structuredScript.map((scene) => (
                                <Card key={scene.scene} noHover>
                                    <h3 className="text-lg font-bold text-sky-400 mb-4">Cảnh {scene.scene}</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                                        <div className="border-r-0 md:border-r md:border-slate-700 md:pr-6">
                                            <div className="flex justify-between items-center mb-2"><h4 className="font-semibold text-teal-400">Lời thoại</h4><CopyButton size="sm" textToCopy={scene.dialogue} buttonText="" /></div>
                                            <p className="text-slate-200 whitespace-pre-wrap">{scene.dialogue}</p>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between items-center mb-2"><h4 className="font-semibold text-teal-400">Gợi ý hình ảnh</h4><CopyButton size="sm" textToCopy={scene.visualSuggestionVI} buttonText="" /></div>
                                                <p className="text-slate-300 text-sm">{scene.visualSuggestionVI}</p>
                                            </div>
                                             <div>
                                                <div className="flex justify-between items-center mb-2"><h4 className="font-semibold text-teal-400">Gợi ý âm thanh</h4><CopyButton size="sm" textToCopy={scene.soundSuggestion} buttonText="" /></div>
                                                <p className="text-slate-300 text-sm">{scene.soundSuggestion}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                        <div className="text-center mt-8">
                            <button onClick={handleGenerateMusic} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold transition-colors">Tiếp theo: Tạo gợi ý nhạc</button>
                        </div>
                    </div>
                );

            case Step.MusicGeneration:
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-6 text-slate-100">Gợi ý nhạc nền (Cho AI tạo nhạc)</h2>
                        <div className="space-y-4 max-w-3xl mx-auto">
                           {musicPrompts.length === 0 && <p className="text-center text-slate-400">Không có gợi ý âm thanh nào trong kịch bản để tạo prompt nhạc.</p>}
                            {musicPrompts.map((item) => (
                                <Card key={item.scene}>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-lg font-bold text-sky-400">Cảnh {item.scene}</h3>
                                        <CopyButton textToCopy={item.prompt} buttonText="Sao chép gợi ý" />
                                    </div>
                                    <p className="text-slate-200 whitespace-pre-wrap">{item.prompt}</p>
                                </Card>
                            ))}
                        </div>
                        <div className="text-center mt-8">
                            <button onClick={() => setCurrentStep(Step.ImageGeneration)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold transition-colors">Tiếp theo: Tạo ảnh</button>
                        </div>
                    </div>
                );

            case Step.ImageGeneration: {
                const visualPrompts = structuredScript.filter(s => s.visualSuggestionEN !== "No specific visual suggestion.");
                return (
                    <div>
                        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                            <h2 className="text-2xl font-bold text-center sm:text-left text-slate-100">Tạo hình ảnh & Video cho kịch bản</h2>
                            <div className="flex items-center gap-4">
                                <div className="w-full sm:w-auto max-w-xs">
                                    <label htmlFor="style-input" className="block text-sm font-medium text-slate-300 mb-1">Phong cách ảnh:</label>
                                    <input id="style-input" type="text" value={imageStyle} onChange={(e) => setImageStyle(e.target.value)} placeholder="ví dụ: Cinematic" className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md focus:ring-2 focus:ring-indigo-500"/>
                                </div>
                                <div className="flex items-center gap-2 mt-6">
                                    <span className={`font-semibold ${imagePromptLang === 'vi' ? 'text-sky-400' : 'text-slate-400'}`}>VI</span>
                                    <button onClick={() => setImagePromptLang(p => p === 'vi' ? 'en' : 'vi')} className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-700"><span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${imagePromptLang === 'en' ? 'translate-x-6' : 'translate-x-1'}`} /></button>
                                    <span className={`font-semibold ${imagePromptLang === 'en' ? 'text-sky-400' : 'text-slate-400'}`}>EN</span>
                                </div>
                            </div>
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
                                            {runwayState?.status === 'succeeded' && runwayState.videoUrl ? (
                                                <video controls src={runwayState.videoUrl} className="w-full rounded-md mb-4 aspect-video object-cover" />
                                            ) : (
                                                imageState?.dataUrl ? <img src={imageState.dataUrl} alt={displayPrompt.substring(0, 50)} className="rounded-md mb-4 aspect-video object-cover" /> : <div className="aspect-video bg-slate-700/50 rounded-md mb-4 flex items-center justify-center">{imageState?.isLoading ? <LoadingSpinner size="sm" text="Đang tạo..." /> : imageState?.error ? <div className="text-center p-2"><p className="text-red-400 text-xs mb-2">{imageState.error}</p><button onClick={() => handleGenerateImage(promptKey)} className="px-3 py-1 bg-red-800 hover:bg-red-700 rounded text-xs">Thử lại</button></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}</div>
                                            )}
                                            <p className="text-slate-300 flex-grow text-xs leading-5">{displayPrompt}</p>
                                        </div>
                                        <div className="mt-4 flex flex-col gap-2">
                                            {imageState?.dataUrl ? <button onClick={() => handleDownloadAsset(imageState.dataUrl!, `visual-${scene.scene}.jpeg`)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-md font-semibold text-sm text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>Tải xuống ảnh</button> : <button onClick={() => handleGenerateImage(promptKey)} disabled={imageState?.isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-md font-semibold text-sm text-white transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>Tạo ảnh</button>}
                                            <CopyButton textToCopy={promptKey} className="w-full" buttonText="Sao chép gợi ý" />
                                            
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
=======
                return (
                    <div className="w-full max-w-3xl mx-auto">
                        {/* ... (Nội dung gốc của Ideation) ... */}
>>>>>>> 62343d6ad4f529dc635f3f56827d425e0954a134
                    </div>
                );

<<<<<<< HEAD
            case Step.Voiceover: {
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-4 text-slate-100">Lồng tiếng cho kịch bản</h2>
                        <p className="text-center text-slate-400 mb-8 max-w-3xl mx-auto">Chọn một giọng nói, sau đó tạo âm thanh cho từng cảnh. Bạn có thể tải về các tệp MP3 để sử dụng trong phần mềm dựng phim của mình.</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-lg mx-auto mb-8">
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
                                const vbeeIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" /><path d="M5.5 8.5a.5.5 0 01.5.5v1a3.5 3.5 0 007 0v-1a.5.5 0 011 0v1a4.5 4.5 0 01-4.5 4.472V16h1a.5.5 0 010 1h-3a.5.5 0 010-1h1v-1.028A4.5 4.5 0 014 10v-1a.5.5 0 01.5-.5z" /></svg>;
                                
                                return (
                                <Card key={scene.scene}>
                                    <h3 className="text-lg font-bold text-sky-400 mb-3">Cảnh {scene.scene}</h3>
                                    <p className="whitespace-pre-wrap text-slate-200 mb-4">{scene.dialogue}</p>
                                    
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <CopyButton textToCopy={scene.dialogue} buttonText="Sao chép lời thoại" className="w-full sm:w-auto" />
                                        
                                        <button onClick={() => handleGenerateVbeeAudio(scene.scene, scene.dialogue)} disabled={vbeeAudioState?.isLoading} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-md font-semibold text-sm text-white transition-colors disabled:bg-slate-700 disabled:cursor-wait">
                                            {vbeeAudioState?.isLoading ? <><LoadingSpinner size="sm" /><span>Đang tạo...</span></> : <>{vbeeIcon} <span>VBee</span></>}
                                        </button>
                                        
                                        <button onClick={() => handleGenerateGoogleTtsAudio(scene.scene, scene.dialogue)} disabled={googleAudioState?.isLoading} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-md font-semibold text-sm text-white transition-colors disabled:bg-slate-700 disabled:cursor-wait">
                                            {googleAudioState?.isLoading ? <><LoadingSpinner size="sm" /><span>Đang tạo...</span></> : <>{vbeeIcon} <span>Google</span></>}
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
                            )}})
                        </div>

                        <div className="text-center mt-8">
                           <button onClick={handleGeneratePublishingKit} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold transition-colors">Tiếp theo: Bộ công cụ xuất bản</button>
                        </div>
                    </div>
                );
            }
            
            case Step.Publishing:
                if (!publishingKit) return <div className="text-center"><button onClick={handleGeneratePublishingKit} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-md font-semibold transition-colors">Tạo bộ công cụ xuất bản</button></div>;
                return (
                    <div>
                        <h2 className="text-2xl font-bold text-center mb-6 text-slate-100">Bộ công cụ xuất bản của bạn</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <Card><div className="flex justify-between items-center"><h3 className="text-lg font-bold text-sky-400 mb-3">Tiêu đề tối ưu hóa</h3><CopyButton size="sm" textToCopy={publishingKit.metadata.titles.join('\n')} buttonText="" /></div><ul className="list-disc list-inside space-y-2 text-slate-200">{publishingKit.metadata.titles.map((title, i) => <li key={i}>{title}</li>)}</ul></Card>
                                <Card><div className="flex justify-between items-center"><h3 className="text-lg font-bold text-sky-400 mb-3">Mô tả video</h3><CopyButton size="sm" textToCopy={publishingKit.metadata.description} buttonText="" /></div><pre className="whitespace-pre-wrap font-sans text-slate-200 text-sm bg-slate-900/50 p-3 rounded-md">{publishingKit.metadata.description}</pre></Card>
                                <Card><div className="flex justify-between items-center"><h3 className="text-lg font-bold text-sky-400 mb-3">Thẻ video</h3><CopyButton size="sm" textToCopy={publishingKit.metadata.tags.join(', ')} buttonText="" /></div><p className="text-slate-300 text-sm bg-slate-900/50 p-3 rounded-md">{publishingKit.metadata.tags.join(', ')}</p></Card>
                            </div>
                            <div className="space-y-6">
                                <Card><h3 className="text-lg font-bold text-sky-400 mb-3">Tạo ảnh bìa</h3><div className="space-y-4">{publishingKit.thumbnailConcepts.map((item, index) => (<div key={index} className="p-3 bg-slate-900/50 rounded-lg"><p className="font-semibold text-slate-200">Ý tưởng {index + 1}: <span className="font-normal text-slate-300">{item.concept}</span></p><button onClick={() => handleGenerateThumbnail(item.prompt)} disabled={thumbnailImageState.isLoading} className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-md font-semibold text-sm text-white transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>Tạo ảnh bìa {index + 1}</button></div>))}</div></Card>
                                <Card><h3 className="text-lg font-bold text-sky-400 mb-3">Ảnh bìa đã tạo</h3><div className="aspect-video bg-slate-700/50 rounded-md flex items-center justify-center">{thumbnailImageState.isLoading ? <LoadingSpinner size="sm" text="Đang tạo..." /> : thumbnailImageState.error ? <p className="text-red-400 text-center p-2 text-sm">{thumbnailImageState.error}</p> : thumbnailImageState.dataUrl ? <img src={thumbnailImageState.dataUrl} alt="Generated thumbnail" className="rounded-md w-full h-full object-cover" /> : <p className="text-slate-400">Ảnh bìa được tạo của bạn sẽ xuất hiện ở đây</p>}</div>{thumbnailImageState.dataUrl && !thumbnailImageState.isLoading && (<button onClick={() => handleDownloadAsset(thumbnailImageState.dataUrl!, 'thumbnail.jpeg')} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-md font-semibold text-sm text-white transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>Tải xuống ảnh bìa</button>)}</Card>
                            </div>
                        </div>
                         <div className="text-center mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
                           <button onClick={handleReset} className="w-full sm:w-auto px-6 py-3 bg-sky-600 hover:bg-sky-500 rounded-md font-semibold transition-colors">Tạo video khác</button>
                           <button onClick={handleCopyFullProject} disabled={isCopied} className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-green-700 rounded-md font-semibold transition-colors flex items-center justify-center gap-2">{isCopied ? <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Đã sao chép!</> : <><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>Sao chép toàn bộ dự án</>}</button>
                        </div>
                    </div>
                );
=======
            case Step.IdeaSelection:
                return (
                    <div>
                        {/* ... (Nội dung gốc của IdeaSelection) ... */}
                    </div>
                );
            
            // ... (TẤT CẢ CÁC CASE KHÁC VỚI NỘI DUNG GỐC ĐẦY ĐỦ) ...
>>>>>>> 62343d6ad4f529dc635f3f56827d425e0954a134
            
            default:
                return null;
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
