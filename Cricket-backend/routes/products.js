import express from 'express';
import { getProductById, getProducts, getTopSellers, getProductReviews, getRelatedProducts, rateProduct, getAllReviews, getRecommendedForUser, getFrequentlyBoughtTogether } from '../controller/productController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProducts);
router.get('/topsellers', getTopSellers);
router.get('/recommended', auth, getRecommendedForUser);
router.get('/frequently-bought', getFrequentlyBoughtTogether);
router.get('/reviews', getAllReviews);
router.get('/:id', getProductById);
router.get('/:id/reviews', getProductReviews);
router.get('/:id/related', getRelatedProducts);
router.post('/:id/review', auth, rateProduct);

export default router;