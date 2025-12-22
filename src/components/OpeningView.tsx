import { useState, useRef, useEffect } from "react";
import { type Crate, type Skin } from "../types";
import RollingAnimation from "./RollingAnimation";

interface Props {
  crate: Crate;
  user: any;
  onBack: () => void;
}

// 金色問號
const MYSTERY_ITEM: Skin = {
    id: "mystery",
    name: "★ Rare Special Item",
    rarity: "gold", 
    price: 0,
    minFloat: 0,
    maxFloat: 0,
    imageUrl: "https://pbs.twimg.com/media/GL_87gsXQAA6NRs.png", 
    isSpecial: true,
    weapon: "Special",
    skinName: "Item"
};

const RARITY_BG_COLORS: Record<string, string> = {
  white: 'bg-slate-300 shadow-slate-300/50',
  lightblue: 'bg-sky-400 shadow-sky-400/50',
  blue: 'bg-blue-600 shadow-blue-600/50',
  purple: 'bg-purple-600 shadow-purple-600/50',
  pink: 'bg-pink-500 shadow-pink-500/50',
  red: 'bg-red-600 shadow-red-600/50',
  gold: 'bg-yellow-400 shadow-yellow-400/50',
};

const RARITY_TEXT_COLORS: Record<string, string> = {
  white: 'text-slate-300',
  lightblue: 'text-sky-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  pink: 'text-pink-400',
  red: 'text-red-500',
  gold: 'text-yellow-400',
};

const getRarityBg = (rarity: string) => {
    return RARITY_BG_COLORS[rarity]?.split(' ')[0] || 'bg-gray-500';
};

const getConditionCode = (wear: number) => {
    if (wear < 0.07) return "FN";
    if (wear < 0.15) return "MW";
    if (wear < 0.38) return "FT";
    if (wear < 0.45) return "WW";
    return "BS";
};

const getWearLabel = (wear: number) => {
  if (wear < 0.07) return "Factory New";
  if (wear < 0.15) return "Minimal Wear";
  if (wear < 0.38) return "Field-Tested";
  if (wear < 0.45) return "Well-Worn";
  return "Battle-Scarred";
};

const fetchPrice = (wear: number, prices?: Record<string, number>) => {
    if (!prices) return 0;
    const code = getConditionCode(wear);
    return prices[code] || 0;
};

// 輪盤隨機填充邏輯
const getRandomFiller = (allSkins: Skin[]) => {
    const lowTierSkins = allSkins.filter(s => ['white', 'lightblue', 'blue'].includes(s.rarity));
    const midTierSkins = allSkins.filter(s => ['purple', 'pink'].includes(s.rarity));
    const highTierSkins = allSkins.filter(s => ['red'].includes(s.rarity));
    
    const fallbackSkins = allSkins;
    const pick = (pool: Skin[]) => pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : fallbackSkins[Math.floor(Math.random() * fallbackSkins.length)];

    const rand = Math.random();
    if (rand < 0.9) return pick(lowTierSkins);
    if (rand < 0.97) return pick(midTierSkins);
    return pick(highTierSkins);
};

type GameState = 'ready' | 'unlocking' | 'rolling' | 'won';

