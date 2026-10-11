const Trip = require("../models/Trip");

// GET All Trips
const getTrips = async (req, res) => {

    try {

        const trips = await Trip.find()
            .populate("vehicle")
            .populate("driver");

        res.status(200).json({
            success: true,
            totalTrips: trips.length,
            data: trips
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// GET Trip By ID
const getTripById = async (req, res) => {

    try {

        const trip = await Trip.findById(req.params.id)
            .populate("vehicle")
            .populate("driver");

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found"
            });
        }

        res.status(200).json({
            success: true,
            data: trip
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// CREATE Trip
const createTrip = async (req, res) => {

    try {

        const trip = await Trip.create(req.body);

        res.status(201).json({
            success: true,
            message: "Trip Created Successfully",
            data: trip
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// UPDATE Trip
const updateTrip = async (req, res) => {

    try {

        const trip = await Trip.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Trip Updated Successfully",
            data: trip
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

// DELETE Trip
const deleteTrip = async (req, res) => {

    try {

        const trip = await Trip.findByIdAndDelete(req.params.id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Trip Deleted Successfully"
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};

module.exports = {
    getTrips,
    getTripById,
    createTrip,
    updateTrip,
    deleteTrip
};