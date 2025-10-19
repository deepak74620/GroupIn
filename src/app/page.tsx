"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { api } from "~/trpc/react";

export default function Home() {
  const { data: sessionData } = useSession();
  const userId = sessionData?.user.id;

  // State and tRPC Query for Groups (unchanged)
  const [newGroupName, setNewGroupName] = useState("");
  const {
    data: groups,
    refetch: refetchGroups,
    isLoading,
  } = api.group.getAll.useQuery();

  // tRPC Mutations
  const createGroup = api.group.create.useMutation({
    onSuccess: () => {
      refetchGroups();
      setNewGroupName("");
    },
  });
  const joinGroup = api.group.join.useMutation({
    onSuccess: () => refetchGroups(),
  });
  const leaveGroup = api.group.leave.useMutation({
    onSuccess: () => refetchGroups(),
  });

  function handleCreateGroup() {
    if (newGroupName.trim()) {
      createGroup.mutate({ name: newGroupName.trim() });
    }
  }

  const getButtonState = (group: (typeof groups)[number]) => {
    if (!userId) return "Sign in to Join";

    const isMember = group.members.some((member) => member.id === userId);
    const isCreator = group.createdById === userId;

    if (isCreator) return "My Group (Creator)";
    if (isMember) return "Leave Group";
    return "Join Group";
  };

  const handleGroupAction = (group: (typeof groups)[number], state: string) => {
    if (state === "Join Group") {
      joinGroup.mutate({ groupId: group.id });
    } else if (state === "Leave Group") {
      leaveGroup.mutate({ groupId: group.id });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mt-12 flex flex-col items-center justify-center gap-4 px-4 py-8">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Group<span className="text-[hsl(280,100%,70%)]">In</span>
        </h1>

        {/* Authentication Button (simplified for brevity) */}
        <Link
          href={sessionData ? "/api/auth/signout" : "/api/auth/signin"}
          className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
        >
          {sessionData ? `Sign out (${sessionData.user.name})` : "Sign in"}
        </Link>

        {/* Create Group Form */}
        {sessionData && (
          <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
            <input
              type="text"
              placeholder="New Group Name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="rounded-md bg-white/10 px-4 py-2 text-white placeholder:text-gray-400"
            />
            <button
              onClick={handleCreateGroup}
              disabled={createGroup.isPending || !newGroupName.trim()}
              className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20 disabled:opacity-50"
            >
              {createGroup.isPending ? "Creating..." : "Create Group"}
            </button>
          </div>
        )}

        {/* List of Groups */}
        <div className="mt-8 w-full max-w-2xl">
          <h2 className="text-3xl font-bold">Available Groups</h2>
          <div className="mt-4 flex flex-col gap-4">
            {isLoading ? (
              <p>Loading groups...</p>
            ) : groups?.length === 0 ? (
              <p>No groups found. Be the first to create one!</p>
            ) : (
              groups?.map((group) => {
                const buttonState = getButtonState(group);

                return (
                  <div
                    key={group.id}
                    className="flex items-center justify-between rounded-xl bg-white/10 p-4"
                  >
                    {/* The Link component wraps the details section */}
                    <Link
                      href={`/groups/${group.id}`}
                      className="flex-grow transition-opacity hover:opacity-80"
                    >
                      <div>
                        <h3 className="text-2xl font-bold">{group.name}</h3>
                        <p className="text-sm text-gray-400">
                          Created by: {group.createdBy.name}
                        </p>
                        <p className="mt-2 text-sm">
                          Members ({group.members.length}):{" "}
                          {group.members.map((m) => m.name).join(", ")}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleGroupAction(group, buttonState)}
                      disabled={
                        buttonState === "Sign in to Join" ||
                        buttonState === "My Group (Creator)" ||
                        joinGroup.isPending ||
                        leaveGroup.isPending
                      }
                      className={`rounded-full px-4 py-2 font-semibold no-underline transition disabled:opacity-50 ${
                        buttonState === "Join Group"
                          ? "bg-green-500 hover:bg-green-600"
                          : buttonState === "Leave Group"
                            ? "bg-red-500 hover:bg-red-600"
                            : "cursor-not-allowed bg-gray-500"
                      }`}
                    >
                      {buttonState}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
