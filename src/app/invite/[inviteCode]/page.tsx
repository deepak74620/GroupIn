"use client";

import { useParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { api } from "~/trpc/react";

export default function InvitePage() {
  const router = useRouter();
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { data: sessionData } = useSession();
  
  const { data: inviteInfo, isLoading } = api.group.getInviteInfo.useQuery(
    { inviteId: inviteCode },
    { enabled: !!inviteCode }
  );

  const acceptInvite = api.group.acceptInvite.useMutation({
    onSuccess: (data) => {
      // FIX 1: Add 'void' to the Promise-returning function
      void router.push(`/groups/${data.groupId}`);
    },
    onError: (error) => {
      alert(`Error accepting invite: ${error.message}`);
    }
  });

  const handleAcceptInvite = () => {
    acceptInvite.mutate({ inviteId: inviteCode });
  };

  const handleSignIn = () => {
    // FIX 2: Add 'void' to the Promise-returning function
    void signIn("github", { callbackUrl: window.location.href });
  };

  if (isLoading) return <div>Loading invite...</div>;
  if (!inviteInfo) return <div>This invite link is invalid or has expired.</div>;
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="flex flex-col items-center gap-4 rounded-xl bg-white/10 p-8">
        {/* FIX 3: Replace ' with &apos; */}
        <h1 className="text-3xl font-bold">You&apos;re invited!</h1>
        <p>
          {inviteInfo.group.createdBy.name} has invited you to join the group:
        </p>
        <p className="text-4xl font-extrabold text-[hsl(280,100%,70%)]">
          {inviteInfo.group.name}
        </p>

        {sessionData ? (
          <button
            onClick={handleAcceptInvite}
            disabled={acceptInvite.isPending}
            className="rounded-full bg-green-600 px-10 py-3 font-semibold transition hover:bg-green-700 disabled:opacity-50"
          >
            {acceptInvite.isPending ? "Joining..." : "Accept Invitation"}
          </button>
        ) : (
          <button
            onClick={handleSignIn}
            className="rounded-full bg-white/20 px-10 py-3 font-semibold transition hover:bg-white/30"
          >
            Sign In with GitHub to Accept
          </button>
        )}
      </div>
    </main>
  );
}