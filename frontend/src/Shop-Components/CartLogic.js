// --- CartLogic.js ---

export const calculateTotals = (cart) => {
    if (!Array.isArray(cart)) return { count: 0, total: 0 };
    
    const count = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const total = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    return { count, total };
};

export const addItemToCart = (cart, product) => {
    if (!product || !product.id) return cart;
    const productId = String(product.id);
    
    const existingItem = cart.find(item => String(item.id) === productId);

    if (existingItem) {
        return cart.map(item =>
            String(item.id) === productId 
                ? { ...item, quantity: (item.quantity || 1) + 1 } 
                : item
        );
    }

    return [...cart, { ...product, quantity: 1 }];
};

/**
 * FIXED: Accepts an absolute newQuantity instead of a delta.
 * This prevents the exponential jumping (e.g., 1 -> 3 -> 15).
 */
export const updateItemQuantity = (cart, id, newQuantity) => {
    return cart.map(item => {
        // Convert both to strings to ensure they match
        if (String(item.id) === String(id)) {
            const validatedQty = Math.max(1, newQuantity);
            return { ...item, quantity: validatedQty };
        }
        return item;
    });
};