// Deterministic hash from string for consistent mock values
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function calculateBMI(athlete) {
  if (!athlete.heightInCm || !athlete.weightInKg) return null;
  return (athlete.weightInKg / Math.pow(athlete.heightInCm / 100, 2)).toFixed(1);
}

export function getHealthRisk(athlete) {
  if (athlete.hasHealthIssues) return { level: 'high', label: 'At Risk', color: 'red' };
  const bmi = calculateBMI(athlete);
  if (!bmi) return { level: 'low', label: 'Ready', color: 'green' };
  if (bmi < 18.5 || bmi > 30) return { level: 'medium', label: 'Monitor', color: 'amber' };
  return { level: 'low', label: 'Ready', color: 'green' };
}

// Computed/mock values for fields not yet available from backend
// Uses deterministic hash so the same athlete always gets the same values

export function getFormScore(athlete) {
  const h = hashCode(athlete.id || athlete.email || '');
  return ((h % 41) + 52) / 10; // 5.2 - 9.3 range
}

export function getFormTrend(athlete) {
  const h = hashCode((athlete.id || '') + 'trend');
  return h % 3 === 0 ? 'down' : 'up'; // mostly up
}

export function getConsistencyScore(athlete) {
  const h = hashCode((athlete.id || athlete.email || '') + 'c');
  return ((h % 46) + 48) / 10; // 4.8 - 9.3 range
}

export function getConsistencyTrend(athlete) {
  const h = hashCode((athlete.id || '') + 'ctrend');
  return h % 4 === 0 ? 'down' : 'up';
}

export function getAttendance7d(athlete) {
  const h = hashCode((athlete.id || athlete.email || '') + 'a7');
  return 43 + (h % 58); // 43-100%
}

export function getAttendance30d(athlete) {
  const h = hashCode((athlete.id || athlete.email || '') + 'a30');
  return 62 + (h % 39); // 62-100%
}

export function getTeamReadinessScore(athletes) {
  if (!athletes.length) return 0;
  const readyCount = athletes.filter(a => getHealthRisk(a).level === 'low').length;
  return Math.round((readyCount / athletes.length) * 100);
}

export function getLoadBalanceScore(sessions) {
  if (!sessions.length) return { score: 100, status: 'OK' };
  const totalExercises = sessions.reduce((sum, s) => sum + (s.exercises?.length || 0), 0);
  const completedExercises = sessions.reduce(
    (sum, s) => sum + (s.exercises?.filter(e => e.completed).length || 0), 0
  );
  const score = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 100;
  return { score, status: score >= 70 ? 'OK' : 'Warning' };
}

export function getSessionIntensity(session) {
  const completed = session.exercises?.filter(e => e.completed).length || 0;
  const total = session.exercises?.length || 1;
  const pct = (completed / total) * 100;
  if (pct >= 80) return 'Very High';
  if (pct >= 60) return 'High';
  if (pct >= 40) return 'Medium';
  return 'Low';
}

export function getRiskIcon(athlete) {
  const risk = getHealthRisk(athlete);
  const form = getFormScore(athlete);
  const attendance7d = getAttendance7d(athlete);

  if (risk.level === 'high' && form < 6) return 'critical';
  if (risk.level === 'high') return 'high';
  if (risk.level === 'medium') return 'medium';
  if (attendance7d < 60) return 'attendance';
  return 'none';
}
