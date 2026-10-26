const Patient = require("../models/Patient");
const { calculateTriageScore, getEffectiveScore, sortQueue } = require("../services/triage");

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
// Adds a patient. The triage score is calculated here, never taken from the request,
// so the frontend cannot fake a higher priority.
async function addPatient(req, res) {
    let { name, age, phone, gender, pain, breathing, symptoms, duration } = req.body;

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

    let patient = await Patient.create(patientData);
    res.status(201).json(patient);
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

module.exports = { getQueue, addPatient, callNext };