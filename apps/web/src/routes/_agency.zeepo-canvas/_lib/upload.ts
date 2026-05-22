import { uploadFiles, uploadThingFileUrl } from "@/hooks/use-uploadthing";

export const uploadFile = async (file: File) => {
  const res = await uploadFiles("zeepoCanvasMedia", {
    files: [file],
  });

  if (!res || !res.length) {
    throw new Error("Failed to upload file");
  }

  return {
    url: uploadThingFileUrl(res[0]),
    type: file.type,
  };
};
