import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { type Skin } from "../types";

interface Props {
  items: Skin[];
  winnerIndex: number;
  isRolling: boolean;
  onFinish: () => void;
}

export default function RollingAnimation({ items, winnerIndex, isRolling, onFinish }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgTrackRef = useRef<HTMLDivElement>(null);
  const lensTrackRef = useRef<HTMLDivElement>(null);
  const rollSoundRef = useRef<HTMLAudioElement | null>(null);

  const rarityBorderColors: Record<string, string> = {
    blue: 'border-blue-500',
    purple: 'border-purple-500',
    pink: 'border-pink-500',
    red: 'border-red-500',
    gold: 'border-yellow-400',
  };

  const rarityBgColors: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    red: 'bg-red-500',
    gold: 'bg-yellow-400',
  };

  useLayoutEffect(() => {
    rollSoundRef.current = new Audio("/sounds/Roll.mp3");
    rollSoundRef.current.volume = 0.4;

    if (!isRolling || !bgTrackRef.current || !lensTrackRef.current || !containerRef.current) return;

    // ✅ 修改 1: 尺寸再加大 10% 以上
    // w-80 = 320px (原本 288)
    const CARD_WIDTH = 320; 
    const GAP = 12;          
    const TOTAL_ITEM_WIDTH = CARD_WIDTH + GAP;

    // ✅ 修改 2: 移除所有複雜的 Scale 計算
    // 讓內外兩個輪盤的 "物理移動距離" 完全一模一樣，這樣就能保證停在同一個物品上
    const distanceToWinner = (winnerIndex * TOTAL_ITEM_WIDTH) + (CARD_WIDTH / 2);
    const randomOffset = (Math.random() - 0.5) * (CARD_WIDTH * 0.6);
    
    // 這是目標位移量
    const targetX = -(distanceToWinner + randomOffset);

    let lastPlayedIndex = -1;

    const ctx = gsap.context(() => {
      // 強制歸零，防止狀態殘留
      gsap.set([bgTrackRef.current, lensTrackRef.current], { x: 0 });

      // ✅ 修改 3: 兩個軌道完全同步 (使用同一個 targetX)
      // GSAP 會處理平滑動畫，CSS 的 scale 會處理視覺上的放大效果
      gsap.to([bgTrackRef.current, lensTrackRef.current], {
        x: targetX,
        duration: 6,         
        ease: "power2.out",
        
        onUpdate: function () {
            // 隨便抓一個 track 來算聲音就好，因為現在它們是同步的
            const currentX = gsap.getProperty(bgTrackRef.current, "x") as number;
            const currentIndex = Math.floor(Math.abs(currentX) / TOTAL_ITEM_WIDTH);

            if (currentIndex > lastPlayedIndex) {
                if (rollSoundRef.current) {
                    const sound = rollSoundRef.current.cloneNode() as HTMLAudioElement;
                    sound.volume = 0.3; 
                    sound.play().catch(() => {}); 
                }
                lastPlayedIndex = currentIndex;
            }
        },
        onComplete: onFinish
      });
    }, containerRef);

    return () => ctx.revert();
  }, [isRolling, winnerIndex, onFinish]);

  const WeaponCard = ({ skin, isLens = false }: { skin: Skin, isLens?: boolean }) => (
    <div className={`
        flex-shrink-0 
        w-[320px] h-[230px]
        bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] 
        border-b-[4px] ${rarityBorderColors[skin.rarity] || 'border-gray-500'}
        relative shadow-lg overflow-hidden
        ${isLens ? 'brightness-110' : ''}
    `}>
        <div className={`absolute inset-0 opacity-20 ${rarityBgColors[skin.rarity] || 'bg-gray-500'}`} />
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
            <img 
                src={skin.imageUrl} 
                alt={skin.name}
                className="w-[100%] h-[100%] object-contain drop-shadow-md transform scale-105" 
            />
        </div>
        {/* <div className="absolute bottom-3 left-4 z-10 leading-tight">
            <div className="text-[12px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
            {skin.name.split(' | ')[0]}
            </div>
            <div className="text-lg text-gray-100 font-bold truncate max-w-[280px]">
            {skin.name.split(' | ')[1]}
            </div>
        </div> */}
    </div>
  );

  return (
    // ✅ 修改 5: 容器再拉高 h-[45rem] (720px) 容納大放大鏡
    <div ref={containerRef} className="relative w-full h-[45rem] flex items-center justify-center overflow-hidden">
      
      {/* Layer 1: 背景軌道 */}
      <div className="absolute inset-0 flex items-center opacity-40 blur-[3px] pointer-events-none">
        {/* ✅ 修改 6: 使用 pl-[50%] 
            這代表 "從螢幕正中間開始排"。
            因為背景是全螢幕寬，50% 就是螢幕中心。
        */}
        <div ref={bgTrackRef} className="flex h-full items-center gap-[12px] pl-[50%] will-change-transform">
            {items.map((skin, index) => (
                <WeaponCard key={`bg-${skin.id}-${index}`} skin={skin} />
            ))}
        </div>
      </div>

      {/* Layer 2: 放大鏡效果 */}
      <div className="
          absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
          /* ✅ 修改 7: 放大鏡加大到 w-[36rem] (576px) */
          w-[36rem] h-[36rem] rounded-full overflow-hidden
          border-4 border-yellow-500/60 shadow-[0_0_80px_rgba(234,179,8,0.5)]
          bg-black/20 backdrop-blur-0
      ">
        <div className="absolute inset-0 flex items-center scale-125 origin-center">
            {/* ✅ 修改 8: 同樣使用 pl-[50%]
                因為這個軌道被包在 w-[36rem] 的放大鏡盒子裡。
                pl-[50%] 代表從 "盒子的正中間" 開始排。
                
                結論：背景從螢幕中間開始，放大鏡從盒子中間開始（而盒子在螢幕中間）。
                兩個起點完美重疊！且移動距離一樣，保證永遠同步。
            */}
            <div ref={lensTrackRef} className="flex h-full items-center gap-[12px] pl-[50%] will-change-transform">
                {items.map((skin, index) => (
                    <WeaponCard key={`lens-${skin.id}-${index}`} skin={skin} isLens={true} />
                ))}
            </div>
        </div>
        
        {/* 光澤層 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-40 pointer-events-none rounded-full"></div>
        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] pointer-events-none rounded-full"></div>
      </div>

      {/* Layer 3: 中央指針 */}
      <div className="absolute top-[5%] bottom-[5%] left-1/2 -ml-[1px] w-[2px] bg-yellow-400 z-50 shadow-[0_0_15px_#fbbf24]"></div>
      
      {/* 上下箭頭位置再次往外推 */}
      <div className="absolute top-[calc(50%-19rem)] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-yellow-400 z-50"></div>
      <div className="absolute bottom-[calc(50%-19rem)] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[16px] border-b-yellow-400 z-50"></div>

    </div>
  );
}