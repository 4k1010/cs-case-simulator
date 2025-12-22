import { useState, useEffect } from 'react';
import Navbar from "./components/Navbar";
import Storage from "./components/Storage";
import OpeningView from "./components/OpeningView";
import { type Crate } from "./types";
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { API_BASE_URL } from '../config.ts';

// 定義使用者資料介面
interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export default function App() {
  const [currentView, setCurrentView] = useState('cases'); 
  const [user, setUser] = useState<UserProfile | null>(null);
  const [selectedCrate, setSelectedCrate] = useState<Crate | null>(null);
  const [crates, setCrates] = useState<Crate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. 初始化檢查 localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('cs_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user");
        localStorage.removeItem('cs_user');
      }
    }
  }, []);

  // 2. 載入箱子資料 (維持不變)
  useEffect(() => {
    const fetchCrates = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/crates`);
        const formattedData = res.data.map((item: any) => ({
            ...item,
            id: item._id, 
        }));
        setCrates(formattedData);
      } catch (error) {
        console.error("Failed to load crates", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCrates();
  }, []);

  // 3. ★ 修正：真正的登入邏輯 (移到這裡)
  const googleLogin = useGoogleLogin({
     onSuccess: async (tokenResponse) => {
        try {
            // 使用 Token 換取真正的 Google 使用者資料
            const userInfo = await axios.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
            );
            
            const newUser = userInfo.data;
            console.log("Login Success, User:", newUser);
            
            setUser(newUser);
            // 存入 localStorage 以便重整後保持登入
            localStorage.setItem('cs_user', JSON.stringify(newUser));
        } catch (error) {
            console.error("Failed to fetch user info", error);
        }
     },
     onError: () => console.log('Login Failed'),
  });

  // 4. 定義登出邏輯
  const logout = () => {
      setUser(null);
      localStorage.removeItem('cs_user');
      setCurrentView('cases'); // 登出後回到首頁
  };

  const handleCrateClick = (crate: Crate) => {
      setSelectedCrate(crate);
      setCurrentView('opening');
  };

  return (
    <div className="min-h-screen bg-slate-800 text-slate-100 font-sans">
      <Navbar 
        user={user} 
        login={() => googleLogin()} 
        logout={logout}
        currentView={currentView}
        setView={setCurrentView}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'cases' && (
            <>
                <h2 className="text-2xl font-bold mb-6 text-yellow-400">Select Case</h2>
                {isLoading ? (
                    <div className="text-center text-slate-400 py-20">Loading Cases...</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {crates.map((crate) => (
                        <div 
                            key={crate.id} 
                            onClick={() => handleCrateClick(crate)}
                            className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 hover:bg-slate-700 hover:scale-105 hover:border-yellow-500 transition-all cursor-pointer group"
                        >
                        <div className="aspect-square flex items-center justify-center mb-4 relative">
                            <div className="absolute inset-0 bg-yellow-500/0 group-hover:bg-yellow-500/20 blur-xl transition-all rounded-full" />
                            <img src={crate.imageUrl} alt={crate.name} className="w-full h-full object-contain relative z-10 drop-shadow-xl" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-sm font-medium text-slate-200 group-hover:text-yellow-400 truncate">{crate.name}</h3>
                            <p className="text-xs text-slate-500 mt-1">NT${crate.price.toFixed(2)}</p>
                        </div>
                        </div>
                    ))}
                    </div>
                )}
            </>
        )}

        {currentView === 'storage' && (
            <Storage 
                user={user} 
                login={() => googleLogin()} 
            />
        )}

        {currentView === 'opening' && selectedCrate && (
            <OpeningView 
                crate={selectedCrate} 
                user={user} 
                onBack={() => setCurrentView('cases')} 
            />
        )}
      </main>
    </div>
  );
}