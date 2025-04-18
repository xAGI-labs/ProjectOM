"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { createSpace } from "@/actions/chat.action"
import { toast } from "sonner"

export default function Home() {
    const [inputValue, setInputValue] = useState("");
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault()
        if (inputValue.trim()) {
            try {
                setIsSubmitting(true)

                localStorage.setItem("projectom_prompt", inputValue)

                const result = await createSpace({ prompt: inputValue })

                if (!result.success) {
                    throw new Error(result.error || 'Failed to create space')
                }

                router.push(`/space/${result.spaceId}`)
            } catch (error) {
                console.error('Error creating space:', error)
                toast("Error", {
                    description: "Failed to create space. Please try again.",
                })
            } finally {
                setIsSubmitting(false)
            }
        }
    }

    return (
        <div className="flex h-screen bg-[#121212] text-white">
            <main className="flex-1 overflow-auto">
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="flex flex-col items-center justify-center text-center mb-8 mt-12">
                        <h1 className="text-2xl font-medium mb-2">Hello Niraj Jha</h1>
                        <p className="text-gray-400 mb-6">What can I do for you?</p>
                        <form onSubmit={handleSubmit} className="w-full max-w-xl">
                            <div className="relative">
                                <Input
                                    className="bg-[#1e1e1e] border-none h-14 pl-12 pr-12 rounded-lg text-white placeholder:text-gray-500"
                                    placeholder="Give ProjectOM a task to work on..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                    <Search className="h-5 w-5 text-gray-500" />
                                </div>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs bg-transparent border-gray-700 text-gray-400">
                                        Standard
                                    </Badge>
                                    <span className="text-xs text-gray-500">1/3K</span>
                                </div>
                            </div>
                        </form>
                        <div className="w-full max-w-xl mt-3 bg-[#1e1e1e] rounded-lg p-3 flex justify-between items-center">
                            <p className="text-sm text-gray-400">
                                ProjectOM needs certain permissions at task startup and may misbehave.
                            </p>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="text-gray-400 h-8">
                                    Decline
                                </Button>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8">
                                    Accept
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-2 justify-center mb-6">
                            <Badge className="bg-white/10 hover:bg-white/20 text-white rounded-full px-4 py-1">Recommended</Badge>
                            <Badge variant="outline" className="text-gray-400 rounded-full px-4 py-1">
                                Featured
                            </Badge>
                            <Badge variant="outline" className="text-gray-400 rounded-full px-4 py-1">
                                Life
                            </Badge>
                            <Badge variant="outline" className="text-gray-400 rounded-full px-4 py-1">
                                Research
                            </Badge>
                            <Badge variant="outline" className="text-gray-400 rounded-full px-4 py-1">
                                Education
                            </Badge>
                            <Badge variant="outline" className="text-gray-400 rounded-full px-4 py-1">
                                Data Analysis
                            </Badge>
                            <Badge variant="outline" className="text-gray-400 rounded-full px-4 py-1">
                                Productivity
                            </Badge>
                            <Badge variant="outline" className="text-gray-400 rounded-full px-4 py-1">
                                Content Creator
                            </Badge>
                        </div>
                        <p className="text-xs text-gray-500 text-center mb-8">
                            All tasks and capabilities shown in the community are exclusively shared by users. The features does not
                            display any content without your consent.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {
                                templates.map((template, index) => (
                                    <Card key={index} className="bg-[#1e1e1e] border-none overflow-hidden">
                                        <CardContent className="p-0">
                                            <div className="relative h-40 w-full">
                                                <Image
                                                    src={template.image || "/placeholder.svg"}
                                                    alt={template.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                                {
                                                    template.quote && (
                                                        <div className="absolute inset-0 bg-black/60 flex items-center p-4">
                                                            <blockquote className="text-sm text-white">{template.quote}</blockquote>
                                                        </div>
                                                    )
                                                }
                                            </div>
                                        </CardContent>
                                        <CardFooter className="flex flex-col items-start p-4">
                                            <h3 className="text-sm font-medium mb-1">{template.title}</h3>
                                            <p className="text-xs text-gray-400">{template.author}</p>
                                        </CardFooter>
                                    </Card>
                                ))
                            }
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

const templates = [
    {
        title: "Cybersecurity Learning Roadmap",
        author: "Aleksandar N. Hristov",
        image: "/placeholder.svg?height=400&width=600",
        quote:
            "Design an interactive webpage that explains the worldviews of the greatest philosophers in MIST with clear visuals...",
    },
    {
        title: "Innovative RUST Learning Webpage",
        author: "RUST",
        image: "/placeholder.svg?height=400&width=600",
    },
    {
        title: "MPC Style Dune Machine",
        author: "Cosmic Samurai",
        image: "/placeholder.svg?height=400&width=600",
        quote:
            "Come up with a concept for a synth sequencer and create a layout for it with a logo and a cool aesthetic. Then create a website with a...",
    },
    {
        title: "Digital Mobility Solutions Leaks PLC Malaysian Project",
        author: "Executive Business",
        image: "/placeholder.svg?height=400&width=600",
    },
    {
        title: "Successful AI Agent PDF Site",
        author: "SUCCESSFUL AGENT",
        image: "/placeholder.svg?height=400&width=600",
        quote:
            "Create a website similar to https://blog.adept.ai/greymatter, but for AI Agent products that have successfully achieved PMF (Product-...",
    },
    {
        title: "Savanna Through Gate: A Kansas Farm Site Amidst in the Heavens",
        author: "SAVANNA THROUGH GATE",
        image: "/placeholder.svg?height=400&width=600",
    },
    {
        title: "Android APK for To-Do List with Get Icon",
        author: "NEXT GEN LAUNCHER",
        image: "/placeholder.svg?height=400&width=600",
        quote:
            "Build an android apk for todolist UI and forms, so that apk show in main page todolist with notification natural go, if user clicks the...",
    },
    {
        title: "Near-Term Quantum Computing and Related Technologies",
        author: "Quantum",
        image: "/placeholder.svg?height=400&width=600",
    },
]
