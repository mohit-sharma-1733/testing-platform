"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./DataTable";
import { adminColumns } from "./columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { testService } from "@/services/testService";
import { useRouter } from "next/navigation";
import { Test } from "@/types";
import CreateTestDialog from "./CreateTestDialog";
import { useToast } from "@/components/use-toast";

export default function AdminTestsView() {
	const [tests, setTests] = useState<Test[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const router = useRouter();
	const { toast } = useToast();
	useEffect(() => {
		fetchTests();
	}, []);

	const fetchTests = async () => {
		try {
			setLoading(true);
			const response = await testService.getTests();
			setTests(response.tests);
			setError(null);
		} catch (err) {
			setError("Failed to fetch tests. Please try again later.");
			console.error("Error fetching tests:", err);
		} finally {
			setLoading(false);
		}
	};

	const handleTestCreated = (newTest: Test) => {
		setTests((prevTests) => [newTest, ...prevTests]);
		toast({
			title: "Success",
			description: "Test created successfully!",
			variant: "default",
		});
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Tests Management</h1>
				<Button
					onClick={() => setIsCreateDialogOpen(true)}
					className="flex items-center gap-2 "
				>
					<Plus className="h-4 w-4" />
					Create Test
				</Button>
			</div>

			{error && (
				<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
					{error}
				</div>
			)}

			{loading ? (
				<div className="flex justify-center items-center h-64">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
				</div>
			) : (
				<DataTable columns={adminColumns} data={tests} />
			)}

			<CreateTestDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				onTestCreated={(test) => {
					handleTestCreated(test);
					fetchTests();
				}}
			/>
		</div>
	);
}
