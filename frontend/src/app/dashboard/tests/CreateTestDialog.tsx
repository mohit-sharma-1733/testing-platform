import React, { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { testService } from "@/services/testService";

interface TestFormValues {
	title: string;
	description: string;
	duration_minutes: string;
	topic: string;
	passing_score: string;
	instructions: string;
	is_randomized: boolean;
	allow_review: boolean;
	test_type: "practice" | "graded";
	num_questions: string;
}

interface CreateTestDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onTestCreated: (test: any) => void;
}

const initialFormValues: TestFormValues = {
	title: "",
	description: "",
	duration_minutes: "",
	topic: "",
	passing_score: "",
	instructions: "",
	is_randomized: false,
	allow_review: true,
	test_type: "graded",
	num_questions: "10",
};

export default function CreateTestDialog({
	open,
	onOpenChange,
	onTestCreated,
}: CreateTestDialogProps) {
	const [formData, setFormData] = useState<TestFormValues>(initialFormValues);
	const [errors, setErrors] = useState<
		Partial<Record<keyof TestFormValues, string>>
	>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (errors[name as keyof TestFormValues]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}
	};

	const handleSelectChange = (name: keyof TestFormValues, value: string) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}
	};

	const handleSwitchChange = (name: keyof TestFormValues) => {
		setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
	};

	const validateForm = (): boolean => {
		const newErrors: Partial<Record<keyof TestFormValues, string>> = {};

		if (!formData.title) newErrors.title = "Title is required";
		if (!formData.topic) newErrors.topic = "Topic is required";
		if (!formData.description)
			newErrors.description = "Description is required";
		if (!formData.duration_minutes || Number(formData.duration_minutes) < 1) {
			newErrors.duration_minutes = "Duration must be at least 1 minute";
		}
		if (
			!formData.passing_score ||
			Number(formData.passing_score) < 1 ||
			Number(formData.passing_score) > 100
		) {
			newErrors.passing_score = "Passing score must be between 1 and 100";
		}
		if (
			!formData.num_questions ||
			Number(formData.num_questions) < 5 ||
			Number(formData.num_questions) > 50
		) {
			newErrors.num_questions = "Number of questions must be between 5 and 50";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) return;

		try {
			setIsSubmitting(true);

			const testData = {
				title: formData.title,
				topic: formData.topic,
				description: formData.description,
				duration_minutes: parseInt(formData.duration_minutes),
				passing_score: parseFloat(formData.passing_score),
				num_questions: parseInt(formData.num_questions),
				is_randomized: formData.is_randomized,
				allow_review: formData.allow_review,
				test_type: formData.test_type,
				instructions: formData.instructions,
			};

			const response = await testService.createTest(testData);
			onTestCreated(response);
			setFormData(initialFormValues);
			onOpenChange(false);
		} catch (error: any) {
			console.error("Error creating test:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create New Test</DialogTitle>
					<p className="text-sm text-muted-foreground">
						Fill in the details below to create a new test. Questions will be
						automatically generated based on the topic.
					</p>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-1 gap-6">
						<div className="space-y-2">
							<Label htmlFor="title">Test Title*</Label>
							<Input
								id="title"
								name="title"
								value={formData.title}
								onChange={handleInputChange}
								placeholder="Enter test title"
								className={errors.title ? "border-red-500" : ""}
							/>
							{errors.title && (
								<p className="text-red-500 text-sm">{errors.title}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="topic">Topic for Question Generation*</Label>
							<Textarea
								id="topic"
								name="topic"
								value={formData.topic}
								onChange={handleInputChange}
								placeholder="Describe the topic in detail for AI to generate relevant questions"
								className={errors.topic ? "border-red-500" : ""}
							/>
							{errors.topic && (
								<p className="text-red-500 text-sm">{errors.topic}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description*</Label>
							<Textarea
								id="description"
								name="description"
								value={formData.description}
								onChange={handleInputChange}
								placeholder="Enter test description"
								className={errors.description ? "border-red-500" : ""}
							/>
							{errors.description && (
								<p className="text-red-500 text-sm">{errors.description}</p>
							)}
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="duration_minutes">Duration (minutes)*</Label>
								<Input
									id="duration_minutes"
									name="duration_minutes"
									type="number"
									value={formData.duration_minutes}
									onChange={handleInputChange}
									min="1"
									className={errors.duration_minutes ? "border-red-500" : ""}
								/>
								{errors.duration_minutes && (
									<p className="text-red-500 text-sm">
										{errors.duration_minutes}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="passing_score">Passing Score (%)*</Label>
								<Input
									id="passing_score"
									name="passing_score"
									type="number"
									value={formData.passing_score}
									onChange={handleInputChange}
									min="1"
									max="100"
									className={errors.passing_score ? "border-red-500" : ""}
								/>
								{errors.passing_score && (
									<p className="text-red-500 text-sm">{errors.passing_score}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="num_questions">Number of Questions*</Label>
								<Input
									id="num_questions"
									name="num_questions"
									type="number"
									value={formData.num_questions}
									onChange={handleInputChange}
									min="5"
									max="50"
									className={errors.num_questions ? "border-red-500" : ""}
								/>
								{errors.num_questions && (
									<p className="text-red-500 text-sm">{errors.num_questions}</p>
								)}
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="instructions">Instructions (Optional)</Label>
							<Textarea
								id="instructions"
								name="instructions"
								value={formData.instructions}
								onChange={handleInputChange}
								placeholder="Enter test instructions"
							/>
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between space-x-2">
								<div className="space-y-0.5">
									<Label>Randomize Questions</Label>
									<p className="text-sm text-muted-foreground">
										Questions will be presented in random order
									</p>
								</div>
								<Switch
									checked={formData.is_randomized}
									onCheckedChange={() => handleSwitchChange("is_randomized")}
								/>
							</div>

							<div className="flex items-center justify-between space-x-2">
								<div className="space-y-0.5">
									<Label>Allow Review</Label>
									<p className="text-sm text-muted-foreground">
										Students can review their answers before submission
									</p>
								</div>
								<Switch
									checked={formData.allow_review}
									onCheckedChange={() => handleSwitchChange("allow_review")}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Test Type</Label>
							<Select
								value={formData.test_type}
								onValueChange={(value) =>
									handleSelectChange(
										"test_type",
										value as "practice" | "graded"
									)
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select test type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="practice">Practice Test</SelectItem>
									<SelectItem value="graded">Graded Test</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<span className="animate-spin mr-2">⚪</span>
									Creating Test & Generating Questions...
								</>
							) : (
								"Create Test"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
