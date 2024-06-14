const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/webhookController.js');

router.post('/', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
