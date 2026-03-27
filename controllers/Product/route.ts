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

    const batchSize = 15;
    const results: any[] = [];
    const errors: any[] = [];

    // Helper to get value from row case-insensitively
    const getVal = (row: any, key: string) => {
      const actualKey = Object.keys(row).find(k =>
        k.toLowerCase().replace(/\s/g, '') === key.toLowerCase().replace(/\s/g, '')
      );
      return actualKey ? row[actualKey] : undefined;
    };

    // Helper to process a single row
    const processRow = async (row: any, index: number) => {
      try {
        const item = row as any;
        const title = getVal(item, "title");
        const description = getVal(item, "description");
        const price = getVal(item, "price");
        const discountedPrice = getVal(item, "discountedPrice");
        const discountPercent = getVal(item, "discountPercent");
        const category = getVal(item, "category");
        const sizeString = getVal(item, "size");
        const skuId = getVal(item, "skuId");
        const variations = getVal(item, "variations");
        const tagsString = getVal(item, "tags");
        const driveLinks = getVal(item, "googleDriveImageLinks") || getVal(item, "imageLinks") || getVal(item, "productImages");

        let images: string[] = [];
        if (driveLinks) {
          images = await fetchImagesFromDirectLinks(driveLinks);
        }

        console.log(`[Bulk Row ${index + 2}] Title: ${title}, Images Fetched: ${images.length}`);

        const productData = {
          title: title,
          description: description,
          price: typeof price === "number" ? price : parseFloat(String(price)) || 0,
          discountedPrice: typeof discountedPrice === "number" ? discountedPrice : parseFloat(String(discountedPrice)) || 0,
          discountPercent: typeof discountPercent === "number" ? discountPercent : parseFloat(String(discountPercent)) || 0,
          category: category,
          size: typeof sizeString === "string" ? sizeString.split(",").map((s: string) => s.trim()) : [],
          skuId: skuId,
          variations: variations,
          tags: typeof tagsString === "string" ? tagsString.split(",").map((t: string) => t.trim()) : [],
          imageUrl: images.length > 0 ? images[0] : undefined,
          images: images
        };

        const product = new Product(productData);
        await product.save();
        return product;
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
        processRow(row, i + idx).then(p => results.push(p)).catch(e => errors.push(e))
      );
      
      await Promise.all(batchPromises);
    }

    res.status(200).json({
      message: "Bulk upload processed",
      successCount: results.length,
      errorCount: errors.length,
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
