import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronRight, ChevronDown as ChevronDownExpand } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CommentData } from './CommentSection';

interface CommentProps {
  comment: CommentData;
  onVote: (commentId: string, voteType: 'up' | 'down') => void;
}

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export const Comment = ({ comment, onVote }: CommentProps) => {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(false)}
          className="h-6 w-6 p-0"
        >
          <ChevronRight className="h-3 w-3" />
        </Button>
        <span>@{comment.author}</span>
        <span>({comment.votes} votes)</span>
        <span>{comment.replies.length > 0 && `${comment.replies.length} replies`}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Comment Header */}
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(true)}
          className="h-6 w-6 p-0"
        >
          <ChevronDownExpand className="h-3 w-3" />
        </Button>
        <span className="font-medium text-sm">@{comment.author}</span>
        <span className="text-xs text-muted-foreground">
          {formatTimeAgo(comment.timestamp)}
        </span>
      </div>

      {/* Comment Content */}
      <div className="ml-8 space-y-2">
        <div className="text-sm leading-relaxed text-foreground">
          {comment.content}
        </div>

        {/* Vote buttons */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote(comment.id, 'up')}
            className={`h-6 w-6 p-0 hover:bg-vote-up/10 ${
              comment.userVote === 'up' 
                ? 'text-vote-up-active bg-vote-up/10' 
                : 'text-muted-foreground hover:text-vote-up'
            }`}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          
          <span className={`min-w-[1.5rem] text-center text-xs font-medium ${
            comment.votes > 0 ? 'text-vote-up' : 
            comment.votes < 0 ? 'text-vote-down' : 
            'text-muted-foreground'
          }`}>
            {comment.votes}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onVote(comment.id, 'down')}
            className={`h-6 w-6 p-0 hover:bg-vote-down/10 ${
              comment.userVote === 'down' 
                ? 'text-vote-down-active bg-vote-down/10' 
                : 'text-muted-foreground hover:text-vote-down'
            }`}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};