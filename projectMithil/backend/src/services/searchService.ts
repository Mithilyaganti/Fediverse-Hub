import { PostModel, ThreadModel, UserModel } from '../models';

// Search service for posts, users, threads
export async function searchAll(query: string, type: string) {
  try {
    const results: any = {
      posts: [],
      users: [],
      threads: []
    };
    
    if (!query) {
      return results;
    }
    
    const searchRegex = new RegExp(query, 'i'); // Case-insensitive search
    
    // Search posts
    if (type === 'post' || type === 'all') {
      results.posts = await PostModel.find({
        content: { $regex: searchRegex }
      }).sort({ createdAt: -1 });
    }
    
    // Search users
    if (type === 'user' || type === 'all') {
      results.users = await UserModel.find({
        $or: [
          { username: { $regex: searchRegex } },
          { email: { $regex: searchRegex } }
        ]
      });
    }
    
    // Search threads
    if (type === 'thread' || type === 'all') {
      results.threads = await ThreadModel.find({
        $or: [
          { title: { $regex: searchRegex } },
          { content: { $regex: searchRegex } }
        ]
      }).sort({ createdAt: -1 });
    }
    
    return results;
  } catch (error) {
    console.error('Search error:', error);
    return { posts: [], users: [], threads: [] };
  }
}

export async function searchPosts(query: string, platform?: string) {
  try {
    const searchRegex = new RegExp(query, 'i');
    
    const searchQuery: any = {
      content: { $regex: searchRegex }
    };
    
    if (platform) {
      searchQuery.platform = platform;
    }
    
    const posts = await PostModel.find(searchQuery).sort({ createdAt: -1 });
    return posts;
  } catch (error) {
    console.error('Search posts error:', error);
    return [];
  }
}

export async function searchUsers(query: string) {
  try {
    const searchRegex = new RegExp(query, 'i');
    
    const users = await UserModel.find({
      $or: [
        { username: { $regex: searchRegex } },
        { email: { $regex: searchRegex } }
      ]
    });
    
    return users;
  } catch (error) {
    console.error('Search users error:', error);
    return [];
  }
}
