import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import { getErrorMessage } from "../lib/utils";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSending: false,
  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      if (get().selectedUser?.id !== userId) return;
      set({ messages: res.data });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, isSending } = get();
    if (isSending || !selectedUser) return false;

    set({ isSending: true });
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser.id}`,
        messageData,
      );
      set((state) => ({ messages: [...state.messages, res.data] }));
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      set({ isSending: false });
    }
  },
  subscribeToMessages: (selectedUserId) => {
    const socket = useAuthStore.getState().socket;
    if (!selectedUserId || !socket) return;

    socket.off("newMessage");

    socket.on("newMessage", (newMessageArray) => {
      const newMessage = Array.isArray(newMessageArray)
        ? newMessageArray[0]
        : newMessageArray;

      if (newMessage.senderId !== selectedUserId) return;

      set((state) =>
        state.messages.some((m) => m.id === newMessage.id)
          ? state
          : { messages: [...state.messages, newMessage] },
      );
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
  },
  setSelectedUser: (selectedUser) => set({ selectedUser, messages: [] }),
}));
