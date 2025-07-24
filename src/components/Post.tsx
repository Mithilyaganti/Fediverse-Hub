import { useState } from 'react';
import { ChevronUp, ChevronDown, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CommentSection } from './CommentSection';

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

interface PostProps {
  post: PostData;
  onVote: (postId: string, voteType: 'up' | 'down') => void;
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

const getPlatformColor = (platform: string) => {
  switch (platform) {
    case 'mastodon': return 'bg-blue-500';
    case 'lemmy': return 'bg-green-500';
    case 'peertube': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

export const Post = ({ post, onVote }: PostProps) => {
  const [showComments, setShowComments] = useState(false);

  return (
    <Card className="p-6 space-y-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-foreground">@{post.author}</span>
            <Badge variant="secondary" className={`text-xs ${getPlatformColor(post.platform)} text-white`}>
              {post.platform}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">
            {formatTimeAgo(post.timestamp)}
          </span>
        </div>
        <Button variant="ghost" size="sm">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="text-foreground leading-relaxed">
        {post.content}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-4">
          {/* Vote buttons */}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVote(post.id, 'up')}
              className={`h-8 w-8 p-0 hover:bg-vote-up/10 ${
                post.userVote === 'up' 
                  ? 'text-vote-up-active bg-vote-up/10' 
                  : 'text-muted-foreground hover:text-vote-up'
              }`}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            
            <span className={`min-w-[2rem] text-center text-sm font-medium ${
              post.votes > 0 ? 'text-vote-up' : 
              post.votes < 0 ? 'text-vote-down' : 
              'text-muted-foreground'
            }`}>
              {post.votes}
            </span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onVote(post.id, 'down')}
              className={`h-8 w-8 p-0 hover:bg-vote-down/10 ${
                post.userVote === 'down' 
                  ? 'text-vote-down-active bg-vote-down/10' 
                  : 'text-muted-foreground hover:text-vote-down'
              }`}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Comments button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{post.commentsCount}</span>
          </Button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t pt-4">
          <CommentSection postId={post.id} />
        </div>
      )}
    </Card>
  );
};