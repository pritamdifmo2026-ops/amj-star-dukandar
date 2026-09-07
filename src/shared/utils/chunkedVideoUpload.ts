import axios from 'axios';
import apiClient from '@/api/client';

export interface ChunkedUploadProgress {
  percent: number;
  uploadedBytes: number;
  totalBytes: number;
}

export async function uploadVideoInChunks(
  file: File,
  onProgress?: (progress: ChunkedUploadProgress) => void
): Promise<string> {
  const MAX_SIZE_MB = 40;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Video file is too large. Maximum allowed size is ${MAX_SIZE_MB}MB.`);
  }

  // 1. Get presigned signature from AMJStar backend
  const signRes = await apiClient.post('/upload/video-sign');
  if (!signRes.data?.success) {
    throw new Error(signRes.data?.message || 'Failed to obtain upload authorization.');
  }

  const { uploadUrl, apiKey, timestamp, signature, folder } = signRes.data;

  // 2. Set chunk parameters (5 MB chunks)
  const CHUNK_SIZE = 5 * 1024 * 1024;
  const totalBytes = file.size;
  const totalChunks = Math.ceil(totalBytes / CHUNK_SIZE);
  const uniqueUploadId = `amj_vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  let finalUrl = '';

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalBytes);
    const chunk = file.slice(start, end);

    // Range header format: bytes 0-5242879/15000000
    const contentRange = `bytes ${start}-${end - 1}/${totalBytes}`;

    let chunkSuccess = false;
    let lastError: any = null;
    const MAX_RETRIES = 2;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const formData = new FormData();
        formData.append('file', chunk, file.name);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', folder);

        const res = await axios.post(uploadUrl, formData, {
          headers: {
            'X-Unique-Upload-Id': uniqueUploadId,
            'Content-Range': contentRange,
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress) {
              const chunkLoaded = progressEvent.loaded || 0;
              const currentTotal = Math.min(start + chunkLoaded, totalBytes);
              const percent = Math.min(99, Math.round((currentTotal / totalBytes) * 100));
              onProgress({ percent, uploadedBytes: currentTotal, totalBytes });
            }
          },
        });

        if (res.data?.secure_url || res.data?.url) {
          finalUrl = res.data.secure_url || res.data.url;
        }
        chunkSuccess = true;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`[Chunked Upload] Chunk ${i + 1}/${totalChunks} attempt ${attempt + 1} failed:`, err?.message);
        if (attempt < MAX_RETRIES) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    if (!chunkSuccess) {
      throw new Error(`Failed to upload video chunk ${i + 1}/${totalChunks}: ${lastError?.response?.data?.error?.message || lastError?.message || 'Network error'}`);
    }
  }

  if (onProgress) {
    onProgress({ percent: 100, uploadedBytes: totalBytes, totalBytes });
  }

  if (!finalUrl) {
    throw new Error('Video upload completed but no URL was returned by server.');
  }

  return finalUrl;
}
