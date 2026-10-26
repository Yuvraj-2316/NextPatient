const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
    {
        // The staff member who sent it (links to the User model)
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "userId is required"]
        },
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true
        },
        role: {
            type: String,
            required: [true, "Role is required"]
        },
        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true
        },
        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true
        },
        // Milliseconds like phase 1, so admin.js can display it the same way
        timestamp: {
            type: Number,
            default: Date.now
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: function (doc, ret) {
                delete ret._id;
                return ret;
            }
        }
    }
);

const Complaint = mongoose.model("Complaint", complaintSchema);

module.exports = Complaint;