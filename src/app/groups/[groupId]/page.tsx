// "use client";

//     import { useEffect, useState, useRef } from "react";
//     import { useParams } from "next/navigation";
//     import Link from "next/link";
//     import Pusher from "pusher-js";
//     import { useSession } from "next-auth/react";
//     import { api } from "~/trpc/react";
    
//     // (Message type definition is unchanged)
//     type Message = { id: string; content: string; createdAt: Date; author: { id: string; name: string | null; image: string | null; }; };

//     export default function GroupPage() {
//       const { groupId } = useParams<{ groupId: string }>();
//       const { data: sessionData } = useSession();
      
//       // State and hooks for chat (unchanged)
//       const messagesEndRef = useRef<HTMLDivElement | null>(null);
//       const [messages, setMessages] = useState<Message[]>([]);
//       const [newMessage, setNewMessage] = useState("");
//       api.message.getAllByGroupId.useQuery({ groupId }, { enabled: !!groupId, onSuccess: setMessages });
//       const sendMessage = api.message.send.useMutation({ onSuccess: () => setNewMessage("") });
      
//       // --- NEW: State and hooks for Events ---
//       const [eventName, setEventName] = useState("");
//       const [eventDate, setEventDate] = useState("");
//       const { data: events, refetch: refetchEvents } = api.event.getAllByGroupId.useQuery({ groupId }, { enabled: !!groupId });
//       const createEvent = api.event.create.useMutation({
//         onSuccess: () => {
//           refetchEvents();
//           setEventName("");
//           setEventDate("");
//         },
//       });

//       // Group and membership data (unchanged)
//       const { data: group, isLoading, error } = api.group.getById.useQuery({ id: groupId });
//       const isMember = group?.members.some(member => member.id === sessionData?.user.id)

//       // Pusher and scroll effects (unchanged)
//       useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
//       useEffect(() => {
//         if (!groupId) return;
//         const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
//         const channel = pusher.subscribe(`group-${groupId}`);
//         channel.bind("new-message", (newMessage: Message) => { setMessages((prev) => [...prev, newMessage]); });
//         return () => { pusher.unsubscribe(`group-${groupId}`); };
//       }, [groupId]);

//       const handleSendMessage = (e: React.FormEvent) => { /* ... (unchanged) */ e.preventDefault(); if (newMessage.trim()) { sendMessage.mutate({ groupId, content: newMessage.trim() }); } };
      
//       // --- NEW: Handler for creating an event ---
//       const handleCreateEvent = (e: React.FormEvent) => {
//         e.preventDefault();
//         if (eventName.trim() && eventDate) {
//           createEvent.mutate({
//             groupId,
//             name: eventName.trim(),
//             date: new Date(eventDate),
//           });
//         }
//       };

//       if (isLoading) return <div>Loading...</div>;
//       if (error || !group) return <div>Group not found.</div>;

//       return (
//         <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
//           <div className="container mt-12 flex flex-col items-center gap-4 px-4 py-8">
//             <h1 className="text-5xl font-extrabold tracking-tight"><span className="text-[hsl(280,100%,70%)]">{group.name}</span></h1>

//             {isMember ? (
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mt-8">
//                 {/* --- CHAT AREA (Column 1) --- */}
//                 <div className="flex h-[60vh] flex-col rounded-xl bg-white/10 p-4">
//                   <h2 className="text-2xl font-bold mb-4">Group Chat</h2>
//                   <div className="flex-grow space-y-4 overflow-y-auto pr-2">
//                     {messages.map((msg) => ( /* ... (message mapping unchanged) */ <div key={msg.id} className={`flex items-start gap-3 ${msg.author.id === sessionData?.user.id ? 'flex-row-reverse' : ''}`}><img src={msg.author.image ?? ''} alt={msg.author.name ?? ''} className="h-10 w-10 rounded-full" /><div className={`rounded-lg px-4 py-2 ${msg.author.id === sessionData?.user.id ? 'bg-blue-600' : 'bg-gray-700'}`}><p className="font-semibold">{msg.author.name}</p><p>{msg.content}</p></div></div>))}
//                     <div ref={messagesEndRef} />
//                   </div>
//                   <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
//                     <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-grow rounded-full bg-white/20 px-4 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)]" />
//                     <button type="submit" disabled={sendMessage.isPending} className="rounded-full bg-blue-600 px-6 py-2 font-semibold transition hover:bg-blue-700 disabled:opacity-50">Send</button>
//                   </form>
//                 </div>

