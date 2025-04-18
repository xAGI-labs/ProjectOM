"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth <= 768;
            setIsOpen(!isMobile);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className="flex min-h-screen w-full">
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
            <main
                className={cn(
                    "flex-1 w-full transition-all duration-300 ease-in-out bg-[#0a0a0a]",
                    isOpen ? "md:ml-[16rem]" : "ml-0"
                )}
            >
                {children}
            </main>
        </div>
    );
}