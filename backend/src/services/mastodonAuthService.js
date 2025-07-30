const querystring = require('querystring');
const fetch = require('node-fetch');

// In production, these would be per-instance or stored in DB/config
const CLIENT_ID = process.env.MASTODON_CLIENT_ID || 'your_client_id';
const REDIRECT_URI = process.env.MASTODON_REDIRECT_URI || 'http://localhost:3000/api/auth/mastodon/callback';
const SCOPES = 'read write follow';
const CLIENT_SECRET = process.env.MASTODON_CLIENT_SECRET || 'your_client_secret';

exports.getAuthorizationUrl = async (instance_url) => {
    // Basic validation
    if (!/^https?:\/\//.test(instance_url)) throw new Error('Invalid instance_url');
    // Construct the authorization URL
    const params = querystring.stringify({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: SCOPES,
    });
    // Example: https://mastodon.social/oauth/authorize?...params
    return `${instance_url.replace(/\/$/, '')}/oauth/authorize?${params}`;
};

exports.exchangeCodeForToken = async (instance_url, code) => {
    const url = `${instance_url.replace(/\/$/, '')}/oauth/token`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: querystring.stringify({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code',
            code,
        })
    });
    if (!res.ok) throw new Error('Failed to exchange code for token');
    return await res.json();
};

exports.fetchUserProfile = async (instance_url, access_token) => {
    const url = `${instance_url.replace(/\/$/, '')}/api/v1/accounts/verify_credentials`;
    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${access_token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch Mastodon user profile');
    return await res.json();
}; 