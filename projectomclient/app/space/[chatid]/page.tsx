import ChatPage from "../_components/chatpage";

export default async function ChatSpace({ params }: { params: Promise<{ chatid: string }> }) {
    const { chatid } = await params;
    
    return (
        <ChatPage chatId={chatid} />
    )
}
