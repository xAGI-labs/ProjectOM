"use client"

import { useEffect, useState } from "react"
import { getAllSpaces } from "@/actions/chat.action"
import { Clock } from "lucide-react"
import { ChatSpaceCard } from "../space/_components/chatspacecard"

interface Space {
    id: string
    title: string
    saved: boolean
    updatedAt: string | Date
    messages: Array<{
        content: string
    }>
}

export default function ChatHistoryPage() {
    const [spaces, setSpaces] = useState<Space[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchAllSpaces = async () => {
            try {
                const response = await getAllSpaces()

                if (response.success && response.spaces) {
                    setSpaces(response.spaces)
                } else {
                    setError(response.error || "Failed to fetch chat history")
                }
            } catch (err) {
                console.error("Error fetching all spaces:", err)
                setError("An unexpected error occurred")
            } finally {
                setLoading(false)
            }
        }

        fetchAllSpaces()
    }, [])

    return (
        <div className="flex h-screen bg-[#121212] text-white">
            <main className="flex-1 flex flex-col">
                <div className="border-b border-[#222] p-4 flex items-center">
                    <div className="flex items-center gap-2 pl-10 h-10 md:pl-0">
                        <Clock className="h-5 w-5 text-blue-400" />
                        <h1 className="text-lg font-medium">Chat History</h1>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-4">
                    <div className="max-w-3xl mx-auto">
                        {
                            loading ? (
                                <div className="flex justify-center items-center h-64">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-150"></div>
                                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-300"></div>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="text-center text-red-400 p-8 bg-red-900/20 rounded-lg border border-red-800/30">
                                    <p>{error}</p>
                                </div>
                            ) : spaces.length === 0 ? (
                                <div className="text-center text-gray-400 p-8 bg-gray-800/20 rounded-lg border border-gray-700/30">
                                    <p>No chat history found.</p>
                                    <p className="mt-2 text-sm">Start a new chat to see it here.</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-1">
                                    {
                                        spaces.map((space) => (
                                            <ChatSpaceCard
                                                key={space.id}
                                                id={space.id}
                                                title={space.title}
                                                lastMessage={space.messages[0]?.content}
                                                updatedAt={new Date(space.updatedAt)}
                                                saved={space.saved}
                                            />
                                        ))
                                    }
                                </div>
                            )
                        }
                    </div>
                </div>
            </main>
        </div>
    )
}