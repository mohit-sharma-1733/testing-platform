import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
export function formatTime(seconds?: number): string {
	if (!seconds) return "";
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = Math.floor(seconds % 60);
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
export const formatDate = (
	date: string | Date,
	options: Intl.DateTimeFormatOptions = {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}
) => {
	if (!date) return "";

	try {
		const dateObject = typeof date === "string" ? new Date(date) : date;

		// Check if date is valid
		if (isNaN(dateObject.getTime())) {
			return "Invalid date";
		}
		return new Intl.DateTimeFormat("en-US", options).format(dateObject);
	} catch (error) {
		console.error("Error formatting date:", error);
		return "Invalid date";
	}
};
