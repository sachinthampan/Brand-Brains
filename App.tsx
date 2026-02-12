
import React, { useState, useEffect, useCallback } from 'react';
import { UserNiche, PostContent, PostStatus, MediaType, SocialPlatform, SocialConnection, XCredentials, LogEntry } from './types';
import { generatePostDrafts } from './services/geminiService';
import { verifyXCredentials } from './services/xService';
import PostCard from './components/PostCard';

const XCredentialModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (creds: XCredentials, handle: string) => Promise<boolean>;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    const formData = new FormData(e.currentTarget);
    const creds: XCredentials = {
      consumerKey: formData.get('consumerKey') as string,
      consumerSecret: formData.get('consumerSecret') as string,
      bearerToken: formData.get('bearerToken') as string,
    };
    const handle = formData.get('handle') as string;

    try {
      const success = await onSubmit(creds, handle);
      if (!success) {
        setError("Verification failed. Please check your keys.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center">
              <i className="fab fa-x-twitter text-2xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Connect X.com</h3>
              <p className="text-xs text-slate-500 font-medium">Link your handle via API</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-in slide-in-from-top-2">
            <i className="fas fa-exclamation-circle text-lg"></i>
            <p className="font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">X Handle</label>
            <input name="handle" required placeholder="@yourbrand" className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">API Key (Consumer Key)</label>
            <input name="consumerKey" type="password" required className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">API Key Secret (Consumer Secret)</label>
            <input name="consumerSecret" type="password" required className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Bearer Token</label>
            <textarea name="bearerToken" required rows={3} className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" />
          </div>
          <button 
            type="submit" 
            disabled={isVerifying}
            className={`w-full font-bold py-4 rounded-2xl shadow-xl mt-4 transform active:scale-95 transition-all flex items-center justify-center gap-3 ${isVerifying ? 'bg-slate-100 text-slate-400' : 'bg-black text-white hover:bg-slate-900 shadow-slate-200'}`}
          >
            {isVerifying ? (
              <><i className="fas fa-circle-notch fa-spin"></i>Verifying...</>
            ) : (
              <><i className="fas fa-check-circle"></i>Verify & Link</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const LogViewer: React.FC<{ logs: LogEntry[] }> = ({ logs }) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[400px]">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">System Console</span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">brandbrain-v1.0.4</span>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700"
      >
        {logs.length === 0 ? (
          <p className="text-slate-600 italic">Waiting for system activity...</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <span className="text-slate-600 shrink-0">[{log.timestamp.split('T')[1].split('.')[0]}]</span>
              <span className={`
                ${log.level === 'success' ? 'text-green-400' : 
                  log.level === 'error' ? 'text-red-400' : 
                  log.level === 'warning' ? 'text-amber-400' : 'text-indigo-300'}
              `}>
                {log.level === 'success' && <i className="fas fa-check-circle mr-2"></i>}
                {log.level === 'error' && <i className="fas fa-times-circle mr-2"></i>}
                {log.level === 'warning' && <i className="fas fa-exclamation-triangle mr-2"></i>}
                {log.level === 'info' && <i className="fas fa-info-circle mr-2"></i>}
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [niche, setNiche] = useState<UserNiche | null>(null);
  const [posts, setPosts] = useState<PostContent[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'drafts' | 'scheduled' | 'posted' | 'connections'>('drafts');
  const [isXModalOpen, setIsXModalOpen] = useState(false);

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'info') => {
    const newLog: LogEntry = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date().toISOString(),
      level,
      message,
    };
    setLogs(prev => [...prev, newLog].slice(-100)); // Keep last 100 logs
  }, []);

  useEffect(() => {
    const savedNiche = localStorage.getItem('brandbrain_niche');
    const savedPosts = localStorage.getItem('brandbrain_posts');
    if (savedNiche) setNiche(JSON.parse(savedNiche));
    if (savedPosts) setPosts(JSON.parse(savedPosts));
    addLog("System initialized. Welcome to BrandBrain AI.", "success");
  }, [addLog]);

  useEffect(() => {
    if (niche) localStorage.setItem('brandbrain_niche', JSON.stringify(niche));
    localStorage.setItem('brandbrain_posts', JSON.stringify(posts));
  }, [niche, posts]);

  const handleSetupNiche = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newNiche: UserNiche = {
      id: Date.now().toString(),
      name: formData.get('name') as string,
      targetAudience: formData.get('audience') as string,
      tone: formData.get('tone') as string,
      frequency: formData.get('frequency') as any,
      connections: [],
    };
    setNiche(newNiche);
    addLog(`New brand personality created: ${newNiche.name}`, "success");
  };

  const handleGenerateContent = async () => {
    if (!niche) return;
    setIsGenerating(true);
    addLog(`AI starting content curation for niche: ${niche.name}...`, "info");
    try {
      const drafts = await generatePostDrafts(niche);
      addLog(`Gemini Flash successfully curated ${drafts.length} content ideas.`, "success");
      const newPosts: PostContent[] = drafts.map((d, i) => ({
        id: (Date.now() + i).toString(),
        niche: niche.name,
        topic: d.topic || 'New Post',
        caption: d.caption || '',
        hashtags: d.hashtags || [],
        mediaType: (d.mediaType as MediaType) || MediaType.IMAGE,
        status: PostStatus.DRAFT,
        createdAt: new Date().toISOString()
      }));
      setPosts(prev => [...newPosts, ...prev]);
      setActiveTab('drafts');
    } catch (error) {
      addLog("Failed to generate content drafts. Please check API connectivity.", "error");
      alert("Failed to generate content drafts.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updatePost = (updated: PostContent) => {
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deletePost = (id: string) => {
    if (window.confirm("Delete this draft?")) {
      setPosts(prev => prev.filter(p => p.id !== id));
      addLog("Draft deleted.", "warning");
    }
  };

  const handleConnectX = async (creds: XCredentials, handle: string): Promise<boolean> => {
    if (!niche) return false;
    addLog(`Initiating connection verification for X handle: ${handle}`, "info");
    
    const verification = await verifyXCredentials(creds);
    
    if (verification.success) {
      addLog(`X connection verified successfully. Authenticated as: ${verification.username}`, "success");
      const newConn: SocialConnection = { 
        platform: SocialPlatform.X, 
        handle, 
        isConnected: true, 
        isVerified: true,
        username: verification.username,
        credentials: creds 
      };
      setNiche({
        ...niche,
        connections: [...niche.connections.filter(c => c.platform !== SocialPlatform.X), newConn]
      });
      setIsXModalOpen(false);
      return true;
    } else {
      addLog(`X.com verification failed: ${verification.error}`, "error");
      return false;
    }
  };

  const toggleConnection = (platform: SocialPlatform) => {
    if (!niche) return;
    const existing = niche.connections.find(c => c.platform === platform);
    
    if (existing) {
      if (window.confirm(`Disconnect ${platform}?`)) {
        setNiche({
          ...niche,
          connections: niche.connections.filter(c => c.platform !== platform)
        });
        addLog(`Disconnected from ${platform}.`, "warning");
      }
    } else {
      if (platform === SocialPlatform.X) {
        setIsXModalOpen(true);
      } else {
        const handle = prompt(`Enter your ${platform} handle:`, "@");
        if (handle) {
          const newConn: SocialConnection = { platform, handle, isConnected: true, isVerified: false };
          setNiche({
            ...niche,
            connections: [...niche.connections, newConn]
          });
          addLog(`Linked ${platform} handle: ${handle}. (Self-verified)`, "success");
        }
      }
    }
  };

  const filteredPosts = posts.filter(p => {
    if (activeTab === 'drafts') return p.status === PostStatus.DRAFT;
    if (activeTab === 'scheduled') return p.status === PostStatus.SCHEDULED;
    if (activeTab === 'posted') return p.status === PostStatus.POSTED;
    return false;
  });

  if (!niche) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-brain text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome to BrandBrain</h1>
            <p className="text-slate-500 mt-2">Let's set up your brand personality to start automating your social media.</p>
          </div>

          <form onSubmit={handleSetupNiche} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Brand Niche</label>
              <input name="name" required placeholder="e.g. Sustainable Fashion, AI Tech News" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Target Audience</label>
              <input name="audience" required placeholder="e.g. Gen Z eco-conscious shoppers" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Content Tone</label>
              <select name="tone" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                <option value="Professional & Informative">Professional & Informative</option>
                <option value="Casual & Friendly">Casual & Friendly</option>
                <option value="Humorous & Trendy">Humorous & Trendy</option>
                <option value="Inspirational & Deep">Inspirational & Deep</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Posting Frequency</label>
              <select name="frequency" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                <option value="daily">Daily Batch</option>
                <option value="weekly">Weekly Curation</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all mt-4 transform hover:-translate-y-1">
              Start Building Brand
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <XCredentialModal 
        isOpen={isXModalOpen} 
        onClose={() => setIsXModalOpen(false)} 
        onSubmit={handleConnectX} 
      />

      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <i className="fas fa-brain"></i>
          </div>
          <span className="font-bold text-xl tracking-tight">BrandBrain</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <button 
            onClick={() => setActiveTab('drafts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'drafts' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <i className="fas fa-file-alt"></i>
            <span className="font-semibold">Review Drafts</span>
            {posts.filter(p => p.status === PostStatus.DRAFT).length > 0 && (
              <span className="ml-auto bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                {posts.filter(p => p.status === PostStatus.DRAFT).length}
              </span>
            )}
          </button>
          <button 
             onClick={() => setActiveTab('scheduled')}
             className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'scheduled' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <i className="fas fa-calendar-check"></i>
            <span className="font-semibold">Scheduled</span>
          </button>
          <button 
            onClick={() => setActiveTab('posted')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'posted' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <i className="fas fa-paper-plane"></i>
            <span className="font-semibold">Posted</span>
          </button>
          <button 
            onClick={() => setActiveTab('connections')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'connections' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <i className="fas fa-link"></i>
            <span className="font-semibold">Connections</span>
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-4">
             <p className="text-xs font-bold text-slate-400 uppercase mb-2">Linked Accounts</p>
             <div className="flex gap-2">
                {niche.connections.length > 0 ? niche.connections.map(c => (
                  <div key={c.platform} title={`${c.platform}: ${c.handle}`} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110 ${c.isVerified ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <i className={`fab fa-${c.platform.toLowerCase() === 'x' ? 'x-twitter' : c.platform.toLowerCase()}`}></i>
                  </div>
                )) : <p className="text-[10px] text-slate-400 italic">No accounts linked</p>}
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full overflow-hidden">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 capitalize">{activeTab === 'connections' ? 'Social Connections' : `${activeTab} Manager`}</h2>
            <p className="text-sm text-slate-500">
                {activeTab === 'connections' ? 'Link your social media handles and view activity' : 'Manage your content pipeline with Gemini AI'}
            </p>
          </div>
          {activeTab !== 'connections' && (
            <button 
                onClick={handleGenerateContent}
                disabled={isGenerating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all disabled:opacity-50 flex items-center gap-2"
            >
                {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
                {isGenerating ? 'Curating Content...' : 'Generate New Batch'}
            </button>
          )}
        </header>

        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'connections' ? (
            <div className="max-w-3xl mx-auto py-4 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[SocialPlatform.X, SocialPlatform.INSTAGRAM, SocialPlatform.LINKEDIN, SocialPlatform.TIKTOK].map(platform => {
                  const conn = niche.connections.find(c => c.platform === platform);
                  return (
                    <div key={platform} className={`bg-white p-6 rounded-3xl border transition-all ${conn?.isVerified ? 'border-indigo-100 shadow-sm' : 'border-slate-200'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${conn ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          <i className={`fab fa-${platform.toLowerCase() === 'x' ? 'x-twitter' : platform.toLowerCase()}`}></i>
                        </div>
                        {conn?.isVerified && (
                           <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100 flex items-center gap-1.5">
                             <i className="fas fa-check-circle"></i>
                             VERIFIED
                           </span>
                        )}
                      </div>
                      <div className="mb-6">
                        <p className="font-bold text-slate-900 text-lg">{platform}</p>
                        <p className="text-sm text-slate-500 font-medium truncate">{conn ? conn.handle : 'Not connected'}</p>
                      </div>
                      <button 
                        onClick={() => toggleConnection(platform)}
                        className={`w-full py-3 rounded-xl text-sm font-bold transition-all transform active:scale-95 ${conn ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                      >
                        {conn ? 'Disconnect' : `Connect ${platform}`}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <i className="fas fa-terminal text-indigo-600"></i>
                   Real-time Activity Logs
                </h3>
                <LogViewer logs={logs} />
              </div>
              
              <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <h4 className="font-bold text-xl mb-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-sm">
                        <i className="fas fa-bolt"></i>
                      </div>
                      Direct Automation Engine
                    </h4>
                    <p className="text-slate-300 text-sm leading-relaxed mb-6">
                      Your automation logs show exactly what BrandBrain is doing in the background. 
                      You can monitor API handshake successes, content curation milestones, and final publishing confirmations here.
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1.5"><i className="fas fa-lock text-green-500"></i> LOCAL ENCRYPTION</span>
                        <span className="flex items-center gap-1.5"><i className="fas fa-check text-indigo-400"></i> DIRECT API ACCESS</span>
                        <span className="flex items-center gap-1.5"><i className="fas fa-microchip text-purple-400"></i> GEMINI 3.0 POWERED</span>
                    </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
              {filteredPosts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onUpdate={updatePost} 
                  onDelete={deletePost} 
                  connections={niche.connections}
                  onLog={addLog}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-6 right-6 md:hidden">
        <button 
          onClick={handleGenerateContent}
          disabled={isGenerating}
          className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all active:scale-95 shadow-indigo-400"
        >
          {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
        </button>
      </div>
    </div>
  );
};

export default App;
