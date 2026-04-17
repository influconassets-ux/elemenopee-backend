import express from "express";
import multer from "multer";
import * as xlsx from "xlsx";
import Product from "../../models/Product.js";
import { validateRequest } from "../../utils/validation.js";
import { ProductSchemas } from "./schema.js";
import { fetchImagesFromDirectLinks } from "../../utils/googleDrive.js";

const router: express.Router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

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
    const title = getVal(item, "title", ["name", "productName", "product", "item", "Product Name", "Title"]);
    const description = getVal(item, "description", ["desc", "details", "info", "Product Description", "Description"]);
    const price = getVal(item, "price", ["mrp", "cost", "originalPrice", "rate", "MRP", "Price"]);
    const discountedPrice = getVal(item, "discountedPrice", ["salePrice", "offerPrice", "discountPrice", "priceWithDiscount", "Selling Price", "sellingPrice", "Discounted Price"]);
    const discountPercent = getVal(item, "discountPercent", ["discount", "off", "percentage", "Discount %"]);
    const category = getVal(item, "category", ["cat", "collection", "type", "Category"]);
    const subCategory = getVal(item, "subCategory", ["sub-category", "subcategory", "Sub-Category", "Sub Category"]);
    const gender = getVal(item, "gender", ["Gender", "sex"]);
    const ageGroup = getVal(item, "ageGroup", ["age group", "agegroup", "Age Group", "age"]);
    const sizeString = getVal(item, "size", ["sizes", "dimension", "dimensions", "Size Range", "sizeRange", "Size"]);
    const skuId = getVal(item, "skuId", ["sku", "id", "code", "articleNumber", "SKU ID", "styleCode", "Style Code", "SKU"]);
    const variations = getVal(item, "variations", ["variants", "options", "Color Options", "colorOptions"]);
    const tagsString = getVal(item, "tags", ["keywords", "labels", "Key Features"]);
    const fabric = getVal(item, "fabric", ["Fabric", "fabricType", "Fabric Type", "Fabric Composition"]);
    const material = getVal(item, "material", ["Material", "materialType", "Material Type"]);
    const washCare = getVal(item, "washCare", ["washCare", "Wash Care", "wash method", "Wash Method", "washMethod", "Care Instructions", "careInstructions"]);
    const whatsIncluded = getVal(item, "whatsIncluded", ["whatsIncluded", "What's Included", "Whats Included", "includes", "Includes", "Package Contents", "packageContents"]);
    const styleCode = getVal(item, "styleCode", ["Style Code", "styleCode", "style code", "StyleCode"]);
    const countryOfOrigin = getVal(item, "countryOfOrigin", ["Country of Origin", "country of origin", "Country of Orig", "Origin"]);
    const sizeRange = getVal(item, "sizeRange", ["Size Range", "size range", "sizeRange"]);
    const fitType = getVal(item, "fitType", ["Fit Type", "fit type", "fitType"]);
    const length = getVal(item, "length", ["Length", "length"]);
    const topLength = getVal(item, "topLength", ["Top Length", "top length", "topLength"]);
    const chestWidth = getVal(item, "chestWidth", ["Chest Width", "chest width", "chestWidth"]);
    const chestWaist = getVal(item, "chestWaist", ["Chest Waist", "chest waist", "chestWaist", "Chest/Waist"]);
    const shoulderWidth = getVal(item, "shoulderWidth", ["Shoulder Width", "shoulder width", "shoulderWidth"]);
    const bottomLength = getVal(item, "bottomLength", ["Bottom Length", "bottom length", "bottomLength"]);
    const bottomWaist = getVal(item, "bottomWaist", ["Bottom Waist", "bottom waist", "bottomWaist"]);
    const hip = getVal(item, "hip", ["Hip", "hip"]);
    const sleeveLength = getVal(item, "sleeveLength", ["Sleeve Length", "sleeve length", "sleeveLength", "Sleeve"]);
    const neckType = getVal(item, "neckType", ["Neck Type", "neck type", "neckType", "Neck"]);
    const closureType = getVal(item, "closureType", ["Closure Type", "closure type", "closureType", "Closure"]);
    const fabricComposition = getVal(item, "fabricComposition", ["Fabric Composition", "fabric composition", "fabricComposition"]);
    const fabricType = getVal(item, "fabricType", ["Fabric Type", "fabric type", "fabricType"]);
    const gsm = getVal(item, "gsm", ["GSM", "gsm"]);
    const breathability = getVal(item, "breathability", ["Breathability", "breathability"]);
    const softness = getVal(item, "softness", ["Softness", "softness"]);
    const skinFriendly = getVal(item, "skinFriendly", ["Skin Friendly", "skin friendly", "skinFriendly", "Love/Skin Friendly"]);
    const seasonSuitability = getVal(item, "seasonSuitability", ["Season Suitability", "season suitability", "seasonSuitability", "Season"]);
    const transparent = getVal(item, "transparent", ["Transparent", "transparent"]);
    const patternPrint = getVal(item, "patternPrint", ["Pattern / Print", "Pattern", "Print", "patternPrint", "Pattern/Print"]);
    const printPlacement = getVal(item, "printPlacement", ["Print Placement", "print placement", "printPlacement"]);
    const printTechnique = getVal(item, "printTechnique", ["Print Technique", "print technique", "printTechnique"]);
    const occasion = getVal(item, "occasion", ["Occasion", "occasion"]);
    const theme = getVal(item, "theme", ["Theme", "theme"]);
    
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
      console.log(`[Bulk Row ${index}] Title: ${title || 'Unnamed'}. Fetching images from: ${driveLinks}...`);
      images = await fetchImagesFromDirectLinks(driveLinks);
    }

    // Auto-calculate discount percentage from MRP and Selling Price
    const parsedPrice = typeof price === "number" ? price : parseFloat(String(price).replace(/[^\d.-]/g, "")) || 0;
    const parsedDiscountedPrice = typeof discountedPrice === "number" ? discountedPrice : parseFloat(String(discountedPrice).replace(/[^\d.-]/g, "")) || 0;
    let parsedDiscountPercent = typeof discountPercent === "number" ? discountPercent : parseFloat(String(discountPercent || "0").replace(/[^\d.-]/g, "")) || 0;
    
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
      images: images,
      fabric: fabric ? String(fabric) : undefined,
      material: material ? String(material) : undefined,
      washCare: washCare ? String(washCare) : undefined,
      whatsIncluded: whatsIncluded ? String(whatsIncluded) : undefined,
      styleCode: styleCode ? String(styleCode) : undefined,
      countryOfOrigin: countryOfOrigin ? String(countryOfOrigin) : undefined,
      sizeRange: sizeRange ? String(sizeRange) : undefined,
      fitType: fitType ? String(fitType) : undefined,
      length: length ? String(length) : undefined,
      topLength: topLength ? String(topLength) : undefined,
      chestWidth: chestWidth ? String(chestWidth) : undefined,
      chestWaist: chestWaist ? String(chestWaist) : undefined,
      shoulderWidth: shoulderWidth ? String(shoulderWidth) : undefined,
      bottomLength: bottomLength ? String(bottomLength) : undefined,
      bottomWaist: bottomWaist ? String(bottomWaist) : undefined,
      hip: hip ? String(hip) : undefined,
      sleeveLength: sleeveLength ? String(sleeveLength) : undefined,
      neckType: neckType ? String(neckType) : undefined,
      closureType: closureType ? String(closureType) : undefined,
      fabricComposition: fabricComposition ? String(fabricComposition) : undefined,
      fabricType: fabricType ? String(fabricType) : undefined,
      gsm: gsm ? String(gsm) : undefined,
      breathability: breathability ? String(breathability) : undefined,
      softness: softness ? String(softness) : undefined,
      skinFriendly: skinFriendly ? String(skinFriendly) : undefined,
      seasonSuitability: seasonSuitability ? String(seasonSuitability) : undefined,
      transparent: transparent ? String(transparent) : undefined,
      patternPrint: patternPrint ? String(patternPrint) : undefined,
      printPlacement: printPlacement ? String(printPlacement) : undefined,
      printTechnique: printTechnique ? String(printTechnique) : undefined,
      occasion: occasion ? String(occasion) : undefined,
      theme: theme ? String(theme) : undefined
    };

    const product = new Product(productData);
    await product.save();
    
    return {
      product,
      imageLogs: images.length === 0 && driveLinks ? "Failed to fetch images" : `Fetched ${images.length} images.`
    };
  } catch (rowErr: any) {
    throw { row: index + 2, error: rowErr.message || "Failed to process row" };
  }
};

