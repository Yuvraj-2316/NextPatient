# NextPatient

NextPatient is a smart front-desk tool for clinics. Patients' self-reported symptoms and severity are turned into a **triage priority score**, and the waiting queue is ordered by **medical urgency** instead of arrival time, so critical cases are seen first.

> ⚠️ **Non-diagnostic disclaimer:** NextPatient does not diagnose medical conditions. It is an educational tool that decides waiting-room order from self-reported symptoms, severity, duration and risk factors. It is not a substitute for professional medical judgment.

**Live demo:** Frontend `<frontend-url>` · API `<render-url>/api/health`

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [Architecture (MVC)](#4-architecture-mvc)
5. [Folder Structure](#5-folder-structure)
6. [How to Run the Project](#6-how-to-run-the-project)
7. [Environment Variables](#7-environment-variables)
8. [Authentication and Roles](#8-authentication-and-roles)
9. [API Reference](#9-api-reference)
10. [Triage Scoring](#10-triage-scoring)
11. [Testing](#11-testing)
12. [Deployment](#12-deployment)
13. [Team](#13-team)

---

## 1. Problem Statement

Most clinic waiting rooms work on a first-come, first-served basis. In a medical setting this is risky: a patient with severe chest pain who arrives after someone with a mild cold should not have to wait behind them.

NextPatient fixes this by:

1. Collecting symptoms and basic details at the front desk.
2. Calculating a triage score on the server from pain level, breathing difficulty, critical symptoms, age, gender-specific risks and symptom duration.
3. Keeping a live, prioritised queue for staff, where waiting time slowly raises priority so mild cases are never left waiting forever.

---

## 2. Features

**Receptionist**
- Register patients with symptoms, pain and breathing sliders, and duration
- Live waiting queue, sorted by priority and refreshed every 10 seconds
- "Now Serving" banner, with the next patient called automatically
- ✏️ Edit a waiting patient's details (the score is recalculated) and 🗑️ remove a patient who left

**Doctor**
- Workstation with the current patient, their symptoms, triage score and past visits
- "Mark as Treated & Call Next" with treatment notes
- Patient lookup by phone number: one card per patient (family members can share a number), and a click opens that patient's visit history, earliest first

**Admin**
- Today's stats: patients served, currently waiting, emergencies
- Add, update (role / password reset) and remove staff accounts
- Patient history lookup
- Read and resolve complaints sent by staff

**Platform**
- REST API built with Express in the **MVC** pattern, with data stored in **MongoDB Atlas**
- **JWT authentication** with **role-based access** on every protected endpoint
- Passwords stored only as **bcrypt** hashes
- Responsive layout for desktop, tablet and mobile

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript (`fetch` API) |
| Backend | Node.js, Express 4 |
| Database | MongoDB Atlas with Mongoose 8 |
| Authentication | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` |
| Other | `cors`, `dotenv`, `nodemon` (development) |
| API testing | Thunder Client / Postman |
| Hosting | Render (backend) |

---

## 4. Architecture (MVC)

```
Browser (frontend/)
   │  fetch + "Authorization: Bearer <token>"
   ▼
Express app (backend/src/app.js)
   │
   ├── routes/        which URL goes to which controller, and which roles may call it
   ├── middleware/    auth.js (JWT + roles) · asyncHandler.js · errorHandler.js
   ├── controllers/   read the request, call services and models, send the response
   ├── services/      business rules: triage scoring, user creation and password rules
   └── models/        Mongoose schemas and validation (User, Patient, Complaint)
                         │
                         ▼
                   MongoDB Atlas
```

| MVC part | Where | Responsibility |
|---|---|---|
| **Model** | `backend/src/models/` | Data shape and validation (e.g. phone must be 10 digits, age 1–120) |
| **View** | `frontend/` | Pages the staff use |
| **Controller** | `backend/src/controllers/` | Handles each request and returns JSON |

**Key design decisions**

- **One `Patient` collection with a `status` field** (`waiting` → `serving` → `served`), instead of separate queue, serving and history lists. A visit is one record that moves through states.
- **Scoring runs on the server**, so the browser cannot send a fake priority.
- **Atomic updates** (`findOneAndUpdate` with a status condition) mean two staff clicking at the same time cannot call or overwrite the same patient.
- **One error handler** turns every error into JSON with the right status code: `400` invalid input, `401` not logged in, `403` wrong role, `404` not found, `409` duplicate username.

---

## 5. Folder Structure

```text
NextPatient/
├── README.md
├── .gitignore
├── backend/
│   ├── server.js                 entry point: checks env, connects to MongoDB, starts Express
│   ├── package.json
│   ├── .env.example              template for the required settings
│   ├── scripts/
│   │   └── test-triage.js        unit checks for the triage scoring rules
│   └── src/
│       ├── app.js                Express setup, CORS, routes, error handling
│       ├── config/db.js          MongoDB connection
│       ├── models/               User.js, Patient.js, Complaint.js
│       ├── services/             triage.js, userService.js
│       ├── middleware/           auth.js, asyncHandler.js, errorHandler.js
│       ├── controllers/          auth, user, queue, serving, visit, complaint
│       └── routes/               one route file per resource
└── frontend/
    ├── index.html                landing page
    ├── login.html / signup.html  staff login and first admin signup
    ├── intake.html               receptionist: registration + live queue
    ├── doctor.html               doctor workstation + patient lookup
    ├── admin.html                admin dashboard
    ├── contact.html              staff complaints / feedback
    ├── css/                      global.css, page styles, responsive.css
    └── js/
        ├── api.js                every backend call, sends the JWT
        ├── auth.js               logged-in user, logout, page access
        ├── patientLookup.js      lookup cards and visit history (doctor + admin)
        └── intake.js, doctor.js, admin.js, login.js, signup.js, contact.js
```

---

## 6. How to Run the Project

The project has two parts that run at the same time:

```
Browser  ──►  frontend (Live Server, port 5500)  ──►  backend (Express, port 5000)  ──►  MongoDB Atlas
```

### Step 1: Install the tools (one time)

| Tool | Why | Check it's installed |
|---|---|---|
| [Node.js](https://nodejs.org/) 18 or newer (LTS) | Runs the backend | `node -v` |
| npm (comes with Node.js) | Installs the backend packages | `npm -v` |
| [Git](https://git-scm.com/) | Downloads the project | `git --version` |
| [VS Code](https://code.visualstudio.com/) + the **Live Server** extension (by Ritwick Dey) | Serves the frontend | Extensions panel (`Ctrl + Shift + X`) |

### Step 2: Get the code

```bash
git clone https://github.com/Yuvraj-2316/NextPatient.git
cd NextPatient
```

Open the `NextPatient` folder in VS Code (**File → Open Folder**).

### Step 3: Create a MongoDB Atlas database (one time)

1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and create a **free (M0)** cluster.
2. **Database Access → Add New Database User:** choose a username and password (letters and numbers only, to keep the connection string simple), with the role **Read and write to any database**.
3. **Network Access → Add IP Address:** enter `0.0.0.0/0` (allow from anywhere) and confirm.
4. **Clusters → Connect → Drivers:** copy the connection string. Replace `<db_password>` with your password, and add the database name `nextpatient` after `.mongodb.net/`:

```
mongodb+srv://USERNAME:PASSWORD@your-cluster.mongodb.net/nextpatient?retryWrites=true&w=majority
```

The database and collections are created automatically the first time the app saves data.

### Step 4: Set up the backend

```bash
cd backend
npm install
```

Create the settings file `backend/.env` from the template:

```bash
# macOS / Linux / Git Bash
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Generate a random secret for signing login tokens:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Open `backend/.env` and fill it in (one value per line, no spaces around `=`, no quotes):

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@your-cluster.mongodb.net/nextpatient?retryWrites=true&w=majority
PORT=5000
FRONTEND_ORIGIN=
JWT_SECRET=paste-the-generated-secret-here
```

> 🔒 `.env` contains your secrets. It is listed in `.gitignore` and must never be committed or shared.

### Step 5: Start the backend

From the `backend` folder:

```bash
npm run dev
```

Expected output:

```
MongoDB connected: ... / database: nextpatient
NextPatient API running on http://localhost:5000
```

Open http://localhost:5000/api/health in the browser. It should show `{"status":"ok","database":"connected"}`.

Keep this terminal open while using the app. `npm run dev` restarts the server automatically when you save a file. Use `npm start` to run it without auto-restart, as on Render.

### Step 6: Start the frontend

1. In VS Code, open the `frontend` folder in the Explorer.
2. Right-click **`index.html`** → **Open with Live Server**.
3. The site opens at an address like `http://127.0.0.1:5500/frontend/index.html`.

The frontend calls the backend at `http://localhost:5000/api`. This address is set in one place: `API_BASE` at the top of `frontend/js/api.js`.

### Step 7: Create the first accounts

1. Go to **`signup.html`** and create the **admin** account. Admin signup only works while no admin exists yet.
2. Log in as admin, open **Add Staff**, and create at least one **doctor** and one **receptionist**.

### Step 8: Try the full flow

| Log in as | Do this |
|---|---|
| Receptionist | Register a few patients (give one Chest Pain) and watch the queue sort by priority |
| Doctor | Write notes and click **Mark as Treated & Call Next**, then try **Patient Lookup** with a phone number |
| Admin | Check today's stats, staff management and complaints |

Use **Logout** to switch users, or open a second role in a private/incognito window.

### Stopping the project

- Backend: click in its terminal and press `Ctrl + C`.
- Frontend: click **Port : 5500** in the VS Code status bar to stop Live Server.

### Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `MONGODB_URI is not set` | `.env` missing or misnamed | It must be `backend/.env`, named exactly `.env` (not `.env.txt`) |
| `JWT_SECRET is not set` | Missing line in `.env` | Add `JWT_SECRET=...` (Step 4) |
| `bad auth` / `Authentication failed` | Wrong database username or password | Check the connection string; remove any `<` `>` around the values |
| `Could not connect to any servers` | IP not allowed in Atlas | Atlas → Network Access → add `0.0.0.0/0` and wait a minute |
| `EADDRINUSE :5000` | Port 5000 already in use | Close the other program or set `PORT=5001` in `.env` (and update `API_BASE`) |
| Page loads but shows no data, Console says `Failed to fetch` | Backend not running | Start it with `npm run dev` (Step 5) |
| Sent back to the login page | No login, or the token expired (8 hours) | Log in again |
| "You don't have access to this page" | Logged in with a different role | Log in with the role for that page |
| Old design or behaviour after an update | Browser cache | Hard refresh with `Ctrl + Shift + R` |

---

## 7. Environment Variables

Set in `backend/.env` locally, and in the Render dashboard when deployed.

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string, including the database name (`.../nextpatient?...`) |
| `JWT_SECRET` | ✅ | Long random string used to sign login tokens. The server refuses to start without it |
| `PORT` | | Local port (default `5000`). Render sets it automatically |
| `FRONTEND_ORIGIN` | | Allowed frontend URL(s) for CORS, comma-separated. Empty allows all (development only) |

---

## 8. Authentication and Roles

1. `POST /api/auth/login` checks the password against its bcrypt hash and returns a **signed JWT** (valid for 8 hours) plus the user.
2. The frontend stores the user and token in `sessionStorage` (or `localStorage` with "Remember me") and sends `Authorization: Bearer <token>` with every request.
3. On every protected request the server verifies the token's signature and expiry, loads the user fresh from the database, and checks the role.

Because the user is reloaded on each request, **deleting a staff member or changing their role takes effect immediately**, even if they still hold an old token. If a token is missing, edited or expired, the API answers `401` and the frontend logs the user out.

| | Receptionist | Doctor | Admin |
|---|:---:|:---:|:---:|
| Register, edit and remove waiting patients | ✅ | | Remove only |
| View queue and "Now Serving" | ✅ | ✅ | ✅ |
| Call the next patient | ✅ | ✅ | |
| Finish a visit, edit visit notes | | ✅ | |
| Patient history, lookup and stats | | ✅ | ✅ |
| Send complaints | ✅ | ✅ | ✅ |
| Read and resolve complaints | | | ✅ |
| Manage staff | | | ✅ |

---

## 9. API Reference

Base URL: `http://localhost:5000/api` locally, or `<render-url>/api` when deployed.
🔒 = requires `Authorization: Bearer <token>`.

### Auth (public)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Body `{ username, password }` → `{ token, user }` |
| `POST` | `/auth/register-admin` | Create the first admin. `403` once an admin exists |
| `GET` | `/users/admin-exists` | `{ adminExists: true / false }` for the signup page |

### Queue 🔒

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/queue` | all | Waiting patients, highest priority first, with `effectiveScore` |
| `POST` | `/queue` | receptionist | Add a patient. The server calculates the triage score |
| `PUT` | `/queue/:id` | receptionist | Replace a waiting patient's details. The score is recalculated |
| `DELETE` | `/queue/:id` | receptionist, admin | Remove a waiting patient |
| `POST` | `/queue/next` | receptionist, doctor | Call the highest-priority patient if nobody is being served |

Patient body for `POST` / `PUT`:

```json
{
  "name": "Rahul Sharma",
  "age": 67,
  "phone": "9876543210",
  "gender": "Male",
  "pain": 5,
  "breathing": 4,
  "symptoms": ["Chest Pain", "Dizziness"],
  "duration": "acute"
}
```

Allowed values: `gender` = `Male`, `Female`, `Other` · `duration` = `acute`, `short_term`, `medium_term`, `chronic` · `symptoms` = `Fever`, `Fainting / Loss of Consciousness`, `Chest Pain`, `Severe Bleeding`, `Vomiting`, `Dizziness` · `pain` and `breathing` = 1–5.

### Serving 🔒

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `GET` | `/serving` | all | `{ patient }` currently with the doctor, or `null` |
| `POST` | `/serving/complete` | doctor | Body `{ doctorNotes }`. Finishes the visit and moves it to history |

### Visits 🔒 (doctor, admin)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/visits` | Finished visits, newest first. Optional `?phone=`, `&name=`, `&order=asc` |
| `GET` | `/visits/patients?phone=` | One entry per patient on that phone number, with visit count and first/last visit |
| `GET` | `/visits/stats?tzOffset=-330` | Served today, emergencies today, currently waiting |
| `PATCH` | `/visits/:id` | **Doctor only.** Body `{ doctorNotes }`. Only the notes can change |

### Complaints 🔒

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| `POST` | `/complaints` | all | Body `{ subject, message }`. The sender is taken from the token |
| `GET` | `/complaints` | admin | All complaints, newest first |
| `DELETE` | `/complaints/:id` | admin | Resolve a complaint |

### Users 🔒 (admin)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | Staff list (never includes passwords) |
| `POST` | `/users` | Body `{ username, password, role }`, where role is `doctor` or `receptionist` |
| `PATCH` | `/users/:id` | Body `{ role }` and/or `{ password }`. Admin accounts cannot be changed |
| `DELETE` | `/users/:id` | Remove a staff member. Admin accounts cannot be deleted |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | `{ status: "ok", database: "connected" }` |

---

## 10. Triage Scoring

Implemented in `backend/src/services/triage.js`.

| Factor | Points |
|---|---|
| Pain + breathing difficulty | 1–5 each |
| Fever / Vomiting | +10 each |
| Dizziness | +15 |
| Fainting | +30 |
| Severe bleeding | +35 |
| Chest pain | +40 |
| Age 60–79 | +5 |
| Age 80+ or under 5 | +10 |
| Acute duration, score ≥ 40 | +15 |
| Chronic duration | −5 (score ≥ 40) or −10 |
| Female with severe bleeding | +15 (possible obstetric emergency) |

**Anti-starvation:** every 10 seconds of waiting adds +10 to a patient's *effective* score (a short interval chosen for demos; raise `WAIT_INTERVAL_MS` for real use). Patients with equal scores are seen in arrival order. A score of **60 or more** counts as an emergency in the stats.

---

## 11. Testing

**Triage rules** (no database needed):

```bash
cd backend
node scripts/test-triage.js
```

**API testing:** every endpoint was tested with Thunder Client / Postman, against both the local server and the deployed API. The collection is in `backend/postman/<collection-file>.json`. Import it, set the `baseUrl` variable, log in once, and put the returned token in the `token` variable.

Suggested checks:
- Each role gets `200` on allowed endpoints and `403` on the others, and requests without a token get `401`
- Invalid input returns `400` with a clear message (e.g. a 7-digit phone number)
- A duplicate username returns `409`
- Editing or deleting a token's text makes the server answer `401`

---

## 12. Deployment

### Backend on Render

1. **New → Web Service**, then connect this GitHub repository.
2. Settings:

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |

3. Environment variables: `MONGODB_URI`, `JWT_SECRET` (a new random value), and `FRONTEND_ORIGIN` (the deployed frontend URL).
4. In MongoDB Atlas → **Network Access**, allow `0.0.0.0/0`, because Render's IP address changes.
5. After deploying, set `API_BASE` in `frontend/js/api.js` to `<render-url>/api`.

On Render's free tier the server sleeps after 15 minutes of inactivity, so the first request can take 30–60 seconds.

---

## 13. Team

| Member | GitHub |
|---|---|
| `<name>` | [@Yuvraj-2316](https://github.com/Yuvraj-2316) |
| `<name>` | [@AashnaTyagi](https://github.com/AashnaTyagi) |
| `<name>` | [@teekshannayyar](https://github.com/teekshannayyar) |

Phase 1 used a `json-server` mock backend. The original phase 1 code is kept in the git history.