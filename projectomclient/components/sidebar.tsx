"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { PanelLeft, Clock, Bookmark, Settings, HelpCircle, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Sidebar() {
    const [isOpen, setIsOpen] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 768) {
                setIsOpen(false)
            } else {
                setIsOpen(true)
            }
        }

        handleResize()

        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    return (
        <>
            {isOpen && <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setIsOpen(false)} />}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 md:hidden text-white"
                onClick={() => setIsOpen(!isOpen)}
            >
                <PanelLeft className="h-5 w-5" />
            </Button>
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 w-64 bg-[#0a0a0a] border-r border-[#222] transition-transform duration-300 md:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                )}
            >
                <div className="flex flex-col h-full">
                    <div className="p-4 border-b border-[#222]">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="bg-white rounded-full p-1">
                                <div className="bg-black rounded-full w-5 h-5 flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">p</span>
                                </div>
                            </div>
                            <span className="font-medium">ProjectOM</span>
                        </Link>
                    </div>
                    <nav className="flex-1 overflow-y-auto py-4">
                        <div className="px-3 mb-4">
                            <Link href="/landingpage">
                                <div className="text-xs font-medium text-gray-500 px-3 mb-2">New task</div>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-gray-400 hover:text-white hover:bg-[#222] mb-2"
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="w-5 h-5 flex items-center justify-center border border-gray-700 rounded text-xs">
                                            +
                                        </span>
                                        New task
                                    </span>
                                </Button>
                            </Link>
                        </div>
                        <div className="space-y-1 px-3 mb-6">
                            <NavItem icon={<PanelLeft size={16} />} label="Home" active />
                            <NavItem icon={<Clock size={16} />} label="History" />
                            <NavItem icon={<Bookmark size={16} />} label="Saved" />
                        </div>
                        <div className="px-3">
                            <div className="text-xs font-medium text-gray-500 px-3 mb-2">Recent</div>
                            <div className="space-y-1">
                                <ChatItem
                                    label="Tour and Travel Websites in Nepal"
                                    description="I'm preparing for research on Nepal tour and travel..."
                                    time="17 hours ago"
                                    onClick={() => router.push("/space/nepal-travel-123")}
                                />
                            </div>
                        </div>
                    </nav>
                    <div className="p-4 border-t border-[#222]">
                        <div className="flex items-center justify-between mb-4">
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                <Settings size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                <HelpCircle size={16} />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Avatar className="w-8 h-8">
                                <AvatarImage src="/placeholder.svg" />
                                <AvatarFallback>NJ</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">Niraj Jha</p>
                            </div>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    )
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
    return (
        <Button
            variant="ghost"
            className={cn(
                "w-full justify-start",
                active ? "bg-[#222] text-white" : "text-gray-400 hover:text-white hover:bg-[#222]",
            )}
        >
            <span className="flex items-center gap-2">
                {icon}
                <span>{label}</span>
            </span>
        </Button>
    )
}

function ChatItem({
    label,
    description,
    time,
    onClick,
}: {
    label: string
    description: string
    time: string
    onClick: () => void
}) {
    return (
        <button onClick={onClick} className="w-full text-left p-3 rounded-lg transition-colors hover:bg-[#222] group">
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-gray-300 group-hover:text-white truncate">{label}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600">{time}</span>
                    <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">View →</span>
                </div>
            </div>
        </button>
    )
}