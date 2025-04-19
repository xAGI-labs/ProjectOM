"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createSpace } from "@/actions/chat.action";
import { toast } from "sonner";
import { useAuth, SignInButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";

export default function Home() {
	const [inputValue, setInputValue] = useState("");
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { isSignedIn } = useAuth();
	const { user } = useUser();
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const formRef = useRef<HTMLFormElement>(null);
	const [hasAccepted, setHasAccepted] = useState(false);

	useEffect(() => {
		const isChecked = JSON.parse(localStorage.getItem("checked")!);
		if (isChecked) {
			setHasAccepted(true);
		}
	}, [])

	const adjustTextareaHeight = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
		}
	};

	useEffect(() => {
		adjustTextareaHeight();
	}, [inputValue]);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
		e.preventDefault();
		if (!inputValue.trim()) return;

		if (!isSignedIn) {
			localStorage.setItem("projectom_prompt", inputValue);
			return;
		}

		try {
			setIsSubmitting(true);
			localStorage.setItem("projectom_prompt", inputValue);

			const result = await createSpace({ prompt: inputValue });

			if (!result.success) {
				throw new Error(result.error || "Failed to create space");
			}

			router.push(`/space/${result.spaceId}`);
		} catch (error) {
			console.error("Error creating space:", error);
			toast("Error", {
				description: "Failed to create space. Please try again.",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle key press to submit form on Enter
	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			formRef.current?.requestSubmit();
		}
	};
	const handleSignIn = () => {
		const storedPrompt = localStorage.getItem("projectom_prompt");
		if (storedPrompt) {
			setInputValue(storedPrompt);
		}
	};

	const handleAcceptance = () => {
		localStorage.setItem("checked", "true");
		setHasAccepted(true);
		toast("Accepted");
	}

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
				delayChildren: 0.2
			}
		}
	};

	const itemVariants = {
		hidden: { y: 20, opacity: 0 },
		visible: {
			y: 0,
			opacity: 1,
			transition: { type: "spring", stiffness: 100 }
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.8 }}
			className="flex min-h-screen bg-[#121212] text-white items-center justify-center"
		>
			<main className="w-full max-w-5xl px-4 py-8">
				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate="visible"
					className="flex flex-col items-center justify-center text-center"
				>
					<motion.h1
						variants={itemVariants}
						className="text-2xl font-medium mb-2"
					>
						{isSignedIn ? `Hello, ${user?.fullName || user?.firstName || "User"}` : "Welcome to ProjectOM"}
					</motion.h1>
					<motion.p
						variants={itemVariants}
						className="text-gray-400 mb-6"
					>
						What can I do for you?
					</motion.p>
					<motion.form
						ref={formRef}
						variants={itemVariants}
						onSubmit={handleSubmit}
						className="w-full max-w-xl"
					>
						<div className="relative bg-[#1e1e1e] rounded-lg border border-gray-800">
							<motion.div
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className="w-full"
							>
								<div className="flex flex-col">
									<div className="relative">
										<div className="absolute left-4 top-4 flex items-center pointer-events-none">
											<motion.div
												animate={{ scale: [1, 1.1, 1] }}
												transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
											>
												<Search className="h-5 w-5 text-gray-500" />
											</motion.div>
										</div>
										<textarea
											ref={textareaRef}
											className="bg-transparent border-none min-h-14 w-full pl-12 py-4 pr-4 text-white placeholder:text-gray-500 resize-none focus:outline-none focus:ring-0"
											placeholder="Give ProjectOM a task to work on..."
											value={inputValue}
											onChange={(e) => setInputValue(e.target.value)}
											onKeyDown={handleKeyDown}
											disabled={isSubmitting}
											rows={1}
											style={{ maxHeight: "300px" }}
										/>
									</div>
									<div className="flex justify-end px-4 pb-3">
										<div className="flex items-center gap-2">
											<Badge
												variant="outline"
												className="text-xs bg-transparent border-gray-700 text-gray-400"
											>
												Standard
											</Badge>
											<span className="text-xs text-gray-500">1/3K</span>
										</div>
									</div>
								</div>
							</motion.div>
						</div>
						{
							!isSignedIn && (
								<motion.div
									variants={itemVariants}
									whileHover={{ scale: 1.03 }}
									whileTap={{ scale: 0.97 }}
								>
									<SignInButton mode="modal" forceRedirectUrl="/">
										<Button
											type="submit"
											className="mt-3 w-full bg-black hover:bg-gray-600 text-white"
										>
											Sign In to Create Space
										</Button>
									</SignInButton>
								</motion.div>
							)
						}
					</motion.form>
					<motion.div
						variants={itemVariants}
						whileHover={{ y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
						className="w-full max-w-xl mt-3 bg-[#1e1e1e] rounded-lg p-3 flex justify-between items-center"
					>
						<p className="text-sm text-gray-400">
							ProjectOM needs certain permissions at task startup and may misbehave.
						</p>
						{
							!hasAccepted && (
								<div className="flex gap-2">
									<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
										<Button variant="ghost" size="sm" className="text-gray-400 h-8">
											Decline
										</Button>
									</motion.div>
									<motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
										<Button onClick={handleAcceptance} size="sm" className="bg-black hover:bg-gray-600 h-8">
											Accept
										</Button>
									</motion.div>
								</div>
							)
						}
					</motion.div>
				</motion.div>
			</main>
		</motion.div>
	);
}

