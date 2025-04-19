"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { PanelLeft, Clock, Bookmark, Settings, HelpCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { getRecentSpaces, Space } from "@/actions/chat.action";
import { useAuth, useUser, SignInButton } from "@clerk/nextjs";

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const { isSignedIn } = useAuth();
    const { user } = useUser();
    const [recentSpaces, setRecentSpaces] = useState<Space[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isSignedIn) {
            async function fetchRecentSpaces() {
                try {
                    setIsLoading(true);
                    const result = await getRecentSpaces();
                    if (result.success) {
                        setRecentSpaces(result.spaces);
                    } else {
                        console.error("Error fetching recent spaces:", result.error);
                    }
                } catch (error) {
                    console.error("Error fetching recent spaces:", error);
                } finally {
                    setIsLoading(false);
                }
            }
            fetchRecentSpaces();
        } else {
            setIsLoading(false);
        }
    }, [isSignedIn]);

    const toggleSidebar = () => {
        setIsOpen((prev) => !prev);
    };

    const handleNavigation = () => {
        if (typeof window !== "undefined" && window.innerWidth <= 768) {
            setIsOpen(false);
        }
    };

    return (
        <>
            {
                isOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={toggleSidebar}
                    />
                )
            }
            {
                !isOpen && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="fixed top-4 left-0 z-50 text-white bg-[#0a0a0a]/80 hover:bg-[#222] md:text-gray-400 md:hover:text-white"
                        onClick={toggleSidebar}
                    >
                        <PanelLeft className="h-5 w-5" />
                    </Button>
                )
            }
            <aside
                className={cn(
                    "fixed top-0 left-0 h-screen z-50 bg-[#0a0a0a] border-r border-[#222] transition-all duration-300 ease-in-out",
                    isOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full"
                )}
            >
                <div className={cn("flex flex-col h-full", isOpen ? "visible" : "hidden")}>
                    <div className="p-4 border-b border-[#222] flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2" onClick={handleNavigation}>
                            <span className="font-medium text-white">ProjectOM</span>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-black"
                            onClick={toggleSidebar}
                        >
                            <PanelLeft className="h-5 w-5" />
                        </Button>
                    </div>
                    <nav className="flex-1 overflow-y-auto py-4">
                        {
                            isSignedIn ? (
                                <>
                                    <div className="px-3 mb-4">
                                        <Link href="/" onClick={handleNavigation}>
                                            <div className="text-xs font-medium text-gray-500 px-3 mb-2">
                                                New task
                                            </div>
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
                                        <NavItem
                                            icon={<PanelLeft size={16} />}
                                            label="Home"
                                            link="/"
                                            isActive={pathname === "/"}
                                            onNavigate={handleNavigation}
                                        />
                                        <NavItem
                                            icon={<Clock size={16} />}
                                            label="History"
                                            link="/history"
                                            isActive={pathname === "/history"}
                                            onNavigate={handleNavigation}
                                        />
                                        <NavItem
                                            icon={<Bookmark size={16} />}
                                            label="Saved"
                                            link="/savedspace"
                                            isActive={pathname === "/savedspace"}
                                            onNavigate={handleNavigation}
                                        />
                                    </div>
                                    <div className="px-3">
                                        <div className="text-xs font-medium text-gray-500 px-3 mb-2">
                                            Recent
                                        </div>
                                        <div className="space-y-1">
                                            {
                                                isLoading ? (
                                                    <div className="text-xs text-gray-500 px-3">
                                                        Loading spaces...
                                                    </div>
                                                ) : recentSpaces.length > 0 ? (
                                                    recentSpaces.map((space) => (
                                                        <ChatItem
                                                            key={space.id}
                                                            label={space.title}
                                                            description={space.initialPrompt}
                                                            time={formatDistanceToNow(new Date(space.createdAt), {
                                                                addSuffix: true,
                                                            })}
                                                            isActive={pathname === `/space/${space.id}`}
                                                            onClick={() => {
                                                                router.push(`/space/${space.id}`);
                                                                handleNavigation();
                                                            }}
                                                        />
                                                    ))
                                                ) : (
                                                    <div className="text-xs text-gray-500 px-3">
                                                        No recent spaces
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="px-3 py-4">
                                    <p className="text-sm text-center text-gray-400 mb-4">
                                        Sign in to access your spaces and tasks.
                                    </p>
                                    <SignInButton mode="modal">
                                        <Button className="w-full bg-black hover:bg-gray-600 text-white">
                                            Sign In
                                        </Button>
                                    </SignInButton>
                                </div>
                            )
                        }
                    </nav>
                    {
                        isSignedIn && (
                            <div className="p-4 border-t border-[#222]">
                                {/* <div className="flex items-center justify-between mb-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-black"
                                    >
                                        <Settings size={16} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-black"
                                    >
                                        <HelpCircle size={16} />
                                    </Button>
                                </div> */}
                                <div className="flex items-center gap-2">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={user?.imageUrl || "/placeholder.svg"} />
                                        <AvatarFallback>
                                            {user?.firstName?.[0] || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">
                                            {user?.fullName || user?.firstName || "User"}
                                        </p>
                                    </div>
                                    {/* <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-gray-400 hover:text-black"
                                    >
                                        <ChevronRight size={16} />
                                    </Button> */}
                                </div>
                            </div>
                        )
                    }
                </div>
            </aside>
        </>
    );
}

function NavItem({
    icon,
    label,
    isActive = false,
    link,
    onNavigate,
}: {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    link: string;
    onNavigate: () => void;
}) {
    return (
        <Link href={link}>
            <Button
                variant="ghost"
                className={cn(
                    "w-full justify-start",
                    isActive
                        ? "bg-[#222] text-white"
                        : "text-gray-400 hover:text-white hover:bg-[#222]"
                )}
                onClick={onNavigate}
            >
                <span className="flex items-center gap-2">
                    {icon}
                    <span>{label}</span>
                </span>
            </Button>
        </Link>
    );
}

function ChatItem({
    label,
    description,
    time,
    isActive = false,
    onClick,
}: {
    label: string;
    description: string;
    time: string;
    isActive?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full text-left p-3 rounded-lg transition-colors hover:bg-[#222] group",
                isActive ? "bg-[#222]" : ""
            )}
        >
            <div className="flex flex-col gap-1">
                <h3 className="text-sm font-medium text-gray-300 group-hover:text-white truncate">
                    {label}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600">{time}</span>
                    <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        View →
                    </span>
                </div>
            </div>
        </button>
    );
}