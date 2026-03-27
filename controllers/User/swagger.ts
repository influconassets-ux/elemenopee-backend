/**
 * @swagger
 * /api/users/sync:
 *   post:
 *     summary: Find or create a user by firebaseUid
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firebaseUid]
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *     responses:
 *       200:
 *         description: Existing user returned or new user created
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/users:
 *   put:
 *     summary: Update profile fields for authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/users/orders:
 *   get:
 *     summary: Get all orders for the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders for the user
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

/**
 * @swagger
 * /api/users/loyalcoins:
 *   get:
 *     summary: Get loyalCoin balance for authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: LoyalCoin balance returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 loyalCoin:
 *                   type: number
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */

