import { Thread, Reply, ThreadModel } from '../models';

// Thread service for Reddit-style discussions
export async function createThread(author: string, title: string, content: string) {
  try {
    const thread = new ThreadModel({
      authorId: author,
      title,
      content,
      replies: []
    });
    
    await thread.save();
    return thread;
  } catch (error) {
    console.error('Create thread error:', error);
    return { success: false, error: 'Failed to create thread' };
  }
}

export async function getThreads() {
  try {
    // Sort threads by creation date (newest first)
    const threads = await ThreadModel.find().sort({ createdAt: -1 });
    return threads;
  } catch (error) {
    console.error('Get threads error:', error);
    return [];
  }
}

export async function getThread(threadId: string) {
  try {
    const thread = await ThreadModel.findById(threadId);
    if (!thread) {
      return null;
    }
    
    // Sort replies by creation date (oldest first for threaded view)
    thread.replies.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    return thread;
  } catch (error) {
    console.error('Get thread error:', error);
    return null;
  }
}

export async function replyToThread(threadId: string, author: string, content: string, parentReplyId?: string) {
  try {
    const thread = await ThreadModel.findById(threadId);
    if (!thread) {
      return { success: false, error: 'Thread not found' };
    }
    
    const reply = {
      threadId,
      authorId: author,
      content,
      parentReplyId,
      createdAt: new Date()
    };
    
    // Add reply to thread
    thread.replies.push(reply);
    await thread.save();
    
    return { success: true, reply };
  } catch (error) {
    console.error('Reply to thread error:', error);
    return { success: false, error: 'Failed to reply to thread' };
  }
}
