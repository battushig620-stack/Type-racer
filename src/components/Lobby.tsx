import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, setDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Room, Player, UserStats } from '../types';
import { getRandomText, TYPING_TEXTS, TypingText } from '../data';
import { Keyboard, Plus, Play, User, Users, Bot, RefreshCw, Eye, EyeOff, Loader2, Sparkles, BookOpen, Cpu, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';

interface LobbyProps {
  user: any;
  guestName: string;
  onJoinRoom: (roomId: string, isSoloWithBots: boolean, selectedBots?: any[]) => void;
}

export default function Lobby({ user, guestName, onJoinRoom }: LobbyProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Room creation config
  const [selectedCategory, setSelectedCategory] = useState<string>('random');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('random');

  // Solo with Bots config
  const [showBotModal, setShowBotModal] = useState(false);
  const [botCount, setBotCount] = useState<number>(2);
  const [botDifficulties, setBotDifficulties] = useState<('easy' | 'medium' | 'hard' | 'insane')[]>(['easy', 'medium']);

  const currentUserId = user ? user.uid : `guest_${localStorage.getItem('typing_guest_id') || Math.random().toString(36).substring(2, 11)}`;
  const currentUserDisplayName = user ? (user.displayName || 'Clasher') : guestName;
  const currentUserPhotoURL = user ? user.photoURL : `https://api.dicebear.com/7.x/bottts/svg?seed=${guestName}`;

  useEffect(() => {
    // Listen to active rooms waiting for players
    const q = query(
      collection(db, 'rooms'),
      where('status', 'in', ['waiting', 'starting'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeRooms: Room[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        activeRooms.push({
          id: doc.id,
          text: data.text,
          status: data.status,
          createdAt: data.createdAt,
          startTime: data.startTime,
          countdown: data.countdown,
          players: data.players,
          hostId: data.hostId,
        } as Room);
      });
      // Sort by newest
      activeRooms.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setRooms(activeRooms);
      setLoading(false);
    }, (error) => {
      console.error("Lobby room listener error: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreateOnlineRoom = async () => {
    if (creating) return;
    setCreating(true);
    try {
      // Pick text
      let textObj: TypingText;
      if (selectedDifficulty === 'random') {
        textObj = getRandomText();
      } else {
        textObj = getRandomText(selectedDifficulty as 'easy' | 'medium' | 'hard');
      }

      // If category is specific, try to match it
      if (selectedCategory !== 'random') {
        const filtered = TYPING_TEXTS.filter(t => t.category === selectedCategory && (selectedDifficulty === 'random' || t.difficulty === selectedDifficulty));
        if (filtered.length > 0) {
          textObj = filtered[Math.floor(Math.random() * filtered.length)];
        }
      }

      const newRoomId = Math.random().toString(36).substring(2, 11);
      const hostPlayer: Player = {
        uid: currentUserId,
        displayName: currentUserDisplayName,
        photoURL: currentUserPhotoURL,
        wpm: 0,
        progress: 0,
        accuracy: 100,
        completed: false,
        finishedTime: null,
        isBot: false
      };

      const roomData = {
        id: newRoomId,
        text: textObj.text,
        status: 'waiting',
        createdAt: { seconds: Math.floor(Date.now() / 1000) }, // fallback representation
        startTime: null,
        countdown: 5,
        players: {
          [currentUserId]: hostPlayer
        },
        hostId: currentUserId
      };

      const path = `rooms/${newRoomId}`;
      try {
        await setDoc(doc(db, 'rooms', newRoomId), roomData);
        onJoinRoom(newRoomId, false);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
      }
    } catch (err) {
      console.error("Failed to create room: ", err);
    } finally {
      setCreating(false);
    }
  };

  const handleQuickPlay = async () => {
    // Join the first room with spaces
    const joinableRoom = rooms.find(r => Object.keys(r.players).length < 5 && r.status === 'waiting');
    if (joinableRoom) {
      onJoinRoom(joinableRoom.id, false);
    } else {
      // Create a random one
      await handleCreateOnlineRoom();
    }
  };

  const handleStartSoloBots = () => {
    setShowBotModal(false);
    // Create random text
    let textObj: TypingText;
    if (selectedDifficulty === 'random') {
      textObj = getRandomText();
    } else {
      textObj = getRandomText(selectedDifficulty as 'easy' | 'medium' | 'hard');
    }

    if (selectedCategory !== 'random') {
      const filtered = TYPING_TEXTS.filter(t => t.category === selectedCategory && (selectedDifficulty === 'random' || t.difficulty === selectedDifficulty));
      if (filtered.length > 0) {
        textObj = filtered[Math.floor(Math.random() * filtered.length)];
      }
    }

    // Build the bots
    const configuredBots = Array.from({ length: botCount }).map((_, i) => {
      const diff = botDifficulties[i] || 'medium';
      const botNames: Record<'easy' | 'medium' | 'hard' | 'insane', string[]> = {
        easy: ['SnailBot', 'TypingTurtle', 'RustyKey'],
        medium: ['ByteRacer', 'ClickyClack', 'KeyboardCat'],
        hard: ['SpeedyGonzales', 'MatrixTypist', 'TurboFinger'],
        insane: ['DeepMindType', 'ZeroLatency', 'QuantumWPM']
      };
      const namePool = botNames[diff];
      const botName = namePool[Math.floor(Math.random() * namePool.length)] + ` #${i+1}`;

      return {
        uid: `bot_${diff}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        displayName: botName,
        photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${botName}`,
        wpm: 0,
        progress: 0,
        accuracy: 100,
        completed: false,
        finishedTime: null,
        isBot: true,
        botDifficulty: diff,
      };
    });

    // We can simulate a room id and join as a solo bot race
    onJoinRoom('solo_' + Math.random().toString(36).substring(2, 11), true, configuredBots);
  };

  const updateBotDifficulties = (index: number, difficulty: 'easy' | 'medium' | 'hard' | 'insane') => {
    const next = [...botDifficulties];
    next[index] = difficulty;
    setBotDifficulties(next);
  };

  useEffect(() => {
    // Keep botDifficulties array matched to botCount
    if (botDifficulties.length < botCount) {
      const diff = botCount - botDifficulties.length;
      const extra: ('easy' | 'medium' | 'hard' | 'insane')[] = Array(diff).fill('medium');
      setBotDifficulties([...botDifficulties, ...extra]);
    } else if (botDifficulties.length > botCount) {
      setBotDifficulties(botDifficulties.slice(0, botCount));
    }
  }, [botCount]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Upper Grid: Setup & Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* Play Setup / Custom Room Creator */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-800 bg-slate-950/40 p-6 backdrop-blur-md">
          <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2 mb-4">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <span>Race Configuration</span>
          </h2>

          {/* Category */}
          <div className="mb-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'random', label: 'All Texts', icon: Sparkles },
                { id: 'quotes', label: 'Inspirations', icon: MessageSquare },
                { id: 'literature', label: 'Classic Books', icon: BookOpen },
                { id: 'code', label: 'Coding / JS', icon: Cpu }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center space-x-2 rounded-xl border p-2.5 text-xs font-bold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                      : 'bg-slate-950/60 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-300'
                  }`}
                >
                  <cat.icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="mb-6">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">Difficulty</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'random', label: 'Any', color: 'border-slate-800 text-slate-300' },
                { id: 'easy', label: 'Easy (30-50 WPM)', color: 'border-emerald-900/30 text-emerald-400' },
                { id: 'medium', label: 'Medium (50-80 WPM)', color: 'border-blue-900/30 text-blue-400' },
                { id: 'hard', label: 'Hard (80+ WPM)', color: 'border-red-900/30 text-red-400' }
              ].map(diff => (
                <button
                  key={diff.id}
                  onClick={() => setSelectedDifficulty(diff.id)}
                  className={`rounded-xl border p-2.5 text-xs font-bold transition-all ${
                    selectedDifficulty === diff.id
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                      : `bg-slate-950/60 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-300`
                  }`}
                >
                  <span>{diff.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Quick Actions */}
          <div className="space-y-3">
            <button
              onClick={handleQuickPlay}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 active:scale-[0.99] transition-all"
            >
              <Play className="h-4 w-4" />
              <span>Quick Play (Online)</span>
            </button>

            <button
              onClick={() => setShowBotModal(true)}
              className="w-full flex items-center justify-center space-x-2 rounded-xl bg-slate-900 border border-slate-800 py-3 text-sm font-bold text-indigo-300 hover:bg-slate-850 active:scale-[0.99] transition-all"
            >
              <Bot className="h-4.5 w-4.5" />
              <span>Race against Bots</span>
            </button>
          </div>
        </div>

        {/* Lobby Rooms List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-950/40 p-6 backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Users className="h-5 w-5 text-indigo-400" />
              <span>Active Public Rooms</span>
            </h2>
            <button 
              onClick={handleCreateOnlineRoom}
              disabled={creating}
              className="flex items-center space-x-1 rounded-xl bg-indigo-600/10 border border-indigo-500/20 px-3.5 py-1.5 text-xs font-bold text-indigo-400 hover:bg-indigo-600/20 transition-all"
            >
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              <span>Create Lobby</span>
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
              <p className="mt-3 text-xs text-slate-400 font-mono">Syncing multiplayer arenas...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-900 rounded-xl bg-slate-950/20">
              <Keyboard className="h-8 w-8 text-slate-700 mb-2.5 animate-pulse" />
              <p className="text-sm font-semibold text-slate-400">No open public rooms found</p>
              <p className="text-xs text-slate-500 max-w-xs text-center mt-1">
                Create a lobby above or hit Quick Play to spin up a fresh match for others to join!
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 overflow-y-auto max-h-[340px] pr-1.5">
              {rooms.map((room) => {
                const playerCount = Object.keys(room.players).length;
                return (
                  <motion.div
                    key={room.id}
                    layoutId={room.id}
                    className="rounded-xl border border-slate-900 bg-slate-950/60 p-4 hover:border-slate-800 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="font-mono">Lobby #{room.id}</span>
                      </div>
                      <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-bold text-indigo-400">
                        {playerCount}/5 Joined
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-400 font-mono line-clamp-2 h-8">
                      "{room.text}"
                    </p>

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-900">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {(Object.values(room.players) as Player[]).slice(0, 3).map((p: Player, idx) => (
                          <img
                            key={idx}
                            src={p.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.displayName}`}
                            alt={p.displayName}
                            className="inline-block h-6 w-6 rounded-full border border-slate-900 bg-slate-800 ring-2 ring-slate-950 object-cover"
                            title={p.displayName}
                          />
                        ))}
                        {playerCount > 3 && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-slate-400 border border-slate-800">
                            +{playerCount - 3}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onJoinRoom(room.id, false)}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/10 hover:bg-indigo-500 active:scale-95 transition-all"
                      >
                        Join Match
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Solo Bot configuration modal */}
      {showBotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2.5 mb-2">
              <Bot className="h-5.5 w-5.5 text-indigo-400" />
              <span>Race with Bots Setup</span>
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Configure your mechanical opponents. Practice your speed against smart CPU typists!
            </p>

            {/* Bot Count */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Number of Bots</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => setBotCount(num)}
                    className={`flex-1 rounded-xl border py-2 text-xs font-bold transition-all ${
                      botCount === num
                        ? 'bg-indigo-600/10 border-indigo-500 text-indigo-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {num} {num === 1 ? 'Bot' : 'Bots'}
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Bot Difficulty Settings */}
            <div className="mb-6">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Configure Bot Speed</label>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {Array.from({ length: botCount }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-900 bg-slate-900/30">
                    <span className="text-xs font-semibold text-slate-300">Bot #{i+1}</span>
                    <div className="flex space-x-1">
                      {(['easy', 'medium', 'hard', 'insane'] as const).map(diff => (
                        <button
                          key={diff}
                          onClick={() => updateBotDifficulties(i, diff)}
                          className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase transition ${
                            botDifficulties[i] === diff
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-slate-950 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-3 pt-4 border-t border-slate-900">
              <button
                onClick={() => setShowBotModal(false)}
                className="flex-1 rounded-xl border border-slate-800 py-2.5 text-xs font-bold text-slate-400 hover:bg-slate-900 hover:text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleStartSoloBots}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition"
              >
                Launch Arena
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
