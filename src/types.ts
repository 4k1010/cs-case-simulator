// types.ts

// 1. 定義 Rarity 物件結構 (對應你的 JSON)
export interface RarityInfo {
  id: string;
  name: string;
  color: string; // 例如 "#b0c3d9" 或 "#eb4b4b"
}

// 2. 定義通用的 Skin 介面
export interface Skin {
  id: string;     // 例如 "skin-8ec2f49d34a9"
  name: string;   // 例如 "Dual Berettas | Oil Change"
  
  // 這裡直接用你資料庫回傳的物件結構
  rarity: RarityInfo; 
  
  image: string;  // 你的 JSON 是用 "image"，不是 "imageUrl"
  
  paint_index?: string;
  
  // ★ 關鍵：把 phase 設為可選 (?.)，一般槍枝沒有這個欄位也沒關係
  phase?: string; 
  
  // 其他前端需要的輔助欄位 (如果是從後端算好傳過來，這裡可以不用)
  price?: number;
  wear?: number;
  _uniqueId?: string; // 僅前端輪盤動畫用
}

export interface Crate {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  contains: Skin[]; 
}