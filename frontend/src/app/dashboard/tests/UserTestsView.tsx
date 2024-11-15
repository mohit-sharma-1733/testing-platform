"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./DataTable";
import { userColumns } from "./columns";
import { testService } from "@/services/testService";
import { Test } from "@/types";

export default function UserTestsView() {
	const [tests, setTests] = useState<Test[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchTests = async () => {
			try {
				const response = await testService.getTests();
				setTests(response.tests);
				setError(null);
			} catch (err) {
				setError("Failed to fetch tests");
				setTests([]);
			} finally {
				setLoading(false);
			}
		};

		fetchTests();
	}, []);

	if (loading) {
		return (
			<div className="flex justify-center items-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
				{error}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold">Available Tests</h1>
			</div>
			<DataTable columns={userColumns} data={tests} />
		</div>
	);
}
