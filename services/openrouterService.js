/**
 * OpenRouter AI Service
 * Handles communication with OpenRouter API
 */

const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Get AI response from OpenRouter
 */
async function getResponse(history, userMessage, imageBase64 = null) {
  try {
    console.log(`🤖 Calling OpenRouter with model: ${OPENROUTER_MODEL}`);
    
    // Build messages array
    const messages = [];
    
    // Add system message
    messages.push({
      role: 'system',
      content: 'You are VIN AI, a helpful AI assistant for Facebook Messenger. You respond in a friendly, conversational tone. Keep responses concise but informative. If the user sends an image, analyze it and describe what you see.'
    });
    
    // Add conversation history (skip system message)
    for (const msg of history) {
      if (msg.role !== 'system') {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }
    
    // Add current message
    let messageContent = userMessage;
    
    // If image is provided and model supports vision
    if (imageBase64) {
      // Check if model supports vision
      const visionModels = ['gpt-4o', 'gpt-4-turbo', 'llama-3.2-vision', 'gemini-pro-vision'];
      const supportsVision = visionModels.some(model => OPENROUTER_MODEL.includes(model));
      
      if (supportsVision) {
        // Send image with text in vision format
        messages.push({
          role: 'user',
          content: [
            {
              type: 'text',
              text: userMessage || 'What do you see in this image? Describe it in detail.'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64
              }
            }
          ]
        });
      } else {
        // Model doesn't support vision, send text only
        messages.push({
          role: 'user',
          content: `${userMessage} (I received an image, but my current model doesn't support image analysis. Please describe what you see or ask a text question.)`
        });
      }
    } else {
      // Text only message
      messages.push({
        role: 'user',
        content: userMessage
      });
    }
    
    // Make API call
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: OPENROUTER_MODEL,
        messages: messages,
        temperature: 0.8,
        max_tokens: 1000,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://vin-ai-messenger.com',
          'X-Title': 'VIN AI Messenger'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      console.log(`✅ OpenRouter response received (${content.length} chars)`);
      return content;
    } else {
      console.error('❌ No response from OpenRouter');
      return null;
    }
    
  } catch (error) {
    console.error('❌ OpenRouter API error:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      
      // Handle specific error codes
      if (error.response.status === 401) {
        return 'I\'m sorry, I\'m having trouble with my API key. Please contact the administrator.';
      } else if (error.response.status === 429) {
        return 'I\'m receiving too many requests right now. Please wait a moment and try again.';
      } else if (error.response.status === 503) {
        return 'I\'m experiencing some technical difficulties. Please try again in a moment.';
      }
    }
    
    if (error.code === 'ECONNABORTED') {
      return 'I\'m sorry, the request is taking too long. Please try again.';
    }
    
    return null;
  }
}

/**
 * Get list of available models
 */
async function getAvailableModels() {
  try {
    const response = await axios.get(
      'https://openrouter.ai/api/v1/models',
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching models:', error.message);
    return null;
  }
}

module.exports = {
  getResponse,
  getAvailableModels
};