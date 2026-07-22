/**
 * Memory Service
 * Manages conversation history in SQLite database
 */

const database = require('../database/database');

/**
 * Save a message to conversation history
 */
async function saveMessage(senderId, role, content) {
  try {
    const db = database.getDatabase();
    
    const query = `
      INSERT INTO messages (sender_id, role, content, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `;
    
    await database.run(query, [senderId, role, content]);
    
    console.log(`💾 Message saved: ${role} from ${senderId} (${content.length} chars)`);
    
    // Check if we should clean up old messages
    await cleanupOldMessages(senderId);
    
    return true;
  } catch (error) {
    console.error('Error saving message:', error.message);
    return false;
  }
}

/**
 * Get conversation history for a user
 */
async function getHistory(senderId, limit = 20) {
  try {
    const db = database.getDatabase();
    
    const query = `
      SELECT role, content, created_at
      FROM messages
      WHERE sender_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `;
    
    const rows = await database.all(query, [senderId, limit]);
    
    // Reverse to get oldest first
    const history = rows.reverse().map(row => ({
      role: row.role,
      content: row.content
    }));
    
    console.log(`📚 Retrieved ${history.length} messages for ${senderId}`);
    return history;
  } catch (error) {
    console.error('Error getting history:', error.message);
    return [];
  }
}

/**
 * Clean up old messages to keep database size manageable
 */
async function cleanupOldMessages(senderId, maxMessages = 100) {
  try {
    const db = database.getDatabase();
    
    // Count messages for this user
    const countQuery = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE sender_id = ?
    `;
    
    const count = await database.get(countQuery, [senderId]);
    
    if (count && count.count > maxMessages) {
      // Delete oldest messages beyond limit
      const deleteQuery = `
        DELETE FROM messages
        WHERE sender_id = ?
        AND id NOT IN (
          SELECT id FROM messages
          WHERE sender_id = ?
          ORDER BY created_at DESC
          LIMIT ?
        )
      `;
      
      await database.run(deleteQuery, [senderId, senderId, maxMessages]);
      console.log(`🧹 Cleaned up old messages for ${senderId}`);
    }
  } catch (error) {
    console.error('Error cleaning up messages:', error.message);
  }
}

/**
 * Get user conversation statistics
 */
async function getStats(senderId) {
  try {
    const db = database.getDatabase();
    
    const query = `
      SELECT 
        COUNT(*) as total_messages,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as user_messages,
        SUM(CASE WHEN role = 'assistant' THEN 1 ELSE 0 END) as assistant_messages,
        MIN(created_at) as first_message,
        MAX(created_at) as last_message
      FROM messages
      WHERE sender_id = ?
    `;
    
    const stats = await database.get(query, [senderId]);
    return stats;
  } catch (error) {
    console.error('Error getting stats:', error.message);
    return null;
  }
}

/**
 * Clear conversation history for a user
 */
async function clearHistory(senderId) {
  try {
    const db = database.getDatabase();
    
    const query = `
      DELETE FROM messages
      WHERE sender_id = ?
    `;
    
    await database.run(query, [senderId]);
    console.log(`🗑️ Cleared history for ${senderId}`);
    return true;
  } catch (error) {
    console.error('Error clearing history:', error.message);
    return false;
  }
}

module.exports = {
  saveMessage,
  getHistory,
  cleanupOldMessages,
  getStats,
  clearHistory
};