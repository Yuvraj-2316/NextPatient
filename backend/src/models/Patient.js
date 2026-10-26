const mongoose = require("mongoose");

// Same values as the <select> options and checkboxes in intake.html
const GENDERS = ["Male", "Female", "Other"];
const DURATIONS = ["acute", "short_term", "medium_term", "chronic"];
const SYMPTOMS = [
    "Fever",
    "Fainting / Loss of Consciousness",
    "Chest Pain",
    "Severe Bleeding",
    "Vomiting",
    "Dizziness"
];
const STATUSES = ["waiting", "serving", "served"];

const patientSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Patient name is required"],
            trim: true
        },
        age: {
            type: Number,
            required: [true, "Age is required"],
            min: [1, "Age must be between 1 and 120"],
            max: [120, "Age must be between 1 and 120"]
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            match: [/^\d{10}$/, "Phone number must be exactly 10 digits"]
        },
        gender: {
            type: String,
            enum: { values: GENDERS, message: "Gender must be Male, Female or Other" },
            required: [true, "Gender is required"]
        },
        // Slider values from the intake form (1 to 5)
        pain: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        breathing: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        symptoms: {
            type: [{ type: String, enum: SYMPTOMS }],
            default: []
        },
        duration: {
            type: String,
            enum: DURATIONS,
            default: "acute"
        },
        // Calculated by the backend (services/triage.js), not sent by the frontend
        triageScore: {
            type: Number,
            required: true
        },
        // Stored as milliseconds (Date.now()) like phase 1, so the frontend code keeps working
        arrivalTime: {
            type: Number,
            default: Date.now
        },
        // waiting = in queue, serving = with the doctor, served = visit finished
        status: {
            type: String,
            enum: STATUSES,
            default: "waiting"
        },
        servedTime: {
            type: Number,
            default: null
        },
        doctorNotes: {
            type: String,
            default: "",
            trim: true
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

// Indexes make the common searches fast: queue by status, history by phone
patientSchema.index({ status: 1 });
patientSchema.index({ phone: 1 });

const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;
module.exports.GENDERS = GENDERS;
module.exports.DURATIONS = DURATIONS;
module.exports.SYMPTOMS = SYMPTOMS;
module.exports.STATUSES = STATUSES;