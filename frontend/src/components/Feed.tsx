import { useState, useEffect, useCallback, useRef } from 'react';
import { Post } from './Post';
import { LoadingSpinner } from './LoadingSpinner';

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

// Mock API function - replace with actual API call
const fetchPosts = async (page: number, limit: number = 10): Promise<PostData[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockPosts: PostData[] = Array.from({ length: limit }, (_, i) => ({
    id: `post-${page}-${i}`,
    author: `user_${Math.floor(Math.random() * 1000)}`,
    content: `This is post ${page * limit + i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. ${Math.random() > 0.5 ? 'This is a longer post with more content to test the layout and see how it handles different content lengths.' : ''}`,
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    votes: Math.floor(Math.random() * 200) - 50,
    userVote: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : null,
    commentsCount: Math.floor(Math.random() * 50),
    platform: ['mastodon', 'lemmy', 'peertube'][Math.floor(Math.random() * 3)]
  }));
  
  return mockPosts;
};

export const Feed = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const observer = useRef<IntersectionObserver | null>(null);

  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const loadMorePosts = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      const newPosts = await fetchPosts(page);
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (postId: string, voteType: 'up' | 'down') => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const currentVote = post.userVote;
        let newVote: 'up' | 'down' | null = voteType;
        let voteChange = 0;

        if (currentVote === voteType) {
          // Remove vote
          newVote = null;
          voteChange = voteType === 'up' ? -1 : 1;
        } else if (currentVote === null) {
          // Add vote
          voteChange = voteType === 'up' ? 1 : -1;
        } else {
          // Change vote
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

  const handleLike = (postId: string) => {
    console.log(`Liked post ${postId}`);
    // In a real app, this would send a like to the server
  };

  const handleRetweet = (postId: string) => {
    console.log(`Retweeted post ${postId}`);
    // In a real app, this would retweet the post
  };

  useEffect(() => {
    loadMorePosts();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      {posts.map((post, index) => (
        <div
          key={post.id}
          ref={index === posts.length - 1 ? lastPostElementRef : null}
        >
          <Post
            post={post}
            onVote={handleVote}
            onLike={handleLike}
            onRetweet={handleRetweet}
          />
        </div>
      ))}
      
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}
      
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          You've reached the end of the feed!
        </div>
      )}
    </div>
  );
};