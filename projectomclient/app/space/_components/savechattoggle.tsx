"use client"

import { useState, useEffect } from "react"
import { BookmarkIcon } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { toggleChatSaved } from "@/actions/chat.action"
import { toast } from "sonner"

interface SaveChatToggleProps {
    chatId: string
    initialSavedState?: boolean
}

export function SaveChatToggle({ chatId, initialSavedState = false }: SaveChatToggleProps) {
    const [isSaved, setIsSaved] = useState(initialSavedState)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        setIsSaved(initialSavedState)
    }, [initialSavedState])

    const handleToggleSaved = async () => {
        if (!chatId) return

        setIsLoading(true)
        try {
            const newSavedState = !isSaved
            const response = await toggleChatSaved(chatId, newSavedState)

            if (response.success) {
                setIsSaved(newSavedState)
                toast(newSavedState ? "Chat saved" : "Chat unsaved", {
                    description: newSavedState
                        ? "This chat has been added to your saved chats"
                        : "This chat has been removed from your saved chats",
                    duration: 3000,
                })
            } else {
                toast("Error", {
                    description: response.error || "Failed to update saved status",
                    duration: 3000,
                })
            }
        } catch (error) {
            console.error("Error toggling saved status:", error)
            toast("Error", {
                description: "Failed to update saved status",
                duration: 3000,
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <BookmarkIcon
                className={`h-4 w-4 ${isSaved ? 'text-yellow-500' : 'text-gray-400'}`}
            />
            <Switch
                checked={isSaved}
                onCheckedChange={handleToggleSaved}
                disabled={isLoading}
                className={`${isSaved ? 'bg-yellow-500' : 'bg-gray-700'}`}
            />
            <span className="text-sm text-gray-300">
                {isSaved ? 'Saved' : 'Save'}
            </span>
        </div>
    )
}