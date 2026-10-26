// Checks the triage service against hand-calculated phase 1 scores.
// Run from phase2/backend:  node scripts/test-triage.js

const { calculateTriageScore, getEffectiveScore, sortQueue } = require("../src/services/triage");

let passed = 0;
let failed = 0;

function check(description, actual, expected) {
    if (actual === expected) {
        console.log(`PASS  ${description}  (got ${actual})`);
        passed++;
    } else {
        console.log(`FAIL  ${description}  (expected ${expected}, got ${actual})`);
        failed++;
    }
}

// ===== calculateTriageScore =====

// 5+5 pain/breathing, chest pain 40 + bleeding 35 = 85, age 67 +5 = 90, acute & >=40 +15 = 105
check(
    "Severe male, 67, acute",
    calculateTriageScore({ pain: 5, breathing: 5, symptoms: ["Chest Pain", "Severe Bleeding"], age: 67, duration: "acute", gender: "Male" }),
    105
);

// Same patient but female: bleeding + female adds 15 = 120
check(
    "Severe female, 67, acute (obstetric bonus)",
    calculateTriageScore({ pain: 5, breathing: 5, symptoms: ["Chest Pain", "Severe Bleeding"], age: 67, duration: "acute", gender: "Female" }),
    120
);

// 1+1 + fever 10 = 12, chronic & <40 -10 = 2
check(
    "Mild fever, 20, chronic",
    calculateTriageScore({ pain: 1, breathing: 1, symptoms: ["Fever"], age: 20, duration: "chronic", gender: "Male" }),
    2
);

// 3+2 + fainting 30 = 35, age 3 (<5) +10 = 45, medium_term has no adjustment
check(
    "Child fainting, 3, medium_term",
    calculateTriageScore({ pain: 3, breathing: 2, symptoms: ["Fainting / Loss of Consciousness"], age: 3, duration: "medium_term", gender: "Other" }),
    45
);

// 2+2 + chest pain 40 = 44, age 85 (>=80) +10 = 54, chronic & >=40 -5 = 49
check(
    "Elderly chest pain, 85, chronic",
    calculateTriageScore({ pain: 2, breathing: 2, symptoms: ["Chest Pain"], age: 85, duration: "chronic", gender: "Male" }),
    49
);

// ===== getEffectiveScore =====

const now = 1000000;

// Waited 25 seconds = 2 full 10-second intervals = +20
check(
    "Wait bonus after 25s",
    getEffectiveScore({ triageScore: 20, arrivalTime: now - 25000 }, now),
    40
);

// ===== sortQueue =====

const queue = [
    { name: "A", triageScore: 30, arrivalTime: now },          // effective 30
    { name: "B", triageScore: 50, arrivalTime: now },          // effective 50
    { name: "C", triageScore: 10, arrivalTime: now - 25000 },  // 10 + 20 wait = 30, but arrived before A
    { name: "D", triageScore: 30, arrivalTime: now - 5000 }    // 30, arrived before A, after C
];

check(
    "Queue order (score, then arrival)",
    sortQueue(queue, now).map(function (p) { return p.name; }).join(","),
    "B,C,D,A"
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);