import mongoose from 'mongoose';
import { UserModel, PostModel, ThreadModel, NotificationModel } from './src/models/index';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabaseConnection() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fediverse-aggregator');
    console.log('✅ MongoDB connected successfully');
    
    // Create test data
    console.log('📝 Creating test data...');
    
    // Create a test user
    const testUser = new UserModel({
      username: 'testuser',
      email: 'test@example.com',
      connectedAccounts: {
        twitter: { token: 'test_token', username: 'testuser_twitter' }
      }
    });
    
    const savedUser = await testUser.save();
    console.log('✅ Test user created:', savedUser.username);
    
    // Create test posts
    const testPosts = [
      {
        authorId: savedUser._id.toString(),
        content: 'Hello from Twitter! 🐦',
        platform: 'twitter',
        likes: 5,
        reposts: 2
      },
      {
        authorId: savedUser._id.toString(),
        content: 'Welcome to Mastodon! 🐘',
        platform: 'mastodon',
        likes: 3,
        reposts: 1
      },
      {
        authorId: savedUser._id.toString(),
        content: 'Reddit discussion started! 🤖',
        platform: 'reddit',
        likes: 8,
        reposts: 4
      }
    ];
    
    for (const postData of testPosts) {
      const post = new PostModel(postData);
      await post.save();
      console.log(`✅ Test post created: ${postData.platform}`);
    }
    
    // Create test thread
    const testThread = new ThreadModel({
      authorId: savedUser._id.toString(),
      title: 'Welcome to the Fediverse!',
      content: 'This is a test discussion thread about the fediverse.',
      replies: []
    });
    
    await testThread.save();
    console.log('✅ Test thread created');
    
    // Create test notification
    const testNotification = new NotificationModel({
      userId: savedUser._id.toString(),
      type: 'like',
      content: 'Someone liked your post!',
      read: false
    });
    
    await testNotification.save();
    console.log('✅ Test notification created');
    
    // Query the data
    console.log('\n📊 Querying test data...');
    const users = await UserModel.find();
    const posts = await PostModel.find();
    const threads = await ThreadModel.find();
    const notifications = await NotificationModel.find();
    
    console.log(`📈 Database contains:`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Posts: ${posts.length}`);
    console.log(`   Threads: ${threads.length}`);
    console.log(`   Notifications: ${notifications.length}`);
    
    console.log('\n✅ Database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testDatabaseConnection();
