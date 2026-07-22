/**
 * Image Downloader Utility
 * Downloads images from URLs for vision processing
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Download image from URL and convert to base64
 */
async function downloadImage(imageUrl) {
  try {
    console.log(`📥 Downloading image: ${imageUrl.substring(0, 50)}...`);
    
    // Validate URL
    if (!imageUrl || !isValidUrl(imageUrl)) {
      console.error('❌ Invalid image URL');
      return null;
    }
    
    // Download with timeout
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'arraybuffer',
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'VIN-AI-Messenger/1.0'
      }
    });
    
    if (!response.data) {
      console.error('❌ No data received from image URL');
      return null;
    }
    
    // Get content type
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      console.error('❌ Not an image:', contentType);
      return null;
    }
    
    // Convert to base64
    const base64Image = Buffer.from(response.data).toString('base64');
    const base64Data = `data:${contentType};base64,${base64Image}`;
    
    console.log(`✅ Image downloaded: ${(base64Image.length / 1024).toFixed(2)} KB`);
    return base64Data;
    
  } catch (error) {
    console.error('❌ Image download error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      console.error('Download timed out');
    } else if (error.response) {
      console.error('Status:', error.response.status);
    }
    
    return null;
  }
}

/**
 * Download and save image to disk (for debugging)
 */
async function downloadAndSaveImage(imageUrl, filename) {
  try {
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream',
      timeout: 15000
    });
    
    const imageDir = path.join(__dirname, '..', 'images');
    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, { recursive: true });
    }
    
    const filePath = path.join(imageDir, filename);
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error saving image:', error.message);
    return null;
  }
}

/**
 * Check if URL is valid
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Get image file extension from content type
 */
function getImageExtension(contentType) {
  const extensions = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/bmp': '.bmp'
  };
  return extensions[contentType] || '.jpg';
}

/**
 * Generate filename from URL
 */
function generateFilename(url) {
  const cleanUrl = url.replace(/[^a-zA-Z0-9]/g, '_');
  return `${Date.now()}_${cleanUrl.substring(0, 30)}`;
}

module.exports = {
  downloadImage,
  downloadAndSaveImage,
  isValidUrl,
  getImageExtension,
  generateFilename
};