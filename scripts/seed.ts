import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';

import Crate from '../src/models/Crate';
import Skin from '../src/models/Skin';

dotenv.config({ path: '.env.local' });

// API source URLs
const API_SKINS = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json';
const API_CRATES = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json';
const API_PRICES = 'https://prices.csgotrader.app/latest/prices_v6.json';

// 顏色映射
const RARITY_MAP: Record<string, string> = {
  '#b0c3d9': 'white',      // Consumer
  '#5e98d9': 'lightblue',  // Industrial
  '#4b69ff': 'blue',       // Mil-Spec
  '#8847ff': 'purple',     // Restricted
  '#d32ce6': 'pink',       // Classified
  '#eb4b4b': 'red',        // Covert
  '#e4ae39': 'gold',       // Contraband / Special
};

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing in .env.local');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('📦 MongoDB Connected');
};

const seed = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing old data...');
    // 這裡建議清空，因為 Schema 結構變了 (name 不再 unique)
    await Skin.deleteMany({});
    await Crate.deleteMany({});

    try {
        await Skin.collection.dropIndexes();
        console.log('🧹 Indexes dropped (to allow duplicate names for phases).');
    } catch (error) {
        console.log('⚠️ No indexes to drop or collection not found, skipping.');
    }
    console.log('📡 Fetching data from APIs...');
    const [skinsRes, cratesRes, pricesRes] = await Promise.all([
      axios.get(API_SKINS),
      axios.get(API_CRATES),
      axios.get(API_PRICES)
    ]);

    const rawSkins = skinsRes.data;
    const rawCrates = cratesRes.data;
    const rawPrices = pricesRes.data;

    console.log(`✅ Fetched ${rawSkins.length} skins and ${rawCrates.length} crates.`);
    console.log('🔄 Processing Skins...');

    // 用來對照 API ID -> MongoDB _id
    const skinMap = new Map();
    let savedSkinsCount = 0;

    // --- 1. 處理 Skins ---
    for (const item of rawSkins) {
      // 1. 過濾邏輯
      const hasWeaponObj = !!item.weapon; 
      const isKnife = item.id.includes('knife') || item.category?.name === 'Knives';
      const isGlove = item.id.includes('glove') || item.category?.name === 'Gloves';

      if (!hasWeaponObj && !isKnife && !isGlove) continue;

      // 2. 稀有度映射 (處理物件結構)
      // Mykel API 的 rarity 結構通常是 { id, name, color }
      const hexColor = item.rarity?.color;
      const rarityColor = RARITY_MAP[hexColor] || 'blue'; // 預設藍色防呆
      
      // 3. 價格匹配 (增強版，支援 Phase)
      const prices: any = {};
      const conditions = {
        FN: 'Factory New', MW: 'Minimal Wear', FT: 'Field-Tested',
        WW: 'Well-Worn', BS: 'Battle-Scarred'
      };

      for (const [code, fullName] of Object.entries(conditions)) {
        // 嘗試組合 1: 標準名稱 "Butterfly Knife | Gamma Doppler (Factory New)"
        let lookupKey = `${item.name} (${fullName})`;
        
        // 嘗試組合 2: 如果有 Phase，嘗試 "Butterfly Knife | Gamma Doppler Phase 1 (Factory New)"
        // 注意：有些價格網會把 Phase 寫在名稱後面
        if (item.phase && rawPrices[`${item.name} ${item.phase} (${fullName})`]) {
            lookupKey = `${item.name} ${item.phase} (${fullName})`;
        } else if (rawPrices[lookupKey]) {
            // 維持原樣
        } else {
            // 嘗試組合 3: 針對刀子移除 "★ "
            const cleanName = item.name.replace('★ ', '');
            if (rawPrices[`★ ${cleanName} (${fullName})`]) lookupKey = `★ ${cleanName} (${fullName})`;
            else if (rawPrices[`${cleanName} (${fullName})`]) lookupKey = `${cleanName} (${fullName})`;
        }

        if (rawPrices[lookupKey]) {
            prices[code] = Number(rawPrices[lookupKey]);
        }
      }

      const skinDoc = {
        id: item.id, // ★ 存入 API 的原始 ID
        name: item.name,
        weapon: item.weapon?.name || (isKnife ? 'Knife' : 'Glove'), 
        skinName: item.pattern?.name || 'Vanilla', 
        rarity: rarityColor,
        imageUrl: item.image,
        phase: item.phase || null, // ★ 存入 Phase
        minFloat: item.min_float || 0,
        maxFloat: item.max_float || 1,
        isSpecial: isKnife || isGlove || rarityColor === 'gold',
        prices: prices
      };

      // ★ 關鍵修改：使用 { id: item.id } 作為查詢條件
      // 這樣 "skin-phase1" 和 "skin-emerald" 即使 name 一樣，也會被視為不同資料
      const savedSkin = await Skin.findOneAndUpdate(
        { id: item.id }, 
        skinDoc,
        { upsert: true, new: true }
      );
      
      // 建立映射：API ID -> MongoDB _id
      skinMap.set(item.id, savedSkin._id);
      savedSkinsCount++;
    }

    console.log(`✅ Skins processed. Actually saved: ${savedSkinsCount} items (Phases are now separate!).`);
    console.log('🔄 Processing Crates...');

    // --- 2. 處理 Crates ---
    let cratesCount = 0;
    
    for (const box of rawCrates) {
        if (box.type !== 'Case' || !box.contains || box.contains.length === 0) continue;

        const containsIds = [];
        const specialIds = [];

        // 普通物品
        for (const content of box.contains) {
            // Mykel API 的 crate.contains 裡面是 { id: "skin-xxxx", ... }
            // 因為我們上面用 item.id 存了所有的 Skin (包含 Phase)，這裡直接找就能找到對應的 Phase
            const dbId = skinMap.get(content.id);
            if (dbId) {
                if (!containsIds.some(id => id.toString() === dbId.toString())) {
                    containsIds.push(dbId);
                }
            }
        }
        
        // 特殊物品 (Rare)
        if (box.contains_rare) {
             for (const special of box.contains_rare) {
                 const dbId = skinMap.get(special.id);
                 if (dbId) {
                     if (!specialIds.some(id => id.toString() === dbId.toString())) {
                        specialIds.push(dbId);
                     }
                 }
             }
        }

        if (containsIds.length === 0) continue;

        await Crate.create({
            name: box.name,
            price: 2.49,
            imageUrl: box.image,
            contains: containsIds,
            specialItems: specialIds
        });
        cratesCount++;
    }

    console.log(`🎉 Successfully seeded ${cratesCount} crates!`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding Failed:', error);
    process.exit(1);
  }
};

seed();