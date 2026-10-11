const express = require('express');
const router = express.Router();
const { listGeofences } = require('../realtime/services/geofenceService');
router.get('/', (_req, res) => res.json({ geofences: listGeofences() }));
module.exports = router;
