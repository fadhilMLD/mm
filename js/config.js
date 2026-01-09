// Google OAuth Configuration
const GOOGLE_CONFIG = {
    // Your Google OAuth Client ID
    clientId: '789332121912-7cvjceje8j02qapvpvrsv1pnfckujilu.apps.googleusercontent.com',
    
    // Redirect URI - automatically detects current origin
    redirectUri: window.location.origin + '/auth.html',
    
    // Scopes - what information you want to access
    scope: 'email profile',
    
    // Response type for OAuth flow
    responseType: 'token id_token',
    
    // Prompt user to select account
    prompt: 'select_account'
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GOOGLE_CONFIG;
}
