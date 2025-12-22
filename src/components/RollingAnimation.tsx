import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { type Skin } from "../types";

interface Props {
  items: Skin[];
  winnerIndex: number;
  isRolling: boolean;
  onFinish: () => void;
}

const RARITY_COLORS: Record<string, string> = {
    white: '#b0c3d9',
    lightblue: '#5e98d9',
    blue: '#4b69ff',
    purple: '#8847ff',
    pink: '#d32ce6',
    red: '#eb4b4b',
    gold: '#e4ae39',
};

const getRarityColor = (rarity: any) => {
    const name = (rarity?.id || rarity?.name || rarity || 'blue').toLowerCase();   
    
    if (name.includes('consumer')) return RARITY_COLORS.white;
    if (name.includes('industrial')) return RARITY_COLORS.lightblue;
    if (name.includes('mil-spec')) return RARITY_COLORS.blue;
    if (name.includes('restricted')) return RARITY_COLORS.purple;
    if (name.includes('classified')) return RARITY_COLORS.pink;
    if (name.includes('covert')) return RARITY_COLORS.red;
    if (name.includes('gold') || name.includes('contraband')) return RARITY_COLORS.gold;
    
    return RARITY_COLORS[name] || RARITY_COLORS.blue;
};

export default function RollingAnimation({ items, winnerIndex, isRolling, onFinish }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgTrackRef = useRef<HTMLDivElement>(null);
  const lensTrackRef = useRef<HTMLDivElement>(null);
  const rollSoundRef = useRef<HTMLAudioElement | null>(null);

  /* 計算輪盤動畫 */
  useLayoutEffect(() => {
    rollSoundRef.current = new Audio("/sounds/Roll.mp3");
    rollSoundRef.current.volume = 0.4;

    if (!isRolling || !bgTrackRef.current || !lensTrackRef.current || !containerRef.current) return;

    const CARD_WIDTH = 320; 
    const GAP = 12;          
    const TOTAL_ITEM_WIDTH = CARD_WIDTH + GAP;

    const distanceToWinner = (winnerIndex * TOTAL_ITEM_WIDTH) + (CARD_WIDTH / 2);
    const randomOffset = (Math.random() - 0.5) * (CARD_WIDTH * 0.6);
    
    // 計算位移量
    const targetX = -(distanceToWinner + randomOffset);

    let lastPlayedIndex = -1;

    const ctx = gsap.context(() => {
      gsap.set([bgTrackRef.current, lensTrackRef.current], { x: 0 });
      gsap.to([bgTrackRef.current, lensTrackRef.current], {
        x: targetX,
        duration: 6,         
        ease: "power2.out",
        
        onUpdate: function () {
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


  /* 輪盤卡片 */
  const WeaponCard = ({ skin, isLens = false }: { skin: Skin, isLens?: boolean }) => {
    // 取得顏色
    const color = getRarityColor(skin.rarity);
    const imgSrc = skin.image;

    return (
        <div className={`
            flex-shrink-0 
            w-[320px] h-[230px]
            bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] 
            border-b-[4px]
            relative shadow-lg overflow-hidden
            ${isLens ? 'brightness-110' : ''}
        `}
        style={{ borderColor: color }}
        >
            <div className="absolute inset-0 opacity-20" style={{ backgroundColor: color }} />
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                <img 
                    src={imgSrc} 
                    alt={skin.name}
                    className="w-[100%] h-[100%] object-contain drop-shadow-md transform scale-105" 
                />
            </div>
        </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full h-[45rem] flex items-center justify-center overflow-hidden">
      
      {/* Layer 1: 背景軌道 */}
      <div className="absolute inset-0 flex items-center opacity-40 blur-[3px] pointer-events-none">
        <div ref={bgTrackRef} className="flex h-full items-center gap-[12px] pl-[50%] will-change-transform">
            {items.map((skin, index) => (
                <WeaponCard key={`bg-${skin.id}-${index}`} skin={skin} />
            ))}
        </div>
      </div>

      {/* Layer 2: 放大鏡效果 */}
      <div className="
          absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
          w-[36rem] h-[36rem] rounded-full overflow-hidden
          border-4 border-yellow-500/60 shadow-[0_0_80px_rgba(234,179,8,0.5)]
          bg-black/20 backdrop-blur-0
      ">
        <div className="absolute inset-0 flex items-center scale-125 origin-center">
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
      
      {/* 上下箭頭 */}
      <div className="absolute top-[calc(50%-19rem)] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-yellow-400 z-50"></div>
      <div className="absolute bottom-[calc(50%-19rem)] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[16px] border-b-yellow-400 z-50"></div>

    </div>
  );
}