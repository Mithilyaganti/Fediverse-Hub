import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Post } from '@/components/Post';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PostData {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  votes: number;
  userVote?: 'up' | 'down' | null;
  commentsCount: number;
  platform: string;
}

interface UserData {
  username: string;
  displayName: string;
  bio: string;
  avatar: string | null;
  joinedDate: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

// Mock API functions
const fetchUserData = async (username: string): Promise<UserData> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return {
    username,
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    bio: `This is ${username}'s bio. A passionate member of the fediverse community sharing thoughts and ideas.`,
    avatar: null,
    joinedDate: '2023-01-15',
    postsCount: Math.floor(Math.random() * 500) + 50,
    followersCount: Math.floor(Math.random() * 1000) + 100,
    followingCount: Math.floor(Math.random() * 300) + 50,
  };
};

const fetchUserPosts = async (username: string): Promise<PostData[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return Array.from({ length: 10 }, (_, i) => ({
    id: `user-post-${username}-${i}`,
    author: username,
    content: `This is a post by ${username}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. ${Math.random() > 0.5 ? 'This includes some additional thoughts and reflections on various topics.' : ''}`,
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(),
    votes: Math.floor(Math.random() * 100),
    commentsCount: Math.floor(Math.random() * 20),
    platform: ['mastodon', 'lemmy', 'peertube'][Math.floor(Math.random() * 3)]
  }));
};

const fetchUserReplies = async (username: string): Promise<PostData[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return Array.from({ length: 8 }, (_, i) => ({
    id: `user-reply-${username}-${i}`,
    author: username,
    content: `This is a reply by ${username}. Responding to another user's post with thoughtful commentary.`,
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 20).toISOString(),
    votes: Math.floor(Math.random() * 50),
    commentsCount: Math.floor(Math.random() * 10),
    platform: ['mastodon', 'lemmy', 'peertube'][Math.floor(Math.random() * 3)]
  }));
};

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [replies, setReplies] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');

  useEffect(() => {
    const loadUserData = async () => {
      if (!username) return;
      
      setLoading(true);
      try {
        const [user, userPosts, userReplies] = await Promise.all([
          fetchUserData(username),
          fetchUserPosts(username),
          fetchUserReplies(username)
        ]);
        
        setUserData(user);
        setPosts(userPosts);
        setReplies(userReplies);
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [username]);

  const handleLike = (postId: string) => {
    console.log(`Liked post ${postId}`);
  };

  const handleRetweet = (postId: string) => {
    console.log(`Retweeted post ${postId}`);
  };

  const handleVote = (postId: string, voteType: 'up' | 'down') => {
    // Update posts or replies based on current tab
    const updateFunction = activeTab === 'posts' ? setPosts : setReplies;
    updateFunction(prev => prev.map(post => {
      if (post.id === postId) {
        const currentVote = post.userVote;
        let newVote: 'up' | 'down' | null = voteType;
        let voteChange = 0;

        if (currentVote === voteType) {
          newVote = null;
          voteChange = voteType === 'up' ? -1 : 1;
        } else if (currentVote === null) {
          voteChange = voteType === 'up' ? 1 : -1;
        } else {
          voteChange = voteType === 'up' ? 2 : -2;
        }

        return {
          ...post,
          userVote: newVote,
          votes: post.votes + voteChange
        };
      }
      return post;
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-2xl mx-auto p-4">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground">User not found</h1>
            <p className="text-muted-foreground mt-2">The user you're looking for doesn't exist.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="py-6">
        <div className="max-w-2xl mx-auto space-y-6 p-4">
          {/* User Profile Header */}
          <Card className="p-6">
            <div className="flex items-start space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={userData.avatar || undefined} alt={userData.displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {userData.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{userData.displayName}</h1>
                  <p className="text-muted-foreground">@{userData.username}</p>
                </div>
                <p className="text-foreground">{userData.bio}</p>
                <div className="flex space-x-4 text-sm text-muted-foreground">
                  <span><strong className="text-foreground">{userData.postsCount}</strong> Posts</span>
                  <span><strong className="text-foreground">{userData.followersCount}</strong> Followers</span>
                  <span><strong className="text-foreground">{userData.followingCount}</strong> Following</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(userData.joinedDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </Card>

          {/* Posts and Replies Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
              <TabsTrigger value="replies">Replies ({replies.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="space-y-4 mt-6">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <Post
                    key={post.id}
                    post={post}
                    onVote={handleVote}
                    onLike={handleLike}
                    onRetweet={handleRetweet}
                  />
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No posts yet.</p>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="replies" className="space-y-4 mt-6">
              {replies.length > 0 ? (
                replies.map((reply) => (
                  <Post
                    key={reply.id}
                    post={reply}
                    onVote={handleVote}
                    onLike={handleLike}
                    onRetweet={handleRetweet}
                  />
                ))
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No replies yet.</p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;