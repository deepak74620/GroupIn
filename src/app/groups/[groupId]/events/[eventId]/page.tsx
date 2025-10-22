
// <<<<----------------  preview in user working receiver black stop sharing button doesn't toggles       ------------------->>>>>>




// "use client";

// import { useParams } from "next/navigation";
// import Link from "next/link";
// import { useSession } from "next-auth/react";
// import { api } from "~/trpc/react";
// import { useState, useRef, useEffect, useCallback } from "react";
// import Peer from "simple-peer";
// import Pusher from "pusher-js";

// export default function EventPage() {
//   const params = useParams();
//   const groupId = typeof params?.groupId === 'string' ? params.groupId : '';
//   const eventId = typeof params?.eventId === 'string' ? params.eventId : '';
  
//   const { data: sessionData } = useSession();
//   const { data: event, isLoading: isEventLoading } = api.event.getById.useQuery({ eventId }, { enabled: !!eventId });
  
//   // --- NEW: We also fetch the group data to check for admin roles ---
//   const { data: group, isLoading: isGroupLoading } = api.group.getById.useQuery({ id: groupId }, { enabled: !!groupId });

//   const [isStreaming, setIsStreaming] = useState(false);
//   const [streamerId, setStreamerId] = useState<string | null>(null);
  
//   const myVideoRef = useRef<HTMLVideoElement>(null);
//   const peerVideoRef = useRef<HTMLVideoElement>(null);
//   const peerRef = useRef<Peer.Instance | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);

//   const sendSignalMutation = api.webrtc.sendSignal.useMutation();

//   // --- useCallback ensures these functions are stable and don't cause re-renders ---
//   const startStream = useCallback(async () => {
//     try {
//       const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
//       if (myVideoRef.current) myVideoRef.current.srcObject = mediaStream;
//       localStreamRef.current = mediaStream;
//       setIsStreaming(true);
//       setStreamerId(sessionData!.user.id);
//       sendSignalMutation.mutate({ groupId, signal: { type: 'iamstreamer' } });
//     } catch (err) { console.error("Screen share failed", err); }
//   }, [groupId, sessionData, sendSignalMutation]);

//   const stopStream = useCallback(() => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach(track => track.stop());
//       localStreamRef.current = null;
//       sendSignalMutation.mutate({ groupId, signal: { type: 'streamend' } });
//     }
//   }, [groupId, sendSignalMutation]);

//   // --- THIS IS THE FINAL, STABLE useEffect ---
//   useEffect(() => {
//     if (!groupId || !sessionData?.user.id) return;

//     const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
//     const channel = pusher.subscribe(`group-${groupId}`);

//     const onSignal = (data: { senderId: string, signal: any }) => {
//       if (data.senderId === sessionData.user.id) return;

//       const { type, offer, answer } = data.signal;

//       switch (type) {
//         case 'iamstreamer':
//           setIsStreaming(true);
//           setStreamerId(data.senderId);
//           sendSignalMutation.mutate({ groupId, signal: { type: 'request', targetId: data.senderId } });
//           break;
//         case 'request':
//           if (localStreamRef.current && data.signal.targetId === sessionData.user.id) {
//             const peer = new Peer({ initiator: true, stream: localStreamRef.current, trickle: false });
//             peer.on('signal', (offerSignal) => sendSignalMutation.mutate({ groupId, signal: { type: 'offer', offer: offerSignal, targetId: data.senderId } }));
//             peerRef.current = peer;
//           }
//           break;
//         case 'offer':
//           if (data.signal.targetId === sessionData.user.id) {
//             const peer = new Peer({ initiator: false, trickle: false });
//             peer.on('signal', (answerSignal) => sendSignalMutation.mutate({ groupId, signal: { type: 'answer', answer: answerSignal, targetId: data.senderId } }));
//             peer.on('stream', (remoteStream) => {
//               if (peerVideoRef.current) peerVideoRef.current.srcObject = remoteStream;
//             });
//             peer.signal(offer);
//             peerRef.current = peer;
//           }
//           break;
//         case 'answer':
//           peerRef.current?.signal(answer);
//           break;
//         case 'streamend':
//           setIsStreaming(false);
//           setStreamerId(null);
//           if (peerVideoRef.current) peerVideoRef.current.srcObject = null;
//           peerRef.current?.destroy();
//           break;
//       }
//     };

//     channel.bind('webrtc-signal', onSignal);
    
//     // This cleanup runs ONCE, when the page is closed. It PREVENTS the flicker/disconnect.
//     return () => {
//       channel.unbind('webrtc-signal', onSignal);
//       pusher.unsubscribe(`group-${groupId}`);
//       if (localStreamRef.current) {
//         stopStream();
//       }
//       peerRef.current?.destroy();
//     };
//     // This dependency array is STABLE and correct. It will not cause an infinite loop.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [groupId, sessionData?.user.id]);
  
//   // --- PERMISSIONS LOGIC ---
//   const currentUserMembership = group?.members.find(m => m.userId === sessionData?.user.id);
//   const canStream = !isStreaming && (currentUserMembership?.isAdmin || group?.createdById === sessionData?.user.id);
//   const amIStreamer = isStreaming && streamerId === sessionData?.user.id;

//   if (isEventLoading || isGroupLoading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;

//   return (
//     <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
//       <div className="container mt-12 flex flex-col items-center gap-8 px-4 py-8">
//         <h1 className="text-4xl font-bold">{event?.name}</h1>
//         <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl border-2 border-gray-800">
          
//           {/* Main video for viewers */}
//           <video ref={peerVideoRef} autoPlay playsInline muted className="h-full w-full object-contain" />
          
//           {/* --- UI IMPROVEMENTS --- */}
//           {!isStreaming && ( <div className="absolute inset-0 flex items-center justify-center"><p className="text-gray-500">Stream has not started yet.</p></div> )}
//           {amIStreamer && ( <div className="absolute inset-0 flex items-center justify-center"><p className="text-2xl font-bold text-gray-400">You are sharing your screen. Viewers can see this stream.</p></div> )}
          
//           {/* Preview for streamer */}
//           <div className="absolute bottom-4 right-4 h-1/4 w-1/4 rounded-lg border-2 border-gray-600 overflow-hidden bg-black">
//              <video ref={myVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
//              {amIStreamer && ( <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold opacity-0 hover:opacity-100 transition-opacity">YOUR PREVIEW</div> )}
//           </div>
//         </div>
//         <div className="flex items-center gap-4">
            
//             {/* --- PERMISSIONS CHECK --- */}
//             {canStream && ( 
//               <button onClick={() => void startStream()} className="rounded-full bg-green-600 px-8 py-4 text-xl font-bold transition hover:bg-green-700">
//                 Start Screen Share
//               </button> 
//             )}

//             {amIStreamer && ( 
//               <button onClick={stopStream} className="rounded-full bg-red-600 px-8 py-4 text-xl font-bold transition hover:bg-red-700">
//                 Stop Sharing
//               </button> 
//             )}

//             <Link href={`/groups/${groupId}`} className="rounded-full bg-white/10 px-8 py-4 font-semibold no-underline transition hover:bg-white/20">
//               Back to Group
//             </Link>
//         </div>
//       </div>
//     </main>
//   );
// }






















// <<<<----------------  preview in user working and receiver black ------------------->>>>>>






// "use client";

// import { useParams } from "next/navigation";
// import Link from "next/link";
// import { useSession } from "next-auth/react";
// import { api } from "~/trpc/react";
// import { useState, useRef, useEffect, useCallback } from "react";
// import Peer from "simple-peer";
// import Pusher from "pusher-js";

// export default function EventPage() {
//   const params = useParams();
//   const groupId = typeof params?.groupId === 'string' ? params.groupId : '';
//   const eventId = typeof params?.eventId === 'string' ? params.eventId : '';
  
//   const { data: sessionData } = useSession();
//   const { data: event, isLoading: isEventLoading } = api.event.getById.useQuery({ eventId }, { enabled: !!eventId });
  
//   // --- NEW: We also fetch the group data to check for admin roles ---
//   const { data: group, isLoading: isGroupLoading } = api.group.getById.useQuery({ id: groupId }, { enabled: !!groupId });

//   const [isStreaming, setIsStreaming] = useState(false);
//   const [streamerId, setStreamerId] = useState<string | null>(null);
  
//   const myVideoRef = useRef<HTMLVideoElement>(null);
//   const peerVideoRef = useRef<HTMLVideoElement>(null);
//   const peerRef = useRef<Peer.Instance | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);

//   const sendSignalMutation = api.webrtc.sendSignal.useMutation();

//   // --- useCallback ensures these functions are stable and don't cause re-renders ---
//   const startStream = useCallback(async () => {
//     try {
//       const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
//       if (myVideoRef.current) myVideoRef.current.srcObject = mediaStream;
//       localStreamRef.current = mediaStream;
//       setIsStreaming(true);
//       setStreamerId(sessionData!.user.id);
//       sendSignalMutation.mutate({ groupId, signal: { type: 'iamstreamer' } });
//     } catch (err) { console.error("Screen share failed", err); }
//   }, [groupId, sessionData, sendSignalMutation]);

//   const stopStream = useCallback(() => {
//       if (localStreamRef.current) {
//         // Stop the actual media tracks
//         localStreamRef.current.getTracks().forEach(track => track.stop());
//         localStreamRef.current = null;
        
//         // Clear the video elements
//         if (myVideoRef.current) myVideoRef.current.srcObject = null;
//         if (peerVideoRef.current) peerVideoRef.current.srcObject = null;

//         // --- THIS IS THE FIX ---
//         // Update the local state to force a UI re-render
//         setIsStreaming(false);
//         setStreamerId(null);
        
//         // Announce to other users that the stream has ended
//         sendSignalMutation.mutate({ groupId, signal: { type: 'streamend' } });
//       }
//     }, [groupId, sendSignalMutation]);

//   // --- THIS IS THE FINAL, STABLE useEffect ---
//   useEffect(() => {
//     if (!groupId || !sessionData?.user.id) return;

//     const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
//     const channel = pusher.subscribe(`group-${groupId}`);

//     const onSignal = (data: { senderId: string, signal: any }) => {
//       if (data.senderId === sessionData.user.id) return;

//       const { type, offer, answer } = data.signal;

//       switch (type) {
//         case 'iamstreamer':
//           setIsStreaming(true);
//           setStreamerId(data.senderId);
//           sendSignalMutation.mutate({ groupId, signal: { type: 'request', targetId: data.senderId } });
//           break;
//         case 'request':
//           if (localStreamRef.current && data.signal.targetId === sessionData.user.id) {
//             const peer = new Peer({ initiator: true, stream: localStreamRef.current, trickle: false });
//             peer.on('signal', (offerSignal) => sendSignalMutation.mutate({ groupId, signal: { type: 'offer', offer: offerSignal, targetId: data.senderId } }));
//             peerRef.current = peer;
//           }
//           break;
//         case 'offer':
//           if (data.signal.targetId === sessionData.user.id) {
//             const peer = new Peer({ initiator: false, trickle: false });
//             peer.on('signal', (answerSignal) => sendSignalMutation.mutate({ groupId, signal: { type: 'answer', answer: answerSignal, targetId: data.senderId } }));
//             peer.on('stream', (remoteStream) => {
//               if (peerVideoRef.current) peerVideoRef.current.srcObject = remoteStream;
//             });
//             peer.signal(offer);
//             peerRef.current = peer;
//           }
//           break;
//         case 'answer':
//           peerRef.current?.signal(answer);
//           break;
//         case 'streamend':
//           setIsStreaming(false);
//           setStreamerId(null);
//           if (peerVideoRef.current) peerVideoRef.current.srcObject = null;
//           peerRef.current?.destroy();
//           break;
//       }
//     };

//     channel.bind('webrtc-signal', onSignal);
    
//     // This cleanup runs ONCE, when the page is closed. It PREVENTS the flicker/disconnect.
//     return () => {
//       channel.unbind('webrtc-signal', onSignal);
//       pusher.unsubscribe(`group-${groupId}`);
//       if (localStreamRef.current) {
//         stopStream();
//       }
//       peerRef.current?.destroy();
//     };
//     // This dependency array is STABLE and correct. It will not cause an infinite loop.
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [groupId, sessionData?.user.id]);
  
//   // --- PERMISSIONS LOGIC ---
//   const currentUserMembership = group?.members.find(m => m.userId === sessionData?.user.id);
//   const canStream = !isStreaming && (currentUserMembership?.isAdmin || group?.createdById === sessionData?.user.id);
//   const amIStreamer = isStreaming && streamerId === sessionData?.user.id;

//   if (isEventLoading || isGroupLoading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;

//   return (
//     <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
//       <div className="container mt-12 flex flex-col items-center gap-8 px-4 py-8">
//         <h1 className="text-4xl font-bold">{event?.name}</h1>
//         <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl border-2 border-gray-800">
          
//           {/* Main video for viewers */}
//           <video ref={peerVideoRef} autoPlay playsInline muted className="h-full w-full object-contain" />
          
//           {/* --- UI IMPROVEMENTS --- */}
//           {!isStreaming && ( <div className="absolute inset-0 flex items-center justify-center"><p className="text-gray-500">Stream has not started yet.</p></div> )}
//           {amIStreamer && ( <div className="absolute inset-0 flex items-center justify-center"><p className="text-2xl font-bold text-gray-400">You are sharing your screen. Viewers can see this stream.</p></div> )}
          
//           {/* Preview for streamer */}
//           <div className="absolute bottom-4 right-4 h-1/4 w-1/4 rounded-lg border-2 border-gray-600 overflow-hidden bg-black">
//              <video ref={myVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
//              {amIStreamer && ( <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold opacity-0 hover:opacity-100 transition-opacity">YOUR PREVIEW</div> )}
//           </div>
//         </div>
//         <div className="flex items-center gap-4">
            
//             {/* --- PERMISSIONS CHECK --- */}
//             {canStream && ( 
//               <button onClick={() => void startStream()} className="rounded-full bg-green-600 px-8 py-4 text-xl font-bold transition hover:bg-green-700">
//                 Start Screen Share
//               </button> 
//             )}

//             {amIStreamer && ( 
//               <button onClick={stopStream} className="rounded-full bg-red-600 px-8 py-4 text-xl font-bold transition hover:bg-red-700">
//                 Stop Sharing
//               </button> 
//             )}

//             <Link href={`/groups/${groupId}`} className="rounded-full bg-white/10 px-8 py-4 font-semibold no-underline transition hover:bg-white/20">
//               Back to Group
//             </Link>
//         </div>
//       </div>
//     </main>
//   );
// }











// <<<<----------------  no preview in user and receiver ------------------->>>>>>





// "use client";

// import { useParams } from "next/navigation";
// import Link from "next/link";
// import { useSession } from "next-auth/react";
// import { api } from "~/trpc/react";
// import { useState, useRef, useEffect, useCallback } from "react";
// import Peer from "simple-peer";
// import Pusher from "pusher-js";

// export default function EventPage() {
//   const params = useParams();
//   const groupId = typeof params?.groupId === "string" ? params.groupId : "";
//   const eventId = typeof params?.eventId === "string" ? params.eventId : "";

//   const { data: sessionData } = useSession();
//   const { data: event, isLoading: isEventLoading } = api.event.getById.useQuery(
//     { eventId },
//     { enabled: !!eventId }
//   );
//   const { data: group, isLoading: isGroupLoading } = api.group.getById.useQuery(
//     { id: groupId },
//     { enabled: !!groupId }
//   );

