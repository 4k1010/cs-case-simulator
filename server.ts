import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Skin from './src/models/Skin.ts';
import Crate from './src/models/Crate.ts';
import Inventory from './src/models/Inventory.ts'; 

// 載入環境變數
dotenv.config({ path: '.env.local' });

const app = express();

// Middleware
app.use(cors({
    origin: '*', 
    credentials: true
}));
app.use(express.json());

// 資料庫連線
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => {
    console.log('MongoDB Connected via Express');
    console.log(`Models Registered: ${Skin.modelName}, ${Crate.modelName}, ${Inventory.modelName}`);
  })
  .catch(err => console.error('MongoDB Error:', err));

// ================= API Routes =================

app.get('/api/crates', async (req, res) => {
  try {
    const crates = await Crate.find({}).populate('contains', 'name imageUrl rarity');
    res.json(crates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch crates' });
  }
});

app.post('/api/open', async (req, res) => {
  try {
    // 1. 接收 probabilities 參數
    const { crateId, userId, probabilities } = req.body; 
    const targetUserId = userId || "TEST_USER"; 

    let crate = await Crate.findOne({ _id: crateId }).populate('contains');
    if (!crate) crate = await Crate.findOne({ name: crateId }).populate('contains');
    
    if (!crate) {
        res.status(404).json({ error: 'Crate not found' });
        return;
    }

    /* --- 動態機率邏輯 --- */
    
    // 定義機率介面 (預設值: 官方機率 %)
    const defaultProbs = {
        gold: 0.26,
        red: 0.64,
        pink: 3.2,
        purple: 15.98,
        blue: 79.92
    };

    const probs = probabilities || defaultProbs;

    const roll = Math.random() * 100;
    
    let targetRarity = 'blue';
    let cumulative = 0;
  
    if (roll < (cumulative += Number(probs.gold))) {
        targetRarity = 'gold';
    } else if (roll < (cumulative += Number(probs.red))) {
        targetRarity = 'red';
    } else if (roll < (cumulative += Number(probs.pink))) {
        targetRarity = 'pink';
    } else if (roll < (cumulative += Number(probs.purple))) {
        targetRarity = 'purple';
    } else {
        targetRarity = 'blue';
    }

    let pool: any[] = [];

    // if gold
    if (targetRarity === 'gold') {
        if (crate.specialItems && crate.specialItems.length > 0) {
            await crate.populate('specialItems');
            pool = crate.specialItems as any[];
        } else {
            // if no gold then red
            targetRarity = 'red';
        }
    }
    if (pool.length === 0) {
        pool = (crate.contains as any[]).filter(s => s.rarity === targetRarity);
    }
    if (pool.length === 0) {
        pool = crate.contains as any[];
    }

    const wonItem = pool[Math.floor(Math.random() * pool.length)];
    const wear = Math.random() * (wonItem.maxFloat - wonItem.minFloat) + wonItem.minFloat;

    // 結果存入 Inventory 
    if (wonItem && wonItem._id) {

        const KEY_PRICE = 75; 
        const totalCost = (crate.price || 2.49) + KEY_PRICE;
        await Inventory.create({
            userId: targetUserId,
            skin: wonItem._id,
            cost: totalCost
        });
        console.log(`[Server] Saved ${wonItem.name} for user: ${targetUserId} (Cost: ${totalCost})`);
    }

    // 隨機輪盤卡片
    const spinItems = [];
    const allItems = crate.contains as any[];
    for (let i = 0; i < 60; i++) {
        const randomSkin = allItems[Math.floor(Math.random() * allItems.length)];
        if (randomSkin.rarity === 'gold') { i--; continue; }
        spinItems.push(randomSkin);
    }

    res.json({
      wonItem: { ...wonItem.toObject(), wear, prices: wonItem.prices },
      spinItems
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 取得庫存 API
app.get('/api/inventory', async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
             res.status(400).json({ error: 'Missing userId' });
             return;
        }

        const items = await Inventory.find({ userId })
            .populate('skin')
            .sort({ acquiredAt: -1 });

        // 整理格式回傳給前端
        const formatted = items.map((item: any) => {
            if (!item.skin) return null;
            return {
                inventoryId: item._id,
                ...item.skin._doc, // 展開 Skin 資料
                acquiredAt: item.acquiredAt,
                cost: item.cost
            };
        }).filter(i => i !== null);

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// 清空庫存 API
app.delete('/api/inventory', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
             res.status(400).json({ error: 'Missing userId' });
             return;
        }
        
        await Inventory.deleteMany({ userId });
        res.json({ success: true, message: 'Inventory cleared' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to clear inventory' });
    }
});

const PORT = process.env.PORT || 5000;

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});