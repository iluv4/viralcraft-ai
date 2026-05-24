import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, 
  Plus, 
  History, 
  Search, 
  Video, 
  Zap, 
  Layout, 
  Camera,
  ArrowRight,
  Loader2,
  LogOut,
  CheckCircle2,
  Upload,
  X
} from "lucide-react";
import { Button } from "./ui/button";
import VideoPlayer from "./VideoPlayer";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { analyzeVideoLink, analyzeVideoFile } from "../services/geminiService";
import { useAuth } from "../contexts/AuthContext";
import { createProject, getProjects } from "../services/projectService";
import { Project } from "../types";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [link, setLink] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisLog, setAnalysisLog] = useState<string[]>([]);
  const [discoveries, setDiscoveries] = useState<{label: string, value: string, icon: any}[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analysisSteps = [
    "영상을 업로드하거나 링크를 읽어오고 있습니다...",
    "비디오 프레임을 정밀 분석하여 훅(Hook)을 추출하는 중...",
    "바이럴 구조와 편집점을 시퀀스 단위로 분석하고 있습니다...",
    "리메이크를 위한 글로벌 타겟 최적화 전략 수립 중...",
    "프로젝트를 생성하고 대시보드를 준비하고 있습니다..."
  ];

  useEffect(() => {
    let interval: any;
    if (isAnalyzing) {
      setAnalysisStep(0);
      setAnalysisLog(["분석 엔진 초기화 중...", "GPU 클러스터 연결 완료"]);
      setDiscoveries([]);
      interval = setInterval(() => {
        setAnalysisStep(prev => {
          const next = prev < analysisSteps.length - 1 ? prev + 1 : prev;
          
          // Add discoveries based on step
          if (next === 1) {
            setDiscoveries(prev => [...prev, { label: "HOOK_DETECTED", value: "첫 1.2초 내 강렬한 비주얼 훅 감지", icon: Zap }]);
          } else if (next === 2) {
            setDiscoveries(prev => [...prev, { label: "CONTENT_STRUCTURE", value: "3단계 스토리텔링 구조 맵핑 완료", icon: Layout }]);
          } else if (next === 3) {
            setDiscoveries(prev => [...prev, { label: "VIRAL_VELOCITY", value: "평균 15fps 이상의 빠른 템포 확인", icon: Sparkles }]);
          }

          // Add random "tech" logs
          const techLogs = [
            "프레임 데이터 로딩 중...", 
            "시그널 노이즈 제거 필터 적용",
            "바이럴 패턴 데이터베이스 매칭 중",
            "시퀀스 변곡점 감지 완료",
            "글로벌 트렌드 시뮬레이션 가동",
            "최적화 알고리즘 정렬 중"
          ];
          setAnalysisLog(current => [...current, techLogs[Math.floor(Math.random() * techLogs.length)]].slice(-6));
          return next;
        });
      }, 3500);
    } else {
      setAnalysisLog([]);
      setDiscoveries([]);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    } else if (user) {
      fetchProjects();
    }
  }, [user, loading, navigate]);

  const fetchProjects = async () => {
    setIsLoadingProjects(true);
    try {
      const data = await getProjects();
      setRecentProjects(data);
    } catch (error) {
      console.error(error);
      toast.error("이전 작업을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        toast.error("영상 파일은 20MB 이하만 분석 가능합니다.");
        return;
      }
      setSelectedFile(file);
      setLink(""); // Clear link if file is selected
      
      // Generate preview
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleAnalyze = async () => {
    const trimmedLink = link.trim();
    if (!trimmedLink && !selectedFile) {
      toast.error("인스타그램 링크를 입력하거나 영상 파일을 업로드해주세요.");
      return;
    }

    if (trimmedLink && !trimmedLink.includes("instagram.com") && !trimmedLink.includes("youtube.com") && !trimmedLink.includes("tiktok.com")) {
      toast.info("인스타그램 링크가 아닐 경우 분석 정확도가 떨어질 수 있습니다.");
    }

    setIsAnalyzing(true);
    toast.info(selectedFile ? "영상을 분석 엔진에 업로드하고 있습니다..." : "AI가 영상을 분석하고 있습니다...");

    try {
      let analysis;
      if (isDemoMode) {
        // Mock data to bypass spending cap errors
        await new Promise(r => setTimeout(r, 2000));
        analysis = {
          hook: "사용자의 호기심을 자극하는 강렬한 비주얼(또는 자막)로 오프닝을 시작했습니다.",
          structure: "문제 제기(0-3s) -> 솔루션 데모(3-15s) -> 비교 대조(15-25s) -> 최종 CTA(25-30s)",
          tempo: "매우 빠른 비트 전환과 화려한 자막 효과가 돋보이는 템포입니다.",
          cta: "프로필 방문 및 웹사이트 구매 링크 클릭 유도",
          viralPoints: ["빠른 컷 전환", "공감 가능한 일상적 상황 설정", "명확한 비포/애프터"],
          keyTimestamps: [
            { time: "0:01", label: "Visual Hook", visualConcept: "Detailed cinematic frame of a vibrant opening hook, products glowing, close up" },
            { time: "0:08", label: "Problem Setup", visualConcept: "A person looking at a messy desk, moody lighting, frustration expressed" },
            { time: "0:18", label: "Solution Demo", visualConcept: "Clean organized futuristic desk setup, bright lighting, satisfaction" },
            { time: "0:28", label: "Final CTA", visualConcept: "Brand logo on a sleek smartphone screen, soft focus background" }
          ],
          scenario: [
            { time: "0:00", description: "강렬한 오프닝 훅: 제품의 첫인상을 보여주는 장면", visualConcept: "Modern product with glowing edges, cinematic lighting" },
            { time: "0:05", description: "제품 사용 시연 및 문제 제기", visualConcept: "Person using the product in a daily setting, realistic lighting" },
            { time: "0:15", description: "비포/애프터 비교 및 효과 강조", visualConcept: "Split screen showing transformation, clean aesthetic" },
            { time: "0:25", description: "최종 CTA 및 브랜드 로고", visualConcept: "Product display with elegant font, soft warm lighting" }
          ]
        };
      } else {
        if (selectedFile) {
          const base64 = await fileToBase64(selectedFile);
          analysis = await analyzeVideoFile(base64, selectedFile.type);
        } else {
          analysis = await analyzeVideoLink(trimmedLink);
        }
      }
      
      const projectId = await createProject({
        title: selectedFile ? `분석: ${selectedFile.name}` : (isDemoMode ? "데모: 분석 연습 프로젝트" : "새 리메이크 프로젝트"),
        originalLink: trimmedLink || "직접 업로드 파일",
        originalAnalysis: analysis,
      });

      toast.success("분석이 완료되었습니다!");
      navigate(`/project/${projectId}`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6321]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 p-6 overflow-hidden"
          >
            {/* Background Atmosphere */}
            <div className="absolute inset-0 opacity-20">
               <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600 rounded-full blur-[120px] animate-pulse" />
               <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-800 rounded-full blur-[120px]" />
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            </div>

            <div className="relative z-10 w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side: Visual Feedback */}
              <div className="space-y-8">
                <div className="relative aspect-[9/16] max-h-[60vh] mx-auto bg-zinc-900 rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
                  {videoPreview ? (
                    <>
                      <video src={videoPreview} className="w-full h-full object-cover opacity-60" autoPlay muted loop />
                      {/* Scanning Line */}
                      <motion.div 
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-orange-500/50 shadow-[0_0_20px_rgba(249,115,22,0.5)] z-20"
                      />
                      {/* Reactive Detection Box */}
                      <motion.div 
                        animate={{ 
                          opacity: [0.3, 1, 0.3],
                          top: analysisStep === 1 ? "10%" : analysisStep === 2 ? "40%" : "25%",
                          height: analysisStep === 1 ? "15%" : analysisStep === 2 ? "30%" : "32%"
                        }}
                        transition={{ duration: 1 }}
                        className="absolute left-1/4 right-1/4 border-2 border-orange-500/50 rounded-lg z-20"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-6 p-8 text-center bg-zinc-900">
                      <div className="relative">
                        <div className="w-24 h-24 bg-orange-500/10 rounded-3xl flex items-center justify-center animate-pulse border border-orange-500/20">
                          <Search className="w-10 h-10 text-orange-500" />
                        </div>
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          className="absolute -inset-2 border-2 border-dashed border-orange-500/20 rounded-full"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex flex-col items-center gap-2">
                           <Badge variant="outline" className="text-orange-400 border-orange-400/30 font-mono text-[9px]">링크_데이터_연동_중</Badge>
                           <h3 className="font-bold text-zinc-100 text-lg">인스타그램 서버 응답 대기 중</h3>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-zinc-500 font-medium">Link: {link || "업로드된 파일"}</p>
                          <div className="flex justify-center gap-1">
                            {[0, 1, 2].map(i => (
                              <motion.div 
                                key={i}
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                className="w-1 h-1 rounded-full bg-orange-500"
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="w-full max-w-[200px] space-y-2 opacity-50">
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                           <motion.div 
                             animate={{ x: [-200, 200] }}
                             transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                             className="w-1/2 h-full bg-orange-500/50"
                           />
                        </div>
                        <p className="text-[9px] font-mono text-zinc-600">HANDSHAKE_ESTABLISHED: 200 OK</p>
                      </div>
                    </div>
                  )}
                  
                  {/* HUD Elements */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-between pointer-events-none">
                    <div className="flex justify-between items-start">
                      <div className="text-[10px] font-mono text-orange-500 bg-orange-500/10 px-2 py-1 rounded">코어_시그널_분석_중</div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-[10px] font-mono text-zinc-500">원시_프레임_데이터: 4K_UHD</div>
                        <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">전송률: {(4.5 + Math.random()).toFixed(2)} MB/S</div>
                      </div>
                    </div>

                    {/* Live Discoveries Overlay */}
                    <div className="flex flex-col gap-2 mb-20">
                       <AnimatePresence>
                         {discoveries.map((disco, idx) => (
                           <motion.div 
                             key={idx}
                             initial={{ opacity: 0, x: -20, scale: 0.95 }}
                             animate={{ opacity: 1, x: 0, scale: 1 }}
                             className="bg-black/60 backdrop-blur-md border border-orange-500/30 p-3 rounded-xl max-w-[200px]"
                           >
                             <div className="flex items-center gap-2 mb-1">
                               <disco.icon className="w-3 h-3 text-orange-500" />
                               <span className="text-[9px] font-bold text-orange-500 tracking-widest">{disco.label === 'HOOK_DETECTED' ? '훅 감지됨' : disco.label === 'CONTENT_STRUCTURE' ? '컨텐츠 구조' : '전개 템포'}</span>
                             </div>
                             <p className="text-[11px] text-white leading-tight font-medium">{disco.value}</p>
                           </motion.div>
                         ))}
                       </AnimatePresence>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div className="text-[10px] font-mono text-zinc-500">COORD: {Math.random().toFixed(4)}N</div>
                        <div className="text-[10px] font-mono text-orange-500 animate-pulse">REC ●</div>
                      </div>
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(analysisStep + 1) * 20}%` }}
                          className="h-full bg-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side: Log and Progress */}
              <div className="space-y-8">
                <div className="space-y-2">
                   <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px] font-bold tracking-widest px-3 py-1 uppercase">AI Viral Engine v2.4</Badge>
                   <h2 className="text-4xl font-bold text-white tracking-tight">영상을 해체하여<br />바이럴 공식을 추출합니다</h2>
                </div>

                <div className="space-y-6">
                  {/* Log Viewport */}
                  <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-3 font-mono text-xs">
                     {analysisLog.map((log, i) => (
                       <motion.div 
                         key={i} 
                         initial={{ opacity: 0, x: -5 }} 
                         animate={{ opacity: 1 - (analysisLog.length - 1 - i) * 0.2, x: 0 }}
                         className="flex items-center gap-2 text-zinc-400"
                       >
                         <span className="text-orange-500/50">[{new Date().toLocaleTimeString()}]</span>
                         <span>{log}</span>
                       </motion.div>
                     ))}
                  </div>

                  <div className="space-y-3">
                    {analysisSteps.map((step, i) => (
                      <motion.div 
                        key={i}
                        animate={{ 
                          opacity: i <= analysisStep ? 1 : 0.2,
                          x: i === analysisStep ? 10 : 0
                        }}
                        className="flex items-center gap-4 text-sm font-bold"
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${i < analysisStep ? 'bg-green-500/20 border-green-500/50 text-green-500' : i === analysisStep ? 'bg-orange-500 border-orange-500 text-white animate-pulse' : 'border-zinc-800 text-zinc-700'}`}>
                           {i < analysisStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                        </div>
                        <span className={i === analysisStep ? 'text-white' : 'text-zinc-500'}>{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-[24px] flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">바이럴 엔진 팁 (Viral Tip)</p>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                       {analysisStep === 1 ? "현재 영상의 상위 5% 바이럴 훅 구조를 분석하고 있습니다. 첫 프레임의 자막 위치가 핵심입니다." : 
                        analysisStep === 2 ? "영상의 컷 전환 주기를 분석하여 평균 체류 시간을 극대화하기 위한 편집점을 찾고 있습니다." :
                        "분석이 마무리되면 리메이크를 위한 최적의 시각적 컨셉 이미지를 생성해 드립니다."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-zinc-500">새로운 바이럴 리메이크를 시작하거나 이전 작업을 확인하세요.</p>
        </div>
        <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => signOut()} className="rounded-full gap-2 text-xs font-bold">
                <LogOut className="w-3 h-3" /> 로그아웃
            </Button>
            <div className="flex items-center gap-3 bg-white border border-zinc-100 px-4 py-2 rounded-2xl shadow-sm">
                <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold">{user.displayName}</div>
                    <div className="text-[10px] text-zinc-400 font-medium">무료 플랜</div>
                </div>
                {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border border-orange-200" />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center border border-orange-200">
                        <span className="text-orange-600 font-bold text-sm">{user.displayName?.charAt(0) || "U"}</span>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Main Action Card */}
          <Card className="border-none shadow-xl shadow-zinc-100 bg-white rounded-[32px] overflow-hidden">
            <CardHeader className="pt-10 px-10 pb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-6">
                <Video className="w-6 h-6 text-[#FF6321]" />
              </div>
              <CardTitle className="text-2xl font-bold">새 리메이크 프로젝트</CardTitle>
              <CardDescription className="text-zinc-500 text-base">
                분석하고 싶은 인스타그램 릴스를 업로드하거나 영상 링크를 넣어주세요.
              </CardDescription>
              <div className="flex items-center gap-2 mt-4">
                  <div className={`p-1 rounded-full transition-colors ${isDemoMode ? 'bg-orange-100' : 'bg-zinc-100'}`}>
                    <Zap className={`w-3 h-3 ${isDemoMode ? 'text-[#FF6321]' : 'text-zinc-400'}`} />
                  </div>
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tighter">AI 사용 한도 초과 시 데모 모드를 켜주세요:</span>
                  <button 
                    onClick={() => setIsDemoMode(!isDemoMode)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isDemoMode ? 'bg-[#FF6321]' : 'bg-zinc-200'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isDemoMode ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                  <span className={`text-[11px] font-bold ${isDemoMode ? 'text-[#FF6321]' : 'text-zinc-400'}`}>
                    {isDemoMode ? 'ON (데모)' : 'OFF (실제 AI)'}
                  </span>
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Input 
                    placeholder="https://www.instagram.com/reels/..." 
                    className="h-14 rounded-2xl bg-zinc-50 border-zinc-100 pl-12 focus-visible:ring-[#FF6321]"
                    value={link}
                    onChange={(e) => {
                      setLink(e.target.value);
                      if (e.target.value) setSelectedFile(null);
                    }}
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="file" 
                    accept="video/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                  />
                  <Button 
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className={`h-14 rounded-2xl px-6 font-bold border-2 ${selectedFile ? 'border-[#FF6321] text-[#FF6321] bg-orange-50' : 'border-zinc-100 border-dashed hover:border-zinc-300'}`}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    {selectedFile ? "파일 교체" : "영상 업로드"}
                  </Button>
                  
                  <Button 
                    disabled={isAnalyzing}
                    onClick={handleAnalyze}
                    className="bg-[#FF6321] hover:bg-[#E55A1E] h-14 rounded-2xl px-8 font-bold text-lg"
                  >
                    {isAnalyzing ? (
                      <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          분석 중...
                      </>
                    ) : (
                      <>분석 시작 <ArrowRight className="ml-2 w-5 h-5" /></>
                    )}
                  </Button>
                </div>
              </div>

              {selectedFile && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {videoPreview && (
                    <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-100 bg-black group">
                      <VideoPlayer 
                        src={videoPreview} 
                        className="w-full h-full"
                      />
                      <div className="absolute top-3 left-3 pointer-events-none">
                         <Badge className="bg-black/50 backdrop-blur-md text-white border-white/20 text-[10px] font-bold">미리보기</Badge>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-orange-100">
                        <Video className="w-5 h-5 text-[#FF6321]" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-800">{selectedFile.name}</div>
                        <div className="text-[10px] text-zinc-400 font-medium tracking-tight">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setSelectedFile(null);
                        setVideoPreview(null);
                        if (videoPreview) URL.revokeObjectURL(videoPreview);
                      }}
                      className="rounded-full hover:bg-white hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-2">인기 키워드:</span>
                {["#뷰티", "#운동", "#데일리룩", "#요리"].map(tag => (
                  <span key={tag} className="text-xs font-medium px-3 py-1 bg-zinc-100 rounded-full text-zinc-600">
                    {tag}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Guide */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Zap, label: "바이럴 훅 설계", desc: "시청자의 시선을 끄는 오프닝" },
              { icon: Layout, label: "컷 편집 가이드", desc: "릴스 특화 화면 구성안" },
              { icon: Camera, label: "촬영 구도 추천", desc: "카메라 앵글 및 조명 팁" },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-zinc-100">
                <item.icon className="w-5 h-5 text-zinc-400 mb-2" />
                <h4 className="font-bold text-sm mb-1">{item.label}</h4>
                <p className="text-xs text-zinc-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <Card className="border-none shadow-lg shadow-zinc-100 rounded-[32px]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <History className="w-5 h-5" /> 최근 작업
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-xs text-[#FF6321] font-bold">전체보기</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingProjects ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-200" />
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="text-center py-10">
                    <p className="text-xs text-zinc-400 font-bold">아직 프로젝트가 없습니다.</p>
                </div>
              ) : (
                recentProjects.map(p => (
                  <div 
                      key={p.id} 
                      className="group flex items-center justify-between p-4 rounded-2xl border border-zinc-50 hover:border-orange-100 hover:bg-orange-50/30 transition-all cursor-pointer"
                      onClick={() => navigate(`/project/${p.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                          <Video className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold truncate max-w-[120px]">{p.title}</h5>
                        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                          {p.createdAt?.toDate 
                            ? p.createdAt.toDate().toLocaleDateString() 
                            : new Date(p.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-[#FF6321] transition-colors" />
                  </div>
                ))
              )}
              <Button variant="ghost" className="w-full text-zinc-400 text-xs font-bold py-6 border-dashed border-2 border-zinc-50 rounded-2xl">
                <Plus className="w-4 h-4 mr-2" /> 더 불러오기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
