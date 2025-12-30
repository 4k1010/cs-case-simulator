import { useState, useEffect } from "react";
import { DEFAULT_PROBS, type RarityProbs } from "../App"; // 引入預設值

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
  probabilities: RarityProbs;
  setProbabilities: (probs: RarityProbs) => void;
}

export default function Navbar({ user, login, logout, currentView, setView, probabilities, setProbabilities }: NavbarProps) {
    const [showSettings, setShowSettings] = useState(false);
    
    // 本地暫存設定 (避免打字時一直觸發全域更新)
    const [tempProbs, setTempProbs] = useState<RarityProbs>(probabilities);

    // 當外部 probabilities 改變時，同步更新內部
    useEffect(() => {
        setTempProbs(probabilities);
    }, [probabilities]);

    // 計算總和
    const total = Object.values(tempProbs).reduce((a, b) => a + Number(b), 0);
    const isValid = Math.abs(total - 100) < 0.01; // 容許些微浮點數誤差

    const handleChange = (key: keyof RarityProbs, value: string) => {
        setTempProbs(prev => ({
            ...prev,
            [key]: Number(value)
        }));
    };

    const handleSave = () => {
        if (isValid) {
            setProbabilities(tempProbs);
            setShowSettings(false);
        } else {
            alert("總機率必須等於 100%");
        }
    };

    const handleReset = () => {
        setTempProbs(DEFAULT_PROBS);
        setProbabilities(DEFAULT_PROBS); // 直接套用
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
                            <button 
                            onClick={() => setShowSettings(!showSettings)}
                            className={`px-3 py-2 rounded-md text-sm font-medium transition flex items-center gap-1 ${showSettings ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-300 hover:bg-slate-800'}`}
                            >
                            <span>Probabilities</span>
                            </button>
                            <a
                                href="https://www.canva.com/design/DAG8QVLRk6M/QpQ5aHnC6cWdE7oBjMk3-w/view?utm_content=DAG8QVLRk6M&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h0e8ab46869" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-3 py-2 rounded-md text-sm font-medium transition text-slate-300 hover:bg-slate-800 cursor-pointer"
                            >
                            Documents
                            </a>
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

        {/* 機率調整 Modal */}
        {showSettings && (
            <div className="absolute top-16 left-0 w-full bg-slate-800 border-b border-slate-600 shadow-2xl p-6 animate-slide-down">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">自訂機率</h3>
                        <div className={`text-sm font-mono font-bold px-3 py-1 rounded ${isValid ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            Total: {total.toFixed(2)}%
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                        {/* 產生 5 個輸入框 */}
                        {(Object.keys(DEFAULT_PROBS) as Array<keyof RarityProbs>).map((rarity) => {
                            const colors: Record<string, string> = {
                                gold: 'text-yellow-400 border-yellow-500',
                                red: 'text-red-500 border-red-500',
                                pink: 'text-pink-400 border-pink-400',
                                purple: 'text-purple-400 border-purple-400',
                                blue: 'text-blue-400 border-blue-400'
                            };
                            return (
                                <div key={rarity} className="flex flex-col gap-2">
                                    <label className={`capitalize font-bold ${colors[rarity].split(' ')[0]}`}>{rarity}</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={tempProbs[rarity]}
                                        onChange={(e) => handleChange(rarity, e.target.value)}
                                        className={`bg-slate-900 border ${colors[rarity].split(' ')[1]} rounded px-2 py-1 text-white focus:outline-none focus:ring-2`}
                                    />
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        step="0.1"
                                        value={tempProbs[rarity]}
                                        onChange={(e) => handleChange(rarity, e.target.value)}
                                        className="accent-slate-500"
                                    />
                                </div>
                            )
                        })}
                    </div>

                    <div className="flex justify-end gap-4">
                        <button 
                            onClick={handleReset}
                            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
                        >
                            回復官方預設 (Reset)
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={!isValid}
                            className={`px-6 py-2 rounded font-bold transition ${isValid ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                        >
                            套用設定 (Apply)
                        </button>
                    </div>
                </div>
            </div>
        )}
        </nav>
    );
}