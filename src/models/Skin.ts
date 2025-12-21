import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISkin extends Document {
  id: string;       // ★ 新增：外部 API 的原始 ID (用來區分 Phase)
  name: string;
  weapon: string;
  skinName: string;
  rarity: string;
  imageUrl: string;
  phase?: string;   // ★ 新增：Phase 資訊 (Optional)
  isSpecial: boolean;
  minFloat: number;
  maxFloat: number;
  prices: {
    [key: string]: number | undefined;
  };
  updatedAt: Date;
}

const SkinSchema = new Schema<ISkin>({
  // ★ 關鍵：id 必填且唯一 (這是外部 API 的 ID)
  id: { type: String, required: true, unique: true, index: true }, 
  
  // ★ 關鍵：name 不再是 unique，因為 Phase 1 和 Emerald 可能共用 "Gamma Doppler" 這個名字
  name: { type: String, required: true }, 
  
  weapon: { type: String, required: true },
  skinName: { type: String, required: true },
  
  rarity: { 
    type: String, 
    // 這裡我們維持你原本的設計，存轉換後的顏色字串，簡單明瞭
    enum: ['white', 'lightblue', 'blue', 'purple', 'pink', 'red', 'gold'],
    required: true 
  },
  
  imageUrl: { type: String, required: true },
  
  // ★ 新增：儲存 Phase (如 "Phase 1", "Emerald")
  phase: { type: String, default: null },

  isSpecial: { type: Boolean, default: false },
  minFloat: { type: Number, default: 0 },
  maxFloat: { type: Number, default: 1 },
  
  prices: {
    type: Map,
    of: Number,
    default: {}
  },
  
  updatedAt: { type: Date, default: Date.now }
});

const Skin = (mongoose.models.Skin as Model<ISkin>) || mongoose.model<ISkin>('Skin', SkinSchema);

export default Skin;