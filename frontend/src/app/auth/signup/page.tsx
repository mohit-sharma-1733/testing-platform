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
import { UserPlus, Loader2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
const formSchema = z
	.object({
		firstName: z.string().min(2, "First name must be at least 2 characters"),
		lastName: z.string().min(2, "Last name must be at least 2 characters"),
		email: z.string().email("Invalid email address"),
		password: z.string().min(6, "Password must be at least 6 characters"),
		confirmPassword: z.string(),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ["confirmPassword"],
	});
interface SignUpData {
	first_name: string;
	last_name: string;
	email: string;
	password: string;
}

export default function SignUpPage() {
	const [isLoading, setIsLoading] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const { toast } = useToast();
	const router = useRouter();
	const { signup } = useAuth();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			setIsLoading(true);

			// Create the signup data object without confirmPassword
			const signupData: SignUpData = {
				first_name: values.firstName,
				last_name: values.lastName,
				email: values.email,
				password: values.password,
			};

			await signup(signupData);

			setIsSuccess(true);
			toast({
				title: "Account created successfully!",
				description: "Welcome to the platform.",
			});

			// Reset success state after animation
			setTimeout(() => {
				setIsSuccess(false);
			}, 2000);
		} catch (error: any) {
			setIsLoading(false);
			toast({
				title: "Error",
				description: error.response?.data?.error || "Failed to create account",
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
			<div className="w-full max-w-[900px] min-h-[600px] bg-white rounded-3xl flex overflow-hidden shadow-xl">
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

				{/* Right side - Sign Up Form */}
				<div className="w-1/2 p-12">
					<motion.div
						initial={{ y: -20, opacity: 0 }}
						animate={{ y: 0, opacity: 1 }}
						className="mb-8"
					>
						<h1 className="text-2xl font-bold mb-2">Create an account</h1>
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
									name="firstName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>First Name</FormLabel>
											<FormControl>
												<Input placeholder="Enter your first name" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="lastName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Last Name</FormLabel>
											<FormControl>
												<Input placeholder="Enter your last name" {...field} />
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
								transition={{ delay: 0.5 }}
							>
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Password</FormLabel>
											<FormControl>
												<PasswordInput
													placeholder="Create a password"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</motion.div>

							<motion.div
								initial={{ x: 20, opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								transition={{ delay: 0.6 }}
							>
								<FormField
									control={form.control}
									name="confirmPassword"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Confirm Password</FormLabel>
											<FormControl>
												<PasswordInput
													placeholder="Confirm your password"
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
										<UserPlus className="mr-2 h-4 w-4" />
									)}
									{isLoading
										? "Creating account..."
										: isSuccess
										? "Success!"
										: "Sign up"}
								</Button>
							</motion.div>

							<motion.p
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.7 }}
								className="text-center text-sm text-gray-600"
							>
								Already have an account?{" "}
								<Link
									href="/auth/login"
									className="text-purple-600 hover:underline"
								>
									Log in
								</Link>
							</motion.p>
						</form>
					</Form>
				</div>
			</div>
		</motion.div>
	);
}
