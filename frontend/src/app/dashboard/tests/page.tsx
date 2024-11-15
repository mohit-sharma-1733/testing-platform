"use client";

import { useAuth } from "@/context/AuthContext";
import AdminTestsView from "./AdminTestsView";
import UserTestsView from "./UserTestsView";

export default function TestsPage() {
	const { user } = useAuth();
	const isAdmin = user?.role === "admin";

	return (
		<div className="p-6">
			{isAdmin ? <AdminTestsView /> : <UserTestsView />}
		</div>
	);
}
