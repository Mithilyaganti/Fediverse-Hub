import { User, UserModel } from '../models';

// OAuth service for handling authentication and account linking
export async function loginWithProvider(provider: string, code: string) {
  try {
    // Mock OAuth flow - replace with actual OAuth implementation
    
    // In real implementation, exchange code for access token:
    // const tokenResponse = await fetch(`https://api.${provider}.com/oauth2/token`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    //   body: new URLSearchParams({
    //     grant_type: 'authorization_code',
    //     code,
    //     client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`],
    //     client_secret: process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]
    //   })
    // });
    
    // Check if user already exists
    const existingUser = await UserModel.findOne({ 
      [`connectedAccounts.${provider}.username`]: `testuser_${provider}` 
    });
    
    if (existingUser) {
      return { 
        success: true, 
        provider, 
        token: existingUser.connectedAccounts[provider]?.token,
        user: existingUser 
      };
    }
    
    // Create new user
    const newUser = new UserModel({
      username: `testuser_${provider}`,
      email: `user@${provider}.com`,
      connectedAccounts: {
        [provider]: {
          token: `mock_token_${provider}_${Date.now()}`,
          username: `testuser_${provider}`
        }
      }
    });
    
    await newUser.save();
    
    return { 
      success: true, 
      provider, 
      token: newUser.connectedAccounts[provider]?.token,
      user: newUser 
    };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: 'Login failed' };
  }
}

export async function linkAccount(provider: string, code: string, userId: string) {
  try {
    // Find existing user
    const user = await UserModel.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    // Link new account
    user.connectedAccounts[provider] = {
      token: `mock_token_${provider}_${Date.now()}`,
      username: `testuser_${provider}`
    };
    
    await user.save();
    
    return { success: true, provider, linkedAccounts: Object.keys(user.connectedAccounts) };
  } catch (error) {
    console.error('Link account error:', error);
    return { success: false, error: 'Failed to link account' };
  }
}
