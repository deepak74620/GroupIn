
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






"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { useState, useRef, useEffect, useCallback } from "react";
import Peer from "simple-peer";
import Pusher from "pusher-js";

export default function EventPage() {
  const params = useParams();
  const groupId = typeof params?.groupId === 'string' ? params.groupId : '';
  const eventId = typeof params?.eventId === 'string' ? params.eventId : '';
  
  const { data: sessionData } = useSession();
  const { data: event, isLoading: isEventLoading } = api.event.getById.useQuery({ eventId }, { enabled: !!eventId });
  const { data: group, isLoading: isGroupLoading } = api.group.getById.useQuery({ id: groupId }, { enabled: !!groupId });

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamerId, setStreamerId] = useState<string | null>(null);
  
  const myVideoRef = useRef<HTMLVideoElement>(null);
  const peerVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const sendSignalMutation = api.webrtc.sendSignal.useMutation();

  const startStream = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      if (myVideoRef.current) myVideoRef.current.srcObject = mediaStream;
      localStreamRef.current = mediaStream;
      setIsStreaming(true);
      setStreamerId(sessionData!.user.id);
      sendSignalMutation.mutate({ groupId, signal: { type: 'iamstreamer' } });
    } catch (err) { console.error("Screen share failed", err); }
  }, [groupId, sessionData, sendSignalMutation]);

  const stopStream = useCallback(() => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        
        if (myVideoRef.current) myVideoRef.current.srcObject = null;
        if (peerVideoRef.current) peerVideoRef.current.srcObject = null;

        setIsStreaming(false);
        setStreamerId(null);
        sendSignalMutation.mutate({ groupId, signal: { type: 'streamend' } });
      }
    }, [groupId, sendSignalMutation]);

  useEffect(() => {
    if (!groupId || !sessionData?.user.id) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
    const channel = pusher.subscribe(`group-${groupId}`);

    const onSignal = (data: { senderId: string, signal: any }) => {
      if (data.senderId === sessionData.user.id) return;

      const { type, offer, answer } = data.signal;

      switch (type) {
        case 'iamstreamer':
          setIsStreaming(true);
          setStreamerId(data.senderId);
          sendSignalMutation.mutate({ groupId, signal: { type: 'request', targetId: data.senderId } });
          break;
        case 'request':
          if (localStreamRef.current && data.signal.targetId === sessionData.user.id) {
            const peer = new Peer({ initiator: true, stream: localStreamRef.current, trickle: false });
            peer.on('signal', (offerSignal) => sendSignalMutation.mutate({ groupId, signal: { type: 'offer', offer: offerSignal, targetId: data.senderId } }));
            peerRef.current = peer;
          }
          break;
        case 'offer':
          if (data.signal.targetId === sessionData.user.id) {
            const peer = new Peer({ initiator: false, trickle: false });
            peer.on('signal', (answerSignal) => sendSignalMutation.mutate({ groupId, signal: { type: 'answer', answer: answerSignal, targetId: data.senderId } }));
            peer.on('stream', (remoteStream) => {
              if (peerVideoRef.current) peerVideoRef.current.srcObject = remoteStream;
            });
            peer.signal(offer);
            peerRef.current = peer;
          }
          break;
        case 'answer':
          peerRef.current?.signal(answer);
          break;
        case 'streamend':
          setIsStreaming(false);
          setStreamerId(null);
          if (peerVideoRef.current) peerVideoRef.current.srcObject = null;
          peerRef.current?.destroy();
          break;
      }
    };

    channel.bind('webrtc-signal', onSignal);
    
    return () => {
      channel.unbind('webrtc-signal', onSignal);
      pusher.unsubscribe(`group-${groupId}`);
      if (localStreamRef.current) {
        stopStream();
      }
      peerRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, sessionData?.user.id]);
  
  const currentUserMembership = group?.members.find(m => m.userId === sessionData?.user.id);
  const canStream = !isStreaming && (currentUserMembership?.isAdmin || group?.createdById === sessionData?.user.id);
  const amIStreamer = isStreaming && streamerId === sessionData?.user.id;

  if (isEventLoading || isGroupLoading) return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mt-12 flex flex-col items-center gap-8 px-4 py-8">
        <h1 className="text-4xl font-bold">{event?.name}</h1>
        <div className="relative w-full max-w-6xl aspect-video bg-black rounded-xl border-2 border-gray-800">
          
          {/* Main video for viewers */}
          <video ref={peerVideoRef} autoPlay playsInline muted className="h-full w-full object-contain" />
          
          {/* Status messages */}
          {!isStreaming && ( 
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500">Stream has not started yet.</p>
            </div> 
          )}
          {amIStreamer && ( 
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-2xl font-bold text-gray-400">You are sharing your screen. Viewers can see this stream.</p>
            </div> 
          )}
          
          {/* Preview for streamer - ALWAYS IN DOM but visually hidden from viewers */}
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

