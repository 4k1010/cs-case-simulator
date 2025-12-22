import { useState, useEffect } from "react";
import axios from "axios";
// 雖然 types.ts 定義不同，但我們這裡會用 as any 或自定義介面來接 API 的真實資料
import { type Skin } from "../types"; 

// 1. 重新定義介面以符合 Mongoose 回傳的真實資料
interface RealInventoryItem {
  inventoryId: string;
  name: string;
  // 資料庫回傳的是 imageUrl，不是 image
  imageUrl: string; 
  // 資料庫回傳的是字串 ('blue', 'red'...)，不是物件
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

// 2. 顏色對照表 (Key 必須對應 Skin.ts 的 enum: white, lightblue, blue, etc.)
const RARITY_BG_COLORS: Record<string, string> = {
  white: 'bg-slate-400',      // Consumer (Database 存 white)
  gray: 'bg-slate-400',       // 相容舊資料
  lightblue: 'bg-sky-400',    // Industrial
  blue: 'bg-blue-600',        // Mil-Spec
  purple: 'bg-purple-600',    // Restricted
  pink: 'bg-pink-500',        // Classified
  red: 'bg-red-600',          // Covert
  gold: 'bg-yellow-400',      // Special
};

// 3. 簡化後的 Helper：直接用資料庫存的顏色字串來對應
const getRarityBg = (rarity: string) => {
  const r = rarity ? rarity.toLowerCase() : 'blue';
  return RARITY_BG_COLORS[r] || 'bg-blue-600';
};

export default function Storage({ user, login }: StorageProps) {
  // 使用 RealInventoryItem 來接收資料
  const [inventory, setInventory] = useState<RealInventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const userId = user.name || "TEST_USER"; 
        const res = await axios.get(`/api/inventory?userId=${userId}`);
        // 直接將回傳資料存入，API 欄位應為: inventoryId, imageUrl, rarity(string), name...
        setInventory(res.data);
      } catch (error) {
        console.error("Failed to load inventory", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [user]);

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear your ENTIRE inventory?")) return;
    setClearing(true);
    try {
        const userId = user?.name || "TEST_USER";
        await axios.delete('/api/inventory', { data: { userId } });
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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="bg-slate-700/50 p-8 rounded-2xl border border-slate-600 max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-slate-400 mb-6">請先登入以查看庫存。</p>
          <button onClick={login} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all">Login with Google</button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Inventory ({inventory.length})</h2>
          {inventory.length > 0 && (
            <button onClick={handleClear} disabled={clearing} className="px-4 py-2 bg-red-900/50 border border-red-700 text-red-200 rounded hover:bg-red-800 transition disabled:opacity-50 text-sm flex items-center gap-2">
                {clearing ? "Clearing..." : "Clear All"}
            </button>
          )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
          <div className="text-slate-400 text-sm">庫存總價值</div>
          <div className="text-2xl font-bold text-green-400">NT${totalValue.toFixed(2)}</div>
        </div>
        <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
          <div className="text-slate-400 text-sm">總花費</div>
          <div className="text-2xl font-bold text-red-400">-NT${totalSpent.toFixed(2)}</div>
        </div>
        <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
          <div className="text-slate-400 text-sm">損益</div>
          <div className={`text-2xl font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
            {isProfit ? '+' : ''}{profit.toFixed(2)}
          </div>
        </div>
      </div>

      {loading ? (
          <div className="text-center text-slate-400 py-10">Loading Inventory...</div>
      ) : inventory.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl text-slate-500">Empty Storage. Go open some cases!</div>
      ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {inventory.map((item) => {
              
              // ★ 修正 1: 資料庫欄位是 imageUrl
              const imgSrc = item.imageUrl;
              
              // ★ 修正 2: 資料庫欄位是 rarity (字串)，例如 "red", "blue"
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
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider leading-tight truncate">{displayName}</div>
                    </div>
                </div>
              );
            })}
          </div>
      )}
    </div>
  );
}