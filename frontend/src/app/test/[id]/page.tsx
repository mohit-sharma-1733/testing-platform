"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { testService } from "@/services/testService";
import { Test } from "@/types";
import { Button } from "@/components/ui/button";
import { AlertCircle, Clock, CheckCircle, XCircle } from "lucide-react";

export default function TakeTestPage() {
	const params = useParams();
	const router = useRouter();
	const [test, setTest] = useState<Test | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchTest = async () => {
			try {
				setLoading(true);
				// Null check for params
				if (!params || !params.id) {
					setError("Invalid parameters provided");
					return;
				}
				// Convert params.id to string if it's an array
				const testId = Array.isArray(params.id) ? params.id[0] : params.id;
				const response = await testService.getTest(Number(testId));
				setTest(response);
				setError(null);
			} catch (err) {
				setError("Failed to fetch test details. Please try again later.");
				console.error("Error fetching test:", err);
			} finally {
				setLoading(false);
			}
		};

		if (params?.id) {
			fetchTest();
		}
	}, [params?.id]);
	const handleStartTest = async () => {
		try {
			if (test) {
				// Navigate to the test-taking page
				router.push(`/test/${test.id}/take`);
			}
		} catch (error) {
			console.error("Error starting test:", error);
			setError("Failed to start test. Please try again.");
		}
	};
	const instructions = [
		{
			icon: <Clock className="h-5 w-5 text-blue-500" />,
			title: "Time Management",
			points: [
				`You have ${test?.duration_minutes} minutes to complete this test.`,
				"A timer will be displayed to help you track your progress.",
				"The test will automatically submit when time expires.",
			],
		},
		{
			icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
			title: "Test Rules",
			points: [
				"Answer all questions to the best of your ability.",
				"You can review and change your answers before submission.",
				"Each question may have one or multiple correct answers.",
				"Read each question carefully before answering.",
			],
		},
		{
			icon: <CheckCircle className="h-5 w-5 text-green-500" />,
			title: "Scoring",
			points: [
				`Passing score is ${test?.passing_score}%.`,
				"All questions carry equal marks.",
				"No negative marking for wrong answers.",
			],
		},
		{
			icon: <XCircle className="h-5 w-5 text-red-500" />,
			title: "Important Notes",
			points: [
				"Do not refresh or close the browser window during the test.",
				"Ensure stable internet connection before starting.",
				"Use full screen mode for better experience.",
			],
		},
	];

	if (loading) {
		return (
			<div className="flex justify-center items-center h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6">
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
					{error}
				</div>
			</div>
		);
	}

	if (!test) {
		return (
			<div className="p-6">
				<div className="text-center">Test not found</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-2xl font-bold mb-4">{test.title}</h1>
				<div className="bg-white rounded-lg shadow p-6 space-y-6">
					{/* Test Information */}
					<div className="mb-6">
						<h2 className="text-lg font-semibold mb-2">Test Information</h2>
						<p className="text-gray-600 mb-4">{test.description}</p>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
							<div>
								<span className="font-medium">Duration:</span>{" "}
								{test.duration_minutes} minutes
							</div>
							<div>
								<span className="font-medium">Passing Score:</span>{" "}
								{test.passing_score}%
							</div>
							<div>
								<span className="font-medium">Total Questions:</span>{" "}
								{test.questions.length}
							</div>
						</div>
					</div>

					{/* Instructions */}
					<div className="mb-6">
						<h2 className="text-lg font-semibold mb-4">Test Instructions</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{instructions.map((section, index) => (
								<div
									key={index}
									className="bg-gray-50 p-4 rounded-lg space-y-2"
								>
									<div className="flex items-center gap-2 mb-2">
										{section.icon}
										<h3 className="font-medium">{section.title}</h3>
									</div>
									<ul className="space-y-2">
										{section.points.map((point, pointIndex) => (
											<li
												key={pointIndex}
												className="text-sm text-gray-600 flex items-start"
											>
												<span className="mr-2">•</span>
												{point}
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</div>

					{/* Acknowledgment */}
					<div className="bg-blue-50 p-4 rounded-lg mb-6">
						<p className="text-sm text-blue-800">
							By clicking "Start Test", you acknowledge that you have read and
							understood all the instructions and agree to follow them.
						</p>
					</div>

					{/* Start Button */}
					<div className="flex justify-center">
						<Button
							onClick={handleStartTest}
							size="lg"
							className="w-full md:w-auto"
						>
							Start Test
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
