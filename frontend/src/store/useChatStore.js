import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

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
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
 sendMessage: async (messageData) => {
    const { selectedUser, messages, isSending } = get();
    
    if (isSending) return; 

    set({ isSending: true }); 
    try {
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser.id}`,
        messageData
      );
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
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

      const isFromSelectedUser =
        newMessage.senderId === selectedUserId ||
        newMessage.receiverId === selectedUserId;

      if (!isFromSelectedUser) return;

      set((state) => ({
        messages: [...state.messages, newMessage],
      }));
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket?.off("newMessage");
  },
  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));
