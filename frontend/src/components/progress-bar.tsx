"use client";

import { motion } from "framer-motion";

export function ProgressBar() {
	return (
		<motion.div
			className="fixed top-0 left-0 right-0 h-1 bg-purple-600"
			initial={{ scaleX: 0, transformOrigin: "0%" }}
			animate={{ scaleX: 1 }}
			transition={{ duration: 2 }}
		/>
	);
}
