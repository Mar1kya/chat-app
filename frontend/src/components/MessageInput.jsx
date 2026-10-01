import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { X, Image, Send } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { prepareImage } from "../lib/utils";

export default function MessageInput() {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, isSending } = useChatStore();

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImagePreview(await prepareImage(file));
    } catch (err) {
      toast.error(err.message);
      setImagePreview(null);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage() {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    const ok = await sendMessage({ text: text.trim(), image: imagePreview });
    if (ok) {
      setText("");
      setImagePreview(null);
    }
  }

  return (
    <div className="w-full p-4">
      {imagePreview && (
        <div className="flex items-center gap-2 mb-3">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="object-cover w-20 h-20 border rounded-lg border-zinc-700"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-base-300
              flex items-center justify-center"
              type="button"
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex items-center flex-1 gap-2">
          <input
            type="text"
            className="w-full rounded-lg input input-bordered input-sm sm:input-md"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button
            type="button"
            className={`flex btn btn-circle ${
              imagePreview ? "text-emerald-500" : "text-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Image size={20} />
          </button>
        </div>
        <button
          type="submit"
          className="btn btn-circle"
          disabled={(!text.trim() && !imagePreview) || isSending}
        >
          {isSending ? (
            <span className="loading loading-spinner size-5"></span>
          ) : (
            <Send size={22} />
          )}
        </button>
      </form>
    </div>
  );
}