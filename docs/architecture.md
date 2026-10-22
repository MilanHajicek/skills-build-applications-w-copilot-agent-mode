# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- **Presentation tier**: Keep one React component per capability and use the shared API client for relative `/api` requests. Each route must expose an accessible loading status, a useful empty state, and an alert when a request fails; do not hide API errors or add presentation-tier data access.
- **Logic tier**: Keep Express routes thin and put validation and business rules in the service layer. Return JSON matching the API contract, use deliberate 4xx responses for invalid or unknown resources, and leave authentication out of scope.
- **Data tier**: Use the existing Mongoose models and references as the persistence boundary. Keep database configuration environment-driven with MongoDB on port `27017` by default. Seed representative users, teams, activities, and workouts idempotently without deleting unrelated records.
- **Activity tracking**: Accept only a valid user and team reference and a valid activity payload; reject malformed IDs, missing records, and invalid field values as 4xx responses before creating a document. Store references, type, minutes, a computed points value, and an occurrence date; list persisted activities through the API.
- **Team management**: Require a non-empty name, preserve the supplied name and mascot, and store member references. Reject invalid member references rather than allowing database cast errors to become 500 responses.
- **Leaderboard**: Sum persisted activity points per team, include each team's name, sort highest total first, and assign sequential 1-based ranks in the returned order. Return an empty list when there are no scored teams.
- **Workout suggestions**: Resolve the requested user by email and return 404 if there is no match. Use the user's fitness goal and recent activity to select a relevant workout, put the best match first, and include a reason tied to the goal or activity. Do not return a generic suggestion for an unknown user.

## Test plan

- Run the backend contract tests with an in-memory MongoDB; these do not require the local MongoDB service:
  - `npm run test:data --prefix octofit-tracker/backend` checks required model fields, references/defaults, and representative, idempotent seeding that preserves unrelated data. A failure points to a schema or seed-data contract regression.
  - `npm run test:api --prefix octofit-tracker/backend` checks endpoint payloads and status codes, activity and team validation, leaderboard totals/order/ranks, and user-specific workout recommendations. A failure points to a route/service behavior or persistence contract regression.
- Run the frontend contract tests with mocked API responses:
  - `npm test --prefix octofit-tracker/frontend` checks rendered API data, route loading/empty/error states, and the user-specific workout request. A failure points to a presentation, accessibility, or API-client integration regression.
- Run both builds/type checks:
  - `npm run build --prefix octofit-tracker/backend` checks backend TypeScript types.
  - `npm run build --prefix octofit-tracker/frontend` checks frontend TypeScript types and creates the Vite production bundle.
  - A build failure indicates a type, import, or bundling issue even if runtime contract tests pass.
- Run the backend tests and builds after backend/model changes; run the frontend tests and build after presentation/client changes. Run all five commands when a change crosses tiers.
