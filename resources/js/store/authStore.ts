import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    name: string;
    isAdmin: boolean;
    created: string;
    updated: string;
    verified: boolean;
}

interface RegisterData {
    email: string;
    password: string;
    passwordConfirm: string;
    name: string;
}

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    isAdmin: boolean;
}

interface AuthActions {
    setUser: (user: User | null) => void;
    clearError: () => void;
    init: () => Promise<void>;
    login: (email: string, password: string) => Promise<boolean>;
    register: (userData: RegisterData) => Promise<void>;
    refreshUser: () => Promise<void>;
    logout: () => void;
}

type AuthStore = AuthState & AuthActions;

// Predefined users
const users = {
    admin: {
        id: '1',
        email: 'admin@store.com',
        password: 'admin@store.com',
        name: 'Admin',
        isAdmin: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        verified: true
    },
    user: {
        id: '2',
        email: 'user@store.com',
        password: 'user@store.com',
        name: 'User',
        isAdmin: false,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        verified: true
    }
};

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            isLoading: false,
            error: null,
            isAdmin: false,

            setUser: (user) => set({ user, isAdmin: user?.isAdmin || false }),
            clearError: () => set({ error: null }),
            init: async () => {},
            login: async (email: string, password: string) => {
                set({ isLoading: true, error: null });
                try {
                    // Check predefined users
                    if (email === users.admin.email && password === users.admin.password) {
                        set({ user: users.admin, isAdmin: true, error: null });
                        return true;
                    }
                    if (email === users.user.email && password === users.user.password) {
                        set({ user: users.user, isAdmin: false, error: null });
                        return true;
                    }
                    set({ error: 'Invalid email or password' });
                    return false;
                } catch (error) {
                    set({ error: (error as Error).message });
                    return false;
                } finally {
                    set({ isLoading: false });
                }
            },
            register: async (userData: RegisterData) => {
                set({ isLoading: true, error: null });
                try {
                    // For demo, just create a new user
                    const newUser = {
                        id: Math.random().toString(),
                        email: userData.email,
                        name: userData.name,
                        isAdmin: false,
                        created: new Date().toISOString(),
                        updated: new Date().toISOString(),
                        verified: true
                    };
                    set({ user: newUser, isAdmin: false });
                } catch (error) {
                    set({ error: (error as Error).message });
                } finally {
                    set({ isLoading: false });
                }
            },
            refreshUser: async () => {},
            logout: () => set({ user: null, isAdmin: false }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAdmin: state.isAdmin
            })
        }
    )
);
