const Patient = require("../models/Patient");
const { EMERGENCY_THRESHOLD } = require("../services/triage");

const DAY_MS = 24 * 60 * 60 * 1000;
const PHONE_PATTERN = /^\d{10}$/;

// GET /api/visits                         -> all finished visits, newest first
// GET /api/visits?phone=...               -> every visit on that phone number
// GET /api/visits?phone=...&name=...      -> one patient's visits (a family can share a phone)
// Add &order=asc to get the earliest visit first
async function getVisits(req, res) {
    let filter = { status: "served" };

    if (req.query.phone !== undefined) {
        let phone = String(req.query.phone).trim();
        if (!PHONE_PATTERN.test(phone)) {
            return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
        }
        filter.phone = phone;
    }

    if (req.query.name !== undefined) {
        filter.name = String(req.query.name).trim();
    }

    let sortDirection = req.query.order === "asc" ? 1 : -1;

    // Collation strength 2 = case-insensitive, so "rahul" matches "Rahul"
    let visits = await Patient.find(filter)
        .collation({ locale: "en", strength: 2 })
        .sort({ servedTime: sortDirection });

    res.json(visits);
}

// GET /api/visits/patients?phone=...
// One entry per patient on that phone number, with visit count and first/last visit
async function getPatientsByPhone(req, res) {
    let phone = String(req.query.phone || "").trim();
    if (!PHONE_PATTERN.test(phone)) {
        return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    let patients = await Patient.aggregate([
        { $match: { status: "served", phone: phone } },
        { $sort: { servedTime: 1 } },
        {
            $group: {
                _id: { $toLower: "$name" },
                name: { $last: "$name" },
                age: { $last: "$age" },
                gender: { $last: "$gender" },
                visitCount: { $sum: 1 },
                firstVisit: { $first: "$servedTime" },
                lastVisit: { $last: "$servedTime" }
            }
        },
        { $sort: { name: 1 } },
        { $project: { _id: 0 } }
    ]);

    res.json(patients.map(function (patient) {
        return { ...patient, phone: phone };
    }));
}

// PATCH /api/visits/:id
// Doctor corrects or adds to the notes of a finished visit.
// Only doctorNotes can change: symptoms, score and times are the medical record.
async function updateVisitNotes(req, res) {
    if (typeof req.body.doctorNotes !== "string") {
        return res.status(400).json({ message: "doctorNotes must be text" });
    }

    let visit = await Patient.findOneAndUpdate(
        { _id: req.params.id, status: "served" },
        { doctorNotes: req.body.doctorNotes },
        { new: true, runValidators: true }
    );

    if (!visit) {
        return res.status(404).json({ message: "Visit not found" });
    }

    res.json(visit);
}

// Start of "today" in the user's timezone, as milliseconds.
// tzOffsetMinutes is what the browser's new Date().getTimezoneOffset() returns (India = -330).
function startOfToday(tzOffsetMinutes, now) {
    let offsetMs = tzOffsetMinutes * 60 * 1000;
    let localNow = now - offsetMs;
    return Math.floor(localNow / DAY_MS) * DAY_MS + offsetMs;
}

// GET /api/visits/stats?tzOffset=-330
// Same numbers as phase 1 getTodaysStats()
async function getStats(req, res) {
    let tzOffset = Number(req.query.tzOffset) || 0;
    if (Math.abs(tzOffset) > 14 * 60) {
        return res.status(400).json({ message: "tzOffset must be between -840 and 840 minutes" });
    }

    let dayStart = startOfToday(tzOffset, Date.now());
    let servedToday = { status: "served", servedTime: { $gte: dayStart, $lt: dayStart + DAY_MS } };

    let [totalServedToday, emergencyCount, currentlyWaiting] = await Promise.all([
        Patient.countDocuments(servedToday),
        Patient.countDocuments({ ...servedToday, triageScore: { $gte: EMERGENCY_THRESHOLD } }),
        Patient.countDocuments({ status: "waiting" })
    ]);

    res.json({ totalServedToday, emergencyCount, currentlyWaiting });
}

module.exports = { getVisits, getPatientsByPhone, updateVisitNotes, getStats };