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
 * - Facebook sends a GET request to verify the webhook URL
 * - Checks if the verify token matches
 * - Returns the challenge string if verification succeeds
 */
router.get('/', messengerController.verifyWebhook);

/**
 * POST /webhook
 * Receive Facebook Messenger events
 * - Handles incoming messages, images, postbacks, etc.
 * - Processes each event and sends AI responses
 */
router.post('/', messengerController.handleWebhook);

module.exports = router;