//   const [isStreaming, setIsStreaming] = useState(false);
//   const [streamerId, setStreamerId] = useState<string | null>(null);

//   const myVideoRef = useRef<HTMLVideoElement>(null);
//   const peerVideoRef = useRef<HTMLVideoElement>(null);
//   const peerRef = useRef<Peer.Instance | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);

//   const sendSignalMutation = api.webrtc.sendSignal.useMutation();

//   // Start streaming (for streamer)
//   const startStream = useCallback(async () => {
//     try {
//       const mediaStream = await navigator.mediaDevices.getDisplayMedia({
//         video: true,
//         audio: true,
//       });
//       if (myVideoRef.current) myVideoRef.current.srcObject = mediaStream;
//       localStreamRef.current = mediaStream;
//       setIsStreaming(true);
//       setStreamerId(sessionData!.user.id);
//       sendSignalMutation.mutate({ groupId, signal: { type: "iamstreamer" } });
//     } catch (err) {
//       console.error("Screen share failed", err);
//     }
//   }, [groupId, sessionData, sendSignalMutation]);

//   // Stop streaming (for streamer)
//   const stopStream = useCallback(() => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach((track) => track.stop());
//       localStreamRef.current = null;

//       if (myVideoRef.current) myVideoRef.current.srcObject = null;
//       if (peerVideoRef.current) peerVideoRef.current.srcObject = null;

//       setIsStreaming(false);
//       setStreamerId(null);
//       sendSignalMutation.mutate({ groupId, signal: { type: "streamend" } });
//     }
//   }, [groupId, sendSignalMutation]);

//   // --- WebRTC + Pusher setup ---
//   useEffect(() => {
//     if (!groupId || !sessionData?.user.id) return;

//     const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
//       cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
//     });
//     const channel = pusher.subscribe(`group-${groupId}`);

//     const onSignal = (data: { senderId: string; signal: any }) => {
//       if (data.senderId === sessionData.user.id) return;
//       const { type, offer, answer } = data.signal;

//       switch (type) {
//         case "iamstreamer":
//           setIsStreaming(true);
//           setStreamerId(data.senderId);
//           sendSignalMutation.mutate({
//             groupId,
//             signal: { type: "request", targetId: data.senderId },
//           });
//           break;

//         case "request":
//           if (
//             localStreamRef.current &&
//             data.signal.targetId === sessionData.user.id
//           ) {
//             const peer = new Peer({
//               initiator: true,
//               stream: localStreamRef.current,
//               trickle: false,
//             });
//             peer.on("signal", (offerSignal) =>
//               sendSignalMutation.mutate({
//                 groupId,
//                 signal: {
//                   type: "offer",
//                   offer: offerSignal,
//                   targetId: data.senderId,
//                 },
//               })
//             );
//             peerRef.current = peer;
//           }
//           break;

//         case "offer":
//           if (data.signal.targetId === sessionData.user.id) {
//             const peer = new Peer({ initiator: false, trickle: false });
//             peer.on("signal", (answerSignal) =>
//               sendSignalMutation.mutate({
//                 groupId,
//                 signal: {
//                   type: "answer",
//                   answer: answerSignal,
//                   targetId: data.senderId,
//                 },
//               })
//             );
//             peer.on("stream", (remoteStream) => {
//               if (peerVideoRef.current)
//                 peerVideoRef.current.srcObject = remoteStream;
//             });
//             peer.signal(offer);
//             peerRef.current = peer;
//           }
//           break;

//         case "answer":
//           peerRef.current?.signal(answer);
//           break;

//         case "streamend":
//           setIsStreaming(false);
//           setStreamerId(null);
//           if (peerVideoRef.current) peerVideoRef.current.srcObject = null;
//           peerRef.current?.destroy();
//           break;

//         case "join-event":
//           if (
//             localStreamRef.current &&
//             streamerId === sessionData.user.id
//           ) {
//             sendSignalMutation.mutate({
//               groupId,
//               signal: { type: "request", targetId: data.senderId },
//             });
//           }
//           break;
//       }
//     };

//     channel.bind("webrtc-signal", onSignal);

//     // viewer asks who’s streaming
//     sendSignalMutation.mutate({
//       groupId,
//       signal: { type: "join-event" },
//     });

//     return () => {
//       channel.unbind("webrtc-signal", onSignal);
//       pusher.unsubscribe(`group-${groupId}`);
//       peerRef.current?.destroy();
//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach((t) => t.stop());
//         localStreamRef.current = null;
//       }
//     };

//     // ✅ Stable dependencies (no infinite loop)
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [groupId, sessionData?.user.id]);

//   const currentUserMembership = group?.members.find(
//     (m) => m.userId === sessionData?.user.id
//   );
//   const amIStreamer = isStreaming && streamerId === sessionData?.user.id;
//   const canStream =
//     !isStreaming &&
//     (currentUserMembership?.isAdmin ||
//       group?.createdById === sessionData?.user.id);

//   if (isEventLoading || isGroupLoading)
//     return (
//       <div className="flex h-screen items-center justify-center text-white">
//         Loading...
//       </div>
//     );

//   return (
//     <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
//       <div className="container mt-12 flex flex-col items-center gap-8 px-4 py-8">
//         <h1 className="text-4xl font-bold">{event?.name}</h1>

//         <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl border-2 border-gray-800 overflow-hidden">
//           {!amIStreamer ? (
//             <>
//               <video
//                 ref={peerVideoRef}
//                 autoPlay
//                 playsInline
//                 className="h-full w-full object-contain"
//               />
//               {!isStreaming && (
//                 <div className="absolute inset-0 flex items-center justify-center">
//                   <p className="text-gray-500 text-lg">
//                     Stream has not started yet.
//                   </p>
//                 </div>
//               )}
//             </>
//           ) : (
//             <>
//               <video
//                 ref={myVideoRef}
//                 autoPlay
//                 playsInline
//                 muted
//                 className="h-full w-full object-contain"
//               />
//               <div className="absolute inset-0 flex items-center justify-center">
//                 <p className="text-2xl font-bold text-gray-400">
//                   You are sharing your screen. Viewers can see this stream.
//                 </p>
//               </div>
//             </>
//           )}
//         </div>

//         <div className="flex items-center gap-4">
//           {canStream && (
//             <button
//               onClick={() => void startStream()}
//               className="rounded-full bg-green-600 px-8 py-4 text-xl font-bold transition hover:bg-green-700"
//             >
//               Start Screen Share
//             </button>
//           )}

//           {amIStreamer && (
//             <button
//               onClick={stopStream}
//               className="rounded-full bg-red-600 px-8 py-4 text-xl font-bold transition hover:bg-red-700"
//             >
//               Stop Sharing
//             </button>
//           )}

//           <Link
//             href={`/groups/${groupId}`}
//             className="rounded-full bg-white/10 px-8 py-4 font-semibold no-underline transition hover:bg-white/20"
//           >
//             Back to Group
//           </Link>
//         </div>
//       </div>
//     </main>
//   );
// }














// <<<<----------------  preview in user black not in receiver ------------------->>>>>>



// "use client";

// import { useParams } from "next/navigation";
// import Link from "next/link";
// import { useSession } from "next-auth/react";
// import { api } from "~/trpc/react";
// import { useState, useRef, useEffect, useCallback } from "react";
// import Peer from "simple-peer";
// import Pusher from "pusher-js";

// export default function EventPage() {
//   const params = useParams();
//   const groupId = typeof params?.groupId === "string" ? params.groupId : "";
//   const eventId = typeof params?.eventId === "string" ? params.eventId : "";

//   const { data: sessionData } = useSession();
//   const { data: event, isLoading: isEventLoading } = api.event.getById.useQuery(
//     { eventId },
//     { enabled: !!eventId }
//   );
//   const { data: group, isLoading: isGroupLoading } = api.group.getById.useQuery(
//     { id: groupId },
//     { enabled: !!groupId }
//   );

//   const [isStreaming, setIsStreaming] = useState(false);
//   const [streamerId, setStreamerId] = useState<string | null>(null);

//   const myVideoRef = useRef<HTMLVideoElement>(null);
//   const peerVideoRef = useRef<HTMLVideoElement>(null);
//   const peerRef = useRef<Peer.Instance | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);

//   const sendSignalMutation = api.webrtc.sendSignal.useMutation();

//   // Start streaming (for streamer)
//   const startStream = useCallback(async () => {
//     try {
//       const mediaStream = await navigator.mediaDevices.getDisplayMedia({
//         video: true,
//         audio: true,
//       });
//       if (myVideoRef.current) myVideoRef.current.srcObject = mediaStream;
//       localStreamRef.current = mediaStream;
//       setIsStreaming(true);
//       setStreamerId(sessionData!.user.id);
//       sendSignalMutation.mutate({ groupId, signal: { type: "iamstreamer" } });
//     } catch (err) {
//       console.error("Screen share failed", err);
//     }
//   }, [groupId, sessionData, sendSignalMutation]);

//   // Stop streaming (for streamer)
//   const stopStream = useCallback(() => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach((track) => track.stop());
//       localStreamRef.current = null;

//       if (myVideoRef.current) myVideoRef.current.srcObject = null;
//       if (peerVideoRef.current) peerVideoRef.current.srcObject = null;

//       setIsStreaming(false);
//       setStreamerId(null);
//       sendSignalMutation.mutate({ groupId, signal: { type: "streamend" } });
//     }
//   }, [groupId, sendSignalMutation]);

//   // --- WebRTC + Pusher setup ---
//   useEffect(() => {
//     if (!groupId || !sessionData?.user.id) return;

//     const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
//       cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
//     });
//     const channel = pusher.subscribe(`group-${groupId}`);

//     const onSignal = (data: { senderId: string; signal: any }) => {
//       if (data.senderId === sessionData.user.id) return;
//       const { type, offer, answer } = data.signal;

//       switch (type) {
//         case "iamstreamer":
//           setIsStreaming(true);
//           setStreamerId(data.senderId);
//           sendSignalMutation.mutate({
//             groupId,
//             signal: { type: "request", targetId: data.senderId },
//           });
//           break;

//         case "request":
//           if (
//             localStreamRef.current &&
//             data.signal.targetId === sessionData.user.id
//           ) {
//             const peer = new Peer({
//               initiator: true,
//               stream: localStreamRef.current,
//               trickle: false,
//             });
//             peer.on("signal", (offerSignal) =>
//               sendSignalMutation.mutate({
//                 groupId,
//                 signal: {
//                   type: "offer",
//                   offer: offerSignal,
//                   targetId: data.senderId,
//                 },
//               })
//             );
//             peerRef.current = peer;
//           }
//           break;

//         case "offer":
//           if (data.signal.targetId === sessionData.user.id) {
//             const peer = new Peer({ initiator: false, trickle: false });
//             peer.on("signal", (answerSignal) =>
//               sendSignalMutation.mutate({
//                 groupId,
//                 signal: {
//                   type: "answer",
//                   answer: answerSignal,
//                   targetId: data.senderId,
//                 },
//               })
//             );
//             peer.on("stream", (remoteStream) => {
//               if (peerVideoRef.current)
//                 peerVideoRef.current.srcObject = remoteStream;
//             });
//             peer.signal(offer);
//             peerRef.current = peer;
//           }
//           break;

//         case "answer":
//           peerRef.current?.signal(answer);
//           break;

//         case "streamend":
//           setIsStreaming(false);
//           setStreamerId(null);
//           if (peerVideoRef.current) peerVideoRef.current.srcObject = null;
//           peerRef.current?.destroy();
//           break;

//         case "join-event":
//           if (
//             localStreamRef.current &&
//             streamerId === sessionData.user.id
//           ) {
//             sendSignalMutation.mutate({
//               groupId,
//               signal: { type: "request", targetId: data.senderId },
//             });
//           }
//           break;
//       }
//     };

//     channel.bind("webrtc-signal", onSignal);

//     // viewer asks who's streaming
//     sendSignalMutation.mutate({
//       groupId,
//       signal: { type: "join-event" },
//     });

//     return () => {
//       channel.unbind("webrtc-signal", onSignal);
//       pusher.unsubscribe(`group-${groupId}`);
//       peerRef.current?.destroy();
//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach((t) => t.stop());
//         localStreamRef.current = null;
//       }
//     };

//     // ✅ Stable dependencies (no infinite loop)
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [groupId, sessionData?.user.id]);

//   const currentUserMembership = group?.members.find(
//     (m) => m.userId === sessionData?.user.id
//   );
//   const amIStreamer = isStreaming && streamerId === sessionData?.user.id;
//   const canStream =
//     !isStreaming &&
//     (currentUserMembership?.isAdmin ||
//       group?.createdById === sessionData?.user.id);

//   if (isEventLoading || isGroupLoading)
//     return (
//       <div className="flex h-screen items-center justify-center text-white">
//         Loading...
//       </div>
//     );

//   return (
//     <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
//       <div className="container mt-12 flex flex-col items-center gap-8 px-4 py-8">
//         <h1 className="text-4xl font-bold">{event?.name}</h1>

//         <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl border-2 border-gray-800 overflow-hidden">
//           {/* Main video for viewers - only show when someone else is streaming */}
//           {!amIStreamer && (
//             <>
//               <video
//                 ref={peerVideoRef}
//                 autoPlay
//                 playsInline
//                 className="h-full w-full object-contain"
//               />
//               {!isStreaming && (
//                 <div className="absolute inset-0 flex items-center justify-center">
//                   <p className="text-gray-500 text-lg">
//                     Stream has not started yet.
//                   </p>
//                 </div>
//               )}
//             </>
//           )}

//           {/* Streamer's view - show their own screen share */}
//           {amIStreamer && (
//             <>
//               <video
//                 ref={myVideoRef}
//                 autoPlay
//                 playsInline
//                 muted
//                 className="h-full w-full object-contain"
//               />
//               <div className="absolute inset-0 flex items-center justify-center">
//                 <p className="text-2xl font-bold text-gray-400">
//                   You are sharing your screen. Viewers can see this stream.
//                 </p>
//               </div>
//             </>
//           )}

//           {/* Preview box - ONLY show for the streamer */}
//           {amIStreamer && (
//             <div className="absolute bottom-4 right-4 h-1/4 w-1/4 rounded-lg border-2 border-gray-600 overflow-hidden bg-black">
//               <video
//                 ref={myVideoRef}
//                 autoPlay
//                 playsInline
//                 muted
//                 className="h-full w-full object-cover"
//               />
//               <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold opacity-0 hover:opacity-100 transition-opacity">
//                 YOUR PREVIEW
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="flex items-center gap-4">
//           {canStream && (
//             <button
//               onClick={() => void startStream()}
//               className="rounded-full bg-green-600 px-8 py-4 text-xl font-bold transition hover:bg-green-700"
//             >
//               Start Screen Share
//             </button>
//           )}

//           {amIStreamer && (
//             <button
//               onClick={stopStream}
//               className="rounded-full bg-red-600 px-8 py-4 text-xl font-bold transition hover:bg-red-700"
//             >
//               Stop Sharing
//             </button>
//           )}

//           <Link
//             href={`/groups/${groupId}`}
//             className="rounded-full bg-white/10 px-8 py-4 font-semibold no-underline transition hover:bg-white/20"
//           >
//             Back to Group
//           </Link>
//         </div>
//       </div>
//     </main>
//   );
// }


















// <<<<----------------  preview in user working and receiver has no preview 
// all as expected  ------------------->>>>>>






// "use client";

