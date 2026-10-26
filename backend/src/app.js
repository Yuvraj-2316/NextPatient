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