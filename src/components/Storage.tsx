import { useState, useEffect } from "react";
import axios from "axios";
import { type Skin } from "../types";

// 擴充型別包含庫存資訊
interface InventoryItem extends Skin {
  inventoryId: string;
  acquiredAt: string;
}

interface StorageProps {
  user: any;
  login: () => void; 
}

export default function Storage({ user, login }: StorageProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  // 1. 從後端讀取庫存
  useEffect(() => {
    const fetchInventory = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const userId = user.name || "TEST_USER"; 
        const res = await axios.get(`/api/inventory?userId=${userId}`);
        setInventory(res.data);
      } catch (error) {
        console.error("Failed to load inventory", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [user]);

  // 2. 清空庫存功能
  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear your ENTIRE inventory?")) return;
    
    setClearing(true);
    try {
        const userId = user?.name || "TEST_USER";
        await axios.delete('/api/inventory', { data: { userId } });
        setInventory([]);
    } catch (error) {
        console.error("Failed to clear inventory", error);
        alert("Failed to clear inventory");
    } finally {
        setClearing(false);
    }
  };

  const totalValue = inventory.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalSpent = 0; 

  // 未登入
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="bg-slate-700/50 p-8 rounded-2xl border border-slate-600 max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-slate-400 mb-6">請先登入以查看庫存。</p>
          
          <button 
            onClick={login} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all"
          >
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  // 已登入
  return (
    <div className="animate-fade-in w-full">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            Inventory ({inventory.length})
          </h2>
          {inventory.length > 0 && (
            <button 
                onClick={handleClear}
                disabled={clearing}
                className="px-4 py-2 bg-red-900/50 border border-red-700 text-red-200 rounded hover:bg-red-800 transition disabled:opacity-50 text-sm flex items-center gap-2"
            >
                {clearing ? "Clearing..." : "Clear All"}
            </button>
          )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
          <div className="text-slate-400 text-sm">庫存總價值</div>
          <div className="text-2xl font-bold text-green-400">${totalValue.toFixed(2)}</div>
        </div>
        <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600">
          <div className="text-slate-400 text-sm">總花費</div>
          <div className="text-2xl font-bold text-red-400">-${totalSpent.toFixed(2)}</div>
        </div>
      </div>

      {loading ? (
          <div className="text-center text-slate-400 py-10">Loading Inventory...</div>
      ) : inventory.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
              Empty Storage. Go open some cases!
          </div>
      ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4">
            {inventory.map((item) => (
              <div key={item.inventoryId} className="bg-slate-700 p-3 rounded-lg border border-slate-600 hover:border-blue-500 transition group relative">
                <div className="aspect-[4/3] mb-2 bg-slate-800/50 rounded flex items-center justify-center overflow-hidden">
                   <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                </div>
                
                <div className="absolute top-2 right-2 bg-slate-900/80 px-1.5 py-0.5 rounded text-xs text-green-400 font-mono">
                    ${item.price?.toFixed(2) || '0.00'}
                </div>

                <div className="text-center">
                    <div className="text-xs text-slate-400 truncate mb-1 uppercase tracking-wider">
                        {typeof item.rarity === 'string' ? item.rarity : 'item'}
                    </div>
                    <div className="text-sm font-bold text-slate-200 truncate group-hover:text-blue-400" title={item.name}>
                        {item.name}
                    </div>
                </div>
              </div>
            ))}
          </div>
      )}
    </div>
  );
}