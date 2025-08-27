'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { userAPI } from 'haze.bio/api';

interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    updateUser: (user: User | Partial<User>) => Promise<void>;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children, initialUser }: { children: ReactNode; initialUser?: User }) => {
    const [user, setUser] = useState<User | null>(initialUser || null);

    const fetchUser = async () => {
        try {
            const currentUser = await userAPI.getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error('Failed to fetch user:', error);
            setUser(null);
        }
    };

    useEffect(() => {
        if (!initialUser) {
            fetchUser();
        }
    }, [initialUser]);

    const updateUser = async (updatedFields: User | Partial<User>) => {
        setUser(currentUser => {
            if (!currentUser) return updatedFields as User;
            const isFullUpdate = Object.keys(updatedFields).length === Object.keys(currentUser).length;
            return isFullUpdate ? (updatedFields as User) : { ...currentUser, ...updatedFields };
        });
    };

    const refreshUser = async () => {
        await fetchUser();
    };


    return (
        <UserContext.Provider value={{ user, setUser, updateUser, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};