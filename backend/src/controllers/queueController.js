const Patient = require("../models/Patient");
const { calculateTriageScore, getEffectiveScore, sortQueue } = require("../services/triage");

// Takes only the fields staff may set and calculates the triage score on the server,
// so the frontend can never send its own score, status or arrival time.
// Shared by "add patient" (POST) and "update patient" (PUT).
function buildPatientData(body) {
    let { name, age, phone, gender, pain, breathing, symptoms, duration } = body;

    let patientData = {
        name: name,
        age: Number(age),
        phone: phone,
        gender: gender,
        pain: Number(pain),
        breathing: Number(breathing),
        symptoms: Array.isArray(symptoms) ? symptoms : [],
        duration: duration
    };

    patientData.triageScore = calculateTriageScore(patientData);
    return patientData;
}

// GET /api/queue
// All waiting patients, highest priority first, with their current effective score
async function getQueue(req, res) {
    let waitingPatients = await Patient.find({ status: "waiting" });
    let now = Date.now();

    let orderedQueue = sortQueue(waitingPatients, now).map(function (patient) {
        let data = patient.toJSON();
        data.effectiveScore = getEffectiveScore(patient, now);
        return data;
    });

    res.json(orderedQueue);
}

// POST /api/queue
// Adds a patient to the queue
async function addPatient(req, res) {
    let patient = await Patient.create(buildPatientData(req.body));
    res.status(201).json(patient);
}

// PUT /api/queue/:id
// Replaces a waiting patient's details (e.g. a typo in the name or wrong symptoms).
// Only patients still waiting can be edited; the triage score is recalculated.
async function updatePatient(req, res) {
    let patient = await Patient.findOne({ _id: req.params.id, status: "waiting" });

    if (!patient) {
        return res.status(404).json({ message: "Waiting patient not found" });
    }

    patient.set(buildPatientData(req.body));
    await patient.save();

    res.json(patient);
}

// DELETE /api/queue/:id
// Removes a waiting patient who left before being seen
async function removePatient(req, res) {
    let patient = await Patient.findOneAndDelete({ _id: req.params.id, status: "waiting" });

    if (!patient) {
        return res.status(404).json({ message: "Waiting patient not found" });
    }

    res.json({ message: "Patient removed from queue", id: req.params.id });
}

// POST /api/queue/next
// Calls the highest-priority waiting patient, but only if nobody is being served
async function callNext(req, res) {
    let current = await Patient.findOne({ status: "serving" });
    if (current) {
        return res.json({ called: false, message: "A patient is already being served", patient: current });
    }

    let waitingPatients = await Patient.find({ status: "waiting" });

    for (let candidate of sortQueue(waitingPatients)) {
        // Only update if still waiting, so two clicks at once can't call the same patient twice
        let called = await Patient.findOneAndUpdate(
            { _id: candidate._id, status: "waiting" },
            { status: "serving" },
            { new: true }
        );
        if (called) {
            return res.json({ called: true, message: "Next patient called", patient: called });
        }
    }

    res.json({ called: false, message: "The queue is empty", patient: null });
}

module.exports = { getQueue, addPatient, updatePatient, removePatient, callNext };