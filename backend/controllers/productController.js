const Product = require('../models/Product');

const fallbackProducts = [
  {
    _id: 'demo-1',
    name: 'Pink Kawaii Notepad',
    description: 'Cute pink kawaii digital notepad with heart designs',
    price: 299,
    category: 'notebooks',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop',
    fileUrl: '#',
    fileName: 'pink-kawaii-notepad.pdf',
    active: true
  },
  {
    _id: 'demo-2',
    name: 'Horror Ghostface Notepad',
    description: 'Dark themed horror notepad with ghostface design',
    price: 249,
    category: 'notebooks',
    image: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&h=300&fit=crop',
    fileUrl: '#',
    fileName: 'ghostface-notepad.pdf',
    active: true
  },
  {
    _id: 'demo-3',
    name: 'Astronauta Digital Planner',
    description: 'Space themed digital planner with astronaut designs',
    price: 349,
    category: 'planners',
    image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=300&fit=crop',
    fileUrl: '#',
    fileName: 'astronauta-planner.pdf',
    active: true
  }
];

const sendFallbackProducts = (res, filter) => {
  const products = filter
    ? fallbackProducts.filter(p => p.category === filter && p.active !== false)
    : fallbackProducts.filter(p => p.active !== false);
  res.json(products);
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({ active: true });
    if (!products || products.length === 0) {
      return sendFallbackProducts(res);
    }
    res.json(products);
  } catch (error) {
    return sendFallbackProducts(res);
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      const fallback = fallbackProducts.find(p => p._id === req.params.id || p.name === req.params.id);
      if (!fallback) {
        return res.status(404).json({ message: 'Product not found' });
      }
      return res.json(fallback);
    }
    res.json(product);
  } catch (error) {
    const fallback = fallbackProducts.find(p => p._id === req.params.id || p.name === req.params.id);
    if (!fallback) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(fallback);
  }
};

// Create product (Admin)
exports.createProduct = async (req, res) => {
  const product = new Product(req.body);
  try {
    const newProduct = await product.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update product (Admin)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    Object.assign(product, req.body);
    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete product (Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await Product.deleteOne({ _id: req.params.id });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({
      category: req.params.category,
      active: true
    });
    if (!products || products.length === 0) {
      return sendFallbackProducts(res, req.params.category);
    }
    res.json(products);
  } catch (error) {
    return sendFallbackProducts(res, req.params.category);
  }
};
