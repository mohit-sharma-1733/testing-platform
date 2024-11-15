// src/services/api.ts
import { TestSession } from "@/types";
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

export const testService = {
	getDashboardStats: async (isAdmin: string) => {
		const response = await api.get("/dashboard/stats");
		return response.data;
	},
	createTest: async (testData: any) => {
		const response = await api.post("/tests/create", testData);
		return response.data;
	},

	getTests: async (page = 1, perPage = 10) => {
		const response = await api.get(
			`/tests/list?page=${page}&per_page=${perPage}`
		);
		return response.data;
	},

	getTest: async (id: number | string) => {
		const response = await api.get(`/tests/${id}`);
		return response.data;
	},

	deleteTest: async (id: number | string) => {
		const response = await api.delete(`/tests/delete/${id}`);
		return response.data;
	},

	updateTest: async (id: number | string, testData: any) => {
		const response = await api.put(`/tests/${id}`, testData);
		return response.data;
	},
	getTestQuestions: async (testId: string | number) => {
		try {
			const response = await api.get(`/tests/${testId}/questions`);
			return response.data;
		} catch (error) {
			console.error("Error fetching test questions:", error);
			throw error;
		}
	},
	getTestResults: async (
		testId: string | number,
		sessionId: string | number
	) => {
		try {
			const response = await api.get(`/tests/${testId}/results/${sessionId}`);
			return response.data;
		} catch (error) {
			console.error("Error fetching test results:", error);
			throw error;
		}
	},
	getSessionStatus: async (testId: string | number): Promise<TestSession> => {
		const response = await api.get(`/tests/${testId}/session/status`);
		return response.data;
	},

	updateSessionTime: async (
		testId: string | number,
		data: { remaining_time: number }
	) => {
		const response = await api.post(
			`/tests/${testId}/session/update-time`,
			data
		);
		return response.data;
	},

	updateProgress: async (
		testId: string | number,
		data: {
			current_question_index: number;
			remaining_time: number;
			answers: Record<number, any>;
		}
	) => {
		const response = await api.post(`/tests/${testId}/progress`, data);
		return response.data;
	},

	submitTest: async (
		testId: string | number,
		data: {
			answers: Record<number, any>;
			timeSpent: number;
		}
	) => {
		const response = await api.post(`/tests/${testId}/submit`, data);
		return response.data;
	},
	getLeaderboard: async () => {
		const response = await api.get("/leaderboard/list");
		return response.data;
	},
};

export default api;
