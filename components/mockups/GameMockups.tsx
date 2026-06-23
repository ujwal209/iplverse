import React from 'react';
import { Search, Trophy, MapPin, Target, Gamepad2, Timer, Award, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

const TEAM_LOGOS = {
  csk: "/csk.jpg",
  mi: "/mi.jpg",
  rcb: "/rcb.jpg",
  kkr: "/rcb.jpg", // fallback if kkr isn't uploaded
  dc: "/mi.jpg"    // fallback if dc isn't uploaded
};

const PLAYER_IMAGES = {
  virat: "/virat.jpg",
  dhoni: "/msd.jpg",
  rohit: "/rohit.webp"
};

export function GameMockup({ gameId }: { gameId: string }) {
  switch (gameId) {
    case "guess-who":
      return (
        <div className="w-full h-full bg-slate-50 p-6 flex flex-col items-center justify-between font-sans select-none overflow-hidden relative rounded-2xl shadow-inner border border-[#0B2A96]/10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0B2A96]/10 to-transparent pointer-events-none" />
          <div className="text-center w-full z-10">
            <span className="text-[12px] font-black text-[#0B2A96] tracking-widest uppercase">Mystery Player</span>
            <div className="w-28 h-28 sm:w-32 sm:h-32 mx-auto mt-6 rounded-full border-4 border-[#0B2A96]/20 overflow-hidden relative shadow-xl bg-white">
              {/* Silhouette with primary brand color tint */}
              <div className="absolute inset-0 bg-[#0B2A96] mix-blend-color z-10" />
              <img src={PLAYER_IMAGES.virat} className="w-full h-full object-cover blur-md brightness-50 contrast-125" alt="Silhouette" />
              <div className="absolute inset-0 flex items-center justify-center bg-[#0B2A96]/30 z-20">
                <Search className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
          <div className="w-full space-y-3 mt-8 z-10">
            {['Rohit Sharma', 'Virat Kohli', 'MS Dhoni', 'Suresh Raina'].map((name, i) => (
              <div key={name} className={`w-full py-3.5 px-5 rounded-2xl text-xs font-black text-center border transition-all shadow-sm ${i === 1 ? 'bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/20' : 'bg-white border-[#0B2A96]/10 text-[#0B2A96] hover:bg-[#0B2A96]/5'}`}>
                {name}
              </div>
            ))}
          </div>
        </div>
      );

    case "stat-smash":
      return (
        <div className="w-full h-full bg-slate-50 flex flex-col p-6 font-sans select-none overflow-hidden relative rounded-2xl shadow-inner border border-[#0B2A96]/10">
          <div className="text-center mb-6 z-10 mt-4">
            <span className="text-[12px] font-black text-[#0B2A96] tracking-widest uppercase drop-shadow-sm">Higher Win Rate?</span>
          </div>
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-4 z-10 w-full">
            <div className="flex-1 w-full flex sm:flex-col items-center justify-between sm:justify-center bg-white rounded-3xl p-5 border border-[#0B2A96]/10 shadow-lg relative overflow-hidden">
              <div className="flex sm:flex-col items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white p-2 shadow-sm border border-slate-100 flex items-center justify-center">
                  <img src={TEAM_LOGOS.csk} className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="text-xs text-slate-600 font-bold text-left sm:text-center uppercase tracking-wider">CSK</div>
              </div>
              <div className="text-xl sm:text-3xl font-black text-[#0B2A96] mt-0 sm:mt-4">58.9%</div>
            </div>
            
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#0B2A96] flex items-center justify-center text-[10px] sm:text-xs font-black text-white shrink-0 shadow-lg z-20">VS</div>
            
            <div className="flex-1 w-full flex sm:flex-col items-center justify-between sm:justify-center bg-[#0B2A96] rounded-3xl p-5 shadow-xl relative overflow-hidden ring-4 ring-[#0B2A96]/20">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent pointer-events-none" />
              <div className="flex sm:flex-col items-center gap-4 relative z-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white p-2 shadow-sm border border-white/20 flex items-center justify-center">
                  <img src={TEAM_LOGOS.mi} className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="text-xs text-white/90 font-bold text-left sm:text-center uppercase tracking-wider">MI</div>
              </div>
              <div className="flex flex-col items-end sm:items-center mt-0 sm:mt-4 relative z-10">
                <div className="text-xl sm:text-3xl font-black text-white/50 blur-[4px] select-none">??.?%</div>
                <button className="mt-2 bg-white hover:bg-slate-50 text-[#0B2A96] text-[10px] px-5 py-2 rounded-full font-black uppercase tracking-widest shadow-lg">Select</button>
              </div>
            </div>
          </div>
        </div>
      );

    case "guess-match":
      return (
        <div className="w-full h-full bg-slate-50 p-6 font-sans select-none overflow-hidden flex flex-col justify-center rounded-2xl shadow-inner border border-[#0B2A96]/10">
          <div className="bg-white rounded-3xl shadow-xl border border-[#0B2A96]/10 overflow-hidden flex flex-col">
            <div className="bg-[#0B2A96] py-3 text-center shadow-inner">
              <span className="text-white text-xs font-black tracking-widest uppercase">IPL 2019 Final</span>
            </div>
            <div className="flex items-center justify-between px-6 py-8 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col items-center gap-3 w-1/3">
                <div className="w-16 h-16 bg-white rounded-full p-2 shadow-md border border-slate-200 flex items-center justify-center">
                  <img src={TEAM_LOGOS.mi} className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="font-black text-[#0B2A96] text-xl">149/8</div>
                <div className="text-[10px] text-slate-500 font-bold bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">20.0 OV</div>
              </div>
              <div className="text-slate-300 font-black text-lg italic w-1/3 text-center">V/S</div>
              <div className="flex flex-col items-center gap-3 w-1/3">
                <div className="w-16 h-16 bg-white rounded-full p-2 shadow-md border border-slate-200 flex items-center justify-center">
                  <img src={TEAM_LOGOS.csk} className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="font-black text-slate-900 text-xl">???</div>
                <div className="text-[10px] text-slate-500 font-bold bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">20.0 OV</div>
              </div>
            </div>
            <div className="p-6 text-center flex-1 flex flex-col justify-center bg-white">
              <p className="text-sm font-black text-[#0B2A96] mb-5 uppercase tracking-wider">Who won by 1 run?</p>
              <div className="flex gap-4">
                <button className="flex-1 bg-white border-2 border-[#0B2A96]/20 text-[#0B2A96] hover:bg-[#0B2A96]/5 text-xs py-3.5 rounded-2xl font-black shadow-sm transition-all active:scale-95">MI</button>
                <button className="flex-1 bg-[#0B2A96] hover:bg-[#082072] text-white text-xs py-3.5 rounded-2xl font-black shadow-md transition-all active:scale-95">CSK</button>
              </div>
            </div>
          </div>
        </div>
      );

    case "career-path":
      return (
        <div className="w-full h-full bg-slate-50 p-8 font-sans select-none overflow-hidden relative flex flex-col items-center rounded-2xl shadow-inner border border-[#0B2A96]/10">
          <div className="w-24 h-24 rounded-full border-[6px] border-white shadow-xl bg-white p-2 mb-8 z-10 relative">
            <img src={PLAYER_IMAGES.virat} className="w-full h-full object-cover rounded-full" />
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 flex items-center justify-center rounded-full border-4 border-white shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div className="w-1.5 bg-[#0B2A96]/10 h-full absolute left-1/2 -translate-x-1/2 top-40 rounded-full" />
          
          <div className="w-full space-y-8 z-10 relative flex-1">
            <div className="flex items-center justify-end w-1/2 pr-10 relative left-0">
              <div className="bg-white text-[#0B2A96] text-xs font-black px-5 py-3 rounded-xl shadow-lg relative w-full text-center border border-[#0B2A96]/10">
                2008: RCB Debut
                <div className="absolute right-[-47px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-[5px] border-[#0B2A96] shadow-md" />
              </div>
            </div>
            <div className="flex items-center justify-start w-1/2 pl-10 relative left-1/2">
              <div className="bg-[#0B2A96] text-white text-xs font-black px-5 py-3 rounded-xl shadow-xl relative w-full text-center border-2 border-[#0B2A96]">
                Guess Year?
                <div className="absolute left-[-47px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#0B2A96] border-[5px] border-white shadow-lg animate-pulse" />
              </div>
            </div>
            <div className="flex items-center justify-end w-1/2 pr-10 relative left-0">
              <div className="bg-white text-[#0B2A96] text-xs font-black px-5 py-3 rounded-xl shadow-lg relative w-full text-center border border-[#0B2A96]/10">
                2016: 973 Runs
                <div className="absolute right-[-47px] top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-[5px] border-[#0B2A96] shadow-md" />
              </div>
            </div>
          </div>
        </div>
      );

    case "connections":
      return (
        <div className="w-full h-full bg-slate-50 p-6 font-sans select-none overflow-hidden flex flex-col items-center justify-center rounded-2xl shadow-inner border border-[#0B2A96]/10">
          <p className="text-xs font-black text-[#0B2A96] uppercase tracking-widest mb-8">Find the Connection</p>
          <div className="grid grid-cols-2 gap-5 w-full max-w-[280px]">
            <div className="aspect-square bg-white rounded-[2rem] shadow-lg border border-[#0B2A96]/10 overflow-hidden relative group p-4 flex items-center justify-center">
              <img src={TEAM_LOGOS.csk} className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="aspect-square bg-white rounded-[2rem] shadow-lg border border-[#0B2A96]/10 overflow-hidden relative flex items-center justify-center p-4 text-center">
              <span className="font-black text-[#0B2A96] text-sm drop-shadow-sm leading-tight uppercase tracking-wider">5 Trophies</span>
            </div>
            <div className="aspect-square bg-[#0B2A96] rounded-[2rem] shadow-xl border border-[#0B2A96] overflow-hidden relative flex items-center justify-center text-center p-4">
              <span className="font-black text-white text-sm tracking-widest uppercase drop-shadow-sm">Captain</span>
            </div>
            <div className="aspect-square bg-white/50 rounded-[2rem] shadow-inner border-dashed border-2 border-[#0B2A96]/30 overflow-hidden relative flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white hover:border-[#0B2A96]/50 transition-colors">
              <Search className="w-8 h-8 text-[#0B2A96]/50" />
              <span className="text-[#0B2A96]/50 font-black uppercase tracking-widest text-[10px]">Guess?</span>
            </div>
          </div>
        </div>
      );

    case "arena-quiz":
      return (
        <div className="w-full h-full bg-slate-50 p-8 font-sans select-none overflow-hidden flex flex-col justify-between relative rounded-2xl shadow-inner border border-[#0B2A96]/10">
          <div className="absolute top-0 left-0 h-1.5 bg-[#0B2A96] w-[65%] shadow-[0_0_15px_rgba(11,42,150,0.5)] transition-all duration-1000" />
          
          <div className="flex items-center gap-5 mt-4">
            <div className="w-14 h-14 bg-white rounded-full p-2 shadow-lg border-2 border-[#0B2A96]/20 flex items-center justify-center">
              <img src={TEAM_LOGOS.rcb} className="w-full h-full object-cover rounded-full" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-[#0B2A96]/60 font-black uppercase tracking-widest mb-1">Time Remaining</div>
              <div className="text-3xl font-black text-[#0B2A96]">00:08</div>
            </div>
            <div className="w-10 h-10 bg-yellow-500/10 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-[#0B2A96]/10 shadow-xl mt-8">
            <p className="text-[#0B2A96] text-base font-black leading-relaxed mb-6 text-center tracking-wide">Who holds the record for the fastest 100 in IPL history?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button className="bg-slate-50 border border-[#0B2A96]/10 hover:bg-[#0B2A96]/5 text-[#0B2A96] text-xs py-4 rounded-2xl font-black transition-colors uppercase tracking-wider">AB de Villiers</button>
              <button className="bg-emerald-500 text-white text-xs py-4 rounded-2xl font-black border border-emerald-600 flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(16,185,129,0.3)] uppercase tracking-wider">
                <CheckCircle2 className="w-5 h-5" /> Chris Gayle
              </button>
              <button className="bg-slate-50 border border-[#0B2A96]/10 hover:bg-[#0B2A96]/5 text-[#0B2A96] text-xs py-4 rounded-2xl font-black transition-colors uppercase tracking-wider">Yusuf Pathan</button>
              <button className="bg-slate-50 border border-[#0B2A96]/10 hover:bg-[#0B2A96]/5 text-[#0B2A96] text-xs py-4 rounded-2xl font-black transition-colors uppercase tracking-wider">David Miller</button>
            </div>
          </div>
        </div>
      );

    case "battle-arena":
      return (
        <div className="w-full h-full bg-slate-50 p-6 font-sans select-none overflow-hidden flex flex-col justify-center relative rounded-2xl shadow-inner border border-[#0B2A96]/10">
          <div className="bg-white border border-[#0B2A96]/10 rounded-[2.5rem] p-8 flex flex-col items-center relative z-10 shadow-xl">
            <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] uppercase font-black tracking-widest mb-8 flex items-center gap-2 border border-emerald-200 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Match Found
            </span>
            
            <div className="flex items-center justify-center gap-6 sm:gap-10 w-full mb-2">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full border-[4px] border-[#0B2A96] p-1.5 shadow-xl flex items-center justify-center">
                  <img src={TEAM_LOGOS.mi} className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="text-[10px] text-[#0B2A96] font-black bg-[#0B2A96]/5 px-3 py-1 rounded-full border border-[#0B2A96]/10 tracking-widest uppercase">YOU</div>
              </div>

              <div className="w-12 h-12 rounded-full bg-[#0B2A96] border-[4px] border-white flex items-center justify-center text-white font-black text-sm shrink-0 shadow-xl z-10 relative">
                VS
                <div className="absolute inset-0 rounded-full border border-white/20 animate-ping" />
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full border-[4px] border-red-500 p-1.5 shadow-xl flex items-center justify-center">
                  <img src={TEAM_LOGOS.csk} className="w-full h-full object-cover rounded-full" />
                </div>
                <div className="text-[10px] text-red-500 font-black bg-red-50 px-3 py-1 rounded-full border border-red-100 tracking-widest uppercase">RIVAL</div>
              </div>
            </div>

            <button className="mt-10 w-full bg-[#0B2A96] hover:bg-[#082072] text-white font-black text-xs py-4 rounded-2xl uppercase tracking-widest shadow-xl transition-all active:scale-95">
              Enter Arena
            </button>
          </div>
        </div>
      );

    default:
      return (
        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-[#0B2A96]/40 font-black uppercase tracking-widest text-sm rounded-2xl border border-[#0B2A96]/10">
          Coming Soon...
        </div>
      );
  }
}

