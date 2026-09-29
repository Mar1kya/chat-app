import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { X, Image, Send } from "lucide-react";

export default function MessageInput() {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage, isSending } = useChatStore();

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Будь ласка, виберіть файл зображення");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }
  function removeImage(e) {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
  async function handleSendMessage(e) {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Помилка при надісланні повідомлення:", error);
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
        <div className="flex flex-1 gap-2">
          <input
            type="text"
            className="w-full rounded-lg input input-bordered input-sm sm:input-md"
            placeholder="Пише повідомлення..."
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
            className={`hidden sm:flex btn btn-circle
                     ${imagePreview ? "text-emerald-500" : "text-zinc-400"}`}
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
