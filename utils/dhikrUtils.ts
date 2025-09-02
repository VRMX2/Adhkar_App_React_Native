export const getDhikrCategoryIcon = (category: string) => {
  switch (category) {
    case 'morning':
      return '🌅';
    case 'evening':
      return '🌙';
    case 'general':
      return '⭐';
    case 'sleeping':
      return '😴';
    default:
      return '📿';
  }
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getStreakMessage = (days: number): string => {
  if (days === 0) return 'Start your dhikr journey today!';
  if (days === 1) return 'Great start! Keep it up!';
  if (days < 7) return `${days} days strong! 💪`;
  if (days < 30) return `Amazing ${days}-day streak! 🔥`;
  if (days < 100) return `Incredible ${days}-day streak! 🌟`;
  return `Mashallah! ${days} days of consistency! 👑`;
};

export const calculateProgress = (current: number, target: number): number => {
  return Math.min((current / target) * 100, 100);
};

export const shouldShowReminder = (lastActiveDate: Date): boolean => {
  const now = new Date();
  const hoursSinceLastActive = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60);
  return hoursSinceLastActive >= 24; // Show reminder after 24 hours
};