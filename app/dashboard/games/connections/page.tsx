"use client";

import { useState, useEffect, useRef } from "react";
import { Trophy, Share2, AlertCircle, Loader2 } from "lucide-react";
import { getConnectionsPuzzle, submitConnectionsResult } from "@/app/actions/connections";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

type CategoryDifficulty = 1 | 2 | 3 | 4;

interface Category {
  id: string;
  title: string;
  items: string[];
  difficulty: CategoryDifficulty;
}

interface TileItem {
  id: string;
  text: string;
  categoryId: string;
  difficulty: CategoryDifficulty;
}

const DIFFICULTY_COLORS = {
  1: "bg-[#f9df6d] text-black", // Yellow
  2: "bg-[#a0c35a] text-black", // Green
  3: "bg-[#b0c4ef] text-black", // Blue
  4: "bg-[#ba81c5] text-white"  // Purple
};

const EMOJI_COLORS = {
  1: "🟨",
  2: "🟩",
  3: "🟦",
  4: "🟪"
};

const springConfig = { type: "spring" as const, stiffness: 300, damping: 25 };
const bounceConfig = { type: "spring" as const, stiffness: 400, damping: 15 };

function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export default function ConnectionsGame() {
  const [puzzleType, setPuzzleType] = useState<"season_26" | "all_time">("season_26");
  const [loading, setLoading] = useState(true);
  const [puzzleData, setPuzzleData] = useState<any>(null);
  const [tiles, setTiles] = useState<TileItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [solvedCategoryIds, setSolvedCategoryIds] = useState<string[]>([]);
  const [lives, setLives] = useState(4);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [animatingSubmit, setAnimatingSubmit] = useState(false);
  
  // Timer & History
  const [timeTaken, setTimeTaken] = useState(0);
  const [history, setHistory] = useState<string[][]>([]);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadPuzzle();
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [puzzleType]);

  useEffect(() => {
    if (!loading && !gameOver && puzzleData && !animatingSubmit) {
      timerInterval.current = setInterval(() => {
        setTimeTaken(prev => prev + 1);
      }, 1000);
    } else {
      if (timerInterval.current) clearInterval(timerInterval.current);
    }
  }, [loading, gameOver, puzzleData, animatingSubmit]);

  const loadPuzzle = async () => {
    setLoading(true);
    setPuzzleData(null);
    setTiles([]);
    
    const { data, error } = await getConnectionsPuzzle(puzzleType);
    
    if (!data) {
      setLoading(false);
      return;
    }

    const categories = data.categories as Category[];
    setPuzzleData({ id: data.id, categories });
    
    const initialTiles: TileItem[] = [];
    categories.forEach(cat => {
      cat.items.forEach(itemText => {
        initialTiles.push({
          id: `${cat.id}-${itemText}`,
          text: itemText,
          categoryId: cat.id,
          difficulty: cat.difficulty
        });
      });
    });
    setTiles(shuffleArray(initialTiles));
    setSelectedIds([]);
    setSolvedCategoryIds([]);
    setLives(4);
    setGameOver(false);
    setWon(false);
    setToastMessage(null);
    setTimeTaken(0);
    setHistory([]);
    setAnimatingSubmit(false);
    setLoading(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleTileClick = (tileId: string) => {
    if (gameOver || animatingSubmit) return;
    
    const tile = tiles.find(t => t.id === tileId);
    if (tile && solvedCategoryIds.includes(tile.categoryId)) return;

    if (selectedIds.includes(tileId)) {
      setSelectedIds(prev => prev.filter(id => id !== tileId));
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds(prev => [...prev, tileId]);
      }
    }
  };

  const handleShuffle = () => {
    if (gameOver || animatingSubmit) return;
    const unsolved = tiles.filter(t => !solvedCategoryIds.includes(t.categoryId));
    const solved = tiles.filter(t => solvedCategoryIds.includes(t.categoryId));
    setTiles([...solved, ...shuffleArray(unsolved)]);
  };

  const handleDeselect = () => {
    if (animatingSubmit) return;
    setSelectedIds([]);
  };

  const handleSubmit = async () => {
    if (selectedIds.length !== 4 || gameOver || animatingSubmit) return;

    const selectedTiles = selectedIds.map(id => tiles.find(t => t.id === id)!);
    const guessItems = selectedTiles.map(t => t.text);
    
    const isDuplicate = history.some(h => 
      h.length === guessItems.length && h.every(item => guessItems.includes(item))
    );

    if (isDuplicate) {
      showToast("Already guessed!");
      return;
    }

    setAnimatingSubmit(true);
    setHistory(prev => [...prev, guessItems]);

    const categoryCounts: Record<string, number> = {};
    selectedTiles.forEach(t => {
      categoryCounts[t.categoryId] = (categoryCounts[t.categoryId] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(categoryCounts));
    const dominantCategory = Object.keys(categoryCounts).find(k => categoryCounts[k] === maxCount);

    if (maxCount === 4) {
      // Correct guess!
      const catId = dominantCategory!;
      
      // Move selected tiles to the top
      setTiles(prev => {
        const newlySolved = prev.filter(t => selectedIds.includes(t.id));
        const others = prev.filter(t => !selectedIds.includes(t.id));
        return [...newlySolved, ...others];
      });
      
      // Wait for layout animation to finish
      setTimeout(async () => {
        if (solvedCategoryIds.length + 1 === 4) {
          // Victory Wave!
          setIsJumping(true);
          setTimeout(async () => {
            setIsJumping(false);
            setSolvedCategoryIds(prev => [...prev, catId]);
            setSelectedIds([]);
            setWon(true);
            setTimeout(async () => {
              setGameOver(true);
              setAnimatingSubmit(false);
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
              await submitConnectionsResult(puzzleData.id, 4 - lives, true, timeTaken, [...history, guessItems]);
            }, 600);
          }, 1200);
        } else {
          setSolvedCategoryIds(prev => [...prev, catId]);
          setSelectedIds([]);
          setAnimatingSubmit(false);
        }
      }, 500);

    } else {
      // Incorrect guess
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      if (maxCount === 3) showToast("One away...");
      
      const newLives = lives - 1;
      setLives(newLives);
      
      if (newLives === 0) {
        // Sequential reveal on loss
        setTimeout(async () => {
          setSelectedIds([]);
          const cats = puzzleData.categories as Category[];
          const remainingCats = cats.filter(c => !solvedCategoryIds.includes(c.id));
          
          for (const c of remainingCats) {
            setTiles(prev => {
              const newlySolved = prev.filter(t => t.categoryId === c.id);
              const others = prev.filter(t => t.categoryId !== c.id);
              return [...newlySolved, ...others];
            });
            await new Promise(r => setTimeout(r, 600)); 
            setSolvedCategoryIds(prev => [...prev, c.id]);
            await new Promise(r => setTimeout(r, 400));
          }
          
          setGameOver(true);
          setAnimatingSubmit(false);
          await submitConnectionsResult(puzzleData.id, 4, false, timeTaken, [...history, guessItems]);
        }, 800);
      } else {
        setTimeout(() => setAnimatingSubmit(false), 500);
      }
    }
  };

  const handleShare = () => {
    let shareText = `IPL Connections\n${puzzleType === "season_26" ? "Season 26" : "All-Time"}\n`;
    
    history.forEach(guess => {
      let row = "";
      guess.forEach(item => {
        let diff = 1;
        (puzzleData.categories as Category[]).forEach((c: Category) => {
          if (c.items.includes(item)) diff = c.difficulty;
        });
        row += EMOJI_COLORS[diff as CategoryDifficulty];
      });
      shareText += row + "\n";
    });
    
    navigator.clipboard.writeText(shareText);
    showToast("Copied to clipboard!");
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh] bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const unsolvedTiles = tiles.filter(t => !solvedCategoryIds.includes(t.categoryId));
  
  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] lg:h-screen overflow-hidden bg-background text-foreground font-sans selection:bg-transparent">
      
      {/* Header */}
      <header className="w-full flex flex-col items-center py-2 sm:py-4 border-b border-border/50 bg-background/95 backdrop-blur shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 font-heading">Connections</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-md">
            <button 
              onClick={() => setPuzzleType("season_26")}
              className={`px-4 py-1.5 text-sm font-semibold rounded-sm transition-colors ${puzzleType === "season_26" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Season 26
            </button>
            <button 
              onClick={() => setPuzzleType("all_time")}
              className={`px-4 py-1.5 text-sm font-semibold rounded-sm transition-colors ${puzzleType === "all_time" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              All-Time
            </button>
          </div>
        </div>
      </header>

      {!puzzleData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Puzzle Not Available</h2>
          <p className="text-muted-foreground">Come back tomorrow for a new puzzle!</p>
        </div>
      ) : (
        <main className="flex-1 flex flex-col items-center w-full max-w-2xl mx-auto px-4 py-2 overflow-hidden">
          
          <p className="text-sm font-medium text-foreground mb-2 sm:mb-4">Create four groups of four!</p>

          <div className="w-full relative flex-1 flex flex-col justify-center min-h-0">
            {/* Framer Motion Toast Container */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div 
                  initial={{ y: 20, opacity: 0, scale: 0.9 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -20, opacity: 0, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute -top-12 left-0 right-0 mx-auto w-max px-5 py-2.5 bg-foreground text-background rounded-full font-bold text-sm shadow-xl z-50 pointer-events-none"
                >
                  {toastMessage}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div layout className="flex flex-col gap-2 w-full">
              <AnimatePresence mode="popLayout">
                {/* Solved Categories */}
                {solvedCategoryIds.map(catId => {
                  const cat = (puzzleData.categories as Category[]).find(c => c.id === catId)!;
                  return (
                    <motion.div 
                      layout
                      initial={{ scale: 0.9, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={springConfig}
                      key={cat.id} 
                      className={`w-full p-4 sm:p-5 rounded-[6px] flex flex-col items-center justify-center text-center ${DIFFICULTY_COLORS[cat.difficulty]}`}
                    >
                      <span className="font-bold uppercase tracking-[0.2em] text-[13px] sm:text-[15px] mb-1">{cat.title}</span>
                      <span className="font-medium text-[12px] sm:text-[13px]">{cat.items.join(", ")}</span>
                    </motion.div>
                  );
                })}

                {/* Unsolved Grid */}
                {unsolvedTiles.length > 0 && (
                  <motion.div layout className="grid grid-cols-4 gap-2">
                    <AnimatePresence mode="popLayout">
                      {unsolvedTiles.map(tile => {
                        const isSelected = selectedIds.includes(tile.id);
                        const selectedIndex = selectedIds.indexOf(tile.id);
                        return (
                          <motion.button
                            layout
                            layoutId={tile.id}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ 
                              scale: isSelected && !isJumping ? 0.95 : 1, 
                              opacity: 1,
                              y: isJumping && isSelected ? [0, -20, 0] : (isShaking && isSelected ? [0, -5, 5, -5, 5, 0] : 0)
                            }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ 
                              scale: bounceConfig,
                              layout: springConfig,
                              y: isJumping 
                                ? { duration: 0.5, delay: selectedIndex * 0.1, times: [0, 0.5, 1], ease: "easeInOut" } 
                                : (isShaking ? { duration: 0.4 } : {})
                            }}
                            key={tile.id}
                            onClick={() => handleTileClick(tile.id)}
                            className={`
                              aspect-[4/3] sm:aspect-[2.5/1] rounded-[6px] flex items-center justify-center text-center p-1 sm:p-2
                              font-bold uppercase text-[10px] sm:text-xs select-none break-words leading-tight shadow-sm transition-all duration-200
                              ${isSelected 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-card text-foreground border border-border hover:bg-muted'}
                            `}
                          >
                            {tile.text}
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="flex flex-col items-center w-full mt-auto pt-4 gap-3 sm:gap-4 shrink-0 pb-4 sm:pb-8">
            {!gameOver && (
              <div className="flex items-center gap-3 h-6">
                <span className="text-sm font-semibold text-foreground">Mistakes remaining:</span>
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="relative h-4 w-4 flex items-center justify-center">
                      {/* Empty background circle */}
                      <div className="absolute inset-0 rounded-full bg-transparent border-2 border-muted" />
                      {/* Filled circle that pops away */}
                      <motion.div 
                        initial={false}
                        animate={{ scale: i < lives ? 1 : 0, opacity: i < lives ? 1 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="absolute inset-0 rounded-full bg-[#5a594e] dark:bg-[#efefe6]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Status Bar */}
            <div className="w-full">
              {!gameOver ? (
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full max-w-[90%] mx-auto bg-background/90 backdrop-blur py-2 px-2 rounded-full">
                  <div className="flex items-center justify-center font-mono font-bold text-lg bg-muted px-4 py-3 rounded-full mr-1">
                    {formatTime(timeTaken)}
                  </div>
                  <button 
                    onClick={handleShuffle} 
                    className="px-5 py-3 sm:px-6 rounded-full border border-foreground/20 font-semibold text-sm hover:bg-muted transition-colors"
                  >
                    Shuffle
                  </button>
                  <button 
                    onClick={handleDeselect} 
                    disabled={selectedIds.length === 0} 
                    className="px-5 py-3 sm:px-6 rounded-full border border-foreground/20 font-semibold text-sm hover:bg-muted transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    Deselect All
                  </button>
                  <motion.button 
                    animate={{ 
                      scale: selectedIds.length === 4 ? 1.05 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    onClick={handleSubmit} 
                    disabled={selectedIds.length !== 4 || animatingSubmit} 
                    className="px-6 py-3 sm:px-8 rounded-full font-semibold text-sm transition-colors disabled:opacity-30 disabled:bg-muted disabled:text-muted-foreground disabled:border-transparent bg-foreground text-background hover:bg-foreground/90 border-foreground border"
                  >
                    Submit
                  </motion.button>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center gap-6 w-full mt-4 bg-card border border-border p-8 rounded-2xl shadow-xl"
                >
                  
                  {won ? (
                    <h2 className="text-3xl font-bold tracking-tight">Perfect!</h2>
                  ) : (
                    <h2 className="text-3xl font-bold tracking-tight">Next Time!</h2>
                  )}
                  
                  <div className="flex gap-6 text-sm font-semibold">
                    <div className="flex flex-col items-center">
                      <span className="text-muted-foreground">Time</span>
                      <span className="text-lg">{formatTime(timeTaken)}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-muted-foreground">Mistakes</span>
                      <span className="text-lg">{4 - lives}</span>
                    </div>
                  </div>

                  {/* Visual History */}
                  <div className="flex flex-col gap-1 items-center w-full max-w-sm mt-2">
                    {history.map((guess, idx) => (
                      <div key={idx} className="flex gap-1">
                        {guess.map((item, i) => {
                          let diff = 1;
                          (puzzleData.categories as Category[]).forEach((c: Category) => {
                            if (c.items.includes(item)) diff = c.difficulty;
                          });
                          
                          const colorBlock = diff === 1 ? 'bg-[#f9df6d]' : 
                                            diff === 2 ? 'bg-[#a0c35a]' : 
                                            diff === 3 ? 'bg-[#b0c4ef]' : 'bg-[#ba81c5]';
                          return <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.1 + i * 0.05 }}
                            key={i} 
                            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-sm ${colorBlock}`} 
                            title={item} 
                          />
                        })}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
                    <button 
                      onClick={handleShare}
                      className="px-8 py-3 rounded-full bg-foreground text-background font-bold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm"
                    >
                      Share <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <p className="text-muted-foreground font-medium mt-2">Play again tomorrow!</p>
                </motion.div>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
