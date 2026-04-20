import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Youtube, 
  User, 
  Lock, 
  Mail, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  LogOut, 
  Settings, 
  Layout, 
  Image as ImageIcon,
  Type,
  Palette,
  Download,
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { User as UserType, PLANS, AuthResponse } from './types';
import { getThumbnailIdeas } from './lib/gemini';
import confetti from 'canvas-confetti';

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', isLoading = false, type = 'button' as const }: any) => {
  const variants = {
    primary: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-white',
    outline: 'border border-zinc-700 hover:bg-zinc-800 text-zinc-300',
    ghost: 'hover:bg-zinc-800 text-zinc-400 hover:text-white',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading}
      className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {isLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : children}
    </button>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden ${className}`}>
    {children}
  </div>
);

const Input = ({ icon: Icon, ...props }: any) => (
  <div className="relative">
    {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />}
    <input
      {...props}
      className={`w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 ${Icon ? 'pl-10' : 'px-4'} pr-4 text-zinc-200 outline-none focus:border-red-600 transition-colors placeholder:text-zinc-600`}
    />
  </div>
);

// --- Main App ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<'login' | 'register' | 'app' | 'admin' | 'subscription'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial Auth Sync
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      setCurrentUser(JSON.parse(savedUser));
      setToken(savedToken);
      setView('app');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setToken(null);
    setView('login');
  };

  const checkSubscriptionStatus = () => {
    if (!currentUser?.subscribedUntil) return false;
    return new Date(currentUser.subscribedUntil) > new Date();
  };

  const isSubscribed = checkSubscriptionStatus();

  // --- Auth Handlers ---

  const onLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      setToken(result.token);
      setCurrentUser(result.user);
      setView('app');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      alert('Đăng ký thành công! Vui lòng chờ quản trị viên phê duyệt tài khoản.');
      setView('login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Payment Handler ---

  const onSubscribe = async (plan: any) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/payments/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser.id, 
          months: plan.months,
          name: currentUser.name,
          email: currentUser.email
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      const updatedUser = { ...currentUser, subscribedUntil: result.subscribedUntil };
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      setView('app');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans selection:bg-red-500/30">
      {/* Navigation */}
      <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(currentUser ? 'app' : 'login')}>
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">Vân Thế Web <span className="text-red-600">Studio</span></span>
          </div>

          <div className="flex items-center gap-4">
            {currentUser ? (
              <>
                <div className="flex flex-col items-end mr-2 hidden md:flex">
                  <span className="text-sm font-medium text-zinc-100">{currentUser.name}</span>
                  <span className="text-xs text-zinc-500">
                    {currentUser.role === 'admin' ? 'Quản trị viên' : isSubscribed ? 'Thành viên Premium' : 'Chưa đăng ký gói'}
                  </span>
                </div>
                {currentUser.role === 'admin' && (
                  <Button variant="ghost" onClick={() => setView('admin')} className={view === 'admin' ? 'bg-zinc-800 text-white' : ''}>
                    <ShieldCheck className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setView('login')}>Đăng nhập</Button>
                <Button onClick={() => setView('register')}>Bắt đầu ngay</Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {view === 'login' && (
             <motion.div 
               key="login" 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
               className="max-w-md mx-auto"
             >
               <Card className="p-8">
                 <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Chào mừng trở lại</h2>
                    <p className="text-zinc-500">Đăng nhập để bắt đầu tạo thumbnail</p>
                 </div>
                 <form onSubmit={onLogin} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-400 mb-1 block">Email</label>
                      <Input name="email" type="email" placeholder="email@example.com" icon={Mail} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-400 mb-1 block">Mật khẩu</label>
                      <Input name="password" type="password" placeholder="••••••••" icon={Lock} required />
                    </div>
                    {error && <p className="text-red-500 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">{error}</p>}
                    <Button type="submit" className="w-full" isLoading={isLoading}>Đăng nhập</Button>
                 </form>
                 <div className="mt-6 text-center text-sm text-zinc-500">
                    Chưa có tài khoản? <button onClick={() => setView('register')} className="text-red-500 hover:underline">Đăng ký ngay</button>
                 </div>
               </Card>
             </motion.div>
          )}

          {view === 'register' && (
             <motion.div 
               key="register" 
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
               className="max-w-md mx-auto"
             >
               <Card className="p-8">
                 <div className="mb-8 text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Tạo tài khoản mới</h2>
                    <p className="text-zinc-500">Tham gia cộng đồng sáng tạo thumbnail</p>
                 </div>
                 <form onSubmit={onRegister} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-400 mb-1 block">Họ và tên</label>
                      <Input name="name" type="text" placeholder="Nguyễn Văn A" icon={User} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-400 mb-1 block">Email</label>
                      <Input name="email" type="email" placeholder="email@example.com" icon={Mail} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-400 mb-1 block">Mật khẩu</label>
                      <Input name="password" type="password" placeholder="••••••••" icon={Lock} required />
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button type="submit" className="w-full" isLoading={isLoading}>Đăng ký ngay</Button>
                 </form>
                 <div className="mt-6 text-center text-sm text-zinc-500">
                    Đã có tài khoản? <button onClick={() => setView('login')} className="text-red-500 hover:underline">Đăng nhập</button>
                 </div>
               </Card>
             </motion.div>
          )}

          {view === 'subscription' && (
            <motion.div 
              key="subscription" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">Nâng cấp Lên Premium</h1>
                <p className="text-zinc-400 text-lg">Mở khóa toàn bộ tính năng và bắt đầu sáng tạo không giới hạn.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {PLANS.map((plan) => (
                  <Card key={plan.id} className="p-6 flex flex-col items-center text-center relative hover:border-red-600/50 transition-colors">
                    <Zap className="w-10 h-10 text-red-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="text-3xl font-black text-red-600 mb-6">{plan.price}</div>
                    <ul className="text-sm text-zinc-500 space-y-2 mb-8 text-left w-full">
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Export chất lượng 4K</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> AI Gợi ý tiêu đề</li>
                      <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Xóa watermark</li>
                    </ul>
                    <Button onClick={() => onSubscribe(plan)} className="w-full mt-auto" isLoading={isLoading}>Chọn gói</Button>
                  </Card>
                ))}
              </div>
              <div className="mt-12 text-center">
                <Button variant="ghost" onClick={() => setView('app')}>Để sau, quay lại Creator</Button>
              </div>
            </motion.div>
          )}

          {view === 'admin' && currentUser?.role === 'admin' && (
            <AdminView backToApp={() => setView('app')} />
          )}

          {view === 'app' && currentUser && (
            <AuthWrapper 
              user={currentUser} 
              isSubscribed={isSubscribed}
              goToSubscription={() => setView('subscription')}
            >
              <AvatarCreator user={currentUser} />
            </AuthWrapper>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-Views ---

const AuthWrapper = ({ user, isSubscribed, goToSubscription, children }: any) => {
  if (!user.isApproved) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-800">
          <Clock className="w-10 h-10 text-red-600 animate-pulse" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Tài khoản đang chờ duyệt</h2>
        <p className="text-zinc-400 text-lg mb-8">
          Vui lòng đợi quản trị viên phê duyệt tài khoản của bạn trước khi bắt đầu sử dụng dịch vụ. 
          Quá trình này thường mất từ 5-10 phút.
        </p>
        <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800 inline-block">
          <p className="text-sm text-zinc-500">Hỗ trợ: support@vantheweb.com</p>
        </div>
      </div>
    );
  }

  if (!isSubscribed) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-20 h-20 bg-red-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-600/20">
          <CreditCard className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Đăng ký thành viên</h2>
        <p className="text-zinc-400 text-lg mb-8">
          Bạn cần đăng ký gói sử dụng để truy cập vào Studio sáng tạo. 
          Chọn ngay một gói phù hợp với bạn!
        </p>
        <Button onClick={goToSubscription} className="text-lg px-8 py-3">Xem các gói dịch vụ</Button>
      </div>
    );
  }

  return <>{children}</>;
};

const AvatarCreator = ({ user }: { user: UserType }) => {
  const [topic, setTopic] = useState('');
  const [ideas, setIdeas] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<any>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple Canvas Drawer
  useEffect(() => {
    if (!canvasRef.current || !selectedStyle) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const width = 1280;
    const height = 720;
    
    // Draw background
    ctx.fillStyle = selectedStyle.colors.includes('Red') ? '#dc2626' : '#18181b';
    ctx.fillRect(0, 0, width, height);

    // Some simple shapes/gradients
    const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, 800);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Text
    ctx.font = 'bold 80px sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 20;
    
    // Multi-line text support
    const lines = selectedStyle.idea.split(' ');
    let line1 = lines.slice(0, Math.ceil(lines.length/2)).join(' ');
    let line2 = lines.slice(Math.ceil(lines.length/2)).join(' ');
    
    ctx.fillText(line1.toUpperCase(), width/2, height/2 - 20);
    if(line2) ctx.fillText(line2.toUpperCase(), width/2, height/2 + 80);

    // Subtitle / Brand
    ctx.font = '30px sans-serif';
    ctx.globalAlpha = 0.6;
    ctx.fillText('vân thế web studio'.toUpperCase(), width/2, height - 50);
    ctx.globalAlpha = 1.0;

  }, [selectedStyle]);

  const handleGenerateIdeas = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const result = await getThumbnailIdeas(topic);
      setIdeas(result);
      if (result.length > 0) setSelectedStyle(result[0]);
    } catch (err) {
      alert('Lỗi khi gọi AI. Vui lòng kiểm tra API Key.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadThumbnail = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `thumbnail-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
    confetti({ particleCount: 100, spread: 360, origin: { x: 0.5, y: 0.5 } });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Sidebar Controls */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="p-6">
          <h3 className="text-white font-bold flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-red-600" /> Sáng tạo với AI
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-500 mb-2 block">Chủ đề video của bạn</label>
              <textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Review iPhone 15 Pro Max siêu đẹp..."
                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-sm h-24 focus:border-red-600 outline-none"
              />
            </div>
            <Button onClick={handleGenerateIdeas} isLoading={isGenerating} className="w-full">
              Lấy ý tưởng từ AI
            </Button>
          </div>
        </Card>

        {ideas.length > 0 && (
          <div className="space-y-3">
             <h3 className="text-zinc-400 text-sm font-bold uppercase tracking-widest pl-1">Chọn mẫu</h3>
             {ideas.map((idea, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedStyle(idea)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedStyle === idea ? 'bg-red-600/10 border-red-600' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'}`}
                >
                  <p className="text-white text-sm font-bold mb-1">{idea.idea}</p>
                  <p className="text-zinc-500 text-xs">{idea.vibe}</p>
                </button>
             ))}
          </div>
        )}
      </div>

      {/* Preview Area */}
      <div className="lg:col-span-2 space-y-6">
        <div className="aspect-video w-full bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl relative group">
           {selectedStyle ? (
             <canvas 
               ref={canvasRef} 
               width={1280} 
               height={720} 
               className="w-full h-full object-contain"
             />
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-zinc-700">
                <ImageIcon className="w-20 h-20 mb-4 opacity-10" />
                <p>Nhập chủ đề để bắt đầu thiết kế</p>
             </div>
           )}
           <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs text-white uppercase tracking-widest font-bold">
              Full HD 1920x1080
           </div>
        </div>

        <div className="flex justify-end gap-3">
           <Button variant="outline" onClick={() => setSelectedStyle(null)}>Làm mới mẫu</Button>
           <Button onClick={downloadThumbnail} disabled={!selectedStyle}>
             <Download className="w-4 h-4" /> Tải về Thumbnail
           </Button>
        </div>

        {selectedStyle && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Card className="p-4 bg-zinc-950">
                <p className="text-xs text-zinc-500 uppercase font-bold mb-2 flex items-center gap-2">
                  <Layout className="w-3 h-3" /> Bố cục đề xuất
                </p>
                <p className="text-zinc-300 text-sm">{selectedStyle.layout}</p>
             </Card>
             <Card className="p-4 bg-zinc-950">
                <p className="text-xs text-zinc-500 uppercase font-bold mb-2 flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Màu sắc
                </p>
                <p className="text-zinc-300 text-sm">{selectedStyle.colors}</p>
             </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminView = ({ backToApp }: { backToApp: () => void }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    try {
      await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: !currentStatus })
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
         <h2 className="text-3xl font-bold text-white tracking-tight">Bảng Điều Khiển Admin</h2>
         <Button variant="outline" onClick={backToApp}>Quay lại App</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-zinc-950 border-b border-zinc-800">
                <tr>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Tên / Email</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Ngày tạo</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Hết hạn</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Trạng thái</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">Hành động</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-zinc-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col">
                         <span className="text-white font-medium">{u.name}</span>
                         <span className="text-xs text-zinc-500">{u.email}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-zinc-400">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-sm text-zinc-400">
                      {u.subscribedUntil ? new Date(u.subscribedUntil).toLocaleDateString('vi-VN') : '---'}
                    </td>
                    <td className="p-4">
                      {u.isApproved ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                          Đã Duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          Chờ Duyệt
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                       <Button 
                         variant={u.isApproved ? 'outline' : 'primary'} 
                         className="text-xs px-3 py-1"
                         onClick={() => toggleApproval(u.id, u.isApproved)}
                       >
                         {u.isApproved ? 'Hủy duyệt' : 'Duyệt ngay'}
                       </Button>
                    </td>
                  </tr>
                ))}
             </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
