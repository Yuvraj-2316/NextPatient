# NextPatient 🏥

**NextPatient** is a smart, priority-based patient queue management system designed for clinics and hospitals.

Instead of following a simple **First-Come, First-Served (FCFS)** approach, NextPatient evaluates a patient's reported symptoms, pain level, breathing difficulty, age, symptom duration, and critical symptoms to calculate a **triage priority score**. Patients are then dynamically arranged in the waiting queue so that higher-priority cases can be attended to first.

> ⚠️ **Non-Diagnostic Disclaimer:** NextPatient does **not** diagnose medical conditions. It is an educational/prototype system designed to prioritize the waiting-room queue using predefined heuristics and self-reported information. It is not a substitute for professional medical judgment.

---

## 🎯 Problem Statement

Traditional clinic and hospital waiting rooms often use a **First-Come, First-Served** approach.

While FCFS is simple, it does not account for the urgency of different patients.

For example, a patient experiencing severe chest pain may arrive after a patient requiring a routine consultation. Serving strictly according to arrival time could result in the more urgent patient waiting unnecessarily.

### NextPatient addresses this problem by:

1. Collecting basic demographic and symptom information.
2. Calculating a triage priority score using predefined medical heuristics.
3. Maintaining a dynamically prioritized waiting queue.
4. Increasing a patient's effective priority as their waiting time increases.
5. Providing separate interfaces for receptionists, doctors, and administrators.
6. Maintaining served-patient history for future reference.

---

# ✨ Features

## 1. Smart Triage Scoring

The system calculates a patient's initial triage score using:

* Pain intensity
* Breathing difficulty
* Fever
* Fainting
* Chest pain
* Bleeding
* Vomiting
* Dizziness
* Age
* Symptom duration

### Base Score

The initial score starts with:

```text
Pain Score + Breathing Difficulty Score
```

Both values range from **1–5**.

### Symptom Bonuses

| Symptom    | Score |
| ---------- | ----: |
| Fever      |   +10 |
| Fainting   |   +30 |
| Chest Pain |   +40 |
| Bleeding   |   +35 |
| Vomiting   |   +10 |
| Dizziness  |   +15 |

### Age Bonus

| Age     | Bonus |
| ------- | ----: |
| 60–79   |    +5 |
| 80+     |   +10 |
| Under 5 |   +10 |

### Duration Adjustment

Symptom duration is currently incorporated into the scoring logic:

```text
Acute + score >= 40  → +15
Chronic + score >= 40 → -5
Chronic + score < 40 → -10
```

Therefore, the current implementation **does factor symptom duration into the triage score**.

---

# ⏱️ Dynamic Priority & Anti-Starvation

A patient's priority does not remain completely static after entering the queue.

The system calculates an **effective score**:

```text
Effective Score =
Initial Triage Score + Waiting-Time Bonus
```

For the current prototype:

```text
Every 10 seconds of waiting → +10 effective score
```

The 10-second interval is intentionally used for testing and demonstration.

This prevents lower-priority patients from potentially waiting indefinitely while higher-priority patients continuously enter the queue.

---

# 📋 Priority Queue

NextPatient uses a JavaScript array to represent the waiting queue.

When a new patient enters:

1. The current queue is retrieved.
2. The new patient's effective score is calculated.
3. Existing patients are checked sequentially.
4. The new patient is inserted at the appropriate position.
5. If the score is equal, arrival time is used as a tie-breaker.
6. The updated queue is saved to the backend.

### Priority Rule

```text
Higher Effective Score
        ↓
Served Earlier
```

### Equal Score

When two patients have the same effective score:

```text
Earlier Arrival Time
        ↓
Higher Priority
```

This provides a **priority-based queue with FCFS tie-breaking**.

The project uses custom insertion logic instead of sorting the complete array every time a patient arrives.

---

# 🏥 Patient Flow

The complete patient lifecycle is:

```text
Patient Registration
        ↓
Input Validation
        ↓
Triage Score Calculation
        ↓
Patient Object Creation
        ↓
Priority Queue
        ↓
Highest Priority Patient
        ↓
Currently Serving
        ↓
Doctor Consultation
        ↓
Doctor Notes
        ↓
Status = Served
        ↓
Served History
        ↓
Next Patient
```

---

# 👥 User Roles

## Receptionist

The receptionist/intake staff can:

* Register patients
* Enter demographic information
* Record symptoms
* Enter pain and breathing severity
* Select symptom duration
* Add patients to the queue
* View the current waiting queue

---

## 👨‍⚕️ Doctor

The doctor dashboard allows doctors to:

* View the currently serving patient
* View patient symptoms
* View patient priority information
* Search previous patient visits
* Add treatment/doctor notes
* Mark a patient as served
* Automatically call the next patient

---

## 👨‍💼 Admin

The admin dashboard provides:

* Today's statistics
* Currently waiting count
* Patients served today
* Emergency/urgent case statistics
* Staff management
* Staff creation and deletion
* Patient history search
* Complaint/feedback management

