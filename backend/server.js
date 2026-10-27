// Load .env values into process.env (must run before anything reads them)
require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        // Without a secret, login tokens could not be signed or checked
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not set. Add it to your .env file.");
        }

        await connectDB(process.env.MONGODB_URI);

        app.listen(PORT, function () {
            console.log(`NextPatient API running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
}

startServer();