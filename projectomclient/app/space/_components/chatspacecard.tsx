import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { BookmarkIcon, MessageCircleIcon } from 'lucide-react'

interface ChatSpaceCardProps {
    id: string
    title: string
    lastMessage?: string
    updatedAt: Date
    saved: boolean
}
export function ChatSpaceCard({ id, title, lastMessage, updatedAt, saved }: ChatSpaceCardProps) {
    const timeAgo = formatDistanceToNow(new Date(updatedAt), { addSuffix: true })

    return (
        <Link href={`/space/${id}`} className="block">
            <div className="bg-gradient-to-br from-[#1e1e1e] to-[#2a2a2a] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-all duration-200 hover:shadow-lg">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-200 truncate">
                        {title || `Chat #${id.substring(0, 8)}`}
                    </h3>
                    {
                        saved && (
                            <BookmarkIcon className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                        )
                    }
                </div>
                {
                    lastMessage && (
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{lastMessage}</p>
                    )
                }
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <div className="flex items-center">
                        <MessageCircleIcon className="h-3 w-3 mr-1" />
                        <span>Last updated {timeAgo}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}