"use client";

import Link from "next/link";
import { UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";

export default function Navbar() {
    const { userId } = useAuth();

    return (
        <nav className="w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex justify-between items-center">
                    <Link href="/" className="text-2xl font-semibold text-white transition-colors pl-4">
                        ProjectOM
                    </Link>
                    <div className="flex items-center space-x-4">
                        {
                            userId ? (
                                <UserButton afterSignOutUrl="/" />
                            ) : (
                                <>
                                    <SignInButton mode="modal">
                                        <button className="px-4 py-2 text-sm font-medium text-white border border-white rounded-md hover:bg-black hover:text-white transition-colors">
                                            Sign In
                                        </button>
                                    </SignInButton>

                                    <SignUpButton mode="modal">
                                        <button className="px-4 py-2 text-sm font-medium text-white border border-white rounded-md hover:bg-black hover:text-white transition-colors">
                                            Sign Up
                                        </button>
                                    </SignUpButton>

                                </>
                            )
                        }
                    </div>
                </div>
            </div>
        </nav>
    );
}
