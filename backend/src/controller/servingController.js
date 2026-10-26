const Patient = require("../models/Patient");

// GET /api/serving
// The patient the doctor is seeing right now (or null)
async function getServing(req, res) {
    let patient = await Patient.findOne({ status: "serving" });
    res.json({ patient: patient || null });
}

// POST /api/serving/complete
// Finishes the current visit: saves doctor notes and moves the patient to history
async function completeServing(req, res) {
    let doctorNotes = req.body.doctorNotes ? String(req.body.doctorNotes) : "";

    let patient = await Patient.findOneAndUpdate(
        { status: "serving" },
        { status: "served", servedTime: Date.now(), doctorNotes: doctorNotes },
        { new: true, runValidators: true }
    );

    if (!patient) {
        return res.status(404).json({ message: "No patient is currently being served" });
    }

    res.json(patient);
}

module.exports = { getServing, completeServing };