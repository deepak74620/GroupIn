//  import Peer from 'simple-peer';
//     import { type UseTRPCMutationResult } from '@trpc/react-query/shared';
//     import { type AppRouter } from '~/server/api/root';
//     import { type inferRouterOutputs } from '@trpc/server';
    
//     type SendSignalMutation = UseTRPCMutationResult<
//       inferRouterOutputs<AppRouter>['webrtc']['sendSignal'],
//       unknown,
//       { groupId: string; signal: any },
//       unknown
//     >;
    
//     export class WebRTCManager {
//       private peers: Map<string, Peer.Instance> = new Map();
//       private localStream: MediaStream | null = null;
//       private onRemoteStream: (stream: MediaStream) => void;
//       private sendSignal: SendSignalMutation['mutate'];
//       private groupId: string;
//       private userId: string;
    
//       constructor(
//         userId: string,
//         groupId: string,
//         sendSignalMutation: SendSignalMutation,
//         onRemoteStreamCallback: (stream: MediaStream) => void
//       ) {
//         this.userId = userId;
//         this.groupId = groupId;
//         this.sendSignal = sendSignalMutation.mutate;
//         this.onRemoteStream = onRemoteStreamCallback;
//       }
    
//       // Called by the streamer to start sharing
//       public async start(stream: MediaStream) {
//         this.localStream = stream;
//         this.sendSignal({ groupId: this.groupId, signal: { type: 'iamstreamer' } });
//       }
    
//       // The main entry point for handling signals from Pusher
//       public handleSignal(senderId: string, signal: any) {
//         if (senderId === this.userId) return;
    
//         const { type, offer, answer } = signal;
    
//         switch (type) {
//           case 'iamstreamer':
//             // Another user is streaming, request to connect
//             this.sendSignal({ groupId: this.groupId, signal: { type: 'request', targetId: senderId } });
//             break;
    
//           case 'request':
//             // A viewer wants to connect to our stream
//             if (this.localStream && signal.targetId === this.userId) {
//               const peer = this.createPeer(senderId, true);
//               this.peers.set(senderId, peer);
//             }
//             break;
    
//           case 'offer':
//             // We are a viewer and received an offer from the streamer
//             if (signal.targetId === this.userId) {
//               const peer = this.createPeer(senderId, false);
//               peer.signal(offer);
//               this.peers.set(senderId, peer);
//             }
//             break;
    
//           case 'answer':
//             // We are the streamer and received an answer from a viewer
//             this.peers.get(senderId)?.signal(answer);
//             break;
            
//           case 'streamend':
//             this.onRemoteStream(null as any); // Clear the remote stream
//             this.peers.forEach(p => p.destroy());
//             this.peers.clear();
//             break;
//         }
//       }
    
//       // Helper to create a new peer
//       private createPeer(targetId: string, initiator: boolean): Peer.Instance {
//         const peer = new Peer({
//           initiator,
//           config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
//           stream: this.localStream ?? undefined,
//           trickle: false,
//         });
    
//         peer.on('signal', (signal) => {
//           const type = initiator ? 'offer' : 'answer';
//           this.sendSignal({
//             groupId: this.groupId,
//             signal: { type, [type]: signal, targetId },
//           });
//         });
    
//         peer.on('stream', (remoteStream) => {
//           this.onRemoteStream(remoteStream);
//         });

//         peer.on('error', (err) => {
//             console.error(`Peer error with ${targetId}:`, err);
//         });

//         peer.on('close', () => {
//             console.log(`Peer connection closed with ${targetId}`);
//             this.peers.delete(targetId);
//         });
    
//         return peer;
//       }
    
//       // Cleanup method
//       public destroy() {
//         if (this.localStream) {
//             this.sendSignal({ groupId: this.groupId, signal: { type: 'streamend' } });
//         }
//         this.localStream?.getTracks().forEach((track) => track.stop());
//         this.peers.forEach((peer) => peer.destroy());
//         this.peers.clear();
//       }
//     }










