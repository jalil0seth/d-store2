import PocketBase, { AuthModel } from 'pocketbase';

// Get the API URL from Vite environment or use a default
const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8090';

// Initialize PocketBase with the API URL
const pb = new PocketBase(apiUrl);

// Add auth change listener with proper error handling
pb.authStore.onChange((token: string, model: AuthModel | null) => {
    try {
        if (!pb.authStore.isValid) {
            // Clear any user-specific data from localStorage
            localStorage.removeItem('user');
            
            // Only redirect to login if we're not already there
            if (!window.location.pathname.includes('/signin')) {
                window.location.href = '/signin';
            }
        } else if (model) {
            // Store user data
            localStorage.setItem('user', JSON.stringify(model));
        }
    } catch (error) {
        console.error('Auth store change error:', error);
        // Ensure we're in a safe state
        localStorage.removeItem('user');
    }
});

// Export the configured instance
export { pb };

// Export a type-safe function to get the current user
export const getCurrentUser = (): AuthModel | null => {
    try {
        const userData = localStorage.getItem('user');
        return userData ? JSON.parse(userData) : null;
    } catch {
        return null;
    }
};
