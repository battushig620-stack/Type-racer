export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  bestWPM: number;
  averageWPM: number;
  averageAccuracy: number;
  totalCharsTyped: number;
  timeTyped: number; // in seconds
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string | null;
  email: string | null;
  createdAt: any; // Firestore Timestamp or number
  stats: UserStats;
}

export interface Player {
  uid: string;
  displayName: string;
  photoURL: string | null;
  wpm: number;
  progress: number; // 0 to 1
  accuracy: number;
  completed: boolean;
  finishedTime: number | null; // Date.now() when completed
  isBot: boolean;
  botDifficulty?: 'easy' | 'medium' | 'hard' | 'insane';
}

export interface Room {
  id: string;
  text: string;
  status: 'waiting' | 'starting' | 'active' | 'finished';
  createdAt: any;
  startTime: number | null; // epoch timestamp
  countdown: number; // 5, 4, 3, 2, 1, 0
  players: { [uid: string]: Player };
  hostId: string;
}

export type ActiveScreen = 'home' | 'lobby' | 'game' | 'profile' | 'leaderboard';
