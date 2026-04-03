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
                timeout: 20000,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,image/*,*/*;q=0.8"
                },
            });

            const contentType = response.headers['content-type'] || '';
            const byteLength = response.data?.byteLength || 0;

            if (contentType.includes('text/html') || byteLength < 1000) {
                console.warn(`[Image Download] ⚠️ Warning: Link returned a webpage/small file instead of an image. Content-Type: ${contentType}`);
                if (fetchUrl.includes('dropbox.com')) {
                    console.warn(`[Dropbox Alert] 🔒 This link might be PRIVATE or requires a login. Ensure it's set to "Anyone with the link".`);
                }
                continue; // Try next fallback if exists
            }

            const buffer = Buffer.from(response.data);
            const header = buffer.toString('hex', 0, 4);
            const isValidImage = /^(ffd8ff|89504e47|47494638|52494646)/.test(header);
            
            if (isValidImage) {
                console.log(`[Image Download] ✅ Success! Fetched ${byteLength} bytes (${contentType})`);
                return buffer;
            } else {
                console.warn(`[Image Download] ⚠️ File is not a valid image format. Header: ${header}`);
            }
        } catch (err: any) {
            console.warn(`[Image Download Failed] ${err.message} (Status: ${err.response?.status || 'N/A'})`);
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
        if (JSON.stringify(errorData).includes("Quota exceeded") || JSON.stringify(errorData).includes("Over limit")) {
            console.error("🚨 CRITICAL: Cloudinary account (driz5nrim) is OVER QUOTA. No more images can be uploaded.");
        } else {
            console.error("Cloudinary Error Log:", JSON.stringify(errorData || err.message));
        }
        return null;
    }
};

// Advanced Dropbox Transformer
const getDropboxDirectLink = (url: string): string | null => {
    if (!url.includes('dropbox.com')) return null;
    
    // Convert shortlinks or restricted links
    let directUrl = url.split('?')[0];
    
    // Handle rlkey for shared links
    const rlkeyMatch = url.match(/rlkey=([a-zA-Z0-9_-]+)/);
    const rlkeyParam = rlkeyMatch ? `&rlkey=${rlkeyMatch[1]}` : '';
    
    // Dropbox direct serving endpoints
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
            let imageBuffer: Buffer | null = null;
            let finalUrl = url.startsWith('www.') ? `https://${url}` : url;

            if (finalUrl.includes('drive.google.com') || finalUrl.includes('docs.google.com')) {
                const fileId = extractFileId(finalUrl) || '';
                if (!fileId) return null;
                imageBuffer = await downloadImageAsBuffer('', fileId);
            } 
            else if (finalUrl.includes('dropbox.com')) {
                const downloadUrl = getDropboxDirectLink(finalUrl) || finalUrl;
                imageBuffer = await downloadImageAsBuffer(downloadUrl);
            }
            else {
                imageBuffer = await downloadImageAsBuffer(finalUrl);
            }

            if (imageBuffer) {
                return await uploadToCloudinary(imageBuffer, `import_${Date.now()}_${index}.jpg`);
            } else {
                console.log(`[Processor] Local download failed for ${finalUrl.substring(0, 30)}...`);
                return null;
            }
        } catch (err: any) {
            console.error(`[Processor] Row Fetch Error:`, err.message);
            return null;
        }
    };

    const results = await Promise.all(links.map((link, idx) => processLink(link, idx)));
    return results.filter((url): url is string => !!url);
};