---

# 🔐 Authentication & Role Management

The Phase 1 implementation provides basic authentication and role-based access.

Supported roles include:

```text
Admin
Doctor
Receptionist
```

After login, the user's role determines which dashboard they can access.

The application uses:

* `sessionStorage`
* `localStorage`
* Client-side role checks

### Remember Me

If **Remember Me** is enabled, the login information can persist using `localStorage`.

Otherwise, the application uses `sessionStorage` for the current browser session.

> ⚠️ **Security Note:** This authentication system is intended for a prototype. It is not production-grade authentication because credentials and authorization are handled on the client side. A production version should use server-side authentication, password hashing, secure sessions/JWT, HTTPS, and backend authorization.

---

# 🌐 Backend

Phase 1 uses **JSON Server** as a lightweight REST API backend.

The backend data is stored in:

```text
server/db.json
```

JSON Server exposes the JSON data through REST endpoints.

The frontend communicates with the backend using the browser's **Fetch API**.

### Backend URL

```text
http://localhost:5000
```

### Main Resources

```text
/queueData
/currentlyServingData
/servedHistoryData
/users
/complaints
```

---

# 🔄 API Communication

The project uses standard HTTP methods.

### GET

Used to retrieve information.

Examples:

```text
GET /queueData
GET /users
GET /servedHistoryData
```

### POST

Used to create new resources.

Examples:

```text
POST /users
POST /complaints
```

### PUT

Used to update existing resources.

Examples:

```text
PUT /queueData
PUT /currentlyServingData
PUT /servedHistoryData
```

### DELETE

Used to remove resources such as staff accounts.

---

# 🧠 JavaScript Architecture

The Phase 1 JavaScript code is divided according to functionality.

```text
phase1/js/
│
├── api.js
├── auth.js
├── admin.js
├── doctor.js
├── index.js
├── intake.js
├── login.js
├── signup.js
└── contact.js
```

### `api.js`

Central API and business-logic file.

Responsibilities include:

* Triage score calculation
* Effective score calculation
* Queue retrieval
* Queue updates
* Served history
* Currently serving patient
* User retrieval
* Phone-based patient search
* Daily statistics
* Priority queue insertion
* Queue reordering
* Automatic next-patient calling
* Complaint API operations

---

### `intake.js`

Handles:

* Patient intake form
* Input validation
* Reading symptom selections
* Creating patient objects
* Adding patients to the queue
* Queue rendering
* Pain/breathing slider updates

---

### `doctor.js`

Handles:

* Doctor dashboard
* Currently serving patient
* Patient history
* Patient search
* Doctor notes
* Marking patients as served
* Calling the next patient

---

### `admin.js`

Handles:

* Admin dashboard
* Statistics
* Staff management
* Staff deletion
* Patient history
* Complaint management
* Dashboard section navigation

---

### `auth.js`

Handles:

* Login state
* Logout
* Role-based access control

---

### `login.js`

Handles:

* Login form
* User credential matching
* Remember Me functionality
* Role-based redirection

---

### `signup.js`

Handles:

* Initial account creation/signup functionality

---

### `contact.js`

Handles:

* Staff complaints
* Feedback submission

---

# 🧮 Core Triage Algorithm

The main scoring function is:

```javascript
calculateTriageScore()
```

Conceptually:

```text
score =
    pain
    + breathing
    + symptom bonuses
    + age bonus
    + duration adjustment
```

After calculating the initial score, the system calculates the effective score:

```text
effectiveScore =
    triageScore
    + waitingTimeBonus
```

This effective score is used for queue ordering.

---

# 🔀 Queue Insertion Algorithm

The project does not fully sort the queue every time a new patient arrives.

Instead, it performs **custom insertion**.

Conceptually:

```text
Get existing queue
        ↓
Calculate new patient's effective score
        ↓
Compare with each existing patient
        ↓
Higher score?
        ↓
Insert before that patient
        ↓
If equal score:
    Compare arrival time
        ↓
Earlier arrival → insert first
        ↓
If no position found:
    Add patient to end
```

### Complexity

For a queue of `n` patients:

```text
Worst-case insertion: O(n)
```

This approach is appropriate for a prototype because the queue is maintained incrementally instead of sorting the entire array after every insertion.

---

# 🔄 Queue Refresh

Waiting time changes continuously.

Therefore, a patient who initially had a lower score may eventually receive a higher effective score because of the waiting-time bonus.

The application periodically calls:

```javascript
refreshQueueOrder()
```

The current prototype refreshes the queue every:

```text
10 seconds
```

This keeps the queue dynamically updated.

---

# 📞 Automatic Next Patient

When the doctor finishes serving a patient:

```text
Currently Serving
        ↓
Patient marked as Served
        ↓
Saved to Served History
        ↓
Currently Serving = null
        ↓
Get Queue
        ↓
Remove first patient
        ↓
Set as Currently Serving
```

The first patient is selected using:

