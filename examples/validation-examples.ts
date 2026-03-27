import express from 'express';
import { validateRequest } from '../utils/validation.js';
import { UserSchemas } from '../controllers/User/schema.js';
import { ProductSchemas } from '../controllers/Product/schema.js';
import { OrderSchemas } from '../controllers/Order/schema.js';
import { AbandonedCartSchemas } from '../controllers/AbandonedCart/schema.js';

const router = express.Router();

// Example 1: Simple body validation
router.post('/create-product', 
  validateRequest({ body: ProductSchemas.create }), 
  async (req, res) => {
    // req.body is now validated and typed as ProductCreateInput
    console.log('Creating product:', req.body);
    res.json({ message: 'Product created successfully', data: req.body });
  }
);

// Example 2: Multiple validations (body + params)
router.put('/update-product/:id', 
  validateRequest({ 
    body: ProductSchemas.update, 
    params: ProductSchemas.params 
  }), 
  async (req, res) => {
    // Both req.body and req.params.id are validated
    console.log('Updating product:', req.params.id, 'with data:', req.body);
    res.json({ message: 'Product updated successfully' });
  }
);

// Example 3: Query validation with pagination and filtering
router.get('/search-products', 
  validateRequest({ query: ProductSchemas.query }), 
  async (req, res) => {
    // req.query is validated and includes pagination/filtering options
    const { page, limit, category, minPrice, maxPrice, search } = req.query;
    console.log('Search query:', { page, limit, category, minPrice, maxPrice, search });
    res.json({ message: 'Search completed', filters: req.query });
  }
);

// Example 4: Order creation with complex validation
router.post('/create-order', 
  validateRequest({ body: OrderSchemas.create }), 
  async (req, res) => {
    // req.body is validated as OrderCreateInput
    const orderData = req.body;
    console.log('Creating order for customer:', orderData.customerName);
    console.log('Order items:', orderData.items.length, 'items');
    console.log('Total amount:', orderData.total);
    res.json({ message: 'Order created successfully', orderId: 'generated-id' });
  }
);

// Example 5: User sync with validation
router.post('/sync-user', 
  validateRequest({ body: UserSchemas.sync }), 
  async (req, res) => {
    // req.body is validated as UserSyncInput
    const userData = req.body;
    console.log('Syncing user with firebaseUid:', userData.firebaseUid);
    res.json({ message: 'User synced successfully' });
  }
);

// Example 6: Abandoned cart with validation
router.post('/save-abandoned-cart', 
  validateRequest({ body: AbandonedCartSchemas.create }), 
  async (req, res) => {
    // req.body is validated as AbandonedCartCreateInput
    const cartData = req.body;
    console.log('Saving abandoned cart for:', cartData.customerEmail || cartData.customerId);
    console.log('Cart items:', cartData.items.length, 'items');
    res.json({ message: 'Abandoned cart saved successfully' });
  }
);

export default router;
