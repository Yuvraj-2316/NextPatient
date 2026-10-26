// Runs when no route matched the URL
function notFound(req, res) {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Runs when any controller throws an error.
// Turns database errors into clear JSON messages with the right status code.
function errorHandler(err, req, res, next) {
        // Model validation failed (e.g. missing name, bad phone number)
    if (err.name === "ValidationError") {
        let messages = Object.values(err.errors).map(function (e) {
            // A wrong-type value (e.g. text where an id is expected) gets a short message
            if (e.name === "CastError") {
                return `Invalid ${e.path}`;
            }
            return e.message;
        });
        return res.status(400).json({ message: messages.join(", "), errors: messages });
    }

    // Invalid MongoDB id in the URL (e.g. /api/complaints/abc)
    if (err.name === "CastError") {
        return res.status(400).json({ message: `Invalid ${err.path}: ${err.value}` });
    }

    // Unique field already exists (e.g. username taken)
    if (err.code === 11000) {
        let field = Object.keys(err.keyValue || {})[0] || "value";
        return res.status(409).json({ message: `That ${field} is already taken` });
    }

    // Request body was not valid JSON
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Request body must be valid JSON" });
    }

    console.error(err);
    res.status(err.status || 500).json({ message: err.status ? err.message : "Something went wrong on the server" });
}

module.exports = { notFound, errorHandler };