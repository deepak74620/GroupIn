"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";

import { type AppRouter } from "~/server/api/root";
import { type inferRouterOutputs } from "@trpc/server";
type RouterOutput = inferRouterOutputs<AppRouter>;
// This type is simpler because 'members' is no longer included in the 'getAll' output
type GroupFromGetAll = RouterOutput["group"]["getAll"][number];

export default function Home() {
  const { data: sessionData } = useSession();
  const userId = sessionData?.user.id;

  const [newGroupName, setNewGroupName] = useState("");
  const { data: groups, refetch: refetchGroups, isLoading } = api.group.getAll.useQuery();

  const createGroup = api.group.create.useMutation({
    onSuccess: () => {
      void refetchGroups();
      setNewGroupName("");
    },
  });

  function handleCreateGroup() {
    if (newGroupName.trim()) {
      createGroup.mutate({ name: newGroupName.trim() });
    }
  }

  // THIS LOGIC IS NOW CORRECT AND DOES NOT USE .some()
  const getButtonState = (group: GroupFromGetAll) => {
    if (!userId) return "Loading...";

    const isCreator = group.createdById === userId;

    if (isCreator) return "My Group (Creator)";

    // If a group is in this list, we know the user is a member, but not the creator.
    return "View Group";
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mt-12 flex flex-col items-center justify-center gap-4 px-4 py-8">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Group <span className="text-[hsl(280,100%,70%)]">Collab</span> Platform
        </h1>

        <Link
          href={sessionData ? "/api/auth/signout" : "/api/auth/signin"}
          className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
        >
          {sessionData ? `Sign out (${sessionData.user.name})` : "Sign in"}
        </Link>

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

        <div className="mt-8 w-full max-w-2xl">
          <h2 className="text-3xl font-bold">My Groups</h2>
          <div className="mt-4 flex flex-col gap-4">
            {isLoading && <p>Loading groups...</p>}
            {!isLoading && groups?.length === 0 && (
              <p>
                You are not a member of any groups yet. Create one or join with an invite link!
              </p>
            )}

            {groups?.map((group) => {
              const buttonState = getButtonState(group);
              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="rounded-xl bg-white/10 p-4 flex justify-between items-center hover:bg-white/20 transition-colors"
                >
                  <div>
                    <h3 className="text-2xl font-bold">{group.name}</h3>
                    <p className="text-sm text-gray-400">
                      Created by: {group.createdBy.name}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-4 py-2 font-semibold no-underline transition ${
                      buttonState === "My Group (Creator)"
                        ? "bg-purple-600"
                        : "bg-blue-600"
                    }`}
                  >
                    {buttonState}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
