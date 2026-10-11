const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
{
    driverName: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    licenseNumber: {
        type: String,
        required: true,
        unique: true
    },

    experience: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active"
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model("Driver", driverSchema);