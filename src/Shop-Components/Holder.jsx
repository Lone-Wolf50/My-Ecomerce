import { Routes, Route } from "react-router-dom";
import Homepage from "./Homepage.jsx";
import Cart from "./Cart.jsx";
import Reviews from "./Reviews.jsx";
import CategoryPage from "./CategoryPage.jsx";
import ProductDetail from "./ProductDetail.jsx";
import Notification from "./Notification.jsx";
import CheckoutPage from "./CheckoutPage.jsx"; // [1] Import the new page
import OrderConfirmed from "./OrderConfirmed.jsx";

function Holder() {
  return (
    <div className="bg-black min-h-screen font-display text-off-white relative">
      <Notification />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/shop/:categoryName" element={<CategoryPage />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/order-confirmed" element={<OrderConfirmed />} />
        {/* [2] Add the Secure Checkout Route */}
        <Route path="/checkout" element={<CheckoutPage />} />
      </Routes>
    </div>
  );
}
export default Holder;