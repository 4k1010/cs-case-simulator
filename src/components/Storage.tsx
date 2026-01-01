import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from '../../config.ts';

interface RealInventoryItem {
  inventoryId: string;
  name: string;
  imageUrl: string; 
  rarity: string; 
  price?: number;
  cost?: number;
  acquiredAt: string;
  wear?: number;
}

interface StorageProps {
  user: any;
  login: () => void; 
}

const RARITY_BG_COLORS: Record<string, string> = {
  white: 'bg-slate-400',      
  gray: 'bg-slate-400',       
  lightblue: 'bg-sky-400',   
  blue: 'bg-blue-600',        
  purple: 'bg-purple-600',    
  pink: 'bg-pink-500',        
  red: 'bg-red-600',          
  gold: 'bg-yellow-400',      
};

// 稀有度權重（用於排序等級）
const RARITY_WEIGHT: Record<string, number> = {
    gold: 6,
    red: 5,
    pink: 4,
    purple: 3,
    blue: 2,
    lightblue: 1,
    white: 0,
    gray: 0
};

const getRarityBg = (rarity: string) => {
  const r = rarity ? rarity.toLowerCase() : 'blue';
  return RARITY_BG_COLORS[r] || 'bg-blue-600';
};

export default function Storage({ user, login }: StorageProps) {
  const [isTestMode, setIsTestMode] = useState(false);
  const currentUserId = user?.email || (isTestMode ? "TEST_USER" : null);

  const [inventory, setInventory] = useState<RealInventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [sortType, setSortType] = useState<'time' | 'rarity'>('time');

  useEffect(() => {
    if (!currentUserId) return;
    
    const fetchInventory = async () => {
      setLoading(true);
      try {
        console.log("Fetching inventory for:", currentUserId); 
        const res = await axios.get(`${API_BASE_URL}/api/inventory?userId=${currentUserId}`);
        setInventory(res.data);
      } catch (error) {
        console.error("Failed to load inventory", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [currentUserId]);

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear your ENTIRE inventory?")) return;
    setClearing(true);
    try {
        await axios.delete(`${API_BASE_URL}/api/inventory`, { data: { userId: currentUserId } });
        setInventory([]);
    } catch (error) {
        alert("Failed to clear inventory");
    } finally {
        setClearing(false);
    }
  };

  const totalValue = inventory.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalSpent = inventory.reduce((sum, item) => sum + (item.cost || 2.49), 0); 
  const profit = totalValue - totalSpent;
  const isProfit = profit >= 0;

  const roi = totalSpent > 0 ? (profit / totalSpent) * 100 : 0;
  const isRoiPositive = roi >= 0;

  // 計算各品質數量
  const stats = useMemo(() => {
      const counts: Record<string, number> = { gold: 0, red: 0, pink: 0, purple: 0, blue: 0, lightblue: 0, white: 0 };     
      inventory.forEach(item => {
          let r = (item.rarity || 'blue').toLowerCase();
          
          // gold special case
          if (item.name && item.name.includes('★')) {
              r = 'gold';
          }

          if (counts[r] !== undefined) counts[r]++;
          else counts[r] = 1; 
      });
      return counts;
  }, [inventory]);

  // 處理排序邏輯
  const sortedInventory = useMemo(() => {
      return [...inventory].sort((a, b) => {
          if (sortType === 'rarity') {
              const getWeight = (item: RealInventoryItem) => {
                  // gold special case
                  if (item.name && item.name.includes('★')) return RARITY_WEIGHT['gold'];
                  return RARITY_WEIGHT[(item.rarity || 'blue').toLowerCase()] || 0;
              };

              const wA = getWeight(a);
              const wB = getWeight(b);

              if (wA !== wB) return wB - wA;
              
              return (b.price || 0) - (a.price || 0);
          } else {
              return new Date(b.acquiredAt).getTime() - new Date(a.acquiredAt).getTime();
          }
      });
  }, [inventory, sortType]);

  // 登入檢查
  if (!currentUserId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="bg-slate-700/50 p-8 rounded-2xl border border-slate-600 max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-slate-400 mb-6">請先登入以查看庫存。</p>
          
          <div className="flex flex-col gap-3">
            <button onClick={login} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all">
                Login with Google
            </button>
            <button 
                onClick={() => setIsTestMode(true)} 
                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-all border border-gray-500"
            >
                Login as Guest
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full relative">
      {/* 背景 */}
      <div className="fixed inset-0 z-0 bg-black">
        <img 
          src="/photo/dust2.webp" 
          alt="Background" 
          className="w-full h-full object-cover blur-[100px] opacity-90"
        />
        <div className="absolute inset-0 bg-black/70"></div>
      </div>

      <div className="relative z-10 animate-fade-in w-full">
        {/* 頂部標題與工具列 */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Inventory <span className="text-slate-400 text-sm">({inventory.length})</span>
            </h2>
        </div>
        
        {/* 財務儀表板 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-700/50 p-4 rounded border border-slate-600">
            <div className="text-slate-400 text-sm">庫存總價值</div>
            <div className="text-2xl font-bold text-green-400">NT${totalValue.toFixed(2)}</div>
          </div>
          <div className="bg-slate-700/50 p-4 rounded border border-slate-600">
            <div className="text-slate-400 text-sm">總花費</div>
            <div className="text-2xl font-bold text-red-400">-NT${totalSpent.toFixed(2)}</div>
          </div>
          <div className="bg-slate-700/50 p-4 rounded border border-slate-600">
            <div className="text-slate-400 text-sm">損益</div>
            <div className={`text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {isProfit ? '+' : ''}{profit.toFixed(2)}
            </div>
          </div>
          <div className="bg-slate-700/50 p-4 rounded border border-slate-600">
            <div className="text-slate-400 text-sm">ROI</div>
            <div className={`text-2xl font-bold ${isRoiPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isRoiPositive ? '+' : ''}{roi.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* 品質統計條 */}
        {inventory.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700 rounded p-3 mb-6 flex flex-wrap gap-4 text-sm ">
                <span className="text-slate-400 font-bold mr-2">STATS:</span>
                <span className="text-yellow-400 drop-shadow-sm">Gold: {stats.gold || 0}</span>
                <span className="text-red-500 drop-shadow-sm">Red: {stats.red || 0}</span>
                <span className="text-pink-400 drop-shadow-sm">Pink: {stats.pink || 0}</span>
                <span className="text-purple-400 drop-shadow-sm">Purple: {stats.purple || 0}</span>
                <span className="text-blue-400 drop-shadow-sm">Blue: {stats.blue || 0}</span>
            </div>
        )}
        <div className="flex items-center justify-between mb-6 w-full">
              {/* 排序選單 */}
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-bold">Sort by:</span>
                <select 
                    value={sortType}
                    onChange={(e) => setSortType(e.target.value as 'time' | 'rarity')}
                    className="bg-slate-700 text-white text-sm px-2 py-2 rounded border border-slate-600 focus:outline-none focus:border-blue-500"
                >
                    <option value="time">Newest</option>
                    <option value="rarity">Quality</option>
                </select>
              </div>

              {inventory.length > 0 && (
                  <button onClick={handleClear} disabled={clearing} className="px-4 py-2 bg-red-600 font-bold text-white-400 rounded hover:bg-red-800 transition disabled:opacity-50 text-sm flex items-center gap-2 whitespace-nowrap">
                      {clearing ? "Clearing..." : "Clear Inventory"}
                  </button>
              )}
        </div>

        {/* 物品列表 */}
        {loading ? (
            <div className="text-center text-slate-400 py-10">Loading Inventory...</div>
        ) : inventory.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl text-slate-500">Empty Storage. Go open some cases!</div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
              {/* 使用 sortedInventory 來渲染 */}
              {sortedInventory.map((item) => {                
                const imgSrc = item.imageUrl;
                const rarityString = item.rarity || 'blue';
                const isGold = rarityString === 'gold';
                const rarityBgClass = getRarityBg(rarityString);

                // 拆解名稱
                let weaponName = item.name;
                let displayName = item.name;
                if (item.name && item.name.includes('|')) {
                    const parts = item.name.split(' | ');
                    weaponName = parts[0];
                    displayName = parts[1];
                }

                return (
                  <div key={item.inventoryId} className="flex flex-col shadow-lg group cursor-default transition-transform duration-200 hover:scale-[1.02] bg-[#222]">
                      {/* 上半部：圖片區 */}
                      <div className={`w-full aspect-[4/3] ${isGold ? 'bg-[#b78700]' : 'bg-[#6a6a6a]'} flex items-center justify-center relative overflow-hidden`}>
                          <div className="w-90 h-90 absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                          <img 
                              src={imgSrc} 
                              alt={item.name} 
                              className="w-full h-full object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105" 
                          />
                          <div className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-green-400 font-mono shadow-sm backdrop-blur-sm border border-white/10">
                              ${item.price?.toFixed(2) || '0.00'}
                          </div>
                      </div>

                      {/* 中間：稀有度條 */}
                      <div className={`w-full h-[4px] ${rarityBgClass}`}></div>

                      {/* 下半部：文字區 */}
                      <div className="w-full bg-[#2a2a2a] px-2 py-2 flex flex-col justify-center min-h-[50px]">
                          <div className="text-sm text-white font-extrabold truncate leading-tight">{weaponName}</div>
                          <div className="text-[10px] text-white-400 uppercase tracking-wider leading-tight truncate">{displayName}</div>
                      </div>
                  </div>
                );
              })}
            </div>
        )}
      </div>
    </div>
  );
}