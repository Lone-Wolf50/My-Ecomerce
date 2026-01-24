import { Routes, Route } from 'react-router-dom';
import Homepage from "./Homepage.jsx";
import Cart from "./Cart.jsx";
import Reviews from "./Reviews.jsx";
import CategoryPage from "./CategoryPage.jsx";
import ProductDetail from "./ProductDetail.jsx";
import Notification from "./Notification.jsx"; 

function Holder() {
  return (
    /* Ensure your tailwind config has 'background-dark' and 'off-white' defined */
    <div className="bg-black min-h-screen font-display text-off-white relative">
      
      {/* Persists across all navigation - Good for global alerts */}
      <Notification />

      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/cart" element={<Cart />} />
        
        {/* Matches <Link to={`/shop/${category.id}`}> */}
        <Route path="/shop/:categoryName" element={<CategoryPage />} />
        
        {/* UPDATED: Changed :productId to :id to align with product.id logic */}
        <Route path="/product/:id" element={<ProductDetail />} />
      </Routes>
    </div>
  );
}

export default Holder;