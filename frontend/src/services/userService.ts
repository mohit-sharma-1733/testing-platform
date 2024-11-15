import { User } from "@/types";
import axios from "axios";
import Cookies from "js-cookie";
const API_BASE_URL =
	process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const api = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Add interceptor to include auth token
api.interceptors.request.use((config) => {
	const token = Cookies.get("access_token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});
export const userService = {
	getUsers: async (
		page: number = 1,
		per_page: number = 10,
		search: string = ""
	) => {
		const response = await api.get(
			`/users/list?page=${page}&per_page=${per_page}&search=${search}`
		);
		return response.data;
	},

	getUser: async (id: number) => {
		const response = await api.get(`/users/${id}`);
		return response.data;
	},
};
