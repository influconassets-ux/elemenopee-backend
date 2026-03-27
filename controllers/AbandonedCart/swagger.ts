/**
 * @swagger
 * /api/abandoned-carts:
 *   get:
 *     summary: Get all abandoned carts
 *     description: Retrieve a list of all abandoned shopping carts
 *     tags: [Abandoned Carts]
 *     responses:
 *       200:
 *         description: List of abandoned carts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AbandonedCart'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/abandoned-carts/{id}:
 *   get:
 *     summary: Get a single abandoned cart
 *     description: Retrieve a specific abandoned cart by its ID
 *     tags: [Abandoned Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Abandoned Cart ID
 *     responses:
 *       200:
 *         description: Abandoned cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AbandonedCart'
 *       404:
 *         description: Abandoned cart not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/abandoned-carts:
 *   post:
 *     summary: Create a new abandoned cart record
 *     description: Track a new abandoned shopping cart
 *     tags: [Abandoned Carts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AbandonedCart'
 *     responses:
 *       201:
 *         description: Abandoned cart record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AbandonedCart'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/abandoned-carts/{id}:
 *   put:
 *     summary: Update an abandoned cart
 *     description: Update an existing abandoned cart record by ID
 *     tags: [Abandoned Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Abandoned Cart ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AbandonedCart'
 *     responses:
 *       200:
 *         description: Abandoned cart updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AbandonedCart'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Abandoned cart not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/abandoned-carts/{id}:
 *   delete:
 *     summary: Delete an abandoned cart
 *     description: Remove an abandoned cart record from the database by ID
 *     tags: [Abandoned Carts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Abandoned Cart ID
 *     responses:
 *       200:
 *         description: Abandoned cart deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Abandoned cart deleted"
 *       404:
 *         description: Abandoned cart not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

