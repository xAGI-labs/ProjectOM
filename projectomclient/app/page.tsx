"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Array<{ type: string; content: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    // Add user message to chat
    const userMessage = { type: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    
    // Show loading state
    setLoading(true);
    
    try {
      // Submit the prompt to the backend
      const response = await fetch('/api/prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setTaskId(data.message.split(':')[1].trim());
        
        // Start polling for results
        pollForResults(data.message.split(':')[1].trim());
      } else {
        // Show error message
        setMessages((prev) => [...prev, { type: "system", content: `Error: ${data.message}` }]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error submitting prompt:', error);
      setMessages((prev) => [...prev, { type: "system", content: "Failed to connect to the server." }]);
      setLoading(false);
    }
    
    // Clear input
    setPrompt("");
  };
  
  const pollForResults = async (id: string) => {
    // Poll for results every 1 second
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/tasks/${id}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          // Results are ready
          clearInterval(interval);
          setMessages((prev) => [...prev, { type: "assistant", content: data.results }]);
          setLoading(false);
          setTaskId(null);
        } else if (data.status === 'error') {
          // Error occurred
          clearInterval(interval);
          setMessages((prev) => [...prev, { type: "system", content: `Error: ${data.message}` }]);
          setLoading(false);
          setTaskId(null);
        }
        // If still processing, continue polling
      } catch (error) {
        console.error('Error polling for results:', error);
        clearInterval(interval);
        setMessages((prev) => [...prev, { type: "system", content: "Failed to retrieve results." }]);
        setLoading(false);
        setTaskId(null);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <header className="flex items-center justify-center py-4 border-b dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ProjectOM</h1>
      </header>
      
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Image
                src="/manus-logo.svg"
                alt="Manus Logo"
                width={120}
                height={120}
                className="mb-4 opacity-50"
                priority
              />
              <h2 className="text-xl text-gray-500 dark:text-gray-400">
                Hello! What can I do for you today?
              </h2>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.type === "user"
                    ? "bg-blue-100 dark:bg-blue-900 ml-auto max-w-[80%]"
                    : message.type === "assistant"
                    ? "bg-gray-100 dark:bg-gray-800 mr-auto max-w-[80%]"
                    : "bg-red-100 dark:bg-red-900 mx-auto max-w-[90%]"
                }`}
              >
                <p className="text-sm font-medium mb-1">
                  {message.type === "user" ? "You" : message.type === "assistant" ? "Manus" : "System"}
                </p>
                <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
            ))
          )}
          
          {loading && (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
              <p className="ml-2 text-gray-600 dark:text-gray-300">
                {taskId ? "Processing your request..." : "Sending..."}
              </p>
            </div>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="border-t p-4 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Give Manus a task to work on..."
              className="flex-1 p-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