// In-memory job tracking (for development)
const jobs = new Map<string, {
  status: 'processing' | 'completed' | 'failed',
  current: number,
  total: number,
  successCount: number,
  errorCount: number,
  results: any[],
  errors: any[]
}>();

router.get("/bulk-status/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

router.post("/bulk-process-batch", async (req, res) => {
  try {
    const { items, startIndex } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "items must be an array" });
    }

    const results: any[] = [];
    const errors: any[] = [];

    const promises = items.map((item, idx) => 
      processRow(item, (startIndex || 0) + idx).then(res => {
        const p = res.product;
        results.push({
          id: p._id || p.id,
          title: p.title,
          imageCount: p.images?.length || 0,
          log: res.imageLogs
        });
      }).catch(e => {
        errors.push(e);
      })
    );

    await Promise.all(promises);

    res.status(200).json({
      successCount: results.length,
      errorCount: errors.length,
      results,
      errors
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/bulk-upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    const jobId = `job_${Date.now()}`;
    jobs.set(jobId, {
      status: 'processing',
      current: 0,
      total: data.length,
      successCount: 0,
      errorCount: 0,
      results: [],
      errors: []
    });

    // Process in background
    (async () => {
      const job = jobs.get(jobId)!;
      const batchSize = 15;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        const batchPromises = batch.map((row, idx) => 
          processRow(row, i + idx).then(res => {
            const p = res.product;
            job.successCount++;
            job.current++;
            job.results.push({
              id: p._id || p.id,
              title: p.title,
              imageCount: p.images?.length || 0,
              log: res.imageLogs
            });
          }).catch(e => {
            job.errorCount++;
            job.current++;
            job.errors.push(e);
          })
        );
        
        await Promise.all(batchPromises);
      }
      
      job.status = 'completed';
      // Clean up old jobs after 1 hour
      setTimeout(() => jobs.delete(jobId), 3600000);
    })().catch(err => {
      const job = jobs.get(jobId);
      if (job) job.status = 'failed';
      console.error(`Background job ${jobId} failed:`, err);
    });

    res.status(202).json({
      message: "Bulk upload started in background",
      jobId
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
      const products = await Product.find();
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
