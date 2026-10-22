import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  return <CapabilityCard<LeaderboardResponse>
    title="Leaderboard"
    description="Compare team point totals."
    endpoint="/api/leaderboard"
    emptyMessage="No leaderboard scores are available yet."
    isEmpty={({ leaderboard }) => leaderboard.length === 0}
    renderData={({ leaderboard }) => <ol>{leaderboard.map(({ teamName, totalPoints, rank }) =>
      <li key={teamName}>Rank {rank}: {teamName} — {totalPoints} points</li>
    )}</ol>}
  />;
}
