/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useMemo, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [token, setTokenState] = useState(() => localStorage.getItem("token") || "");

    const setToken = useCallback((nextToken) => {
        if (nextToken) {
            localStorage.setItem("token", nextToken);
        } else {
            localStorage.removeItem("token");
        }

        setTokenState(nextToken || "");
    }, []);

    const logout = useCallback(() => {
        setToken("");
    }, [setToken]);

    const value = useMemo(() => ({
        token,
        isLoggedIn: Boolean(token),
        setToken,
        logout,
        setIsLoggedIn: (nextValue) => {
            if (!nextValue) {
                setToken("");
            }
        },
    }), [logout, setToken, token]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}
