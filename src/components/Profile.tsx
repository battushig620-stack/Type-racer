import React from 'react';
import { UserStats, UserProfile } from '../types';
import { Award, Zap, Flame, ShieldAlert, Clock, ChevronRight, Activity, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileProps {
  user: any;
  profile: UserProfile | null;
  guestStats: UserStats;
  guestName: string;
}

export default function Profile({ user, profile, guestStats, guestName }: ProfileProps) {
  // Use profile stats if logged in, otherwise local guest stats
  const activeStats = user && profile ? profile.stats : guestStats;
  const activeName = user && profile ? profile.displayName : guestName;
  const isGuest = !user;

  const wpmMilestones = [
    { target: 40, label: 'Swift Tyro', desc: 'Crossed 40 WPM', color: 'from-green-500 to-emerald-600' },
    { target: 60, label: 'Speed Specialist', desc: 'Reached 60 WPM', color: 'from-blue-500 to-indigo-600' },
    { target: 80, label: 'Velocity Virtuoso', desc: 'Blazed past 80 WPM', color: 'from-purple-500 to-fuchsia-600' },
    { target: 100, label: 'Lightning Legend', desc: 'Reached 100+ WPM!', color: 'from-amber-500 to-orange-600 animate-pulse' },
  ];

  const raceMilestones = [
    { target: 5, label: 'Racer', desc: 'Completed 5 races', icon: Zap },
    { target: 20, label: 'Marathoner', desc: 'Completed 20 races', icon: Flame },
    { target: 50, label: 'Grand Master', desc: 'Completed 50+ races', icon: Award },
  ];

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getWPMBadge = (wpm: number) => {
    if (wpm >= 100) return { rank: 'Grandmaster', style: 'text-amber-400 border-amber-500/20 bg-amber-500/10' };
    if (wpm >= 80) return { rank: 'Expert', style: 'text-purple-400 border-purple-500/20 bg-purple-500/10' };
    if (wpm >= 60) return { rank: 'Professional', style: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10' };
    if (wpm >= 40) return { rank: 'Intermediate', style: 'text-green-400 border-green-500/20 bg-green-500/10' };
    return { rank: 'Beginner', style: 'text-slate-400 border-slate-700 bg-slate-800/50' };
  };

  const currentRank = getWPMBadge(activeStats.bestWPM);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-purple-600/5 blur-3xl" />

        <div className="relative flex flex-col items-center sm:flex-row sm:items-start sm:space-x-6">
          <img
            src={user ? (profile?.photoURL || user.photoURL) : `https://api.dicebear.com/7.x/bottts/svg?seed=${guestName}`}
            alt="Profile Avatar"
            className="h-24 w-24 rounded-2xl border-2 border-slate-700 bg-slate-900 object-cover shadow-lg shadow-black/40"
          />
          <div className="mt-4 text-center sm:mt-0 sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
              <h1 className="text-2xl font-extrabold text-slate-100">{activeName}</h1>
              <span className={`mt-1.5 inline-flex self-center sm:self-auto items-center rounded-full border px-2.5 py-0.5 text-xs font-bold tracking-wider uppercase ${currentRank.style}`}>
                {currentRank.rank}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-400 font-mono">
              Account: {isGuest ? 'Guest (Local Data Only)' : 'Cloud Synced Profile'}
            </p>
            {isGuest && (
              <div className="mt-3 inline-flex items-center space-x-2 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs text-amber-300">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Sign in with Google to save your stats to the cloud leaderboard!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Career Stats Grid */}
      <h2 className="mt-10 mb-4 text-lg font-bold text-slate-200 flex items-center space-x-2">
        <Activity className="h-5 w-5 text-indigo-400" />
        <span>Career Statistics</span>
      </h2>
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Best Speed</span>
          <div className="mt-2 flex items-baseline">
            <span className="font-mono text-3xl font-extrabold text-indigo-400">{Math.round(activeStats.bestWPM)}</span>
            <span className="ml-1 text-xs font-medium text-slate-500 uppercase">WPM</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Avg Speed</span>
          <div className="mt-2 flex items-baseline">
            <span className="font-mono text-3xl font-extrabold text-slate-200">{Math.round(activeStats.averageWPM)}</span>
            <span className="ml-1 text-xs font-medium text-slate-500 uppercase">WPM</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Avg Accuracy</span>
          <div className="mt-2 flex items-baseline">
            <span className="font-mono text-3xl font-extrabold text-slate-200">{Math.round(activeStats.averageAccuracy)}</span>
            <span className="ml-1 text-xs font-medium text-slate-500">%</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Races Completed</span>
          <div className="mt-2 flex items-baseline">
            <span className="font-mono text-3xl font-extrabold text-slate-200">{activeStats.gamesPlayed}</span>
            <span className="ml-1 text-xs font-medium text-slate-500">runs</span>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Races Won</span>
          <div className="mt-2 flex items-baseline">
            <span className="font-mono text-2xl font-extrabold text-green-400">{activeStats.gamesWon}</span>
            <span className="ml-1.5 text-xs text-slate-500 font-medium">wins</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Chars</span>
          <div className="mt-2 flex items-baseline">
            <span className="font-mono text-2xl font-extrabold text-slate-200">{activeStats.totalCharsTyped}</span>
            <span className="ml-1.5 text-xs text-slate-500 font-medium">keys</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Time Spent Typing</span>
          <div className="mt-2 flex items-baseline">
            <span className="font-mono text-2xl font-extrabold text-slate-200">{formatTime(activeStats.timeTyped)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 backdrop-blur-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Win Ratio</span>
          <div className="mt-2 flex items-baseline">
            <span className="font-mono text-2xl font-extrabold text-slate-200">
              {activeStats.gamesPlayed > 0 ? Math.round((activeStats.gamesWon / activeStats.gamesPlayed) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Achievements / Badges Section */}
      <h2 className="mt-10 mb-4 text-lg font-bold text-slate-200 flex items-center space-x-2">
        <Award className="h-5 w-5 text-indigo-400" />
        <span>Achievements & Badges</span>
      </h2>

      <div className="grid gap-6 md:grid-cols-2">
        {/* WPM Speed Milestones */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Speed Milestones</h3>
          <div className="space-y-3.5">
            {wpmMilestones.map((badge, idx) => {
              const unlocked = activeStats.bestWPM >= badge.target;
              return (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                    unlocked 
                      ? 'bg-slate-900/60 border-indigo-500/20' 
                      : 'bg-slate-950/40 border-slate-900 opacity-40'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${
                      unlocked ? badge.color : 'from-slate-800 to-slate-900 text-slate-600'
                    }`}>
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${unlocked ? 'text-slate-100' : 'text-slate-500'}`}>
                        {badge.label}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{badge.desc}</p>
                    </div>
                  </div>
                  <div>
                    {unlocked ? (
                      <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-400">
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-600 font-mono">
                        {badge.target} WPM Req
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Race Count Milestones */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/20 p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Experience Milestones</h3>
          <div className="space-y-3.5">
            {raceMilestones.map((badge, idx) => {
              const unlocked = activeStats.gamesPlayed >= badge.target;
              const IconComp = badge.icon;
              return (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300 ${
                    unlocked 
                      ? 'bg-slate-900/60 border-indigo-500/20' 
                      : 'bg-slate-950/40 border-slate-900 opacity-40'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-400 border border-slate-850 shadow-md ${
                      unlocked ? 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' : 'text-slate-600'
                    }`}>
                      <IconComp className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${unlocked ? 'text-slate-100' : 'text-slate-500'}`}>
                        {badge.label}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">{badge.desc}</p>
                    </div>
                  </div>
                  <div>
                    {unlocked ? (
                      <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-bold text-indigo-400">
                        Unlocked
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-slate-600 font-mono">
                        {activeStats.gamesPlayed}/{badge.target}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
