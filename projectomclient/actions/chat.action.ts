'use server'

import { revalidatePath } from 'next/cache'
import { Role } from '@/lib/generated/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function createSpace(formData: FormData | { prompt: string }) {
    try {
        // const session = await getServerSession(authOptions)

        // if (!session?.user) {
        //     throw new Error('Unauthorized')
        // }

        const prompt = formData instanceof FormData
            ? formData.get('prompt')?.toString()
            : formData.prompt

        if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
            throw new Error('Invalid prompt')
        }

        // const user = await prisma.user.findUnique({
        //     where: {
        //         email: session.user.email as string,
        //     },
        // })

        // if (!user) {
        //     throw new Error('User not found')
        // }

        const space = await prisma.space.create({
            data: {
                title: prompt.substring(0, 100),
                initialPrompt: prompt,
                // userId: user.id,
            },
        })

        await prisma.message.create({
            data: {
                content: prompt,
                role: 'USER',
                spaceId: space.id,
                // userId: user.id,
            },
        })

        // Revalidate the homepage path to update recent spaces
        revalidatePath('/landingpage')

        return { success: true, spaceId: space.id }
    } catch (error) {
        console.error('Error creating space:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create space'
        }
    }
}
export type Space = {
    id: string
    title: string
    initialPrompt: string
    createdAt: Date
}
export async function getRecentSpaces() {
    try {
        // const session = await getServerSession(authOptions)

        // if (!session?.user) {
        //     throw new Error('Unauthorized')
        // }

        // // Get user ID from the session
        // const user = await prisma.user.findUnique({
        //     where: {
        //         email: session.user.email as string,
        //     },
        // })

        // if (!user) {
        //     throw new Error('User not found')
        // }

        // Fetch recent spaces
        const spaces = await prisma.space.findMany({
            // where: {
            //     userId: user.id,
            // },
            orderBy: {
                createdAt: 'desc',
            },
            take: 5,
            select: {
                id: true,
                title: true,
                initialPrompt: true,
                createdAt: true,
            },
        })

        return {
            success: true,
            spaces: spaces.map((space: Space) => ({
                ...space,
                createdAt: space.createdAt.toString()
            }))
        }
    } catch (error) {
        console.error('Error fetching recent spaces:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch recent spaces',
            spaces: []
        }
    }
}
export async function sendMessage(content: string, spaceId: string, role: Role = 'USER') {
    try {
        if (!content || typeof content !== 'string' || content.trim() === '') {
            throw new Error('Invalid message content')
        }

        if (!spaceId) {
            throw new Error('Space ID is required')
        }

        // Check if the space exists
        const space = await prisma.space.findUnique({
            where: {
                id: spaceId,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        })

        if (!space) {
            throw new Error('Space not found')
        }

        // Create the user message
        const userMessage = await prisma.message.create({
            data: {
                content,
                role,
                spaceId,
            },
        })

        if (role === 'USER') {
            try {
                const conversationHistory: { role: 'user' | 'assistant'; content: string }[] = space.messages.map((msg: { role: Role; content: string }) => ({
                    role: msg.role === 'USER' ? 'user' : 'assistant',
                    content: msg.content
                }));

                conversationHistory.push({
                    role: 'user',
                    content
                });

                const response = await anthropic.messages.create({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 1000,
                    messages: conversationHistory,
                    system: "You are a helpful AI assistant named Manus. Be concise, friendly, and helpful.",
                });

                const assistantContent = 'text' in response.content[0] ? response.content[0].text : 'Default response text';

                const assistantMessage = await prisma.message.create({
                    data: {
                        content: assistantContent,
                        role: 'ASSISTANT',
                        spaceId,
                    },
                });

                revalidatePath(`/chat/${spaceId}`);

                return {
                    success: true,
                    userMessageId: userMessage.id,
                    assistantMessageId: assistantMessage.id,
                    assistantMessage: assistantContent
                }
            } catch (claudeError) {
                console.error('Error generating AI response:', claudeError);

                const errorMessage = await prisma.message.create({
                    data: {
                        content: "I'm sorry, I couldn't generate a response at the moment. Please try again later.",
                        role: 'ASSISTANT',
                        spaceId,
                    },
                });

                return {
                    success: false,
                    userMessageId: userMessage.id,
                    error: claudeError instanceof Error ? claudeError.message : 'Failed to generate AI response',
                    assistantMessageId: errorMessage.id,
                    assistantMessage: errorMessage.content
                }
            }
        }

        revalidatePath(`/space/${spaceId}`);

        return {
            success: true,
            messageId: userMessage.id,
            message: content
        }
    } catch (error) {
        console.error('Error sending message:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send message'
        }
    }
}
export async function getSpaceMessages(spaceId: string) {
    try {
        if (!spaceId) {
            throw new Error('Space ID is required')
        }

        const space = await prisma.space.findUnique({
            where: {
                id: spaceId,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        })

        if (!space) {
            throw new Error('Space not found')
        }

        interface Message {
            id: string;
            content: string;
            role: Role;
            createdAt: string;
            updatedAt: string;
        }

        interface SpaceWithMessages {
            id: string;
            title: string;
            initialPrompt: string;
            createdAt: string;
            updatedAt: string;
            messages: Message[];
        }

        return {
            success: true,
            space: space as SpaceWithMessages,
            messages: space.messages.map((message: Message) => ({
                id: message.id,
                content: message.content,
                role: message.role,
                createdAt: message.createdAt,
                updatedAt: message.updatedAt,
            }))
        }
    } catch (error) {
        console.error('Error fetching space messages:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch space messages',
            messages: []
        }
    }
}
export async function sendInitialAssistantMessage(spaceId: string) {
    try {
        if (!spaceId) {
            throw new Error('Space ID is required')
        }

        // Check if the space exists
        const space = await prisma.space.findUnique({
            where: {
                id: spaceId,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        })

        if (!space) {
            throw new Error('Space not found')
        }

        // If there are no messages, send a welcome message
        if (space.messages.length === 0) {
            const welcomeMessage = "Hello! I'm Manus, your AI assistant. How can I help you today?";

            const assistantMessage = await prisma.message.create({
                data: {
                    content: welcomeMessage,
                    role: 'ASSISTANT',
                    spaceId,
                },
            });

            // Revalidate the chat page path to update the messages
            revalidatePath(`/chat/${spaceId}`);

            return {
                success: true,
                messageId: assistantMessage.id,
                message: welcomeMessage
            }
        }

        return {
            success: true,
            message: "Space already has messages"
        }
    } catch (error) {
        console.error('Error sending initial message:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to send initial message'
        }
    }
}

export async function toggleChatSaved(spaceId: string, savedState: boolean) {
    try {
        const updatedSpace = await prisma.space.update({
            where: { id: spaceId },
            data: { saved: savedState },
        })

        revalidatePath(`/space/${spaceId}`)
        revalidatePath('/saved')
        revalidatePath('/history')

        return {
            success: true,
            space: updatedSpace
        }
    } catch (error) {
        console.error("Error updating saved status:", error)
        return {
            success: false,
            error: "Failed to update saved status"
        }
    }
}

export async function getSavedSpaces() {
    try {
        const spaces = await prisma.space.findMany({
            where: { saved: true },
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                }
            }
        })

        return {
            success: true,
            spaces
        }
    } catch (error) {
        console.error("Error fetching saved spaces:", error)
        return {
            success: false,
            error: "Failed to fetch saved spaces"
        }
    }
}

export async function getAllSpaces() {
    try {
        const spaces = await prisma.space.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                }
            }
        })

        return {
            success: true,
            spaces
        }
    } catch (error) {
        console.error("Error fetching all spaces:", error)
        return {
            success: false,
            error: "Failed to fetch all spaces"
        }
    }
}