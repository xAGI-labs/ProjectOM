"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="bg-yellow-100 text-yellow-600 p-4 rounded-full">
                        <AlertTriangle className="h-10 w-10" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-white">404 - Page Not Found</h1>
                <p className="text-gray-100 pb-4">
                    Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <Link href="/" className="">
                    <Button className="bg-black text-white hover:bg-gray-900 transition">
                        Go to Homepage
                    </Button>
                </Link>
            </div>
        </div>
    );
}
