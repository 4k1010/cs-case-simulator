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
    const { crateId, userId } = req.body; 
    const targetUserId = userId || "TEST_USER"; 

    let crate = await Crate.findOne({ _id: crateId }).populate('contains');
    if (!crate) crate = await Crate.findOne({ name: crateId }).populate('contains');
    
    if (!crate) {
        res.status(404).json({ error: 'Crate not found' });
        return;
    }

    /* --- 出金99%測試start  --- */
    // const isGoldTest = Math.random() < 0.99; 
    // const targetRarity = isGoldTest ? 'gold' : 'blue';

    // let pool = (crate.contains as any[]).filter(s => s.rarity === targetRarity);

    // if (pool.length === 0) {
    //     if (targetRarity === 'gold') {
    //          if (crate.specialItems && crate.specialItems.length > 0) {
    //              await crate.populate('specialItems');
    //              pool = crate.specialItems as any[];
    //          } else {
    //              pool = (crate.contains as any[]).filter(s => s.rarity === 'red');
    //          }
    //     }
    //     if (pool.length === 0) pool = crate.contains as any[];
    // }
    /* --- 出金99%測試end  --- */

    /* --- 全部機率20%start --- */
    const roll = Math.random();
    let targetRarity = 'blue'; // 預設藍色

    if (roll > 0.8) {
        targetRarity = 'gold';
    } else if (roll > 0.6) {
        targetRarity = 'red';
    } else if (roll > 0.4) {
        targetRarity = 'pink';
    } else if (roll > 0.2) {
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
    /* --- 全部機率20%end --- */

    /* --- 正常機率抽取start --- */
    // const roll = Math.random();
    // let targetRarity = 'blue'; // 預設藍色

    // if (roll > 0.9974) {
    //     targetRarity = 'gold';
    // } else if (roll > 0.9910) {
    //     targetRarity = 'red';
    // } else if (roll > 0.9590) {
    //     targetRarity = 'pink';
    // } else if (roll > 0.7992) {
    //     targetRarity = 'purple';
    // } else {
    //     targetRarity = 'blue';
    // }

    // let pool: any[] = [];

    // // if gold
    // if (targetRarity === 'gold') {
    //     if (crate.specialItems && crate.specialItems.length > 0) {
    //         await crate.populate('specialItems');
    //         pool = crate.specialItems as any[];
    //     } else {
    //         // if no gold then red
    //         targetRarity = 'red';
    //     }
    // }
    // if (pool.length === 0) {
    //     pool = (crate.contains as any[]).filter(s => s.rarity === targetRarity);
    // }
    // if (pool.length === 0) {
    //     pool = crate.contains as any[];
    // }
    /* --- 正常機率抽取end --- */

    const wonItem = pool[Math.floor(Math.random() * pool.length)];
    const wear = Math.random() * (wonItem.maxFloat - wonItem.minFloat) + wonItem.minFloat;

    // 結果存入 Inventory 
    if (wonItem && wonItem._id) {

        const cratePrice = crate.price || 2.49;
        await Inventory.create({
            userId: targetUserId,
            skin: wonItem._id,
            cost: cratePrice
        });
        console.log(`[Server] Saved ${wonItem.name} for user: ${targetUserId} (Cost: ${cratePrice})`);
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