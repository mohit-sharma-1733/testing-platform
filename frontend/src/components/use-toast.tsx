import { Toast } from "@/components/ui/toast";
import { useEffect, useState } from "react";

type ToastProps = {
	title?: string;
	description?: string;
	duration?: number;
	variant?: "default" | "destructive" | "success";
};

export function useToast() {
	const [toasts, setToasts] = useState<ToastProps[]>([]);

	const toast = ({ title, description, duration = 3000 }: ToastProps) => {
		const id = Math.random().toString(36).substr(2, 9);
		setToasts((prevToasts) => [
			...prevToasts,
			{ title, description, duration },
		]);

		setTimeout(() => {
			setToasts((prevToasts) => prevToasts.filter((toast) => toast !== id));
		}, duration);
	};

	return { toast, toasts };
}
