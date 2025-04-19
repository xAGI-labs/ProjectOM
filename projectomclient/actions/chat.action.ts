'use server'

import { revalidatePath } from 'next/cache'
import { Role } from '@/lib/generated/prisma'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { auth, currentUser } from '@clerk/nextjs/server'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

async function syncUser() {
    const { userId } = await auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    const clerkUser = await currentUser();
    if (!clerkUser) {
        throw new Error("Clerk user not found");
    }

    const userData = {
        clerkId: userId,
        name: clerkUser.fullName || clerkUser.firstName || "Anonymous",
        email: clerkUser.emailAddresses[0]?.emailAddress || "",
        avatar: clerkUser.imageUrl || null,
    };

    const user = await prisma.user.upsert({
        where: { clerkId: userId },
        update: {
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar,
        },
        create: {
            clerkId: userData.clerkId,
            name: userData.name,
            email: userData.email,
            avatar: userData.avatar,
        },
    });

    return user;
}
export async function fetchSpaceById(chatId: string) {
    try {
        const space = await prisma.space.findUnique({
            where: {
                id: chatId
            },
            select: {
                initialPrompt: true,
                title: true,
                saved: true
            },
        });
        return { success: !!space, space, error: space ? undefined : "Space not found" };
    } catch (error) {
        console.error("Error fetching space:", error);
        return { success: false, space: null, error: "Internal server error" };
    }
}
export async function createSpace(formData: FormData | { prompt: string }) {
    try {
        const user = await syncUser();

        const prompt = formData instanceof FormData
            ? formData.get('prompt')?.toString()
            : formData.prompt

        if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
            throw new Error('Invalid prompt')
        }

        const space = await prisma.space.create({
            data: {
                title: prompt.substring(0, 100),
                initialPrompt: prompt,
                userId: user.id,
            },
        })

        // await prisma.message.create({
        //     data: {
        //         content: prompt,
        //         role: 'USER',
        //         spaceId: space.id,
        //         userId: user.id,
        //     },
        // })

        revalidatePath('/')

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
        const user = await syncUser();

        const spaces = await prisma.space.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 3,
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
                createdAt: space.createdAt
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

        console.log("Called an api");
        const user = await syncUser();

        const space = await prisma.space.findUnique({
            where: {
                id: spaceId,
                userId: user.id
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

        const userMessage = await prisma.message.create({
            data: {
                content,
                role,
                spaceId,
                userId: user?.id
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
                        userId: user?.id
                    },
                });

                revalidatePath(`/space/${spaceId}`);

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
                        userId: user?.id
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
            throw new Error("Space ID is required");
        }

        const user = await syncUser();

        const space = await prisma.space.findFirst({
            where: {
                id: spaceId,
                userId: user.id,
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: "asc",
                    },
                },
            },
        });

        if (!space) {
            throw new Error("Space not found or unauthorized");
        }

        interface Message {
            id: string;
            content: string;
            role: Role;
            createdAt: Date;
            updatedAt: Date;
        }

        interface SpaceWithMessages {
            id: string;
            title: string;
            initialPrompt: string;
            createdAt: Date;
            updatedAt: Date;
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
            })),
        };
    } catch (error) {
        console.error("Error fetching space messages:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch space messages",
            messages: [],
        };
    }
}
export async function sendInitialAssistantMessage(spaceId: string) {
    try {
        if (!spaceId) {
            throw new Error('Space ID is required')
        }

        const user = await syncUser();

        const space = await prisma.space.findUnique({
            where: {
                id: spaceId,
                userId: user?.id
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

        if (space.messages.length === 0) {
            const welcomeMessage = "Hello! I'm Manus, your AI assistant. How can I help you today?";

            const assistantMessage = await prisma.message.create({
                data: {
                    content: welcomeMessage,
                    role: 'ASSISTANT',
                    spaceId,
                    userId: user?.id
                },
            });

            revalidatePath(`/space/${spaceId}`);

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
export async function addAsFavourites(spaceId: string, savedState: boolean) {
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
    const user = await syncUser();

    try {
        const spaces = await prisma.space.findMany({
            where: { 
                userId: user.id,
                saved: true 
            },
            orderBy: { 
                updatedAt: 'desc' 
            },
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
    const user = await syncUser();

    try {
        const spaces = await prisma.space.findMany({
            where: {
                userId: user.id
            },
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
export async function updateSpaceTitle(spaceId: string, newTitle: string) {
    try {
        const user = await syncUser();

        if (!user.id) {
            return {
                success: false,
                error: "Unauthorized: You must be logged in to update a space title",
            };
        }

        if (!newTitle.trim()) {
            return {
                success: false,
                error: "Title cannot be empty",
            };
        }

        const existingSpace = await prisma.space.findFirst({
            where: {
                id: spaceId,
                userId: user.id,
            },
        });

        if (!existingSpace) {
            return {
                success: false,
                error: "Space not found or you don't have permission to update it",
            };
        }

        const updatedSpace = await prisma.space.update({
            where: {
                id: spaceId,
            },
            data: {
                title: newTitle.trim(),
            },
        });

        return {
            success: true,
            space: updatedSpace,
        };
    } catch (error) {
        console.error("Error updating space title:", error);
        return {
            success: false,
            error: "Failed to update space title",
        };
    }
}