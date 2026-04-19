/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  Download, 
  Music, 
  Image as ImageIcon, 
  Github, 
  AlertCircle, 
  Loader2, 
  Link as LinkIcon, 
  Play,
  Share2,
  CheckCircle2,
  Terminal,
  Clock,
  HardDrive,
  Monitor
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TikTokData {
  id: string;
  desc: string;
  author: string;
  avatar: string;
  video: string;
  duration: number;
  cover: string;
  music: string;
  images: string[];
  isCarousel: boolean;
  stats: {
    playCount: number;
    diggCount: number;
    commentCount: number;
    shareCount: number;
  };
}

export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TikTokData | null>(null);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev.slice(-4), msg]);
  };

  const handleAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    setError("");
    setData(null);
    setPublishedUrl("");
    addLog(`[*] Iniciando conexão com servidores TikTok...`);

    try {
      const resp = await fetch(`/api/tiktok?url=${encodeURIComponent(url)}`);
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      
      addLog(`[+] Link verificado. Redirecionando...`);
      addLog(`[OK] Metadados extraídos com sucesso.`);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao carregar o vídeo.");
      addLog(`[!] Erro fatal: ${err.message || "Falha na análise"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (downloadUrl: string, type: string) => {
    addLog(`[*] Iniciando download do recurso: ${type}...`);
    const filename = `tiktok_${data?.id || 'video'}_${type}.${type === 'audio' ? 'mp3' : type === 'image' ? 'jpg' : 'mp4'}`;
    const proxyUrl = `/api/download?url=${encodeURIComponent(downloadUrl)}&filename=${encodeURIComponent(filename)}`;
    window.open(proxyUrl, '_blank');
  };

  const handlePublishGithub = async () => {
    setPublishing(true);
    setError("");
    addLog(`[*] Preparando repositório para o GitHub...`);
    try {
      const resp = await fetch("/api/publish-github", { method: "POST" });
      const result = await resp.json();
      if (result.error) throw new Error(result.error);
      setPublishedUrl(result.url);
      addLog(`[OK] Publicado com sucesso: ${result.url}`);
    } catch (err: any) {
      setError(err.message || "Erro ao publicar no GitHub.");
      addLog(`[!] Erro no GitHub: ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num;
  };

  return (
    <div className="min-h-screen bg-bg text-white font-sans selection:bg-accent-cyan/30 flex flex-col">
      <div className="relative z-10 max-w-[1024px] mx-auto w-full px-6 py-8 md:py-12 flex-1 flex flex-col">
        {/* Header Section */}
        <header className="mb-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="logo flex justify-center items-center gap-3 text-3xl font-black tracking-tighter mb-8"
          >
            <span className="text-accent-cyan">TK</span>
            <span className="text-accent-pink uppercase">Downloader</span>
            <span className="text-xs bg-accent-pink px-2 py-0.5 rounded ml-2 font-bold tracking-normal italic">PRO</span>
          </motion.div>
          
          <div className="relative max-w-2xl mx-auto group">
            <div className="relative overflow-hidden rounded-2xl bg-glass border border-glass-border shadow-2xl transition-all group-focus-within:border-accent-cyan/50">
              <input 
                type="text" 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Cole o link do TikTok aqui..."
                className="w-full bg-transparent p-5 pl-6 pr-32 outline-none text-white placeholder:text-text-secondary"
              />
              <button 
                onClick={handleAnalyze}
                disabled={loading || !url}
                className="absolute right-2 top-2 bottom-2 px-6 bg-gradient-to-r from-accent-cyan to-accent-pink rounded-xl text-black font-bold uppercase text-sm hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center min-w-[120px]"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Analisar"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-4 inline-flex items-center gap-2 text-accent-pink bg-accent-pink/10 border border-accent-pink/20 px-4 py-2 rounded-xl text-xs font-medium"
              >
                <AlertCircle size={14} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Content Area */}
        <main className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Preview Panel (Left) */}
          <div className="md:col-span-4 h-full">
            <AnimatePresence mode="wait">
              {data ? (
                <motion.section 
                  key="results"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-card-bg rounded-3xl border border-glass-border overflow-hidden shadow-2xl flex flex-col h-full ring-1 ring-white/5"
                >
                  <div className="relative aspect-[9/16] bg-black/40 flex items-center justify-center group">
                    {data.isCarousel ? (
                      <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory hide-scrollbar">
                        {data.images.map((img, i) => (
                           <img key={i} src={img} alt="" className="min-w-full h-full object-cover snap-start" referrerPolicy="no-referrer" />
                        ))}
                      </div>
                    ) : (
                      <video 
                        src={data.video} 
                        poster={data.cover}
                        controls 
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    <div className="absolute bottom-4 left-4 flex items-center gap-3 z-10">
                      <img src={data.avatar} className="w-8 h-8 rounded-full border border-accent-cyan border-opacity-50 shadow-lg" referrerPolicy="no-referrer" />
                      <span className="text-sm font-semibold text-white drop-shadow-md">@{data.author}</span>
                    </div>
                  </div>
                  <div className="p-4 text-xs leading-relaxed text-gray-400 font-medium">
                    {data.desc || "Trend incrível detectada!"}
                  </div>
                </motion.section>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-card-bg rounded-3xl border border-glass-border border-dashed h-full min-h-[400px] flex flex-col items-center justify-center text-text-secondary gap-4 opacity-40 shadow-inner"
                >
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Play fill="currentColor" size={24} className="ml-1" />
                  </div>
                  <p className="text-xs uppercase tracking-widest font-bold">Aguardando análise</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Details & Actions Panel (Right) */}
          <div className="md:col-span-8 flex flex-col gap-6 h-full">
            {data ? (
              <>
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    Resultados da Análise
                    <span className="text-[10px] bg-accent-cyan/10 text-accent-cyan px-2 py-0.5 rounded-full border border-accent-cyan/20">VERIFICADO</span>
                  </h2>
                  <p className="text-xs text-text-secondary">ID do Vídeo: <span className="text-gray-200">{data.id}</span></p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-glass border border-glass-border rounded-2xl p-4 flex flex-col items-center justify-center gap-1 group hover:border-accent-cyan transition-colors">
                    <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Duração</span>
                    <div className="flex items-center gap-2">
                       <Clock size={14} className="text-accent-cyan" />
                       <span className="text-lg font-black text-accent-cyan">{formatDuration(data.duration)}</span>
                    </div>
                  </div>
                  <div className="bg-glass border border-glass-border rounded-2xl p-4 flex flex-col items-center justify-center gap-1 group hover:border-accent-cyan transition-colors">
                    <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Tamanho</span>
                    <div className="flex items-center gap-2">
                       <HardDrive size={14} className="text-accent-cyan" />
                       <span className="text-lg font-black text-accent-cyan">Auto</span>
                    </div>
                  </div>
                  <div className="bg-glass border border-glass-border rounded-2xl p-4 flex flex-col items-center justify-center gap-1 group hover:border-accent-cyan transition-colors">
                    <span className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Qualidade</span>
                    <div className="flex items-center gap-2">
                       <Monitor size={14} className="text-accent-cyan" />
                       <span className="text-lg font-black text-accent-cyan">1080p</span>
                    </div>
                  </div>
                </div>

                {/* Download Actions */}
                <div className="flex-1 flex flex-col gap-3">
                  {!data.isCarousel && (
                    <button 
                      onClick={() => handleDownload(data.video, 'video')}
                      className="flex items-center justify-between p-5 bg-gradient-to-r from-accent-cyan/10 to-accent-pink/10 border border-white/20 rounded-2xl hover:border-accent-cyan hover:bg-white/5 transition-all group"
                    >
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-bold text-lg">Baixar Vídeo</span>
                        <span className="text-xs text-text-secondary">Sem marca d'água (MP4)</span>
                      </div>
                      <div className="bg-accent-pink px-2 py-1 rounded text-[10px] font-black italic shadow-lg shadow-accent-pink/20">HD PRO</div>
                    </button>
                  )}

                  <button 
                    onClick={() => handleDownload(data.music, 'audio')}
                    className="flex items-center justify-between p-5 bg-glass border border-glass-border rounded-2xl hover:bg-white/10 hover:border-accent-cyan transition-all group"
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="font-bold text-lg">Baixar Áudio</span>
                      <span className="text-xs text-text-secondary">Música original (MP3)</span>
                    </div>
                    <Music size={20} className="text-accent-cyan group-hover:scale-110 transition-transform" />
                  </button>

                  {data.isCarousel && (
                     <div className="flex flex-col gap-1.5 mt-2">
                        <span className="text-[10px] text-text-secondary uppercase font-bold tracking-widest px-1">Arquivos do Carrossel</span>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                           {data.images.map((img, i) => (
                              <button 
                                key={i}
                                onClick={() => handleDownload(img, `foto_${i+1}`)}
                                className="bg-glass border border-glass-border p-3 rounded-xl flex items-center justify-between text-xs hover:border-accent-cyan transition-colors"
                              >
                                <span>Imagem {i+1}</span>
                                <ImageIcon size={14} className="text-accent-pink" />
                              </button>
                           ))}
                        </div>
                     </div>
                  )}

                  <button 
                    onClick={handlePublishGithub}
                    disabled={publishing}
                    className="mt-2 flex items-center justify-center gap-3 p-4 bg-glass border border-glass-border rounded-2xl hover:bg-white/5 hover:border-accent-cyan transition-all group text-sm font-bold uppercase tracking-widest h-14"
                  >
                    {publishing ? <Loader2 className="animate-spin" size={18} /> : (
                      <>
                        <Github size={20} className="group-hover:rotate-12 transition-transform" />
                        Publicar Script
                      </>
                    )}
                  </button>
                  
                  {publishedUrl && (
                    <motion.a 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      href={publishedUrl}
                      target="_blank"
                      className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs text-center rounded-xl font-medium flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={14} /> Link do GitHub pronto! Clique aqui.
                    </motion.a>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-text-secondary opacity-20">
                <Terminal size={48} />
                <p className="text-sm font-bold uppercase tracking-[0.2em]">Console de Operações</p>
              </div>
            )}

            {/* Terminal Log Panel */}
            <div className="bg-black/80 border border-white/10 rounded-2xl p-4 font-mono text-[11px] text-[#4AF626] h-32 flex flex-col shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(circle_at_center,rgba(74,246,38,0.05),transparent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2 opacity-50">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
                <span className="ml-2 text-[9px] uppercase font-black">Sys_Logs_v1.0</span>
              </div>
              <div className="flex-1 flex flex-col gap-1">
                {logs.length === 0 && <div className="opacity-50"># Terminal ocioso... aguardando requisição.</div>}
                {logs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="flex gap-2"
                  >
                    <span className="opacity-40">[{new Date().toLocaleTimeString([], { hour12: false })}]</span>
                    <span>{log}</span>
                  </motion.div>
                ))}
                <div className="inline-block w-2 h-4 bg-[#4AF626] animate-pulse align-middle ml-1 mt-0.5" />
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-10 py-6 text-center text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] border-t border-white/5">
          Desenvolvido para alta performance • Script Pro v2.4 • GitHub: siova7862-beep
        </footer>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--accent-cyan); }
      `}</style>
    </div>
  );
}
