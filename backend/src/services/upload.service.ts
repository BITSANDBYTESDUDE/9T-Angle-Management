import { Readable } from "node:stream";
import { cloudinary, cloudinaryConfigured } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";

export type UploadedFile = { url: string; publicId: string; name: string; type: string; size: number };
export async function uploadFile(file: Express.Multer.File, folder = "9t-angle/reports"): Promise<UploadedFile> {
  if (!cloudinaryConfigured) throw new ApiError(503, "File uploads are not configured. Add Cloudinary credentials to the server environment.");
  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: "auto", use_filename: true, unique_filename: true }, (error, uploaded) => {
      if (error || !uploaded) reject(error || new Error("Upload failed")); else resolve(uploaded);
    });
    Readable.from(file.buffer).pipe(stream);
  });
  return { url: result.secure_url, publicId: result.public_id, name: file.originalname, type: file.mimetype, size: file.size };
}
