import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Repeat2, MessageCircle, ExternalLink } from 'lucide-react';
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
  onLike?: (postId: string) => void;
  onRetweet?: (postId: string) => void;
  showCommentsInline?: boolean;
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

export const Post = ({ post, onVote, onLike, onRetweet, showCommentsInline = false }: PostProps) => {
  const [showComments, setShowComments] = useState(false);
  const navigate = useNavigate();

  return (
    <Card className="p-6 space-y-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span 
              className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors"
              onClick={() => navigate(`/user/${post.author}`)}
            >
              @{post.author}
            </span>
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
          {/* Like and Retweet buttons */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onLike?.(post.id)}
            className="flex items-center space-x-2 text-muted-foreground hover:text-red-500 transition-colors"
          >
            <Heart className="h-4 w-4" />
            <span className="text-sm">{post.votes}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRetweet?.(post.id)}
            className="flex items-center space-x-2 text-muted-foreground hover:text-green-500 transition-colors"
          >
            <Repeat2 className="h-4 w-4" />
            <span className="text-sm">Retweet</span>
          </Button>

          {/* Comments button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (showCommentsInline) {
                setShowComments(!showComments);
              } else {
                navigate(`/post/${post.id}/comments`);
              }
            }}
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{post.commentsCount}</span>
          </Button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && showCommentsInline && (
        <div className="border-t pt-4">
          <CommentSection postId={post.id} />
        </div>
      )}
    </Card>
  );
};