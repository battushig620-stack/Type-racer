import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, UserStats, ActiveScreen, Player } from './types';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';
import { motion, AnimatePresence } from 'motion/react';
import { Keyboard, Sparkles } from 'lucide-react';

const DEFAULT_STATS: UserStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  bestWPM: 0,
  averageWPM: 0,
  averageAccuracy: 0,
  totalCharsTyped: 0,
  timeTyped: 0,
};

export default function App() {
  const [currentScreen, setScreenState] = useState<ActiveScreen>(() => {
    const savedScreen = localStorage.getItem('typing_current_screen');
    if (savedScreen === 'game') {
      const savedRoomId = localStorage.getItem('typing_active_room_id');
      if (!savedRoomId) {
        return 'lobby';
      }
    }
    return (savedScreen as ActiveScreen) || 'home';
  });
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Guest settings
  const [guestName, setGuestNameState] = useState<string>('');
  const [guestStats, setGuestStats] = useState<UserStats>(DEFAULT_STATS);

  // Active Race state
  const [activeRoomId, setActiveRoomId] = useState<string | null>(() => {
    return localStorage.getItem('typing_active_room_id');
  });
  const [isSoloWithBots, setIsSoloWithBots] = useState<boolean>(() => {
    return localStorage.getItem('typing_is_solo_with_bots') === 'true';
  });
  const [configuredBots, setConfiguredBots] = useState<Player[]>(() => {
    const savedBots = localStorage.getItem('typing_configured_bots');
    try {
      return savedBots ? JSON.parse(savedBots) : [];
    } catch {
      return [];
    }
  });

  // Screen state persistence helper
  const setScreen = (screen: ActiveScreen) => {
    setScreenState(screen);
    localStorage.setItem('typing_current_screen', screen);
  };

  // Sync states to localStorage automatically
  useEffect(() => {
    localStorage.setItem('typing_current_screen', currentScreen);
  }, [currentScreen]);

  useEffect(() => {
    if (activeRoomId) {
      localStorage.setItem('typing_active_room_id', activeRoomId);
    } else {
      localStorage.removeItem('typing_active_room_id');
    }
  }, [activeRoomId]);

  useEffect(() => {
    localStorage.setItem('typing_is_solo_with_bots', String(isSoloWithBots));
  }, [isSoloWithBots]);

  useEffect(() => {
    localStorage.setItem('typing_configured_bots', JSON.stringify(configuredBots));
  }, [configuredBots]);

  // Initialize Guest Info and Stats from LocalStorage
  useEffect(() => {
    // Guest Name
    let storedName = localStorage.getItem('typing_guest_name');
    if (!storedName) {
      storedName = `Racer_${Math.floor(Math.random() * 900) + 100}`;
      localStorage.setItem('typing_guest_name', storedName);
    }
    setGuestNameState(storedName);

    // Guest ID
    let storedId = localStorage.getItem('typing_guest_id');
    if (!storedId) {
      storedId = Math.random().toString(36).substring(2, 11);
      localStorage.setItem('typing_guest_id', storedId);
    }

    // Guest Stats
    const storedStats = localStorage.getItem('typing_guest_stats');
    if (storedStats) {
      try {
        setGuestStats(JSON.parse(storedStats));
      } catch (err) {
        console.error("Failed to parse local guest stats, resetting.", err);
      }
    }
  }, []);

  // Sync Guest Name to localStorage helper
  const setGuestName = (name: string) => {
    setGuestNameState(name);
    localStorage.setItem('typing_guest_name', name);
  };

  // Auth & Profile Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Sync or retrieve user profile
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Create user profile in Firestore
            // Intelligently seed cloud profile with current local guest stats so they keep progress!
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || `Racer_${firebaseUser.uid.substring(0, 5)}`,
              photoURL: firebaseUser.photoURL || null,
              email: firebaseUser.email || null,
              createdAt: Date.now(),
              stats: guestStats, // Seed with current local achievements!
            };
            
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.error("Error managing user profile Firestore document: ", err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [guestStats]);

  // Save Stats Utility
  const handleSaveStats = (newStats: UserStats) => {
    setGuestStats(newStats);
    localStorage.setItem('typing_guest_stats', JSON.stringify(newStats));
    if (profile) {
      setProfile(prev => prev ? { ...prev, stats: newStats } : null);
    }
  };

  const handleJoinRoom = (roomId: string, isSolo: boolean, selectedBots: Player[] = []) => {
    setActiveRoomId(roomId);
    setIsSoloWithBots(isSolo);
    setConfiguredBots(selectedBots);
    setScreen('game');
  };

  const handleLeaveRoom = () => {
    setActiveRoomId(null);
    setIsSoloWithBots(false);
    setConfiguredBots([]);
    setScreen('lobby');
    localStorage.removeItem('typing_active_room_id');
    localStorage.removeItem('typing_is_solo_with_bots');
    localStorage.removeItem('typing_configured_bots');
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar
        currentScreen={currentScreen}
        setScreen={setScreen}
        user={user}
        profile={profile}
        guestName={guestName}
        setGuestName={setGuestName}
      />

      <main className="flex-grow">
        {authLoading ? (
          <div className="flex flex-col items-center justify-center py-40">
            <Keyboard className="h-10 w-10 text-indigo-500 animate-pulse" />
            <p className="mt-4 text-sm text-slate-400 font-mono tracking-wide">Initializing engine...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentScreen}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {currentScreen === 'home' && (
                <Home setScreen={setScreen} guestName={guestName} />
              )}
              
              {currentScreen === 'lobby' && (
                <Lobby
                  user={user}
                  guestName={guestName}
                  onJoinRoom={handleJoinRoom}
                />
              )}

              {currentScreen === 'game' && activeRoomId && (
                <GameRoom
                  roomId={activeRoomId}
                  isSoloWithBots={isSoloWithBots}
                  configuredBots={configuredBots}
                  user={user}
                  guestName={guestName}
                  guestStats={guestStats}
                  saveStats={handleSaveStats}
                  onLeaveRoom={handleLeaveRoom}
                />
              )}

              {currentScreen === 'profile' && (
                <Profile
                  user={user}
                  profile={profile}
                  guestStats={guestStats}
                  guestName={guestName}
                />
              )}

              {currentScreen === 'leaderboard' && (
                <Leaderboard />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Humble craft footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950/40 text-center text-xs text-slate-600 font-mono">
        <div className="flex items-center justify-center space-x-1">
          <span>TypeClash Arena</span>
          <span>•</span>
          <Sparkles className="h-3 w-3 text-indigo-500" />
          <span>Made for AI Studio</span>
        </div>
      </footer>
    </div>
  );
}
