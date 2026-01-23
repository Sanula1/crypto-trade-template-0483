import { api } from "./api";
import { validateFile } from "./uploadConfig";

export interface UploadResult {
  relativePath: string;
  success: boolean;
}

export const uploadFile = async (
  file: File,
  folder: string
): Promise<UploadResult> => {
  try {
    // Validate file based on folder config
    const validation = validateFile(file, folder);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const contentType = file.type === "image/jpeg" ? "image/jpg" : file.type;

    // Step 1: Get signed URL (GET request)
    const signedUrlResponse = await api.getSignedUrl(
      folder,
      safeFileName,
      contentType,
      file.size
    );

    if (!signedUrlResponse.success) {
      throw new Error("Failed to get signed URL");
    }

    const { uploadUrl, relativePath, fields } = signedUrlResponse;

    // Step 2: Upload file using POST with form data
    const formData = new FormData();
    
    if (fields) {
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
    }
    
    formData.append("file", file);

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!uploadResponse.ok && uploadResponse.status !== 204) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    // Step 3: Verify and publish
    const verifyResponse = await api.verifyAndPublish(relativePath);
    
    if (!verifyResponse.success) {
      throw new Error("Failed to verify and publish file");
    }

    return {
      relativePath,
      success: true,
    };
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};
