"use client";

import { useState, useEffect } from "react";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/use-toast";
import { User } from "@/types";
import { userService } from "@/services/userService";

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(0);
	const { toast } = useToast();

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const response = await userService.getUsers(page, 10, search);
			setUsers(response.users);
			setTotalPages(response.pagination.total_pages);
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to fetch users",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, [page, search]);

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-3xl font-bold">Users</h2>
			</div>
			<div className="container mx-auto py-10">
				<div className="flex items-center py-4">
					<Input
						placeholder="Search users..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="max-w-sm"
					/>
				</div>

				<DataTable
					columns={columns}
					data={users}
					loading={loading}
					pagination={{
						page,
						totalPages,
						onPageChange: setPage,
					}}
				/>
			</div>
		</div>
	);
}