// import { useParams } from "next/navigation";
// import Link from "next/link";
// import { useSession } from "next-auth/react";
// import { api } from "~/trpc/react";
// import { useState, useRef, useEffect, useCallback } from "react";
// import Peer from "simple-peer";
// import Pusher from "pusher-js";

// export default function EventPage() {
//   const params = useParams();
//   const groupId = typeof params?.groupId === 'string' ? params.groupId : '';
//   const eventId = typeof params?.eventId === 'string' ? params.eventId : '';
  
//   const { data: sessionData } = useSession();
//   const { data: event, isLoading: isEventLoading } = api.event.getById.useQuery({ eventId }, { enabled: !!eventId });
//   const { data: group, isLoading: isGroupLoading } = api.group.getById.useQuery({ id: groupId }, { enabled: !!groupId });

//   const [isStreaming, setIsStreaming] = useState(false);
//   const [streamerId, setStreamerId] = useState<string | null>(null);
  
//   const myVideoRef = useRef<HTMLVideoElement>(null);
//   const peerVideoRef = useRef<HTMLVideoElement>(null);
//   const peerRef = useRef<Peer.Instance | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);

//   const sendSignalMutation = api.webrtc.sendSignal.useMutation();

//   const startStream = useCallback(async () => {
//     try {
//       const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
//       if (myVideoRef.current) myVideoRef.current.srcObject = mediaStream;
//       localStreamRef.current = mediaStream;
//       setIsStreaming(true);
//       setStreamerId(sessionData!.user.id);
//       sendSignalMutation.mutate({ groupId, signal: { type: 'iamstreamer' } });
//     } catch (err) { console.error("Screen share failed", err); }
//   }, [groupId, sessionData, sendSignalMutation]);

//   const stopStream = useCallback(() => {
//       if (localStreamRef.current) {
//         localStreamRef.current.getTracks().forEach(track => track.stop());
//         localStreamRef.current = null;
        
//         if (myVideoRef.current) myVideoRef.current.srcObject = null;
//         if (peerVideoRef.current) peerVideoRef.current.srcObject = null;

//         setIsStreaming(false);
//         setStreamerId(null);
//         sendSignalMutation.mutate({ groupId, signal: { type: 'streamend' } });
//       }
//     }, [groupId, sendSignalMutation]);

//   useEffect(() => {
//     if (!groupId || !sessionData?.user.id) return;

//     const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
//     const channel = pusher.subscribe(`group-${groupId}`);

//     const onSignal = (data: { senderId: string, signal: any }) => {
//       if (data.senderId === sessionData.user.id) return;

//       const { type, offer, answer } = data.signal;

//       switch (type) {
//         case 'iamstreamer':
//           setIsStreaming(true);
//           setStreamerId(data.senderId);
//           sendSignalMutation.mutate({ groupId, signal: { type: 'request', targetId: data.senderId } });
//           break;
//         case 'request':
//           if (localStreamRef.current && data.signal.targetId === sessionData.user.id) {
//             const peer = new Peer({ initiator: true, stream: localStreamRef.current, trickle: false });
//             peer.on('signal', (offerSignal) => sendSignalMutation.mutate({ groupId, signal: { type: 'offer', offer: offerSignal, targetId: data.senderId } }));
//             peerRef.current = peer;
//           }
//           break;
//         case 'offer':
//           if (data.signal.targetId === sessionData.user.id) {
//             const peer = new Peer({ initiator: false, trickle: false });
//             peer.on('signal', (answerSignal) => sendSignalMutation.mutate({ groupId, signal: { type: 'answer', answer: answerSignal, targetId: data.senderId } }));
//             peer.on('stream', (remoteStream) => {
//               if (peerVideoRef.current) peerVideoRef.current.srcObject = remoteStream;
//             });
//             peer.signal(offer);
//             peerRef.current = peer;
//           }
//           break;
//         case 'answer':
//           peerRef.current?.signal(answer);
//           break;
//         case 'streamend':
//           setIsStreaming(false);
//           setStreamerId(null);
//           if (peerVideoRef.current) peerVideoRef.current.srcObject = null;
//           peerRef.current?.destroy();
//           break;
//       }
//     };

//     channel.bind('webrtc-signal', onSignal);
    
//     return () => {
//       channel.unbind('webrtc-signal', onSignal);
//       pusher.unsubscribe(`group-${groupId}`);
//       if (localStreamRef.current) {
//         stopStream();
//       }
//       peerRef.current?.destroy();
//     };
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [groupId, sessionData?.user.id]);
  
//   const currentUserMembership = group?.members.find(m => m.userId === sessionData?.user.id);
//   const canStream = !isStreaming && (currentUserMembership?.isAdmin || group?.createdById === sessionData?.user.id);
//   const amIStreamer = isStreaming && streamerId === sessionData?.user.id;

//   if (isEventLoading || isGroupLoading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;

//   return (
//     <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
//       <div className="container mt-12 flex flex-col items-center gap-8 px-4 py-8">
//         <h1 className="text-4xl font-bold">{event?.name}</h1>
//         <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl border-2 border-gray-800">
          
//           {/* Main video for viewers */}
//           <video ref={peerVideoRef} autoPlay playsInline muted className="h-full w-full object-contain" />
          
//           {/* Status messages */}
//           {!isStreaming && ( 
//             <div className="absolute inset-0 flex items-center justify-center">
//               <p className="text-gray-500">Stream has not started yet.</p>
//             </div> 
//           )}
//           {amIStreamer && ( 
//             <div className="absolute inset-0 flex items-center justify-center">
//               <p className="text-2xl font-bold text-gray-400">You are sharing your screen. Viewers can see this stream.</p>
//             </div> 
//           )}
          
//           {/* Preview for streamer - ALWAYS IN DOM but visually hidden from viewers */}
//           <div className={`absolute bottom-4 right-4 h-1/4 w-1/4 rounded-lg border-2 overflow-hidden bg-black transition-all duration-300 ${
//             amIStreamer 
//               ? 'border-green-500 opacity-100' 
//               : 'border-gray-600 opacity-0 pointer-events-none'
//           }`}>
//             <video 
//               ref={myVideoRef} 
//               autoPlay 
//               playsInline 
//               muted 
//               className="h-full w-full object-cover" 
//             />
//             {amIStreamer && ( 
//               <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold opacity-0 hover:opacity-100 transition-opacity">
//                 YOUR PREVIEW
//               </div> 
//             )}
//           </div>
//         </div>
//         <div className="flex items-center gap-4">
//             {canStream && ( 
//               <button onClick={() => void startStream()} className="rounded-full bg-green-600 px-8 py-4 text-xl font-bold transition hover:bg-green-700">
//                 Start Screen Share
//               </button> 
//             )}

//             {amIStreamer && ( 
//               <button onClick={stopStream} className="rounded-full bg-red-600 px-8 py-4 text-xl font-bold transition hover:bg-red-700">
//                 Stop Sharing
//               </button> 
//             )}

//             <Link href={`/groups/${groupId}`} className="rounded-full bg-white/10 px-8 py-4 font-semibold no-underline transition hover:bg-white/20">
//               Back to Group
//             </Link>
//         </div>
//       </div>
//     </main>
//   );
// }

























// ----------------------------> all working andgood --------------------------->







// "use client";

// import { useParams } from "next/navigation";
// import Link from "next/link";
// import { useSession } from "next-auth/react";
// import { api } from "~/trpc/react";
// import { useState, useRef, useEffect, useCallback } from "react";
// import Peer from "simple-peer";
// import Pusher from "pusher-js";

// export default function EventPage() {
//   const params = useParams();
//   const groupId = typeof params?.groupId === 'string' ? params.groupId : '';
//   const eventId = typeof params?.eventId === 'string' ? params.eventId : '';
  
//   const { data: sessionData } = useSession();
//   const { data: event, isLoading: isEventLoading, refetch: refetchEvent } = api.event.getById.useQuery({ eventId }, { enabled: !!eventId });
//   const { data: group, isLoading: isGroupLoading } = api.group.getById.useQuery({ id: groupId }, { enabled: !!groupId });

//   const [isStreaming, setIsStreaming] = useState(false);
//   const [streamerId, setStreamerId] = useState<string | null>(null);
//   const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
//   const myVideoRef = useRef<HTMLVideoElement>(null);
//   const peerVideoRef = useRef<HTMLVideoElement>(null);
//   const peerRef = useRef<Peer.Instance | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const hasProcessedLateJoinRef = useRef(false);
//   const pusherRef = useRef<Pusher | null>(null);
//   const isInitializedRef = useRef(false);

//   const sendSignalMutation = api.webrtc.sendSignal.useMutation();
//   const setStreamerMutation = api.event.setStreamer.useMutation();
//   const clearStreamerMutation = api.event.clearStreamer.useMutation();

//   const startStream = useCallback(async () => {
//     try {
//       const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
//       if (myVideoRef.current) myVideoRef.current.srcObject = mediaStream;
//       localStreamRef.current = mediaStream;
//       setIsStreaming(true);
//       setStreamerId(sessionData!.user.id);
      
//       // Announce stream start to DB and other users
//       setStreamerMutation.mutate({ eventId });
//       sendSignalMutation.mutate({ groupId, signal: { type: 'iamstreamer' } });
      
//       console.log("Stream started successfully");
//     } catch (err) { 
//       console.error("Screen share failed", err); 
//     }
//   }, [groupId, sessionData, sendSignalMutation, eventId, setStreamerMutation]);

//   const stopStream = useCallback(() => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach(track => track.stop());
//       localStreamRef.current = null;
      
//       if (myVideoRef.current) myVideoRef.current.srcObject = null;
//       if (peerVideoRef.current) peerVideoRef.current.srcObject = null;

//       setIsStreaming(false);
//       setStreamerId(null);
//       setConnectionStatus('disconnected');
      
//       // Announce stream end to DB and other users
//       clearStreamerMutation.mutate({ eventId });
//       sendSignalMutation.mutate({ groupId, signal: { type: 'streamend' } });
      
//       console.log("Stream stopped");
//     }
//   }, [groupId, sendSignalMutation, eventId, clearStreamerMutation]);

//   // --- FIXED: useEffect for late joiners ---
//   useEffect(() => {
//     if (event?.streamerId && 
//         event.streamerId !== sessionData?.user.id && 
//         !isStreaming && 
//         !hasProcessedLateJoinRef.current) {
      
//       console.log("Late joiner detected. Streamer ID:", event.streamerId);
//       setIsStreaming(true);
//       setStreamerId(event.streamerId);
//       setConnectionStatus('connecting');
//       hasProcessedLateJoinRef.current = true;
      
//       // Send request to join the stream
//       sendSignalMutation.mutate({ 
//         groupId, 
//         signal: { 
//           type: 'request', 
//           targetId: event.streamerId
//         } 
//       });
//     }

//     if (!event?.streamerId && hasProcessedLateJoinRef.current) {
//       hasProcessedLateJoinRef.current = false;
//     }
//   }, [event, sessionData?.user.id, groupId, sendSignalMutation, isStreaming]);

//   // --- WebRTC + Pusher setup - SIMPLIFIED ---
//   useEffect(() => {
//     if (!groupId || !sessionData?.user.id) return;

//     // Only initialize once
//     if (!pusherRef.current) {
//       console.log("Initializing Pusher connection...");
//       const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { 
//         cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! 
//       });
//       pusherRef.current = pusher;
//     }

//     const channel = pusherRef.current.subscribe(`group-${groupId}`);

//     const onSignal = (data: { senderId: string, signal: any }) => {
//       if (data.senderId === sessionData.user.id) return;

//       const { type, offer, answer } = data.signal;
//       console.log("Received signal:", type, "from:", data.senderId);

//       switch (type) {
//         case 'iamstreamer':
//           // Someone started streaming - connect if we're not already
//           if (!isStreaming && data.senderId !== sessionData.user.id) {
//             console.log("Stream started by:", data.senderId);
//             setIsStreaming(true);
//             setStreamerId(data.senderId);
//             setConnectionStatus('connecting');
            
//             // Request to join the stream
//             sendSignalMutation.mutate({ 
//               groupId, 
//               signal: { 
//                 type: 'request', 
//                 targetId: data.senderId
//               } 
//             });
//           }
//           break;

//         case 'request':
//           // Someone wants to watch my stream
//           console.log("Received request from:", data.senderId, "localStream exists:", !!localStreamRef.current);
//           if (localStreamRef.current && data.signal.targetId === sessionData.user.id) {
//             console.log("Creating offer for:", data.senderId);
            
//             // Destroy existing peer if any
//             if (peerRef.current) {
//               console.log("Destroying existing peer connection");
//               peerRef.current.destroy();
//               peerRef.current = null;
//             }
            
//             const peer = new Peer({ 
//               initiator: true, 
//               stream: localStreamRef.current, 
//               trickle: false,
//               config: {
//                 iceServers: [
//                   { urls: 'stun:stun.l.google.com:19302' },
//                   { urls: 'stun:global.stun.twilio.com:3478' }
//                 ]
//               }
//             });
            
//             peer.on('signal', (offerSignal) => {
//               console.log("Sending offer to:", data.senderId);
//               sendSignalMutation.mutate({ 
//                 groupId, 
//                 signal: { 
//                   type: 'offer', 
//                   offer: offerSignal, 
//                   targetId: data.senderId 
//                 } 
//               });
//             });

//             peer.on('error', (err) => {
//               console.error('Peer error (streamer side):', err);
//             });

//             peer.on('connect', () => {
//               console.log("Streamer: Connected to viewer:", data.senderId);
//             });
            
//             peerRef.current = peer;
//           } else {
//             console.log("Cannot create offer - no local stream or wrong target");
//           }
//           break;

//         case 'offer':
//           // Streamer sent me an offer - I'm a viewer
//           if (data.signal.targetId === sessionData.user.id) {
//             console.log("Received offer from streamer");
//             setConnectionStatus('connecting');
            
//             // Destroy existing peer if any
//             if (peerRef.current) {
//               console.log("Destroying existing peer connection");
//               peerRef.current.destroy();
//               peerRef.current = null;
//             }
            
//             const peer = new Peer({ 
//               initiator: false, 
//               trickle: false,
//               config: {
//                 iceServers: [
//                   { urls: 'stun:stun.l.google.com:19302' },
//                   { urls: 'stun:global.stun.twilio.com:3478' }
//                 ]
//               }
//             });
            
//             peer.on('signal', (answerSignal) => {
//               console.log("Sending answer to streamer");
//               sendSignalMutation.mutate({ 
//                 groupId, 
//                 signal: { 
//                   type: 'answer', 
//                   answer: answerSignal, 
//                   targetId: data.senderId 
//                 } 
//               });
//             });
            
//             peer.on('stream', (remoteStream) => {
//               console.log("Received remote stream!", remoteStream);
//               setConnectionStatus('connected');
//               if (peerVideoRef.current) {
//                 peerVideoRef.current.srcObject = remoteStream;
//                 // Force play in case of autoplay restrictions
//                 peerVideoRef.current.play().catch(err => console.error("Play failed:", err));
//               }
//             });

//             peer.on('error', (err) => {
//               console.error('Peer connection error:', err);
//               setConnectionStatus('disconnected');
//             });

//             peer.on('connect', () => {
//               console.log("Viewer: Connected to streamer!");
//               setConnectionStatus('connected');
//             });
            
//             console.log("Signaling offer to peer");
//             peer.signal(offer);
//             peerRef.current = peer;
//           }
//           break;

