export function shuffle(array) {
  const cloned = [...array];
  let currentIndex = cloned.length;
  while (currentIndex !== 0) {
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [cloned[currentIndex], cloned[randomIndex]] = [cloned[randomIndex], cloned[currentIndex]];
  }
  return cloned;
}

export function getRandomQuote(difficulty, data, excludeId = null) {
  const list = data[difficulty] || [];
  if (!list.length) return null;
  if (list.length === 1) return list[0];

  const filtered = excludeId ? list.filter(item => item.id !== excludeId) : list;
  const pool = filtered.length > 0 ? filtered : list;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  if (mins > 0) {
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  }
  return `${secs}s`;
}

export function getRankBadge(wpm, accuracy) {
  if (wpm >= 110 && accuracy >= 95) {
    return { title: 'Godspeed Legend', tier: 'S+', icon: '👑', color: '#f59e0b' };
  }
  if (wpm >= 90) {
    return { title: 'Cyber Speedster', tier: 'S', icon: '⚡', color: '#8b5cf6' };
  }
  if (wpm >= 70) {
    return { title: 'Pro Typist', tier: 'A', icon: '🔥', color: '#06b6d4' };
  }
  if (wpm >= 50) {
    return { title: 'Fast Typist', tier: 'B', icon: '🚀', color: '#10b981' };
  }
  if (wpm >= 30) {
    return { title: 'Casual Typist', tier: 'C', icon: '⌨️', color: '#3b82f6' };
  }
  return { title: 'Beginner Cadet', tier: 'D', icon: '🌱', color: '#94a3b8' };
}