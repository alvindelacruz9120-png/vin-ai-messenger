/**
 * Webhook Routes
 * Handles Facebook Messenger webhook verification and events
 */

const express = require('express');
const router = express.Router();
const messengerController = require('../controllers/messengerController');

/**
 * GET /webhook
 * Facebook webhook verification
 */
router.get('/', messengerController.verifyWebhook);

/**
 * POST /webhook
 * Receive Facebook Messenger events
 */
router.post('/', messengerController.handleWebhook);

module.exports = router;
