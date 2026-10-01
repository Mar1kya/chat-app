import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { getErrorMessage } from "../lib/utils";

const BASE_URL =
  import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account successfully created");
      get().connectSocket();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ isSigningUp: false });
    }
  },
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Login successful");
      get().connectSocket();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      set({ isLoggingIn: false });
    }
  },
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Successfully logged out of the system");
      get().disconnectSocket();
    } catch (error) {
      console.error("Logout error:", error);
      toast.error(
        error?.response?.data?.message ||
          "Error while logging out of the system",
      );
    }
  },
  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set((state) => ({ authUser: { ...state.authUser, ...res.data } }));
      toast.success("Profile successfully updated");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
  connectSocket: () => {
    const { authUser, socket: existing } = get();
    if (!authUser || existing) return;

    const socket = io(BASE_URL, {
      query: { userId: authUser.id },
    });

    socket.on("getOnlineUsers", (userIds) => set({ onlineUsers: userIds }));
    set({ socket });
  },

  disconnectSocket: () => {
    get().socket?.disconnect();
    set({ socket: null, onlineUsers: [] });
  },
}));
