"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import {
	Users,
	FileText,
	Trophy,
	Clock,
	CheckCircle2,
	BarChart2,
	Target,
	Calendar,
	Medal,
	Brain,
	Timer as TimerIcon,
	LineChart,
} from "lucide-react";
import { testService } from "@/services/testService";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface DashboardStats {
	// Admin stats
	totalUsers?: number;
	totalTests?: number;
	totalAttempts?: number;
	averageScore?: number;
	passRate?: number;
	recentTestAttempts?: number;
	highestScore?: number;
	averageTestDuration?: number;

	// User stats
	testsAttempted?: number;
	testsCompleted?: number;
	averageUserScore?: number;
	bestScore?: number;
	lastAttemptDate?: string;
	upcomingTests?: number;
	timeSpentTotal?: number;
	passedTests?: number;
	currentStreak?: number;
	totalPoints?: number;
	rank?: number;
	improvement?: number;
}

export default function DashboardPage() {
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();
	const { user } = useAuth();
	const isAdmin = user?.role === "admin";

	const fetchStats = useCallback(async () => {
		try {
			const fetchedStats = await testService.getDashboardStats("isAdmin");
			setStats((prevStats) => {
				if (JSON.stringify(prevStats) !== JSON.stringify(fetchedStats)) {
					return fetchedStats;
				}
				return prevStats;
			});
			setError(null);
		} catch (err) {
			setError("Failed to load dashboard statistics");
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to update dashboard statistics",
			});
		}
	}, [toast, isAdmin]);

	useEffect(() => {
		fetchStats().finally(() => setLoading(false));
	}, [fetchStats]);

	const StatCard = ({
		title,
		value,
		icon: Icon,
		description,
		loading: isLoading,
		trend,
	}: {
		title: string;
		value: number | string;
		icon: any;
		description?: string;
		loading?: boolean;
		trend?: "up" | "down" | "neutral";
	}) => (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
			whileHover={{ scale: 1.02 }}
		>
			<Card className="p-6 hover:shadow-lg transition-all duration-200">
				<div className="flex items-center gap-4">
					<div className="rounded-full bg-primary/10 p-3">
						<Icon className="h-6 w-6 text-primary" />
					</div>
					<div className="flex-1">
						<p className="text-sm font-medium text-muted-foreground">{title}</p>
						{isLoading ? (
							<Skeleton className="h-7 w-20 mt-1" />
						) : (
							<AnimatePresence mode="wait">
								<motion.h3
									key={String(value)}
									initial={{ opacity: 0, y: -10 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 10 }}
									className="text-2xl font-bold tracking-tight"
								>
									{value}
									{trend && (
										<span
											className={`text-sm ml-2 ${
												trend === "up"
													? "text-green-500"
													: trend === "down"
													? "text-red-500"
													: "text-yellow-500"
											}`}
										>
											{trend === "up" ? "↑" : trend === "down" ? "↓" : "→"}
										</span>
									)}
								</motion.h3>
							</AnimatePresence>
						)}
						{description && (
							<p className="text-sm text-muted-foreground mt-1">
								{description}
							</p>
						)}
					</div>
				</div>
			</Card>
		</motion.div>
	);

	if (error) {
		return (
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				className="p-6"
			>
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</motion.div>
		);
	}

	const userStats = [
		{
			title: "Tests Taken",
			value: stats?.testsAttempted || 0,
			icon: FileText,
			description: "Total tests attempted",
		},
		{
			title: "Tests Completed",
			value: stats?.testsCompleted || 0,
			icon: CheckCircle2,
			description: "Successfully completed tests",
		},
		{
			title: "Average Score",
			value: `${(stats?.averageUserScore || 0).toFixed(1)}%`,
			icon: LineChart,
			description: "Your test average",
		},
		{
			title: "Best Score",
			value: `${(stats?.bestScore || 0).toFixed(1)}%`,
			icon: Trophy,
			description: "Your highest achievement",
		},
		{
			title: "Time Spent",
			value: `${(stats?.timeSpentTotal || 0).toFixed(0)} min`,
			icon: TimerIcon,
			description: "Total time on tests",
		},
		{
			title: "Success Rate",
			value: `${(
				((stats?.passedTests || 0) / (stats?.testsCompleted || 1)) *
				100
			).toFixed(1)}%`,
			icon: Target,
			description: `${stats?.passedTests || 0} tests passed`,
		},
		{
			title: "Current Streak",
			value: stats?.currentStreak || 0,
			icon: Medal,
			description: "Consecutive tests passed",
		},
		{
			title: "Upcoming Tests",
			value: stats?.upcomingTests || 0,
			icon: Calendar,
			description: "Available to take",
		},
	];

	return (
		<div className="p-6 space-y-6">
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex items-center justify-between"
			>
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						{isAdmin ? "Admin Dashboard" : "My Dashboard"}
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						{isAdmin
							? "Overview of all platform activities"
							: `Welcome back, ${user?.name || "User"}!`}
					</p>
				</div>
			</motion.div>

			{isAdmin ? (
				<>
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						<StatCard
							title="Total Users"
							value={stats?.totalUsers || 0}
							icon={Users}
							loading={loading}
						/>
						<StatCard
							title="Total Tests"
							value={stats?.totalTests || 0}
							icon={FileText}
							loading={loading}
						/>
						<StatCard
							title="Total Attempts"
							value={stats?.totalAttempts || 0}
							icon={BarChart2}
							loading={loading}
						/>
						<StatCard
							title="Average Score"
							value={`${(stats?.averageScore || 0).toFixed(1)}%`}
							icon={Trophy}
							loading={loading}
						/>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
						<StatCard
							title="Pass Rate"
							value={`${(stats?.passRate || 0).toFixed(1)}%`}
							icon={CheckCircle2}
							description="Tests passed vs total"
							loading={loading}
						/>
						<StatCard
							title="Recent Attempts"
							value={stats?.recentTestAttempts || 0}
							icon={Clock}
							description="In the last 24 hours"
							loading={loading}
						/>
						<StatCard
							title="Highest Score"
							value={`${(stats?.highestScore || 0).toFixed(1)}%`}
							icon={Trophy}
							description="All-time highest score"
							loading={loading}
						/>
						<StatCard
							title="Avg. Duration"
							value={`${(stats?.averageTestDuration || 0).toFixed(0)} min`}
							icon={Clock}
							description="Average completion time"
							loading={loading}
						/>
					</div>
				</>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
					{userStats.map((stat, index) => (
						<StatCard
							key={index}
							title={stat.title}
							value={stat.value}
							icon={stat.icon}
							description={stat.description}
							loading={loading}
						/>
					))}
				</div>
			)}
		</div>
	);
}
