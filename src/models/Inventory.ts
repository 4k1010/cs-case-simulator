import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInventory extends Document {
  userId: string; // 使用者的 ID 或 Email
  skin: mongoose.Types.ObjectId; // 關聯到 Skin 表的 _id
  acquiredAt: Date;
}

const InventorySchema = new Schema<IInventory>({
  // 這裡假設你的 user 物件有 id 或 email，直接存下來當識別
  userId: { type: String, required: true, index: true },
  
  // 關聯到 Skin，這樣我們可以用 .populate('skin') 直接拿到圖片和名稱
  skin: { type: Schema.Types.ObjectId, ref: 'Skin', required: true },
  
  acquiredAt: { type: Date, default: Date.now }
});

const Inventory = (mongoose.models.Inventory as Model<IInventory>) || mongoose.model<IInventory>('Inventory', InventorySchema);

export default Inventory;