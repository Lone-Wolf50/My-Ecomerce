import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import CartProvider from "./Shop-Components/CartProvider"; // REMOVED CURLY BRACES
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<BrowserRouter>
			<CartProvider>
				<App />
			</CartProvider>
		</BrowserRouter>
	</StrictMode>,
);
