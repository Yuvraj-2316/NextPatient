const Complaint = require("../models/Complaint");

// GET /api/complaints
// Newest first, like the phase 1 admin dashboard
async function getComplaints(req, res) {
    let complaints = await Complaint.find().sort({ timestamp: -1 });
    res.json(complaints);
}

// POST /api/complaints
// The sender comes from the login token (req.user), not from the request body,
// so nobody can send a complaint in someone else's name.
async function createComplaint(req, res) {
    let { subject, message } = req.body;

    let complaint = await Complaint.create({
        userId: req.user._id,
        name: req.user.username,
        role: req.user.role,
        subject: subject,
        message: message
    });

    res.status(201).json(complaint);
}

// DELETE /api/complaints/:id
// "Mark Resolved" on the admin dashboard
async function deleteComplaint(req, res) {
    let complaint = await Complaint.findByIdAndDelete(req.params.id);

    if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
    }

    res.json({ message: "Complaint resolved", id: req.params.id });
}

module.exports = { getComplaints, createComplaint, deleteComplaint };