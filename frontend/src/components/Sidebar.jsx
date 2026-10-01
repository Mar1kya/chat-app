import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function Sidebar() {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } =
    useChatStore();

  const { onlineUsers, authUser } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  const onlineCount = onlineUsers.filter((id) => id !== authUser?.id).length;

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user.id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="flex flex-col w-20 h-full transition-all duration-200 border-r lg:w-72 border-base-300">
      <div className="w-full p-5 border-b border-base-300">
        <div className="flex items-center justify-center gap-2 lg:justify-start">
          <Users className="size-6" />
          <span className="hidden font-medium lg:block">Contact Information</span>
        </div>
        <div className="items-center gap-2 mt-3 text-center lg:flex">
          <label className="flex items-center justify-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="hidden text-sm lg:inline">
              Show online only
            </span>
          </label>
          <span className="text-xs text-center text-zinc-500">
            ({onlineCount} Online)
          </span>
        </div>
      </div>
      <div className="w-full py-3 overflow-y-auto">
        {filteredUsers.map((user) => (
          <button
            key={user.id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${selectedUser?.id === user.id ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.name}
                className="object-cover rounded-full size-12"
              />
              {onlineUsers.includes(user.id) && (
                <span
                  className="absolute bottom-0 right-0 bg-green-500 rounded-full size-3 ring-2 ring-zinc-900"
                />
              )}
            </div>
            <div className="hidden min-w-0 text-left lg:block">
              <div className="font-medium truncate">{user.fullName}</div>
              <div className="text-sm text-zinc-400">
                {onlineUsers.includes(user.id) ? "Online" : "Offline"}
              </div>
            </div>
          </button>
        ))}
        {filteredUsers.length === 0 && (
          <div className="py-4 text-xs text-center text-zinc-500 lg:text-lg">
            No users online
          </div>
        )}
      </div>
    </aside>
  );
}
