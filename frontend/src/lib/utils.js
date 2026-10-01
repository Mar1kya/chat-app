export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, 
  });
}

export function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (error?.response?.status === 413
      ? "The file is too large"
      : "Something went wrong, please try again")
  );
}

const MB = 1024 * 1024;

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read the file"));
    reader.readAsDataURL(file);
  });
}

function compressToJpeg(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#fff"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read the image"));
    };
    img.src = url;
  });
}

export async function prepareImage(
  file,
  {
    maxGifBytes = 5 * MB,
    maxInputBytes = 15 * MB,
    skipBelowBytes = 700 * 1024,
    maxSize = 1280,
    quality = 0.8,
  } = {}
) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Select an image file");
  }

  if (file.type === "image/gif") {
    if (file.size > maxGifBytes) {
      throw new Error(`GIF is too large (max ${Math.round(maxGifBytes / MB)} MB)`);
    }
    return readAsDataURL(file);
  }

  if (file.size > maxInputBytes) {
    throw new Error(`Image is too large (max ${Math.round(maxInputBytes / MB)} MB)`);
  }

  if (file.size <= skipBelowBytes) return readAsDataURL(file);

  return compressToJpeg(file, maxSize, quality);
}