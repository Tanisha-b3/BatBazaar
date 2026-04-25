export const CATEGORIES = ['All Products', 'Cricket Bats', 'Accessories', 'MRF', 'SS TON'];

export const CATEGORY_MAP = {
  'Cricket Bats': 'bats',
  'Accessories': 'accessories',
  'MRF': 'mrf',
  'SS TON': 'ss'
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};

export const SAMPLE_PRODUCTS = [
  { name: 'SS Kashmir Willow Cricket Full Kit', price: 120, old_price: 180, category: 'bats', image: '/bat1.png', rating: 4.5, reviews: 50 },
  { name: 'MRF Kashmir Willow Cricket Bat', price: 100, old_price: 190, category: 'bats', image: '/bat2.png', rating: 4.7, reviews: 89 },
  { name: 'SS TON Cricket Kit', price: 410, old_price: 800, category: 'bats', image: '/bat3.png', rating: 4.8, reviews: 120 },
  { name: 'Cricket Helmet', price: 210, old_price: 280, category: 'accessories', image: '/helmet.png', rating: 4.9, reviews: 56 },
  { name: 'Cricket Stumps', price: 80, old_price: 180, category: 'accessories', image: '/stumps.png', rating: 4.6, reviews: 203 },
  { name: 'Cricket Kit', price: 120, old_price: 180, category: 'accessories', image: '/kit.png', rating: 4.5, reviews: 78 },
  { name: 'Cricket Bat', price: 100, old_price: 190, category: 'bats', image: '/bat2.png', rating: 4.4, reviews: 45 },
  { name: 'Cricket Stumps Set', price: 410, old_price: 800, category: 'accessories', image: '/stumps.png', rating: 4.7, reviews: 92 },
  { name: 'Cricket Gloves', price: 210, old_price: 280, category: 'accessories', image: '/gloves.png', rating: 4.8, reviews: 167 },
  { name: 'Cricket Pads', price: 150, old_price: 200, category: 'accessories', image: '/stumps.png', rating: 4.6, reviews: 67 }
];