"use client";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export interface AuthUser {
  id: string;
  name: string;
}

const CREDENTIALS = [
  { username: "guide1", password: "password123" },
  { username: "guide2", password: "password456" },
  { username: "admin", password: "admin123" },
];

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("auth_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to load stored user:", error);
        await AsyncStorage.removeItem("auth_user");
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const validUser = CREDENTIALS.find(
      (cred) => cred.username === username && cred.password === password
    );

    if (validUser) {
      const authUser: AuthUser = {
        id: validUser.username,
        name:
          validUser.username.charAt(0).toUpperCase() +
          validUser.username.slice(1),
      };

      try {
        await AsyncStorage.setItem("auth_user", JSON.stringify(authUser));
        setUser(authUser);
      } catch (error) {
        console.error("Failed to save user:", error);
      }

      return true;
    }

    return false;
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem("auth_user");
      setUser(null);
    } catch (error) {
      console.error("Failed to remove user:", error);
    }
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}
