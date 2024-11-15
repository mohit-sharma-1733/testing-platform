"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { testService } from "@/services/testService";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";
import {
	Trophy,
	Target,
	Clock,
	CheckCircle2,
	XCircle,
	Frown,
	Medal,
	PartyPopper,
	ArrowRight,
	RefreshCcw,
	AlertCircle,
} from "lucide-react";

interface TestResult {
	test_id: number;
	test_title: string;
	session_id: number;
	start_time: string;
	end_time: string;
	time_taken: number;
	total_points: number;
	earned_points: number;
	score_percentage: number;
	passing_score: number;
	passed: boolean;
	questions: QuestionResult[];
	total_questions: number;
	correct_answers: number;
	incorrect_answers: number;
	unanswered: number;
}

interface QuestionResult {
	id: number;
	question_text: string;
	question_type: string;
	points: number;
	explanation: string;
	options: OptionResult[];
	user_answer: any;
	is_correct: boolean | null;
}

interface OptionResult {
	id: number;
	text: string;
	is_correct: boolean;
	user_selected?: boolean;
}

export default function TestResultPage() {
	const params = useParams();
	const searchParams = useSearchParams();
	if (!searchParams) {
		return <div>Error: Search parameters are missing</div>;
	}
	const router = useRouter();
	const [result, setResult] = useState<TestResult | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const triggerConfetti = () => {
		const duration = 3 * 1000;
		const animationEnd = Date.now() + duration;
		const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

		function randomInRange(min: number, max: number) {
			return Math.random() * (max - min) + min;
		}

		const interval = setInterval(function () {
			const timeLeft = animationEnd - Date.now();

			if (timeLeft <= 0) {
				clearInterval(interval);
				return;
			}

			const particleCount = 50 * (timeLeft / duration);

			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
			});
			confetti({
				...defaults,
				particleCount,
				origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
			});
		}, 250);

		// Cleanup function
		return () => clearInterval(interval);
	};
	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	};

	useEffect(() => {
		const fetchResult = async () => {
			try {
				setLoading(true);

				const sessionId = searchParams?.get("session");
				const testId = params?.id;

				if (!sessionId) {
					throw new Error("No session ID provided");
				}

				if (!testId || Array.isArray(testId)) {
					throw new Error("Invalid test ID");
				}

				const data = await testService.getTestResults(testId, sessionId);
				setResult(data);

				if (data.passed) {
					setTimeout(() => {
						triggerConfetti();
					}, 500);
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to load test results";
				setError(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		fetchResult();
	}, [params?.id, searchParams]);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	if (error || !result) {
		return (
			<div className="p-6">
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
					<AlertCircle className="h-5 w-5 mr-2" />
					{error || "Failed to load test results"}
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			{/* Result Header */}
			<div
				className={`text-center p-8 rounded-lg mb-8 ${
					result.passed ? "bg-green-50" : "bg-red-50"
				}`}
			>
				<div className="flex justify-center mb-4">
					{result.passed ? (
						<div className="animate-bounce">
							<Trophy className="h-16 w-16 text-yellow-500" />
						</div>
					) : (
						<div className="animate-pulse">
							<Frown className="h-16 w-16 text-red-500" />
						</div>
					)}
				</div>

				<h1 className="text-3xl font-bold mb-2">
					{result.passed ? "Congratulations!" : "Better Luck Next Time!"}
				</h1>
				<p className="text-lg text-gray-600 mb-4">
					{result.passed
						? "You've successfully passed the test!"
						: "Don't give up! Learning is a journey of continuous improvement."}
				</p>
				<h2 className="text-xl font-semibold text-gray-800">
					{result.test_title}
				</h2>
				<div className="mt-4 text-sm text-gray-500">
					{result.passed ? (
						<div className="flex items-center justify-center space-x-2">
							<PartyPopper className="h-5 w-5 text-yellow-500" />
							<span>You've demonstrated excellent understanding!</span>
						</div>
					) : (
						<div className="flex items-center justify-center space-x-2">
							<Target className="h-5 w-5 text-blue-500" />
							<span>
								Target Score: {result.passing_score}% | Your Score:{" "}
								{Math.round(result.score_percentage)}%
							</span>
						</div>
					)}
				</div>
			</div>

			{/* Score Card */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
				<div className="bg-white rounded-lg shadow-lg p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold">Your Score</h3>
						<Target className="h-6 w-6 text-blue-500" />
					</div>
					<div className="relative pt-1">
						<Progress
							value={result.score_percentage}
							className={`h-4 ${result.passed ? "bg-green-100" : "bg-red-100"}`}
						/>
						<div className="flex justify-between mt-2">
							<span className="text-xs font-semibold inline-block text-blue-600">
								{Math.round(result.score_percentage)}%
							</span>
							<span className="text-xs font-semibold inline-block text-gray-600">
								Passing Score: {result.passing_score}%
							</span>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-lg p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold">Time Spent</h3>
						<Clock className="h-6 w-6 text-blue-500" />
					</div>
					<p className="text-3xl font-bold text-gray-700">
						{formatTime(result.time_taken)}
					</p>
				</div>
			</div>

			{/* Statistics */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<div className="bg-white rounded-lg shadow-lg p-6">
					<div className="flex items-center space-x-2 mb-2">
						<Target className="h-5 w-5 text-blue-500" />
						<h3 className="text-lg font-semibold">Total Questions</h3>
					</div>
					<p className="text-3xl font-bold text-gray-700">
						{result.total_questions}
					</p>
				</div>

				<div className="bg-white rounded-lg shadow-lg p-6">
					<div className="flex items-center space-x-2 mb-2">
						<CheckCircle2 className="h-5 w-5 text-green-500" />
						<h3 className="text-lg font-semibold">Correct</h3>
					</div>
					<p className="text-3xl font-bold text-green-600">
						{result.correct_answers}
					</p>
				</div>

				<div className="bg-white rounded-lg shadow-lg p-6">
					<div className="flex items-center space-x-2 mb-2">
						<XCircle className="h-5 w-5 text-red-500" />
						<h3 className="text-lg font-semibold">Incorrect</h3>
					</div>
					<p className="text-3xl font-bold text-red-600">
						{result.incorrect_answers}
					</p>
				</div>

				<div className="bg-white rounded-lg shadow-lg p-6">
					<div className="flex items-center space-x-2 mb-2">
						<AlertCircle className="h-5 w-5 text-yellow-500" />
						<h3 className="text-lg font-semibold">Unanswered</h3>
					</div>
					<p className="text-3xl font-bold text-yellow-600">
						{result.unanswered}
					</p>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-center">
				<Button
					onClick={() => router.push("/dashboard/tests")}
					variant="outline"
					className="flex items-center space-x-2"
				>
					<ArrowRight className="h-4 w-4" />
					<span>Back to Tests</span>
				</Button>
			</div>

			{/* Achievement Badge */}
			{result.passed && (
				<div className="fixed bottom-8 right-8 animate-bounce">
					<div className="bg-yellow-500 rounded-full p-4 shadow-lg">
						<Medal className="h-8 w-8 text-white" />
					</div>
				</div>
			)}
		</div>
	);
}
