"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { ArrowUp, Paperclip, User, Ellipsis, Star, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { sendMessage, getSpaceMessages, sendInitialAssistantMessage } from "@/actions/chat.action"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Message = {
    id?: string
    type: "user" | "assistant" | "system"
    content?: string
    timestamp: string
    role?: "USER" | "ASSISTANT"
}
type Space = {
    id: string
    saved: boolean
}
export default function ChatPage({ chatId }: { chatId: string }) {
    const [inputValue, setInputValue] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedPrompt = localStorage.getItem("projectom_prompt")

        if (savedPrompt) {
            const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            setMessages((prev) => [
                ...prev,
                {
                    type: "user",
                    content: savedPrompt,
                    timestamp: currentTime,
                },
            ])

            if (chatId) {
                handleUserMessage(savedPrompt, false)
                localStorage.removeItem("projectom_prompt")
            }
        }
    }, [chatId])

    useEffect(() => {
        const fetchMessages = async () => {
            if (!chatId) return

            try {
                if (messages.length > 0 && messages.some((msg) => msg.type === "user" && !msg.id)) {
                    return
                }

                const response = await getSpaceMessages(chatId as string)

                if (response.success && response.messages) {
                    interface RawMessage {
                        id: string
                        role: "USER" | "ASSISTANT"
                        content: string
                        createdAt: string
                    }

                    const formattedMessages: Message[] = response.messages.map((msg: RawMessage) => ({
                        id: msg.id,
                        type: msg.role.toLowerCase() as "user" | "assistant",
                        content: msg.content,
                        timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        role: msg.role,
                    }))

                    setMessages(formattedMessages)

                    if (formattedMessages.length === 0) {
                        await sendInitialAssistantMessage(chatId as string)

                        const updatedResponse = await getSpaceMessages(chatId as string)
                        if (updatedResponse.success && updatedResponse.messages) {
                            const updatedMessages = updatedResponse.messages.map(
                                (msg: {
                                    id: string
                                    role: "USER" | "ASSISTANT"
                                    content: string
                                    createdAt: string
                                }): Message => ({
                                    id: msg.id,
                                    type: msg.role.toLowerCase() as "user" | "assistant",
                                    content: msg.content,
                                    timestamp: new Date(msg.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    }),
                                    role: msg.role,
                                }),
                            )
                            setMessages(updatedMessages)
                        }
                    }
                } else {
                    console.error("Failed to fetch messages:", response.error)
                    setMessages([
                        {
                            type: "assistant",
                            content: "Hello! I'm Project OM, your AI assistant. How can I help you today?",
                            timestamp: new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                            }),
                            role: "ASSISTANT",
                        },
                    ])
                }
            } catch (error) {
                console.error("Error fetching messages:", error)
                setMessages([
                    {
                        type: "assistant",
                        content: "Hello! I'm Project OM, your AI assistant. How can I help you today?",
                        timestamp: new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        }),
                        role: "ASSISTANT",
                    },
                ])
            } finally {
                setIsInitialLoad(false)
            }
        }

        fetchMessages()
    }, [chatId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, loading])

    const handleUserMessage = async (content: string, addToUI = true) => {
        console.log("hey");
        console.log(chatId);
        if (!content.trim() || !chatId) return
        console.log(content);

        const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

        if (addToUI) {
            const userMessage = { type: "user" as const, content, timestamp: currentTime }
            setMessages((prev) => [...prev, userMessage])
            setInputValue("")
        }

        setLoading(true)

        try {
            const response = await sendMessage(content, chatId as string, "USER")

            if (!response.success) {
                throw new Error(response.error || "Failed to send message")
            }

            if (response.assistantMessage) {
                const responseTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

                setMessages((prev) => [
                    ...prev,
                    {
                        id: response.assistantMessageId,
                        type: "assistant",
                        content: response.assistantMessage,
                        timestamp: responseTime,
                        role: "ASSISTANT",
                    },
                ])
            }
        } catch (error) {
            console.error("Error processing message:", error)
            const errorTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            setMessages((prev) => [
                ...prev,
                {
                    type: "system",
                    content: "Failed to process your message. Please try again.",
                    timestamp: errorTime,
                },
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleRename = () => {
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log("Hey");

        try {
            await handleUserMessage(inputValue)
        } catch (err) {
            console.log("Error occurred while subitting the messages: " + err);
        }
    }

    return (
        <div className="flex h-screen bg-[#121212] text-white">
            <main className="flex-1 flex flex-col md:ml-64">
                <div className="border-b border-[#222] p-4 flex justify-between items-center">
                    <h1 className="text-lg font-medium">Chat {chatId ? `#${chatId}` : ""}</h1>
                    <div className="flex items-center justify-center gap-3">
                        <Star
                            className={``}
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Ellipsis className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={handleRename}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Rename
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    {/* {
                        chatId && spaceData && (
                            <SaveChatToggle
                                chatId={chatId}
                                initialSavedState={spaceData.saved}
                            />
                        )
                    } */}
                </div>
                <div className="flex-1 overflow-auto p-4" ref={messagesContainerRef}>
                    <div className="max-w-3xl mx-auto space-y-6">
                        {
                            messages.map((message, index) => (
                                <div
                                    key={`${message.id || index}`}
                                    className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`flex gap-3 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : ""}`}>
                                        {
                                            message.type === "assistant" ? (
                                                <Avatar className="h-8 w-8 mt-1 ring-2 ring-blue-500 ring-opacity-50">
                                                    <AvatarImage src="/assistant-avatar.png" alt="Assistant" />
                                                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 h-full w-full flex items-center justify-center">
                                                        <span className="text-xs font-bold">OM</span>
                                                    </AvatarFallback>
                                                </Avatar>
                                            ) : message.type === "system" ? (
                                                <Avatar className="h-8 w-8 mt-1 ring-2 ring-red-500 ring-opacity-50">
                                                    <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-800 h-full w-full flex items-center justify-center">
                                                        <span className="text-xs font-bold">SYS</span>
                                                    </AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <Avatar className="h-8 w-8 mt-1 bg-gradient-to-br from-emerald-500 to-teal-700 ring-2 ring-emerald-400 ring-opacity-50">
                                                    <AvatarFallback className="h-full w-full flex items-center justify-center">
                                                        <User className="h-4 w-4 text-white" />
                                                    </AvatarFallback>
                                                </Avatar>
                                            )
                                        }
                                        <div
                                            className={`rounded-lg p-4 ${message.type === "user"
                                                ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md"
                                                : message.type === "system"
                                                    ? "bg-red-900/30 text-red-200 border border-red-800/50"
                                                    : "bg-gradient-to-br from-[#1e1e1e] to-[#2a2a2a] text-gray-200 shadow-md"
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                            <p className="text-xs mt-2 opacity-70">{message.timestamp}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                        {
                            loading && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3 max-w-[80%]">
                                        <Avatar className="h-8 w-8 mt-1 ring-2 ring-blue-500 ring-opacity-50">
                                            <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 h-full w-full flex items-center justify-center">
                                                <span className="text-xs font-bold">OM</span>
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="rounded-lg p-4 bg-gradient-to-br from-[#1e1e1e] to-[#2a2a2a] text-gray-200 shadow-md">
                                            <div className="flex items-center space-x-1">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
                                            </div>
                                        </div>
                                    </div>
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
                                className="min-h-[60px] max-h-[200px] bg-[#1e1e1e] border-none rounded-lg pl-4 pr-12 py-3 text-white placeholder:text-gray-500 resize-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="Message Project OM..."
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
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-gray-400 hover:text-white hover:bg-gray-800/50"
                                >
                                    <Paperclip className="h-5 w-5" />
                                </Button>
                                <Button
                                    type="submit"
                                    size="icon"
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full h-8 w-8"
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