import Peer from 'simple-peer';
import { type UseTRPCMutationResult } from '@trpc/react-query/shared';
import { type AppRouter } from '~/server/api/root';
import { type inferRouterOutputs } from '@trpc/server';

// Define proper types for WebRTC signals
interface WebRTCSignal {
  type: string;
  offer?: Peer.SignalData;
  answer?: Peer.SignalData;
  targetId?: string;
}

type SendSignalMutation = UseTRPCMutationResult<
  inferRouterOutputs<AppRouter>['webrtc']['sendSignal'],
  unknown,
  { groupId: string; signal: WebRTCSignal },
  unknown
>;

export class WebRTCManager {
  private peers: Map<string, Peer.Instance> = new Map();
  private localStream: MediaStream | null = null;
  private onRemoteStream: (stream: MediaStream | null) => void;
  private sendSignal: SendSignalMutation['mutate'];
  private groupId: string;
  private userId: string;

  constructor(
    userId: string,
    groupId: string,
    sendSignalMutation: SendSignalMutation,
    onRemoteStreamCallback: (stream: MediaStream | null) => void
  ) {
    this.userId = userId;
    this.groupId = groupId;
    this.sendSignal = sendSignalMutation.mutate;
    this.onRemoteStream = onRemoteStreamCallback;
  }

  // Called by the streamer to start sharing
  public async start(stream: MediaStream): Promise<void> {
    this.localStream = stream;
    this.sendSignal({ groupId: this.groupId, signal: { type: 'iamstreamer' } });
  }

  // The main entry point for handling signals from Pusher
  public handleSignal(senderId: string, signal: WebRTCSignal): void {
    if (senderId === this.userId) return;

    const { type, offer, answer } = signal;

    switch (type) {
      case 'iamstreamer':
        // Another user is streaming, request to connect
        this.sendSignal({ 
          groupId: this.groupId, 
          signal: { type: 'request', targetId: senderId } 
        });
        break;

      case 'request':
        // A viewer wants to connect to our stream
        if (this.localStream && signal.targetId === this.userId) {
          const peer = this.createPeer(senderId, true);
          this.peers.set(senderId, peer);
        }
        break;

      case 'offer':
        // We are a viewer and received an offer from the streamer
        if (signal.targetId === this.userId && offer) {
          const peer = this.createPeer(senderId, false);
          peer.signal(offer);
          this.peers.set(senderId, peer);
        }
        break;

      case 'answer':
        // We are the streamer and received an answer from a viewer
        if (answer) {
          this.peers.get(senderId)?.signal(answer);
        }
        break;
        
      case 'streamend':
        this.onRemoteStream(null); // Clear the remote stream
        this.peers.forEach(p => p.destroy());
        this.peers.clear();
        break;
    }
  }

  // Helper to create a new peer
  private createPeer(targetId: string, initiator: boolean): Peer.Instance {
    const peer = new Peer({
      initiator,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] },
      stream: this.localStream ?? undefined,
      trickle: false,
    });

    peer.on('signal', (signalData: Peer.SignalData) => {
      const signalType = initiator ? 'offer' : 'answer';
      const signalPayload: WebRTCSignal = {
        type: signalType,
        [signalType]: signalData,
        targetId,
      };
      this.sendSignal({
        groupId: this.groupId,
        signal: signalPayload,
      });
    });

    peer.on('stream', (remoteStream: MediaStream) => {
      this.onRemoteStream(remoteStream);
    });

    peer.on('error', (err: Error) => {
      console.error(`Peer error with ${targetId}:`, err);
    });

    peer.on('close', () => {
      console.log(`Peer connection closed with ${targetId}`);
      this.peers.delete(targetId);
    });

    return peer;
  }

  // Cleanup method
  public destroy(): void {
    if (this.localStream) {
      this.sendSignal({ 
        groupId: this.groupId, 
        signal: { type: 'streamend' } 
      });
    }
    this.localStream?.getTracks().forEach((track) => {
      track.stop();
    });
    this.peers.forEach((peer) => {
      peer.destroy();
    });
    this.peers.clear();
  }
}