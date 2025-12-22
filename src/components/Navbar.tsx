import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useState } from 'react';

interface UserProfile {
  name: string;
  picture: string;
  email: string;
}

interface NavbarProps {
  user: UserProfile | null; // 接收 User
  login: () => void;        // 接收登入功能
  logout: () => void;       // 接收登出功能
  currentView: string;      // 知道現在在哪一頁
  setView: (view: string) => void; // 切換頁面的功能
}

export default function Navbar({ currentView, setView }: NavbarProps) {
    const [user, setUser] = useState<UserProfile | null>(null);

    // 定義登入功能
    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
        try {
            // 使用 Google 給的 Token 去換取使用者資料
            const userInfo = await axios.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
            );
            setUser(userInfo.data); // 把資料存進狀態
        } catch (error) {
            console.error('Login Failed:', error);
        }
        },
        onError: () => console.log('Login Failed'),
    });

    // 定義登出功能
    const logout = () => {
        setUser(null);
    };
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
                    onClick={() => login()}
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