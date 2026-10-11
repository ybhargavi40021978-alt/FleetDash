const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
{
    tripName: {
        type: String,
        required: true,
        trim: true
    },

    source: {
        type: String,
        required: true
    },

    destination: {
        type: String,
        required: true
    },

    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
        required: true
    },

    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Driver",
        required: true
    },

    tripDate: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ["Scheduled", "In Progress", "Completed"],
        default: "Scheduled"
    }

},
{
    timestamps: true
});

module.exports = mongoose.model("Trip", tripSchema);