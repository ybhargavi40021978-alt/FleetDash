const express = require('express');
const router = express.Router();
const { ingestTelemetry } = require('../controllers/telemetryController');
router.post('/batch', ingestTelemetry);
module.exports = router;
