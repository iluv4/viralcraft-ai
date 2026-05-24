import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  ArrowLeft, 
  ChevronRight, 
  MessageSquare, 
  Camera, 
  Layout, 
  Zap,
  Download,
  Share2,
  Settings,
  AudioLines,
  Play,
  CheckCircle2,
  RefreshCw,
  MoreVertical,
  MousePointer2,
  Loader2,
  Video,
  Send,
  User,
  Bot,
  Film,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { Project, RemakeOutput } from "../types";
import { generateRemakeStrategy, generateThumbnailPrompt, chatWithVideo } from "../services/geminiService";
import { generateSpeech, playAudioFromBase64 } from "../services/ttsService";
import { generateThumbnailImage } from "../services/imageService";
import { useAuth } from "../contexts/AuthContext";
import { getProject, updateProject, saveProjectScene, saveProjectFrame, getProjectScenes, getProjectFrames } from "../services/projectService";

export default function ProjectAnalysis() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [remake, setRemake] = useState<RemakeOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("narration");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [genStep, setGenStep] = useState(0);
  const [isGeneratingScenarioImages, setIsGeneratingScenarioImages] = useState<string | null>(null); // 'original' | 'remake' | 'original-frames' | null
  const [scenarioView, setScenarioView] = useState<'original' | 'remake'>('remake');

  // Chat State
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: "안녕하세요! 분석된 영상을 바탕으로 어떤 점이 궁금하신가요? 구체적인 수정 사항이나 바이럴 팁을 물어보세요!" }
  ]);

  const genSteps = [
    "원본 바이럴 분석 데이터 검토 중...",
    "한국 시장 타겟 오디언스 페르소나 설정 및 매칭 중...",
    "바이럴 요소를 포함한 한국어 내레이션 스크립트 작성 중...",
    "영상 길이에 최적화된 촬영 구도 및 앵글 설계 중...",
    "리메이크 전략 리포트 완성 및 시각화 준비 중..."
  ];

  useEffect(() => {
    let interval: any;
    if (isGenerating) {
        setGenStep(0);
        interval = setInterval(() => {
            setGenStep(prev => (prev < genSteps.length - 1 ? prev + 1 : prev));
        }, 2000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    } else if (user && id) {
      fetchProject();
    }
  }, [user, loading, id, navigate]);

  const fetchProject = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await getProject(id);
      if (data) {
        // Fetch sub-collections for images to avoid 1MB limit issues
        const [scenes, frames] = await Promise.all([
          getProjectScenes(id),
          getProjectFrames(id)
        ]);

        // Merge original scenario images
        if (data.originalAnalysis?.scenario) {
          data.originalAnalysis.scenario = data.originalAnalysis.scenario.map((s, idx) => {
            const found = scenes.find(scene => scene.id === `original-${idx}`);
            return found ? { ...s, imageUrl: found.imageUrl } : s;
          });
        }

        // Merge remake scenario images
        if (data.remakeOutput?.remakeScenario) {
          data.remakeOutput.remakeScenario = data.remakeOutput.remakeScenario.map((s, idx) => {
            const found = scenes.find(scene => scene.id === `remake-${idx}`);
            return found ? { ...s, imageUrl: found.imageUrl } : s;
          });
        }

        // Merge key timestamps images
        if (data.originalAnalysis?.keyTimestamps) {
          data.originalAnalysis.keyTimestamps = data.originalAnalysis.keyTimestamps.map((t, idx) => {
            const found = frames.find(frame => frame.id === `frame-${idx}`);
            return found ? { ...t, screenshotUrl: found.screenshotUrl } : t;
          });
        }

        setProject(data);
        if (data.remakeOutput) {
          setRemake(data.remakeOutput);
        }
        if (data.brandImage) {
          setGeneratedImage(data.brandImage);
        }
      } else {
        toast.error("프로젝트를 찾을 수 없습니다.");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      toast.error("프로젝트를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayTTS = async () => {
    if (!remake?.narration) return;
    setIsPlaying(true);
    toast.info("내레이션을 생성 중입니다...");
    try {
      if (project.title.startsWith("데모:")) {
        await new Promise(r => setTimeout(r, 1000));
        toast.success("데모 모드: 음성 재생 시뮬레이션 중");
        return;
      }
      const base64 = await generateSpeech(remake.narration);
      playAudioFromBase64(base64);
      toast.success("내레이션 재생 중");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "음성 생성에 실패했습니다.");
    } finally {
      setIsPlaying(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!remake) return;
    setIsGeneratingImage(true);
    toast.info("시각적 컨셉 이미지를 생성 중입니다...");
    try {
      if (project.title.startsWith("데모:")) {
         await new Promise(r => setTimeout(r, 1500));
         setGeneratedImage("https://picsum.photos/seed/viral/1920/1080");
         toast.success("데모 이미지 생성 완료!");
         return;
      }
      const prompt = await generateThumbnailPrompt(remake);
      const imageUrl = await generateThumbnailImage(prompt);
      setGeneratedImage(imageUrl);
      
      // Save to project
      if (id) {
        await updateProject(id, { brandImage: imageUrl });
      }
      
      toast.success("이미지 생성 및 저장 완료!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "이미지 생성에 실패했습니다.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateRemake = async () => {
    if (!project?.originalAnalysis || !id) return;
    setIsGenerating(true);
    toast.info("AI가 리메이크 전략 및 스토리보드를 수립하고 있습니다...");
    
    try {
      let result;
      if (project.title.startsWith("데모:")) {
        // Mock strategy data
        await new Promise(r => setTimeout(r, 2000));
        result = {
          narration: "안녕하세요! 오늘은 정말 특별한 레시피를 가져왔어요. (시뮬레이션)\n\n사실 비법은 아주 간단한데 많은 분들이 놓치고 계시거든요. 바로 이 '두 방울'이 포인트입니다.\n\n지금부터 30초 만에 완벽하게 보여드릴 테니 끝까지 집중해주세요!",
          shootingAngles: [
            { type: "45-degree High Angle", description: "제품이 가장 예쁘게 보이는 상단 45도 각도에서 시작하며 훅을 잡습니다." },
            { type: "Extreme Close-up (ASMR)", description: "질감이 느껴질 정도의 초근접 촬영과 함께 선명한 소리를 담아 청각적 몰입감을 줍니다." },
            { type: "Eye-level POV", description: "사용자가 주인공이 된 듯한 시점에서 친근하게 정보를 전달하는 컷입니다." },
            { type: "Dynamic Hand-held", description: "약간의 흔들림을 주어 현장감과 트렌디한 느낌을 살린 마무리 샷입니다." }
          ],
          editFormat: "15-30초 빠른 컷 위주 (시뮬레이션)",
          viralScore: 88,
          tips: ["배경 음악은 틱톡 인기 오디오를 사용하세요.", "자막은 화면 중앙보다 약간 위쪽에 배치하세요."],
          remakeScenario: [
            { time: "0:00-0:03", description: "강렬한 오프닝 훅: 제품의 가장 매력적인 부분을 초근접 촬영", visualConcept: "Cinematic close-up of a vibrant product with soft bokeh background, high fashion lighting" },
            { time: "0:03-0:10", description: "제품 사용 시연: 리드미컬한 편집", visualConcept: "Hands interacting with a luxury product, dynamic motion blur, bright studio lighting" },
            { time: "0:10-0:25", description: "바이럴 포인트 강조: 비포 에프터 혹은 핵심 기능", visualConcept: "Split screen showing before and after effect, clean minimalist aesthetic" },
            { time: "0:25-0:30", description: "엔딩 및 CTA: 브랜드 로고와 함께 마무리", visualConcept: "Professional product display with elegant typography on screen, warm sunset lighting" }
          ]
        };
      } else {
        result = await generateRemakeStrategy(project.originalAnalysis);
      }
      
      setRemake(result);
      
      // Save to Firestore
      await updateProject(id, { remakeOutput: result });
      
      toast.success("전략 및 스토리보드 생성이 완료되었습니다!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "전략 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateScenarioImages = async (type: 'original' | 'remake' | 'original-frames') => {
    if (!id || !project) return;
    setIsGeneratingScenarioImages(type);
    
    const msg = type === 'original-frames' 
        ? "원본 영상의 주요 장면을 추출(생성) 중입니다..." 
        : "스토리보드 장면별 이미지를 생성 중입니다. 시간이 다소 소요될 수 있습니다...";
    toast.info(msg);

    try {
      if (type === 'original-frames') {
        const updatedAnalysis = { ...project.originalAnalysis! };
        const timestamps = [...(updatedAnalysis.keyTimestamps || [])];

        // Main Thumbnail
        if (!updatedAnalysis.thumbnailUrl) {
            const thumbUrl = await generateThumbnailImage(`High quality video cinematic frame, ${updatedAnalysis.hook}, professional lighting`);
            updatedAnalysis.thumbnailUrl = thumbUrl;
            // Thumbnails are usually one per project, so we keep it in main doc for now, 
            // but if it's too big, we might want to move it too. For now let's assume one is fine.
        }

        // Scene Captures
        for (let i = 0; i < timestamps.length; i++) {
          if (!timestamps[i].screenshotUrl && timestamps[i].visualConcept) {
             const imageUrl = await generateThumbnailImage(timestamps[i].visualConcept!);
             timestamps[i].screenshotUrl = imageUrl;
             // Save to sub-collection
             await saveProjectFrame(id, `frame-${i}`, { screenshotUrl: imageUrl });
          }
        }

        updatedAnalysis.keyTimestamps = timestamps;
        
        // Strip images from main doc update
        const strippedAnalysis = { 
          ...updatedAnalysis, 
          keyTimestamps: timestamps.map(t => ({ ...t, screenshotUrl: undefined })) 
        };

        await updateProject(id, { originalAnalysis: strippedAnalysis });
        setProject({ ...project, originalAnalysis: updatedAnalysis });
      } else {
        const targetScenario = type === 'original' 
          ? project.originalAnalysis?.scenario 
          : remake?.remakeScenario;

        if (!targetScenario) return;
        const updatedScenario = [...targetScenario];
        
        for (let i = 0; i < updatedScenario.length; i++) {
          const scene = updatedScenario[i];
          if (!scene.imageUrl) {
            try {
              const imageUrl = await generateThumbnailImage(scene.visualConcept);
              updatedScenario[i] = { ...scene, imageUrl };
              // Save to sub-collection
              await saveProjectScene(id, `${type}-${i}`, { imageUrl });
            } catch (e) {
              console.error(`Failed to generate image for scene ${i}`, e);
            }
          }
        }

        // Strip images for main doc update
        const strippedScenario = updatedScenario.map(s => ({ ...s, imageUrl: undefined }));

        if (type === 'original') {
          const updatedAnalysis = { ...project.originalAnalysis!, scenario: updatedScenario };
          const strippedAnalysis = { ...project.originalAnalysis!, scenario: strippedScenario };
          await updateProject(id, { originalAnalysis: strippedAnalysis });
          setProject({ ...project, originalAnalysis: updatedAnalysis });
        } else {
          const updatedRemake = { ...remake!, remakeScenario: updatedScenario };
          const strippedRemake = { ...remake!, remakeScenario: strippedScenario };
          await updateProject(id, { remakeOutput: strippedRemake });
          setRemake(updatedRemake);
        }
      }

      toast.success("이미지 생성 및 저장이 완료되었습니다!");
    } catch (error: any) {
      console.error(error);
      toast.error("이미지 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGeneratingScenarioImages(null);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !project) return;
    
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);

    try {
      if (project.title.startsWith("데모:")) {
        await new Promise(r => setTimeout(r, 1000));
        setChatHistory(prev => [...prev, { role: 'assistant', content: "데모 모드입니다. 실제 AI와 대화하려면 프로젝트를 새로 생성해주세요! (이 스크립트는 시뮬레이션입니다)" }]);
        return;
      }
      
      const geminiHistory = chatHistory.map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: h.content
      }));

      const response = await chatWithVideo(userMsg, geminiHistory as any, project, remake || undefined);
      setChatHistory(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "대화 중 오류가 발생했습니다.");
    } finally {
      setIsChatLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6321]" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
            className="rounded-full hover:bg-zinc-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-[#FF6321] border-orange-100 bg-orange-50/50">Analysis In Progress</Badge>
                <span className="text-zinc-300">•</span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {project.createdAt?.toDate 
                    ? project.createdAt.toDate().toLocaleDateString() 
                    : new Date(project.createdAt || Date.now()).toLocaleDateString()}
                </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full gap-2">
                <Share2 className="w-4 h-4" /> 공유하기
            </Button>
            <Button variant="outline" size="icon" className="rounded-full">
                <MoreVertical className="w-4 h-4" />
            </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Original Analysis */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-xl shadow-zinc-100 rounded-[32px] overflow-hidden bg-white">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                    <Video className="w-5 h-5 text-zinc-400" /> 원본 영상 분석
                </CardTitle>
                <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleGenerateScenarioImages('original-frames')}
                        disabled={!!isGeneratingScenarioImages}
                        className="rounded-full text-xs font-bold gap-2 text-[#FF6321] hover:bg-orange-50"
                    >
                        {isGeneratingScenarioImages === 'original-frames' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                        캡처
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 space-y-0">
              {/* Hero Image Section with Overlaid Grid Insights */}
              <div className="relative aspect-video group">
                  {project.originalAnalysis?.thumbnailUrl ? (
                    <img 
                      src={project.originalAnalysis.thumbnailUrl} 
                      alt="Original Thumbnail" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                        <Video className="w-12 h-12 text-zinc-200" />
                    </div>
                  )}
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                      <div className="space-y-4">
                          <div className="flex items-center gap-2">
                              <Badge className="bg-[#FF6321] text-white border-none text-[10px] uppercase font-black tracking-widest px-2 py-0.5">Viral Insight</Badge>
                              <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 text-[10px] font-bold">오리지널 분석</Badge>
                          </div>
                          <h4 className="text-xl font-bold text-white line-clamp-2 leading-tight">
                              {project.originalAnalysis?.hook ? `"${project.originalAnalysis.hook}"` : "영상 분석 데이터 로딩 중..."}
                          </h4>

                          {/* Quick Stats Overlaid on Image */}
                          <div className="grid grid-cols-3 gap-3 pt-2">
                              {[
                                  { label: "템포", value: project.originalAnalysis?.tempo, icon: Zap },
                                  { label: "구성", value: project.originalAnalysis?.structure, icon: Layout },
                                  { label: "CTA", value: project.originalAnalysis?.cta, icon: MousePointer2 }
                              ].map((item, i) => (
                                  <div key={i} className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-2 flex flex-col gap-0.5">
                                      <div className="flex items-center gap-1">
                                          <item.icon className="w-2.5 h-2.5 text-orange-400" />
                                          <span className="text-[8px] font-bold text-white/60 uppercase">{item.label}</span>
                                      </div>
                                      <div className="text-[10px] font-bold text-white truncate">{item.value || "-"}</div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>

              <div className="p-8 space-y-8">
                <div>
                  <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">바이럴 포인트 분석</h4>
                  <div className="grid grid-cols-1 gap-3">
                      {project.originalAnalysis?.viralPoints?.map((point, i) => (
                          <div key={i} className="flex items-center gap-3 bg-zinc-50 p-3 rounded-2xl border border-zinc-100 group hover:border-orange-200 transition-colors">
                              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:bg-orange-100">
                                  <CheckCircle2 className="w-3 h-3 text-[#FF6321]" />
                              </div>
                              <span className="text-xs font-semibold text-zinc-600 truncate">{point}</span>
                          </div>
                      ))}
                  </div>
                </div>

                {project.originalAnalysis?.keyTimestamps && project.originalAnalysis.keyTimestamps.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                        핵심 장면 분석 (Scene Captures)
                        <span className="text-[8px] font-bold text-zinc-300 bg-zinc-100 px-1.5 py-0.5 rounded-full">{project.originalAnalysis.keyTimestamps.length}장</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {project.originalAnalysis.keyTimestamps.map((moment, i) => (
                        <div key={i} className="space-y-2 group">
                          <div className="relative aspect-video rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50">
                             {moment.screenshotUrl ? (
                               <img 
                                 src={moment.screenshotUrl} 
                                 alt={moment.label} 
                                 className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                                 referrerPolicy="no-referrer"
                               />
                             ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center gap-1 opacity-20">
                                 <ImageIcon className="w-6 h-6" />
                                 <span className="text-[8px] font-bold uppercase">Ready</span>
                               </div>
                             )}
                             <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-md rounded text-[9px] font-bold text-white">
                               {moment.time}
                             </div>
                          </div>
                          <div className="text-[10px] font-bold text-zinc-700 leading-tight truncate px-1">
                            {moment.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {project.originalAnalysis?.scenario && (
                  <Button 
                      variant="outline" 
                      className="w-full rounded-2xl border-orange-100 text-orange-600 hover:bg-orange-50 font-bold gap-2 mt-4"
                      onClick={() => {
                          setScenarioView('original');
                          setActiveTab('scenario');
                      }}
                  >
                      <Film className="w-4 h-4" /> 원본 영상 스토리보드 상세 보기
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {remake && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="border-none shadow-xl shadow-zinc-100 rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="bg-zinc-50 border-b border-zinc-100 pb-4">
                    <CardTitle className="text-lg font-bold flex items-center gap-2 text-zinc-800">
                        <Zap className="w-5 h-5 text-orange-400" /> 바이럴 지표 분석 (Viral Scorecard)
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {[
                    { label: "오프닝 임팩트", score: remake.viralScore + 5, color: "bg-orange-500" },
                    { label: "시청 지속 흐름", score: remake.viralScore - 3, color: "bg-blue-500" },
                    { label: "전환 유도력", score: remake.viralScore + 2, color: "bg-emerald-500" },
                  ].map((s, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-zinc-400">{s.label}</span>
                        <span className="text-zinc-800">{s.score}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${s.score}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                          className={`h-full ${s.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Button 
            onClick={handleGenerateRemake}
            disabled={isGenerating || !!remake}
            className="w-full bg-[#1D1D1F] hover:bg-black text-white h-16 rounded-[24px] text-lg font-bold shadow-2xl shadow-zinc-200"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                전략 구상 중...
              </>
            ) : remake ? (
              <>리메이크 전략 수립 완료</>
            ) : (
              <>한국형 리메이크 전략 생성 <Sparkles className="ml-2 w-5 h-5 text-orange-400" /></>
            )}
          </Button>
        </div>

        {/* Right Column: Remake Results */}
        <div className="lg:col-span-8 flex flex-col">
          {!remake && !isGenerating ? (
            <div className="flex-1 min-h-[500px] border-2 border-dashed border-zinc-100 rounded-[40px] flex flex-col items-center justify-center p-12 text-center bg-zinc-50/50">
              <div className="w-20 h-20 bg-white rounded-[28px] shadow-sm flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-zinc-200" />
              </div>
              <h3 className="text-xl font-bold mb-2">리메이크 전략을 들어보세요</h3>
              <p className="text-zinc-400 text-sm max-w-sm">
                내레이션 대본, 촬영 구도, 편집 포맷 등 한국 시장에 맞는 최적의 전략을 생성합니다.
              </p>
            </div>
          ) : isGenerating ? (
            <div className="flex-1 min-h-[500px] bg-white rounded-[40px] border border-zinc-100 p-12 flex flex-col items-center justify-center space-y-10">
               <div className="relative">
                  <div className="w-28 h-28 border-4 border-orange-50 border-t-[#FF6321] rounded-full animate-spin" />
                  <Sparkles className="absolute inset-0 m-auto w-10 h-10 text-[#FF6321] animate-pulse" />
               </div>
               <div className="text-center space-y-6 w-full max-w-sm">
                  <div>
                    <h3 className="text-xl font-bold mb-2">AI 맞춤 리메이크 전략 수립 중</h3>
                    <p className="text-zinc-400 text-sm">타겟 오디언스 분석 및 한국어 최적화가 진행되고 있습니다.</p>
                  </div>
                  
                  <div className="space-y-3 text-left">
                    {genSteps.map((step, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ 
                            opacity: i <= genStep ? 1 : 0.3, 
                            x: 0,
                            color: i === genStep ? "#FF6321" : i < genStep ? "#22c55e" : "#94a3b8" 
                        }}
                        className="flex items-center gap-3 text-xs font-bold"
                      >
                        {i < genStep ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : i === genStep ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-zinc-200" />
                        )}
                        <span>{step}</span>
                      </motion.div>
                    ))}
                  </div>
               </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Result Controls */}
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-1">
                      <div className="bg-orange-600 text-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">바이럴 점수: {remake?.viralScore}%</div>
                   </div>
                   <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 rounded-full text-xs font-bold gap-1 text-zinc-400">
                            <RefreshCw className="w-3 h-3" /> 다시 생성
                        </Button>
                   </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white rounded-[40px] border border-zinc-100 overflow-hidden shadow-xl shadow-zinc-100 flex flex-col h-full min-h-[600px]">
                   <div className="px-8 pt-6 border-b border-zinc-50">
                      <TabsList className="bg-zinc-50/50 p-1 rounded-2xl border border-zinc-100 w-full justify-start gap-1">
                        <TabsTrigger value="narration" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs py-3">
                            <AudioLines className="w-4 h-4 mr-2" /> 내레이션
                        </TabsTrigger>
                        <TabsTrigger value="shooting" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs py-3">
                            <Camera className="w-4 h-4 mr-2" /> 촬영 가이드
                        </TabsTrigger>
                        <TabsTrigger value="format" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs py-3">
                            <Layout className="w-4 h-4 mr-2" /> 편집 포맷
                        </TabsTrigger>
                        <TabsTrigger value="scenario" className="flex-1 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs py-3">
                            <Film className="w-4 h-4 mr-2" /> 스토리보드
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="flex-1 rounded-xl data-[state=active]:bg-orange-600 data-[state=active]:text-white data-[state=active]:shadow-sm font-bold text-xs py-3">
                            <MessageSquare className="w-4 h-4 mr-2" /> AI Q&A
                        </TabsTrigger>
                      </TabsList>
                   </div>

                   <div className="flex-1 p-8 overflow-hidden">
                      <TabsContent value="narration" className="mt-0 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold flex items-center gap-2">
                                <AudioLines className="w-5 h-5 text-[#FF6321]" /> 제안된 한국어 스크립트 (Narration)
                            </h3>
                            <Button 
                              size="sm" 
                              onClick={handlePlayTTS}
                              disabled={isPlaying}
                              className="bg-[#FF6321] rounded-full text-xs font-bold"
                            >
                                {isPlaying ? (
                                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                ) : (
                                  <Play className="w-3 h-3 mr-2 fill-current" />
                                )}
                                {isPlaying ? "생성 중..." : "TTS 재생 (Kore)"}
                            </Button>
                        </div>
                        <ScrollArea className="flex-1 bg-zinc-50 rounded-3xl p-8 border border-zinc-100">
                            <div className="text-lg font-medium leading-[1.8] text-zinc-700 whitespace-pre-wrap">
                                {remake?.narration}
                            </div>
                        </ScrollArea>
                        <div className="mt-6 p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-orange-600">Tip: 오프닝 '훅'에서 숨소리를 0.5초 넣으면 집중력이 20% 올라갑니다.</span>
                            <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full p-0">
                                <ChevronRight className="w-4 h-4 text-orange-600" />
                            </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="shooting" className="mt-0 h-full">
                        <div className="flex flex-col gap-6 h-full">
                          {/* Visual Timeline */}
                          <div className="p-6 bg-zinc-50 rounded-[32px] border border-zinc-100 overflow-hidden">
                             <div className="flex items-center justify-between mb-4">
                               <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">바이럴 장면 타임라인</h4>
                               <span className="text-[10px] font-bold text-orange-600">총 예상 길이: 약 30초</span>
                             </div>
                             <div className="flex h-3 gap-1 w-full bg-zinc-200/50 rounded-full overflow-hidden p-0.5 border border-zinc-100">
                                <motion.div initial={{ flex: 0 }} animate={{ flex: 0.15 }} className="h-full bg-orange-500 rounded-l-full" title="Hook" />
                                <motion.div initial={{ flex: 0 }} animate={{ flex: 0.7 }} className="h-full bg-zinc-400" title="Body" />
                                <motion.div initial={{ flex: 0 }} animate={{ flex: 0.15 }} className="h-full bg-emerald-500 rounded-r-full" title="CTA" />
                             </div>
                             <div className="flex justify-between items-center mt-3">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                                  <span className="text-[10px] font-bold text-zinc-500">오프닝 (0-3초)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-zinc-400" />
                                  <span className="text-[10px] font-bold text-zinc-500">전개 (3-25초)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span className="text-[10px] font-bold text-zinc-500">행동 유도 (25-30초)</span>
                                </div>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
                            <div className="flex flex-col gap-4">
                                <ScrollArea className="h-[450px] pr-4">
                                  <div className="space-y-4">
                                    {remake?.shootingAngles?.map((angle, i) => (
                                        <div key={i} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:bg-white hover:border-orange-100 transition-all group relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-[10px] font-black text-[#FF6321] uppercase tracking-tighter">장면 {i+1}</span>
                                                  <div className="w-1 h-1 rounded-full bg-zinc-300" />
                                                  <span className="text-[8px] font-bold text-zinc-400 uppercase">{angle.type}</span>
                                                </div>
                                            </div>
                                            <h5 className="text-sm font-bold text-zinc-800 leading-tight">{angle.description}</h5>
                                        </div>
                                    ))}
                                  </div>
                                </ScrollArea>
                            </div>
                            <div className="flex flex-col gap-4">
                              <div className="bg-zinc-800 rounded-3xl p-6 text-white flex flex-col justify-end relative overflow-hidden aspect-square">
                                {generatedImage ? (
                                    <img 
                                        src={generatedImage} 
                                        alt="Generated Concept" 
                                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-400 via-transparent to-transparent" />
                                )}
                                <div className="relative z-10">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                        <Camera className="w-6 h-6 text-[#FF6321]" />
                                    </div>
                                    <h4 className="text-xl font-bold mb-2">비주얼 컨셉 미리보기</h4>
                                    <p className="text-zinc-400 text-sm mb-6">
                                        {generatedImage ? "AI가 생성한 비주얼 컨셉입니다." : "촬영 구도와 조명 분위기를 시각화한 프리뷰 이미지입니다."}
                                    </p>
                                    <Button 
                                        onClick={handleGenerateImage}
                                        disabled={isGeneratingImage}
                                        className="w-full bg-white text-black hover:bg-zinc-200 rounded-2xl font-bold"
                                    >
                                        {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : generatedImage ? "다시 생성하기" : "AI 이미지 생성하기"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                </TabsContent>

                      <TabsContent value="format" className="mt-0 h-full">
                        <div className="space-y-6">
                            <div className="p-6 bg-zinc-50 rounded-[24px] border border-zinc-100">
                                <h4 className="font-bold flex items-center gap-2 mb-4">
                                    <Zap className="w-5 h-5 text-blue-500" /> Viral Formatting
                                </h4>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-white p-4 rounded-xl border border-zinc-100">
                                        <div className="text-[10px] font-bold text-zinc-400 mb-1 tracking-widest uppercase">Target Platform</div>
                                        <div className="font-bold">Instagram Reels (9:16)</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-zinc-100">
                                        <div className="text-[10px] font-bold text-zinc-400 mb-1 tracking-widest uppercase">Ideal Duration</div>
                                        <div className="font-bold">{remake?.editFormat}</div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {remake?.tips?.map((tip, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-zinc-600 bg-white/50 px-4 py-3 rounded-lg border border-zinc-50">
                                            <ChevronRight className="w-3 h-3 text-blue-500" /> {tip}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="scenario" className="mt-0 h-full">
                        <div className="flex flex-col gap-6 h-full">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Film className="w-5 h-5 text-[#FF6321]" /> {scenarioView === 'original' ? '원본 분석 스토리보드' : '리메이크 영화 시나리오'}
                                    </h3>
                                    <div className="flex bg-zinc-100 p-1 rounded-full border border-zinc-200">
                                        <button 
                                            onClick={() => setScenarioView('original')}
                                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${scenarioView === 'original' ? 'bg-white shadow-sm text-zinc-800' : 'text-zinc-400'}`}
                                        >
                                            원본 분석
                                        </button>
                                        <button 
                                            onClick={() => setScenarioView('remake')}
                                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${scenarioView === 'remake' ? 'bg-white shadow-sm text-zinc-800' : 'text-zinc-400'}`}
                                        >
                                            리메이크 전략
                                        </button>
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleGenerateScenarioImages(scenarioView)}
                                    disabled={!!isGeneratingScenarioImages || (scenarioView === 'original' ? !project.originalAnalysis?.scenario : !remake?.remakeScenario)}
                                    className="rounded-full text-xs font-bold gap-2"
                                >
                                    {isGeneratingScenarioImages === scenarioView ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                                    전체 장면 AI 이미지 생성
                                </Button>
                            </div>

                            <ScrollArea className="flex-1 pr-4">
                                <div className="space-y-12 pb-12">
                                    {(scenarioView === 'original' ? project.originalAnalysis?.scenario : remake?.remakeScenario)?.map((scene, i) => (
                                        <motion.div 
                                            key={i}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="grid md:grid-cols-2 gap-8 items-start"
                                        >
                                            <div className="relative group">
                                                {scene.imageUrl ? (
                                                    <div className="aspect-video rounded-[32px] overflow-hidden border border-zinc-100 shadow-xl">
                                                        <img 
                                                            src={scene.imageUrl} 
                                                            alt={`Scene ${i+1}`} 
                                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="aspect-video rounded-[32px] bg-zinc-100 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 gap-4">
                                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                                            <ImageIcon className="w-6 h-6 text-zinc-300" />
                                                        </div>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">이미지가 생성되지 않았습니다</p>
                                                    </div>
                                                )}
                                                <div className="absolute top-4 left-4">
                                                    <Badge className="bg-black/80 backdrop-blur-md text-white border-white/20 text-[10px] font-bold px-3 py-1">장면 {i+1}</Badge>
                                                </div>
                                                <div className="absolute top-4 right-4 group-hover:opacity-100 opacity-0 transition-opacity">
                                                    <Badge className="bg-orange-600 text-white border-none text-[10px] font-bold px-3 py-1">{scene.time}</Badge>
                                                </div>
                                            </div>

                                            <div className="space-y-6 pt-2">
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">전개 상황 묘사 (Action)</h4>
                                                    <p className="text-lg font-medium text-zinc-800 leading-relaxed italic">
                                                        "{scene.description}"
                                                    </p>
                                                </div>
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3">시각적 비주얼 컨셉 (Visual)</h4>
                                                    <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl text-xs text-zinc-500 font-mono leading-relaxed">
                                                        {scene.visualConcept}
                                                    </div>
                                                </div>
                                                <Separator className="bg-zinc-100" />
                                            </div>
                                        </motion.div>
                                    ))}

                                    {!remake?.remakeScenario && (
                                        <div className="text-center py-20 bg-zinc-50 rounded-[40px] border border-dashed border-zinc-200">
                                            <p className="text-zinc-400 font-bold">스토리보드 데이터가 없습니다. 전략을 다시 생성해 주세요.</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>
                      </TabsContent>

                      <TabsContent value="chat" className="mt-0 h-full flex flex-col">
                        <div className="flex-1 flex flex-col min-h-0 bg-zinc-50 rounded-[32px] border border-zinc-100 overflow-hidden">
                           <div className="p-4 border-b border-zinc-100 bg-white/50 backdrop-blur-sm flex items-center justify-between">
                              <h4 className="text-xs font-bold flex items-center gap-2">
                                <Bot className="w-4 h-4 text-[#FF6321]" /> 바이럴크래프트 AI 어시스턴트
                              </h4>
                              <Badge className="bg-orange-100 text-orange-600 text-[9px] font-bold">실시간 분석 지원</Badge>
                           </div>
                           
                           <ScrollArea className="flex-1 p-6">
                              <div className="space-y-6">
                                 {chatHistory.map((msg, i) => (
                                    <motion.div 
                                      key={i}
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                       <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-orange-100' : 'bg-white border border-zinc-100 shadow-sm'}`}>
                                             {msg.role === 'user' ? <User className="w-4 h-4 text-orange-600" /> : <Bot className="w-4 h-4 text-orange-600" />}
                                          </div>
                                          <div className={`p-4 rounded-[24px] text-sm leading-relaxed ${
                                            msg.role === 'user' 
                                              ? 'bg-orange-600 text-white rounded-tr-none' 
                                              : 'bg-white border border-zinc-100 text-zinc-700 shadow-sm rounded-tl-none'
                                          }`}>
                                             {msg.content}
                                          </div>
                                       </div>
                                    </motion.div>
                                 ))}
                                 {isChatLoading && (
                                    <div className="flex justify-start">
                                       <div className="flex gap-3 items-center bg-white border border-zinc-100 p-4 rounded-[24px] rounded-tl-none shadow-sm">
                                          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                          <span className="text-xs font-medium text-zinc-400">전략을 분석하며 답변을 생성 중입니다...</span>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           </ScrollArea>

                           <div className="p-4 bg-white border-t border-zinc-100">
                              <div className="relative">
                                 <Input 
                                   placeholder="바이럴 팁이나 수정 사항을 물어보세요..."
                                   value={chatInput}
                                   onChange={(e) => setChatInput(e.target.value)}
                                   onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                   className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 pr-14 focus-visible:ring-orange-600"
                                 />
                                 <Button 
                                   size="icon"
                                   onClick={handleSendMessage}
                                   disabled={isChatLoading || !chatInput.trim()}
                                   className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-orange-600 hover:bg-orange-700 h-10 w-10"
                                 >
                                    <Send className="w-4 h-4" />
                                 </Button>
                              </div>
                           </div>
                        </div>
                      </TabsContent>
                   </div>
                </Tabs>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
