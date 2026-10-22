import { CapabilityCard } from './CapabilityCard.js';

type Activity = { _id?: string; type: string; minutes: number; points: number; occurredAt?: string };
type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  return <CapabilityCard<ActivitiesResponse>
    title="Activities"
    description="Track student activity minutes and points."
    endpoint="/api/activities"
    emptyMessage="No activities have been recorded yet."
    isEmpty={({ activities }) => activities.length === 0}
    renderData={({ activities }) => <ul>{activities.map((activity, index) => <li key={activity._id ?? index}>
      {activity.type}: {activity.minutes} minutes, {activity.points} points
    </li>)}</ul>}
  />;
}