//         case 'answer':
//           // Viewer answered my offer - I'm the streamer
//           if (peerRef.current && data.signal.targetId === sessionData.user.id) {
//             console.log("Received answer from viewer");
//             peerRef.current.signal(answer);
//           }
//           break;

//         case 'streamend':
//           console.log("Stream ended");
//           setIsStreaming(false);
//           setStreamerId(null);
//           setConnectionStatus('disconnected');
//           hasProcessedLateJoinRef.current = false;
//           if (peerVideoRef.current) {
//             peerVideoRef.current.srcObject = null;
//           }
//           if (peerRef.current) {
//             peerRef.current.destroy();
//             peerRef.current = null;
//           }
//           void refetchEvent();
//           break;
//       }
//     };

//     channel.bind('webrtc-signal', onSignal);

//     // Cleanup function - ONLY on unmount
//     return () => {
//       console.log("Cleaning up channel only");
//       channel.unbind('webrtc-signal', onSignal);
//       channel.unsubscribe();
//       // Don't destroy pusherRef.current - keep it for reconnects
//     };
//   }, [groupId, sessionData?.user.id, isStreaming, sendSignalMutation, refetchEvent]);

//   const currentUserMembership = group?.members.find(m => m.userId === sessionData?.user.id);
//   const canStream = !isStreaming && (currentUserMembership?.isAdmin || group?.createdById === sessionData?.user.id);
//   const amIStreamer = isStreaming && streamerId === sessionData?.user.id;
//   const amIViewer = isStreaming && streamerId !== sessionData?.user.id;

//   if (isEventLoading || isGroupLoading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;

//   return (
//     <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
//       <div className="container mt-12 flex flex-col items-center gap-8 px-4 py-8">
//         <h1 className="text-4xl font-bold">{event?.name}</h1>
        
//         {/* Connection Status */}
//         <div className="flex gap-4">
//           {amIViewer && (
//             <div className={`px-4 py-2 rounded-lg font-bold ${
//               connectionStatus === 'connected' ? 'bg-green-600' :
//               connectionStatus === 'connecting' ? 'bg-yellow-600' : 'bg-gray-600'
//             }`}>
//               {connectionStatus === 'connected' ? '✅ Connected' :
//                connectionStatus === 'connecting' ? '🔄 Connecting...' : '❌ Disconnected'}
//             </div>
//           )}
//         </div>

//         <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl border-2 border-gray-800">
          
//           {/* Main video for viewers */}
//           <video 
//             ref={peerVideoRef} 
//             autoPlay 
//             playsInline 
//             className="h-full w-full object-contain" 
//           />
          
//           {/* Status messages */}
//           {!isStreaming && ( 
//             <div className="absolute inset-0 flex items-center justify-center">
//               <p className="text-gray-500">Stream has not started yet.</p>
//             </div> 
//           )}
          
//           {amIViewer && connectionStatus === 'connecting' && (
//             <div className="absolute inset-0 flex items-center justify-center bg-black/80">
//               <p className="text-white text-xl">Connecting to stream...</p>
//             </div>
//           )}

//           {amIStreamer && ( 
//             <div className="absolute top-4 left-4 bg-green-600 px-3 py-1 rounded-lg text-sm font-bold">
//               🔴 LIVE - You are streaming
//             </div> 
//           )}
          
//           {/* Preview for streamer */}
//           <div className={`absolute bottom-4 right-4 h-1/4 w-1/4 rounded-lg border-2 overflow-hidden bg-black transition-all duration-300 ${
//             amIStreamer 
//               ? 'border-green-500 opacity-100' 
//               : 'border-gray-600 opacity-0 pointer-events-none'
//           }`}>
//             <video 
//               ref={myVideoRef} 
//               autoPlay 
//               playsInline 
//               muted 
//               className="h-full w-full object-cover" 
//             />
//             {amIStreamer && ( 
//               <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold opacity-0 hover:opacity-100 transition-opacity">
//                 YOUR PREVIEW
//               </div> 
//             )}
//           </div>
//         </div>
//         <div className="flex items-center gap-4">
//             {canStream && ( 
//               <button onClick={() => void startStream()} className="rounded-full bg-green-600 px-8 py-4 text-xl font-bold transition hover:bg-green-700">
//                 Start Screen Share
//               </button> 
//             )}

//             {amIStreamer && ( 
//               <button onClick={stopStream} className="rounded-full bg-red-600 px-8 py-4 text-xl font-bold transition hover:bg-red-700">
//                 Stop Sharing
//               </button> 
//             )}

//             <Link href={`/groups/${groupId}`} className="rounded-full bg-white/10 px-8 py-4 font-semibold no-underline transition hover:bg-white/20">
//               Back to Group
//             </Link>
//         </div>
//       </div>
//     </main>
//   );
// }







// --------------------------> button fix ---------------------------->








// "use client";

// import { useParams } from "next/navigation";
// import Link from "next/link";
// import { useSession } from "next-auth/react";
// import { api } from "~/trpc/react";
// import { useState, useRef, useEffect, useCallback } from "react";
// import Peer from "simple-peer";
// import Pusher from "pusher-js";

// export default function EventPage() {
//   const params = useParams();
//   const groupId = typeof params?.groupId === 'string' ? params.groupId : '';
//   const eventId = typeof params?.eventId === 'string' ? params.eventId : '';
  
//   const { data: sessionData } = useSession();
//   const { data: event, isLoading: isEventLoading, refetch: refetchEvent } = api.event.getById.useQuery({ eventId }, { enabled: !!eventId });
//   const { data: group, isLoading: isGroupLoading } = api.group.getById.useQuery({ id: groupId }, { enabled: !!groupId });

//   const [isStreaming, setIsStreaming] = useState(false);
//   const [streamerId, setStreamerId] = useState<string | null>(null);
//   const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
//   const myVideoRef = useRef<HTMLVideoElement>(null);
//   const peerVideoRef = useRef<HTMLVideoElement>(null);
//   const peerRef = useRef<Peer.Instance | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const hasProcessedLateJoinRef = useRef(false);
//   const pusherRef = useRef<Pusher | null>(null);

//   const sendSignalMutation = api.webrtc.sendSignal.useMutation();
//   const setStreamerMutation = api.event.setStreamer.useMutation();
//   const clearStreamerMutation = api.event.clearStreamer.useMutation();

//   // Define stopStream FIRST to avoid circular dependency
//   const stopStream = useCallback(() => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach(track => {
//         track.stop();
//         // Remove the event listeners we added
//         track.removeEventListener('ended', handleTrackEnded);
//       });
//       localStreamRef.current = null;
      
//       if (myVideoRef.current) myVideoRef.current.srcObject = null;
//       if (peerVideoRef.current) peerVideoRef.current.srcObject = null;

//       setIsStreaming(false);
//       setStreamerId(null);
//       setConnectionStatus('disconnected');
      
//       // Announce stream end to DB and other users
//       clearStreamerMutation.mutate({ eventId });
//       sendSignalMutation.mutate({ groupId, signal: { type: 'streamend' } });
      
//       console.log("Stream stopped");
//     }
//   }, [groupId, sendSignalMutation, eventId, clearStreamerMutation]);

//   // Handler for track ended events
//   const handleTrackEnded = useCallback(() => {
//     console.log("Track ended - browser stopped sharing");
//     stopStream();
//   }, [stopStream]);

//   const startStream = useCallback(async () => {
//     try {
//       const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
//       if (myVideoRef.current) myVideoRef.current.srcObject = mediaStream;
//       localStreamRef.current = mediaStream;
//       setIsStreaming(true);
//       setStreamerId(sessionData!.user.id);
      
//       // --- FIX: Add track ended listeners to detect browser stop ---
//       mediaStream.getTracks().forEach(track => {
//         track.addEventListener('ended', handleTrackEnded);
//       });
      
//       // Announce stream start to DB and other users
//       setStreamerMutation.mutate({ eventId });
//       sendSignalMutation.mutate({ groupId, signal: { type: 'iamstreamer' } });
      
//       console.log("Stream started successfully");
//     } catch (err) { 
//       console.error("Screen share failed", err); 
//     }
//   }, [groupId, sessionData, sendSignalMutation, eventId, setStreamerMutation, handleTrackEnded]);

//   // --- FIX: useEffect to handle browser stop sharing ---
//   useEffect(() => {
//     // This effect runs when the component mounts and cleans up when it unmounts
//     // It doesn't depend on any state to avoid unnecessary re-renders
    
//     const handleBeforeUnload = () => {
//       // If user closes tab/window while streaming, stop the stream
//       if (localStreamRef.current) {
//         stopStream();
//       }
//     };

//     // Listen for page unload
//     window.addEventListener('beforeunload', handleBeforeUnload);

//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//     };
//   }, [stopStream]);

//   // --- FIXED: useEffect for late joiners ---
//   useEffect(() => {
//     if (event?.streamerId && 
//         event.streamerId !== sessionData?.user.id && 
//         !isStreaming && 
//         !hasProcessedLateJoinRef.current) {
      
//       console.log("Late joiner detected. Streamer ID:", event.streamerId);
//       setIsStreaming(true);
//       setStreamerId(event.streamerId);
//       setConnectionStatus('connecting');
//       hasProcessedLateJoinRef.current = true;
      
//       // Send request to join the stream
//       sendSignalMutation.mutate({ 
//         groupId, 
//         signal: { 
//           type: 'request', 
//           targetId: event.streamerId
//         } 
//       });
//     }

//     if (!event?.streamerId && hasProcessedLateJoinRef.current) {
//       hasProcessedLateJoinRef.current = false;
//     }
//   }, [event, sessionData?.user.id, groupId, sendSignalMutation, isStreaming]);

//   // --- WebRTC + Pusher setup ---
//   useEffect(() => {
//     if (!groupId || !sessionData?.user.id) return;

//     // Only initialize once
//     if (!pusherRef.current) {
//       console.log("Initializing Pusher connection...");
//       const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { 
//         cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! 
//       });
//       pusherRef.current = pusher;
//     }

//     const channel = pusherRef.current.subscribe(`group-${groupId}`);

//     const onSignal = (data: { senderId: string, signal: any }) => {
//       if (data.senderId === sessionData.user.id) return;

//       const { type, offer, answer } = data.signal;
//       console.log("Received signal:", type, "from:", data.senderId);

//       switch (type) {
//         case 'iamstreamer':
//           // Someone started streaming - connect if we're not already
//           if (!isStreaming && data.senderId !== sessionData.user.id) {
//             console.log("Stream started by:", data.senderId);
//             setIsStreaming(true);
//             setStreamerId(data.senderId);
//             setConnectionStatus('connecting');
            
//             // Request to join the stream
//             sendSignalMutation.mutate({ 
//               groupId, 
//               signal: { 
//                 type: 'request', 
//                 targetId: data.senderId
//               } 
//             });
//           }
//           break;

//         case 'request':
//           // Someone wants to watch my stream
//           console.log("Received request from:", data.senderId, "localStream exists:", !!localStreamRef.current);
//           if (localStreamRef.current && data.signal.targetId === sessionData.user.id) {
//             console.log("Creating offer for:", data.senderId);
            
//             // Destroy existing peer if any
//             if (peerRef.current) {
//               console.log("Destroying existing peer connection");
//               peerRef.current.destroy();
//               peerRef.current = null;
//             }
            
//             const peer = new Peer({ 
//               initiator: true, 
//               stream: localStreamRef.current, 
//               trickle: false,
//               config: {
//                 iceServers: [
//                   { urls: 'stun:stun.l.google.com:19302' },
//                   { urls: 'stun:global.stun.twilio.com:3478' }
//                 ]
//               }
//             });
            
//             peer.on('signal', (offerSignal) => {
//               console.log("Sending offer to:", data.senderId);
//               sendSignalMutation.mutate({ 
//                 groupId, 
//                 signal: { 
//                   type: 'offer', 
//                   offer: offerSignal, 
//                   targetId: data.senderId 
//                 } 
//               });
//             });

//             peer.on('error', (err) => {
//               console.error('Peer error (streamer side):', err);
//             });

//             peer.on('connect', () => {
//               console.log("Streamer: Connected to viewer:", data.senderId);
//             });
            
//             peerRef.current = peer;
//           } else {
//             console.log("Cannot create offer - no local stream or wrong target");
//           }
//           break;

//         case 'offer':
//           // Streamer sent me an offer - I'm a viewer
//           if (data.signal.targetId === sessionData.user.id) {
//             console.log("Received offer from streamer");
//             setConnectionStatus('connecting');
            
//             // Destroy existing peer if any
//             if (peerRef.current) {
//               console.log("Destroying existing peer connection");
//               peerRef.current.destroy();
//               peerRef.current = null;
//             }
            
//             const peer = new Peer({ 
//               initiator: false, 
//               trickle: false,
//               config: {
//                 iceServers: [
//                   { urls: 'stun:stun.l.google.com:19302' },
//                   { urls: 'stun:global.stun.twilio.com:3478' }
//                 ]
//               }
//             });
            
//             peer.on('signal', (answerSignal) => {
//               console.log("Sending answer to streamer");
//               sendSignalMutation.mutate({ 
//                 groupId, 
//                 signal: { 
//                   type: 'answer', 
//                   answer: answerSignal, 
//                   targetId: data.senderId 
//                 } 
//               });
//             });
            
//             peer.on('stream', (remoteStream) => {
//               console.log("Received remote stream!", remoteStream);
//               setConnectionStatus('connected');
//               if (peerVideoRef.current) {
//                 peerVideoRef.current.srcObject = remoteStream;
//                 // Force play in case of autoplay restrictions
//                 peerVideoRef.current.play().catch(err => console.error("Play failed:", err));
//               }
//             });

//             peer.on('error', (err) => {
//               console.error('Peer connection error:', err);
//               setConnectionStatus('disconnected');
//             });

//             peer.on('connect', () => {
//               console.log("Viewer: Connected to streamer!");
//               setConnectionStatus('connected');
//             });
            
//             console.log("Signaling offer to peer");
//             peer.signal(offer);
//             peerRef.current = peer;
//           }
//           break;

//         case 'answer':
//           // Viewer answered my offer - I'm the streamer
//           if (peerRef.current && data.signal.targetId === sessionData.user.id) {
//             console.log("Received answer from viewer");
//             peerRef.current.signal(answer);
//           }
//           break;

//         case 'streamend':
//           console.log("Stream ended");
//           setIsStreaming(false);
//           setStreamerId(null);
//           setConnectionStatus('disconnected');
//           hasProcessedLateJoinRef.current = false;
//           if (peerVideoRef.current) {
//             peerVideoRef.current.srcObject = null;
//           }
//           if (peerRef.current) {
//             peerRef.current.destroy();
//             peerRef.current = null;
//           }
//           void refetchEvent();
//           break;
//       }
//     };

//     channel.bind('webrtc-signal', onSignal);

//     // Cleanup function - ONLY on unmount
//     return () => {
//       console.log("Cleaning up channel only");
//       channel.unbind('webrtc-signal', onSignal);
//       channel.unsubscribe();
//       // Don't destroy pusherRef.current - keep it for reconnects
//     };
//   }, [groupId, sessionData?.user.id, isStreaming, sendSignalMutation, refetchEvent]);

//   const currentUserMembership = group?.members.find(m => m.userId === sessionData?.user.id);
//   const canStream = !isStreaming && (currentUserMembership?.isAdmin || group?.createdById === sessionData?.user.id);
//   const amIStreamer = isStreaming && streamerId === sessionData?.user.id;
//   const amIViewer = isStreaming && streamerId !== sessionData?.user.id;

