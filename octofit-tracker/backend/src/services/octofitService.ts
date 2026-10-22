import { Activity, Team, User, Workout } from '../models/index.js';

type RecordValue = Record<string, unknown>;

function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function normalizeId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) {
    throw badRequest(`${field} must be a valid ID`);
  }
  return value;
}

function requiredText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw badRequest(`${field} is required`);
  }
  return value.trim();
}

function activityFocus(type: string): string {
  const normalized = type.trim().toLowerCase();
  if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking', 'swim', 'swimming'].includes(normalized)) return 'endurance';
  if (['strength', 'weightlifting', 'weights'].includes(normalized)) return 'strength';
  if (['yoga', 'stretch', 'stretching'].includes(normalized)) return 'mobility';
  return normalized;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw badRequest('Activity payload must be an object');
  const userId = normalizeId(input.userId, 'userId');
  const teamId = normalizeId(input.teamId, 'teamId');
  const type = requiredText(input.type, 'type');
  const minutes = input.minutes;
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1) {
    throw badRequest('minutes must be a positive whole number');
  }
  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user) throw badRequest('userId does not reference an existing user');
  if (!team) throw badRequest('teamId does not reference an existing team');

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw badRequest('Team payload must be an object');
  const name = requiredText(input.name, 'name');
  const mascot = requiredText(input.mascot, 'mascot');
  const memberIds = input.members ?? [];
  if (!Array.isArray(memberIds)) throw badRequest('members must be an array of user IDs');
  const members = memberIds.map((memberId) => normalizeId(memberId, 'member ID'));
  const existingMembers = await User.countDocuments({ _id: { $in: members } });
  if (existingMembers !== new Set(members).size) {
    throw badRequest('members must reference existing users');
  }
  const team = await Team.create({ name, mascot, members });
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: unknown; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);
  if (totals.length === 0) return [];
  const teams = await Team.find({ _id: { $in: totals.map(({ _id }) => _id) } }).select('_id name').lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));
  return totals
    .flatMap((total) => {
      const teamName = teamNames.get(String(total._id));
      return teamName ? [{ teamName, totalPoints: total.totalPoints }] : [];
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).select('type').lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const recentFocus = recentActivity ? activityFocus(recentActivity.type) : undefined;
  const matchingWorkouts = workouts
    .map((workout) => {
      const focus = workout.focus.trim().toLowerCase();
      const matchesGoal = focus === goal;
      const matchesActivity = focus === recentFocus;
      return {
        ...workout,
        reason: matchesGoal
          ? `Recommended because it supports your ${user.fitnessGoal} goal.`
          : matchesActivity && recentActivity
            ? `Recommended based on your recent ${recentActivity.type} activity.`
            : undefined,
        score: Number(matchesGoal) * 2 + Number(matchesActivity),
      };
    })
    .filter((workout) => workout.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title))
    .map(({ score: _score, ...workout }) => workout);
  return matchingWorkouts;
}

export { User };