```javascript
queue.shift()
```

Because the queue is already maintained in priority order, the first patient has the highest current priority.

---

# 💾 Data Model

The local backend stores information in `db.json`.

Major resources include:

```text
queueData
currentlyServingData
servedHistoryData
users
complaints
```

### Patient Object

A patient contains information such as:

```text
id
name
age
phone
triageScore
symptoms
duration
arrivalTime
status
```

After treatment, additional information such as:

```text
servedTime
doctorNotes
```

can be stored.

---

# 📊 Daily Statistics

The system can calculate:

* Total patients served today
* Emergency cases today
* Number of patients currently waiting

The system determines whether a visit occurred today by comparing:

```text
Day
Month
Year
```

of the visit timestamp with the current date.

---

# 🛡️ Current Limitations

Phase 1 is a functional prototype and has several limitations.

### 1. Client-Side Authentication

Authentication and role checks are primarily handled in the frontend.

### 2. Plain-Text Prototype Credentials

The Phase 1 database is intended for demonstration and does not implement production-grade password hashing.

### 3. Self-Reported Information

The triage score depends on the information entered by the patient/intake staff.

A user could potentially exaggerate symptoms.

### 4. JSON Server

JSON Server is excellent for prototyping but is not intended to replace a production database/backend architecture.

### 5. Concurrency

Multiple users updating the same queue simultaneously could cause conflicting updates.

### 6. No Medical Diagnosis

The system only determines **queue priority** and does not diagnose diseases.

---

# 🚀 Future Scope — Phase 2

The planned Phase 2 architecture can improve the prototype by introducing:

* React frontend
* Express.js backend
* MongoDB database
* JWT-based authentication
* Server-side authorization
* Password hashing
* Secure API endpoints
* Better input validation
* Production-grade queue management
* Improved concurrency handling
* Scalable deployment
* Better audit logging
* Staff verification of triage information

---

# 🛠️ Technologies Used

### Frontend

* HTML5
* CSS3
* Vanilla JavaScript
* DOM APIs
* Fetch API

### Backend

* Node.js
* JSON Server
* REST API

### Data Storage

* JSON database (`db.json`)

### Development

* Git
* GitHub
* VS Code / Live Server

---

# 🚀 How to Run

## Prerequisites

Install:

* Node.js
* npm
* A modern web browser

---

## 1. Start the Backend

Open a terminal:

```bash
cd server
npm install
npx json-server --watch db.json --port 5000
```

The backend will run at:

```text
http://localhost:5000
```

---

## 2. Start the Frontend

From the project root:

```bash
npx http-server phase1
```

Alternatively, use **VS Code Live Server** to serve the `phase1` folder.

Opening `phase1/index.html` directly may also work, but using a local development server is recommended to avoid browser/CORS issues.

---

# 📂 Project Structure

```text
NextPatient/
│
├── README.md
├── .gitignore
│
├── server/
│   ├── db.json
│   └── package.json
│
└── phase1/
    │
    ├── index.html
    ├── intake.html
    ├── doctor.html
    ├── admin.html
    ├── login.html
    ├── signup.html
    │
    ├── css/
    │   └── ...
    │
    └── js/
        ├── api.js
        ├── auth.js
        ├── admin.js
        ├── doctor.js
        ├── index.js
        ├── intake.js
        ├── login.js
        ├── signup.js
        └── contact.js
```

---

# 🧪 Example

Suppose a patient has:

```text
Pain = 4
Breathing Difficulty = 3
Fever = Yes
Chest Pain = Yes
Age = 65
Duration = Acute
```

Initial calculation:

```text
Pain + Breathing
= 4 + 3
= 7

Fever
= +10

Chest Pain
= +40

Age 65
= +5

Subtotal
= 62
```

Because the case is acute and the score is at least 40:

```text
+15
```

Final triage score:

```text
77
```

The patient therefore receives a high priority in the queue.

If the patient waits, their **effective score** can increase further because of the waiting-time bonus.

---

# 📌 Key Design Principle

NextPatient does **not** replace medical professionals.

Its purpose is to improve the organization of the waiting room by combining:

```text
Urgency
   +
Waiting Time
   +
Priority Queue
   +
Staff Dashboard
```

This allows the system to prioritize patients more intelligently than a simple FCFS queue while keeping the final medical decision with qualified healthcare professionals.

---

# 👨‍💻 Project Status

**Phase 1 — Functional Prototype**

Current Phase 1 stack:

```text
HTML + CSS + Vanilla JavaScript
              ↓
          Fetch API
              ↓
         JSON Server
              ↓
           db.json
```

**Phase 2 — Planned Production-Oriented Architecture**

```text
React
  ↓
Express.js
  ↓
MongoDB
  ↓
JWT Authentication
```

---

## ⚠️ Disclaimer

NextPatient is an educational software prototype.

The triage scoring system uses predefined heuristics and self-reported information. It should **not** be used to make real-world medical decisions, diagnose patients, or replace professional medical triage.
