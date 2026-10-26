// Triage rules for NextPatient.
// Ported from phase1/js/api.js so phase 1 and phase 2 give the same scores.
// Pure functions only: no database, no req/res, which makes them easy to test.

// Points added for each symptom (same values as phase 1)
const SYMPTOM_POINTS = {
    "Fever": 10,
    "Fainting / Loss of Consciousness": 30,
    "Chest Pain": 40,
    "Severe Bleeding": 35,
    "Vomiting": 10,
    "Dizziness": 15
};

// Anti-starvation: every WAIT_INTERVAL_MS of waiting adds WAIT_BONUS points.
// 10 seconds is the phase 1 testing value; raise it (e.g. 10 minutes) for real use.
const WAIT_INTERVAL_MS = 10000;
const WAIT_BONUS = 10;

// Visits at or above this score count as emergencies in today's stats
const EMERGENCY_THRESHOLD = 60;

function calculateTriageScore({ pain, breathing, symptoms = [], age, duration, gender }) {
    let score = parseInt(pain) + parseInt(breathing);

    symptoms.forEach(function (symptom) {
        score += SYMPTOM_POINTS[symptom] || 0;
    });

    if (age >= 60 && age < 80) score += 5;
    if (age >= 80 || age < 5) score += 10;

    if (duration === "acute" && score >= 40) score += 15;
    else if (duration === "chronic" && score >= 40) score -= 5;
    else if (duration === "chronic" && score < 40) score -= 10;

    // Higher priority for potential obstetric/gynecological emergencies
    if (gender === "Female" && symptoms.includes("Severe Bleeding")) {
        score += 15;
    }

    return score;
}

// Triage score plus the waiting-time bonus at the moment `now`
function getEffectiveScore(patient, now = Date.now()) {
    let waitingTimeMs = now - patient.arrivalTime;
    let intervalsPassed = Math.floor(waitingTimeMs / WAIT_INTERVAL_MS);

    return patient.triageScore + intervalsPassed * WAIT_BONUS;
}

// Orders the waiting queue: highest effective score first,
// earlier arrival first when scores are equal (FCFS tie-breaker).
// Returns a new array and leaves the original untouched.
function sortQueue(patients, now = Date.now()) {
    return [...patients].sort(function (a, b) {
        let scoreDifference = getEffectiveScore(b, now) - getEffectiveScore(a, now);
        if (scoreDifference !== 0) return scoreDifference;
        return a.arrivalTime - b.arrivalTime;
    });
}

module.exports = {
    calculateTriageScore,
    getEffectiveScore,
    sortQueue,
    SYMPTOM_POINTS,
    WAIT_INTERVAL_MS,
    WAIT_BONUS,
    EMERGENCY_THRESHOLD
};