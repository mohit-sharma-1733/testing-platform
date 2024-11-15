"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
	CheckCircle,
	XCircle,
	PlayCircle,
	PauseCircle,
	Eye,
	Clock,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { Test } from "@/types";

// User Columns
export const userColumns: ColumnDef<Test>[] = [
	{
		id: "title",
		accessorKey: "title",
		header: "Title",
		cell: ({ row }) => {
			const title = row.getValue("title") as string;

			return (
				<div className="flex flex-col">
					<span className="font-medium">{title}</span>
				</div>
			);
		},
	},

	{
		id: "duration",
		header: "Duration",
		cell: ({ row }) => {
			const test = row.original;
			return (
				<div className="flex flex-col gap-1 text-sm">
					<div className="flex items-center gap-1">
						<Clock className="h-4 w-4" />
						{test.duration_minutes} minutes
					</div>
				</div>
			);
		},
	},
	{
		id: "totalQuestions",
		header: "Total Questions",
		cell: ({ row }) => {
			const test = row.original;
			return (
				<div className="flex flex-col gap-1 text-sm">
					<div>Questions: {test.question_count}</div>
				</div>
			);
		},
	},

	{
		id: "status",
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => {
			const test = row.original;
			const status = test.status;
			const lastScore = test.last_score;

			if (status === "completed") {
				const passed = lastScore >= test.passing_score;
				return (
					<div className="flex items-center gap-2">
						{passed ? (
							<Badge className="bg-green-100 text-green-800 flex items-center gap-1">
								<CheckCircle className="h-4 w-4" />
								Passed ({lastScore}%)
							</Badge>
						) : (
							<Badge className="bg-red-100 text-red-800 flex items-center gap-1">
								<XCircle className="h-4 w-4" />
								Failed ({lastScore}%)
							</Badge>
						)}
					</div>
				);
			}

			if (status === "in_progress") {
				return (
					<Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
						<PauseCircle className="h-4 w-4" />
						In Progress
						{test.remaining_time && (
							<span className="ml-1">({formatTime(test.remaining_time)})</span>
						)}
					</Badge>
				);
			}

			return (
				<Badge className="bg-gray-100 text-gray-800 flex items-center gap-1">
					<PlayCircle className="h-4 w-4" />
					Not Started
				</Badge>
			);
		},
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => {
			const router = useRouter();
			const test = row.original;
			const status = test.status;

			if (status === "completed") {
				return (
					<div className="flex gap-2 justify-end">
						<Button
							onClick={() =>
								router.push(
									`/test/${test.id}/result?session=${test.session_id}`
								)
							}
							variant="outline"
							size="sm"
							className="flex items-center gap-1"
						>
							<Eye className="h-4 w-4" />
							View Results
						</Button>
						<Button
							variant="default"
							size="sm"
							disabled
							className="flex items-center gap-1"
						>
							<CheckCircle className="h-4 w-4" />
							Completed
						</Button>
					</div>
				);
			}

			if (status === "in_progress") {
				return (
					<Button
						onClick={() =>
							router.push(`/test/${test.id}?session=${test.session_id}`)
						}
						variant="default"
						size="sm"
						className="bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1"
					>
						<PauseCircle className="h-4 w-4" />
						Resume Test
					</Button>
				);
			}

			return (
				<Button
					onClick={() => router.push(`/test/${test.id}`)}
					variant="default"
					size="sm"
					className="flex items-center gap-1"
				>
					<PlayCircle className="h-4 w-4" />
					Start Test
				</Button>
			);
		},
	},
];

// Admin Columns
export const adminColumns: ColumnDef<Test>[] = [
	{
		id: "title",
		accessorKey: "title",
		header: "Title",
		cell: ({ row }) => {
			const title = row.getValue("title") as string;
			const description = row.original.description;
			return (
				<div className="flex flex-col">
					<span className="font-medium">{title}</span>
				</div>
			);
		},
	},
	{
		id: "description",
		header: "Description",
		cell: ({ row }) => {
			const description = row.original.description;
			return (
				<div className="flex flex-col gap-1 text-sm">
					<div className="flex items-center gap-1">{description}</div>
					{/* <div>Questions: {test.question_count}</div>
					<div>Passing: {test.passing_score}%</div> */}
				</div>
			);
		},
	},

	{
		id: "totalQuestions",
		header: "Total Questions",
		cell: ({ row }) => {
			const test = row.original;
			return (
				<div className="flex flex-col gap-1 text-sm">
					<div>{test.question_count}</div>
				</div>
			);
		},
	},
	{
		id: "duration",
		header: "Duration",
		cell: ({ row }) => {
			const test = row.original;
			return (
				<div className="flex flex-col gap-1 text-sm">
					<div className="flex items-center gap-1">
						<Clock className="h-4 w-4" />
						{test.duration_minutes} minutes
					</div>
				</div>
			);
		},
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => {
			const router = useRouter();
			const test = row.original;
			const status = test.status;

			if (status === "completed") {
				return (
					<div className="flex gap-2 justify-end">
						<Button
							onClick={() =>
								router.push(
									`/test/${test.id}/result?session=${test.session_id}`
								)
							}
							variant="outline"
							size="sm"
							className="flex items-center gap-1"
						>
							<Eye className="h-4 w-4" />
							View Results
						</Button>
						<Button
							variant="default"
							size="sm"
							disabled
							className="flex items-center gap-1"
						>
							<CheckCircle className="h-4 w-4" />
							Completed
						</Button>
					</div>
				);
			}

			if (status === "in_progress") {
				return (
					<Button
						onClick={() =>
							router.push(`/test/${test.id}?session=${test.session_id}`)
						}
						variant="default"
						size="sm"
						className="bg-yellow-500 hover:bg-yellow-600 flex items-center gap-1"
					>
						<PauseCircle className="h-4 w-4" />
						Resume Test
					</Button>
				);
			}

			return (
				<Button
					onClick={() => router.push(`/test/${test.id}`)}
					variant="default"
					size="sm"
					className="flex items-center gap-1"
				>
					<PlayCircle className="h-4 w-4" />
					Start Test
				</Button>
			);
		},
	},
];
