"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function Home() {
	const [prompt, setPrompt] = useState("");
	const [messages, setMessages] = useState<Array<{ type: string; content: string }>>([]);
	const [loading, setLoading] = useState(false);
	const [taskId, setTaskId] = useState<string | null>(null);
	const [thinking, setThinking] = useState<string[]>([]);
	const [browserScreenshot, setBrowserScreenshot] = useState<string | null>(null);
	const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const lastThoughtCountRef = useRef<number>(0);
	const thoughtsContainerRef = useRef<HTMLDivElement>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!prompt.trim()) return;

		const userMessage = { type: "user", content: prompt };
		setMessages((prev) => [...prev, userMessage]);

		setLoading(true);
		setThinking([]);
		lastThoughtCountRef.current = 0;

		try {
			const response = await fetch('/api/prompt', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt }),
			});

			const data = await response.json();

			if (data.status === 'success') {
				setTaskId(data.message.split(':')[1].trim());
				if (pollIntervalRef.current) {
					clearInterval(pollIntervalRef.current);
				}
				pollForResults(data.message.split(':')[1].trim());
			} else {
				setMessages((prev) => [...prev, { type: "system", content: `Error: ${data.message}` }]);
				setLoading(false);
			}
		} catch (error) {
			console.error('Error submitting prompt:', error);
			setMessages((prev) => [...prev, { type: "system", content: "Failed to connect to the server." }]);
			setLoading(false);
		}

		setPrompt("");
	};

	const pollForResults = (taskId: string) => {
		const interval = setInterval(async () => {
			try {
				const response = await fetch(`/api/tasks/${taskId}`);
				const data = await response.json();

				console.log("Poll response:", data);

				if (data.thoughts && Array.isArray(data.thoughts)) {
					if (data.thoughts.length > lastThoughtCountRef.current) {
						console.log(`New thoughts: ${data.thoughts.length - lastThoughtCountRef.current}`);

						const filteredThoughts = data.thoughts.filter(
							(thought: string) =>
								thought.includes("✨ Manus's thoughts:") ||
								thought.includes("🎯 Tool") ||
								(thought.includes("app.agent.toolcall:think:") && thought.includes("Manus selected"))
						);

						setThinking(filteredThoughts);
						lastThoughtCountRef.current = data.thoughts.length;

						setTimeout(() => {
							if (thoughtsContainerRef.current) {
								thoughtsContainerRef.current.scrollTop = thoughtsContainerRef.current.scrollHeight;
							}
						}, 100);
					}
				}

				if (data.browser_screenshot) {
					setBrowserScreenshot(data.browser_screenshot);
				}

				if (data.status === 'success' && data.results) {
					clearInterval(interval);
					pollIntervalRef.current = null;

					const finalThought = data.thoughts.find((t: string) =>
						t.includes("✨ Manus's thoughts:") &&
						(t.includes("I now have the answer") || t.includes("current president of Nepal"))
					);

					const finalAnswer = finalThought ?
						finalThought.split("✨ Manus's thoughts:")[1].trim() :
						data.results;

					setMessages((prev) => [...prev, { type: "assistant", content: finalAnswer }]);
					setLoading(false);
					setTaskId(null);

					setTimeout(() => {
						setThinking([]);
						setBrowserScreenshot(null);
					}, 2000);
				} else if (data.status === 'error') {
					clearInterval(interval);
					pollIntervalRef.current = null;
					setMessages((prev) => [...prev, { type: "system", content: `Error: ${data.message}` }]);
					setLoading(false);
					setTaskId(null);
					setThinking([]);
					setBrowserScreenshot(null);
				}
			} catch (error) {
				console.error('Error polling for results:', error);
				clearInterval(interval);
				pollIntervalRef.current = null;
				setMessages((prev) => [...prev, { type: "system", content: "Failed to retrieve results." }]);
				setLoading(false);
				setTaskId(null);
				setThinking([]);
				setBrowserScreenshot(null);
			}
		}, 300);

		pollIntervalRef.current = interval;
		return interval;
	};

	useEffect(() => {
		return () => {
			if (pollIntervalRef.current) {
				clearInterval(pollIntervalRef.current);
			}
		};
	}, []);

	const formatThought = (thought: string) => {
		if (thought.includes("✨ Manus's thoughts:")) {
			return thought.split("✨ Manus's thoughts:")[1].trim();
		} else if (thought.includes("🎯 Tool") && thought.includes("completed its mission")) {
			let result = thought;
			if (thought.includes("Result:")) {
				result = thought.split("Result:")[1].trim();
				if (result.includes("Observed output of cmd")) {
					result = result.split("Observed output of cmd")[1].trim();
					result = result.replace(/`([^`]+)`/, '$1').trim();
					result = result.replace(/executed:/, '').trim();
				}
			}
			return `Result: ${result}`;
		} else if (thought.includes("app.agent.toolcall:think:") && thought.includes("Manus selected")) {
			const match = thought.match(/Manus selected \d+ tools? to use/);
			if (match) return match[0];
			return "Selected tools for next action";
		}
		return thought;
	};

	const isMainThought = (thought: string) => {
		return thought.includes("✨ Manus's thoughts:") ||
			thought.includes("🎯 Tool") ||
			(thought.includes("app.agent.toolcall:think:") && thought.includes("Manus selected"));
	};

	return (
		<div className="flex flex-col min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
			<header className="flex items-center justify-center py-4 border-b dark:border-gray-700">
				<h1 className="text-2xl font-bold text-gray-900 dark:text-white">ProjectOM</h1>
			</header>

			<main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{messages.length === 0 && thinking.length === 0 && !browserScreenshot ? (
						<div className="flex flex-col items-center justify-center h-full">
							<Image
								src="/manus-logo.svg"
								alt="Manus Logo"
								width={120}
								height={120}
								className="mb-4 opacity-50"
								priority
							/>
							<h2 className="text-xl text-gray-500 dark:text-gray-400">
								Hello! What can I do for you today?
							</h2>
						</div>
					) : (
						<>
							{messages.map((message, index) => (
								<div
									key={index}
									className={`p-4 rounded-lg ${message.type === "user"
											? "bg-blue-100 dark:bg-blue-900 ml-auto max-w-[80%]"
											: message.type === "assistant"
												? "bg-gray-100 dark:bg-gray-800 mr-auto max-w-[80%]"
												: "bg-red-100 dark:bg-red-900 mx-auto max-w-[90%]"
										}`}
								>
									<p className="text-sm font-medium mb-1">
										{message.type === "user" ? "You" : message.type === "assistant" ? "Manus" : "System"}
									</p>
									<div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
										{message.content}
									</div>
								</div>
							))}

							{browserScreenshot && (
								<div className="p-4 rounded-lg bg-white dark:bg-gray-800 mx-auto w-full max-w-3xl shadow-md browser-preview">
									<p className="text-sm font-medium mb-2 text-center">Browser View</p>
									<div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
										<img
											src={`data:image/jpeg;base64,${browserScreenshot}`}
											alt="Browser View"
											className="absolute top-0 left-0 w-full h-full object-contain rounded-md"
										/>
									</div>
								</div>
							)}

							{loading && (
								<div className="flex-1 overflow-y-auto">
									{thinking.length > 0 ? (
										<div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900 mr-auto max-w-[90%]">
											<p className="text-sm font-medium mb-2 flex items-center">
												<span>Manus is thinking</span>
												<span className="ml-1 thinking">...</span>
											</p>
											<div
												ref={thoughtsContainerRef}
												className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap max-h-80 overflow-y-auto"
											>
												{thinking.filter(isMainThought).map((thought, idx) => (
													<div key={idx} className="mb-2 p-2 border-b border-yellow-200 dark:border-yellow-800 last:border-0 thought-item">
														<p className="text-sm">{formatThought(thought)}</p>
													</div>
												))}
											</div>
										</div>
									) : (
										<div className="flex items-center justify-center p-4">
											<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
											<p className="ml-2 text-gray-600 dark:text-gray-300">
												{taskId ? "Processing your request..." : "Sending..."}
											</p>
										</div>
									)}
								</div>
							)}
						</>
					)}
				</div>

				<form onSubmit={handleSubmit} className="border-t p-4 dark:border-gray-700">
					<div className="flex items-center space-x-2">
						<input
							type="text"
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							placeholder="Give Manus a task to work on..."
							className="flex-1 p-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
							disabled={loading}
						/>
						<button
							type="submit"
							disabled={loading || !prompt.trim()}
							className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
						>
							Send
						</button>
					</div>
				</form>
			</main>
		</div>
	);
}
