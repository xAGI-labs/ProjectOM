"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { ArrowUp, PaperclipIcon } from "lucide-react"
import { Sidebar } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"

export default function ChatSpace() {
    const { chatId } = useParams()
    const [inputValue, setInputValue] = useState("")
    const [messages, setMessages] = useState<Array<{ type: string; content: string }>>([])
    const [loading, setLoading] = useState(false)
    const [taskId, setTaskId] = useState<string | null>(null)
    const [thinking, setThinking] = useState<string[]>([])
    const [browserScreenshot, setBrowserScreenshot] = useState<string | null>(null)
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const lastThoughtCountRef = useRef<number>(0)
    const thoughtsContainerRef = useRef<HTMLDivElement>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Get the prompt from localStorage on initial load
    useEffect(() => {
        const savedPrompt = localStorage.getItem("projectom_prompt")
        if (savedPrompt) {
            // Add the user message
            setMessages([{ type: "user", content: savedPrompt }])

            // Clear localStorage
            // localStorage.removeItem("projectom_prompt")

            // Process the saved prompt
            handleInitialPrompt(savedPrompt)
        } else {
            // If no prompt, add a welcome message
            setMessages([{ type: "assistant", content: "Hello! I'm ProjectOM. How can I assist you today?" }])
        }
    }, [])

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, thinking])

    const handleInitialPrompt = async (prompt: string) => {
        setLoading(true)
        setThinking([])
        lastThoughtCountRef.current = 0

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
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputValue.trim()) return

        const userMessage = { type: "user", content: inputValue }
        setMessages((prev) => [...prev, userMessage])

        setLoading(true)
        setThinking([])
        lastThoughtCountRef.current = 0

        try {
            const response = await fetch('/api/prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: inputValue }),
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

        setInputValue("")
    }

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

    // Clean up interval on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
            }
        }
    }, [])

    const formatThought = (thought: string) => {
        if (thought.includes("✨ Manus's thoughts:")) {
            return thought.split("✨ Manus's thoughts:")[1].trim()
        } else if (thought.includes("🎯 Tool") && thought.includes("completed its mission")) {
            let result = thought
            if (thought.includes("Result:")) {
                result = thought.split("Result:")[1].trim()
                if (result.includes("Observed output of cmd")) {
                    result = result.split("Observed output of cmd")[1].trim()
                    result = result.replace(/`([^`]+)`/, "$1").trim()
                    result = result.replace(/executed:/, "").trim()
                }
            }
            return `Result: ${result}`
        } else if (thought.includes("app.agent.toolcall:think:") && thought.includes("Manus selected")) {
            const match = thought.match(/Manus selected \d+ tools? to use/)
            if (match) return match[0]
            return "Selected tools for next action"
        }
        return thought
    }

    const isMainThought = (thought: string) => {
        return (
            thought.includes("✨ Manus's thoughts:") ||
            thought.includes("🎯 Tool") ||
            (thought.includes("app.agent.toolcall:think:") && thought.includes("Manus selected"))
        )
    }

    return (
        <div className="flex h-screen bg-[#121212] text-white">
            <Sidebar />
            <main className="flex-1 flex flex-col md:ml-64">
                <div className="border-b border-[#222] p-4">
                    <h1 className="text-lg font-medium">Chat #{chatId}</h1>
                </div>
                <div className="flex-1 overflow-auto p-4">
                    <div className="max-w-3xl mx-auto space-y-6">
                        {
                            messages.map((message, index) => (
                                <div key={index} className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`flex gap-3 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : ""}`}>
                                        <Avatar className="h-8 w-8 mt-1">
                                            {
                                                message.type === "assistant" ? (
                                                    <div className="bg-blue-600 h-full w-full flex items-center justify-center">
                                                        <span className="text-xs font-bold">P</span>
                                                    </div>
                                                ) : message.type === "system" ? (
                                                    <div className="bg-red-600 h-full w-full flex items-center justify-center">
                                                        <span className="text-xs font-bold">S</span>
                                                    </div>
                                                ) : (
                                                    <AvatarFallback>NJ</AvatarFallback>
                                                )
                                            }
                                        </Avatar>
                                        <div
                                            className={`rounded-lg p-4 ${message.type === "user"
                                                ? "bg-blue-600 text-white"
                                                : message.type === "system"
                                                    ? "bg-red-900/30 text-red-200 border border-red-800/50"
                                                    : "bg-[#1e1e1e] text-gray-200"
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                            <p className="text-xs mt-2 opacity-70">
                                                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                        {
                            browserScreenshot && (
                                <div className="p-4 rounded-lg bg-[#1e1e1e] mx-auto w-full max-w-3xl">
                                    <p className="text-sm font-medium mb-2 text-center text-gray-300">Browser View</p>
                                    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                                        <img
                                            src={`data:image/jpeg;base64,${browserScreenshot}`}
                                            alt="Browser View"
                                            className="absolute top-0 left-0 w-full h-full object-contain rounded-md"
                                        />
                                    </div>
                                </div>
                            )
                        }
                        {
                            loading && (
                                <div className="flex-1">
                                    {
                                        thinking.length > 0 ? (
                                            <div className="p-4 rounded-lg bg-[#1e1e1e] mr-auto max-w-[90%] border border-yellow-600/30">
                                                <div className="flex items-center mb-2">
                                                    <Avatar className="h-6 w-6 mr-2">
                                                        <div className="bg-yellow-600 h-full w-full flex items-center justify-center">
                                                            <span className="text-xs font-bold">P</span>
                                                        </div>
                                                    </Avatar>
                                                    <p className="text-sm font-medium text-yellow-500 flex items-center">
                                                        <span>ProjectOM is thinking</span>
                                                        <span className="ml-1 inline-flex">
                                                            <span className="animate-bounce mx-0.5">.</span>
                                                            <span className="animate-bounce mx-0.5 animation-delay-200">.</span>
                                                            <span className="animate-bounce mx-0.5 animation-delay-400">.</span>
                                                        </span>
                                                    </p>
                                                </div>
                                                <div
                                                    ref={thoughtsContainerRef}
                                                    className="text-gray-300 whitespace-pre-wrap max-h-80 overflow-y-auto"
                                                >
                                                    {
                                                        thinking.filter(isMainThought).map((thought, idx) => (
                                                            <div key={idx} className="mb-2 p-2 border-b border-yellow-800/30 last:border-0">
                                                                <p className="text-sm">{formatThought(thought)}</p>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center p-4">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                <p className="ml-2 text-gray-400">{taskId ? "Processing your request..." : "Sending..."}</p>
                                            </div>
                                        )
                                    }
                                </div>
                            )
                        }
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                <div className="border-t border-[#222] p-4">
                    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                        <div className="relative">
                            <Textarea
                                className="min-h-[60px] max-h-[200px] bg-[#1e1e1e] border-none rounded-lg pl-4 pr-12 py-3 text-white placeholder:text-gray-500 resize-none"
                                placeholder="Type a message..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSubmit(e)
                                    }
                                }}
                                disabled={loading}
                            />
                            <div className="absolute right-2 bottom-2 flex gap-2">
                                <Button type="button" variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                    <PaperclipIcon className="h-5 w-5" />
                                </Button>
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-8 w-8"
                                    disabled={!inputValue.trim() || loading}
                                >
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    )
}