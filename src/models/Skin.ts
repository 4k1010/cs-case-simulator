//處理造型數據
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISkin extends Document {
  id: string;       
  name: string;
  weapon: string;
  skinName: string;
  rarity: string;
  imageUrl: string;
  phase?: string;   
  isSpecial: boolean;
  minFloat: number;
  maxFloat: number;
  prices: {
    [key: string]: number | undefined;
  };
  updatedAt: Date;
}

const SkinSchema = new Schema<ISkin>({
  id: { type: String, required: true, unique: true, index: true },  
  name: { type: String, required: true },  
  weapon: { type: String, required: true },
  skinName: { type: String, required: true },
  
  rarity: { 
    type: String, 
    enum: ['white', 'lightblue', 'blue', 'purple', 'pink', 'red', 'gold'],
    required: true 
  },
  
  imageUrl: { type: String, required: true },
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