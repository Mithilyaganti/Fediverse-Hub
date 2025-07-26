import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Activity, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { ServerSelector } from '@/components/ServerSelector';
import { ThemeToggle } from '@/components/ThemeToggle';

const Signup = () => {
  const [selectedServer, setSelectedServer] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServer && username && email && password && password === confirmPassword) {
      // Mock signup - in real app, this would create account on the selected server
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Users className="h-8 w-8 text-primary" />
                <Activity className="h-4 w-4 text-accent absolute -top-1 -right-1" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">FediStream</h1>
                <p className="text-xs text-muted-foreground">Federated Social Aggregator</p>
              </div>
            </div>
          </div>
          
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-4xl space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Join the Fediverse</h2>
            <p className="text-muted-foreground">Create your account on the federated network</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Server Selection */}
            <div className="space-y-4">
              <ServerSelector 
                selectedServer={selectedServer} 
                onServerSelect={setSelectedServer} 
              />
            </div>

            {/* Signup Form */}
            <Card className="p-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                  />
                  {password && confirmPassword && password !== confirmPassword && (
                    <p className="text-sm text-destructive">Passwords do not match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!selectedServer || !username || !email || !password || password !== confirmPassword}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </Button>

                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate('/login')}
                    className="text-muted-foreground"
                  >
                    Already have an account? Sign in
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;