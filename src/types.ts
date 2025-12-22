// 定義型別用

// 1. 定義 Rarity 物件結構 
export interface RarityInfo {
  id: string;
  name: string;
  color: string; 
}

// 2. 定義通用的 Skin 介面
export interface Skin {
  id: string;     
  name: string;   
  rarity: RarityInfo; 
  image: string;  
  
  paint_index?: string;
  
  // phase可選
  phase?: string; 
  
  price?: number;
  wear?: number;
  _uniqueId?: string; 
}

export interface Crate {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  contains: Skin[]; 
}