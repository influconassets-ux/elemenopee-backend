import axios from "axios";
import FormData from "form-data";

// Extract File ID from various Google Drive direct link formats
export const extractFileId = (url: string): string | null => {
    if (!url) return null;
    console.log("Extracting ID from URL:", url);

    // Check for folder links (which won't work with this direct download method)
    if (url.includes('/folders/')) {
        console.warn("WARNING: This looks like a FOLDER link, not a direct FILE link. Folder links are not supported for image fetching.");
        return null;
    }

    // Format: https://drive.google.com/file/d/FILE_ID/view
    const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD) {
        console.log("Found ID via /d/:", matchD[1]);
        return matchD[1];
    }

    // Format: https://drive.google.com/open?id=FILE_ID
    const matchId = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (matchId) {
        console.log("Found ID via id=:", matchId[1]);
        return matchId[1];
    }

    console.log("No File ID found in URL");
    return null;
};

// Helper to download image with multiple format fallbacks and status reporting
const downloadImageAsBuffer = async (url: string, fileId?: string): Promise<Buffer | null> => {
    const urlsToTry = fileId ? [
        `https://lh3.googleusercontent.com/d/${fileId}`,
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`
    ] : [url];

    for (const fetchUrl of urlsToTry) {
        try {
            console.log(`[Image Download] Attempting fetch: ${fetchUrl.substring(0, 70)}...`);
            const response = await axios.get(fetchUrl, {
                responseType: "arraybuffer",
                timeout: 8000, // Reduced from 20s to 8s
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
                },
            });

            const contentType = response.headers['content-type'] || '';
            const byteLength = response.data?.byteLength || 0;

            if (contentType.includes('text/html') || byteLength < 1000) {
                console.warn(`[Image Download] ⚠️ Warning: Link returned a webpage/small file instead of an image. Content-Type: ${contentType}`);
                continue; 
            }

            const buffer = Buffer.from(response.data);
            const header = buffer.toString('hex', 0, 4);
            const isValidImage = /^(ffd8ff|89504e47|47494638|52494646)/.test(header);
            
            if (isValidImage) {
                console.log(`[Image Download] ✅ Success! Fetched ${byteLength} bytes (${contentType})`);
                return buffer;
            }
        } catch (err: any) {
            console.warn(`[Image Download Failed] ${err.message}`);
        }
    }
    return null;
};

// Helper to upload to Cloudinary with Quota Detection
const uploadToCloudinary = async (fileSource: Buffer | string, filename: string): Promise<string | null> => {
    try {
        const formData = new FormData();
        if (Buffer.isBuffer(fileSource)) {
            formData.append("file", fileSource, { filename, contentType: 'image/jpeg' });
        } else {
            // If it's a URL (string), Cloudinary can fetch it directly
            formData.append("file", fileSource);
        }
        
        formData.append("upload_preset", "dummy-elem-upload");

        const res = await axios.post(
            "https://api.cloudinary.com/v1_1/driz5nrim/image/upload",
            formData,
            { headers: { ...formData.getHeaders() } }
        );
        return res.data.secure_url;
    } catch (err: any) {
        const errorData = err?.response?.data;
        console.error("Cloudinary Error:", errorData?.error?.message || err.message);
        return null;
    }
};

// Advanced Dropbox Transformer
const getDropboxDirectLink = (url: string): string | null => {
    if (!url.includes('dropbox.com')) return null;
    let directUrl = url.split('?')[0];
    const rlkeyMatch = url.match(/rlkey=([a-zA-Z0-9_-]+)/);
    const rlkeyParam = rlkeyMatch ? `&rlkey=${rlkeyMatch[1]}` : '';
    
    if (directUrl.includes('www.dropbox.com')) {
        return directUrl + '?raw=1' + rlkeyParam;
    } else {
        return directUrl.replace('dropbox.com', 'dl.dropboxusercontent.com') + (rlkeyParam ? '?' + rlkeyParam.substring(1) : '');
    }
};

export const fetchImagesFromDirectLinks = async (linksString: string): Promise<string[]> => {
    if (!linksString || typeof linksString !== 'string') return [];

    const normalizedString = linksString.replace(/[\u200b-\u200d\ufeff]/g, '').trim();
    const links = normalizedString.match(/(?:https?:\/\/|www\.)[^\s,;|]+(?:\?[^\s,;|]*)?/g) || [];
    
    if (links.length === 0) return [];

    const processLink = async (url: string, index: number): Promise<string | null> => {
        try {
            let finalUrl = url.startsWith('www.') ? `https://${url}` : url;

            // 1. If it's a Dropbox link, we can just give Cloudinary the direct URL
            if (finalUrl.includes('dropbox.com')) {
                const downloadUrl = getDropboxDirectLink(finalUrl);
                if (downloadUrl) {
                    console.log("[Processor] Passing direct Dropbox link to Cloudinary");
                    return await uploadToCloudinary(downloadUrl, `dropbox_${index}`);
                }
            }

            // 2. If it's a Google Drive link, we unfortunately often still need the buffer 
            // because of Drive's internal redirects/auth hurdles, but let's try to optimize it
            if (finalUrl.includes('drive.google.com') || finalUrl.includes('docs.google.com')) {
                const fileId = extractFileId(finalUrl);
                if (!fileId) return null;
                
                // Try passing the direct content link to Cloudinary first? 
                // Actually, let's stick to buffer for Drive as it's more reliable for private-ish links
                const imageBuffer = await downloadImageAsBuffer('', fileId);
                if (imageBuffer) {
                    return await uploadToCloudinary(imageBuffer, `drive_${Date.now()}_${index}.jpg`);
                }
            } 
            
            // 3. For any other direct image URI, let Cloudinary fetch it directly
            if (finalUrl.match(/\.(jpg|jpeg|png|webp|gif|avif)($|\?)/i)) {
                console.log("[Processor] Passing direct Image link to Cloudinary");
                return await uploadToCloudinary(finalUrl, `direct_${index}`);
            }

            // 4. Default: Download buffer then upload
            const imageBuffer = await downloadImageAsBuffer(finalUrl);
            if (imageBuffer) {
                return await uploadToCloudinary(imageBuffer, `import_${Date.now()}_${index}.jpg`);
            }
            
            return null;
        } catch (err: any) {
            console.error(`[Processor] Error:`, err.message);
            return null;
        }
    };

    // Keep concurrency controlled to avoid saturating Cloudinary or local bandwidth
    // Use a small delay between link processing if needed, but for now Promise.all is fine for a few links
    const results = await Promise.all(links.slice(0, 10).map((link, idx) => processLink(link, idx)));
    return results.filter((url): url is string => !!url);
};
