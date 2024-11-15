export interface Test {
	id: number;
	title: string;
	description?: string;
	duration_minutes: number;
	passing_score: number;
	question_count: number;
	status?: "completed" | "in_progress" | "not_started";
	last_score: number;
	last_attempt_date?: string;
	questions: [];
	session_id?: number;
	remaining_time?: number;
	// Admin-specific fields
	total_attempts?: number;
	pass_rate?: number;
	created_at: string;
	updated_at?: string;
}

export interface Question {
	id: number;
	question_text: string;
	question_type: "single_mcq" | "multiple_mcq" | "fill_blank" | "yes_no";

	options?: Array<{
		id: number;
		text: string;
		is_correct?: boolean;
	}>;
	explanation?: string;
	points: number;
	order: number;
}

export interface QuestionOption {
	id: number;
	text: string;
	is_correct?: boolean;
}

export interface TestSession {
	id: number;
	status: string;
	remaining_time: number;
	start_time: string;
	current_question_index?: number;
}

export interface User {
	id: number;
	email: string;
	first_name: string;
	last_name: string;
	role: string;
	is_active: boolean;
	created_at?: string;
}
