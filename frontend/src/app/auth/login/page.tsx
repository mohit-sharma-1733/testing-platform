"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/forms/password-input";
import { useToast } from "@/components/use-toast";
import Link from "next/link";
import { useState } from "react";
import { LogIn, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
const formSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const { toast } = useToast();
	const { login } = useAuth();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			setIsLoading(true);
			await login(values.email, values.password);

			setIsSuccess(true);
			toast({
				title: "Login Successful!",
				description: "Welcome back to the platform.",
			});

			// Reset success state after animation
			setTimeout(() => {
				setIsSuccess(false);
			}, 2000);
		} catch (error: any) {
			setIsLoading(false);
			toast({
				title: "Error",
				description: error?.message,
				variant: "destructive",
			});
		}
	}
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className="min-h-screen flex items-center justify-center bg-gray-50"
		>
			<div className="w-full max-w-[900px] h-[600px] bg-white rounded-3xl flex overflow-hidden shadow-xl">
				{/* Left side - Illustration */}
				<motion.div
					initial={{ x: -50, opacity: 0 }}
					animate={{ x: 0, opacity: 1 }}
					transition={{ delay: 0.2 }}
					className="w-1/2 bg-gray-100 p-0 flex flex-col items-center justify-center relative"
				>
					<div className="relative w-full h-full">
						<Image
							src="/login.png"
							alt="Login illustration"
							fill
							style={{
								objectFit: "cover",
								objectPosition: "center",
							}}
							quality={100}
							priority
							className="p-0"
						/>
					</div>
				</motion.div>

				{/* Right side - Login Form */}
				<div className="w-1/2 p-12">
					<motion.div
						initial={{ y: -20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						className="mb-8"
					>
						<h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
						<p className="text-gray-500">Please enter your details</p>
					</motion.div>

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							<motion.div
								initial={{ x: 20, opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								transition={{ delay: 0.3 }}
							>
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Email</FormLabel>
											<FormControl>
												<Input placeholder="Enter your email" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</motion.div>

							<motion.div
								initial={{ x: 20, opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								transition={{ delay: 0.4 }}
							>
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Password</FormLabel>
											<FormControl>
												<PasswordInput
													placeholder="Enter your password"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</motion.div>

							<motion.div
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								<Button type="submit" className="w-full" disabled={isLoading}>
									{isLoading ? (
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									) : isSuccess ? (
										<CheckCircle2 className="mr-2 h-4 w-4" />
									) : (
										<LogIn className="mr-2 h-4 w-4" />
									)}
									{isLoading
										? "Logging in..."
										: isSuccess
										? "Success!"
										: "Log in"}
								</Button>
							</motion.div>

							<motion.p
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.6 }}
								className="text-center text-sm text-gray-600"
							>
								Don't have an account?{" "}
								<Link
									href="/auth/signup"
									className="text-purple-600 hover:underline"
								>
									Sign up
								</Link>
							</motion.p>
						</form>
					</Form>
				</div>
			</div>
		</motion.div>
	);
}
