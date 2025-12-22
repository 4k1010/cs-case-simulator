//處理箱子數據
import mongoose, { Schema, Document, Model } from 'mongoose';
import type { ISkin } from './Skin';

export interface ICrate extends Document {
  name: string;
  price: number;
  imageUrl: string;
  contains: ISkin[];      
  specialItems: ISkin[];
}

const CrateSchema = new Schema<ICrate>({
  name: { type: String, required: true, unique: true },
  price: { type: Number, default: 2.49 },
  imageUrl: { type: String, required: true },
  contains: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'Skin' 
  }],
  specialItems: [{
    type: Schema.Types.ObjectId,
    ref: 'Skin'
  }]
});

const Crate = (mongoose.models.Crate as Model<ICrate>) || mongoose.model<ICrate>('Crate', CrateSchema);

export default Crate;