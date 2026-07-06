import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Keyboard, Trophy, User, LogOut, LogIn, Sparkles, Edit2, Check } from 'lucide-react';
import { UserProfile, ActiveScreen } from '../types';
import { signInWithGoogle, logOut } from '../firebase';

interface NavbarProps {
  currentScreen: ActiveScreen;
  setScreen: (screen: ActiveScreen) => void;
  user: any; // Firebase user
  profile: UserProfile | null;
  guestName: string;
  setGuestName: (name: string) => void;
}

export default function Navbar({
  currentScreen,
  setScreen,
  user,
  profile,
  guestName,
  setGuestName,
}: NavbarProps) {
  const [isEditingGuestName, setIsEditingGuestName] = useState(false);
  const [tempGuestName, setTempGuestName] = useState(guestName);

  const handleSaveGuestName = () => {
    const trimmed = tempGuestName.trim();
    if (trimmed) {
      setGuestName(trimmed);
      localStorage.setItem('typing_guest_name', trimmed);
    }
    setIsEditingGuestName(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div 
          onClick={() => setScreen('home')} 
          className="flex cursor-pointer items-center space-x-2.5 transition hover:opacity-90"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Keyboard className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
              TypeClash
            </span>
            <div className="flex items-center space-x-1 text-[10px] font-medium tracking-wider text-indigo-400 uppercase">
              <Sparkles className="h-2.5 w-2.5" />
              <span>Realtime Racer</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => setScreen('lobby')}
            className={`flex items-center space-x-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              currentScreen === 'lobby' || currentScreen === 'game'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Keyboard className="h-4 w-4" />
            <span>Race Arena</span>
          </button>
          
          <button
            onClick={() => setScreen('leaderboard')}
            className={`flex items-center space-x-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              currentScreen === 'leaderboard'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => setScreen('profile')}
            className={`flex items-center space-x-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              currentScreen === 'profile'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Career Profile</span>
          </button>
        </nav>

        {/* Mobile Mini Tabs & Profile / Sign In */}
        <div className="flex items-center space-x-4">
          <div className="flex md:hidden items-center space-x-1 mr-2">
            <button
              onClick={() => setScreen('lobby')}
              className={`p-2 rounded-lg ${currentScreen === 'lobby' || currentScreen === 'game' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
              title="Race Arena"
            >
              <Keyboard className="h-4 w-4" />
            </button>
            <button
              onClick={() => setScreen('leaderboard')}
              className={`p-2 rounded-lg ${currentScreen === 'leaderboard' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
              title="Leaderboard"
            >
              <Trophy className="h-4 w-4" />
            </button>
            <button
              onClick={() => setScreen('profile')}
              className={`p-2 rounded-lg ${currentScreen === 'profile' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
              title="Profile"
            >
              <User className="h-4 w-4" />
            </button>
          </div>

          {/* User Profile Info / Authentication */}
          {user ? (
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-slate-200">
                  {profile?.displayName || user.displayName || 'Clasher'}
                </p>
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-400 border border-indigo-500/20">
                  Cloud Account
                </span>
              </div>
              <img
                src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                alt="Profile"
                className="h-9 w-9 rounded-xl border border-slate-700 bg-slate-800 object-cover"
              />
              <button
                onClick={logOut}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-red-400 transition-colors"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
              {/* Guest Username Editor */}
              <div className="hidden sm:flex items-center space-x-1.5 text-right">
                {isEditingGuestName ? (
                  <div className="flex items-center space-x-1">
                    <input
                      type="text"
                      value={tempGuestName}
                      onChange={(e) => setTempGuestName(e.target.value)}
                      maxLength={15}
                      className="w-24 rounded-md border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveGuestName();
                      }}
                    />
                    <button 
                      onClick={handleSaveGuestName}
                      className="rounded p-0.5 hover:bg-slate-800 text-green-400"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1">
                    <div>
                      <p className="text-xs font-semibold text-slate-300">
                        {guestName}
                      </p>
                      <span className="inline-flex items-center rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-slate-400 border border-slate-700">
                        Guest Play
                      </span>
                    </div>
                    <button 
                      onClick={() => {
                        setTempGuestName(guestName);
                        setIsEditingGuestName(true);
                      }}
                      className="rounded p-1 text-slate-500 hover:bg-slate-900 hover:text-slate-300"
                      title="Edit Guest Name"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Login Button */}
              <button
                onClick={signInWithGoogle}
                className="flex items-center space-x-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 transition-all"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Save Stats</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
