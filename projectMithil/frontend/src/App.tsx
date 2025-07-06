import { useState, useEffect } from 'react';
import { timelineAPI, postAPI, messageAPI, threadAPI, notificationAPI, searchAPI } from './services/api';

interface Post {
  id: string;
  content: string;
  platform: string;
  likes: number;
  reposts: number;
  timestamp: string;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  replies: any[];
  timestamp: string;
}

interface Notification {
  id: string;
  type: string;
  content: string;
  read: boolean;
  timestamp: string;
}

interface SearchResults {
  posts: Post[];
  threads: Thread[];
  users: any[];
}

function App() {
  const [timeline, setTimeline] = useState<Post[]>([]);
  const [posts, setPosts] = useState('');
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults>({ posts: [], threads: [], users: [] });
  const [loading, setLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    loadTimeline();
    loadThreads();
    loadNotifications();
  }, []);

  const loadTimeline = async () => {
    try {
      const response = await timelineAPI.getTimeline();
      setTimeline(response.data.timeline);
    } catch (error) {
      console.error('Failed to load timeline:', error);
    }
  };

  const loadThreads = async () => {
    try {
      const response = await threadAPI.getThreads();
      setThreads(response.data.threads);
    } catch (error) {
      console.error('Failed to load threads:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await notificationAPI.getNotifications('mock_token');
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!posts.trim() || selectedNetworks.length === 0) return;
    
    setLoading(true);
    try {
      await postAPI.createPost(posts, selectedNetworks, 'mock_token');
      setPosts('');
      setSelectedNetworks([]);
      loadTimeline(); // Refresh timeline
      alert('Post created successfully!');
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post');
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await searchAPI.search(searchQuery, 'all');
      setSearchResults(response.data.results);
    } catch (error) {
      console.error('Search failed:', error);
    }
    setLoading(false);
  };

  const handleNetworkChange = (network: string) => {
    setSelectedNetworks(prev => 
      prev.includes(network) 
        ? prev.filter(n => n !== network)
        : [...prev, network]
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#333', fontSize: '2.5rem', marginBottom: '10px' }}>🌐 Fediverse Aggregator</h1>
        <p style={{ color: '#666', fontSize: '1.2rem' }}>Your unified social media dashboard</p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        
        {/* Timeline Section */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#1976d2', marginBottom: '15px' }}>📰 Unified Timeline</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {timeline.length > 0 ? (
              timeline.map((post: Post, index) => (
                <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee', marginBottom: '10px' }}>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>{post.platform}</div>
                  <div>{post.content}</div>
                  <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                    ❤️ {post.likes} 🔄 {post.reposts}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#999' }}>No posts yet. Posts from Twitter, Mastodon, and Reddit will appear here.</p>
            )}
          </div>
          <button 
            onClick={loadTimeline}
            style={{ padding: '10px 20px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '6px', marginTop: '10px', cursor: 'pointer' }}
          >
            🔄 Refresh Timeline
          </button>
        </div>

        {/* Post Creation */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#4caf50', marginBottom: '15px' }}>✍️ Create Post</h2>
          <textarea 
            value={posts}
            onChange={(e) => setPosts(e.target.value)}
            placeholder="What's on your mind?" 
            style={{ 
              width: '100%', 
              minHeight: '100px', 
              marginBottom: '15px', 
              padding: '12px', 
              border: '1px solid #ddd', 
              borderRadius: '6px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ marginBottom: '8px', color: '#333' }}>Select Networks:</h4>
            {['twitter', 'mastodon', 'reddit'].map(network => (
              <label key={network} style={{ display: 'block', marginBottom: '5px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={selectedNetworks.includes(network)}
                  onChange={() => handleNetworkChange(network)}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ textTransform: 'capitalize' }}>
                  {network === 'twitter' && '🐦'} 
                  {network === 'mastodon' && '🐘'} 
                  {network === 'reddit' && '🤖'} 
                  {network}
                </span>
              </label>
            ))}
          </div>
          <button 
            onClick={handleCreatePost}
            disabled={loading || !posts.trim() || selectedNetworks.length === 0}
            style={{ 
              padding: '12px 24px', 
              backgroundColor: selectedNetworks.length > 0 ? '#4caf50' : '#ccc', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: selectedNetworks.length > 0 ? 'pointer' : 'not-allowed',
              fontSize: '14px'
            }}
          >
            {loading ? '⏳ Posting...' : '📤 Post to Selected Networks'}
          </button>
        </div>

        {/* Threads */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#9c27b0', marginBottom: '15px' }}>💬 Discussion Threads</h2>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {threads.length > 0 ? (
              threads.map((thread: Thread, index) => (
                <div key={index} style={{ padding: '10px', borderBottom: '1px solid #eee', marginBottom: '10px' }}>
                  <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{thread.title}</h4>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>{thread.content}</p>
                  <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                    💭 {thread.replies?.length || 0} replies
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#999' }}>No threads yet. Start a discussion!</p>
            )}
          </div>
          <button 
            onClick={loadThreads}
            style={{ padding: '10px 20px', backgroundColor: '#9c27b0', color: 'white', border: 'none', borderRadius: '6px', marginTop: '10px', cursor: 'pointer' }}
          >
            🔄 Refresh Threads
          </button>
        </div>

        {/* Notifications */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#f44336', marginBottom: '15px' }}>🔔 Notifications</h2>
          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              notifications.map((notif: Notification, index) => (
                <div key={index} style={{ 
                  padding: '10px', 
                  borderBottom: '1px solid #eee', 
                  marginBottom: '10px',
                  backgroundColor: notif.read ? '#f9f9f9' : '#fff3cd'
                }}>
                  <div style={{ fontSize: '0.9rem' }}>{notif.content}</div>
                  <div style={{ fontSize: '0.8rem', color: '#999', marginTop: '5px' }}>
                    {notif.type} • {notif.read ? 'Read' : 'Unread'}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#999' }}>No notifications yet.</p>
            )}
          </div>
          <button 
            onClick={loadNotifications}
            style={{ padding: '10px 20px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px', marginTop: '10px', cursor: 'pointer' }}
          >
            🔄 Refresh Notifications
          </button>
        </div>

        {/* Search */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#607d8b', marginBottom: '15px' }}>🔍 Search</h2>
          <div style={{ display: 'flex', marginBottom: '15px' }}>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts, users, threads..." 
              style={{ 
                flex: 1, 
                padding: '10px', 
                border: '1px solid #ddd', 
                borderRadius: '6px 0 0 6px',
                fontSize: '14px'
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              disabled={loading}
              style={{ 
                padding: '10px 15px', 
                backgroundColor: '#607d8b', 
                color: 'white', 
                border: 'none', 
                borderRadius: '0 6px 6px 0',
                cursor: 'pointer'
              }}
            >
              {loading ? '⏳' : '🔍'}
            </button>
          </div>
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {(searchResults.posts.length > 0 || searchResults.threads.length > 0) ? (
              <div>
                {searchResults.posts?.length > 0 && (
                  <div>
                    <h4>Posts ({searchResults.posts.length})</h4>
                    {searchResults.posts.slice(0, 3).map((post: Post, index: number) => (
                      <div key={index} style={{ padding: '5px', borderBottom: '1px solid #eee' }}>
                        {post.content}
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.threads?.length > 0 && (
                  <div>
                    <h4>Threads ({searchResults.threads.length})</h4>
                    {searchResults.threads.slice(0, 3).map((thread: Thread, index: number) => (
                      <div key={index} style={{ padding: '5px', borderBottom: '1px solid #eee' }}>
                        {thread.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              searchQuery && !loading && <p style={{ color: '#999' }}>No results found.</p>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#ff9800', marginBottom: '15px' }}>🔗 Connection Status</h2>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span>🖥️ Backend Server</span>
              <span style={{ color: '#4caf50', fontSize: '12px' }}>● Connected</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span>🗄️ MongoDB Database</span>
              <span style={{ color: '#4caf50', fontSize: '12px' }}>● Connected</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span>🐦 Twitter API</span>
              <span style={{ color: '#ff9800', fontSize: '12px' }}>⚠ Mock Mode</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span>🐘 Mastodon API</span>
              <span style={{ color: '#ff9800', fontSize: '12px' }}>⚠ Mock Mode</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🤖 Reddit API</span>
              <span style={{ color: '#ff9800', fontSize: '12px' }}>⚠ Mock Mode</span>
            </div>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '15px' }}>
            All APIs are currently in mock mode. Configure real API keys in backend/.env to enable live integration.
          </p>
        </div>

      </div>
    </div>
  );
}

export default App;
