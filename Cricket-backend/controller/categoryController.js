const categories = ['All Products', 'Cricket Bats', 'Accessories', 'MRF', 'SS TON'];

export const getCategories = async (req, res) => {
  try {
    res.json({ categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
};