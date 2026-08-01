/**
 * Unsigned Cloudinary upload - matches the pattern used elsewhere in the
 * LingoBite ecosystem (LingoBite/LingoTrace also use an unsigned preset,
 * so no backend signing step is needed).
 *
 * Requires two env vars:
 *   VITE_CLOUDINARY_CLOUD_NAME
 *   VITE_CLOUDINARY_UPLOAD_PRESET
 */

export type CloudinaryResourceType = 'image' | 'video';

export async function uploadToCloudinary(file: File, resourceType: CloudinaryResourceType): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary is not configured - missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.error?.message || 'Cloudinary upload failed');
  }

  const data = await response.json();
  return data.secure_url as string;
}
