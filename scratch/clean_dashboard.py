with open("scratch/old_dashboard.tsx", "r") as f:
    old_code = f.read()

# Extract everything up to the `return (` statement.
# We know the old return starts at `  return (` and it's the last one in the file because it's the main render.

import re

# Split by `  return (`
parts = old_code.split('  return (')

# The part before `  return (` is our header and state logic.
header_and_logic = parts[0]

new_return = """  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-transparent">
      {/* Top Banner / Header */}
      <div className="w-full bg-[#124B7E] py-8 px-4 sm:px-6 lg:px-8 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero-arena.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#124B7E] to-transparent"></div>
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white outfit-bold tracking-tight">Dashboard Lounge</h1>
            <p className="text-sm text-blue-200 mt-1 font-medium">Select a game below or host a 1v1 Battle Arena match.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 flex flex-col items-center shadow-lg">
              <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Level</span>
              <span className="text-lg font-bold text-white">42</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 flex flex-col items-center shadow-lg">
              <span className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Win Rate</span>
              <span className="text-lg font-bold text-white">68%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Battle Arena Console */}
        <div className="w-full lg:w-[450px] shrink-0">
          <div className="bg-white dark:bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            <div className="bg-[#124B7E] text-white p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
               <div className="absolute right-[-20px] top-[-20px] opacity-10">
                 <Swords className="h-32 w-32" />
               </div>
               <div className="relative z-10">
                 <h2 className="text-lg font-extrabold flex items-center gap-2 outfit-bold">
                   <Swords className="h-5 w-5" />
                   1v1 Battle Arena
                 </h2>
                 <p className="text-[11px] text-blue-200 font-medium mt-0.5">Real-time multiplayer challenge</p>
               </div>
               <Link href="/dashboard/arena/history" className="relative z-10 text-[10px] font-bold bg-white/20 hover:bg-white/30 transition-colors px-2.5 py-1.5 rounded-lg border border-white/20">
                 History 📊
               </Link>
            </div>
            
            <div className="p-5 flex-1 bg-slate-50 dark:bg-background/50">
              <div className="flex bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 mb-5">
                <button
                  type="button"
                  onClick={() => setMultiplayerTab("host")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    multiplayerTab === "host"
                      ? "bg-white dark:bg-card text-[#124B7E] dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  Host Match
                </button>
                <button
                  type="button"
                  onClick={() => setMultiplayerTab("join")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                    multiplayerTab === "join"
                      ? "bg-white dark:bg-card text-[#124B7E] dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  }`}
                >
                  Join Match
                </button>
              </div>

              {/* Unfinished matches list */}
              {activeMatches.length > 0 && (
                <div className="mb-5 bg-amber-50/50 border border-amber-200/60 rounded-xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      <h4 className="text-[11px] font-extrabold text-amber-800 uppercase tracking-wider outfit-bold">Unfinished Matches</h4>
                    </div>
                    <span className="text-[9px] text-amber-600 font-extrabold bg-amber-100/50 border border-amber-250/30 px-2 py-0.5 rounded-full">{activeMatches.length} pending</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-[140px] overflow-y-auto pr-1">
                    {activeMatches.map((match) => {
                      const isHost = match.host_id === currentUserId;
                      const opponent = isHost
                        ? (match.guest?.username || "Guest (Waiting...)")
                        : (match.host?.username || "Host");
                      const formatLabel = gameFormatOptions.find(o => o.value === match.game_format)?.label || match.game_format;
                      return (
                        <div key={match.id} className="flex items-center justify-between bg-white border border-amber-100/80 rounded-lg p-2.5 shadow-sm gap-2">
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                              <span className="text-[#124B7E] font-extrabold truncate max-w-[100px]">vs {opponent}</span>
                              <span className="text-slate-400 font-mono text-[9px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">Code: {match.room_code}</span>
                            </div>
                            <div className="text-[9px] text-slate-500 font-semibold truncate mt-0.5">
                              {formatLabel} • Rd {match.match_history?.length || 0}/{match.max_rounds}
                            </div>
                          </div>
                          <Link
                            href={`/dashboard/arena/${match.room_code}`}
                            className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-[#124B7E] hover:bg-[#0f3a63] text-white text-[9px] font-bold rounded-md transition-all shadow-xs shrink-0 cursor-pointer"
                          >
                            <Play className="h-2.5 w-2.5 fill-current" />
                            Play
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                {battleStep === "configure" ? (
                  <motion.div
                    key="configure"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {multiplayerTab === "host" ? (
                      <div className="space-y-4">
                        <CustomSelect
                          label="Game Format"
                          options={gameFormatOptions}
                          value={gameFormat}
                          onChange={(val) => setGameFormat(val)}
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <CustomSelect
                            label="Turn Timer"
                            options={timeLimitOptions}
                            value={timeLimit}
                            onChange={(val) => setTimeLimit(val)}
                          />
                          <CustomSelect
                            label="Difficulty"
                            options={difficultyOptions}
                            value={difficulty}
                            onChange={(val) => setDifficulty(val)}
                          />
                        </div>
                        <CustomSelect
                          label="Max Rounds"
                          options={maxRoundsOptions}
                          value={maxRounds}
                          onChange={(val) => setMaxRounds(val)}
                        />
                        <button
                          type="button"
                          onClick={handleCreateRoom}
                          disabled={battleLoading}
                          className="w-full mt-4 py-3.5 bg-[#124B7E] hover:bg-[#0f3a63] text-white transition-all rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                          {battleLoading ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Hosting Room...</>
                          ) : (
                            <><Swords className="h-4 w-4" /> Host Match Room</>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <p className="text-slate-500 text-xs text-center px-4 leading-relaxed font-medium">
                          Have an invite link or a 6-digit room code? Enter it below to join the match lobby instantly.
                        </p>
                        <form onSubmit={handleJoinRoom} className="space-y-4">
                          <input
                            type="text"
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                            placeholder="Enter 6-Digit Code"
                            maxLength={6}
                            className="w-full h-14 bg-white border-2 border-slate-200 rounded-xl px-4 font-mono text-xl tracking-[0.2em] uppercase text-center focus:outline-none focus:ring-4 focus:ring-[#124B7E]/20 focus:border-[#124B7E] transition-all placeholder:tracking-normal placeholder:normal-case placeholder:text-slate-400 placeholder:text-sm font-bold shadow-inner"
                          />
                          <button
                            type="submit"
                            disabled={joinCode.trim().length !== 6}
                            className="w-full py-3.5 bg-[#F59E0B] hover:bg-[#d97706] text-white transition-all rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] disabled:opacity-50 disabled:grayscale cursor-pointer"
                          >
                            Join Match <ArrowRight className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="created"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className="space-y-4"
                  >
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-sm font-bold outfit-bold text-emerald-900">Room Created!</h3>
                        <p className="text-[10px] text-emerald-700 font-medium">Invite players or copy the room link.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-xs">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Room Code</span>
                        <div className="text-2xl font-mono font-extrabold tracking-widest text-[#1E293B] mt-1">{createdCode}</div>
                      </div>
                      
                      <div className="flex flex-col justify-center pl-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Format</span>
                        <span className="text-xs font-extrabold text-[#124B7E] mt-1 uppercase">
                          {gameFormat.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Share Link</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={`${window.location.origin}/dashboard/arena/${createdCode}`}
                          className="flex-1 h-10 bg-slate-100 border border-slate-200 rounded-xl px-3 text-[11px] font-semibold text-slate-600 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleCopyLink}
                          className="h-10 w-12 bg-[#124B7E] text-white rounded-xl flex items-center justify-center hover:bg-[#0f3a63] transition-colors shadow-sm"
                        >
                          {copied ? <Check className="h-4 w-4 animate-in zoom-in" /> : <Copy className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200">
                       <h4 className="font-bold text-[11px] text-slate-700 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                         <Share2 className="h-3 w-3 text-[#124B7E]" />
                         Invite Friends via Chat
                       </h4>
                       <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                         <div className="p-2 border-b border-slate-100 bg-slate-50">
                           <input
                             type="text"
                             placeholder="Search friends..."
                             value={friendSearchQuery}
                             onChange={(e) => setFriendSearchQuery(e.target.value)}
                             className="w-full h-8 bg-white border border-slate-200 rounded-lg px-3 text-[10px] focus:outline-none focus:border-[#124B7E] transition-colors"
                           />
                         </div>
                         <div className="max-h-[150px] overflow-y-auto p-2 space-y-1 bg-white">
                            {loadingFriends ? (
                              <div className="flex items-center justify-center py-4 text-slate-400 gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-[#124B7E]" />
                                <span className="text-[10px] font-semibold">Loading friends...</span>
                              </div>
                            ) : friends.length === 0 ? (
                              <div className="py-4 text-center">
                                <p className="text-slate-400 text-[10px] font-medium">No friends in list.</p>
                              </div>
                            ) : filteredFriends.length === 0 ? (
                              <div className="py-3 text-center text-slate-400 text-[10px] font-medium">No matches.</div>
                            ) : (
                              filteredFriends.map((friend: any) => {
                                const isInvited = invitedIds.includes(friend.id);
                                return (
                                  <div key={friend.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors">
                                    <div className="flex items-center gap-2">
                                      <div className="h-6 w-6 rounded-md bg-[#124B7E]/10 flex items-center justify-center font-bold text-[9px] text-[#124B7E] uppercase">
                                        {friend.username.substring(0, 2)}
                                      </div>
                                      <div className="text-[11px] font-bold text-slate-700">{friend.username}</div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleInviteFriend(friend.id, friend.username)}
                                      disabled={isInvited}
                                      className={`px-3 py-1.5 text-[9px] font-bold rounded-md transition-all ${
                                        isInvited 
                                          ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                          : "bg-[#124B7E]/10 text-[#124B7E] hover:bg-[#124B7E]/20 cursor-pointer"
                                      }`}
                                    >
                                      {isInvited ? "Invited ✓" : "Invite"}
                                    </button>
                                  </div>
                                );
                              })
                            )}
                         </div>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Premium Game Cards Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold outfit-bold text-foreground">Featured Games</h2>
             <span className="text-[10px] font-extrabold uppercase tracking-wider bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20">
               Single Player
             </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {games.filter((g: any) => !g.isMultiplayer).map((game: any) => {
              const bgImages: Record<string, string> = {
                "guess-who": "/images/game-guess-who.jpg",
                "stat-smash": "/images/game-stat-smash.jpg",
                "guess-match": "/images/game-guess-match.jpg",
                "career-path": "/images/game-career-path.jpg",
                "connections": "/images/game-connections.jpg",
                "arena-quiz": "/images/hero-arena.jpg",
              };
              
              const bgImage = bgImages[game.id] || "";
              
              return (
                <Link key={game.id} href={game.href}>
                  <motion.div 
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="relative w-full h-[220px] rounded-2xl overflow-hidden group shadow-lg cursor-pointer border border-border/40"
                  >
                    {/* Background Image & Overlay */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url(${bgImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 p-5 flex flex-col justify-end">
                      <div className="flex justify-between items-end mb-1 transition-transform duration-300 transform group-hover:-translate-y-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            {game.isNew && (
                              <span className="bg-emerald-500/90 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-sm uppercase tracking-widest backdrop-blur-sm border border-emerald-400/50">
                                New
                              </span>
                            )}
                            <span className="bg-white/10 text-white font-bold text-[8px] px-2 py-0.5 rounded-sm uppercase tracking-widest backdrop-blur-sm border border-white/20">
                              {game.difficulty}
                            </span>
                          </div>
                          <h3 className="text-xl font-extrabold text-white outfit-bold">{game.title}</h3>
                        </div>
                        <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 text-white group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                          <Play className="h-4 w-4 fill-current ml-0.5" />
                        </div>
                      </div>
                      
                      {/* Expanded description on hover */}
                      <div className="h-0 opacity-0 group-hover:h-auto group-hover:opacity-100 transition-all duration-300 overflow-hidden">
                        <p className="text-white/80 text-[11px] font-medium leading-relaxed line-clamp-2">
                          {game.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
"""

with open("app/dashboard/page.tsx", "w") as f:
    f.write(header_and_logic + new_return)

print("Created completely clean dashboard page.")
