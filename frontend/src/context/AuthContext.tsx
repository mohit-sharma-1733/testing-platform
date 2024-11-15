"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/use-toast";
import axios from "axios";
import Cookies from "js-cookie";

interface User {
	id: number;
	email: string;
	name: string;
	role: "admin" | "user";
}

interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	login: (email: string, password: string) => Promise<void>;
	signup: (data: SignupData) => Promise<void>;
	logout: () => Promise<void>;
	refreshToken: () => Promise<void>;
}

interface SignupData {
	email: string;
	password: string;
	first_name: string;
	last_name: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const COOKIE_OPTIONS = {
	secure: process.env.NODE_ENV === "production",
	sameSite: "strict" as const,
	path: "/",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();
	const { toast } = useToast();

	// Axios interceptor for handling token refresh
	useEffect(() => {
		const interceptor = axios.interceptors.response.use(
			(response) => response,
			async (error) => {
				const originalRequest = error.config;
				if (error.response?.status === 401 && !originalRequest._retry) {
					originalRequest._retry = true;
					try {
						await refreshToken();
						const token = Cookies.get("access_token");
						originalRequest.headers["Authorization"] = `Bearer ${token}`;
						return axios(originalRequest);
					} catch (refreshError) {
						return Promise.reject(refreshError);
					}
				}
				return Promise.reject(error);
			}
		);

		return () => {
			axios.interceptors.response.eject(interceptor);
		};
	}, []);

	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		try {
			const token = Cookies.get("access_token");
			if (!token) {
				setIsLoading(false);
				return;
			}

			const response = await axios.get(
				`${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);

			setUser(response.data);
		} catch (error) {
			Cookies.remove("access_token");
			Cookies.remove("refresh_token");
		} finally {
			setIsLoading(false);
		}
	};

	const login = async (email: string, password: string) => {
		try {
			const response = await axios.post(
				`${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
				{
					email,
					password,
				}
			);

			const { access_token, refresh_token, user } = response.data;

			// Set cookies with proper options
			Cookies.set("access_token", access_token, COOKIE_OPTIONS);
			Cookies.set("refresh_token", refresh_token, COOKIE_OPTIONS);

			setUser(user);
			router.push("/dashboard");

			toast({
				title: "Success",
				description: "Successfully logged in",
			});
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.response?.data?.error || "Login failed",
				variant: "destructive",
			});
			throw error;
		}
	};

	const signup = async (data: SignupData) => {
		try {
			const response = await axios.post(
				`${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
				data
			);

			const { access_token, refresh_token, user } = response.data;

			Cookies.set("access_token", access_token, COOKIE_OPTIONS);
			Cookies.set("refresh_token", refresh_token, COOKIE_OPTIONS);

			setUser(user);
			router.push("/dashboard");

			toast({
				title: "Success",
				description: "Account created successfully",
			});
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.response?.data?.error || "Signup failed",
				variant: "destructive",
			});
			throw error;
		}
	};

	const logout = async () => {
		try {
			const token = Cookies.get("access_token");

			// Call backend logout endpoint to invalidate the token
			await axios.post(
				`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`,
				{},
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			Cookies.remove("access_token", { path: "/" });
			Cookies.remove("refresh_token", { path: "/" });
			setUser(null);
			router.push("/auth/login");
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			// Clear cookies and state regardless of API call success
			Cookies.remove("access_token", { path: "/" });
			Cookies.remove("refresh_token", { path: "/" });
			setUser(null);
			router.push("/auth/login");

			toast({
				title: "Success",
				description: "Successfully logged out",
			});
		}
	};

	const refreshToken = async () => {
		try {
			const refresh_token = Cookies.get("refresh_token");

			const response = await axios.post(
				`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
				{
					refresh_token,
				}
			);

			const { access_token } = response.data;
			Cookies.set("access_token", access_token, COOKIE_OPTIONS);

			return access_token;
		} catch (error) {
			Cookies.remove("access_token", { path: "/" });
			Cookies.remove("refresh_token", { path: "/" });
			setUser(null);
			router.push("/auth/login");
			throw error;
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				isLoading,
				login,
				signup,
				logout,
				refreshToken,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
