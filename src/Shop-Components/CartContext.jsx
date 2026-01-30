import { createContext, useState, useEffect } from 'react';
import { supabase } from "../Database-Server/Superbase-client.js";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Calculate total whenever cart changes
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);

  // 1. INITIAL LOAD: Check Auth and Sync
  useEffect(() => {
    const loadInitialCart = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // If logged in, get items from Supabase
        const { data: dbItems } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', session.user.id);

        if (dbItems && dbItems.length > 0) {
          const formatted = dbItems.map(item => ({
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            material: item.material
          }));
          setCart(formatted);
          setCartCount(formatted.length);
        }
      } else {
        // If guest, get from local storage
        const savedCart = localStorage.getItem('luxe_cart');
        if (savedCart) {
          const parsed = JSON.parse(savedCart);
          setCart(parsed);
          setCartCount(parsed.length);
        }
      }
    };
    loadInitialCart();
  }, []);

  // 2. ADD TO CART: Handle Guest vs User
  const addToCart = async (product) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Check if item already exists in cart to increment quantity
    const existingItem = cart.find(item => item.id === product.id);
    let newCart;

    if (existingItem) {
      newCart = cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }

    // Database Sync for logged-in users
    if (session?.user) {
      await supabase.from('cart_items').upsert({
        user_id: session.user.id,
        product_id: product.id,
        product_name: product.name,
        price: product.price,
        image: product.image,
        material: product.material,
        quantity: existingItem ? existingItem.quantity + 1 : 1
      }, { onConflict: 'user_id, product_id' });
    } else {
      // Local storage for guests
      localStorage.setItem('luxe_cart', JSON.stringify(newCart));
    }

    setCart(newCart);
    setCartCount(newCart.length);
  };

  // 3. REMOVE FROM CART
  const removeFromCart = async (productId) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      await supabase.from('cart_items')
        .delete()
        .eq('user_id', session.user.id)
        .eq('product_id', productId);
    }

    const newCart = cart.filter(item => item.id !== productId);
    setCart(newCart);
    setCartCount(newCart.length);
    localStorage.setItem('luxe_cart', JSON.stringify(newCart));
  };

  // 4. CONFIRM ORDER: Wipe DB and Local
  const handleConfirmOrder = async (formData) => {
    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Place your Order Table insert logic here...
      console.log("Processing Order for:", formData.customer_email);

      // Success! Clear everything
      if (session?.user) {
        await supabase.from('cart_items').delete().eq('user_id', session.user.id);
      }
      
      setCart([]);
      setCartCount(0);
      localStorage.removeItem('luxe_cart');
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      cartCount, 
      cartTotal, 
      handleConfirmOrder, 
      isProcessing 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export default CartContext;