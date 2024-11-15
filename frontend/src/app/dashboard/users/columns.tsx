"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<any>[] = [
	{
		accessorKey: "email",
		header: "Email",
	},
	{
		accessorKey: "first_name",
		header: "First Name",
	},
	{
		accessorKey: "last_name",
		header: "Last Name",
	},
	{
		accessorKey: "role",
		header: "Role",
		cell: ({ row }) => {
			const role = row.getValue("role") as string;
			return (
				<Badge variant={role === "admin" ? "default" : "secondary"}>
					{role}
				</Badge>
			);
		},
	},
	{
		accessorKey: "is_active",
		header: "Status",
		cell: ({ row }) => {
			const isActive = row.getValue("is_active") as boolean;
			return (
				<Badge variant={isActive ? "success" : "destructive"}>
					{isActive ? "Active" : "Inactive"}
				</Badge>
			);
		},
	},
];
