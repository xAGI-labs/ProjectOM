import { prisma } from "@/lib/prisma";
import { Webhook } from "svix";
import { headers } from "next/headers";

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || "";
    const payload = await req.json();
    const heads = await headers();

    const svix_id = heads.get("svix-id") || "";
    const svix_timestamp = heads.get("svix-timestamp") || "";
    const svix_signature = heads.get("svix-signature") || "";

    try {
        const webhook = new Webhook(WEBHOOK_SECRET);
        webhook.verify(JSON.stringify(payload), {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error("Webhook verification failed:", err);
        return new Response("Error verifying webhook", { status: 400 });
    }

    const { type, data } = payload;

    if (type === "user.updated") {
        const clerkId = data.id;
        const userData = {
            name: data.full_name || data.first_name || "Anonymous",
            email: data.email_addresses[0]?.email_address || "",
            avatar: data.profile_image_url || null,
        };

        await prisma.user.update({
            where: { clerkId },
            data: userData,
        });

        return new Response("User updated", { status: 200 });
    }

    return new Response("Event ignored", { status: 200 });
}