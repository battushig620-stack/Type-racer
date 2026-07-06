import React, { useEffect, useState, useRef } from 'react';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Room, Player, UserStats } from '../types';
import { Keyboard, Play, Trophy, Users, Bot, RefreshCw, AlertCircle, ArrowLeft, Send, Sparkles, Flame, CheckCircle, RotateCcw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GameRoomProps {
  roomId: string;
  isSoloWithBots: boolean;
  configuredBots?: Player[];
  user: any;
  guestName: string;
  guestStats: UserStats;
  saveStats: (newStats: UserStats) => void;
  onLeaveRoom: () => void;
}

export default function GameRoom({
  roomId,
  isSoloWithBots,
  configuredBots = [],
  user,
  guestName,
  guestStats,
  saveStats,
  onLeaveRoom,
}: GameRoomProps) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Core Typing State
  const [inputText, setInputText] = useState<string>(() => {
    return sessionStorage.getItem(`typing_input_text_${roomId}`) || '';
  });
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [typedCharsCount, setTypedCharsCount] = useState(0);
  const [correctCharsCount, setCorrectCharsCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isTypingStarted, setIsTypingStarted] = useState(false);

  // Match info
  const [countdown, setCountdown] = useState(5);
  const [gameStarted, setGameStarted] = useState(false);

  // References
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const botIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTimeRef = useRef<number>(0);

  const currentUserId = user ? user.uid : `guest_${localStorage.getItem('typing_guest_id') || 'temp'}`;
  const currentUserDisplayName = user ? (user.displayName || 'Clasher') : guestName;
  const currentUserPhotoURL = user ? user.photoURL : `https://api.dicebear.com/7.x/bottts/svg?seed=${guestName}`;

  // --- 1. ROOM SYNC ENGINE ---
  useEffect(() => {
    if (isSoloWithBots) {
      // Simulate Solo Room
      const text = "Success is not final, failure is not fatal: it is the courage to continue that counts. Continuous effort, not strength or intelligence, is the key to unlocking our potential.";
      const simulatedPlayers: { [uid: string]: Player } = {
        [currentUserId]: {
          uid: currentUserId,
          displayName: currentUserDisplayName,
          photoURL: currentUserPhotoURL,
          wpm: 0,
          progress: 0,
          accuracy: 100,
          completed: false,
          finishedTime: null,
          isBot: false,
        }
      };

      configuredBots.forEach(bot => {
        simulatedPlayers[bot.uid] = bot;
      });

      const simulatedRoom: Room = {
        id: roomId,
        text: text,
        status: 'waiting',
        createdAt: Date.now(),
        startTime: null,
        countdown: 5,
        players: simulatedPlayers,
        hostId: currentUserId
      };

      setRoom(simulatedRoom);
      setLoading(false);
    } else {
      // Listen to real-time Firestore room
      const roomDocRef = doc(db, 'rooms', roomId);
      const unsubscribe = onSnapshot(roomDocRef, (snapshot) => {
        if (!snapshot.exists()) {
          setError("This race room does not exist or was closed.");
          setLoading(false);
          return;
        }

        const data = snapshot.data();
        const syncedRoom: Room = {
          id: snapshot.id,
          text: data.text,
          status: data.status,
          createdAt: data.createdAt,
          startTime: data.startTime,
          countdown: data.countdown,
          players: data.players,
          hostId: data.hostId,
        };

        // If current player is not in the room yet, join them
        if (!syncedRoom.players[currentUserId] && syncedRoom.status === 'waiting') {
          joinOnlineRoom(syncedRoom);
        } else {
          setRoom(syncedRoom);
          setLoading(false);

          // Listen to countdown/start trigger
          if (syncedRoom.status === 'starting' && syncedRoom.startTime) {
            const timeDiff = syncedRoom.startTime - Date.now();
            setCountdown(Math.max(0, Math.ceil(timeDiff / 1000)));
            setGameStarted(false);
          } else if (syncedRoom.status === 'active') {
            setGameStarted(true);
            setIsTypingStarted(true);
            if (syncedRoom.startTime) {
              setStartTime(syncedRoom.startTime);
            } else {
              setStartTime(Date.now());
            }
          }
        }
      }, (err) => {
        console.error("Game Room state listener error: ", err);
        setError("Unable to sync game data. Check connection.");
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [roomId, isSoloWithBots]);

  // Join online room
  const joinOnlineRoom = async (currentRoom: Room) => {
    const updatedPlayers = {
      ...currentRoom.players,
      [currentUserId]: {
        uid: currentUserId,
        displayName: currentUserDisplayName,
        photoURL: currentUserPhotoURL,
        wpm: 0,
        progress: 0,
        accuracy: 100,
        completed: false,
        finishedTime: null,
        isBot: false,
      } as Player
    };

    const path = `rooms/${roomId}`;
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        players: updatedPlayers
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Start online countdown (Host only)
  const handleStartRace = async () => {
    if (!room) return;
    const startTriggerTime = Date.now() + 5000; // 5 seconds from now
    const path = `rooms/${roomId}`;
    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'starting',
        startTime: startTriggerTime,
        countdown: 5
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  // Host local start trigger (Solo Bot Match)
  const handleStartSoloRace = () => {
    if (!room) return;
    setRoom(prev => prev ? { ...prev, status: 'starting', startTime: Date.now() + 5000 } : null);
  };

  // --- 2. GAME TIME & COUNTDOWN LOOPS ---
  useEffect(() => {
    if (!room) return;

    if (room.status === 'starting' && room.startTime) {
      const interval = setInterval(() => {
        const timeDiff = room.startTime! - Date.now();
        const currentCount = Math.max(0, Math.ceil(timeDiff / 1000));
        setCountdown(currentCount);

        if (currentCount === 0) {
          clearInterval(interval);
          setGameStarted(true);
          setStartTime(Date.now());
          setIsTypingStarted(true);
          
          if (isSoloWithBots) {
            setRoom(prev => prev ? { ...prev, status: 'active' } : null);
          } else if (room.hostId === currentUserId) {
            updateDoc(doc(db, 'rooms', roomId), { status: 'active' });
          }

          // Force focus input
          setTimeout(() => {
            inputRef.current?.focus();
          }, 50);
        }
      }, 250);

      return () => clearInterval(interval);
    }
  }, [room?.status, room?.startTime]);

  // Typing timer loop
  useEffect(() => {
    if (gameStarted && !isFinished && startTime) {
      timerRef.current = setInterval(() => {
        const currentElapsed = (Date.now() - startTime) / 1000;
        setElapsedTime(currentElapsed);

        // Update current player WPM and accuracy
        calculateStats(inputText, currentElapsed);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStarted, isFinished, startTime, inputText]);

  // Simulate bots progress
  useEffect(() => {
    if (gameStarted && !isFinished && isSoloWithBots && room) {
      botIntervalRef.current = setInterval(() => {
        setRoom(prevRoom => {
          if (!prevRoom) return null;
          const updatedPlayers = { ...prevRoom.players };
          let allFinished = true;

          Object.keys(updatedPlayers).forEach(uid => {
            const player = updatedPlayers[uid];
            if (player.isBot && !player.completed) {
              const diff = player.botDifficulty || 'medium';
              let speed = 40; // baseline char typed per iteration
              let acc = 95;

              switch (diff) {
                case 'easy':
                  speed = Math.random() > 0.4 ? 1.5 : 0; // slower increments
                  acc = 92;
                  player.wpm = 30 + Math.floor(Math.random() * 10);
                  break;
                case 'medium':
                  speed = Math.random() > 0.3 ? 2.8 : 0.5;
                  acc = 96;
                  player.wpm = 50 + Math.floor(Math.random() * 15);
                  break;
                case 'hard':
                  speed = Math.random() > 0.2 ? 4.5 : 1.2;
                  acc = 98;
                  player.wpm = 80 + Math.floor(Math.random() * 20);
                  break;
                case 'insane':
                  speed = Math.random() > 0.1 ? 6.5 : 2.5;
                  acc = 99;
                  player.wpm = 110 + Math.floor(Math.random() * 30);
                  break;
              }

              const charsToType = Math.ceil(speed);
              const textLength = prevRoom.text.length;
              const currentTyped = Math.round(player.progress * textLength) + charsToType;
              const newProgress = Math.min(1, currentTyped / textLength);

              player.progress = newProgress;
              player.accuracy = acc;

              if (newProgress >= 1) {
                player.completed = true;
                player.finishedTime = Date.now();
              }
            }

            if (!player.completed) {
              allFinished = false;
            }
          });

          return {
            ...prevRoom,
            players: updatedPlayers,
            status: allFinished ? 'finished' : prevRoom.status
          };
        });
      }, 1000);
    }

    return () => {
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
    };
  }, [gameStarted, isFinished, isSoloWithBots]);

  // --- 3. TYPING CORE CALCULATION LOGIC ---
  const calculateStats = (currentInput: string, currentElapsed: number) => {
    if (!room) return;
    const targetText = room.text;
    const typedLength = currentInput.length;
    
    let correctCount = 0;
    for (let i = 0; i < typedLength; i++) {
      if (currentInput[i] === targetText[i]) {
        correctCount++;
      }
    }

    setTypedCharsCount(typedLength);
    setCorrectCharsCount(correctCount);

    const calcAccuracy = typedLength > 0 ? Math.round((correctCount / typedLength) * 100) : 100;
    setAccuracy(calcAccuracy);

    // Standard formula: WPM = (correct chars / 5) / time in minutes
    const elapsedMinutes = currentElapsed / 60;
    const calcWpm = elapsedMinutes > 0 ? Math.round((correctCount / 5) / elapsedMinutes) : 0;
    setWpm(calcWpm);

    const progressRatio = targetText.length > 0 ? typedLength / targetText.length : 0;

    // Realtime Cloud Sync Throttle (every 500ms or on completion)
    const isCompleted = typedLength >= targetText.length;
    const now = Date.now();
    if (!isSoloWithBots && (now - lastSyncTimeRef.current > 500 || isCompleted)) {
      lastSyncTimeRef.current = now;
      syncStatsToFirestore(calcWpm, progressRatio, calcAccuracy, isCompleted);
    }

    if (isCompleted) {
      handleMatchCompletion(calcWpm, calcAccuracy);
    }
  };

  const syncStatsToFirestore = async (currentWpm: number, progressRatio: number, currentAcc: number, completed: boolean) => {
    if (!room) return;
    const path = `rooms/${roomId}`;
    const updatedPlayers = { ...room.players };
    updatedPlayers[currentUserId] = {
      ...updatedPlayers[currentUserId],
      wpm: currentWpm,
      progress: progressRatio,
      accuracy: currentAcc,
      completed: completed,
      finishedTime: completed ? Date.now() : null,
    };

    try {
      await updateDoc(doc(db, 'rooms', roomId), {
        players: updatedPlayers,
        status: completed && (Object.values(updatedPlayers) as Player[]).every((p: Player) => p.completed) ? 'finished' : room.status
      });
    } catch (err) {
      console.error("Failed syncing stats to firestore: ", err);
    }
  };

  const handleMatchCompletion = (finalWpm: number, finalAccuracy: number) => {
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Determine Rank/Place
    let won = false;
    if (room) {
      const otherPlayers = (Object.values(room.players) as Player[]).filter((p: Player) => p.uid !== currentUserId);
      const anyoneCompletedFaster = otherPlayers.some((p: Player) => p.completed && p.finishedTime && p.finishedTime < Date.now());
      won = !anyoneCompletedFaster;
    }

    // Save career statistics
    const prevCareerStats = user ? (guestStats) : guestStats; // local stats as base for guest, or cloud updates handled separately
    
    const nextGamesPlayed = guestStats.gamesPlayed + 1;
    const nextGamesWon = guestStats.gamesWon + (won ? 1 : 0);
    const nextBestWPM = Math.max(guestStats.bestWPM, finalWpm);
    const nextAvgWPM = Math.round(((guestStats.averageWPM * guestStats.gamesPlayed) + finalWpm) / nextGamesPlayed);
    const nextAvgAcc = Math.round(((guestStats.averageAccuracy * guestStats.gamesPlayed) + finalAccuracy) / nextGamesPlayed);
    const nextTotalChars = guestStats.totalCharsTyped + correctCharsCount;
    const nextTimeTyped = guestStats.timeTyped + elapsedTime;

    const newStats: UserStats = {
      gamesPlayed: nextGamesPlayed,
      gamesWon: nextGamesWon,
      bestWPM: nextBestWPM,
      averageWPM: nextAvgWPM,
      averageAccuracy: nextAvgAcc,
      totalCharsTyped: nextTotalChars,
      timeTyped: nextTimeTyped,
    };

    saveStats(newStats);

    // If signed in, update Firestore user document as well!
    if (user) {
      const userProfileRef = doc(db, 'users', user.uid);
      updateDoc(userProfileRef, {
        stats: newStats
      }).catch(err => console.error("Failed to sync profile statistics to Firestore: ", err));
    }
  };

  const handleLeaveRoom = () => {
    sessionStorage.removeItem(`typing_input_text_${roomId}`);
    onLeaveRoom();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!gameStarted || isFinished) return;
    const val = e.target.value;
    if (room && val.length <= room.text.length) {
      setInputText(val);
      sessionStorage.setItem(`typing_input_text_${roomId}`, val);
      calculateStats(val, elapsedTime);
    }
  };

  // Force Focus Click Helper
  const handleTextAreaFocus = () => {
    inputRef.current?.focus();
  };

  // Render the target paragraph with beautiful colors
  const renderParagraph = () => {
    if (!room) return null;
    const text = room.text;
    const typedLen = inputText.length;

    return (
      <div 
        onClick={handleTextAreaFocus}
        className="relative min-h-36 cursor-text rounded-2xl border border-slate-800 bg-slate-950/60 p-6 font-mono text-lg leading-relaxed select-none outline-none focus:border-indigo-500 transition-all shadow-inner"
      >
        {text.split('').map((char, index) => {
          let style = 'text-slate-500';
          if (index < typedLen) {
            style = inputText[index] === char 
              ? 'text-indigo-400 bg-indigo-500/10 font-bold' 
              : 'text-red-500 bg-red-500/10 underline decoration-red-500 underline-offset-4';
          } else if (index === typedLen) {
            style = 'text-white border-l border-indigo-400 animate-pulse';
          }
          return (
            <span key={index} className={style}>
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="mt-4 text-sm text-slate-400 font-mono">Connecting to race arena lobby...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md p-6 border border-slate-800 bg-slate-950/40 rounded-2xl text-center mt-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-100">Race Connection Failed</h3>
        <p className="text-xs text-slate-500 mt-2 mb-6">{error}</p>
        <button
          onClick={handleLeaveRoom}
          className="w-full flex items-center justify-center space-x-1.5 rounded-xl bg-slate-900 border border-slate-800 py-2 text-xs font-bold text-slate-300 hover:bg-slate-850"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Lobby</span>
        </button>
      </div>
    );
  }

  const playersList = room ? (Object.values(room.players) as Player[]) : [];
  // Sort players by progress (descending) or finished rank
  const sortedPlayers = [...playersList].sort((a: Player, b: Player) => {
    if (a.completed && b.completed) {
      return (a.finishedTime || 0) - (b.finishedTime || 0);
    }
    if (a.completed) return -1;
    if (b.completed) return 1;
    return b.progress - a.progress;
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleLeaveRoom}
          className="flex items-center space-x-1.5 rounded-xl bg-slate-900/60 border border-slate-900 px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Exit Arena</span>
        </button>
        <div className="flex items-center space-x-2 text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-xl uppercase tracking-wider font-mono">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Room: {isSoloWithBots ? 'Solo Practice' : `Live #${room?.id}`}</span>
        </div>
      </div>

      {/* RIVAL RACERS TRACKS */}
      <div className="mb-8 rounded-2xl border border-slate-850 bg-slate-950/20 p-6 backdrop-blur-md space-y-4 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
          <Users className="h-4 w-4" />
          <span>Racer Positions</span>
        </h3>

        <div className="space-y-4">
          {sortedPlayers.map((player) => {
            const isMe = player.uid === currentUserId;
            return (
              <motion.div
                layout
                key={player.uid}
                className="relative"
                transition={{
                  type: 'spring',
                  stiffness: 100,
                  damping: 15,
                  mass: 0.8
                }}
              >
                {/* Lane Info */}
                <div className="flex items-center justify-between mb-1.5 text-xs">
                  <div className="flex items-center space-x-2">
                    <img
                      src={player.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.displayName}`}
                      alt={player.displayName}
                      className={`h-6 w-6 rounded-full border bg-slate-900 object-cover ${
                        isMe ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-slate-800'
                      }`}
                    />
                    <span className={`font-semibold ${isMe ? 'text-indigo-400 font-bold' : 'text-slate-300'}`}>
                      {player.displayName} {isMe && '(You)'}
                      {player.isBot && <span className="ml-1.5 text-[9px] uppercase bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-full font-mono">CPU</span>}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 font-mono font-semibold">
                    <span className="text-indigo-400">{player.wpm} <span className="text-[9px] text-slate-500">WPM</span></span>
                    <span className="text-slate-500">{player.accuracy}% <span className="text-[9px] text-slate-600">Acc</span></span>
                  </div>
                </div>

                {/* Horizontal Progress Track */}
                <div className="h-4 w-full rounded-full bg-slate-950 border border-slate-900 overflow-hidden relative">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: `${player.progress * 100}%` }}
                    transition={{ type: 'spring', stiffness: 60, damping: 15 }}
                    className={`h-full rounded-full bg-gradient-to-r relative ${
                      isMe 
                        ? 'from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20' 
                        : 'from-slate-700 to-slate-500'
                    }`}
                  >
                    {player.completed && (
                      <div className="absolute right-1.5 top-0.5">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* COUNTDOWN SCREEN & MAIN TYPING INTERFACE */}
      <AnimatePresence mode="wait">
        {!gameStarted ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-3xl border border-slate-850 bg-slate-950/60 p-12 text-center flex flex-col items-center justify-center min-h-[300px] shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 blur-3xl rounded-full" />
            <div className="absolute bottom-0 left-0 h-40 w-40 bg-purple-500/10 blur-3xl rounded-full" />

            {room?.status === 'waiting' ? (
              <div className="relative">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4 animate-bounce">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-100">Waiting for Opponents</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1.5 mb-6">
                  {isSoloWithBots 
                    ? "Race is ready to launch! Test your speed with simulated CPU typists." 
                    : "Share the room link or wait for other racers to connect from the lobby."}
                </p>

                {/* Lobby list in waiting room */}
                <div className="mb-6 flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                  {playersList.map(p => (
                    <div key={p.uid} className="flex items-center space-x-1.5 bg-slate-900 border border-slate-850 px-3 py-1 rounded-full text-xs">
                      <img src={p.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.displayName}`} alt="" className="h-4 w-4 rounded-full" />
                      <span className="font-semibold text-slate-300">{p.displayName}</span>
                    </div>
                  ))}
                </div>

                {/* Only Host can trigger countdown */}
                {room.hostId === currentUserId ? (
                  <button
                    onClick={isSoloWithBots ? handleStartSoloRace : handleStartRace}
                    className="flex items-center space-x-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 active:scale-95 transition-all mx-auto"
                  >
                    <Play className="h-4 w-4" />
                    <span>Start Race</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-500 bg-slate-900 px-4 py-2 rounded-xl border border-slate-850">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                    <span>Waiting for Host to start...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <motion.div 
                  key={countdown}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="font-mono text-7xl font-extrabold text-indigo-400 tracking-tight"
                >
                  {countdown}
                </motion.div>
                <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mt-4">
                  Match begins in...
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Core Typing Board */}
            <div className="relative">
              {/* Invisible textarea that captures input */}
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                disabled={isFinished}
                className="absolute inset-0 h-full w-full opacity-0 cursor-text select-none resize-none"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
              />

              {renderParagraph()}
            </div>

            {/* Dashboard Indicators */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-slate-850 bg-slate-950/40 p-4 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">WPM</span>
                <span className="font-mono text-2xl font-extrabold text-indigo-400 mt-1 block">{wpm}</span>
              </div>
              <div className="rounded-2xl border border-slate-850 bg-slate-950/40 p-4 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Accuracy</span>
                <span className="font-mono text-2xl font-extrabold text-slate-200 mt-1 block">{accuracy}%</span>
              </div>
              <div className="rounded-2xl border border-slate-850 bg-slate-950/40 p-4 text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Time</span>
                <span className="font-mono text-2xl font-extrabold text-slate-200 mt-1 block">{Math.round(elapsedTime)}s</span>
              </div>
            </div>

            {/* Completion Modal / Section */}
            {isFinished && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-indigo-500/20 bg-slate-950/80 p-8 text-center shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/10 blur-3xl rounded-full animate-pulse" />
                <div className="absolute bottom-0 left-0 h-32 w-32 bg-purple-500/10 blur-3xl rounded-full" />

                <div className="relative">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
                    <Trophy className="h-6 w-6" />
                  </div>
                  <h3 className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-xl font-bold text-transparent">
                    Raced Finished!
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
                    Excellent typing! Your statistics have been recorded and saved successfully.
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3 max-w-xs mx-auto">
                    <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 text-center">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Final Speed</span>
                      <span className="font-mono text-lg font-bold text-indigo-400 mt-0.5 block">{wpm} WPM</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 text-center">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Accuracy</span>
                      <span className="font-mono text-lg font-bold text-slate-200 mt-0.5 block">{accuracy}%</span>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-center space-x-3 max-w-xs mx-auto">
                    <button
                      onClick={handleLeaveRoom}
                      className="flex-1 flex items-center justify-center space-x-1.5 rounded-xl bg-slate-900 border border-slate-800 py-3 text-xs font-bold text-slate-300 hover:bg-slate-850"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      <span>Lobby</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
