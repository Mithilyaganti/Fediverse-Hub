import { useState } from 'react';
import { Search, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';

const mockServers = [
  { name: 'mastodon.social', users: '142K', type: 'Mastodon' },
  { name: 'lemmy.world', users: '89K', type: 'Lemmy' },
  { name: 'mas.to', users: '67K', type: 'Mastodon' },
  { name: 'lemmy.ml', users: '45K', type: 'Lemmy' },
  { name: 'fosstodon.org', users: '34K', type: 'Mastodon' },
  { name: 'beehaw.org', users: '28K', type: 'Lemmy' },
  { name: 'hachyderm.io', users: '23K', type: 'Mastodon' },
  { name: 'lemmy.ca', users: '19K', type: 'Lemmy' },
  { name: 'techhub.social', users: '15K', type: 'Mastodon' },
  { name: 'sh.itjust.works', users: '12K', type: 'Lemmy' },
];

interface ServerSelectorProps {
  selectedServer: string;
  onServerSelect: (server: string) => void;
}

export const ServerSelector = ({ selectedServer, onServerSelect }: ServerSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredServers = mockServers.filter(server =>
    server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    server.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center space-x-2">
        <Globe className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold text-foreground">Select a Server</h3>
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search servers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-48 w-full">
        <div className="space-y-2">
          {filteredServers.map((server) => (
            <div
              key={server.name}
              onClick={() => onServerSelect(server.name)}
              className={`p-3 rounded-md cursor-pointer transition-colors border ${
                selectedServer === server.name
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-accent border-border'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{server.name}</p>
                  <p className="text-sm text-muted-foreground">{server.type}</p>
                </div>
                <span className="text-sm text-muted-foreground">{server.users} users</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};