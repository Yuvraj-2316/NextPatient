const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLES = ["admin", "doctor", "receptionist"];

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
            minlength: [3, "Username must be at least 3 characters"]
        },
        // Only the bcrypt hash is stored, never the real password
        passwordHash: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: { values: ROLES, message: "Role must be admin, doctor or receptionist" },
            required: [true, "Role is required"]
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            // Never send the password hash to the frontend
            transform: function (doc, ret) {
                delete ret._id;
                delete ret.passwordHash;
                return ret;
            }
        }
    }
);

// Turns a plain password into a hash before saving
userSchema.statics.hashPassword = function (plainPassword) {
    return bcrypt.hash(plainPassword, 10);
};

// Checks a login attempt against the stored hash
userSchema.methods.checkPassword = function (plainPassword) {
    return bcrypt.compare(plainPassword, this.passwordHash);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
module.exports.ROLES = ROLES;