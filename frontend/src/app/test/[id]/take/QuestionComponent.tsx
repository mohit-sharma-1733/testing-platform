import { Question } from "@/types";

interface QuestionComponentProps {
	question: Question;
	answer: any;
	onAnswer: (questionId: number, answer: any) => void;
}

export function QuestionComponent({
	question,
	answer,
	onAnswer,
}: QuestionComponentProps) {
	if (!question) return null;

	// Initialize answers for multiple choice questions
	const initializeAnswer = () => {
		if (question.question_type === "multiple_mcq" && !Array.isArray(answer)) {
			return [];
		}
		return answer;
	};

	const currentAnswer = initializeAnswer();

	switch (question.question_type) {
		case "single_mcq":
			return (
				<div className="space-y-4">
					{question.options?.map((option) => (
						<div key={option.id} className="flex items-center space-x-2">
							<input
								type="radio"
								id={`option-${option.id}`}
								name={`question-${question.id}`}
								checked={currentAnswer === option.id}
								onChange={() => onAnswer(question.id, option.id)}
								className="h-4 w-4"
							/>
							<label
								htmlFor={`option-${option.id}`}
								className="text-sm text-gray-700"
							>
								{option.text}
							</label>
						</div>
					))}
				</div>
			);

		case "multiple_mcq":
			return (
				<div className="space-y-4">
					{question.options?.map((option) => (
						<div key={option.id} className="flex items-center space-x-2">
							<input
								type="checkbox"
								id={`option-${option.id}`}
								checked={
									Array.isArray(currentAnswer) &&
									currentAnswer.includes(option.id)
								}
								onChange={(e) => {
									if (e.target.checked) {
										onAnswer(question.id, [...currentAnswer, option.id]);
									} else {
										onAnswer(
											question.id,
											currentAnswer.filter((id: number) => id !== option.id)
										);
									}
								}}
								className="h-4 w-4"
							/>
							<label
								htmlFor={`option-${option.id}`}
								className="text-sm text-gray-700"
							>
								{option.text}
							</label>
						</div>
					))}
				</div>
			);

		case "fill_blank":
			return (
				<textarea
					value={currentAnswer || ""}
					onChange={(e) => onAnswer(question.id, e.target.value)}
					className="w-full h-32 p-2 border rounded-md"
					placeholder="Enter your answer here..."
				/>
			);

		case "yes_no":
			return (
				<div className="space-y-4">
					{["Yes", "No"].map((option) => (
						<div key={option} className="flex items-center space-x-2">
							<input
								type="radio"
								id={`option-${option}`}
								name={`question-${question.id}`}
								checked={currentAnswer === option}
								onChange={() => onAnswer(question.id, option)}
								className="h-4 w-4"
							/>
							<label
								htmlFor={`option-${option}`}
								className="text-sm text-gray-700"
							>
								{option}
							</label>
						</div>
					))}
				</div>
			);

		default:
			return null;
	}
}