//   if (isEventLoading || isGroupLoading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;

//   return (
//     <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
//       <div className="container mt-12 flex flex-col items-center gap-8 px-4 py-8">
//         <h1 className="text-4xl font-bold">{event?.name}</h1>
        
//         {/* Connection Status */}
//         <div className="flex gap-4">
//           {amIViewer && (
//             <div className={`px-4 py-2 rounded-lg font-bold ${
//               connectionStatus === 'connected' ? 'bg-green-600' :
//               connectionStatus === 'connecting' ? 'bg-yellow-600' : 'bg-gray-600'
//             }`}>
//               {connectionStatus === 'connected' ? '✅ Connected' :
//                connectionStatus === 'connecting' ? '🔄 Connecting...' : '❌ Disconnected'}
//             </div>
//           )}
//         </div>

//         <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl border-2 border-gray-800">
          
//           {/* Main video for viewers */}
//           <video 
//             ref={peerVideoRef} 
//             autoPlay 
//             playsInline 
//             className="h-full w-full object-contain" 
//           />
          
//           {/* Status messages */}
//           {!isStreaming && ( 
//             <div className="absolute inset-0 flex items-center justify-center">
//               <p className="text-gray-500">Stream has not started yet.</p>
//             </div> 
//           )}
          
//           {amIViewer && connectionStatus === 'connecting' && (
//             <div className="absolute inset-0 flex items-center justify-center bg-black/80">
//               <p className="text-white text-xl">Connecting to stream...</p>
//             </div>
//           )}

//           {amIStreamer && ( 
//             <div className="absolute top-4 left-4 bg-green-600 px-3 py-1 rounded-lg text-sm font-bold">
//               🔴 LIVE - You are streaming
//             </div> 
//           )}
          
//           {/* Preview for streamer */}
//           <div className={`absolute bottom-4 right-4 h-1/4 w-1/4 rounded-lg border-2 overflow-hidden bg-black transition-all duration-300 ${
//             amIStreamer 
//               ? 'border-green-500 opacity-100' 
//               : 'border-gray-600 opacity-0 pointer-events-none'
//           }`}>
//             <video 
//               ref={myVideoRef} 
//               autoPlay 
//               playsInline 
//               muted 
//               className="h-full w-full object-cover" 
//             />
//             {amIStreamer && ( 
//               <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold opacity-0 hover:opacity-100 transition-opacity">
//                 YOUR PREVIEW
//               </div> 
//             )}
//           </div>
//         </div>
//         <div className="flex items-center gap-4">
//             {canStream && ( 
//               <button onClick={() => void startStream()} className="rounded-full bg-green-600 px-8 py-4 text-xl font-bold transition hover:bg-green-700">
//                 Start Screen Share
//               </button> 
//             )}

//             {amIStreamer && ( 
//               <button onClick={stopStream} className="rounded-full bg-red-600 px-8 py-4 text-xl font-bold transition hover:bg-red-700">
//                 Stop Sharing
//               </button> 
//             )}

//             <Link href={`/groups/${groupId}`} className="rounded-full bg-white/10 px-8 py-4 font-semibold no-underline transition hover:bg-white/20">
//               Back to Group
//             </Link>
//         </div>
//       </div>
//     </main>
//   );
// }

















// ----------------------> fixed like real one ------------------------>






// "use client";

// import { useParams } from "next/navigation";
// import Link from "next/link";
// import { useSession } from "next-auth/react";
// import { api } from "~/trpc/react";
// import { useState, useRef, useEffect, useCallback } from "react";
// import Peer from "simple-peer";
// import Pusher from "pusher-js";

// export default function EventPage() {
//   const params = useParams();
//   const groupId = typeof params?.groupId === 'string' ? params.groupId : '';
//   const eventId = typeof params?.eventId === 'string' ? params.eventId : '';
  
//   const { data: sessionData } = useSession();
//   const { data: event, isLoading: isEventLoading, refetch: refetchEvent } = api.event.getById.useQuery({ eventId }, { enabled: !!eventId });
//   const { data: group, isLoading: isGroupLoading } = api.group.getById.useQuery({ id: groupId }, { enabled: !!groupId });

//   const [isStreaming, setIsStreaming] = useState(false);
//   const [streamerId, setStreamerId] = useState<string | null>(null);
//   const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
//   const myVideoRef = useRef<HTMLVideoElement>(null);
//   const peerVideoRef = useRef<HTMLVideoElement>(null);
//   const peerRef = useRef<Peer.Instance | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const hasProcessedLateJoinRef = useRef(false);
//   const pusherRef = useRef<Pusher | null>(null);
//   const channelRef = useRef<any>(null);

//   const sendSignalMutation = api.webrtc.sendSignal.useMutation();
//   const setStreamerMutation = api.event.setStreamer.useMutation();
//   const clearStreamerMutation = api.event.clearStreamer.useMutation();

//   // Define stopStream FIRST to avoid circular dependency
//   const stopStream = useCallback(() => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach(track => {
//         track.stop();
//         track.removeEventListener('ended', handleTrackEnded);
//       });
//       localStreamRef.current = null;
      
//       if (myVideoRef.current) myVideoRef.current.srcObject = null;
//       if (peerVideoRef.current) peerVideoRef.current.srcObject = null;

//       setIsStreaming(false);
//       setStreamerId(null);
//       setConnectionStatus('disconnected');
      
//       // Announce stream end to DB and other users
//       clearStreamerMutation.mutate({ eventId });
//       sendSignalMutation.mutate({ groupId, signal: { type: 'streamend' } });
      
//       console.log("Stream stopped");
//     }
//   }, [groupId, sendSignalMutation, eventId, clearStreamerMutation]);

//   // Handler for track ended events
//   const handleTrackEnded = useCallback(() => {
//     console.log("Track ended - browser stopped sharing");
//     stopStream();
//   }, [stopStream]);

//   const startStream = useCallback(async () => {
//     try {
//       const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
//       if (myVideoRef.current) myVideoRef.current.srcObject = mediaStream;
//       localStreamRef.current = mediaStream;
//       setIsStreaming(true);
//       setStreamerId(sessionData!.user.id);
      
//       mediaStream.getTracks().forEach(track => {
//         track.addEventListener('ended', handleTrackEnded);
//       });
      
//       setStreamerMutation.mutate({ eventId });
//       sendSignalMutation.mutate({ groupId, signal: { type: 'iamstreamer' } });
      
//       console.log("Stream started successfully");
//     } catch (err) { 
//       console.error("Screen share failed", err); 
//     }
//   }, [groupId, sessionData, sendSignalMutation, eventId, setStreamerMutation, handleTrackEnded]);

//   // Handle page unload
//   useEffect(() => {
//     const handleBeforeUnload = () => {
//       if (localStreamRef.current) {
//         stopStream();
//       }
//     };

//     window.addEventListener('beforeunload', handleBeforeUnload);

//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//     };
//   }, [stopStream]);

//   // --- SINGLE PUSHER INITIALIZATION ---
//   useEffect(() => {
//     if (!groupId || !sessionData?.user.id) return;

//     // Initialize Pusher only once
//     if (!pusherRef.current) {
//       console.log("🚀 Initializing Pusher connection...");
//       const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { 
//         cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! 
//       });
//       pusherRef.current = pusher;

//       // Subscribe to channel
//       const channel = pusher.subscribe(`group-${groupId}`);
//       channelRef.current = channel;

//       const onSignal = (data: { senderId: string, signal: any }) => {
//         if (data.senderId === sessionData.user.id) return;

//         const { type, offer, answer } = data.signal;
//         console.log("📡 Received signal:", type, "from:", data.senderId);

//         switch (type) {
//           case 'iamstreamer':
//             if (!isStreaming && data.senderId !== sessionData.user.id) {
//               console.log("🎬 Stream started by:", data.senderId);
//               setIsStreaming(true);
//               setStreamerId(data.senderId);
//               setConnectionStatus('connecting');
              
//               sendSignalMutation.mutate({ 
//                 groupId, 
//                 signal: { 
//                   type: 'request', 
//                   targetId: data.senderId
//                 } 
//               });
//             }
//             break;

//           case 'request':
//             console.log("🤝 Received request from:", data.senderId, "localStream exists:", !!localStreamRef.current);
//             if (localStreamRef.current && data.signal.targetId === sessionData.user.id) {
//               console.log("📤 Creating offer for:", data.senderId);
              
//               if (peerRef.current) {
//                 peerRef.current.destroy();
//                 peerRef.current = null;
//               }
              
//               const peer = new Peer({ 
//                 initiator: true, 
//                 stream: localStreamRef.current, 
//                 trickle: false,
//                 config: {
//                   iceServers: [
//                     { urls: 'stun:stun.l.google.com:19302' },
//                     { urls: 'stun:global.stun.twilio.com:3478' }
//                   ]
//                 }
//               });
              
//               peer.on('signal', (offerSignal) => {
//                 console.log("📨 Sending offer to:", data.senderId);
//                 sendSignalMutation.mutate({ 
//                   groupId, 
//                   signal: { 
//                     type: 'offer', 
//                     offer: offerSignal, 
//                     targetId: data.senderId 
//                   } 
//                 });
//               });

//               peer.on('error', (err) => {
//                 console.error('❌ Peer error (streamer side):', err);
//               });

//               peer.on('connect', () => {
//                 console.log("✅ Streamer: Connected to viewer:", data.senderId);
//               });
              
//               peerRef.current = peer;
//             }
//             break;

//           case 'offer':
//             if (data.signal.targetId === sessionData.user.id) {
//               console.log("📥 Received offer from streamer");
//               setConnectionStatus('connecting');
              
//               if (peerRef.current) {
//                 peerRef.current.destroy();
//                 peerRef.current = null;
//               }
              
//               const peer = new Peer({ 
//                 initiator: false, 
//                 trickle: false,
//                 config: {
//                   iceServers: [
//                     { urls: 'stun:stun.l.google.com:19302' },
//                     { urls: 'stun:global.stun.twilio.com:3478' }
//                   ]
//                 }
//               });
              
//               peer.on('signal', (answerSignal) => {
//                 console.log("📨 Sending answer to streamer");
//                 sendSignalMutation.mutate({ 
//                   groupId, 
//                   signal: { 
//                     type: 'answer', 
//                     answer: answerSignal, 
//                     targetId: data.senderId 
//                   } 
//                 });
//               });
              
//               peer.on('stream', (remoteStream) => {
//                 console.log("🎥 Received remote stream!");
//                 setConnectionStatus('connected');
//                 if (peerVideoRef.current) {
//                   peerVideoRef.current.srcObject = remoteStream;
//                   peerVideoRef.current.play().catch(err => console.error("Play failed:", err));
//                 }
//               });

//               peer.on('error', (err) => {
//                 console.error('❌ Peer connection error:', err);
//                 setConnectionStatus('disconnected');
//               });

//               peer.on('connect', () => {
//                 console.log("✅ Viewer: Connected to streamer!");
//                 setConnectionStatus('connected');
//               });
              
//               console.log("🔗 Signaling offer to peer");
//               peer.signal(offer);
//               peerRef.current = peer;
//             }
//             break;

//           case 'answer':
//             if (peerRef.current && data.signal.targetId === sessionData.user.id) {
//               console.log("📥 Received answer from viewer");
//               peerRef.current.signal(answer);
//             }
//             break;

//           case 'streamend':
//             console.log("🛑 Stream ended signal received");
//             if (data.senderId === streamerId) {
//               setIsStreaming(false);
//               setStreamerId(null);
//               setConnectionStatus('disconnected');
//               hasProcessedLateJoinRef.current = false;
              
//               if (peerVideoRef.current) {
//                 peerVideoRef.current.srcObject = null;
//               }
//               if (peerRef.current) {
//                 peerRef.current.destroy();
//                 peerRef.current = null;
//               }
              
//               console.log("👀 Viewer: Stream ended, resetting state");
//             }
//             break;
//         }
//       };

//       channel.bind('webrtc-signal', onSignal);
//     }

//     // Cleanup only on component unmount (not during Fast Refresh)
//     return () => {
//       console.log("🧹 Component unmounting - cleaning up Pusher");
//       if (pusherRef.current && channelRef.current) {
//         channelRef.current.unbind('webrtc-signal');
//         channelRef.current.unsubscribe();
//         pusherRef.current.disconnect();
//         pusherRef.current = null;
//         channelRef.current = null;
//       }
//     };
//   }, [groupId, sessionData?.user.id]); // Minimal dependencies

//   // --- STREAM STATE MANAGEMENT ---
//   useEffect(() => {
//     // Reset viewer state when streamer stops
//     if (!event?.streamerId && isStreaming && streamerId && streamerId !== sessionData?.user.id) {
//       console.log("🔄 Streamer stopped - resetting viewer state");
//       setIsStreaming(false);
//       setStreamerId(null);
//       setConnectionStatus('disconnected');
//       hasProcessedLateJoinRef.current = false;
      
//       if (peerVideoRef.current) {
//         peerVideoRef.current.srcObject = null;
//       }
//       if (peerRef.current) {
//         peerRef.current.destroy();
//         peerRef.current = null;
//       }
//     }

//     // Handle new streams or restarted streams
//     if (event?.streamerId && 
//         event.streamerId !== sessionData?.user.id && 
//         !isStreaming && 
//         !hasProcessedLateJoinRef.current) {
      
//       console.log("🎯 Stream available. Streamer ID:", event.streamerId);
//       setIsStreaming(true);
//       setStreamerId(event.streamerId);
//       setConnectionStatus('connecting');
//       hasProcessedLateJoinRef.current = true;
      
//       sendSignalMutation.mutate({ 
//         groupId, 
//         signal: { 
//           type: 'request', 
//           targetId: event.streamerId
//         } 
//       });
//     }

//     if (!event?.streamerId && hasProcessedLateJoinRef.current) {
//       hasProcessedLateJoinRef.current = false;
//     }
//   }, [event, sessionData?.user.id, groupId, sendSignalMutation, isStreaming, streamerId]);

//   const currentUserMembership = group?.members.find(m => m.userId === sessionData?.user.id);
//   const canStream = !isStreaming && (currentUserMembership?.isAdmin || group?.createdById === sessionData?.user.id);
//   const amIStreamer = isStreaming && streamerId === sessionData?.user.id;
//   const amIViewer = isStreaming && streamerId !== sessionData?.user.id;

//   if (isEventLoading || isGroupLoading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;

//   return (
//     <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
//       <div className="container mt-12 flex flex-col items-center gap-8 px-4 py-8">
//         <h1 className="text-4xl font-bold">{event?.name}</h1>
        
//         {/* Connection Status */}
//         <div className="flex gap-4">
//           {amIViewer && (
//             <div className={`px-4 py-2 rounded-lg font-bold ${
//               connectionStatus === 'connected' ? 'bg-green-600' :
//               connectionStatus === 'connecting' ? 'bg-yellow-600' : 'bg-gray-600'
//             }`}>
//               {connectionStatus === 'connected' ? '✅ Connected' :
//                connectionStatus === 'connecting' ? '🔄 Connecting...' : '❌ Disconnected'}
//             </div>
//           )}
//         </div>

//         <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl border-2 border-gray-800">
          
//           {/* Main video for viewers */}
//           <video 
//             ref={peerVideoRef} 
//             autoPlay 
//             playsInline 
//             className="h-full w-full object-contain" 
//           />
          
//           {/* Status messages */}
//           {!isStreaming && ( 
//             <div className="absolute inset-0 flex items-center justify-center">
//               <p className="text-gray-500">Stream has not started yet.</p>
//             </div> 
//           )}
          
