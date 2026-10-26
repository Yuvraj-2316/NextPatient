const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const queueRoutes = require("./routes/queueRoutes");
const servingRoutes = require("./routes/servingRoutes");
const visitRoutes = require("./routes/visitRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

// ===== Middleware =====

// CORS: which websites may call this API.
// Empty FRONTEND_ORIGIN = allow all (fine while developing).
// After deployment, set it to your frontend URL(s), comma-separated.
let allowedOrigins = "*";
if (process.env.FRONTEND_ORIGIN) {
    allowedOrigins = process.env.FRONTEND_ORIGIN.split(",").map(function (origin) {
        return origin.trim();
    });
}
app.use(cors({ origin: allowedOrigins }));

// Lets Express read JSON request bodies (req.body)
app.use(express.json());

// ===== Basic routes =====

app.get("/", function (req, res) {
    res.json({ message: "NextPatient API is running" });
});

// Health check: shows whether the database is connected
app.get("/api/health", function (req, res) {
    let dbConnected = mongoose.connection.readyState === 1;
    res.json({
        status: "ok",
        database: dbConnected ? "connected" : "disconnected"
    });
});

// ===== API routes =====

app.use("/api/queue", queueRoutes);
app.use("/api/serving", servingRoutes);
app.use("/api/visits", visitRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// ===== Error handling (must be last) =====

app.use(notFound);
app.use(errorHandler);

module.exports = app;