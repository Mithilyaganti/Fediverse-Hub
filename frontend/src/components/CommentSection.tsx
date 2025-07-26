import { useState, useEffect } from 'react';
import { CommentThread } from './CommentThread';
import { LoadingSpinner } from './LoadingSpinner';

export interface CommentData {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  votes: number;
  userVote?: 'up' | 'down' | null;
  replies: CommentData[];
  depth: number;
}

interface CommentSectionProps {
  postId: string;
}

// Mock API function for comments
const fetchComments = async (postId: string): Promise<CommentData[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const generateComment = (depth: number = 0, parentId?: string): CommentData => {
    const id = `comment-${postId}-${Math.random().toString(36).substr(2, 9)}`;
    const hasReplies = depth < 3 && Math.random() > 0.6;
    
    return {
      id,
      author: `user_${Math.floor(Math.random() * 1000)}`,
      content: `This is a comment at depth ${depth}. ${
        depth === 0 ? 'This is a top-level comment with some interesting thoughts about the post.' :
        depth === 1 ? 'This is a reply to the comment above.' :
        'This is a nested reply that goes deeper into the discussion.'
      } Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      votes: Math.floor(Math.random() * 50) - 10,
      userVote: Math.random() > 0.8 ? (Math.random() > 0.5 ? 'up' : 'down') : null,
      depth,
      replies: hasReplies ? Array.from(
        { length: Math.floor(Math.random() * 3) + 1 }, 
        () => generateComment(depth + 1, id)
      ) : []
    };
  };

  const comments = Array.from({ length: Math.floor(Math.random() * 8) + 3 }, () => generateComment(0));
  return comments;
};

export const CommentSection = ({ postId }: CommentSectionProps) => {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);

  const handleVote = (commentId: string, voteType: 'up' | 'down') => {
    const updateComment = (comment: CommentData): CommentData => {
      if (comment.id === commentId) {
        const currentVote = comment.userVote;
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
          ...comment,
          userVote: newVote,
          votes: comment.votes + voteChange
        };
      }

      return {
        ...comment,
        replies: comment.replies.map(updateComment)
      };
    };

    setComments(prev => prev.map(updateComment));
  };

  useEffect(() => {
    const loadComments = async () => {
      setLoading(true);
      try {
        const commentsData = await fetchComments(postId);
        setComments(commentsData);
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadComments();
  }, [postId]);

  if (loading) {
    return (
      <div className="py-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No comments yet. Be the first to comment!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map(comment => (
        <CommentThread
          key={comment.id}
          comment={comment}
          onVote={handleVote}
        />
      ))}
    </div>
  );
};