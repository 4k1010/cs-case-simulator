// 移除 axios, useGoogleLogin, useState (這些都交給 App 處理了)
interface UserProfile {
  name: string;
  picture: string;
  email: string;
}

interface NavbarProps {
  user: UserProfile | null;
  login: () => void;
  logout: () => void;
  currentView: string;
  setView: (view: string) => void;
}

// ★ 修正重點：這裡要解構出 user, login, logout
export default function Navbar({ user, login, logout, currentView, setView }: NavbarProps) {
    
    return (
        <nav className="bg-slate-900 text-white border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
            
            {/* Logo & Menu */}
            <div className="flex items-center gap-8">
                <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent cursor-pointer"
                    onClick={() => setView('cases')}>
                CS2 Case Sim
                </h1>
                
                <div className="hidden md:block">
                <div className="flex items-baseline space-x-2">
                    <button 
                    onClick={() => setView('cases')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${currentView === 'cases' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                    Cases
                    </button>
                    <button 
                    onClick={() => setView('storage')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition ${currentView === 'storage' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                    Storage
                    </button>
                </div>
                </div>
            </div>

            {/* User Section */}
            <div>
                {user ? (
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                    <img src={user.picture} className="w-8 h-8 rounded-full border border-slate-500" />
                    <span className="hidden sm:block text-sm font-medium text-slate-200">{user.name}</span>
                    </div>
                    <button onClick={logout} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-1.5 rounded text-sm transition">
                    登出
                    </button>
                </div>
                ) : (
                <button 
                    // 使用 props 傳進來的 login
                    onClick={login}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition"
                >
                    登入
                </button>
                )}
            </div>
            
            </div>
        </div>
        </nav>
    );
}