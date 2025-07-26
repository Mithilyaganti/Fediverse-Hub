import { Comment } from './Comment';
import type { CommentData } from './CommentSection';

interface CommentThreadProps {
  comment: CommentData;
  onVote: (commentId: string, voteType: 'up' | 'down') => void;
}

export const CommentThread = ({ comment, onVote }: CommentThreadProps) => {
  return (
    <div className="space-y-3">
      <Comment comment={comment} onVote={onVote} />
      
      {comment.replies.length > 0 && (
        <div className="ml-6 pl-4 border-l-2 border-border space-y-3">
          {comment.replies.map(reply => (
            <CommentThread
              key={reply.id}
              comment={reply}
              onVote={onVote}
            />
          ))}
        </div>
      )}
    </div>
  );
};