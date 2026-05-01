import { uploadFiles } from "@/hooks/use-uploadthing";

export const uploadFile = async (file: File) => {
  const res = await uploadFiles("zeepoCanvasMedia", {
    files: [file],
  });

  if (!res || !res.length) {
    throw new Error("Failed to upload file");
  }

  return {
    url: res[0].url,
    type: file.type,
  };
};
