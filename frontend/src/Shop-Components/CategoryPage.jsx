import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../Database-Server/Superbase-client.js";

import ProductCard from "./ProductCard";
import Navbar from "./Navbar";

const CategoryPage = () => {
	const { categoryName } = useParams();
	const [filteredProducts, setFilteredProducts] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchCategoryProducts = async () => {
			setLoading(true);
			try {
				const { data, error } = await supabase.from("products").select("*");

				if (error) throw error;

				const matched = data.filter((p) => {
					const categoryMatch = p.category.toLowerCase();
					const urlMatch = categoryName.toLowerCase();
					return (
						categoryMatch === urlMatch ||
						categoryMatch + "s" === urlMatch ||
						urlMatch.slice(0, -1) === categoryMatch
					);
				});

				setFilteredProducts(matched);
			} catch (error) {
				console.error("Error fetching category:", error.message);
			} finally {
				setLoading(false);
			}
		};

		fetchCategoryProducts();
	}, [categoryName]); // Re-run if the user clicks a different category

	return (
		<main className="min-h-screen bg-cream text-black-solid selection:bg-primary/20 select-none">
			<Navbar />

			{/* Header Section */}
			<div className="flex flex-col items-center gap-4 pt-20 mb-12 md:mb-20 relative px-8">
				<h1 className="text-4xl md:text-7xl font-black tracking-tighter text-black-solid uppercase text-center italic leading-none">
					{categoryName}
				</h1>

				<div className="flex items-center gap-4">
					<span className="h-[2px] w-8 bg-primary rounded-full"></span>
					<p className="text-[10px] uppercase font-black tracking-[0.4em] text-black-solid/40">
						{loading
							? "Counting..."
							: `${filteredProducts.length} Curated Pieces`}
					</p>
					<span className="h-[2px] w-8 bg-primary rounded-full"></span>
				</div>
			</div>

			{/* Products Grid */}
			<section className="max-w-[1440px] mx-auto px-4 md:px-12 pb-32">
				{loading ? (
					<div className="text-center py-40">
						<div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
						<p className="text-[10px] uppercase font-black tracking-widest text-primary">
							Accessing Vault...
						</p>
					</div>
				) : filteredProducts.length > 0 ? (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
						{filteredProducts.map((product) => (
							<ProductCard key={product.id} product={product} />
						))}
					</div>
				) : (
					<div className="text-center py-40 bg-white/40 backdrop-blur-xl rounded-[3rem] border border-black/5 mx-6">
						<span className="material-symbols-outlined text-4xl text-primary mb-4 opacity-50">
							inventory_2
						</span>
						<p className="text-black-solid/30 uppercase tracking-[0.4em] text-[11px] font-black">
							Vault Currently Empty
						</p>
					</div>
				)}
			</section>

			{/* FOOTER */}
			
		</main>
	);
};

export default CategoryPage;
