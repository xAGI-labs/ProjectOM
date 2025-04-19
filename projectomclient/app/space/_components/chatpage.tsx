"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { ArrowUp, Paperclip, User, MoreHorizontal, Star, Pencil, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getSpaceMessages, sendMessage, fetchSpaceById, addAsFavourites, updateSpaceTitle } from "@/actions/chat.action"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useUser } from "@clerk/nextjs"
import ThinkingAnimation from "./thinkinganimation"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type Message = {
    id?: string
    type: "user" | "assistant" | "system"
    content?: string
    timestamp: string
    role?: "USER" | "ASSISTANT"
}

export default function ChatPage({ chatId }: { chatId: string }) {
    const [inputValue, setInputValue] = useState("")
    const [messages, setMessages] = useState<Message[]>([])
    const [title, setTitle] = useState<string | null>(null)
    const [isFavourite, setIsFavourite] = useState<boolean>(false);
    const [messageLoading, setMessageLoading] = useState(false)
    const [pageLoading, setPageLoading] = useState(true)
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [newTitle, setNewTitle] = useState("")
    const [isRenaming, setIsRenaming] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const { user } = useUser()
    const initializedRef = useRef(false)

    // Split initialization into two separate effects to prevent race conditions
    // First effect - Fetch space data and existing messages
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!chatId || initializedRef.current) return

            try {
                const spaceResponse = await fetchSpaceById(chatId)
                if (spaceResponse.success && spaceResponse.space) {
                    setTitle(spaceResponse.space.title)
                    setNewTitle(spaceResponse.space.title)
                    setIsFavourite(spaceResponse.space.saved);

                    const response = await getSpaceMessages(chatId)

                    if (response.messages && response.messages.length > 0) {
                        const formattedMessages = response.messages.map(
                            (msg: {
                                id: string
                                role: "USER" | "ASSISTANT"
                                content: string
                                createdAt: Date
                            }) => ({
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
                        setMessages(formattedMessages)
                        initializedRef.current = true
                        setPageLoading(false)
                    } else if (spaceResponse.space.initialPrompt) {
                        const currentTime = new Date().toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })

                        setMessages([{
                            type: "user",
                            content: spaceResponse.space.initialPrompt,
                            timestamp: currentTime,
                            role: "USER"
                        }])
                        setPageLoading(false);

                        return {
                            shouldSendInitialMessage: true,
                            initialPrompt: spaceResponse.space.initialPrompt
                        }
                    } else {
                        initializedRef.current = true
                        setPageLoading(false)
                    }
                }
            } catch (error) {
                console.error("Error initializing chat:", error)
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
                initializedRef.current = true
                setPageLoading(false)
            }

            return { shouldSendInitialMessage: false }
        }

        fetchInitialData().then(result => {
            if (result && result.shouldSendInitialMessage) {
                setMessageLoading(true)
            } else {
                setPageLoading(false)
            }
        })
    }, [chatId])

    useEffect(() => {
        const sendInitialMessage = async () => {
            if (!chatId || initializedRef.current || !messageLoading || messages.length === 0) return

            try {
                const initialPrompt = messages[0].content
                if (!initialPrompt) return

                initializedRef.current = true

                const msgResponse = await sendMessage(initialPrompt, chatId, "USER")

                if (msgResponse.success && msgResponse.assistantMessage) {
                    const assistantTime = new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })

                    setMessages(prev => [
                        ...prev,
                        {
                            id: msgResponse.assistantMessageId,
                            type: "assistant",
                            content: msgResponse.assistantMessage,
                            timestamp: assistantTime,
                            role: "ASSISTANT"
                        }
                    ])
                }
            } catch (error) {
                console.error("Error sending initial message:", error)
            } finally {
                setMessageLoading(false)
                setPageLoading(false)
            }
        }

        sendInitialMessage()
    }, [messageLoading, messages, chatId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages, messageLoading])

    const handleUserMessage = async (content: string) => {
        if (!content.trim() || !chatId) return

        const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        const userMessage = { type: "user" as const, content, timestamp: currentTime }

        setMessages((prev) => [...prev, userMessage])
        setInputValue("")
        setMessageLoading(true)

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
            setMessageLoading(false)
        }
    }

    const handleRename = () => {
        setIsEditingTitle(true);
        setNewTitle(title || "");
    }

    const handleSaveRename = async () => {
        if (!newTitle.trim() || !chatId) return;

        setIsRenaming(true);
        try {
            const response = await updateSpaceTitle(chatId, newTitle.trim());

            if (response.success) {
                setTitle(newTitle.trim());
                toast("Space renamed successfully");
                setIsEditingTitle(false);
            } else {
                toast.error(response.error || "Failed to rename space");
            }
        } catch (error) {
            console.error("Error renaming space:", error);
            toast.error("An error occurred while renaming the space");
        } finally {
            setIsRenaming(false);
        }
    }
    const handleFavourites = async (status: boolean) => {
        try {
            const response = await addAsFavourites(chatId, status);
            if (!response) {
                return null;
            }

            const updatedStatus = response?.space?.saved!;

            setIsFavourite(updatedStatus);
            toast(updatedStatus ? "Added to the favourites" : "Removed from the favourites");
        } catch (err) {
            console.log("Error occurred while marking the chat as favourites: " + err);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            await handleUserMessage(inputValue)
        } catch (err) {
            console.log("Error occurred while submitting the messages: " + err)
        }
    }

    const truncateTitle = (text: string | null, maxLength: number = 25) => {
        if (!text) return "";
        return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
    }

    return (
        <div className="flex h-screen bg-[#121212] text-white">
            <main className="flex-1 h-full flex flex-col">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border-b border-[#222] p-4 flex justify-between items-center bg-[#1a1a1a]"
                >
                    <h1 className="text-lg font-medium flex items-center gap-2">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700"
                        >
                            <Bot className="h-4 w-4 text-white" />
                        </motion.div>

                        {
                            isEditingTitle ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                        className="h-8 bg-[#2a2a2a] border-[#333] text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent w-40"
                                        placeholder="Enter new title"
                                        autoFocus
                                        maxLength={50}
                                    />
                                    <div className="flex gap-1">
                                        <Button
                                            size="sm"
                                            className="h-7 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                            onClick={handleSaveRename}
                                            disabled={!newTitle.trim() || isRenaming || newTitle.trim() === title}
                                        >
                                            {
                                                isRenaming ? (
                                                    <div className="h-3 w-3 border-2 border-t-transparent border-white rounded-full animate-spin" />
                                                ) : (
                                                    "Save"
                                                )
                                            }
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 px-2 hover:bg-[#2a2a2a]"
                                            onClick={() => {
                                                setIsEditingTitle(false);
                                                setNewTitle(title || "");
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <span
                                    className="truncate max-w-[200px] cursor-pointer hover:text-blue-400 transition-colors"
                                    title={title || ""}
                                    onClick={() => {
                                        setIsEditingTitle(true);
                                        setNewTitle(title || "");
                                    }}
                                >
                                    {truncateTitle(title)}
                                </span>
                            )
                        }
                    </h1>
                    <div className="flex items-center justify-center gap-3">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                                onClick={() => handleFavourites(!isFavourite)}
                                variant="ghost"
                                size="icon"
                                className="rounded-full p-2 hover:bg-gray-500 dark:hover:bg-gray-800 transition"
                            >
                                <Star
                                    className={`h-10 w-10 ${isFavourite ? "fill-yellow-400 text-yellow-400" : "text-yellow-400"
                                        } transition-colors duration-300`}
                                />
                            </Button>
                        </motion.div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                    <Button onClick={handleRename} variant="ghost" size="icon" className="rounded-full">
                                        <MoreHorizontal className="h-5 w-5 hover:text-white" />
                                    </Button>
                                </motion.div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 bg-[#1e1e1e] border-[#333] text-white">
                                <DropdownMenuItem onClick={handleRename} className="hover:bg-[#2a2a2a] focus:bg-[#2a2a2a]">
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Rename conversation
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </motion.div>
                <ScrollArea className="flex-1 h-full overflow-auto p-4">
                    {
                        pageLoading ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="flex justify-center items-center h-screen"
                            >
                                <div className="flex flex-col items-center gap-4">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center"
                                    >
                                        <Bot className="h-6 w-6 text-white" />
                                    </motion.div>
                                    <p className="text-gray-400">Loading conversation...</p>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="max-w-3xl mx-auto space-y-6 pb-2">
                                <AnimatePresence>
                                    {
                                        messages.map((message, index) => (
                                            <motion.div
                                                key={`${message.id || index}`}
                                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                // transition={{ duration: 0.3, delay: index * 0.1 > 0.5 ? 0.5 : index * 0.1 }}
                                                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                                            >
                                                <div className={`flex gap-3 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : ""}`}>
                                                    {
                                                        message.type === "assistant" ? (
                                                            <div className="flex flex-col items-center">
                                                                <Avatar className="h-9 w-9 ring-1 ring-blue-500 ring-opacity-50">
                                                                    <AvatarImage src="/assistant-avatar.png" alt="Assistant" />
                                                                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 h-full w-full flex items-center justify-center">
                                                                        <span className="text-xs font-bold">OM</span>
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-xs text-gray-400 mt-1">Assistant</span>
                                                            </div>
                                                        ) : message.type === "system" ? (
                                                            <div className="flex flex-col items-center">
                                                                <Avatar className="h-9 w-9 ring-1 ring-red-500 ring-opacity-50">
                                                                    <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-800 h-full w-full flex items-center justify-center">
                                                                        <span className="text-xs font-bold">SYS</span>
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-xs text-gray-400 mt-1">System</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center">
                                                                <Avatar className="h-9 w-9 ring-1 ring-emerald-400 ring-opacity-50">
                                                                    {
                                                                        user?.imageUrl ? (
                                                                            <AvatarImage src={user.imageUrl || "/placeholder.svg"} alt="User" />
                                                                        ) : (
                                                                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-700 h-full w-full flex items-center justify-center">
                                                                                <User className="h-4 w-4 text-white" />
                                                                            </AvatarFallback>
                                                                        )
                                                                    }
                                                                </Avatar>
                                                                <span className="text-xs text-gray-400 mt-1">You</span>
                                                            </div>
                                                        )
                                                    }
                                                    <motion.div
                                                        whileHover={{ scale: 1.01 }}
                                                        className={`rounded-lg p-4 ${message.type === "user"
                                                            ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md"
                                                            : message.type === "system"
                                                                ? "bg-red-900/30 text-red-200 border border-red-800/50"
                                                                : "bg-gradient-to-br from-[#1e1e1e] to-[#2a2a2a] text-gray-200 shadow-md"
                                                            }`}
                                                    >
                                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                                        <p className="text-xs mt-2 opacity-70">{message.timestamp}</p>
                                                    </motion.div>
                                                </div>
                                            </motion.div>
                                        ))
                                    }
                                </AnimatePresence>
                                {
                                    messageLoading && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex justify-start"
                                        >
                                            <div className="flex gap-3 max-w-[80%]">
                                                <div className="flex flex-col items-center">
                                                    <Avatar className="h-9 w-9 ring-1 ring-blue-500 ring-opacity-50">
                                                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 h-full w-full flex items-center justify-center">
                                                            <span className="text-xs font-bold">OM</span>
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs text-gray-400 mt-1">Assistant</span>
                                                </div>
                                                <motion.div
                                                    animate={{ scale: [1, 1.02, 1] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="rounded-lg p-4 bg-gradient-to-br from-[#1e1e1e] to-[#2a2a2a] text-gray-200 shadow-md min-w-[200px]"
                                                >
                                                    <ThinkingAnimation />
                                                </motion.div>
                                            </div>
                                        </motion.div>
                                    )
                                }
                                <div ref={messagesEndRef} />
                            </div>
                        )
                    }
                </ScrollArea>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="border-t border-[#222] p-4 bg-[#1a1a1a]"
                >
                    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                        <div className="relative">
                            <Textarea
                                className="min-h-[60px] max-h-[200px] bg-[#1e1e1e] border border-[#333] rounded-lg pl-4 pr-12 py-3 text-white placeholder:text-gray-500 resize-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                                placeholder="Message Project OM..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSubmit(e)
                                    }
                                }}
                                disabled={pageLoading || messageLoading}
                            />
                            <div className="absolute right-2 bottom-2 flex gap-2">
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-full"
                                        disabled={pageLoading || messageLoading}
                                    >
                                        <Paperclip className="h-5 w-5" />
                                    </Button>
                                </motion.div>
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full h-8 w-8"
                                        disabled={!inputValue.trim() || pageLoading || messageLoading}
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                </motion.div>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </main>
            {/* <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-[#333] text-white">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5 text-blue-400" />
                            Rename Conversation
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="bg-[#1e1e1e] border-[#333] text-white focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                            placeholder="Enter new title"
                            aria-label="New conversation title"
                            maxLength={50}
                        />
                    </div>
                    <DialogFooter className="sm:justify-between">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setRenameDialogOpen(false)}
                            className="text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
                            disabled={isRenaming}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveRename}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                            disabled={!newTitle.trim() || isRenaming || newTitle.trim() === title}
                        >
                            {
                                isRenaming ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                                        Saving...
                                    </div>
                                ) : (
                                    "Save"
                                )
                            }
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog> */}
        </div>
    )
}