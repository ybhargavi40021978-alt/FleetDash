const express = require("express");
const router = express.Router();

const {
    getTrips,
    getTripById,
    createTrip,
    updateTrip,
    deleteTrip
} = require("../controllers/tripController");

router.get("/", getTrips);

router.get("/:id", getTripById);

router.post("/", createTrip);

router.put("/:id", updateTrip);

router.delete("/:id", deleteTrip);

module.exports = router;