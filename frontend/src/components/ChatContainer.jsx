import { useEffect, useLayoutEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";

export default function ChatContainer() {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();

  const listRef = useRef(null);
  const stickToBottom = useRef(true); // чи користувач зараз унизу

  const scrollToBottom = (behavior = "auto") => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  const handleScroll = () => {
    const el = listRef.current;
    if (!el) return;
    stickToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useEffect(() => {
    if (!selectedUser) return;

    getMessages(selectedUser.id);
    subscribeToMessages(selectedUser.id);

    return () => unsubscribeFromMessages();
  }, [selectedUser?.id]);

  // Відкрили чат / завершилось завантаження: миттєво вниз, без анімації
  useLayoutEffect(() => {
    if (isMessagesLoading) return;
    stickToBottom.current = true;
    scrollToBottom("auto");
  }, [selectedUser?.id, isMessagesLoading]);

  // Нове повідомлення: плавно вниз, якщо ми унизу або це наше повідомлення
  useEffect(() => {
    if (isMessagesLoading || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.senderId === authUser.id || stickToBottom.current) {
      scrollToBottom("smooth");
    }
  }, [messages.length]);

  if (isMessagesLoading) {
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <ChatHeader />

      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 p-4 space-y-4 overflow-y-auto"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat ${
              message.senderId === authUser.id ? "chat-end" : "chat-start"
            }`}
          >
            <div className="chat-image avatar">
              <div className="border rounded-full size-10">
                <img
                  src={
                    message.senderId === authUser.id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="Зображення користувача"
                />
              </div>
            </div>
            <div className="mb-1 chat-header">
              <time className="ml-1 text-xs opacity-50">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className="flex flex-col chat-bubble">
              {message.image && (
                <img
                  src={message.image}
                  alt="Вкладене зображення"
                  className="sm:max-w-[200px] rounded-md mb-2"
                  onLoad={() => {
                    if (stickToBottom.current) scrollToBottom("auto");
                  }}
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
}