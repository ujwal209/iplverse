"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { getDbUser, respondToChallenge, getUserProfile } from "@/app/actions/social";
import { Gamepad2, MessageSquare } from "lucide-react";

// Web Audio API Synthesizer to play notifications with zero 404 asset files
export function playNotificationSound(type: 'ping' | 'chime' | 'challenge' = 'ping') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'ping') {
      // Soft high chat ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'chime') {
      // Friendly double ascending tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain1.gain.setValueAtTime(0.06, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.18);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        gain2.gain.setValueAtTime(0.06, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.22);
      }, 90);
    } else if (type === 'challenge') {
      // Play a triple alarm chime for battles
      const playTone = (freq: number, startDelay: number, duration: number) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + duration);
        }, startDelay);
      };

      playTone(440, 0, 0.18);
      playTone(554.37, 100, 0.18);
      playTone(659.25, 200, 0.32);
    }
  } catch (e) {
    console.error("Audio Context playback failed", e);
  }
}

export function RealtimeSocialListener() {
  const pathname = usePathname();
  const router = useRouter();
  const activeUserRef = useRef<any>(null);

  useEffect(() => {
    let challengesChannel: any = null;
    let messagesChannel: any = null;
    let friendshipsChannel: any = null;

    async function init() {
      // 1. Fetch current logged-in user profile
      const dbUser = await getDbUser();
      if (!dbUser) return;
      activeUserRef.current = dbUser;

      // 2. Subscribe to game_challenges postgres changes
      const uniqueId = Math.random().toString(36).substring(7);
      challengesChannel = supabase
        .channel(`social_challenges_${uniqueId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "game_challenges",
          },
          async (payload: any) => {
            const { eventType, new: newRecord, old: oldRecord } = payload;
            const myId = activeUserRef.current?.id;

            if (!myId) return;

            // Scenario A: We are receiving a new challenge
            if (eventType === "INSERT" && newRecord.challenged_id === myId && newRecord.status === "pending") {
              const challengerProfile = await getUserProfile(newRecord.challenger_id);
              const challengerName = challengerProfile?.username || "Someone";
              const friendlyGame = newRecord.game_type.replace(/_/g, " ").toUpperCase();

              // Play challenge sound chime
              playNotificationSound('challenge');

              // Custom Rich Toast using Sonner custom renderer
              toast.custom(
                (t) => (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xl flex flex-col gap-3 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-50 text-[#0B2A96] rounded-full flex items-center justify-center border border-blue-100 shrink-0">
                        <Gamepad2 className="h-5 w-5 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[#0B2A96] outfit-bold">Battle Challenge!</h4>
                        <p className="text-xs text-slate-500 inter-medium mt-0.5">
                          <span className="font-bold text-slate-800">{challengerName}</span> has challenged you to a game of <span className="font-semibold text-blue-700">{friendlyGame}</span>.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-1 border-t border-slate-100">
                      <button
                        onClick={async () => {
                          toast.dismiss(t);
                          const res = await respondToChallenge(newRecord.id, true);
                          if (res.success && res.roomCode) {
                            router.push(`/dashboard/arena/${res.roomCode}`);
                          } else {
                            toast.error("Failed to accept: " + (res.error || "unknown error"));
                          }
                        }}
                        className="px-3.5 py-1.5 bg-[#0B2A96] text-white text-xs font-bold rounded-lg hover:bg-[#0f3a63] transition-colors cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        onClick={async () => {
                          toast.dismiss(t);
                          await respondToChallenge(newRecord.id, false);
                          toast.info("Challenge declined.");
                        }}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ),
                { duration: 25000 }
              );
            }

            // Scenario B: We sent a challenge and it was updated by the opponent
            if (eventType === "UPDATE" && newRecord.challenger_id === myId) {
              if (newRecord.status === "accepted" && newRecord.room_code) {
                // Play double chime
                playNotificationSound('chime');

                toast.success("Challenge Accepted! Entering arena room...", {
                  icon: "⚔️",
                  duration: 4000,
                });
                router.push(`/dashboard/arena/${newRecord.room_code}`);
              } else if (newRecord.status === "declined" && oldRecord.status === "pending") {
                const opponentProfile = await getUserProfile(newRecord.challenged_id);
                toast.error(`${opponentProfile?.username || "Opponent"} declined your challenge.`, {
                  duration: 5000,
                });
              }
            }
          }
        )
        .subscribe();

      // 3. Subscribe to direct_messages postgres insertions (for background notifications)
      messagesChannel = supabase
        .channel(`social_messages_${uniqueId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "direct_messages",
          },
          async (payload: any) => {
            const { new: newMsg } = payload;
            const myId = activeUserRef.current?.id;

            if (!myId) return;

            // Only notify if we are the receiver and we are NOT on the social lobby page
            if (newMsg.receiver_id === myId && pathname !== "/dashboard/lobby") {
              const senderProfile = await getUserProfile(newMsg.sender_id);
              const senderName = senderProfile?.username || "Friend";

              // Play soft ping sound
              playNotificationSound('ping');

              toast.custom((t) => (
                <div 
                  onClick={() => {
                    toast.dismiss(t);
                    router.push("/dashboard/lobby");
                  }}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-lg flex items-center gap-3 max-w-sm w-full cursor-pointer hover:bg-slate-50 transition-colors animate-in fade-in duration-200"
                >
                  <div className="h-8 w-8 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center shrink-0 border border-sky-100">
                    <MessageSquare className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-xs text-[#0B2A96]">{senderName}</h5>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{newMsg.message_text}</p>
                  </div>
                </div>
              ));
            }
          }
        )
        .subscribe();

      // 4. Subscribe to friendships postgres changes (for background notifications)
      friendshipsChannel = supabase
        .channel(`social_friendships_${uniqueId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "friendships",
          },
          async (payload: any) => {
            const { eventType, new: newRec } = payload;
            const myId = activeUserRef.current?.id;

            if (!myId) return;

            // Scenario A: We received a new friend request
            if (eventType === "INSERT" && newRec.friend_id === myId && newRec.status === "pending") {
              if (pathname !== "/dashboard/lobby") {
                // Play chime sound
                playNotificationSound("chime");

                const senderProfile = await getUserProfile(newRec.user_id);
                const senderName = senderProfile?.username || "Someone";

                toast.info(`New friend request from ${senderName}!`, {
                  description: "Head to the Lobby to accept or decline.",
                  action: {
                    label: "View Lobby",
                    onClick: () => router.push("/dashboard/lobby")
                  }
                });
              }
            }

            // Scenario B: Friend request accepted (we sent it or received it)
            if (eventType === "UPDATE" && newRec.status === "accepted") {
              if (newRec.user_id === myId || newRec.friend_id === myId) {
                if (pathname !== "/dashboard/lobby") {
                  // Play chime sound
                  playNotificationSound("chime");

                  const otherId = newRec.user_id === myId ? newRec.friend_id : newRec.user_id;
                  const otherProfile = await getUserProfile(otherId);
                  const otherName = otherProfile?.username || "A user";

                  toast.success(`You and ${otherName} are now friends!`, {
                    description: "You can now start chatting and challenging them.",
                    action: {
                      label: "Chat Now",
                      onClick: () => router.push("/dashboard/lobby")
                    }
                  });
                }
              }
            }
          }
        )
        .subscribe();
    }

    init();

    return () => {
      if (challengesChannel) challengesChannel.unsubscribe();
      if (messagesChannel) messagesChannel.unsubscribe();
      if (friendshipsChannel) friendshipsChannel.unsubscribe();
    };
  }, [pathname]);

  return null;
}
