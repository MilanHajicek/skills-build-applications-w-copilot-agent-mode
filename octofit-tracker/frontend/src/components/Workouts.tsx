import { CapabilityCard } from './CapabilityCard.js';

type Workout = { _id?: string; title: string; focus: string; minutes: number; difficulty: string; reason: string };
type WorkoutsResponse = { suggestions: Workout[] };

export default function Workouts() {
  const userEmail = 'mona@example.com';
  return <CapabilityCard<WorkoutsResponse>
    title="Workout suggestions"
    description={`Recommendations for ${userEmail}, based on fitness goals and recent activity.`}
    endpoint={`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`}
    emptyMessage="No workout suggestions are available yet."
    isEmpty={({ suggestions }) => suggestions.length === 0}
    renderData={({ suggestions }) => <ul>{suggestions.map((workout, index) => <li key={workout._id ?? index}>
      <strong>{workout.title}</strong> — {workout.focus}, {workout.minutes} minutes ({workout.difficulty}).
      <p>{workout.reason}</p>
    </li>)}</ul>}
  />;
}
