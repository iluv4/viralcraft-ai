import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Sparkles, ArrowRight, Video, Zap, Layout, Camera, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, signIn, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleStart = async () => {
    if (user) {
      navigate("/dashboard");
    } else {
      setIsLoggingIn(true);
      try {
        await signIn();
        navigate("/dashboard");
      } catch (error) {
        toast.error("로그인 중 오류가 발생했습니다.");
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-100 rounded-full blur-[120px] opacity-40" />
      </div>

      {/* Header */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter cursor-pointer" onClick={() => navigate("/")}>
          <div className="bg-[#FF6321] p-1.5 rounded-lg">
            <Sparkles className="text-white w-5 h-5" />
          </div>
          <span>ViralCraft <span className="text-[#FF6321]">AI</span></span>
        </div>
        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-3">
               <span className="text-sm font-bold hidden sm:inline-block">{user.displayName}님</span>
               <Button onClick={() => navigate("/dashboard")} className="bg-black text-white hover:bg-zinc-800 rounded-full px-6">
                대시보드
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={handleStart} className="text-sm font-medium">로그인</Button>
              <Button onClick={handleStart} disabled={isLoggingIn} className="bg-black text-white hover:bg-zinc-800 rounded-full px-6 min-w-[120px]">
                {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : "시작하기"}
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-32 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest uppercase bg-orange-100 text-[#FF6321] rounded-full">
            AI 기반 바이럴 리메이크 플랫폼
          </span>
          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] mb-8">
            링크 하나로<br />
            <span className="text-zinc-400">바이럴을 다시 쓰다</span>
          </h1>
          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-12 font-medium">
            인기 인스타그램 영상의 구조를 AI가 분석하고,<br />
            한국 시장에 딱 맞는 내레이션과 촬영 구도를 자동으로 제안합니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={handleStart}
              disabled={isLoggingIn}
              className="bg-[#FF6321] hover:bg-[#E55A1E] text-white rounded-full px-8 h-14 text-lg font-bold shadow-xl shadow-orange-200 min-w-[200px]"
            >
              {isLoggingIn ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <>지금 무료로 시작하기 <ArrowRight className="ml-2 w-5 h-5" /></>}
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="rounded-full px-8 h-14 text-lg font-bold border-zinc-200 hover:bg-zinc-50"
            >
              기능 둘러보기
            </Button>
          </div>
        </motion.div>

        {/* Mockup Preview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-24 relative max-w-5xl mx-auto"
        >
          <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-zinc-100 aspect-video flex items-center justify-center p-8">
             <div className="grid grid-cols-3 gap-6 w-full h-full">
                <div className="bg-zinc-50 rounded-2xl flex flex-col items-center justify-center p-6 border border-zinc-100">
                    <Video className="w-8 h-8 text-[#FF6321] mb-2" />
                    <span className="text-xs font-bold text-zinc-400">영상 분석</span>
                </div>
                <div className="bg-zinc-50 rounded-2xl flex flex-col items-center justify-center p-6 border border-zinc-100">
                    <Zap className="w-8 h-8 text-blue-500 mb-2" />
                    <span className="text-xs font-bold text-zinc-400">내레이션 생성</span>
                </div>
                <div className="bg-zinc-50 rounded-2xl flex flex-col items-center justify-center p-6 border border-zinc-100">
                    <Camera className="w-8 h-8 text-emerald-500 mb-2" />
                    <span className="text-xs font-bold text-zinc-400">촬영 가이드</span>
                </div>
             </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="bg-zinc-50 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold tracking-tight mb-4">왜 바이럴크래프트인가요?</h2>
            <p className="text-zinc-500">단순한 편집을 넘어, 성공하는 콘텐츠의 전략을 설계합니다.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { 
                icon: Layout, 
                title: "영상 구조 분석", 
                desc: "오프닝 훅부터 CTA까지, 바이럴 영상의 뼈대를 완벽하게 해체합니다.",
                color: "text-[#FF6321]",
                bg: "bg-orange-50"
              },
              { 
                icon: Sparkles, 
                title: "한국형 로컬라이징", 
                desc: "외국 인기 영상을 자연스러운 한국어 말투와 문화적 맥락에 맞게 재구성합니다.",
                color: "text-blue-500",
                bg: "bg-blue-50"
              },
              { 
                icon: Camera, 
                title: "맞춤형 촬영 가이드", 
                desc: "어떤 구도에서 찍어야 더 매력적일지 컷별 촬영 앵글을 추천합니다.",
                color: "text-emerald-500",
                bg: "bg-emerald-50"
              }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm">
                <div className={`${f.bg} ${f.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-zinc-500 leading-relaxed text-sm">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
