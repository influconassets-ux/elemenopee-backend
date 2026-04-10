import express from "express";
import multer from "multer";
import * as xlsx from "xlsx";
import Product from "../../models/Product.js";
import { validateRequest } from "../../utils/validation.js";
import { ProductSchemas } from "./schema.js";
import { fetchImagesFromDirectLinks } from "../../utils/googleDrive.js";

const router: express.Router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/bulk-upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const batchSize = 5; // Reduced from 15 to improve reliability and prevent timeouts
    const results: any[] = [];
    const errors: any[] = [];

    // Helper to get value from row case-insensitively
    // Helper to get value from row using multiple keywords/aliases
    const getVal = (row: any, key: string, aliases: string[] = []) => {
      const keysToTry = [key, ...aliases].map(k => k.toLowerCase().replace(/\s/g, ''));
      const actualKey = Object.keys(row).find(k =>
        keysToTry.includes(k.toLowerCase().replace(/\s/g, ''))
      );
      return actualKey ? row[actualKey] : undefined;
    };

    // Helper to process a single row
    const processRow = async (row: any, index: number) => {
      try {
        const item = row as any;
        const title = getVal(item, "title", ["name", "productName", "product", "item", "Product Name"]);
        const description = getVal(item, "description", ["desc", "details", "info", "Product Description"]);
        const price = getVal(item, "price", ["mrp", "cost", "originalPrice", "rate", "MRP"]);
        const discountedPrice = getVal(item, "discountedPrice", ["salePrice", "offerPrice", "discountPrice", "priceWithDiscount", "Selling Price", "sellingPrice"]);
        const discountPercent = getVal(item, "discountPercent", ["discount", "off", "percentage"]);
        const category = getVal(item, "category", ["cat", "collection", "type", "Category"]);
        const subCategory = getVal(item, "subCategory", ["sub-category", "subcategory", "Sub-Category", "Sub Category"]);
        const gender = getVal(item, "gender", ["Gender", "sex"]);
        const ageGroup = getVal(item, "ageGroup", ["age group", "agegroup", "Age Group", "age"]);
        const sizeString = getVal(item, "size", ["sizes", "dimension", "dimensions", "Size Range", "sizeRange"]);
        const skuId = getVal(item, "skuId", ["sku", "id", "code", "articleNumber", "SKU ID", "styleCode", "Style Code"]);
        const variations = getVal(item, "variations", ["variants", "options", "Color Options", "colorOptions"]);
        const tagsString = getVal(item, "tags", ["keywords", "labels", "Key Features"]);
        
        // Support both comma-separated links column AND individual Photo 1-5 columns
        const rawDriveLinks = getVal(item, "googleDriveImageLinks", [
          "imageLinks", "productImages", "imageUrl", "images", "googleDriveLinks", 
          "image", "imageLink", "img", "photoLinks", "photos", "link", 
          "googleDriveImageLinks / imageLinks"
        ]);
        
        // If no single links column, try individual Photo columns
        let driveLinks = rawDriveLinks ? String(rawDriveLinks) : "";
        if (!driveLinks.trim()) {
          const photoLinks: string[] = [];
          for (let p = 1; p <= 5; p++) {
            const photo = getVal(item, `Photo ${p}`, [`photo${p}`, `image${p}`, `Photo${p}`]);
            if (photo && String(photo).trim()) {
              photoLinks.push(String(photo).trim());
            }
          }
          if (photoLinks.length > 0) {
            driveLinks = photoLinks.join(",");
          }
        }

        let images: string[] = [];
        if (driveLinks && driveLinks.trim() !== "") {
          console.log(`[Bulk Row ${index + 2}] Title: ${title || 'Unnamed'}. Fetching images from: ${driveLinks}...`);
          images = await fetchImagesFromDirectLinks(driveLinks);
        } else {
          console.log(`[Bulk Row ${index + 2}] Title: ${title || 'Unnamed'}. NO IMAGE LINK FOUND in columns: ${Object.keys(item).join(", ")}`);
        }
 
        console.log(`[Bulk Row ${index + 2}] Title: ${title}, Images Fetched: ${images.length}`);

        // Auto-calculate discount percentage from MRP and Selling Price
        const parsedPrice = typeof price === "number" ? price : parseFloat(String(price).replace(/[^\d.-]/g, "")) || 0;
        const parsedDiscountedPrice = typeof discountedPrice === "number" ? discountedPrice : parseFloat(String(discountedPrice).replace(/[^\d.-]/g, "")) || 0;
        let parsedDiscountPercent = typeof discountPercent === "number" ? discountPercent : parseFloat(String(discountPercent || "0").replace(/[^\d.-]/g, "")) || 0;
        
        // Auto-calc if not provided but MRP & SP are available
        if (!parsedDiscountPercent && parsedPrice > 0 && parsedDiscountedPrice > 0 && parsedDiscountedPrice < parsedPrice) {
          parsedDiscountPercent = Math.round(((parsedPrice - parsedDiscountedPrice) / parsedPrice) * 100);
        }

        const productData = {
          title: title,
          description: description,
          price: parsedPrice,
          discountedPrice: parsedDiscountedPrice,
          discountPercent: parsedDiscountPercent,
          category: category ? String(category).toLowerCase() : undefined,
          subCategory: subCategory ? String(subCategory).toLowerCase() : undefined,
          gender: gender ? String(gender).toLowerCase() : undefined,
          ageGroup: ageGroup ? String(ageGroup).toLowerCase() : undefined,
          size: typeof sizeString === "string" ? sizeString.split(",").map((s: string) => s.trim()) : [],
          skuId: skuId,
          variations: variations,
          tags: typeof tagsString === "string" ? tagsString.split(",").map((t: string) => t.trim()) : [],
          imageUrl: images.length > 0 ? images[0] : undefined,
          images: images
        };

        const product = new Product(productData);
        await product.save();
        
        return {
          product,
          imageLogs: images.length === 0 && driveLinks ? "Failed to fetch any images from the provided links. Check if links are public or if Cloudinary quota is full." : `Successfully fetched ${images.length} images.`
        };
      } catch (rowErr: any) {
        console.error(`[Bulk Row ${index + 2}] Error:`, rowErr.error || rowErr.message);
        throw { row: index + 2, error: rowErr.message || "Failed to process row" };
      }

    };

    // Process in batches
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1} (${batch.length} rows)...`);
      
      const batchPromises = batch.map((row, idx) => 
        processRow(row, i + idx).then(res => {
          const p = res.product;
          results.push({
            id: p._id || p.id,
            title: p.title,
            imageCount: p.images?.length || 0,
            hasThumbnail: !!p.imageUrl,
            log: res.imageLogs
          });
        }).catch(e => {
          errors.push(e);
        })
      );
      
      await Promise.all(batchPromises);
    }

    const totalImages = results.reduce((sum, r) => sum + r.imageCount, 0);

    const diagnostic = (results.length > 0 && totalImages === 0) 
      ? {
          message: "No images found in any products. Double-check your column headers.",
          detectedHeaders: Object.keys(data[0] || {}),
          sampleData: data[0]
        } : null;

    res.status(200).json({
      message: "Bulk upload processed",
      successCount: results.length,
      errorCount: errors.length,
      totalImagesFetched: totalImages,
      diagnostic,
      errors
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});


router.get("/",
  validateRequest({ query: ProductSchemas.query }),
  async (req, res) => {
    try {
      const products = await Product.find().select("-description");
      res.json(products);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

router.get("/:id",
  validateRequest({ params: ProductSchemas.params }),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  }
);

router.post("/",
  validateRequest({ body: ProductSchemas.create }),
  async (req, res) => {
    try {
      const product = new Product(req.body);
      await product.save();
      res.status(201).json(product);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      res.status(400).json({ error: errorMessage });
    }
  }
);

router.put("/:id",
  validateRequest({
    params: ProductSchemas.params,
    body: ProductSchemas.update
  }),
  async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
      res.json(product);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      res.status(400).json({ error: errorMessage });
    }
  }
);

router.delete("/bulk-delete", async (req, res) => {
  try {
    await Product.deleteMany({});
    res.json({ message: "All products deleted" });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    res.status(500).json({ error: errorMessage });
  }
});

router.delete("/:id",
  validateRequest({ params: ProductSchemas.params }),
  async (req, res) => {
    try {
      await Product.findByIdAndDelete(req.params.id);
      res.json({ message: "Product deleted" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      res.status(400).json({ error: errorMessage });
    }
  }
);

export default router;
