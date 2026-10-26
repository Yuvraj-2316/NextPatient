const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const queueRoutes = require("./routes/queueRoutes");
const servingRoutes = require("./routes/servingRoutes");

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
/// api routes 

app.use("/api/queue", queueRoutes);
app.use("/api/serving", servingRoutes);

// error handling

app.use(notFound);
app.use(errorHandler);

module.exports = app;