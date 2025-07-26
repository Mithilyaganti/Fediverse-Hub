import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface ReplyFormProps {
  postId: string;
  onReply: (content: string) => void;
}

export const ReplyForm = ({ postId, onReply }: ReplyFormProps) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onReply(content);
      setContent('');
    }
  };

  return (
    <Card className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Textarea
            placeholder="Write your reply..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            {content.length}/280 characters
          </span>
          
          <Button
            type="submit"
            disabled={!content.trim() || content.length > 280}
            size="sm"
          >
            <Send className="h-4 w-4 mr-2" />
            Reply
          </Button>
        </div>
      </form>
    </Card>
  );
};