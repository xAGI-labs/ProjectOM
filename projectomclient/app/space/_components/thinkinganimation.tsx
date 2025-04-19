"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

export default function ThinkingAnimation() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => (prev + 1) % 100)
        }, 50)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
                <motion.div
                    className="w-2 h-2 bg-blue-500 rounded-full"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        times: [0, 0.5, 1],
                    }}
                />
                <motion.div
                    className="w-2 h-2 bg-blue-500 rounded-full"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: 0.2,
                        times: [0, 0.5, 1],
                    }}
                />
                <motion.div
                    className="w-2 h-2 bg-blue-500 rounded-full"
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                        delay: 0.4,
                        times: [0, 0.5, 1],
                    }}
                />
            </div>
        </div>
    )
}
