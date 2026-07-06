import React from 'react';
import { Keyboard, Trophy, User, Bot, Sparkles, Flame, Zap, ArrowRight, MonitorPlay } from 'lucide-react';
import { motion } from 'motion/react';
import { ActiveScreen } from '../types';

interface HomeProps {
  setScreen: (screen: ActiveScreen) => void;
  guestName: string;
}

export default function Home({ setScreen, guestName }: HomeProps) {
  const features = [
    {
      icon: MonitorPlay,
      title: 'Online Multiplayer',
      desc: 'Join active multiplayer lobbies or create custom rooms to type against real-time opponents.',
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    },
    {
      icon: Bot,
      title: 'Practice with Bots',
      desc: 'Hone your keyboard mechanics against simulated CPU opponents with customizable difficulties.',
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    },
    {
      icon: Trophy,
      title: 'Global Leaderboards',
      desc: 'Track records, average speeds, and total wins as you scale your way to Typing Grandmaster.',
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    }
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
      {/* Hero Section */}
      <div className="relative text-center max-w-3xl mx-auto mb-16">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-indigo-600/10 blur-3xl" />
        
        <div className="inline-flex items-center space-x-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1 text-xs font-bold text-indigo-400 uppercase tracking-wide mb-6">
          <Flame className="h-3.5 w-3.5 animate-pulse" />
          <span>Next-Gen Typing Arena</span>
        </div>

        <h1 className="bg-gradient-to-b from-white via-slate-100 to-indigo-300 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent sm:text-6xl leading-[1.1]">
          Type Blazingly Fast.<br/>Battle in Realtime.
        </h1>

        <p className="mt-4 text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Welcome, <span className="font-bold text-slate-200">{guestName}</span>! TypeClash is a dynamic typing speed platform where you can compete online with live typists, train against customizable AI bots, and track career milestones.
        </p>

        {/* Call to Actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => setScreen('lobby')}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 active:scale-95 transition-all"
          >
            <span>Enter Race Arena</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => setScreen('leaderboard')}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-slate-900 border border-slate-800 px-6 py-3.5 text-sm font-bold text-slate-300 hover:bg-slate-850 active:scale-95 transition-all"
          >
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {features.map((feat, index) => {
          const Icon = feat.icon;
          return (
            <div
              key={index}
              className="rounded-2xl border border-slate-850 bg-slate-950/20 p-6 backdrop-blur-sm shadow-xl hover:border-slate-800 transition"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border mb-4 ${feat.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-200 mb-2">{feat.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