//           {amIViewer && connectionStatus === 'connecting' && (
//             <div className="absolute inset-0 flex items-center justify-center bg-black/80">
//               <p className="text-white text-xl">Connecting to stream...</p>
//             </div>
//           )}

//           {amIStreamer && ( 
//             <div className="absolute top-4 left-4 bg-green-600 px-3 py-1 rounded-lg text-sm font-bold">
//               🔴 LIVE - You are streaming
//             </div> 
//           )}
          
//           {/* Preview for streamer */}
//           <div className={`absolute bottom-4 right-4 h-1/4 w-1/4 rounded-lg border-2 overflow-hidden bg-black transition-all duration-300 ${
//             amIStreamer 
//               ? 'border-green-500 opacity-100' 
//               : 'border-gray-600 opacity-0 pointer-events-none'
//           }`}>
//             <video 
//               ref={myVideoRef} 
//               autoPlay 
//               playsInline 
//               muted 
//               className="h-full w-full object-cover" 
//             />
//             {amIStreamer && ( 
//               <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold opacity-0 hover:opacity-100 transition-opacity">
//                 YOUR PREVIEW
//               </div> 
//             )}
//           </div>
//         </div>
//         <div className="flex items-center gap-4">
//             {canStream && ( 
//               <button onClick={() => void startStream()} className="rounded-full bg-green-600 px-8 py-4 text-xl font-bold transition hover:bg-green-700">
//                 Start Screen Share
//               </button> 
//             )}

//             {amIStreamer && ( 
//               <button onClick={stopStream} className="rounded-full bg-red-600 px-8 py-4 text-xl font-bold transition hover:bg-red-700">
//                 Stop Sharing
//               </button> 
//             )}

//             <Link href={`/groups/${groupId}`} className="rounded-full bg-white/10 px-8 py-4 font-semibold no-underline transition hover:bg-white/20">
//               Back to Group
//             </Link>
//         </div>
//       </div>
//     </main>
//   );
// }













// -----------------------> almost real like flow ----------------------->





// "use client";

// import { useParams } from "next/navigation";
// import Link from "next/link";
// import { useSession } from "next-auth/react";
// import { api } from "~/trpc/react";
// import { useState, useRef, useEffect, useCallback } from "react";
// import Peer from "simple-peer";
// import Pusher from "pusher-js";

// export default function EventPage() {
//   const params = useParams();
//   const groupId = typeof params?.groupId === 'string' ? params.groupId : '';
//   const eventId = typeof params?.eventId === 'string' ? params.eventId : '';
  
//   const { data: sessionData } = useSession();
//   const { data: event, isLoading: isEventLoading, refetch: refetchEvent } = api.event.getById.useQuery({ eventId }, { enabled: !!eventId });
//   const { data: group, isLoading: isGroupLoading } = api.group.getById.useQuery({ id: groupId }, { enabled: !!groupId });

//   const [isStreaming, setIsStreaming] = useState(false);
//   const [streamerId, setStreamerId] = useState<string | null>(null);
//   const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
//   const myVideoRef = useRef<HTMLVideoElement>(null);
//   const peerVideoRef = useRef<HTMLVideoElement>(null);
//   const peerRef = useRef<Peer.Instance | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const hasProcessedLateJoinRef = useRef(false);
//   const pusherRef = useRef<Pusher | null>(null);
//   const channelRef = useRef<any>(null);

//   const sendSignalMutation = api.webrtc.sendSignal.useMutation();
//   const setStreamerMutation = api.event.setStreamer.useMutation();
//   const clearStreamerMutation = api.event.clearStreamer.useMutation();

//   // Define stopStream FIRST to avoid circular dependency
//   const stopStream = useCallback(() => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach(track => {
//         track.stop();
//         track.removeEventListener('ended', handleTrackEnded);
//       });
//       localStreamRef.current = null;
      
//       if (myVideoRef.current) {
//         myVideoRef.current.srcObject = null;
//         myVideoRef.current.load(); // FIX: Add load() to properly reset
//       }
//       if (peerVideoRef.current) {
//         peerVideoRef.current.srcObject = null;
//         peerVideoRef.current.load(); // FIX: Add load() to properly reset
//       }

//       setIsStreaming(false);
//       setStreamerId(null);
//       setConnectionStatus('disconnected');
      
//       // Announce stream end to DB and other users
//       clearStreamerMutation.mutate({ eventId });
//       sendSignalMutation.mutate({ groupId, signal: { type: 'streamend' } });
      
//       console.log("Stream stopped");
//     }
//   }, [groupId, sendSignalMutation, eventId, clearStreamerMutation]);

//   // Handler for track ended events
//   const handleTrackEnded = useCallback(() => {
//     console.log("Track ended - browser stopped sharing");
//     stopStream();
//   }, [stopStream]);

//   const startStream = useCallback(async () => {
//     try {
//       const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
//       if (myVideoRef.current) myVideoRef.current.srcObject = mediaStream;
//       localStreamRef.current = mediaStream;
//       setIsStreaming(true);
//       setStreamerId(sessionData!.user.id);
      
//       mediaStream.getTracks().forEach(track => {
//         track.addEventListener('ended', handleTrackEnded);
//       });
      
//       setStreamerMutation.mutate({ eventId });
//       sendSignalMutation.mutate({ groupId, signal: { type: 'iamstreamer' } });
      
//       console.log("Stream started successfully");
//     } catch (err) { 
//       console.error("Screen share failed", err); 
//     }
//   }, [groupId, sessionData, sendSignalMutation, eventId, setStreamerMutation, handleTrackEnded]);

//   // Handle page unload
//   useEffect(() => {
//     const handleBeforeUnload = () => {
//       if (localStreamRef.current) {
//         stopStream();
//       }
//     };

//     window.addEventListener('beforeunload', handleBeforeUnload);

//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//     };
//   }, [stopStream]);

//   // --- SINGLE PUSHER INITIALIZATION ---
//   useEffect(() => {
//     if (!groupId || !sessionData?.user.id) return;

//     // Initialize Pusher only once
//     if (!pusherRef.current) {
//       console.log("🚀 Initializing Pusher connection...");
//       const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { 
//         cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! 
//       });
//       pusherRef.current = pusher;

//       // Subscribe to channel
//       const channel = pusher.subscribe(`group-${groupId}`);
//       channelRef.current = channel;

//       const onSignal = (data: { senderId: string, signal: any }) => {
//         if (data.senderId === sessionData.user.id) return;

//         const { type, offer, answer } = data.signal;
//         console.log("📡 Received signal:", type, "from:", data.senderId);

//         switch (type) {
//           case 'iamstreamer':
//             // FIX: Reset hasProcessedLateJoinRef when new stream starts
//             if (data.senderId !== sessionData.user.id) {
//               console.log("🎬 Stream started by:", data.senderId);
//               setIsStreaming(true);
//               setStreamerId(data.senderId);
//               setConnectionStatus('connecting');
//               hasProcessedLateJoinRef.current = true; // FIX: Set to true immediately
              
//               sendSignalMutation.mutate({ 
//                 groupId, 
//                 signal: { 
//                   type: 'request', 
//                   targetId: data.senderId
//                 } 
//               });
//             }
//             break;

//           case 'request':
//             console.log("🤝 Received request from:", data.senderId, "localStream exists:", !!localStreamRef.current);
//             if (localStreamRef.current && data.signal.targetId === sessionData.user.id) {
//               console.log("📤 Creating offer for:", data.senderId);
              
//               if (peerRef.current) {
//                 peerRef.current.destroy();
//                 peerRef.current = null;
//               }
              
//               const peer = new Peer({ 
//                 initiator: true, 
//                 stream: localStreamRef.current, 
//                 trickle: false,
//                 config: {
//                   iceServers: [
//                     { urls: 'stun:stun.l.google.com:19302' },
//                     { urls: 'stun:global.stun.twilio.com:3478' }
//                   ]
//                 }
//               });
              
//               peer.on('signal', (offerSignal) => {
//                 console.log("📨 Sending offer to:", data.senderId);
//                 sendSignalMutation.mutate({ 
//                   groupId, 
//                   signal: { 
//                     type: 'offer', 
//                     offer: offerSignal, 
//                     targetId: data.senderId 
//                   } 
//                 });
//               });

//               peer.on('error', (err) => {
//                 console.error('❌ Peer error (streamer side):', err);
//               });

//               peer.on('connect', () => {
//                 console.log("✅ Streamer: Connected to viewer:", data.senderId);
//               });
              
//               peerRef.current = peer;
//             }
//             break;

//           case 'offer':
//             if (data.signal.targetId === sessionData.user.id) {
//               console.log("📥 Received offer from streamer");
//               setConnectionStatus('connecting');
              
//               if (peerRef.current) {
//                 peerRef.current.destroy();
//                 peerRef.current = null;
//               }
              
//               const peer = new Peer({ 
//                 initiator: false, 
//                 trickle: false,
//                 config: {
//                   iceServers: [
//                     { urls: 'stun:stun.l.google.com:19302' },
//                     { urls: 'stun:global.stun.twilio.com:3478' }
//                   ]
//                 }
//               });
              
//               peer.on('signal', (answerSignal) => {
//                 console.log("📨 Sending answer to streamer");
//                 sendSignalMutation.mutate({ 
//                   groupId, 
//                   signal: { 
//                     type: 'answer', 
//                     answer: answerSignal, 
//                     targetId: data.senderId 
//                   } 
//                 });
//               });
              
//               peer.on('stream', (remoteStream) => {
//                 console.log("🎥 Received remote stream!");
//                 setConnectionStatus('connected');
//                 if (peerVideoRef.current) {
//                   peerVideoRef.current.srcObject = remoteStream;
//                   peerVideoRef.current.play().catch(err => {
//                     // FIX: Ignore AbortError which is common during reconnections
//                     if (err.name !== 'AbortError') {
//                       console.error("Play failed:", err);
//                     }
//                   });
//                 }
//               });

//               peer.on('error', (err) => {
//                 console.error('❌ Peer connection error:', err);
//                 setConnectionStatus('disconnected');
//               });

//               peer.on('connect', () => {
//                 console.log("✅ Viewer: Connected to streamer!");
//                 setConnectionStatus('connected');
//               });
              
//               console.log("🔗 Signaling offer to peer");
//               peer.signal(offer);
//               peerRef.current = peer;
//             }
//             break;

//           case 'answer':
//             if (peerRef.current && data.signal.targetId === sessionData.user.id) {
//               console.log("📥 Received answer from viewer");
//               peerRef.current.signal(answer);
//             }
//             break;

//           case 'streamend':
//             console.log("🛑 Stream ended signal received");
//             if (data.senderId === streamerId) {
//               setIsStreaming(false);
//               setStreamerId(null);
//               setConnectionStatus('disconnected');
//               hasProcessedLateJoinRef.current = false;
              
//               // FIX: Add load() to properly clear video element
//               if (peerVideoRef.current) {
//                 peerVideoRef.current.srcObject = null;
//                 peerVideoRef.current.load(); // This ensures "Stream has not started yet" shows
//               }
              
//               if (peerRef.current) {
//                 peerRef.current.destroy();
//                 peerRef.current = null;
//               }
              
//               console.log("👀 Viewer: Stream ended, resetting state");
//             }
//             break;
//         }
//       };

//       channel.bind('webrtc-signal', onSignal);
//     }

//     // Cleanup only on component unmount (not during Fast Refresh)
//     return () => {
//       console.log("🧹 Component unmounting - cleaning up Pusher");
//       if (pusherRef.current && channelRef.current) {
//         channelRef.current.unbind('webrtc-signal');
//         channelRef.current.unsubscribe();
//         pusherRef.current.disconnect();
//         pusherRef.current = null;
//         channelRef.current = null;
//       }
//     };
//   }, [groupId, sessionData?.user.id, isStreaming, streamerId, sendSignalMutation]); // FIX: Added missing dependencies

//   // --- STREAM STATE MANAGEMENT ---
//   useEffect(() => {
//     // Reset viewer state when streamer stops
//     if (!event?.streamerId && isStreaming && streamerId && streamerId !== sessionData?.user.id) {
//       console.log("🔄 Streamer stopped - resetting viewer state");
//       setIsStreaming(false);
//       setStreamerId(null);
//       setConnectionStatus('disconnected');
//       hasProcessedLateJoinRef.current = false;
      
//       // FIX: Add load() to properly clear video element
//       if (peerVideoRef.current) {
//         peerVideoRef.current.srcObject = null;
//         peerVideoRef.current.load(); // This ensures "Stream has not started yet" shows
//       }
      
//       if (peerRef.current) {
//         peerRef.current.destroy();
//         peerRef.current = null;
//       }
//     }

//     // Handle new streams or restarted streams
//     if (event?.streamerId && 
//         event.streamerId !== sessionData?.user.id && 
//         !isStreaming && 
//         !hasProcessedLateJoinRef.current) {
      
//       console.log("🎯 Stream available. Streamer ID:", event.streamerId);
//       setIsStreaming(true);
//       setStreamerId(event.streamerId);
//       setConnectionStatus('connecting');
//       hasProcessedLateJoinRef.current = true;
      
//       sendSignalMutation.mutate({ 
//         groupId, 
//         signal: { 
//           type: 'request', 
//           targetId: event.streamerId
//         } 
//       });
//     }

//     if (!event?.streamerId && hasProcessedLateJoinRef.current) {
//       hasProcessedLateJoinRef.current = false;
//     }
//   }, [event, sessionData?.user.id, groupId, sendSignalMutation, isStreaming, streamerId]);

//   const currentUserMembership = group?.members.find(m => m.userId === sessionData?.user.id);
//   const canStream = !isStreaming && (currentUserMembership?.isAdmin || group?.createdById === sessionData?.user.id);
//   const amIStreamer = isStreaming && streamerId === sessionData?.user.id;
//   const amIViewer = isStreaming && streamerId !== sessionData?.user.id;

//   if (isEventLoading || isGroupLoading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;

//   return (
//     <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
//       <div className="container mt-12 flex flex-col items-center gap-8 px-4 py-8">
//         <h1 className="text-4xl font-bold">{event?.name}</h1>
        
//         {/* Connection Status */}
//         <div className="flex gap-4">
//           {amIViewer && (
//             <div className={`px-4 py-2 rounded-lg font-bold ${
//               connectionStatus === 'connected' ? 'bg-green-600' :
//               connectionStatus === 'connecting' ? 'bg-yellow-600' : 'bg-gray-600'
//             }`}>
//               {connectionStatus === 'connected' ? '✅ Connected' :
//                connectionStatus === 'connecting' ? '🔄 Connecting...' : '❌ Disconnected'}
//             </div>
//           )}
//         </div>

//         <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl border-2 border-gray-800">
          
//           {/* Main video for viewers */}
//           <video 
//             ref={peerVideoRef} 
//             autoPlay 
//             playsInline 
//             className="h-full w-full object-contain" 
//           />
          
//           {/* Status messages */}
//           {!isStreaming && ( 
//             <div className="absolute inset-0 flex items-center justify-center">
//               <p className="text-gray-500">Stream has not started yet.</p>
//             </div> 
//           )}
          
//           {amIViewer && connectionStatus === 'connecting' && (
//             <div className="absolute inset-0 flex items-center justify-center bg-black/80">
//               <p className="text-white text-xl">Connecting to stream...</p>
//             </div>
//           )}