//                 {/* --- NEW: EVENTS AREA (Column 2) --- */}
//                 <div className="flex h-[60vh] flex-col rounded-xl bg-white/10 p-4">
//                   <h2 className="text-2xl font-bold mb-4">Group Events</h2>
//                   <div className="flex-grow space-y-4 overflow-y-auto pr-2">
//                     {events?.length === 0 && <p>No events scheduled yet.</p>}
//                     {events?.map((event) => (
//                       <div key={event.id} className="p-3 bg-white/10 rounded-lg">
//                         <p className="font-bold text-lg">{event.name}</p>
//                         <p className="text-sm">{new Date(event.date).toLocaleString()}</p>
//                         <p className="text-xs text-gray-400 mt-1">Created by {event.createdBy.name}</p>
//                       </div>
//                     ))}
//                   </div>
//                   <form onSubmit={handleCreateEvent} className="mt-4 flex flex-col gap-2">
//                     <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Event Name" className="w-full rounded-md bg-white/20 px-4 py-2 text-white placeholder-gray-300" />
//                     <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full rounded-md bg-white/20 px-4 py-2 text-white placeholder-gray-300" />
//                     <button type="submit" disabled={createEvent.isPending} className="rounded-full bg-green-600 py-2 font-semibold transition hover:bg-green-700 disabled:opacity-50">Add Event</button>
//                   </form>
//                 </div>
//               </div>
//             ) : (
//               <p className="mt-8 text-xl">You must be a member of this group to view its content.</p>
//             )}

//             <div className="mt-8">
//               <Link href="/" className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20">Back to All Groups</Link>
//             </div>
            
//           </div>
//         </main>
//       );
//     }







"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
// FIX 1: Import the Next.js Image component
import Image from "next/image";
import Pusher from "pusher-js";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";

// (Type definitions are unchanged)
import { type AppRouter } from "~/server/api/root";
import { type inferRouterOutputs } from "@trpc/server";
type RouterOutput = inferRouterOutputs<AppRouter>;
type Message = RouterOutput["message"]["getAllByGroupId"][number];


