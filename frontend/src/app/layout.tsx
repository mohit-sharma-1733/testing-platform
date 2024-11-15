import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/toast-provider";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<AuthProvider>
					<Toaster />
					{children}
				</AuthProvider>
			</body>
		</html>
	);
}
