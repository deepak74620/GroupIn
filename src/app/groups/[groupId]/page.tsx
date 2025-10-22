"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Pusher from "pusher-js";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";

// (Type definitions are unchanged)
import { type AppRouter } from "~/server/api/root";
import { type inferRouterOutputs } from "@trpc/server";
type RouterOutput = inferRouterOutputs<AppRouter>;
type Message = RouterOutput["message"]["getAllByGroupId"][number];
type Member = RouterOutput["group"]["getById"]["members"][number];


export default function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const { data: sessionData } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'activity' | 'members'>('activity');

  const { data: group, isLoading, error, refetch: refetchGroup } = api.group.getById.useQuery({ id: groupId });
  const isCreator = group?.createdById === sessionData?.user.id;
  const isMember = group?.members.some(member => member.userId === sessionData?.user.id);
  
  const promoteAdmin = api.group.promoteToAdmin.useMutation({ onSuccess: () => refetchGroup() });
  const demoteAdmin = api.group.demoteFromAdmin.useMutation({ onSuccess: () => refetchGroup() });
  const leaveGroup = api.group.leave.useMutation({
    onSuccess: () => {
      router.push('/');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { data: initialMessages } = api.message.getAllByGroupId.useQuery({ groupId }, { enabled: !!groupId });
  useEffect(() => { if (initialMessages) { setMessages(initialMessages); } }, [initialMessages]);
  const sendMessage = api.message.send.useMutation({ onSuccess: () => setNewMessage("") });
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const { data: events, refetch: refetchEvents } = api.event.getAllByGroupId.useQuery({ groupId }, { enabled: !!groupId });
  const createEvent = api.event.create.useMutation({ onSuccess: () => { void refetchEvents(); setEventName(""); setEventDate(""); } });
  const [inviteLink, setInviteLink] = useState("");
  const createInviteLink = api.group.createInvite.useMutation({ onSuccess: (data) => { setInviteLink(`${window.location.origin}/invite/${data.id}`); } });
  
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!groupId) return; const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! }); const channel = pusher.subscribe(`group-${groupId}`); channel.bind("new-message", (newMessage: Message) => { setMessages((prevMessages) => [...prevMessages, newMessage]); }); return () => { pusher.unsubscribe(`group-${groupId}`); }; }, [groupId]);
  
  const handleSendMessage = (e: React.FormEvent) => { e.preventDefault(); if (newMessage.trim()) { sendMessage.mutate({ groupId, content: newMessage.trim() }); } };
  const handleCreateEvent = (e: React.FormEvent) => { e.preventDefault(); if (eventName.trim() && eventDate) { createEvent.mutate({ groupId, name: eventName.trim(), date: new Date(eventDate), }); } };
  const handleGenerateInvite = () => { createInviteLink.mutate({ groupId }); };
  const handleRoleChange = (member: Member) => { if (member.isAdmin) { demoteAdmin.mutate({ groupId, memberId: member.userId }); } else { promoteAdmin.mutate({ groupId, memberId: member.userId }); } };
  const handleLeaveGroup = () => { if (window.confirm("Are you sure you want to leave this group?")) { leaveGroup.mutate({ groupId }); } };
  
  if (isLoading) return <div className="flex justify-center items-center h-screen text-white">Loading...</div>;
  if (error || !group) return <div className="flex justify-center items-center h-screen text-white">Group not found.</div>;
  if (!isMember && !isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <p className="mt-8 text-xl">You must be a member of this group to view its content.</p>
        <div className="mt-8">
          <Link href="/" className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20">
            Back to All Groups
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mt-12 flex w-full flex-col items-center gap-4 px-4 py-8">
        <h1 className="text-5xl font-extrabold tracking-tight"><span className="text-[hsl(280,100%,70%)]">{group.name}</span></h1>

        <div className="mt-8 flex w-full max-w-5xl border-b border-white/10">
          <button onClick={() => setActiveTab('activity')} className={`px-6 py-3 font-semibold transition ${activeTab === 'activity' ? 'text-white border-b-2 border-[hsl(280,100%,70%)]' : 'text-gray-400 hover:text-white'}`}>
            Activity
          </button>
          <button onClick={() => setActiveTab('members')} className={`px-6 py-3 font-semibold transition ${activeTab === 'members' ? 'text-white border-b-2 border-[hsl(280,100%,70%)]' : 'text-gray-400 hover:text-white'}`}>
            Members ({group.members.length})
          </button>
        </div>

        <div className="w-full max-w-5xl mt-4">
          {/* --- THIS IS THE FIX --- */}
          {/* We now have the complete, valid JSX for the 'activity' tab */}
          {activeTab === 'activity' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* CHAT AREA */}
              <div className="flex h-[60vh] flex-col rounded-xl bg-white/10 p-4">
                <h2 className="text-2xl font-bold mb-4">Group Chat</h2>
                <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.author.id === sessionData?.user.id ? 'flex-row-reverse' : ''}`}>
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

              {/* EVENTS AREA */}
              <div className="flex h-[60vh] flex-col rounded-xl bg-white/10 p-4">
                <h2 className="text-2xl font-bold mb-4">Group Events</h2>
                <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                  {events?.map((event) => (
                    // --- START CHANGE ---
          // Wrap the event card in a Link
          <Link 
             key={event.id} 
             href={`/groups/${groupId}/events/${event.id}`}
             className="block p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
          >
            <div> {/* Wrap content in a div because Link expects a single child if it's not functional component */}
              <p className="font-bold text-lg">{event.name}</p>
              <p className="text-sm">{new Date(event.date).toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">Created by {event.createdBy.name}</p>
            </div>
          </Link>
          // --- END CHANGE ---
                  ))}
                </div>
                <form onSubmit={handleCreateEvent} className="mt-4 flex flex-col gap-2">
                  <input type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Event Name" className="w-full rounded-md bg-white/20 px-4 py-2 text-white placeholder-gray-300" />
                  <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="w-full rounded-md bg-white/20 px-4 py-2 text-white placeholder-gray-300" />
                  <button type="submit" disabled={createEvent.isPending} className="rounded-full bg-green-600 py-2 font-semibold transition hover:bg-green-700 disabled:opacity-50">Add Event</button>
                </form>
              </div>
            </div>
          )}
          
          {activeTab === 'members' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="rounded-xl bg-white/10 p-6">
                <h2 className="text-2xl font-bold">Member List</h2>
                <ul className="mt-4 space-y-3">
                  {group.members.map((member) => (
                    <li key={member.userId} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Image src={member.user.image ?? ""} alt={member.user.name ?? "Avatar"} className="h-10 w-10 rounded-full" width={40} height={40}/>
                        <span>{member.user.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {group.createdById === member.userId ? ( <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold">Creator</span> ) : 
                          member.isAdmin ? ( <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold">Admin</span> ) : 
                          ( <span className="rounded-full bg-gray-600 px-3 py-1 text-xs font-semibold">Member</span> )}
                        {isCreator && group.createdById !== member.userId && (
                          <button onClick={() => handleRoleChange(member)} disabled={promoteAdmin.isPending || demoteAdmin.isPending} className={`rounded-md px-2 py-1 text-xs transition ${member.isAdmin ? "bg-yellow-500 hover:bg-yellow-600" : "bg-green-500 hover:bg-green-600"}`}>
                            {member.isAdmin ? "Remove Admin" : "Make Admin"}
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-8">
                {isCreator && (
                  <div className="flex flex-col items-center gap-4 rounded-xl bg-white/10 p-4 h-fit">
                    <h3 className="text-xl font-bold">Invite Members</h3>
                    <button onClick={handleGenerateInvite} disabled={createInviteLink.isPending} className="rounded-full bg-blue-600 px-6 py-2 font-semibold transition hover:bg-blue-700 disabled:opacity-50">
                      {createInviteLink.isPending ? "Generating..." : "Generate Invite Link"}
                    </button>
                    {inviteLink && (
                      <div className="w-full text-center">
                        <p className="font-semibold">Share this link:</p>
                        <input type="text" readOnly value={inviteLink} className="mt-2 w-full rounded bg-white/20 p-2 text-center text-white" onFocus={(e) => e.target.select()}/>
                      </div>
                    )}
                  </div>
                )}
                {!isCreator && (
                  <div className="flex flex-col items-center gap-4 rounded-xl bg-white/10 p-4 h-fit">
                    <h3 className="text-xl font-bold">Leave Group</h3>
                    <p className="text-sm text-center text-gray-300">If you leave, you will need a new invite to rejoin.</p>
                    <button onClick={handleLeaveGroup} disabled={leaveGroup.isPending} className="w-full rounded-full bg-red-600 px-6 py-2 font-semibold transition hover:bg-red-700 disabled:opacity-50">
                      {leaveGroup.isPending ? "Leaving..." : "Leave this Group"}
                    </button>
                  </div>
                )}
              </div>
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