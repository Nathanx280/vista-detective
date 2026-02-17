import { useState, useEffect, useCallback } from "react";

export interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  type: "daily" | "achievement" | "milestone";
  requirement: number;
  progress: number;
  completed: boolean;
  completedAt?: string;
}

export interface UserProgress {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string;
  totalScans: number;
  highScoreCount: number;
  totalFavorites: number;
  artGenerated: number;
  completedMissions: string[];
  badges: string[];
}

const STORAGE_KEY = "anomaly-detector-progress";

const XP_PER_LEVEL = 100;

export function getLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function getXPProgress(xp: number): number {
  return (xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100;
}

export const RANK_TITLES: Record<number, string> = {
  1: "ROOKIE SCOUT",
  2: "FIELD ANALYST",
  3: "ANOMALY HUNTER",
  5: "SENIOR INVESTIGATOR",
  8: "CHIEF DETECTIVE",
  10: "MASTER EXPLORER",
  15: "LEGENDARY AGENT",
  20: "SHADOW COMMANDER",
};

export function getRank(level: number): string {
  const ranks = Object.entries(RANK_TITLES)
    .map(([k, v]) => [Number(k), v] as [number, string])
    .sort((a, b) => b[0] - a[0]);
  for (const [reqLevel, title] of ranks) {
    if (level >= reqLevel) return title;
  }
  return "RECRUIT";
}

export const BADGES = [
  { id: "first_scan", name: "First Contact", icon: "🛸", description: "Complete your first scan", requirement: { totalScans: 1 } },
  { id: "five_scans", name: "Pattern Seeker", icon: "🔍", description: "Complete 5 scans", requirement: { totalScans: 5 } },
  { id: "ten_scans", name: "Deep Observer", icon: "🌐", description: "Complete 10 scans", requirement: { totalScans: 10 } },
  { id: "high_anomaly", name: "Red Alert", icon: "🚨", description: "Find a score 8+ anomaly", requirement: { highScoreCount: 1 } },
  { id: "art_creator", name: "Vision Artist", icon: "🎨", description: "Generate AI anomaly art", requirement: { artGenerated: 1 } },
  { id: "streak_3", name: "Dedicated Agent", icon: "🔥", description: "3-day streak", requirement: { streak: 3 } },
  { id: "streak_7", name: "Unstoppable", icon: "⚡", description: "7-day streak", requirement: { streak: 7 } },
  { id: "level_5", name: "Elite Status", icon: "⭐", description: "Reach Level 5", requirement: { level: 5 } },
  { id: "level_10", name: "Master Class", icon: "👑", description: "Reach Level 10", requirement: { level: 10 } },
  { id: "favorites_5", name: "Curator", icon: "💎", description: "Favorite 5 discoveries", requirement: { totalFavorites: 5 } },
];

function getDefaultProgress(): UserProgress {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: "",
    totalScans: 0,
    highScoreCount: 0,
    totalFavorites: 0,
    artGenerated: 0,
    completedMissions: [],
    badges: [],
  };
}

function loadProgress(): UserProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...getDefaultProgress(), ...JSON.parse(stored) };
  } catch {}
  return getDefaultProgress();
}

function saveProgress(progress: UserProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function useMissions() {
  const [progress, setProgress] = useState<UserProgress>(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const addXP = useCallback((amount: number) => {
    setProgress(prev => {
      const newXP = prev.xp + amount;
      const newLevel = getLevel(newXP);
      return { ...prev, xp: newXP, level: newLevel };
    });
  }, []);

  const recordScan = useCallback((anomalyScore: number) => {
    setProgress(prev => {
      const today = new Date().toDateString();
      const lastDate = prev.lastActiveDate;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      let newStreak = prev.streak;
      if (lastDate !== today) {
        newStreak = lastDate === yesterday ? prev.streak + 1 : 1;
      }

      const newProgress = {
        ...prev,
        totalScans: prev.totalScans + 1,
        highScoreCount: anomalyScore >= 8 ? prev.highScoreCount + 1 : prev.highScoreCount,
        lastActiveDate: today,
        streak: newStreak,
        xp: prev.xp + 25 + (anomalyScore >= 7 ? 15 : 0) + (anomalyScore >= 9 ? 25 : 0),
      };
      newProgress.level = getLevel(newProgress.xp);
      return newProgress;
    });
  }, []);

  const recordArtGeneration = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      artGenerated: prev.artGenerated + 1,
      xp: prev.xp + 15,
      level: getLevel(prev.xp + 15),
    }));
  }, []);

  const recordFavorite = useCallback(() => {
    setProgress(prev => ({
      ...prev,
      totalFavorites: prev.totalFavorites + 1,
      xp: prev.xp + 5,
      level: getLevel(prev.xp + 5),
    }));
  }, []);

  // Check for new badges
  const earnedBadges = BADGES.filter(badge => {
    if (progress.badges.includes(badge.id)) return false;
    const req = badge.requirement as Record<string, number>;
    return Object.entries(req).every(([key, val]) => {
      return (progress as unknown as Record<string, unknown>)[key] as number >= val;
    });
  });

  // Auto-award new badges
  useEffect(() => {
    if (earnedBadges.length > 0) {
      setProgress(prev => ({
        ...prev,
        badges: [...prev.badges, ...earnedBadges.map(b => b.id)],
        xp: prev.xp + earnedBadges.length * 50,
        level: getLevel(prev.xp + earnedBadges.length * 50),
      }));
    }
  }, [earnedBadges.length]);

  return {
    progress,
    addXP,
    recordScan,
    recordArtGeneration,
    recordFavorite,
    earnedBadges,
    rank: getRank(progress.level),
  };
}
