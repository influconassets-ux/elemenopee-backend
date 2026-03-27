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

// Helper to upload image (either Buffer or URL) to Cloudinary using unsigned upload
const uploadToCloudinary = async (fileSource: Buffer | string, filename: string): Promise<string | null> => {
    try {
        const formData = new FormData();
        
        // Cloudinary accepts a Buffer, a Base64 string, or a URL in the 'file' field
        if (Buffer.isBuffer(fileSource)) {
            formData.append("file", fileSource, { filename });
        } else {
            formData.append("file", fileSource);
        }
        
        formData.append("upload_preset", "dummy-elem-upload");

        const res = await axios.post(
            "https://api.cloudinary.com/v1_1/driz5nrim/image/upload",
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                },
                timeout: 60000 // Cloudinary can take time if fetching from a slow URL
            }
        );
        return res.data.secure_url;
    } catch (err: any) {
        console.error("Cloudinary upload error:", err?.response?.data || err.message);
        return null;
    }
};

// Detect if URL is Dropbox and convert it to a raw download link
const getDropboxDirectLink = (url: string): string | null => {
    if (!url.includes('dropbox.com')) return null;
    
    // Replace dl=0 with raw=1 if present
    if (url.includes('dl=0')) {
        return url.replace('dl=0', 'raw=1');
    }
    
    // If it already has raw=1 or dl=1, it might already be direct
    if (url.includes('raw=1') || url.includes('dl=1')) {
        return url;
    }

    // Append raw=1 if no relevant parameters found (it's safe anyway)
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}raw=1`;
};

export const fetchImagesFromDirectLinks = async (linksString: string): Promise<string[]> => {
    // Convert to string and handle any hidden characters
    const normalizedString = String(linksString).replace(/[\u200b-\u200d\ufeff]/g, '');

    // Robust way to find all URLs. Splitting by space, comma, semicolon or newline
    const links = normalizedString.match(/https?:\/\/[^\s,;]+(?:\?[^\s,;]*)?/g) || [];
    
    if (links.length === 0) {
        console.warn("[Image Extractor] No valid URLs found in:", normalizedString);
        return [];
    }

    console.log(`[Image Extractor] Found ${links.length} links:`);
    links.forEach((l, i) => console.log(`  ${i+1}: ${l}`));

    const processLink = async (url: string, index: number): Promise<string | null> => {
        let downloadUrl = '';
        let fileIdForCloudinary = `product_${Date.now()}_${index}_${Math.floor(Math.random() * 1000)}`;

        try {
            // Check if it's a Dropbox link
            if (url.includes('dropbox.com')) {
                downloadUrl = getDropboxDirectLink(url) || url;
            } 
            // Check if it's a Google Drive link
            else if (url.includes('drive.google.com')) {
                const fileId = extractFileId(url);
                if (!fileId) {
                    console.warn(`[Image Fetch] Not a valid Drive file link: ${url}`);
                    return null;
                }
                downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
            }
            // Fallback for other direct URLs
            else if (url.startsWith('http')) {
                downloadUrl = url;
            }
            else {
                return null;
            }

            console.log(`[Image Fetch] Processing: ${downloadUrl}`);
            const result = await uploadToCloudinary(downloadUrl, `${fileIdForCloudinary}.jpg`);
            if (result) {
                console.log(`[Image Fetch] Success: ${result}`);
            } else {
                console.warn(`[Image Fetch] Failed for: ${downloadUrl}`);
            }
            return result;
        } catch (err: any) {
            console.error(`[Image Fetch] Critical error for ${url}:`, err.message);
            return null;
        }
    };

    // Run all fetches in parallel
    const results = await Promise.all(links.map((link, idx) => processLink(link, idx)));
    
    // Filter out nulls and return valid URLs
    const finalImages = results.filter((url): url is string => url !== null);
    console.log(`✅ Successfully uploaded ${finalImages.length}/${links.length} images to Cloudinary`);
    return finalImages;
};
