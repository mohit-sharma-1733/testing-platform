"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	Users,
	FileText,
	Settings,
	ChevronLeft,
	LogOut,
	Search,
	Trophy,
} from "lucide-react";

export function Sidebar() {
	const [collapsed, setCollapsed] = useState(false);
	const { user, logout } = useAuth();
	const pathname = usePathname();

	const getMenuItems = () => {
		const baseItems = [
			{
				title: "Dashboard",
				icon: LayoutDashboard,
				href: "/dashboard",
			},
			{
				title: "Tests",
				icon: FileText,
				href: "/dashboard/tests",
			},
			{
				title: "Leaderboard",
				icon: Trophy,
				href: "/dashboard/leaderboard",
			},
		];

		if (user?.role === "admin") {
			baseItems.splice(2, 0, {
				title: "Users",
				icon: Users,
				href: "/dashboard/users",
			});
		}

		return baseItems;
	};

	const menuItems = getMenuItems();

	const handleLogout = async () => {
		try {
			await logout();
			window.location.reload();
		} catch (error) {
			console.error("Logout failed:", error);
		}
	};

	return (
		<div
			className={cn(
				"flex flex-col border-r bg-background transition-all duration-300 h-screen",
				collapsed ? "w-[80px]" : "w-[240px]"
			)}
		>
			{/* Header */}
			<div className="flex h-16 items-center border-b px-4">
				<div className="flex items-center gap-3">
					<div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
						<span className="text-primary-foreground font-bold text-sm">
							CR
						</span>
					</div>
					{!collapsed && (
						<span className="font-semibold whitespace-nowrap">
							Campus Ready
						</span>
					)}
				</div>
				<button
					onClick={() => setCollapsed(!collapsed)}
					className="ml-auto rounded-lg p-2 hover:bg-accent"
				>
					<ChevronLeft
						className={cn(
							"h-5 w-5 transition-transform duration-300",
							collapsed && "rotate-180"
						)}
					/>
				</button>
			</div>

			{/* Menu Items */}
			<div className="flex-1 px-3 py-4">
				{menuItems.map((item) => (
					<Link
						key={item.title}
						href={item.href}
						className={cn(
							"flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent transition-colors",
							"text-foreground/60 hover:text-foreground",
							pathname === item.href && "bg-accent text-foreground",
							collapsed ? "justify-center" : "justify-start"
						)}
					>
						<div className="min-w-[24px]">
							<item.icon className="h-6 w-6" />
						</div>
						{!collapsed && (
							<span className="whitespace-nowrap">{item.title}</span>
						)}
					</Link>
				))}
			</div>

			{/* Footer with Logout */}
			<div className="border-t p-3">
				<button
					onClick={handleLogout}
					className={cn(
						"flex w-full items-center gap-3 rounded-md px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors",
						collapsed ? "justify-center" : "justify-start"
					)}
				>
					<div className="min-w-[24px]">
						<LogOut className="h-6 w-6" />
					</div>
					{!collapsed && <span className="whitespace-nowrap">Logout</span>}
				</button>
			</div>
		</div>
	);
}
