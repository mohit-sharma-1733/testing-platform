"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
	children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
	const pathname = usePathname();
	const shouldHideSidebar = pathname?.includes("/auth");

	return (
		<div className="flex h-screen">
			{!shouldHideSidebar && <Sidebar />}
			<main className={`flex-1 ${!shouldHideSidebar ? "ml-64" : ""}`}>
				{children}
			</main>
		</div>
	);
}
