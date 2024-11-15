"use client";

import { useState, useEffect } from "react";
import { Medal } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { testService } from "@/services/testService";

interface LeaderboardEntry {
	rank: number;
	user_id: number;
	name: string;
	email: string;
	stats: {
		total_tests: number;
		average_score: number;
		tests_passed: number;
		highest_score: number;
	};
}

export default function Leaderboard() {
	const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchLeaderboard();
	}, []);

	const fetchLeaderboard = async () => {
		try {
			const response = await testService.getLeaderboard();
			setLeaderboard(response.leaderboard);
		} catch (error) {
			console.error("Error fetching leaderboard:", error);
		} finally {
			setLoading(false);
		}
	};

	const getRankColor = (rank: number) => {
		switch (rank) {
			case 1:
				return "text-yellow-500";
			case 2:
				return "text-gray-400";
			case 3:
				return "text-amber-600";
			default:
				return "text-gray-700";
		}
	};

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((word) => word[0])
			.join("")
			.toUpperCase();
	};

	if (loading) {
		return (
			<div className="space-y-4">
				{[...Array(5)].map((_, i) => (
					<Skeleton key={i} className="h-20 w-full" />
				))}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-3xl font-bold">Leaderboard</h2>
			</div>

			{/* Top 3 Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
				{leaderboard.slice(0, 3).map((entry) => (
					<Card
						key={entry.user_id}
						className="p-6 flex flex-col items-center space-y-4"
					>
						<Medal className={`w-8 h-8 ${getRankColor(entry.rank)}`} />
						<Avatar className="h-16 w-16">
							<AvatarFallback className="text-lg">
								{getInitials(entry.name)}
							</AvatarFallback>
						</Avatar>
						<div className="text-center">
							<h3 className="font-semibold">{entry.name}</h3>
							<p className="text-sm text-muted-foreground">
								Average Score: {entry.stats.average_score}%
							</p>
						</div>
						<div className="grid grid-cols-2 gap-4 text-center text-sm">
							<div>
								<p className="font-medium">{entry.stats.tests_passed}</p>
								<p className="text-muted-foreground">Tests Passed</p>
							</div>
							<div>
								<p className="font-medium">{entry.stats.highest_score}%</p>
								<p className="text-muted-foreground">Highest Score</p>
							</div>
						</div>
					</Card>
				))}
			</div>

			{/* Rest of the Leaderboard */}
			<div className="space-y-2">
				{leaderboard.slice(3).map((entry) => (
					<div
						key={entry.user_id}
						className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
					>
						<div className="flex items-center space-x-4">
							<span className={`font-semibold w-8 ${getRankColor(entry.rank)}`}>
								#{entry.rank}
							</span>
							<Avatar className="h-10 w-10">
								<AvatarFallback>{getInitials(entry.name)}</AvatarFallback>
							</Avatar>
							<div>
								<p className="font-medium">{entry.name}</p>
								<p className="text-sm text-muted-foreground">
									{entry.stats.total_tests} tests completed
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-8">
							<div className="text-right">
								<p className="text-sm font-medium">Average Score</p>
								<p className="text-lg font-semibold">
									{entry.stats.average_score}%
								</p>
							</div>
							<div className="text-right">
								<p className="text-sm font-medium">Tests Passed</p>
								<p className="text-lg font-semibold">
									{entry.stats.tests_passed}
								</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