//           {amIStreamer && ( 
//             <div className="absolute top-4 left-4 bg-green-600 px-3 py-1 rounded-lg text-sm font-bold">
//               🔴 LIVE - You are streaming
//             </div> 
//           )}
          
//           {/* Preview for streamer */}
//           <div className={`absolute bottom-4 right-4 h-1/4 w-1/4 rounded-lg border-2 overflow-hidden bg-black transition-all duration-300 ${
//             amIStreamer 
//               ? 'border-green-500 opacity-100' 
//               : 'border-gray-600 opacity-0 pointer-events-none'
//           }`}>
//             <video 
//               ref={myVideoRef} 
//               autoPlay 
//               playsInline 
//               muted 
//               className="h-full w-full object-cover" 
//             />
//             {amIStreamer && ( 
//               <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold opacity-0 hover:opacity-100 transition-opacity">
//                 YOUR PREVIEW
//               </div> 
//             )}
//           </div>
//         </div>
//         <div className="flex items-center gap-4">
//             {canStream && ( 
//               <button onClick={() => void startStream()} className="rounded-full bg-green-600 px-8 py-4 text-xl font-bold transition hover:bg-green-700">
//                 Start Screen Share
//               </button> 
//             )}

//             {amIStreamer && ( 
//               <button onClick={stopStream} className="rounded-full bg-red-600 px-8 py-4 text-xl font-bold transition hover:bg-red-700">
//                 Stop Sharing
//               </button> 
//             )}

//             <Link href={`/groups/${groupId}`} className="rounded-full bg-white/10 px-8 py-4 font-semibold no-underline transition hover:bg-white/20">
//               Back to Group
//             </Link>
//         </div>
//       </div>
//     </main>
//   );
// }


















// -------------------> for deployment type error fix -----------------------?





"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { useState, useRef, useEffect, useCallback } from "react";
import Peer from "simple-peer";
import Pusher from "pusher-js";

// Define proper types for WebRTC signals
interface WebRTCSignal {
  type: string;
  offer?: unknown;
  answer?: unknown;
  targetId?: string;
}

interface PusherSignalData {
  senderId: string;
  signal: WebRTCSignal;
}