// const templates = [/* commented out code preserved */];

{/* Commented-out section preserved */ }
{/* <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <Badge className="bg-white/10 hover:bg-white/20 text-white rounded-full px-4 py-1">
              Recommended
            </Badge>
            <Badge
              variant="outline"
              className="text-gray-400 rounded-full px-4 py-1"
            >
              Featured
            </Badge>
            <Badge
              variant="outline"
              className="text-gray-400 rounded-full px-4 py-1"
            >
              Life
            </Badge>
            <Badge
              variant="outline"
              className="text-gray-400 rounded-full px-4 py-1"
            >
              Research
            </Badge>
            <Badge
              variant="outline"
              className="text-gray-400 rounded-full px-4 py-1"
            >
              Education
            </Badge>
            <Badge
              variant="outline"
              className="text-gray-400 rounded-full px-4 py-1"
            >
              Data Analysis
            </Badge>
            <Badge
              variant="outline"
              className="text-gray-400 rounded-full px-4 py-1"
            >
              Productivity
            </Badge>
            <Badge
              variant="outline"
              className="text-gray-400 rounded-full px-4 py-1"
            >
              Content Creator
            </Badge>
          </div>
          <p className="text-xs text-gray-500 text-center mb-8">
            All tasks and capabilities shown in the community are exclusively
            shared by users. The features does not display any content without your
            consent.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template, index) => (
              <Card
                key={index}
                className="bg-[#1e1e1e] border-none overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="relative h-40 w-full">
                    <Image
                      src={template.image || "/placeholder.svg"}
                      alt={template.title}
                      fill
                      className="object-cover"
                    />
                    {template.quote && (
                      <div className="absolute inset-0 bg-black/60 flex items-center p-4">
                        <blockquote className="text-sm text-white">
                          {template.quote}
                        </blockquote>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col items-start p-4">
                  <h3 className="text-sm font-medium mb-1">{template.title}</h3>
                  <p className="text-xs text-gray-400">{template.author}</p>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div> */}
// const templates = [
//   {
//     title: "Cybersecurity Learning Roadmap",
//     author: "Aleksandar N. Hristov",
//     image: "/placeholder.svg?height=400&width=600",
//     quote:
//       "Design an interactive webpage that explains the worldviews of the greatest philosophers in MIST with clear visuals...",
//   },
//   {
//     title: "Innovative RUST Learning Webpage",
//     author: "RUST",
//     image: "/placeholder.svg?height=400&width=600",
//   },
//   {
//     title: "MPC Style Dune Machine",
//     author: "Cosmic Samurai",
//     image: "/placeholder.svg?height=400&width=600",
//     quote:
//       "Come up with a concept for a synth sequencer and create a layout for it with a logo and a cool aesthetic. Then create a website with a...",
//   },
//   {
//     title: "Digital Mobility Solutions Leaks PLC Malaysian Project",
//     author: "Executive Business",
//     image: "/placeholder.svg?height=400&width=600",
//   },
//   {
//     title: "Successful AI Agent PDF Site",
//     author: "SUCCESSFUL AGENT",
//     image: "/placeholder.svg?height=400&width=600",
//     quote:
//       "Create a website similar to https://blog.adept.ai/greymatter, but for AI Agent products that have successfully achieved PMF (Product-...",
//   },
//   {
//     title: "Savanna Through Gate: A Kansas Farm Site Amidst in the Heavens",
//     author: "SAVANNA THROUGH GATE",
//     image: "/placeholder.svg?height=400&width=600",
//   },
//   {
//     title: "Android APK for To-Do List with Get Icon",
//     author: "NEXT GEN LAUNCHER",
//     image: "/placeholder.svg?height=400&width=600",
//     quote:
//       "Build an android apk for todolist UI and forms, so that apk show in main page todolist with notification natural go, if user clicks the...",
//   },
//   {
//     title: "Near-Term Quantum Computing and Related Technologies",
//     author: "Quantum",
//     image: "/placeholder.svg?height=400&width=600",
//   },
// ];