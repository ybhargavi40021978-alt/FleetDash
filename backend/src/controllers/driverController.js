const Driver = require("../models/Driver");

// GET All Drivers
const getDrivers = async (req, res) => {
    try {
        const drivers = await Driver.find();

        res.status(200).json({
            success: true,
            totalDrivers: drivers.length,
            data: drivers
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// GET Driver By ID
const getDriverById = async (req, res) => {
    try {

        const driver = await Driver.findById(req.params.id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        res.status(200).json({
            success: true,
            data: driver
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// CREATE Driver
const createDriver = async (req, res) => {
    try {

        const driver = await Driver.create(req.body);

        res.status(201).json({
            success: true,
            message: "Driver Added Successfully",
            data: driver
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// UPDATE Driver
const updateDriver = async (req, res) => {
    try {

        const driver = await Driver.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                returnDocument: 'after',
                runValidators: true
            }
        );

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Driver Updated Successfully",
            data: driver
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// DELETE Driver
const deleteDriver = async (req, res) => {
    try {

        const driver = await Driver.findByIdAndDelete(req.params.id);

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Driver Deleted Successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getDrivers,
    getDriverById,
    createDriver,
    updateDriver,
    deleteDriver
};