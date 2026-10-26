const mongoose = require("mongoose");

// Connects to MongoDB using the connection string from .env.
// Kept in its own file so the connection setup lives in one place.
async function connectDB(uri) {
    if (!uri) {
        throw new Error("MONGODB_URI is not set. Add it to your .env file.");
    }

    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host} / database: ${mongoose.connection.name}`);
}

module.exports = connectDB;