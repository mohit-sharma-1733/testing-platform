"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { testService } from "@/services/testService";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Clock, AlertCircle, Save } from "lucide-react";
import { toast } from "sonner";
import { Question, Test } from "@/types";
import { QuestionComponent } from "./QuestionComponent";
import { debounce } from "lodash";

export default function TakeTestPage() {
	const params = useParams();
	const router = useRouter();
	if (!params) {
		toast.error("Invalid parameters");
		return <div>Error: Invalid Parameters</div>;
	}

	const testId =
		typeof params.id === "string"
			? params.id
			: Array.isArray(params.id)
			? params.id[0]
			: "";

	if (!testId) {
		toast.error("Invalid test ID");
		return <div>Error: Invalid Test ID</div>;
	}

	// State management
	const [test, setTest] = useState<Test | null>(null);
	const [questions, setQuestions] = useState<Question[]>([]);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<number, any>>({});
	const [timeRemaining, setTimeRemaining] = useState<number>(0);
	const [sessionId, setSessionId] = useState<number | null>(null);
	const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Debounced progress update
	const debouncedUpdateProgress = useCallback(
		debounce(
			async (
				index: number,
				currentAnswers: Record<number, any>,
				time: number
			) => {
				if (!sessionId) return;

				setIsSaving(true);
				try {
					await testService.updateProgress(testId, {
						current_question_index: index,
						remaining_time: time,
						answers: currentAnswers,
					});
					toast.success("Progress saved", { duration: 1000 });
				} catch (err) {
					toast.error("Failed to save progress");
					console.error("Error saving progress:", err);
				} finally {
					setIsSaving(false);
				}
			},
			1500,
			{ leading: false, trailing: true }
		),
		[testId, sessionId]
	);

	// Initialize test and session
	useEffect(() => {
		const initializeTest = async () => {
			try {
				setLoading(true);
				const safeTestId = typeof testId === "string" ? testId : "";

				const [testResponse, questionsResponse] = await Promise.all([
					testService.getTest(safeTestId),
					testService.getTestQuestions(safeTestId),
				]);

				setTest(testResponse);
				setQuestions(questionsResponse.questions);
				setSessionId(questionsResponse.session_id);

				setAnswers(questionsResponse.saved_answers || {});
				setCurrentIndex(questionsResponse.current_question_index || 0);
				setTimeRemaining(
					questionsResponse.remaining_time || testResponse.duration_minutes * 60
				);
			} catch (err) {
				const errorMessage =
					err instanceof Error ? err.message : "Failed to initialize test";
				setError(errorMessage);
				toast.error(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		initializeTest();
	}, [testId]);

	// Timer
	useEffect(() => {
		if (!sessionId || timeRemaining <= 0) return;

		const timer = setInterval(() => {
			setTimeRemaining((prev) => {
				const updatedTime = prev - 1;
				if (updatedTime <= 0) {
					clearInterval(timer);
					handleSubmitTest();
				}
				return updatedTime;
			});
		}, 1000);

		return () => {
			clearInterval(timer);
		};
	}, [sessionId, timeRemaining]);

	// Update progress on state changes
	useEffect(() => {
		debouncedUpdateProgress(currentIndex, answers, timeRemaining);
	}, [currentIndex, answers, timeRemaining, debouncedUpdateProgress]);

	// Handle answer updates

	const handleAnswer = (questionId: number, answer: any) => {
		const currentQuestion = questions.find((q) => q.id === questionId);
		setAnswers((prev) => ({
			...prev,
			[questionId]:
				currentQuestion?.question_type === "multiple_mcq"
					? Array.isArray(answer)
						? answer
						: []
					: answer,
		}));
	};

	// Navigation handlers
	const handleNext = () => {
		if (currentIndex < questions.length - 1) {
			setCurrentIndex((prev) => prev + 1);
		}
	};

	const handlePrevious = () => {
		if (currentIndex > 0) {
			setCurrentIndex((prev) => prev - 1);
		}
	};

	// Submit test
	const handleSubmitTest = async () => {
		try {
			setIsSubmitting(true);
			const submitTestId =
				typeof params.id === "string"
					? params.id
					: Array.isArray(params.id)
					? params.id[0]
					: "";

			const submitData = {
				answers: Object.entries(answers).reduce((acc, [questionId, answer]) => {
					const question = questions.find((q) => q.id === parseInt(questionId));
					if (question) {
						if (question.question_type === "multiple_mcq") {
							acc[questionId] = Array.isArray(answer) ? answer : [answer];
						} else if (
							question.question_type === "single_mcq" ||
							question.question_type === "yes_no"
						) {
							acc[questionId] = parseInt(answer as string);
						} else {
							acc[questionId] = answer;
						}
					}
					return acc;
				}, {} as Record<string, any>),
				timeSpent: test!.duration_minutes * 60 - timeRemaining,
			};

			const result = await testService.submitTest(submitTestId, submitData);

			// Redirect to results page
			router.push(`/test/${submitTestId}/result?session=${result.session_id}`);
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to submit test";
			toast.error(errorMessage);
			setShowConfirmSubmit(false);
		} finally {
			setIsSubmitting(false);
		}
	};
	// Format time
	const formatTime = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6">
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
					<AlertCircle className="h-5 w-5 mr-2" />
					{error}
				</div>
			</div>
		);
	}

	const currentQuestion = questions[currentIndex];
	const progress = ((currentIndex + 1) / questions.length) * 100;

	return (
		<div className="max-w-4xl mx-auto p-6">
			{/* Header */}
			<div className="mb-6 flex justify-between items-center">
				<h1 className="text-2xl font-bold">{test?.title}</h1>
				<div className="flex items-center space-x-4">
					{isSaving && (
						<div className="flex items-center text-sm text-gray-500">
							<Save className="h-4 w-4 mr-1 animate-pulse" />
							Saving...
						</div>
					)}
					<div className="flex items-center space-x-2">
						<Clock className="h-5 w-5" />
						<span className="font-mono">{formatTime(timeRemaining)}</span>
					</div>
				</div>
			</div>

			{/* Progress */}
			<div className="mb-6">
				<div className="flex justify-between text-sm mb-2">
					<span>
						Question {currentIndex + 1} of {questions.length}
					</span>
					<span>{Math.round(progress)}% Complete</span>
				</div>
				<Progress value={progress} />
			</div>

			{/* Question */}
			<div className="bg-white rounded-lg shadow-lg p-6 mb-6">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-lg font-medium">
						{currentQuestion?.question_text}
					</h2>
					<span className="text-sm text-gray-500">
						Points: {currentQuestion?.points}
					</span>
				</div>
				<QuestionComponent
					question={currentQuestion}
					answer={answers[currentQuestion?.id]}
					onAnswer={handleAnswer}
				/>
			</div>

			{/* Navigation */}
			<div className="flex justify-between">
				<Button onClick={handlePrevious} disabled={currentIndex === 0}>
					Previous
				</Button>
				{currentIndex === questions.length - 1 ? (
					<Button onClick={() => setShowConfirmSubmit(true)}>
						Submit Test
					</Button>
				) : (
					<Button onClick={handleNext}>Next</Button>
				)}
			</div>

			{/* Submit Confirmation */}
			<AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Submit Test?</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to submit the test? You won't be able to
							change your answers after submission.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleSubmitTest}>
							Submit Test
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
