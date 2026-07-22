/**
 * Messenger Controller
 * Handles incoming messages and sends responses
 */

const facebookService = require('../services/facebookService');
const openrouterService = require('../services/openrouterService');
const memoryService = require('../services/memoryService');
const imageDownloader = require('../utils/imageDownloader');

// Check if verification token matches
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

/**
 * Verify webhook endpoint for Facebook
 */
exports.verifyWebhook = (req, res) => {
  console.log('🔐 Webhook verification request received');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.error('❌ Webhook verification failed');
    res.sendStatus(403);
  }
};

/**
 * Handle incoming webhook events
 */
exports.handleWebhook = async (req, res) => {
  console.log('📨 Webhook event received');
  
  try {
    const body = req.body;
    
    // Check if this is a page subscription
    if (body.object === 'page') {
      // Process each entry
      for (const entry of body.entry) {
        // Process each messaging event
        if (entry.messaging) {
          for (const event of entry.messaging) {
            await handleMessagingEvent(event);
          }
        }
      }
      
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error('❌ Webhook handler error:', error);
    res.status(500).send('Error processing webhook');
  }
};

/**
 * Handle individual messaging event
 */
async function handleMessagingEvent(event) {
  const senderId = event.sender.id;
  const recipientId = event.recipient.id;
  const timestamp = event.timestamp;
  
  console.log(`📩 Message from ${senderId} at ${new Date(timestamp).toISOString()}`);
  
  // Handle different event types
  if (event.message) {
    await handleMessageEvent(senderId, event.message);
  } else if (event.postback) {
    await handlePostbackEvent(senderId, event.postback);
  } else if (event.delivery) {
    console.log(`✅ Message delivered to ${senderId}`);
  } else if (event.read) {
    console.log(`👀 Message read by ${senderId}`);
  } else {
    console.log('⚠️ Unknown event type:', Object.keys(event));
  }
}

/**
 * Handle message event
 */
async function handleMessageEvent(senderId, message) {
  console.log(`💬 Message from ${senderId}:`, message);
  
  try {
    // Show typing indicator
    await facebookService.sendTypingOn(senderId);
    
    let userMessage = '';
    let imageUrl = null;
    
    // Extract text
    if (message.text) {
      userMessage = message.text;
    }
    
    // Check for attachments (images)
    if (message.attachments && message.attachments.length > 0) {
      for (const attachment of message.attachments) {
        if (attachment.type === 'image') {
          // Get image URL from attachment
          if (attachment.payload && attachment.payload.url) {
            imageUrl = attachment.payload.url;
            userMessage = userMessage || 'What do you see in this image?';
            break;
          }
        }
      }
    }
    
    // If no message content, ignore
    if (!userMessage && !imageUrl) {
      console.log('ℹ️ Empty message received, ignoring');
      await facebookService.sendTypingOff(senderId);
      return;
    }
    
    // Save user message to memory
    await memoryService.saveMessage(senderId, 'user', userMessage);
    
    // Get conversation history
    const history = await memoryService.getHistory(senderId, 20);
    
    // If image is present, download it
    let imageBase64 = null;
    if (imageUrl) {
      console.log(`🖼️ Downloading image: ${imageUrl}`);
      imageBase64 = await imageDownloader.downloadImage(imageUrl);
      if (imageBase64) {
        console.log('✅ Image downloaded successfully');
      } else {
        console.log('⚠️ Failed to download image');
      }
    }
    
    // Get AI response
    let aiResponse = await openrouterService.getResponse(
      history,
      userMessage,
      imageBase64
    );
    
    if (!aiResponse) {
      aiResponse = "I'm sorry, I couldn't process your request. Please try again.";
    }
    
    console.log(`🤖 AI Response: ${aiResponse.substring(0, 100)}...`);
    
    // Save AI response to memory
    await memoryService.saveMessage(senderId, 'assistant', aiResponse);
    
    // Send response back to Facebook
    await facebookService.sendTextMessage(senderId, aiResponse);
    
    // Turn off typing indicator
    await facebookService.sendTypingOff(senderId);
    
    console.log(`✅ Response sent to ${senderId}`);
    
  } catch (error) {
    console.error('❌ Error handling message:', error);
    try {
      await facebookService.sendTypingOff(senderId);
    } catch (e) {
      // Ignore
    }
  }
}

/**
 * Handle postback event (button clicks)
 */
async function handlePostbackEvent(senderId, postback) {
  console.log(`🔘 Postback from ${senderId}:`, postback);
  
  try {
    const payload = postback.payload;
    let response = '';
    
    // Handle different postback payloads
    switch (payload) {
      case 'GET_STARTED':
        response = '👋 Welcome to VIN AI Messenger! I\'m your AI assistant. How can I help you today?';
        break;
      case 'HELP':
        response = '🆘 I can help you with:\n\n• Answer questions\n• Analyze images\n• Have conversations\n• Provide information\n\nJust type your message!';
        break;
      default:
        response = `You clicked: ${payload}`;
    }
    
    // Send response
    await facebookService.sendTextMessage(senderId, response);
    
  } catch (error) {
    console.error('❌ Error handling postback:', error);
  }
}