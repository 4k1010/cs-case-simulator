import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInventory extends Document {
  userId: string;
  skin: mongoose.Types.ObjectId; 
  acquiredAt: Date;
  cost: number;
}

const InventorySchema = new Schema<IInventory>({
  userId: { type: String, required: true, index: true }, 
  skin: { type: Schema.Types.ObjectId, ref: 'Skin', required: true },  
  acquiredAt: { type: Date, default: Date.now },
  cost: { type: Number, default: 2.49 }
});

const Inventory = (mongoose.models.Inventory as Model<IInventory>) || mongoose.model<IInventory>('Inventory', InventorySchema);

export default Inventory;