export default function EventPage() {
  const params = useParams();
  const groupId = params?.groupId ? String(params.groupId) : '';
  const eventId = params?.eventId ? String(params.eventId) : '';
  
  const { data: sessionData } = useSession();
  const { data: event, isLoading: isEventLoading } = api.event.getById.useQuery({ eventId }, { enabled: !!eventId });
  const { data: group, isLoading: isGroupLoading } = api.group.getById.useQuery({ id: groupId }, { enabled: !!groupId });

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamerId, setStreamerId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const peerVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const hasProcessedLateJoinRef = useRef(false);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Pusher.Channel | null>(null);

  const sendSignalMutation = api.webrtc.sendSignal.useMutation();
  const setStreamerMutation = api.event.setStreamer.useMutation();
  const clearStreamerMutation = api.event.clearStreamer.useMutation();

  // Handler for track ended events
  const handleTrackEnded = useCallback(() => {
    console.log("Track ended - browser stopped sharing");
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        track.removeEventListener('ended', handleTrackEnded);
      });
      localStreamRef.current = null;
      
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = null;
        myVideoRef.current.load();
      }
      if (peerVideoRef.current) {
        peerVideoRef.current.srcObject = null;
        peerVideoRef.current.load();
      }

      setIsStreaming(false);
      setStreamerId(null);
      setConnectionStatus('disconnected');
      
      clearStreamerMutation.mutate({ eventId });
      sendSignalMutation.mutate({ groupId, signal: { type: 'streamend' } });
      
      console.log("Stream stopped");
    }
  }, [groupId, sendSignalMutation, eventId, clearStreamerMutation]);

  // Define stopStream
  const stopStream = useCallback(() => {
    handleTrackEnded();
  }, [handleTrackEnded]);

  const startStream = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (myVideoRef.current) myVideoRef.current.srcObject = mediaStream;
      localStreamRef.current = mediaStream;
      setIsStreaming(true);
      setStreamerId(sessionData!.user.id);
      
      mediaStream.getTracks().forEach(track => {
        track.addEventListener('ended', handleTrackEnded);
      });
      
      setStreamerMutation.mutate({ eventId });
      sendSignalMutation.mutate({ groupId, signal: { type: 'iamstreamer' } });
      
      console.log("Stream started successfully");
    } catch (err) { 
      console.error("Screen share failed", err); 
    }
  }, [groupId, sessionData, sendSignalMutation, eventId, setStreamerMutation, handleTrackEnded]);

  // Handle page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (localStreamRef.current) {
        stopStream();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [stopStream]);

  // --- SINGLE PUSHER INITIALIZATION ---
  useEffect(() => {
    if (!groupId || !sessionData?.user.id) return;

    // Initialize Pusher only once
    if (!pusherRef.current) {
      console.log("🚀 Initializing Pusher connection...");
      const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { 
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! 
      });
      pusherRef.current = pusher;

      // Subscribe to channel
      const channel = pusher.subscribe(`group-${groupId}`);
      channelRef.current = channel;

      const onSignal = (data: PusherSignalData) => {
        if (data.senderId === sessionData.user.id) return;

        const { type, offer, answer } = data.signal;
        console.log("📡 Received signal:", type, "from:", data.senderId);

        switch (type) {
          case 'iamstreamer':
            if (data.senderId !== sessionData.user.id) {
              console.log("🎬 Stream started by:", data.senderId);
              setIsStreaming(true);
              setStreamerId(data.senderId);
              setConnectionStatus('connecting');
              hasProcessedLateJoinRef.current = true;
              
              sendSignalMutation.mutate({ 
                groupId, 
                signal: { 
                  type: 'request', 
                  targetId: data.senderId
                } 
              });
            }
            break;

          case 'request':
            console.log("🤝 Received request from:", data.senderId, "localStream exists:", !!localStreamRef.current);
            if (localStreamRef.current && data.signal.targetId === sessionData.user.id) {
              console.log("📤 Creating offer for:", data.senderId);
              
              if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
              }
              
              const peer = new Peer({ 
                initiator: true, 
                stream: localStreamRef.current, 
                trickle: false,
                config: {
                  iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                  ]
                }
              });
              
              peer.on('signal', (offerSignal) => {
                console.log("📨 Sending offer to:", data.senderId);
                sendSignalMutation.mutate({ 
                  groupId, 
                  signal: { 
                    type: 'offer', 
                    offer: offerSignal, 
                    targetId: data.senderId 
                  } 
                });
              });

              peer.on('error', (err) => {
                console.error('❌ Peer error (streamer side):', err);
              });

              peer.on('connect', () => {
                console.log("✅ Streamer: Connected to viewer:", data.senderId);
              });
              
              peerRef.current = peer;
            }
            break;

          case 'offer':
            if (data.signal.targetId === sessionData.user.id) {
              console.log("📥 Received offer from streamer");
              setConnectionStatus('connecting');
              
              if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
              }
              
              const peer = new Peer({ 
                initiator: false, 
                trickle: false,
                config: {
                  iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:global.stun.twilio.com:3478' }
                  ]
                }
              });
              
              peer.on('signal', (answerSignal) => {
                console.log("📨 Sending answer to streamer");
                sendSignalMutation.mutate({ 
                  groupId, 
                  signal: { 
                    type: 'answer', 
                    answer: answerSignal, 
                    targetId: data.senderId 
                  } 
                });
              });
              
              peer.on('stream', (remoteStream) => {
                console.log("🎥 Received remote stream!");
                setConnectionStatus('connected');
                if (peerVideoRef.current) {
                  peerVideoRef.current.srcObject = remoteStream;
                  peerVideoRef.current.play().catch(err => {
                    if (err instanceof Error && err.name !== 'AbortError') {
                      console.error("Play failed:", err);
                    }
                  });
                }
              });

              peer.on('error', (err) => {
                console.error('❌ Peer connection error:', err);
                setConnectionStatus('disconnected');
              });

              peer.on('connect', () => {
                console.log("✅ Viewer: Connected to streamer!");
                setConnectionStatus('connected');
              });
              
              console.log("🔗 Signaling offer to peer");
              if (offer) {
                peer.signal(offer as Peer.SignalData);
              }
              peerRef.current = peer;
            }
            break;

          case 'answer':
            if (peerRef.current && data.signal.targetId === sessionData.user.id && answer) {
              console.log("📥 Received answer from viewer");
              peerRef.current.signal(answer as Peer.SignalData);
            }
            break;

          case 'streamend':
            console.log("🛑 Stream ended signal received");
            if (data.senderId === streamerId) {
              setIsStreaming(false);
              setStreamerId(null);
              setConnectionStatus('disconnected');
              hasProcessedLateJoinRef.current = false;
              
              if (peerVideoRef.current) {
                peerVideoRef.current.srcObject = null;
                peerVideoRef.current.load();
              }
              
              if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
              }
              
              console.log("👀 Viewer: Stream ended, resetting state");
            }
            break;
        }
      };

      channel.bind('webrtc-signal', onSignal);
    }

    // Cleanup only on component unmount
    return () => {
      console.log("🧹 Component unmounting - cleaning up Pusher");
      if (pusherRef.current && channelRef.current) {
        channelRef.current.unbind('webrtc-signal');
        channelRef.current.unsubscribe();
        pusherRef.current.disconnect();
        pusherRef.current = null;
        channelRef.current = null;
      }
    };
  }, [groupId, sessionData?.user.id, isStreaming, streamerId, sendSignalMutation]);

  // --- STREAM STATE MANAGEMENT ---
  useEffect(() => {
    // Reset viewer state when streamer stops
    if (!event?.streamerId && isStreaming && streamerId && streamerId !== sessionData?.user.id) {
      console.log("🔄 Streamer stopped - resetting viewer state");
      setIsStreaming(false);
      setStreamerId(null);
      setConnectionStatus('disconnected');
      hasProcessedLateJoinRef.current = false;
      
      if (peerVideoRef.current) {
        peerVideoRef.current.srcObject = null;
        peerVideoRef.current.load();
      }
      
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
    }

    // Handle new streams or restarted streams
    if (event?.streamerId && 
        event.streamerId !== sessionData?.user.id && 
        !isStreaming && 
        !hasProcessedLateJoinRef.current) {
      
      console.log("🎯 Stream available. Streamer ID:", event.streamerId);
      setIsStreaming(true);
      setStreamerId(event.streamerId);
      setConnectionStatus('connecting');
      hasProcessedLateJoinRef.current = true;
      
      sendSignalMutation.mutate({ 
        groupId, 
        signal: { 
          type: 'request', 
          targetId: event.streamerId
        } 
      });
    }

    if (!event?.streamerId && hasProcessedLateJoinRef.current) {
      hasProcessedLateJoinRef.current = false;
    }
  }, [event, sessionData?.user.id, groupId, sendSignalMutation, isStreaming, streamerId]);

  const currentUserMembership = group?.members.find(m => m.userId === sessionData?.user.id);
  const canStream = !isStreaming && (currentUserMembership?.isAdmin || group?.createdById === sessionData?.user.id);
  const amIStreamer = isStreaming && streamerId === sessionData?.user.id;
  const amIViewer = isStreaming && streamerId !== sessionData?.user.id;

  if (isEventLoading || isGroupLoading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mt-12 flex flex-col items-center gap-8 px-4 py-8">
        <h1 className="text-4xl font-bold">{event?.name ?? 'Event'}</h1>
        
        {/* Connection Status */}
        <div className="flex gap-4">
          {amIViewer && (
            <div className={`px-4 py-2 rounded-lg font-bold ${
              connectionStatus === 'connected' ? 'bg-green-600' :
              connectionStatus === 'connecting' ? 'bg-yellow-600' : 'bg-gray-600'
            }`}>
              {connectionStatus === 'connected' ? '✅ Connected' :
               connectionStatus === 'connecting' ? '🔄 Connecting...' : '❌ Disconnected'}
            </div>
          )}
        </div>

        <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl border-2 border-gray-800">
          
          {/* Main video for viewers */}
          <video 
            ref={peerVideoRef} 
            autoPlay 
            playsInline 
            className="h-full w-full object-contain" 
          />
          
          {/* Status messages */}
          {!isStreaming && ( 
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500">Stream has not started yet.</p>
            </div> 
          )}
          
          {amIViewer && connectionStatus === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80">
              <p className="text-white text-xl">Connecting to stream...</p>
            </div>
          )}

          {amIStreamer && ( 
            <div className="absolute top-4 left-4 bg-green-600 px-3 py-1 rounded-lg text-sm font-bold">
              🔴 LIVE - You are streaming
            </div> 
          )}
          
          {/* Preview for streamer */}
          <div className={`absolute bottom-4 right-4 h-1/4 w-1/4 rounded-lg border-2 overflow-hidden bg-black transition-all duration-300 ${
            amIStreamer 
              ? 'border-green-500 opacity-100' 
              : 'border-gray-600 opacity-0 pointer-events-none'
          }`}>
            <video 
              ref={myVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="h-full w-full object-cover" 
            />
            {amIStreamer && ( 
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold opacity-0 hover:opacity-100 transition-opacity">
                YOUR PREVIEW
              </div> 
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
            {canStream && ( 
              <button onClick={() => void startStream()} className="rounded-full bg-green-600 px-8 py-4 text-xl font-bold transition hover:bg-green-700">
                Start Screen Share
              </button> 
            )}

            {amIStreamer && ( 
              <button onClick={stopStream} className="rounded-full bg-red-600 px-8 py-4 text-xl font-bold transition hover:bg-red-700">
                Stop Sharing
              </button> 
            )}

            <Link href={`/groups/${groupId}`} className="rounded-full bg-white/10 px-8 py-4 font-semibold no-underline transition hover:bg-white/20">
              Back to Group
            </Link>
        </div>
      </div>
    </main>
  );
}















// "use client";

// import { useParams } from "next/navigation";
// import Link from "next/link";
// import { useSession } from "next-auth/react";
// import { api } from "~/trpc/react";
// import { useState, useRef, useEffect, useCallback } from "react";
// import Peer from "simple-peer";
// import Pusher from "pusher-js";

// export default function EventPage() {
//   const params = useParams();
//   const groupId = typeof params?.groupId === 'string' ? params.groupId : '';
//   const eventId = typeof params?.eventId === 'string' ? params.eventId : '';
  
//   const { data: sessionData } = useSession();
//   const { data: event, isLoading: isEventLoading, refetch: refetchEvent } = api.event.getById.useQuery({ eventId }, { enabled: !!eventId });
//   const { data: group, isLoading: isGroupLoading } = api.group.getById.useQuery({ id: groupId }, { enabled: !!groupId });

//   const [isStreaming, setIsStreaming] = useState(false);
//   const [streamerId, setStreamerId] = useState<string | null>(null);
//   const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
//   const myVideoRef = useRef<HTMLVideoElement>(null);
//   const peerVideoRef = useRef<HTMLVideoElement>(null);
//   const peerRef = useRef<Peer.Instance | null>(null);
//   const localStreamRef = useRef<MediaStream | null>(null);
//   const hasProcessedLateJoinRef = useRef(false);
//   const pusherRef = useRef<Pusher | null>(null);
//   const channelRef = useRef<any>(null);

//   const sendSignalMutation = api.webrtc.sendSignal.useMutation();
//   const setStreamerMutation = api.event.setStreamer.useMutation();
//   const clearStreamerMutation = api.event.clearStreamer.useMutation();

//   // Define stopStream FIRST to avoid circular dependency
//   const stopStream = useCallback(() => {
//     if (localStreamRef.current) {
//       localStreamRef.current.getTracks().forEach(track => {
//         track.stop();
//         track.removeEventListener('ended', handleTrackEnded);
//       });
//       localStreamRef.current = null;
      
//       if (myVideoRef.current) {
//         myVideoRef.current.srcObject = null;
//         myVideoRef.current.load(); // FIX: Add load() to properly reset
//       }
//       if (peerVideoRef.current) {
//         peerVideoRef.current.srcObject = null;
//         peerVideoRef.current.load(); // FIX: Add load() to properly reset
//       }

//       setIsStreaming(false);
//       setStreamerId(null);
//       setConnectionStatus('disconnected');
      
//       // Announce stream end to DB and other users
//       clearStreamerMutation.mutate({ eventId });
//       sendSignalMutation.mutate({ groupId, signal: { type: 'streamend' } });
      
//       console.log("Stream stopped");
//     }
//   }, [groupId, sendSignalMutation, eventId, clearStreamerMutation]);

//   // Handler for track ended events
//   const handleTrackEnded = useCallback(() => {
//     console.log("Track ended - browser stopped sharing");
//     stopStream();
//   }, [stopStream]);

//   const startStream = useCallback(async () => {
//     try {
//       const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
//       if (myVideoRef.current) myVideoRef.current.srcObject = mediaStream;
//       localStreamRef.current = mediaStream;
//       setIsStreaming(true);
//       setStreamerId(sessionData!.user.id);
      
//       mediaStream.getTracks().forEach(track => {
//         track.addEventListener('ended', handleTrackEnded);
//       });
      
//       setStreamerMutation.mutate({ eventId });
//       sendSignalMutation.mutate({ groupId, signal: { type: 'iamstreamer' } });
      
//       console.log("Stream started successfully");
//     } catch (err) { 
//       console.error("Screen share failed", err); 
//     }
//   }, [groupId, sessionData, sendSignalMutation, eventId, setStreamerMutation, handleTrackEnded]);

//   // Handle page unload
//   useEffect(() => {
//     const handleBeforeUnload = () => {
//       if (localStreamRef.current) {
//         stopStream();
//       }
//     };

//     window.addEventListener('beforeunload', handleBeforeUnload);

//     return () => {
//       window.removeEventListener('beforeunload', handleBeforeUnload);
//     };
//   }, [stopStream]);

//   // --- SINGLE PUSHER INITIALIZATION ---
//   useEffect(() => {
//     if (!groupId || !sessionData?.user.id) return;

//     // Initialize Pusher only once
//     if (!pusherRef.current) {
//       console.log("🚀 Initializing Pusher connection...");
//       const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { 
//         cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! 
//       });
//       pusherRef.current = pusher;

//       // Subscribe to channel
//       const channel = pusher.subscribe(`group-${groupId}`);
//       channelRef.current = channel;

//       const onSignal = (data: { senderId: string, signal: any }) => {
//         if (data.senderId === sessionData.user.id) return;

//         const { type, offer, answer } = data.signal;
//         console.log("📡 Received signal:", type, "from:", data.senderId);

//         switch (type) {
//           case 'iamstreamer':
//             // FIX: Reset hasProcessedLateJoinRef when new stream starts
//             if (data.senderId !== sessionData.user.id) {
//               console.log("🎬 Stream started by:", data.senderId);
//               setIsStreaming(true);
//               setStreamerId(data.senderId);
//               setConnectionStatus('connecting');
//               hasProcessedLateJoinRef.current = true; // FIX: Set to true immediately
              
//               sendSignalMutation.mutate({ 
//                 groupId, 
//                 signal: { 
//                   type: 'request', 
//                   targetId: data.senderId
//                 } 
//               });
//             }
//             break;

//           case 'request':
//             console.log("🤝 Received request from:", data.senderId, "localStream exists:", !!localStreamRef.current);
//             if (localStreamRef.current && data.signal.targetId === sessionData.user.id) {
//               console.log("📤 Creating offer for:", data.senderId);
              
//               if (peerRef.current) {
//                 peerRef.current.destroy();
//                 peerRef.current = null;
//               }
              
//               const peer = new Peer({ 
//                 initiator: true, 
//                 stream: localStreamRef.current, 
//                 trickle: false,
//                 config: {
//                   iceServers: [
//                     { urls: 'stun:stun.l.google.com:19302' },
//                     { urls: 'stun:global.stun.twilio.com:3478' }
//                   ]
//                 }
//               });
              
//               peer.on('signal', (offerSignal) => {
//                 console.log("📨 Sending offer to:", data.senderId);
//                 sendSignalMutation.mutate({ 
//                   groupId, 
//                   signal: { 
//                     type: 'offer', 
//                     offer: offerSignal, 
//                     targetId: data.senderId 
//                   } 
//                 });
//               });

//               peer.on('error', (err) => {
//                 console.error('❌ Peer error (streamer side):', err);
//               });

//               peer.on('connect', () => {
//                 console.log("✅ Streamer: Connected to viewer:", data.senderId);
//               });
              
//               peerRef.current = peer;
//             }
//             break;

//           case 'offer':
//             if (data.signal.targetId === sessionData.user.id) {
//               console.log("📥 Received offer from streamer");
//               setConnectionStatus('connecting');
              
//               if (peerRef.current) {
//                 peerRef.current.destroy();
//                 peerRef.current = null;
//               }
              
//               const peer = new Peer({ 
//                 initiator: false, 
//                 trickle: false,
//                 config: {
//                   iceServers: [
//                     { urls: 'stun:stun.l.google.com:19302' },
//                     { urls: 'stun:global.stun.twilio.com:3478' }
//                   ]
//                 }
//               });
              
//               peer.on('signal', (answerSignal) => {
//                 console.log("📨 Sending answer to streamer");
//                 sendSignalMutation.mutate({ 
//                   groupId, 
//                   signal: { 
//                     type: 'answer', 
//                     answer: answerSignal, 
//                     targetId: data.senderId 
//                   } 
//                 });
//               });
              
//               peer.on('stream', (remoteStream) => {
//                 console.log("🎥 Received remote stream!");
//                 setConnectionStatus('connected');
//                 if (peerVideoRef.current) {
//                   peerVideoRef.current.srcObject = remoteStream;
//                   peerVideoRef.current.play().catch(err => {
//                     // FIX: Ignore AbortError which is common during reconnections
//                     if (err.name !== 'AbortError') {
//                       console.error("Play failed:", err);
//                     }
//                   });
//                 }
//               });

//               peer.on('error', (err) => {
//                 console.error('❌ Peer connection error:', err);
//                 setConnectionStatus('disconnected');
//               });

//               peer.on('connect', () => {
//                 console.log("✅ Viewer: Connected to streamer!");
//                 setConnectionStatus('connected');
//               });
              
//               console.log("🔗 Signaling offer to peer");
//               peer.signal(offer);
//               peerRef.current = peer;
//             }
//             break;

//           case 'answer':
//             if (peerRef.current && data.signal.targetId === sessionData.user.id) {
//               console.log("📥 Received answer from viewer");
//               peerRef.current.signal(answer);
//             }
//             break;

//           case 'streamend':
//             console.log("🛑 Stream ended signal received");
//             if (data.senderId === streamerId) {
//               setIsStreaming(false);
//               setStreamerId(null);
//               setConnectionStatus('disconnected');
//               hasProcessedLateJoinRef.current = false;console.log("🛑 Stream ended signal received inside if ");
              
//               // FIX: Add load() to properly clear video element
//               if (peerVideoRef.current) {
//                 peerVideoRef.current.srcObject = null;
//                 peerVideoRef.current.load(); // This ensures "Stream has not started yet" shows
//               }
              
//               if (peerRef.current) {
//                 peerRef.current.destroy();
//                 peerRef.current = null;
//               }
              
//               console.log("👀 Viewer: Stream ended, resetting state");
//             }
//             break;
//         }
//       };

//       channel.bind('webrtc-signal', onSignal);
//     }

//     // Cleanup only on component unmount (not during Fast Refresh)
//     return () => {
//       console.log("🧹 Component unmounting - cleaning up Pusher");
//       if (pusherRef.current && channelRef.current) {
//         channelRef.current.unbind('webrtc-signal');
//         channelRef.current.unsubscribe();
//         pusherRef.current.disconnect();
//         pusherRef.current = null;
//         channelRef.current = null;
//       }
//     };
//   }, [groupId, sessionData?.user.id, isStreaming, streamerId, sendSignalMutation]); // FIX: Added missing dependencies

//   // --- STREAM STATE MANAGEMENT ---
//   // useEffect(() => {
//   //   // Reset viewer state when streamer stops
//   //   if (!event?.streamerId && isStreaming && streamerId && streamerId !== sessionData?.user.id) {
//   //     console.log("🔄 Streamer stopped - resetting viewer state");
//   //     setIsStreaming(false);
//   //     setStreamerId(null);
//   //     setConnectionStatus('disconnected');
//   //     hasProcessedLateJoinRef.current = false;
      
//   //     // FIX: Add load() to properly clear video element
//   //     if (peerVideoRef.current) {
//   //       peerVideoRef.current.srcObject = null;
//   //       peerVideoRef.current.load(); // This ensures "Stream has not started yet" shows
//   //     }
      
//   //     if (peerRef.current) {
//   //       peerRef.current.destroy();
//   //       peerRef.current = null;
//   //     }
//   //   }

//   //   // Handle new streams or restarted streams
//   //   if (event?.streamerId && 
//   //       event.streamerId !== sessionData?.user.id && 
//   //       !isStreaming && 
//   //       !hasProcessedLateJoinRef.current &&
//   //       event.streamerId !== streamerId) {
      
//   //     console.log("🎯 Stream available. Streamer ID:", event.streamerId);
//   //     setIsStreaming(true);
//   //     setStreamerId(event.streamerId);
//   //     setConnectionStatus('connecting');
//   //     hasProcessedLateJoinRef.current = true;
      
//   //     sendSignalMutation.mutate({ 
//   //       groupId, 
//   //       signal: { 
//   //         type: 'request', 
//   //         targetId: event.streamerId
//   //       } 
//   //     });
//   //   }

//   //   if (!event?.streamerId && hasProcessedLateJoinRef.current) {
//   //     hasProcessedLateJoinRef.current = false;
//   //   }
//   // }, [event, sessionData?.user.id, groupId, sendSignalMutation, isStreaming, streamerId]);




// // --- STREAM STATE MANAGEMENT ---
// useEffect(() => {
//   // Reset viewer state when streamer stops
//   if (!event?.streamerId && isStreaming && streamerId && streamerId !== sessionData?.user.id) {
//     console.log("🔄 Streamer stopped - resetting viewer state");
//     setIsStreaming(false);
//     setStreamerId(null);
//     setConnectionStatus('disconnected');
//     hasProcessedLateJoinRef.current = false;
    
//     // Clear the video element and force reset
//     if (peerVideoRef.current) {
//       peerVideoRef.current.srcObject = null;
//       peerVideoRef.current.load();
//     }
    
//     if (peerRef.current) {
//       peerRef.current.destroy();
//       peerRef.current = null;
//     }
//   }

//   // Handle new streams or restarted streams
//   if (event?.streamerId && 
//       event.streamerId !== sessionData?.user.id && 
//       !isStreaming && 
//       !hasProcessedLateJoinRef.current) {
    
//     console.log("🎯 Stream available. Streamer ID:", event.streamerId);
//     setIsStreaming(true);
//     setStreamerId(event.streamerId);
//     setConnectionStatus('connecting');
//     hasProcessedLateJoinRef.current = true;
    
//     sendSignalMutation.mutate({ 
//       groupId, 
//       signal: { 
//         type: 'request', 
//         targetId: event.streamerId
//       } 
//     });
//   }

//   if (!event?.streamerId && hasProcessedLateJoinRef.current) {
//     hasProcessedLateJoinRef.current = false;
//   }
// }, [event, sessionData?.user.id, groupId, sendSignalMutation, isStreaming, streamerId]);

//   const currentUserMembership = group?.members.find(m => m.userId === sessionData?.user.id);
//   const canStream = !isStreaming && (currentUserMembership?.isAdmin || group?.createdById === sessionData?.user.id);
//   const amIStreamer = isStreaming && streamerId === sessionData?.user.id;
//   const amIViewer = isStreaming && streamerId !== sessionData?.user.id;

//   if (isEventLoading || isGroupLoading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;

//   return (
//     <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
//       <div className="container mt-12 flex flex-col items-center gap-8 px-4 py-8">
//         <h1 className="text-4xl font-bold">{event?.name}</h1>
        
//         {/* Connection Status */}
//         <div className="flex gap-4">
//           {amIViewer && (
//             <div className={`px-4 py-2 rounded-lg font-bold ${
//               connectionStatus === 'connected' ? 'bg-green-600' :
//               connectionStatus === 'connecting' ? 'bg-yellow-600' : 'bg-gray-600'
//             }`}>
//               {connectionStatus === 'connected' ? '✅ Connected' :
//                connectionStatus === 'connecting' ? '🔄 Connecting...' : '❌ Disconnected'}
//             </div>
//           )}
//         </div>

//         <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl border-2 border-gray-800">
          
//           {/* Main video for viewers */}
//           <video 
//             ref={peerVideoRef} 
//             autoPlay 
//             playsInline 
//             className="h-full w-full object-contain" 
//           />
          
//           {/* Status messages */}
//           {!isStreaming && ( 
//             <div className="absolute inset-0 flex items-center justify-center">
//               <p className="text-gray-500">Stream has not started yet.</p>
//             </div> 
//           )}
          
//           {amIViewer && connectionStatus === 'connecting' && (
//             <div className="absolute inset-0 flex items-center justify-center bg-black/80">
//               <p className="text-white text-xl">Connecting to stream...</p>
//             </div>
//           )}

//           {amIStreamer && ( 
//             <div className="absolute top-4 left-4 bg-green-600 px-3 py-1 rounded-lg text-sm font-bold">
//               🔴 LIVE - You are streaming
//             </div> 
//           )}
          
//           {/* Preview for streamer */}
//           <div className={`absolute bottom-4 right-4 h-1/4 w-1/4 rounded-lg border-2 overflow-hidden bg-black transition-all duration-300 ${
//             amIStreamer 
//               ? 'border-green-500 opacity-100' 
//               : 'border-gray-600 opacity-0 pointer-events-none'
//           }`}>
//             <video 
//               ref={myVideoRef} 
//               autoPlay 
//               playsInline 
//               muted 
//               className="h-full w-full object-cover" 
//             />
//             {amIStreamer && ( 
//               <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold opacity-0 hover:opacity-100 transition-opacity">
//                 YOUR PREVIEW
//               </div> 
//             )}
//           </div>
//         </div>
//         <div className="flex items-center gap-4">
//             {canStream && ( 
//               <button onClick={() => void startStream()} className="rounded-full bg-green-600 px-8 py-4 text-xl font-bold transition hover:bg-green-700">
//                 Start Screen Share
//               </button> 
//             )}

//             {amIStreamer && ( 
//               <button onClick={stopStream} className="rounded-full bg-red-600 px-8 py-4 text-xl font-bold transition hover:bg-red-700">
//                 Stop Sharing
//               </button> 
//             )}

//             <Link href={`/groups/${groupId}`} className="rounded-full bg-white/10 px-8 py-4 font-semibold no-underline transition hover:bg-white/20">
//               Back to Group
//             </Link>
//         </div>
//       </div>
//     </main>
//   );
// }