import { useState, useEffect } from 'react';
import Navbar from "./components/Navbar";
import Storage from "./components/Storage";
import OpeningView from "./components/OpeningView";
import { type Crate } from "./types";
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

export default function App() {
  const [currentView, setCurrentView] = useState('cases'); 
  const [user, setUser] = useState<any>(null);
  const [selectedCrate, setSelectedCrate] = useState<Crate | null>(null);
  
  const [crates, setCrates] = useState<Crate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 載入真實箱子資料
  useEffect(() => {
    const fetchCrates = async () => {
      try {
        const res = await axios.get('/api/crates');
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

  // 1. 定義登入邏輯 
  const googleLogin = useGoogleLogin({
     onSuccess: async (tokenResponse) => {
        console.log("Login Success", tokenResponse);
        setUser({
            name: "Test User", 
            email: "test@example.com", 
            picture: "" 
        });
     },
     onError: () => console.log('Login Failed'),
  });

  const logout = () => {
      setUser(null);
      setCurrentView('cases'); // 登出後跳回首頁
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
                            <p className="text-xs text-slate-500 mt-1">${crate.price.toFixed(2)}</p>
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