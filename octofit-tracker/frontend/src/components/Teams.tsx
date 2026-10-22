import { CapabilityCard } from './CapabilityCard.js';

type Team = { _id?: string; name: string; mascot: string; members: string[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  return <CapabilityCard<TeamsResponse>
    title="Teams"
    description="Manage teams and members."
    endpoint="/api/teams"
    emptyMessage="No teams have been created yet."
    isEmpty={({ teams }) => teams.length === 0}
    renderData={({ teams }) => <ul>{teams.map((team, index) => <li key={team._id ?? index}>
      {team.name} ({team.mascot}) — {team.members.length} members
    </li>)}</ul>}
  />;
}