export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { data: sessionData } = useSession();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { data: initialMessages } = api.message.getAllByGroupId.useQuery({ groupId }, { enabled: !!groupId });
  useEffect(() => { if (initialMessages) { setMessages(initialMessages); } }, [initialMessages]);
  
  const sendMessage = api.message.send.useMutation({
    onSuccess: () => setNewMessage(""),
  });
  
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const { data: events, refetch: refetchEvents } = api.event.getAllByGroupId.useQuery({ groupId }, { enabled: !!groupId });
  const createEvent = api.event.create.useMutation({
    onSuccess: () => {
      // FIX 2: Add 'void' to the Promise-returning function
      void refetchEvents();
      setEventName("");
      setEventDate("");
    },
  });

  const [inviteLink, setInviteLink] = useState("");
  const createInviteLink = api.group.createInvite.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/invite/${data.id}`;
      setInviteLink(url);
    }
  });

  const { data: group, isLoading, error } = api.group.getById.useQuery({ id: groupId });
  const isMember = group?.members.some(member => member.id === sessionData?.user.id);
  
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => {
    if (!groupId) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
    const channel = pusher.subscribe(`group-${groupId}`);
    channel.bind("new-message", (newMessage: Message) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });
    return () => { pusher.unsubscribe(`group-${groupId}`); };
  }, [groupId]);

  const handleSendMessage = (e: React.FormEvent) => { /* ... unchanged ... */ e.preventDefault(); if (newMessage.trim()) { sendMessage.mutate({ groupId, content: newMessage.trim() }); } };
  const handleCreateEvent = (e: React.FormEvent) => { /* ... unchanged ... */ e.preventDefault(); if (eventName.trim() && eventDate) { createEvent.mutate({ groupId, name: eventName.trim(), date: new Date(eventDate), }); } };
  const handleGenerateInvite = () => { /* ... unchanged ... */ createInviteLink.mutate({ groupId }); };
  
  if (isLoading) return <div className="flex justify-center items-center h-screen text-white">Loading...</div>;
  if (error || !group) return <div className="flex justify-center items-center h-screen text-white">Group not found.</div>;

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mt-12 flex w-full flex-col items-center gap-4 px-4 py-8">
        <h1 className="text-5xl font-extrabold tracking-tight"><span className="text-[hsl(280,100%,70%)]">{group.name}</span></h1>

        {isMember ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mt-8">
            <div className="flex h-[60vh] flex-col rounded-xl bg-white/10 p-4">
              <h2 className="text-2xl font-bold mb-4">Group Chat</h2>
              <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-start gap-3 ${msg.author.id === sessionData?.user.id ? 'flex-row-reverse' : ''}`}>
                    {/* FIX 3: Replace <img> with <Image /> */}
                    <Image src={msg.author.image ?? ''} alt={msg.author.name ?? 'Avatar'} className="h-10 w-10 rounded-full" width={40} height={40}/>
                    <div className={`rounded-lg px-4 py-2 ${msg.author.id === sessionData?.user.id ? 'bg-blue-600' : 'bg-gray-700'}`}>
                      <p className="font-semibold">{msg.author.name}</p>
                      <p>{msg.content}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-grow rounded-full bg-white/20 px-4 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[hsl(280,100%,70%)]" />
                <button type="submit" disabled={sendMessage.isPending} className="rounded-full bg-blue-600 px-6 py-2 font-semibold transition hover:bg-blue-700 disabled:opacity-50">Send</button>
              </form>
            </div>
            {/* The rest of the JSX is unchanged... */}
            <div className="flex h-[60vh] flex-col rounded-xl bg-white/10 p-4">
              <h2 className="text-2xl font-bold mb-4">Group Events</h2>
              <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                {events?.length === 0 && <p>No events scheduled yet.</p>}
                {events?.map((event) => (
                  <div key={event.id} className="p-3 bg-white/10 rounded-lg">
                    <p className="font-bold text-lg">{event.name}</p>
                    <p className="text-sm">{new Date(event.date).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-1">Created by {event.createdBy.name}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleCreateEvent} className="mt-4 flex flex-col gap-2">
                <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Event Name" className="w-full rounded-md bg-white/20 px-4 py-2 text-white placeholder-gray-300" />
                <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full rounded-md bg-white/20 px-4 py-2 text-white placeholder-gray-300" />
                <button type="submit" disabled={createEvent.isPending} className="rounded-full bg-green-600 py-2 font-semibold transition hover:bg-green-700 disabled:opacity-50">Add Event</button>
              </form>
            </div>
          </div>
        ) : (
          <p className="mt-8 text-xl">You must be a member of this group to view its content.</p>
        )}
        <div className="mt-8 flex w-full max-w-5xl justify-center items-start gap-8">
            {group.createdById === sessionData?.user.id && (
              <div className="flex flex-col items-center gap-4 rounded-xl bg-white/10 p-4 w-full max-w-xs">
                <h3 className="text-xl font-bold">Invite Members</h3>
                <button onClick={handleGenerateInvite} disabled={createInviteLink.isPending} className="rounded-full bg-blue-600 px-6 py-2 font-semibold transition hover:bg-blue-700 disabled:opacity-50">
                  {createInviteLink.isPending ? "Generating..." : "Generate Invite Link"}
                </button>
                {inviteLink && (
                  <div className="w-full text-center">
                    <p className="font-semibold">Share this link:</p>
                    <input type="text" readOnly value={inviteLink} className="mt-2 w-full rounded bg-white/20 p-2 text-center text-white" onFocus={(e) => e.target.select()} />
                  </div>
                )}
              </div>
            )}
        </div>
        <div className="mt-8">
          <Link href="/" className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20">
            Back to All Groups
          </Link>
        </div>
      </div>
    </main>
  );
}