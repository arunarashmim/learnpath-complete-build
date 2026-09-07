
# LearnPath — Complete MEVN Demo

LearnPath is a MEVN-stack prototype implementing the product loop from the supplied product specification:

**Assess → Diagnose → Group → Act → Reassess**

## Included product areas

- Teacher experience: class dashboard, quick assessment, diagnosis, automatic learning groups, today's action, intervention start/completion, reassessment and progress.
- Student experience: current demonstrated level, next learning goal, practice activity and learning path.
- Head Teacher: school learning pulse, assessment/intervention/reassessment coverage and persistent skill gaps.
- Education Official: district/block-style aggregated view, priority schools/skills and CSV export designed for Power BI ingestion.
- Reading and arithmetic skill levels.
- Approved intervention library with guided steps.
- Teacher recommendation control through explicit action selection.
- AI decision-support simulation: activity matching, teacher action brief and persistent-gap signal.
- Role-based navigation and privacy messaging.
- Audit events for assessment/intervention/reassessment actions.
- Offline indicator and demo fallback so the core prototype remains viewable without MongoDB.
- MongoDB/Mongoose models are included for Student, Assessment, Intervention, User and AuditLog.

## Requirements

- Node.js 18+ (20+ recommended)
- npm
- MongoDB is optional for the included demo mode; install/run it if you want a MongoDB connection.

## Run in VS Code

Open the extracted `learnpath-complete` folder in VS Code.

### 1. Install dependencies

```bash
npm install
npm run install:all
```

### 2. Start the application

```bash
npm run dev
```

Open **http://localhost:5173**.

The Express API runs on **http://localhost:5000**.

### 3. Optional MongoDB

Copy:

```text
server/.env.example → server/.env
```

Set `MONGODB_URI` if needed, start MongoDB, then run:

```bash
npm run seed
npm run dev
```

The UI can still be explored when MongoDB is unavailable because the demo dataset is kept in the API process.

## Demo roles

Use the login screen to enter as:

- Teacher
- Student
- Head Teacher
- Education Official

## Demonstration path

1. Enter as **Teacher**.
2. Open **Assessment** and run a quick reading/arithmetic check.
3. The result is mapped to a demonstrated level and diagnosis.
4. Open **Groups & Actions** to see automatic grouping and approved activities.
5. Start an intervention.
6. Mark it complete.
7. Reassess a learner through **Assessment**.
8. The learner's level changes and the grouping reflects the new state.
9. Open **Analytics** for learning and operating metrics.
10. Switch to **Head Teacher** for school-level signals.
11. Switch to **Education Official** for aggregated district signals and CSV export.
12. Open **Governance** to see role/privacy language, API status and audit events.

## Demo Login Credentials

LearnPath has four role-based workspaces. Select the appropriate role on the login page before signing in.

| Role | Email | Password |
|--------------------|-----------------------------|----------------|
| Teacher            | `teacher@learnpath.com`     | `Teacher@123`  |
| Head Teacher       | `headteacher@learnpath.com` | `Head@123`     |
| Education Official | `official@learnpath.com`    | `Official@123` |
| Student            | `tom@gmail.com`             | `tom123`       |

### Student Registration

Students can also create a new account through **New Registration** in the Student section.

Teacher, Head Teacher and Education Official accounts are restricted to their respective workspaces. Students cannot register themselves as staff or access teacher, school-level or official information.

### Demo Student

A sample student account is provided for testing:

- **Name:** Tom
- **Email:** `tom@gmail.com`
- **Password:** `tom123`
- **Role:** Student

## API endpoints

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/students`
- `GET /api/students/:id`
- `POST /api/assessments`
- `GET /api/groups`
- `GET /api/interventions`
- `POST /api/interventions/start`
- `POST /api/interventions/:id/complete`
- `POST /api/reassess`
- `GET /api/analytics`
- `GET /api/official`
- `GET /api/action-brief`
- `GET /api/audit`
- `GET /api/export`

## Important prototype boundary

This is a runnable product demonstration, not a production deployment. Authentication is represented by role selection for demo purposes; the AI functions are bounded decision-support simulations; the Power BI output is a CSV export rather than a live Power BI tenant connection; and offline support is represented by an offline-aware UI/demo fallback rather than a full field-device sync protocol. These boundaries keep the prototype honest while covering the product behaviors described in the specification.
