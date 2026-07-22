/**
 * Facebook Messenger Service
 * Handles all Facebook API calls
 */

const axios = require('axios');

const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const API_VERSION = 'v18.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

/**
 * Send message with typing indicator
 */
async function sendTypingOn(recipientId) {
  try {
    await axios.post(
      `${BASE_URL}/me/messages`,
      {
        recipient: { id: recipientId },
        sender_action: 'typing_on'
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN }
      }
    );
  } catch (error) {
    console.error('Error sending typing_on:', error.message);
  }
}

/**
 * Turn off typing indicator
 */
async function sendTypingOff(recipientId) {
  try {
    await axios.post(
      `${BASE_URL}/me/messages`,
      {
        recipient: { id: recipientId },
        sender_action: 'typing_off'
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN }
      }
    );
  } catch (error) {
    console.error('Error sending typing_off:', error.message);
  }
}

/**
 * Send read receipt (seen)
 */
async function sendSeen(recipientId) {
  try {
    await axios.post(
      `${BASE_URL}/me/messages`,
      {
        recipient: { id: recipientId },
        sender_action: 'mark_seen'
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN }
      }
    );
  } catch (error) {
    console.error('Error sending seen:', error.message);
  }
}

/**
 * Send text message
 */
async function sendTextMessage(recipientId, text) {
  try {
    const response = await axios.post(
      `${BASE_URL}/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text: text }
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending text message:', error.message);
    if (error.response) {
      console.error('Facebook API error:', error.response.data);
    }
    throw error;
  }
}

/**
 * Send image message
 */
async function sendImageMessage(recipientId, imageUrl) {
  try {
    const response = await axios.post(
      `${BASE_URL}/me/messages`,
      {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'image',
            payload: { url: imageUrl }
          }
        }
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending image message:', error.message);
    throw error;
  }
}

/**
 * Send quick replies
 */
async function sendQuickReplies(recipientId, text, quickReplies) {
  try {
    const response = await axios.post(
      `${BASE_URL}/me/messages`,
      {
        recipient: { id: recipientId },
        message: {
          text: text,
          quick_replies: quickReplies
        }
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending quick replies:', error.message);
    throw error;
  }
}

/**
 * Send button message (generic template)
 */
async function sendButtonMessage(recipientId, text, buttons) {
  try {
    const response = await axios.post(
      `${BASE_URL}/me/messages`,
      {
        recipient: { id: recipientId },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text: text,
              buttons: buttons
            }
          }
        }
      },
      {
        params: { access_token: PAGE_ACCESS_TOKEN }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending button message:', error.message);
    throw error;
  }
}

/**
 * Get user profile information
 */
async function getUserProfile(userId) {
  try {
    const response = await axios.get(
      `${BASE_URL}/${userId}`,
      {
        params: {
          access_token: PAGE_ACCESS_TOKEN,
          fields: 'first_name,last_name,profile_pic'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting user profile:', error.message);
    return null;
  }
}

module.exports = {
  sendTypingOn,
  sendTypingOff,
  sendSeen,
  sendTextMessage,
  sendImageMessage,
  sendQuickReplies,
  sendButtonMessage,
  getUserProfile
};