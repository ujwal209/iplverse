"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  UserPlus, 
  MessageSquare, 
  Swords, 
  Check, 
  X, 
  Send, 
  User, 
  Gamepad2, 
  Zap, 
  Loader2, 
  Users,
  ChevronLeft,
  History,
  MapPin,
  Network,
  Trophy,
  Target,
  CornerDownRight,
  Smile,
  Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { 
  getFriendsList, 
  searchUsers, 
  sendFriendRequest, 
  respondToFriendRequest, 
  getDirectMessages, 
  sendDirectMessage,
  createGameChallenge,
  respondToChallenge
} from "@/app/actions/social";
import { playNotificationSound } from "@/components/dashboard/realtime-social-listener";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useRouter } from "next/navigation";
import EmojiPicker from "emoji-picker-react";
import { GifPicker } from "@/components/dashboard/gif-picker";

export default function SocialLobbyPage() {
  const router = useRouter();
  // Lists
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<any[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [loadingList, setLoadingList] = useState(true);

  // Search friends
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  // Active chat
  const [activeFriend, setActiveFriend] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const [unreadSenders, setUnreadSenders] = useState<string[]>([]);
  
  // Challenge Modal/Dropdown
  const [showChallengeModal, setShowChallengeModal] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  
  // UX Features
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [opponentTyping, setOpponentTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatChannelRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getAvatarBg = (username: string) => {
    const colors = [
      "bg-gradient-to-tr from-blue-600 to-sky-400 text-white shadow-xs",
      "bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xs",
      "bg-gradient-to-tr from-[#0B2A96] to-indigo-400 text-white shadow-xs",
      "bg-gradient-to-tr from-rose-500 to-pink-400 text-white shadow-xs",
      "bg-gradient-to-tr from-purple-500 to-indigo-400 text-white shadow-xs",
    ];
    const index = username ? username.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  // 1. Initial Load of Friends list
  const loadFriendsData = async (showSilent = false) => {
    if (!showSilent) setLoadingList(true);
    const res = await getFriendsList();
    if (res.success && res.friends) {
      setFriends(res.friends);
      setPendingIncoming(res.pendingIncoming || []);
      setPendingOutgoing(res.pendingOutgoing || []);
      setCurrentUserId(res.currentUserId || "");
    } else {
      toast.error(res.error || "Failed to load friends list");
    }
    setLoadingList(false);
  };

  useEffect(() => {
    loadFriendsData();
  }, []);

  // 2. Search users trigger
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      const res = await searchUsers(searchQuery);
      if (res.success && res.users) {
        setSearchResults(res.users);
      }
      setSearching(false);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // 3. Load chat logs when activeFriend changes
  useEffect(() => {
    if (!activeFriend) {
      setMessages([]);
      return;
    }

    async function loadChat() {
      setLoadingChat(true);
      const res = await getDirectMessages(activeFriend.id);
      if (res.success && res.messages) {
        setMessages(res.messages);
      } else {
        toast.error("Failed to load message history");
      }
      setLoadingChat(false);
      scrollToBottom();
    }

    loadChat();
  }, [activeFriend]);

  // 4. Realtime subscription for direct messages (unified listener)
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("lobby_direct_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        async (payload: any) => {
          const newMsg = payload.new;
          
          // Case: Message is addressed to us
          if (newMsg.receiver_id === currentUserId) {
            playNotificationSound("ping");
            
            // If it is from the currently active friend in the chat window, append it
            if (activeFriend && newMsg.sender_id === activeFriend.id) {
              setMessages((prev) => {
                // Prevent duplicate render if we already added it optimistically
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              scrollToBottom();
            } else {
              // Add to unread indicator badges
              setUnreadSenders((prev) => {
                if (prev.includes(newMsg.sender_id)) return prev;
                return [...prev, newMsg.sender_id];
              });
            }
          }
        }
      )
      .on(
        "broadcast",
        { event: "typing" },
        (payload: any) => {
          if (activeFriend && payload.payload.sender_id === activeFriend.id && payload.payload.receiver_id === currentUserId) {
            setOpponentTyping(true);
            scrollToBottom();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setOpponentTyping(false), 3000);
          }
        }
      )
      .subscribe();
      
    chatChannelRef.current = channel;

    return () => {
      channel.unsubscribe();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [currentUserId, activeFriend]);

  // 5. Realtime subscription for friendships requests (instantly updates lists)
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("lobby_friendships")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friendships",
        },
        async (payload: any) => {
          const { eventType, new: newRec, old: oldRec } = payload;

          // Silent reload to update list records
          await loadFriendsData(true);

          if (eventType === "INSERT") {
            if (newRec.friend_id === currentUserId) {
              // We got a new incoming request
              playNotificationSound("chime");
              toast.info("You received a new friend request!");
            }
          } else if (eventType === "UPDATE") {
            // Friend request accepted
            if (newRec.status === "accepted" && newRec.user_id === currentUserId) {
              playNotificationSound("chime");
              toast.success("Friend request accepted! You are now connected.");
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [currentUserId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Actions
  const handleAddFriend = async (username: string) => {
    const res = await sendFriendRequest(username);
    if (res.success) {
      playNotificationSound("chime");
      toast.success(`Friend request sent to ${username}!`);
      setSearchQuery("");
      setSearchResults([]);
      loadFriendsData(true);
    } else {
      toast.error(res.error || "Failed to send request");
    }
  };

  const handleFriendResponse = async (friendshipId: string, accept: boolean) => {
    const res = await respondToFriendRequest(friendshipId, accept);
    if (res.success) {
      playNotificationSound("chime");
      toast.success(accept ? "Friend request accepted!" : "Friend request declined.");
      loadFriendsData(true);
    } else {
      toast.error(res.error || "Failed to process request");
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || !activeFriend) return;

    const text = chatInput.trim();
    setChatInput("");
    
    // Format reply as markdown blockquote
    let finalMessageText = text;
    if (replyingTo) {
      const replyUser = replyingTo.sender_id === currentUserId ? "You" : activeFriend.username;
      const quoted = replyingTo.message_text.split('\n').map((line: string) => `> ${line}`).join('\n');
      finalMessageText = `> **Replying to @${replyUser}**\n${quoted}\n\n${text}`;
      setReplyingTo(null);
    }

    // Optimistic append
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: activeFriend.id,
      message_text: finalMessageText,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    const res = await sendDirectMessage(activeFriend.id, finalMessageText);
    if (!res.success) {
      setMessages((prev) => prev.filter(m => m.id !== optimisticMsg.id));
      toast.error("Failed to send message: " + res.error);
    }
  };
  
  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
    
    if (chatChannelRef.current && activeFriend) {
      chatChannelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { sender_id: currentUserId, receiver_id: activeFriend.id }
      });
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emojiObj: any) => {
    setChatInput(prev => prev + emojiObj.emoji);
  };

  const handleGifSelect = async (gifUrl: string) => {
    setShowGifPicker(false);
    
    // Auto-send the GIF as a markdown image immediately
    const markdownImage = `![GIF](${gifUrl})`;
    let finalMessageText = markdownImage;
    
    if (replyingTo) {
      const replyUser = replyingTo.sender_id === currentUserId ? "You" : activeFriend.username;
      const quoted = replyingTo.message_text.split('\n').map((line: string) => `> ${line}`).join('\n');
      finalMessageText = `> **Replying to @${replyUser}**\n${quoted}\n\n${markdownImage}`;
      setReplyingTo(null);
    }
    
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: activeFriend.id,
      message_text: finalMessageText,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();
    
    const res = await sendDirectMessage(activeFriend.id, finalMessageText);
    if (!res.success) {
      setMessages((prev) => prev.filter(m => m.id !== optimisticMsg.id));
      toast.error("Failed to send GIF: " + res.error);
    }
  };

  const handleChallenge = async (gameType: string, friendId: string) => {
    const res = await createGameChallenge(friendId, gameType);
    if (res.success && res.challenge) {
      playNotificationSound("chime");
      // Send standard message in chat
      const challengeMsg = `[CHALLENGE:${res.challenge.id}:${gameType}]`;
      
      const optimisticMsg = {
        id: `temp-${Date.now()}`,
        sender_id: currentUserId,
        receiver_id: friendId,
        message_text: challengeMsg,
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, optimisticMsg]);
      scrollToBottom();
      
      await sendDirectMessage(friendId, challengeMsg);
    } else {
      toast.error("Failed to challenge: " + res.error);
    }
  };

  const handleAcceptChallenge = async (challengeId: string) => {
    const res = await respondToChallenge(challengeId, true);
    if (res.success && res.roomCode) {
      toast.success("Challenge accepted! Redirecting to Arena...", { icon: "⚔️" });
      router.push(`/dashboard/arena/${res.roomCode}`);
    } else {
      toast.error("Failed to accept challenge: " + res.error);
    }
  };
  
  const handleDeclineChallenge = async (challengeId: string) => {
    const res = await respondToChallenge(challengeId, false);
    if (res.success) {
      toast.success("Challenge declined");
    } else {
      toast.error("Failed to decline challenge: " + res.error);
    }
  };

  const handleSelectFriend = (friend: any) => {
    setActiveFriend(friend);
    setMobileView("chat");
    // Clear notification badge for this friend
    setUnreadSenders((prev) => prev.filter(id => id !== friend.id));
  };

  const GAME_OPTIONS = [
    { id: "guess_who", name: "Guess Who" },
    { id: "stat_smash", name: "Stat Smash" },
    { id: "guess_match", name: "Guess the Match" },
    { id: "career_path", name: "Career Path" },
    { id: "connections", name: "Connections" },
    { id: "arena_quiz", name: "Arena Quiz" }
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto w-full h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] h-[calc(100dvh-80px)] flex flex-col overflow-hidden">
      
      {/* Main Social Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: Sidebar (Social Controls) */}
        <div className={`lg:col-span-4 flex flex-col min-h-0 bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-5 overflow-y-auto ${mobileView === "list" ? "flex" : "hidden lg:flex"}`}>
          
          {/* Add Friends Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search New Friends</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter username..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0B2A96]/50 focus:border-[#0B2A96] transition-all"
              />
            </div>
            
            {/* Search Results */}
            <AnimatePresence>
              {searchQuery.trim().length >= 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 max-h-[180px] overflow-y-auto space-y-1.5"
                >
                  {searching ? (
                    <div className="flex items-center justify-center py-4 text-slate-400 text-xs gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin text-[#0B2A96]" />
                      <span>Searching...</span>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-150 hover:border-slate-350 transition-all flex gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${getAvatarBg(user.username)}`}>
                            {user.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{user.username}</p>
                            <p className="text-[9px] text-slate-400 font-semibold">{user.favorite_team || "No Team Preferred"}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddFriend(user.username)}
                          className="p-1.5 bg-[#0B2A96]/10 hover:bg-[#0B2A96] text-[#0B2A96] hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Send Friend Request"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-xs text-slate-400 py-4">No analysts match "{searchQuery}"</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pending Invitations */}
          {pendingIncoming.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold text-[#0B2A96] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 fill-[#0B2A96] text-[#0B2A96] animate-bounce" />
                Pending Requests ({pendingIncoming.length})
              </h3>
              <div className="space-y-2">
                {pendingIncoming.map((req) => (
                  <div key={req.friendshipId} className="flex items-center justify-between p-2.5 bg-blue-50/20 border border-blue-200/40 rounded-2xl animate-in slide-in-from-left-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarBg(req.username)}`}>
                        {req.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{req.username}</p>
                        <p className="text-[9px] text-slate-400 font-semibold uppercase">{req.favoriteTeam || "No team"}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleFriendResponse(req.friendshipId, true)}
                        className="p-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors cursor-pointer"
                        title="Accept"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleFriendResponse(req.friendshipId, false)}
                        className="p-1 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors cursor-pointer"
                        title="Decline"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div className="flex-1 flex flex-col min-h-0 space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Friends ({friends.length})</h3>
              {loadingList && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {friends.length > 0 ? (
                friends.map((friend) => {
                  const isChatting = activeFriend?.id === friend.id;
                  const hasUnread = unreadSenders.includes(friend.id);
                  
                  return (
                    <div 
                      key={friend.id}
                      className={`group p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isChatting 
                          ? "bg-blue-50/30 border-[#0B2A96] shadow-2xs" 
                          : "bg-slate-50/50 border-slate-200/80 hover:bg-white hover:border-slate-350"
                      }`}
                    >
                      <button
                        onClick={() => handleSelectFriend(friend)}
                        className="flex-1 text-left min-w-0 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarBg(friend.username)}`}>
                            {friend.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-extrabold text-slate-800 truncate">{friend.username}</p>
                              {hasUnread && (
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                              )}
                            </div>
                            {/* Styled pills */}
                            <div className="flex items-center gap-2 mt-0.5">
                              {friend.favoriteTeam && (
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-[#0B2A96]/5 text-[#0B2A96] uppercase border border-[#0B2A96]/10">
                                  {friend.favoriteTeam.split(" ").map((w: string) => w[0]).join("")}
                                </span>
                              )}
                              <span className="text-[8px] font-semibold text-slate-400">
                                🏆 {friend.points} XP
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* Fast Action Buttons */}
                      <div className="flex items-center gap-1.5 relative shrink-0">
                        <button
                          onClick={() => handleSelectFriend(friend)}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            isChatting 
                              ? "bg-[#0B2A96] text-white" 
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                          }`}
                          title="Open Chat"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => setShowChallengeModal(friend.id)}
                          className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl transition-colors cursor-pointer border border-rose-100"
                          title="Battle Challenge"
                        >
                          <Swords className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-3">
                  <User className="h-10 w-10 text-slate-300" />
                  <p className="text-xs inter-medium max-w-[180px]">Add friends to start sharing cricket analytics and multiplayer matches.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Center Pane (Synchronized Messaging Workspace) */}
        <div className={`lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl flex flex-col min-h-0 shadow-sm overflow-hidden relative ${mobileView === "chat" ? "flex" : "hidden lg:flex"}`}>
          
          <AnimatePresence mode="wait">
            {activeFriend ? (
              <motion.div 
                key={activeFriend.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col min-h-0"
              >
                
                {/* Chat Pane Header */}
                <div className="flex-shrink-0 border-b border-slate-200/80 p-4 sm:p-5 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Mobile Back Button */}
                    <button 
                      onClick={() => setMobileView("list")}
                      className="lg:hidden p-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 rounded-xl text-slate-500 transition-colors mr-1 cursor-pointer shrink-0"
                    >
                      <ChevronLeft className="h-4.5 w-4.5" />
                    </button>
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${getAvatarBg(activeFriend.username)}`}>
                      {activeFriend.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-[#0B2A96] outfit-bold truncate">{activeFriend.username}</h4>
                      <p className="text-[9px] text-slate-400 inter-regular mt-0.5">Active Realtime Session</p>
                    </div>
                  </div>
                  
                  {/* Challenge Shortcut */}
                  <button
                    onClick={() => setShowChallengeModal(activeFriend.id)}
                    className="px-4.5 h-10 bg-rose-50 hover:bg-rose-500 hover:text-white border border-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.97]"
                  >
                    <Swords className="h-4 w-4" />
                    <span className="hidden sm:inline">Match Challenge</span>
                  </button>
                </div>

                {/* Message Bubble Box */}
                <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 bg-slate-50/20 space-y-3.5">
                  {loadingChat ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs gap-2">
                      <Loader2 className="h-6 w-6 animate-spin text-[#0B2A96]" />
                      <span>Loading logs...</span>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg) => {
                      const isMe = msg.sender_id === currentUserId;
                      return (
                        <div 
                          key={msg.id}
                          className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-200`}
                        >
                          {msg.message_text.startsWith("[CHALLENGE:") ? (
                            (() => {
                              const [, challengeId, gameType] = msg.message_text.replace(']', '').split(':');
                              const gameName = GAME_OPTIONS.find(g => g.id === gameType)?.name || "Match";
                              return (
                                <div className={`w-[260px] sm:w-[280px] p-4 rounded-3xl shadow-sm border ${
                                  isMe ? "bg-gradient-to-br from-rose-50 to-white border-rose-200/60 rounded-br-sm" : "bg-white border-slate-200 rounded-bl-sm"
                                }`}>
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                                      <Swords className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{isMe ? "Challenge Sent" : "Challenge Received"}</h4>
                                      <p className="text-[10px] font-bold text-rose-600">{gameName} Battle</p>
                                    </div>
                                  </div>
                                  {!isMe ? (
                                    <div className="flex gap-2">
                                      <button onClick={() => handleAcceptChallenge(challengeId)} className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer active:scale-95">Accept</button>
                                      <button onClick={() => handleDeclineChallenge(challengeId)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer active:scale-95">Decline</button>
                                    </div>
                                  ) : (
                                    <div className="w-full py-2 bg-slate-50 border border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-xl text-center flex items-center justify-center gap-1.5">
                                      <Loader2 className="h-3 w-3 animate-spin" /> Waiting for response
                                    </div>
                                  )}
                                  <span className={`block text-[9px] mt-3 font-bold tracking-wider ${isMe ? "text-right text-rose-300" : "text-right text-slate-400"}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              );
                            })()
                          ) : (
                            <div className={`max-w-[80%] sm:max-w-[70%] px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl text-[13px] sm:text-[14px] shadow-sm relative group/bubble ${
                              isMe 
                                ? "bg-gradient-to-br from-[#0B2A96] to-[#0A2072] text-white rounded-br-sm border border-[#0A2072]" 
                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                            }`}>
                              <div className="font-medium leading-[1.6] break-words space-y-1.5">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  blockquote: ({ node, ...props }) => (
                                    <blockquote {...props} className={`pl-2.5 border-l-2 my-1.5 text-[11px] sm:text-[12px] font-medium ${isMe ? "border-blue-300 text-blue-100/90" : "border-slate-300 text-slate-500 bg-slate-50 p-2 rounded-r-lg"}`} />
                                  ),
                                  a: ({ node, ...props }) => (
                                    <a {...props} className={`font-bold underline underline-offset-4 decoration-2 hover:opacity-80 transition-opacity break-all ${isMe ? "text-blue-100 decoration-blue-300/50" : "text-[#0B2A96] decoration-[#0B2A96]/30"}`} target="_blank" rel="noopener noreferrer" />
                                  ),
                                  img: ({ node, ...props }) => (
                                    <img {...props} className="rounded-xl max-h-[160px] sm:max-h-[200px] object-cover mt-2 shadow-xs" loading="lazy" />
                                  ),
                                  p: ({ node, ...props }) => <p {...props} className="m-0" />,
                                  strong: ({ node, ...props }) => <strong {...props} className="font-black" />,
                                  ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-5 space-y-1 my-2" />,
                                  ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-5 space-y-1 my-2" />,
                                  li: ({ node, ...props }) => <li {...props} className="" />,
                                  code: ({ node, ...props }) => <code {...props} className={`px-1.5 py-0.5 rounded font-mono text-[0.85em] ${isMe ? "bg-white/20 text-white" : "bg-slate-100 text-slate-800"}`} />
                                }}
                              >
                                {msg.message_text}
                              </ReactMarkdown>
                            </div>
                              <div className="flex items-center justify-end gap-2 mt-1.5">
                                <button
                                  onClick={() => setReplyingTo(msg)}
                                  className={`p-1 rounded-full cursor-pointer transition-colors opacity-60 hover:opacity-100 sm:opacity-0 sm:group-hover/bubble:opacity-100 ${isMe ? "text-white hover:bg-white/20" : "text-slate-500 hover:bg-slate-200 hover:text-slate-800"}`}
                                  title="Reply"
                                >
                                  <CornerDownRight className="h-3 w-3" />
                                </button>
                                <span className={`text-[9px] font-bold tracking-wider ${isMe ? "text-white/60" : "text-slate-400"}`}>
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs space-y-3">
                      <MessageSquare className="h-8 w-8 text-slate-300" />
                      <p className="inter-medium">Conversation started! Send a message to say hi.</p>
                    </div>
                  )}
                  {opponentTyping && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="max-w-[70%] p-4 rounded-3xl rounded-bl-sm bg-white border border-slate-200 shadow-sm flex items-center gap-1.5 h-12">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Indicator Preview */}
                <AnimatePresence>
                  {replyingTo && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-100/80 border-t border-slate-200 px-4 py-2 flex items-start justify-between gap-2 overflow-hidden"
                    >
                      <div className="flex-1 min-w-0 border-l-4 border-[#0B2A96] pl-3">
                        <p className="text-[10px] font-black text-[#0B2A96] uppercase tracking-wider mb-0.5">
                          Replying to {replyingTo.sender_id === currentUserId ? "Yourself" : activeFriend.username}
                        </p>
                        <p className="text-xs text-slate-600 truncate font-medium">{replyingTo.message_text.replace(/> .*\n/g, '').trim()}</p>
                      </div>
                      <button 
                        onClick={() => setReplyingTo(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chat Message Input Box */}
                <div className="relative">
                  {/* Pickers (Emoji / GIF) Absolute Positioned Above */}
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden"
                      >
                        <EmojiPicker onEmojiClick={handleEmojiClick} lazyLoadEmojis height={350} width={300} />
                      </motion.div>
                    )}
                    {showGifPicker && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-16 mb-2 z-50"
                      >
                        <GifPicker onSelect={handleGifSelect} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSendMessage} className="flex-shrink-0 border-t border-slate-200/80 p-3 sm:p-4 flex gap-2.5 items-end bg-white relative z-10">
                    <div className="flex-1 relative flex items-end bg-slate-50 border border-slate-200 rounded-2xl focus-within:ring-2 focus-within:ring-[#0B2A96]/50 focus-within:border-[#0B2A96] transition-all">
                      <div className="flex gap-1.5 p-2 shrink-0 h-12 items-center">
                        <button 
                          type="button"
                          onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowGifPicker(false); }}
                          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${showEmojiPicker ? "bg-slate-200 text-[#0B2A96]" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"}`}
                          title="Add Emoji"
                        >
                          <Smile className="h-5 w-5" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => { setShowGifPicker(!showGifPicker); setShowEmojiPicker(false); }}
                          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${showGifPicker ? "bg-slate-200 text-[#0B2A96]" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"}`}
                          title="Add GIF"
                        >
                          <ImageIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <textarea
                        ref={textareaRef}
                        value={chatInput}
                        onChange={handleTyping}
                        onKeyDown={handleKeyDown}
                        placeholder={`Message ${activeFriend.username}...`}
                        rows={1}
                        className="flex-1 py-3.5 pr-4 pl-1 min-h-[48px] max-h-[120px] resize-none bg-transparent text-sm focus:outline-none font-medium text-slate-750"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="bg-[#0B2A96] hover:bg-[#0f3a63] disabled:opacity-40 text-white rounded-2xl transition-all cursor-pointer shadow-md shadow-blue-900/10 active:scale-95 flex items-center justify-center shrink-0 disabled:cursor-default h-12 w-12"
                    >
                      <Send className="h-5 w-5 ml-0.5" />
                    </button>
                  </form>
                </div>

              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4"
              >
                <div className="h-16 w-16 bg-blue-50/50 border border-slate-100 text-[#0B2A96] rounded-full flex items-center justify-center shadow-inner">
                  <Swords className="h-8 w-8 text-[#0B2A96]" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="font-extrabold text-slate-800 outfit-bold text-lg">Social Workspace Empty</h3>
                  <p className="text-xs text-slate-400 inter-medium leading-relaxed">
                    Select one of your registered friends in the sidebar list to open direct chat logs and launch real-time multiplayer challenges.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

      {/* Centered Game Challenge Modal */}
      <AnimatePresence>
        {showChallengeModal && (
          (() => {
            const friendToChallenge = friends.find(f => f.id === showChallengeModal);
            if (!friendToChallenge) return null;
            return (
              <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/55 backdrop-blur-xs p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden text-left"
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0B2A96] to-[#401A23]" style={{ background: "linear-gradient(to right, #0B2A96, #401A23)" }} />
                  
                  <button 
                    onClick={() => setShowChallengeModal(null)}
                    className="absolute top-5 right-5 p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/40 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shadow-xs text-rose-600">
                      <Swords className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold outfit-bold text-slate-800">Launch 1v1 Battle!</h3>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Select a game format to challenge <span className="text-[#0B2A96] font-extrabold">{friendToChallenge.username}</span></p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {GAME_OPTIONS.map((game) => {
                      const gameIcons: any = {
                        "guess_who": Search,
                        "stat_smash": Target,
                        "guess_match": Gamepad2,
                        "career_path": MapPin,
                        "connections": Network,
                        "arena_quiz": Trophy
                      };
                      const Icon = gameIcons[game.id] || Gamepad2;
                      
                      return (
                        <button
                          key={game.id}
                          onClick={() => {
                            handleChallenge(game.id, friendToChallenge.id);
                            setShowChallengeModal(null);
                          }}
                          className="p-3.5 border border-slate-100 hover:border-rose-200 bg-slate-50/50 hover:bg-rose-50/10 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group cursor-pointer"
                        >
                          <Icon className="h-5 w-5 text-slate-400 group-hover:text-rose-500 transition-colors mb-2" />
                          <div className="text-xs font-bold text-slate-700 group-hover:text-rose-700 transition-colors">{game.name}</div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </div>
            );
          })()
        )}
      </AnimatePresence>
    </div>
  );
}
