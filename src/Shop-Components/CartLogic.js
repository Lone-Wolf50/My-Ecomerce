// --- CartLogic.js ---

export const calculateTotals = (cart) => {
    // Ensure we handle empty or malformed carts
    if (!Array.isArray(cart)) return { count: 0, total: 0 };
    
    const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const total = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    return { count, total };
};

export const addItemToCart = (cart, product) => {
    // 1. Validation: Ensure product exists and has an ID
    if (!product || !product.id) return cart;

    // 2. Unify ID types (prevents "crossbody1" vs "Crossbody1" issues)
    const productId = String(product.id);
    
    const existingItem = cart.find(item => String(item.id) === productId);

    if (existingItem) {
        // 3. Update existing item
        return cart.map(item =>
            String(item.id) === productId 
                ? { ...item, quantity: (item.quantity || 1) + 1 } 
                : item
        );
    }

    // 4. ADD NEW: Deep clone the product object and set quantity to 1
    // This ensures items like "Mini Crème Crossbody" wrap below the others
    return [...cart, { ...product, quantity: 1 }];
};

export const updateItemQuantity = (cart, id, delta) => {
    return cart.map(item => {
        if (String(item.id) === String(id)) {
            const newQty = Math.max(1, (item.quantity || 1) + delta);
            return { ...item, quantity: newQty };
        }
        return item;
    });
};