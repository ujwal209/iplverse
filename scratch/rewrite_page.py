import re

with open("app/dashboard/page.tsx", "r") as f:
    content = f.read()

# We need to extract the imports, the component definition, and all the state/logic.
# The logic ends right before `const renderGameGraphic = (gameId: string) => {`
# Or right before `return (`
split_token = "const renderGameGraphic = (gameId: string) => {"
if split_token not in content:
    print("Cannot find split token")
    exit(1)

logic_part = content.split(split_token)[0]

# Now we construct the new return block.
new_return = """
  const [showArenaModal, setShowArenaModal] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 overflow-x-hidden pb-20">
      
      {/* ARENA MODAL */}
      <AnimatePresence>
        {showArenaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-3xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
                <div>
                    <h2 className="text-2xl font-bold font-heading text-primary flex items-center gap-2"><Swords className="h-6 w-6"/> Battle Arena</h2>
                    <p className="text-xs text-muted-foreground mt-1">Configure and launch your real-time 1v1 match</p>
                </div>
                <button onClick={() => setShowArenaModal(false)} className="p-2 bg-background border border-border rounded-full hover:bg-muted text-foreground transition-colors">
                  <Check className="h-5 w-5" style={{ display: 'none' }} />
                  <span className="font-bold">✕</span>
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {/* 1V1 MULTIPLAYER CONSOLE PRESERVED LOGIC */}
                <AnimatePresence mode="wait">
                  {battleStep === "configure" ? (
                    <motion.div
                      key="configure"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6 flex-1 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header & Tabs */}
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                          <div className="flex bg-muted p-1 rounded-xl border border-border">
                            <button
                              type="button"
                              onClick={() => setMultiplayerTab("host")}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                multiplayerTab === "host"
                                  ? "bg-background text-primary shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Host Match
                            </button>
                            <button
                              type="button"
                              onClick={() => setMultiplayerTab("join")}
                              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                multiplayerTab === "join"
                                  ? "bg-background text-primary shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Join Match
                            </button>
                          </div>
                        </div>

                        {/* Unfinished matches list */}
                        {activeMatches.length > 0 && (
                          <div className="mt-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                </span>
                                <h4 className="text-sm font-extrabold text-amber-600 uppercase tracking-wider font-heading">Active Matches</h4>
                              </div>
                              <span className="text-xs text-amber-600 font-extrabold bg-amber-500/20 px-2.5 py-1 rounded-full">{activeMatches.length} pending</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                              {activeMatches.map((match) => {
                                const isHost = match.host_id === currentUserId;
                                const opponent = isHost
                                  ? (match.guest?.username || "Guest (Waiting...)")
                                  : (match.host?.username || "Host");
                                const formatLabel = gameFormatOptions.find(o => o.value === match.game_format)?.label || match.game_format;
                                return (
                                  <div key={match.id} className="flex items-center justify-between bg-card border border-border rounded-xl p-3 shadow-sm gap-3">
                                    <div className="min-w-0">
                                      <div className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                        <span className="text-primary font-extrabold">vs {opponent}</span>
                                        <span className="text-muted-foreground font-normal">|</span>
                                        <span className="text-muted-foreground font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Code: {match.room_code}</span>
                                      </div>
                                      <div className="text-xs text-muted-foreground font-semibold truncate mt-1">
                                        {formatLabel} • {match.difficulty.toUpperCase()} • Rd {match.match_history?.length || 0}/{match.max_rounds}
                                      </div>
                                    </div>
                                    <Link
                                      href={`/dashboard/arena/${match.room_code}`}
                                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-all shadow-sm shrink-0"
                                    >
                                      <Play className="h-3 w-3 fill-current" />
                                      Resume
                                    </Link>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {multiplayerTab === "host" ? (
                          <div className="space-y-5 mt-4">
                            <CustomSelect
                              label="Game Format"
                              options={gameFormatOptions}
                              value={gameFormat}
                              onChange={(val) => setGameFormat(val)}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <CustomSelect
                                label="Turn Timer"
                                options={timeLimitOptions}
                                value={timeLimit}
                                onChange={(val) => setTimeLimit(val)}
                              />
                              <CustomSelect
                                label="Max Rounds"
                                options={maxRoundsOptions}
                                value={maxRounds}
                                onChange={(val) => setMaxRounds(val)}
                              />
                              <CustomSelect
                                label="Difficulty"
                                options={difficultyOptions}
                                value={difficulty}
                                onChange={(val) => setDifficulty(val)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-5 mt-4">
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              Have an invite link or a 6-digit room code? Enter it below to join the match lobby.
                            </p>
                            <form onSubmit={handleJoinRoom} className="space-y-4">
                              <input
                                type="text"
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                placeholder="Enter 6-Digit Code"
                                maxLength={6}
                                className="w-full h-14 bg-background border border-border rounded-xl px-4 font-mono text-xl tracking-[0.2em] uppercase text-center focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:tracking-normal placeholder:normal-case placeholder:text-muted-foreground placeholder:text-sm font-bold"
                              />
                            </form>
                          </div>
                        )}
                      </div>

                      <div className="pt-6 mt-4 border-t border-border flex justify-end">
                        {multiplayerTab === "host" ? (
                          <button
                            type="button"
                            onClick={handleCreateRoom}
                            disabled={battleLoading}
                            className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground transition-all rounded-xl font-bold text-sm flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
                          >
                            {battleLoading ? (
                              <>
                                <Loader2 className="h-5 w-5 animate-spin" /> Hosting...
                              </>
                            ) : (
                              <>
                                <Swords className="h-5 w-5" /> Host Match
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleJoinRoom}
                            disabled={joinCode.trim().length !== 6}
                            className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white transition-all rounded-xl font-bold text-sm flex items-center gap-2 shadow-md active:scale-95 disabled:opacity-50"
                          >
                            Join Match <ArrowRight className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="created"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="space-y-6 flex-1 flex flex-col justify-between"
                    >
                      <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-border pb-4">
                          <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
                          <div>
                            <h3 className="text-xl font-bold font-heading text-foreground">Room Created!</h3>
                            <p className="text-sm text-muted-foreground">Invite players or copy the room link below.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/50 border border-border rounded-xl p-4 text-center">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Room Code</span>
                            <div className="text-3xl font-mono font-extrabold tracking-widest text-foreground mt-1">{createdCode}</div>
                          </div>
                          
                          <div className="flex flex-col justify-center text-left p-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Format</span>
                            <span className="text-sm font-bold text-primary mt-1 uppercase">
                              {gameFormat.replace("_", " ")}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 text-left">
                          <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Share Link</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={`${window.location.origin}/dashboard/arena/${createdCode}`}
                              className="flex-1 h-12 bg-background border border-border rounded-xl px-4 text-sm font-semibold text-foreground focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleCopyLink}
                              className="h-12 w-12 bg-muted hover:bg-muted/80 border border-border rounded-xl flex items-center justify-center transition-colors"
                            >
                              {copied ? (
                                <Check className="h-5 w-5 text-emerald-500 animate-in zoom-in duration-200" />
                              ) : (
                                <Copy className="h-5 w-5 text-foreground" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-border pt-4 text-left">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                              <Share2 className="h-4 w-4 text-primary" />
                              Invite via Chat
                            </h4>
                            {friends.length > 0 && (
                              <input
                                type="text"
                                placeholder="Search friends..."
                                value={friendSearchQuery}
                                onChange={(e) => setFriendSearchQuery(e.target.value)}
                                className="h-8 w-40 bg-background border border-border rounded-lg px-3 text-xs focus:outline-none focus:border-primary"
                              />
                            )}
                          </div>

                          {loadingFriends ? (
                            <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                              <span className="text-sm font-semibold">Loading friends...</span>
                            </div>
                          ) : friends.length === 0 ? (
                            <div className="py-6 text-center bg-muted/30 border border-dashed border-border rounded-xl">
                              <p className="text-muted-foreground text-sm font-medium">No friends in list.</p>
                            </div>
                          ) : filteredFriends.length === 0 ? (
                            <div className="py-4 text-center text-muted-foreground text-sm">No matches.</div>
                          ) : (
                            <div className="max-h-32 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                              {filteredFriends.map((friend: any) => {
                                const isInvited = invitedIds.includes(friend.id);
                                return (
                                  <div
                                    key={friend.id}
                                    className="flex items-center justify-between p-2.5 bg-background border border-border rounded-lg hover:border-primary/30 transition-colors"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center font-bold text-sm text-primary uppercase">
                                        {friend.username.substring(0, 2)}
                                      </div>
                                      <div className="text-sm font-bold text-foreground">{friend.username}</div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleInviteFriend(friend.id, friend.username)}
                                      disabled={isInvited}
                                      className={`h-8 px-4 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        isInvited
                                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                          : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                                      }`}
                                    >
                                      {isInvited ? (
                                        <>
                                          <Check className="h-3 w-3" /> Invited
                                        </>
                                      ) : (
                                        "Invite"
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-border flex gap-3 justify-end mt-4">
                        <button
                          type="button"
                          onClick={() => setBattleStep("configure")}
                          className="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground text-sm font-bold rounded-xl transition-colors"
                        >
                          Back to Config
                        </button>
                        <button
                          type="button"
                          onClick={() => router.push(`/dashboard/arena/${createdCode}`)}
                          className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                        >
                          Enter Arena Room <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* SECTION 1: Premium Hero */}
      <section className="relative w-full min-h-[65vh] flex flex-col items-center justify-center p-6 sm:p-12 overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 z-0">
          <img src="/images/hero-arena.jpg" alt="Arena Hero" className="w-full h-full object-cover opacity-80 dark:opacity-40 filter saturate-150" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 pt-10">
          <div className="flex-1 text-left space-y-6">
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
                <span className="text-xs font-extrabold text-primary uppercase tracking-widest">Live MultiPlayer Server</span>
             </div>
             
             <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tighter font-heading leading-[1.1] text-foreground">
               Challenge Friends.<br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Rule IPL.</span>
             </h1>
             
             <p className="text-lg sm:text-xl text-muted-foreground font-medium max-w-xl leading-relaxed">
               The ultimate IPL multiplayer arena. Compete in real-time trivia battles, climb the leaderboards, and prove your cricket supremacy.
             </p>
             
             <div className="flex flex-wrap items-center gap-4 pt-6">
               <button onClick={() => setShowArenaModal(true)} className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(var(--primary),0.3)] flex items-center gap-3">
                 <Swords className="h-6 w-6" /> Play Arena
               </button>
               <Link href="/dashboard/lobby" className="px-8 py-4 bg-background/80 hover:bg-muted text-foreground font-bold rounded-full text-lg transition-colors flex items-center gap-3 border border-border backdrop-blur-sm">
                 <MessageSquare className="h-5 w-5" /> Enter Lobby
               </Link>
             </div>
          </div>
          
          <div className="hidden lg:grid grid-cols-2 gap-4 w-full max-w-md">
             <div className="bg-background/60 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center text-center">
               <Trophy className="h-8 w-8 text-yellow-500 mb-3" />
               <span className="text-3xl font-black font-mono text-foreground">14.2k</span>
               <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Matches Played</span>
             </div>
             <div className="bg-background/60 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center text-center">
               <Users className="h-8 w-8 text-blue-500 mb-3" />
               <span className="text-3xl font-black font-mono text-foreground flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                 4,102
               </span>
               <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Active Players</span>
             </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Featured Games */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight font-heading text-foreground">Featured Games</h2>
          <p className="text-muted-foreground mt-3 font-medium">Single-player challenges to test your knowledge.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.filter(g => g.id !== "battle-arena").map(game => {
             const GameIcon = game.icon;
             const images: any = {
               "guess-who": "/images/game-guess-who.jpg",
               "stat-smash": "/images/game-stat-smash.jpg",
               "guess-match": "/images/game-guess-match.jpg",
               "career-path": "/images/game-career-path.jpg",
               "connections": "/images/game-connections.jpg",
               "arena-quiz": "/images/game-guess-match.jpg" // Fallback
             };
             return (
               <Link href={game.href} key={game.id} className="group relative w-full h-[400px] rounded-3xl overflow-hidden shadow-xl border border-border/50 bg-card block transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                 <div className="absolute inset-0 z-0">
                    <img src={images[game.id]} alt={game.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                 </div>
                 
                 <div className="absolute inset-0 z-10 p-6 flex flex-col justify-end text-white">
                   <div className="mb-auto flex justify-between items-start">
                      <div className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center">
                        <GameIcon className="h-6 w-6 text-white" />
                      </div>
                      {game.isNew && (
                        <span className="bg-emerald-500 text-white font-bold text-[10px] px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                          New
                        </span>
                      )}
                   </div>
                   
                   <h3 className="text-2xl font-bold font-heading mb-2">{game.title}</h3>
                   <p className="text-sm text-white/70 line-clamp-2 mb-4">{game.description}</p>
                   
                   <div className="flex items-center gap-3">
                     <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                       {game.difficulty}
                     </span>
                     <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                       {game.xp}
                     </span>
                   </div>
                 </div>
               </Link>
             )
          })}
        </div>
      </section>

      {/* SECTION 3: Stats Warehouse & Analytics Hub */}
      <section className="w-full bg-muted/30 border-y border-border/50 py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold tracking-widest uppercase text-sm mb-2">
                <Network className="h-5 w-5" /> Analytics Hub
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight font-heading text-foreground">Stat Warehouse</h2>
              <p className="text-muted-foreground mt-3 font-medium max-w-2xl">Dive deep into historical IPL data. Compare players, analyze venues, and scout teams with our comprehensive intelligence center.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Player Search", icon: Search, href: "/dashboard/analytics/players", desc: "Find detailed stats for any IPL player." },
              { name: "Head to Head", icon: Swords, href: "/dashboard/analytics/matchups/h2h", desc: "Compare two players directly." },
              { name: "Player vs Team", icon: Shield, href: "/dashboard/analytics/matchups/pvt", desc: "Analyze player performance against specific teams." },
              { name: "Venues", icon: MapPin, href: "/dashboard/analytics/venues", desc: "Stadium statistics and historical data." },
              { name: "Teams", icon: Flag, href: "/dashboard/analytics/teams", desc: "Franchise records and team histories." },
              { name: "Leaderboards", icon: BarChart3, href: "/dashboard/analytics/leaderboards", desc: "All-time top run scorers, wicket takers, and more." }
            ].map((item, i) => (
              <Link href={item.href} key={i} className="group bg-card border border-border hover:border-primary/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg flex flex-col">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold font-heading mb-2 text-foreground group-hover:text-primary transition-colors">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: Social Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 overflow-hidden relative shadow-xl">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Users className="w-64 h-64" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl font-black tracking-tight font-heading text-foreground mb-4">Join the Community</h2>
            <p className="text-lg text-muted-foreground mb-8">Connect with other cricket fanatics, review your match history, and update your profile in the social hub.</p>
            
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard/community" className="px-6 py-3 bg-foreground text-background font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
                <Users className="h-5 w-5" /> View Community
              </Link>
              <Link href="/dashboard/arena/history" className="px-6 py-3 bg-muted text-foreground border border-border font-bold rounded-xl hover:bg-muted/80 transition-colors flex items-center gap-2">
                <History className="h-5 w-5" /> Match History
              </Link>
              <Link href="/dashboard/profile" className="px-6 py-3 bg-muted text-foreground border border-border font-bold rounded-xl hover:bg-muted/80 transition-colors flex items-center gap-2">
                <User className="h-5 w-5" /> My Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
"""

# Need to make sure imports include `Shield, Flag, BarChart3, User, History` from lucide-react if they aren't already.
# We will do a regex replace on the lucide-react import.

lucide_imports_match = re.search(r'import\s+\{([^}]+)\}\s+from\s+"lucide-react";', logic_part)
if lucide_imports_match:
    existing_imports = lucide_imports_match.group(1)
    needed = ["Shield", "Flag", "BarChart3", "User", "History", "MessageSquare", "Users", "X"]
    for n in needed:
        if n not in existing_imports:
            existing_imports += f", {n}"
    
    new_import_stmt = f'import {{ {existing_imports} }} from "lucide-react";'
    logic_part = logic_part.replace(lucide_imports_match.group(0), new_import_stmt)

final_code = logic_part + new_return

with open("app/dashboard/page.tsx", "w") as f:
    f.write(final_code)
print("Successfully generated new page.tsx")