export default function OpeningView({ crate, user, onBack }: Props) {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [items, setItems] = useState<Skin[]>([]); 
  const [wonItem, setWonItem] = useState<Skin | null>(null);
  const [winnerIndex, setWinnerIndex] = useState(0);
  const [wonWear, setWonWear] = useState<number>(0);

  // 自動開箱控制
  const [isAutoOpen, setIsAutoOpen] = useState(false);      // Checkbox 狀態
  const [isAutoRunning, setIsAutoRunning] = useState(false); // 是否正在執行自動循環

  const unlockAudioRef = useRef<HTMLAudioElement | null>(null);
  const dropAudioRef = useRef<HTMLAudioElement | null>(null);
  const inspectAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (unlockAudioRef.current) {
        unlockAudioRef.current.pause();
        unlockAudioRef.current.currentTime = 0;
      }
      if (inspectAudioRef.current) {
        inspectAudioRef.current.pause();
      }
    };
  }, []);

  // 中獎畫面等2.5秒reset
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'won' && isAutoRunning) {
        timer = setTimeout(() => {
            resetGame();
        }, 2500); // 2.5sec delay
    }
    return () => clearTimeout(timer);
  }, [gameState, isAutoRunning]);

  // 開箱循環
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'ready' && isAutoRunning) {
        timer = setTimeout(() => {
            startUnlockSequence();
        }, 500); 
    }
    return () => clearTimeout(timer);
  }, [gameState, isAutoRunning]);


  const stopAutoOpen = () => {
    setIsAutoRunning(false);
    setIsAutoOpen(false);
  };

  const startUnlockSequence = async () => {
    if (gameState !== 'ready') return;

    if (isAutoOpen) {
        setIsAutoRunning(true);
    }

    unlockAudioRef.current = new Audio("/sounds/case_unlock_01.mp3");
    unlockAudioRef.current.volume = 0.6;
    unlockAudioRef.current.play().catch(e => console.log("Audio play failed", e));
    
    setGameState('unlocking');

    try {
        const minAnimationTime = new Promise(resolve => setTimeout(resolve, 2650));
        
        const userId = user?.name || "TEST_USER";
        const apiCall = fetch('/api/open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                crateId: crate.id,
                userId: userId
            })
        }).then(res => res.json());

        const [_, data] = await Promise.all([minAnimationTime, apiCall]);

        if (data.error) throw new Error(data.error);

        const { wonItem: apiWonItem } = data;

        const finalWear = apiWonItem.wear || 0;
        const finalPrice = fetchPrice(finalWear, apiWonItem.prices);
        
        const finalWinner: Skin = {
            ...apiWonItem,
            price: finalPrice,
            wear: finalWear
        };

        setWonItem(finalWinner);
        setWonWear(finalWear);
        
        const winnerRarity = finalWinner.rarity;

        const generatedItems: Skin[] = [];
        const WINNER_POS = 50; 
        const TOTAL_ITEMS = WINNER_POS + 5; 

        for (let i = 0; i < TOTAL_ITEMS; i++) {
            if (i === WINNER_POS) {
                if (winnerRarity === 'gold' || finalWinner.isSpecial) {
                    generatedItems.push({ ...MYSTERY_ITEM, _uniqueId: `win-${i}` });
                } else {
                    generatedItems.push({ ...finalWinner, _uniqueId: `win-${i}` });
                }
            } else {
                const filler = getRandomFiller(crate.contains || []);
                generatedItems.push({ ...filler, _uniqueId: `fill-${i}-${filler.id}` });
            }
        }

        setItems(generatedItems);
        setWinnerIndex(WINNER_POS);
        setGameState('rolling');

    } catch (error) {
        console.error("Open Crate Error:", error);
        alert("Failed to open crate.");
        setGameState('ready');
        setIsAutoRunning(false); 
    }
  };


  // win sound control
  const handleRollFinish = () => {
    if (wonItem) {
        let soundFile = "/sounds/drop2.mp3"; 
        
        if (wonItem.isSpecial || wonItem.rarity === 'gold') {
             soundFile = "/sounds/drop6.mp3"; 
        } else {
            switch (wonItem.rarity) {
                case 'purple': soundFile = "/sounds/drop3.mp3"; break;
                case 'pink':   soundFile = "/sounds/drop4.mp3"; break;
                case 'red':    soundFile = "/sounds/drop5.mp3"; break;
            }
        }
        dropAudioRef.current = new Audio(soundFile);
        dropAudioRef.current.volume = 0.3;
        dropAudioRef.current.play().catch(e => console.log("Drop audio failed", e));

        inspectAudioRef.current = new Audio("/sounds/inspect_weapon_01.mp3");
        inspectAudioRef.current.volume = 0.4;
        inspectAudioRef.current.play().catch(e => console.log("Inspect audio failed", e));
    }
    setGameState('won');
  };

  const resetGame = () => {
    setGameState('ready');
    setWonItem(null);
    setItems([]);
    setWonWear(0);
  };
  
  const wonItemRarity = wonItem ? wonItem.rarity : 'blue';

  return (
    <div className="fixed top-16 bottom-0 left-0 right-0 z-40 flex flex-col items-center justify-center w-full overflow-hidden font-sans bg-black">
      
      {/* 1. background */}
      <div className="absolute inset-0 z-0 bg-black">
        <img 
          src="..\public\photo\dust2.webp"
          alt="Map Background" 
          className={`
                w-full h-full object-cover
                transition-all ease-in
                ${(gameState === 'unlocking' || gameState === 'rolling')
                    ? 'duration-[3000ms] blur-lg opacity-40 scale-105'
                    : gameState === 'won'
                        ? 'duration-100 blur-0 opacity-60 scale-100'
                        : 'duration-100 blur-0 opacity-90 scale-100'
                }
            `}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />
      </div>

      {/* 2. 導覽列 */}
      <div className={`absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-6 transition-opacity duration-500 ${gameState === 'unlocking' ? 'opacity-0' : 'opacity-100'}`}>
        <button onClick={onBack} disabled={gameState !== 'ready' && gameState !== 'won'} className="text-slate-300 hover:text-white flex items-center gap-2 transition px-4 py-2 rounded bg-black/40 hover:bg-black/60 backdrop-blur disabled:opacity-0">← Back</button>
        <h2 className="text-3xl font-bold text-yellow-500 tracking-widest uppercase drop-shadow-lg italic">{crate.name}</h2>
        <div className="w-24"></div> 
      </div>

      {/* 3. case preview */}
      {gameState !== 'won' && (
        <div className={`
            absolute z-10 flex flex-col items-center justify-center
            transition-all ease-in
            ${gameState === 'ready' 
                ? 'duration-0 opacity-100 scale-100 blur-0' 
                : 'duration-[500ms] opacity-0 scale-110 blur-lg pointer-events-none'}
        `}>
            <div className="relative group mb-8">
                <div className={`absolute inset-0 bg-yellow-500/10 blur-3xl rounded-full transition-opacity duration-700 ${gameState === 'ready' ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'}`}></div>
                <img src={crate.imageUrl} alt="Case" className="w-100 h-64 object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.6)]" />
            </div>
            
            <div className="w-full max-w-[95vw] px-4">
                <p className="text-slate-300 text-sm font-bold tracking-widest uppercase mb-4 text-left border-b border-slate-600/50 pb-2">Contains one of the following:</p>
                <div className="flex flex-wrap justify-center gap-2 max-h-[40vh] overflow-y-auto p-4 custom-scrollbar">
                    
                    {Array.isArray(crate.contains) && crate.contains.map((skin: Skin) => {
                        const isGold = skin.rarity === 'gold';
                        const imgSrc = skin.imageUrl; 
                        const displayName = skin.skinName || skin.name.split(' | ')[1] || skin.name;
                        const weaponName = skin.weapon || skin.name.split(' | ')[0];

                        return (
                          <div key={skin._uniqueId || skin.id} className="flex flex-col w-40 shadow-lg group cursor-default transition-transform duration-200 hover:scale-[1.02]">
                              <div className={`w-full aspect-[4/3] ${isGold ? 'bg-[#b78700]' : 'bg-[#6a6a6a]'} flex items-center justify-center relative overflow-hidden`}>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                                  <img src={imgSrc} alt={skin.name} className="w-full h-full object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-105" />
                              </div>
                              <div className={`w-full h-[4px] ${getRarityBg(skin.rarity)}`}></div>
                              <div className="w-full bg-transparent px-1 py-2 flex flex-col justify-center min-h-[45px]">
                                  <div className="text-sm text-white font-extrabold truncate leading-tight">{weaponName}</div>
                                  <div className="text-[10px] text-white-400 uppercase tracking-wider leading-tight">{displayName}</div>
                              </div>
                          </div>
                        );
                    })}
                    
                    <div className="flex flex-col w-40 shadow-lg group cursor-default transition-transform duration-200 hover:scale-[1.02]">
                        <div className="w-full aspect-[4/3] bg-[#b78700] flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                            <img src={MYSTERY_ITEM.imageUrl} alt="Rare Special Item" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,215,0,0.6)] opacity-90 transition-transform duration-300 group-hover:scale-105" />
                        </div>   
                        <div className="w-full h-[4px] bg-yellow-400"></div>
                        <div className="w-full bg-transparent px-1 py-2 flex flex-col justify-center min-h-[45px]">
                            <div className="text-sm text-white font-extrabold truncate leading-tight text-center">★ Rare Special Item ★</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* 4. unbox button */}
      <div className={`absolute bottom-12 right-12 z-20 flex flex-col items-end gap-3 transition-all duration-500`}>
            
            <div className={`
                flex items-center gap-2 bg-black/60 px-4 py-2 rounded backdrop-blur-sm border border-slate-700 transition-all duration-300
                ${(gameState === 'ready' && !isAutoRunning) ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            `}>
                <input 
                    type="checkbox" 
                    id="autoOpen" 
                    checked={isAutoOpen} 
                    onChange={(e) => setIsAutoOpen(e.target.checked)}
                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500 border-gray-600 bg-gray-700 cursor-pointer"
                />
                <label htmlFor="autoOpen" className="text-white font-bold cursor-pointer select-none">
                    Auto Open
                </label>
            </div>

            {/* buttton status */}
            {isAutoRunning ? (
                // stop button
                <button 
                    onClick={stopAutoOpen} 
                    className="group relative bg-red-600 hover:bg-red-500 text-white text-xl font-bold py-6 px-12 rounded shadow-[0_10px_30px_rgba(255,0,0,0.3)] transition-all transform hover:scale-105 active:scale-95 border-b-4 border-red-800 hover:border-red-700 flex flex-col items-center min-w-[280px]"
                >
                    <span className="text-2xl tracking-wider">STOP AUTO</span>
                    <span className="text-sm font-normal text-red-100 opacity-90">Click to stop sequence</span>
                </button>
            ) : (
                // normal open button
                <button 
                    onClick={startUnlockSequence} 
                    disabled={gameState !== 'ready'} 
                    className={`
                        group relative bg-green-600 hover:bg-green-500 text-white text-xl font-bold py-6 px-12 rounded shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all transform hover:scale-105 active:scale-95 border-b-4 border-green-800 hover:border-green-700 flex flex-col items-end disabled:opacity-50 min-w-[280px]
                        ${gameState === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
                    `}
                >
                    <span className="text-2xl tracking-wider">{gameState === 'unlocking' ? 'UNLOCKING...' : 'UNLOCK CONTAINER'}</span>
                    <span className="text-sm font-normal text-green-100 opacity-90">${crate.price?.toFixed(2) || '2.49'}</span>
                </button>
            )}
      </div>

      {/* 5. 輪盤動畫 */}
      {gameState === 'rolling' && (
        <div className="relative z-20 w-full flex flex-col items-center justify-center animate-scale-in">
           <div className="mb-4 text-yellow-500 font-mono tracking-[0.3em] text-sm animate-pulse">OPENING CASE...</div>
           <RollingAnimation items={items} winnerIndex={winnerIndex} isRolling={true} onFinish={handleRollFinish} />
        </div>
      )}

      {/* 6. 開箱結果  */}
      {gameState === 'won' && wonItem && (
        <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-2xl animate-scale-in-bounce">
            
            <h1 className={`text-4xl md:text-5xl font-black mb-6 text-center drop-shadow-lg whitespace-nowrap ${RARITY_TEXT_COLORS[wonItemRarity] || 'text-white'}`}>
              {wonItem.name} {wonItem.phase && <span className="text-2xl opacity-80 block md:inline md:ml-2">({wonItem.phase})</span>}
            </h1>

            <div className={`h-1.5 w-full max-w-lg mb-20 rounded-full ${RARITY_BG_COLORS[wonItemRarity] || 'bg-gray-500'}`} />
            
            <div className="relative w-100 h-80 mx-auto mb-20">
                <div className={`absolute inset-0 bg-${wonItemRarity === 'gold' ? 'yellow' : wonItemRarity}-500/40 blur-[60px] rounded-full animate-pulse`}></div>
                <img src={wonItem.imageUrl} className="w-full h-full object-contain relative z-10 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform scale-110" />
            </div>

            <div className="w-full max-w-[500px] mb-8 animate-fade-in-up">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Wear Rating</span>
                    <div className="text-right">
                         <span className="text-white text-sm font-mono mr-2">{wonWear.toFixed(9)}</span>
                         <span className="text-slate-500 text-xs font-bold">{getWearLabel(wonWear)}</span>
                    </div>
                </div>
                
                <div className="relative h-4 w-full rounded-sm overflow-hidden bg-slate-900 flex border border-slate-700/50">
                    <div className="h-full bg-[#32cd32]" style={{ width: '7%' }} title="Factory New (0.00 - 0.07)"></div>
                    <div className="h-full bg-[#5dff5d]" style={{ width: '8%' }} title="Minimal Wear (0.07 - 0.15)"></div>
                    <div className="h-full bg-[#ffd700]" style={{ width: '23%' }} title="Field-Tested (0.15 - 0.38)"></div>
                    <div className="h-full bg-[#ff8c00]" style={{ width: '7%' }} title="Well-Worn (0.38 - 0.45)"></div>
                    <div className="h-full bg-[#ff4500]" style={{ width: '55%' }} title="Battle-Scarred (0.45 - 1.00)"></div>

                    <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)] z-10 transition-all duration-1000 ease-out"
                        style={{ left: `${wonWear * 100}%` }}
                    >
                         <div className="absolute -top-1.5 -left-[3px] w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-white"></div>
                         <div className="absolute -bottom-1.5 -left-[3px] w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-white"></div>
                    </div>
                </div>
            </div>
          
            <p className="text-xl text-slate-300 font-mono mb-10 bg-black/40 px-6 py-2 rounded backdrop-blur-sm border border-slate-700">
                Value: <span className="text-green-400 font-bold">${wonItem.price.toFixed(2)}</span>
            </p>
            
            {/* 1.正常模式顯示 */}
            {!isAutoRunning && (
                <div className="flex gap-4 justify-center">
                    <button onClick={resetGame} className="bg-blue-600 hover:bg-blue-500 text-white text-lg font-bold px-10 py-4 rounded shadow-lg transition transform hover:scale-105 hover:shadow-blue-500/25">
                        Try Again
                    </button>
                    <button onClick={onBack} className="bg-slate-700/80 hover:bg-slate-600 text-white text-lg font-medium px-10 py-4 rounded transition border border-slate-600 backdrop-blur">
                        Close
                    </button>
                </div>
            )}
            
            {/* 2.自動模式顯示 */}
            {isAutoRunning && (
                <div className="text-center">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-green-500 rounded-full mb-2" role="status"></div>
                    <p className="text-green-400 font-bold tracking-widest animate-pulse">AUTO OPENING IN PROGRESS...</p>
                </div>
            )}
        </div>
      )}

    </div>
  );
}