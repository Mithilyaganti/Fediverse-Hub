import { Message, MessageModel } from '../models';

// Message service for direct messaging and threads
export async function sendMessage(fromUser: string, toUser: string, content: string) {
  try {
    const message = new MessageModel({
      fromUserId: fromUser,
      toUserId: toUser,
      content,
      read: false
    });
    
    await message.save();
    
    return { success: true, message };
  } catch (error) {
    console.error('Send message error:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

export async function getMessages(userId: string) {
  try {
    // Get all messages for user (sent and received)
    const userMessages = await MessageModel.find({
      $or: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    }).sort({ createdAt: -1 }); // Sort by creation date (newest first)
    
    return userMessages;
  } catch (error) {
    console.error('Get messages error:', error);
    return [];
  }
}

export async function markMessageAsRead(messageId: string) {
  try {
    const message = await MessageModel.findByIdAndUpdate(
      messageId,
      { read: true },
      { new: true }
    );
    
    if (message) {
      return { success: true };
    }
    return { success: false, error: 'Message not found' };
  } catch (error) {
    console.error('Mark message as read error:', error);
    return { success: false, error: 'Failed to mark message as read' };
  }
}
