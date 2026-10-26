// Phase 2: all data comes from the Express + MongoDB backend (phase2/backend).
// Change only this line to switch between the local and the deployed backend.
const API_BASE = "http://localhost:5000/api";

// ===== Utility Functions =====

// The triage score and wait-time bonus are calculated on the server (services/triage.js).
// GET /api/queue sends effectiveScore with each patient; this keeps intake.js working unchanged.
function getEffectiveScore(patient) {
    if (typeof patient.effectiveScore === "number") {
        return patient.effectiveScore;
    }
    return patient.triageScore;
}

function isToday(timestamp) {
    let visitDate = new Date(timestamp);
    let now = new Date();

    return visitDate.getDate() === now.getDate() &&
           visitDate.getMonth() === now.getMonth() &&
           visitDate.getFullYear() === now.getFullYear();
}

// One place for every request: sends JSON, reads JSON,
// and throws an Error with the server's message when the status is not 2xx.
async function apiRequest(path, options = {}) {
    let fetchOptions = {
        method: options.method || "GET",
        headers: {},
        cache: "no-store"
    };

    if (options.body !== undefined) {
        fetchOptions.headers["Content-Type"] = "application/json";
        fetchOptions.body = JSON.stringify(options.body);
    }

    let response = await fetch(`${API_BASE}${path}`, fetchOptions);

    let data = null;
    try {
        data = await response.json();
    } catch (e) {
        // Response had no JSON body
    }

    if (!response.ok) {
        let error = new Error((data && data.message) || `Request failed (${response.status})`);
        error.status = response.status;
        throw error;
    }

    return data;
}

// ===== Queue =====

// Waiting patients, already sorted by priority on the server
async function getQueue() {
    return apiRequest("/queue");
}

// Adds a patient; the server calculates the triage score and position
async function addPatientToQueue(patientDetails) {
    return apiRequest("/queue", { method: "POST", body: patientDetails });
}

// Calls the next patient only if nobody is being served (same rule as phase 1)
async function autoCallNextIfAvailable() {
    return apiRequest("/queue/next", { method: "POST" });
}

// ===== Serving =====

async function getCurrentlyServing() {
    let data = await apiRequest("/serving");
    return data.patient;
}

// Saves the doctor's notes and moves the current patient to history
async function completeCurrentVisit(doctorNotes) {
    return apiRequest("/serving/complete", { method: "POST", body: { doctorNotes: doctorNotes } });
}

// ===== Visits & Stats =====

async function getServedHistory() {
    return apiRequest("/visits");
}

async function searchByPhone(phoneNumber) {
    return apiRequest(`/visits?phone=${encodeURIComponent(phoneNumber)}`);
}

// One entry per patient on this phone number (family members can share a number)
async function getPatientsByPhone(phoneNumber) {
    return apiRequest(`/visits/patients?phone=${encodeURIComponent(phoneNumber)}`);
}

// One patient's visits, earliest first
async function getPatientHistory(phoneNumber, patientName) {
    return apiRequest(`/visits?phone=${encodeURIComponent(phoneNumber)}&name=${encodeURIComponent(patientName)}&order=asc`);
}

// tzOffset lets the server count "today" in the user's timezone, not the server's
async function getTodaysStats() {
    let tzOffset = new Date().getTimezoneOffset();
    return apiRequest(`/visits/stats?tzOffset=${tzOffset}`);
}

// ===== Auth & Users =====

// Password is checked on the server; returns the user (without password) or throws
async function loginUser(username, password) {
    return apiRequest("/auth/login", { method: "POST", body: { username, password } });
}

async function checkAdminExists() {
    let data = await apiRequest("/users/admin-exists");
    return data.adminExists;
}

async function registerAdmin(username, password) {
    return apiRequest("/auth/register-admin", { method: "POST", body: { username, password } });
}

// Staff list for the admin dashboard (no passwords are returned)
async function getUsers() {
    return apiRequest("/users");
}

async function createStaff(username, password, role) {
    return apiRequest("/users", { method: "POST", body: { username, password, role } });
}

async function deleteStaff(userId) {
    return apiRequest(`/users/${userId}`, { method: "DELETE" });
}

// ===== Complaints API =====

async function getComplaints() {
    try {
        return await apiRequest("/complaints");
    } catch (error) {
        console.error(error);
        return [];
    }
}

async function submitComplaint(complaint) {
    return apiRequest("/complaints", { method: "POST", body: complaint });
}

async function deleteComplaint(id) {
    try {
        await apiRequest(`/complaints/${id}`, { method: "DELETE" });
    } catch (error) {
        console.error(error);
    }
}