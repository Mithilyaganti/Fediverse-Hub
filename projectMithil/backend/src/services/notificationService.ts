import { Notification, NotificationModel } from '../models';

// Notification service for unified notifications
export async function fetchNotifications(userToken: string) {
  try {
    // In real implementation, you'd extract userId from token
    const userId = 'user_1'; // Mock user ID
    
    // Get notifications from database
    const notifications = await NotificationModel.find({ userId })
      .sort({ createdAt: -1 }); // Sort by creation date (newest first)
    
    // If no notifications in DB, create some mock ones
    if (notifications.length === 0) {
      const mockNotifications = [
        {
          userId: 'user_1',
          type: 'like' as const,
          content: 'Your post got 5 likes on Twitter!',
          relatedPostId: 'tw_1',
          read: false
        },
        {
          userId: 'user_1',
          type: 'mention' as const,
          content: 'You were mentioned in a Mastodon post',
          read: false
        },
        {
          userId: 'user_1',
          type: 'reply' as const,
          content: 'Someone replied to your Reddit comment',
          relatedPostId: 'rd_1',
          read: true
        }
      ];
      
      await NotificationModel.insertMany(mockNotifications);
      return await NotificationModel.find({ userId }).sort({ createdAt: -1 });
    }
    
    return notifications;
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const notification = await NotificationModel.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
    
    if (notification) {
      return { success: true };
    }
    return { success: false, error: 'Notification not found' };
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return { success: false, error: 'Failed to mark notification as read' };
  }
}

export async function createNotification(userId: string, type: Notification['type'], content: string, relatedPostId?: string) {
  try {
    const notification = new NotificationModel({
      userId,
      type,
      content,
      relatedPostId,
      read: false
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}
