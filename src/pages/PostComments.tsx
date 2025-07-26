import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Post } from '@/components/Post';
import { CommentSection } from '@/components/CommentSection';
import { ReplyForm } from '@/components/ReplyForm';

// Mock function to get post by ID - replace with actual API call
const getPostById = (postId: string) => {
  // This would normally be an API call
  return {
    id: postId,
    author: `user_${Math.floor(Math.random() * 1000)}`,
    content: `This is the full post content for post ${postId}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.`,
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    votes: Math.floor(Math.random() * 200) - 50,
    userVote: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' as const : 'down' as const) : null,
    commentsCount: Math.floor(Math.random() * 50),
    platform: ['mastodon', 'lemmy', 'peertube'][Math.floor(Math.random() * 3)]
  };
};

const PostComments = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  
  if (!postId) {
    return <div>Post not found</div>;
  }

  const post = getPostById(postId);

  const handleVote = (postId: string, voteType: 'up' | 'down') => {
    // Handle voting logic here
    console.log(`Voted ${voteType} on post ${postId}`);
  };

  const handleLike = (postId: string) => {
    console.log(`Liked post ${postId}`);
  };

  const handleRetweet = (postId: string) => {
    console.log(`Retweeted post ${postId}`);
  };

  const handleReply = (content: string) => {
    console.log(`Reply to post ${postId}: ${content}`);
    // In a real app, this would submit the reply to the server
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Feed</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* Post */}
        <Post 
          post={post} 
          onVote={handleVote} 
          onLike={handleLike}
          onRetweet={handleRetweet}
          showCommentsInline={true} 
        />
        
        {/* Reply Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Reply to this post</h3>
          <ReplyForm postId={postId} onReply={handleReply} />
        </div>

        {/* Comments Section */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Comments</h2>
          <CommentSection postId={postId} />
        </div>
      </div>
    </div>
  );
};

export default PostComments;