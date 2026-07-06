import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';
import { Trophy, Award, Crown, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<'bestWPM' | 'averageWPM' | 'gamesWon'>('bestWPM');

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'users'),
        orderBy(`stats.${metric}`, 'desc'),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const fetchedLeaders: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        fetchedLeaders.push(doc.data() as UserProfile);
      });
      setLeaders(fetchedLeaders);
    } catch (err) {
      console.error("Error fetching leaderboard: ", err);
      setError("Unable to load leaderboard. Sign in or retry connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [metric]);

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Crown className="h-4.5 w-4.5" />
          </div>
        );
      case 1:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300/10 text-slate-300 border border-slate-300/30">
            <Award className="h-4.5 w-4.5" />
          </div>
        );
      case 2:
        return (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700/10 text-amber-700 border border-amber-700/30">
            <Award className="h-4.5 w-4.5" />
          </div>
        );
      default:
        return (
          <span className="text-sm font-semibold text-slate-400 w-8 text-center">
            {index + 1}
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Trophy className="h-6 w-6" />
        </div>
        <h1 className="bg-gradient-to-r from-white via-slate-100 to-indigo-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
          Global Typing Champions
        </h1>
        <p className="mt-2 text-slate-400 text-sm">
          The fastest typists in the TypeClash universe. Do you have what it takes?
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex justify-center space-x-2">
        <button
          onClick={() => setMetric('bestWPM')}
          className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
            metric === 'bestWPM'
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Highest WPM
        </button>
        <button
          onClick={() => setMetric('averageWPM')}
          className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
            metric === 'averageWPM'
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Average WPM
        </button>
        <button
          onClick={() => setMetric('gamesWon')}
          className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border ${
            metric === 'gamesWon'
              ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Total Wins
        </button>
      </div>

      {/* Main Board */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/40 backdrop-blur-md shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="mt-4 text-sm text-slate-400 font-medium">Retrieving scoreboard data...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
            <p className="text-slate-200 font-semibold mb-2">{error}</p>
            <p className="text-slate-500 text-xs max-w-sm mb-4">
              Sign in with Google to create your cloud profile, save stats, and sync to the cloud!
            </p>
            <button
              onClick={fetchLeaderboard}
              className="flex items-center space-x-1.5 rounded-lg bg-slate-900 border border-slate-800 px-4 py-2 text-xs font-bold hover:bg-slate-850 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : leaders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Sparkles className="h-10 w-10 text-slate-500 mb-3" />
            <p className="text-slate-300 font-semibold mb-1">No Champions Yet</p>
            <p className="text-slate-500 text-xs">Be the first to join a race and lock in a record speed!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-4 pl-6 pr-4">Rank</th>
                  <th className="py-4 px-4">Typist</th>
                  <th className="py-4 px-4 text-center">Best WPM</th>
                  <th className="py-4 px-4 text-center">Avg WPM</th>
                  <th className="py-4 px-4 text-center">Avg Acc</th>
                  <th className="py-4 pr-6 pl-4 text-right">Wins</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {leaders.map((leader, index) => (
                  <motion.tr
                    key={leader.uid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`group transition hover:bg-slate-900/30 ${
                      index === 0 ? 'bg-amber-500/[0.02]' : ''
                    }`}
                  >
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center justify-start">
                        {getRankBadge(index)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={leader.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${leader.uid}`}
                          alt={leader.displayName}
                          className="h-8 w-8 rounded-lg border border-slate-800 bg-slate-900 object-cover"
                        />
                        <div>
                          <span className="font-bold text-slate-200 group-hover:text-white transition">
                            {leader.displayName}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-sm font-semibold text-indigo-400">
                      {Math.round(leader.stats?.bestWPM || 0)} <span className="text-[10px] text-slate-500">WPM</span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-sm text-slate-300">
                      {Math.round(leader.stats?.averageWPM || 0)}
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-sm text-slate-300">
                      {Math.round(leader.stats?.averageAccuracy || 0)}%
                    </td>
                    <td className="py-4 pr-6 pl-4 text-right font-mono text-sm font-bold text-slate-300">
                      {leader.stats?.gamesWon || 0}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
