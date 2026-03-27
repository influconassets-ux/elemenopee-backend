# Elemenopee Backend

A Node.js backend API for the Elemenopee project built with Express, TypeScript, and MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
MONGO_URL=mongodb://localhost:27017/elemenopee
PORT=5000
```

3. Make sure MongoDB is running on your system.

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server (requires build first)
- `npm run seed` - Seed database with sample products

## Development

Run the development server:
```bash
npm run dev
```

The server will start on port 5000 (or the port specified in your .env file).

## API Documentation

Swagger documentation is available at:
```
http://localhost:5000/api-docs
```

## API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get a single product by ID
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get a single order by ID
- `POST /api/orders` - Create a new order
- `PUT /api/orders/:id` - Update an order
- `DELETE /api/orders/:id` - Delete an order

### Abandoned Carts
- `GET /api/abandoned-carts` - Get all abandoned carts
- `GET /api/abandoned-carts/:id` - Get a single abandoned cart by ID
- `POST /api/abandoned-carts` - Track a new abandoned cart
- `PUT /api/abandoned-carts/:id` - Update an abandoned cart
- `DELETE /api/abandoned-carts/:id` - Delete an abandoned cart

### System
- `GET /health` - Health check endpoint

## Build for Production

```bash
npm run build
npm start
```

## Deployment to Render

This application is configured for easy deployment to Render:

1. **Fork/Clone** this repository to your GitHub account
2. **Connect** your repository to Render
3. **Set Environment Variables**:
   - `MONGO_URL`: Your MongoDB connection string
   - `NODE_ENV`: production
   - `PORT`: Will be automatically set by Render
4. **Deploy** - Render will automatically build and deploy your application

The application includes:
- Health check endpoint at `/health`
- Dynamic port binding for cloud deployment
- Production-ready build configuration
- Automatic TypeScript compilation

### Troubleshooting Render Deployment

If you encounter "No open ports detected" error:

1. **Check Build Logs**: Ensure the build process completes successfully
2. **Verify Environment Variables**: Make sure `MONGO_URL` is set correctly
3. **Check Health Endpoint**: The `/health` endpoint should return `200 OK`
4. **Port Configuration**: Render automatically assigns the PORT environment variable
5. **Startup Script**: The application uses `start.js` for production deployment

### Alternative Deployment

- **Heroku**: Use the included `Procfile`
- **Vercel**: Configure as Node.js application
- **Railway**: Automatic deployment with included configuration
