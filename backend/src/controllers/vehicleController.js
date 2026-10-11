const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");

// ================= GET ALL VEHICLES =================
const getVehicles = async (req, res) => {
    try {
        const vehicles = await Vehicle.find();

        res.status(200).json({
            success: true,
            totalVehicles: vehicles.length,
            data: vehicles
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================= CREATE VEHICLE =================
const createVehicle = async (req, res) => {
    try {

        const { vehicleNumber, driver } = req.body;

        if (!vehicleNumber || !driver) {
            return res.status(400).json({
                success: false,
                message: "Vehicle number and driver name are required."
            });
        }

        const vehicle = await Vehicle.create(req.body);

        // Emit realtime update to connected clients
        try {
            const io = req.app && req.app.get && req.app.get('io');
            if (io) io.emit('vehicle:updated', vehicle);
        } catch (err) {
            console.error('Failed to emit vehicle:create event', err);
        }

        res.status(201).json({
            success: true,
            message: "Vehicle Added Successfully",
            data: vehicle
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================= GET VEHICLE BY ID =================
const getVehicleById = async (req, res) => {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid Vehicle ID"
        });
    }

    try {

        const vehicle = await Vehicle.findById(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        res.status(200).json({
            success: true,
            data: vehicle
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================= UPDATE VEHICLE =================
const updateVehicle = async (req, res) => {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid Vehicle ID"
        });
    }

    try {

        const vehicle = await Vehicle.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        // Emit realtime update to connected clients
        try {
            const io = req.app && req.app.get && req.app.get('io');
            if (io) io.emit('vehicle:updated', vehicle);
        } catch (err) {
            console.error('Failed to emit vehicle:update event', err);
        }

        res.status(200).json({
            success: true,
            message: "Vehicle Updated Successfully",
            data: vehicle
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================= DELETE VEHICLE =================
const deleteVehicle = async (req, res) => {

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid Vehicle ID"
        });
    }

    try {

        const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Vehicle Deleted Successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getVehicles,
    createVehicle,
    getVehicleById,
    updateVehicle,
    deleteVehicle
};