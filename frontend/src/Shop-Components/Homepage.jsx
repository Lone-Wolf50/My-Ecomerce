import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCart from "./useCart";
import { supabase } from "../Database-Server/Superbase-client.js";
import Footer from "./Footer.jsx";
import Swal from "sweetalert2";
import { Toaster, toast } from "react-hot-toast";

function Homepage() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [products, setProducts] = useState([]);
	const [user, setUser] = useState(null);
	const [userName, setUserName] = useState("");
	const [loading, setLoading] = useState(true);
	const [currentSlide, setCurrentSlide] = useState(0);
	const [currentCollectionSlide, setCurrentCollectionSlide] = useState(0);
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	const [notifications, setNotifications] = useState([]);
	const [isInboxOpen, setIsInboxOpen] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);

	const { cartCount } = useCart();
	const searchRef = useRef(null);
	const dropdownRef = useRef(null);
	const navigate = useNavigate();

	const carouselSlides = [
		{
			id: 1,
			image:
				"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1200&q=80",
			title: "Elegance Redefined",
			subtitle: "Carry your dreams in style",
			description:
				"Every woman deserves a bag that matches her ambition. Crafted with precision, designed for perfection.",
			category: "crossbody",
			categoryName: "Crossbody Collection",
		},
		{
			id: 2,
			image:
				"https://images.unsplash.com/photo-1590739225287-bd31519780c3?auto=format&fit=crop&w=1200&q=80",
			title: "Empower Your Journey",
			subtitle: "Where sophistication meets strength",
			description:
				"You are limitless. Your accessories should be too. Timeless pieces for the modern woman.",
			category: "underarm",
			categoryName: "Underarm Collection",
		},
		{
			id: 3,
			image:
				"https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=80",
			title: "Confidence in Every Step",
			subtitle: "Luxury that speaks volumes",
			description:
				"Make every moment count. Our handcrafted bags are more than accessories—they're statements.",
			category: "picnic",
			categoryName: "Summer Collection",
		},
		{
			id: 4,
			image:
				"https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=1200&q=80",
			title: "Unstoppable & Unforgettable",
			subtitle: "Designed for those who dare",
			description:
				"Excellence is not an option—it's a standard. Elevate your presence with LUXE exclusivity.",
			category: "limited",
			categoryName: "Limited Edition",
		},
	];

	const bagCategories = [
		{
			id: "crossbody",
			title: "Crossbody BAGS",
			image: "/Images/Crossbody3 250.jpg",
		},
		{ id: "underarm", title: "Underarm BAGS", image: "/Images/underarms4.jpg" },
		{ id: "picnic", title: "Summer/Picnic BAGS", image: "/Images/summer.jpg" },
		{ id: "limited", title: "Limited Edition", image: "/Images/purse2.jpg" },
	];

	const communityImages = [
		{
			id: 1,
			url: "https://images.unsplash.com/photo-1590739225287-bd31519780c3?auto=format&fit=crop&w=300&q=80",
			name: "Nina Rodriguez",
		},
		{
			id: 2,
			url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCaO_LALs2EBDmGdlSVgY5zgAkBgK-_UdMJCsbL4rRDxcNo6b2-x-JpTyIzx9fxGhwLYik_Hlc9-3ev3lpKNfcbVtkp8rce1Xuk3lrDNpHH1oIgSx7daCpPKVC5Y_YvtzLhn6FfFwJhv1z9hn87F-WmbNv824ktlhzpzYX7BwH8NWsHRzjYp59ASmc1Q5ZI_NhZfdXrscoOAvX68beROynof5d2sXZ-T-J7J5oiEFFndReSy2GrDRtpv8wdMitzv3RDaiQoyRofQNRB",
			name: "Lisa Chen",
		},
		{
			id: 3,
			url: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=300&q=80",
			name: "Zara Williams",
		},
		{
			id: 4,
			url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBNED0C7MdztWGjxuuoAXZqoJt9lpF7ktn-Wq9aC-CTZfkja91zoZu75mR3wW6ryZAvgi8TkVgDYe4I2Aid35BQ3oB9uzUkfi0gylLvRrGtETPfDxU3L3Z-aDrXM3Tr0fuwzrCu2HFfe1nEs4dAlMIukE97yGCZzaffMM8_UxVZE_S1Z5Zenpm2RyqJjrmMijwRg-wB2qWINsdaKs9OD_3OHng8zRajYxB7uZhCFCSmeQpa7bdQu2r1bSVQco5Dti3IHs8wU8QwIrkr",
			name: "Sarah Mitchell",
		},
		{
			id: 5,
			url: "https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&w=300&q=80",
			name: "Maya Johnson",
		},

		{
			id: 6,
			url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=300&q=80",
			name: "Emma Davies",
		},
	];

	const features = [
		{
			icon: "support_agent",
			title: "24/7 Support",
			description: "Round-the-clock assistance for all your luxury needs",
		},
		{
			icon: "local_shipping",
			title: "Premium Delivery",
			description: "Fast, secure shipping to your doorstep worldwide",
		},
		{
			icon: "autorenew",
			title: "Easy Returns",
			description: "5-day hassle-free return policy for your peace of mind",
		},
		{
			icon: "verified",
			title: "Authenticity Guarantee",
			description: "100% genuine products with certificate of authenticity",
		},
	];

	// Hero Carousel - Improved auto-play with smooth transitions
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
		}, 6000); // Changed to 6 seconds for better UX
		return () => clearInterval(interval);
	}, [carouselSlides.length]);

	// Collection Carousel - Improved auto-play
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentCollectionSlide((prev) => (prev + 1) % bagCategories.length);
		}, 5000); // Changed to 5 seconds
		return () => clearInterval(interval);
	}, [bagCategories.length]);

	const luxeAlert = (title, text, icon = "error") => {
		Swal.fire({
			title: title.toUpperCase(),
			text: text,
			icon: icon,
			confirmButtonColor: "#D4AF37",
			background: "#FDFBF7",
			color: "#000",
			padding: "2rem",
			customClass: {
				popup: "rounded-[2rem] border border-black/5 shadow-2xl",
				confirmButton:
					"rounded-full px-10 py-3 uppercase text-[10px] font-black tracking-widest",
				title: "font-serif italic tracking-tighter",
			},
		});
	};

	useEffect(() => {
		const checkUser = async () => {
			const { error } = await supabase.from("profiles").select("*").limit(1);
			if (error)
				luxeAlert("Vault Error", "Could not synchronize with the archive.");
		};
		checkUser();
	}, []);

	const fetchNotifications = async (userId) => {
		if (!userId || userId.length < 30) {
			console.warn("Invalid UUID provided to fetchNotifications:", userId);
			return;
		}
		const { data, error } = await supabase
			.from("site_notifications")
			.select("*")
			.eq("user_id", userId)
			.order("created_at", { ascending: false });

		if (error) {
			console.error("Fetch Error:", error.message);
			return;
		}

		if (data) {
			setNotifications(data);
			setUnreadCount(data.filter((n) => !n.is_read).length);
		}
	};

	const deleteNotification = async (id) => {
		const { error } = await supabase
			.from("site_notifications")
			.delete()
			.eq("id", id);

		if (!error) {
			setNotifications(notifications.filter((n) => n.id !== id));
			setUnreadCount((prev) => Math.max(0, prev - 1));
			toast("Notification Deleted");
		} else {
			console.error("Delete Error:", error.message);
		}
	};

	const markAsRead = async (id) => {
		const { error } = await supabase
			.from("site_notifications")
			.update({ is_read: true })
			.eq("id", id);

		if (!error) {
			setNotifications(
				notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
			);
			setUnreadCount((prev) => Math.max(0, prev - 1));
		} else {
			console.error("Mark Read Error:", error.message);
		}
	};

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsDropdownOpen(false);
			}
			// Close search dropdown when clicking outside
			if (searchRef.current && !searchRef.current.contains(event.target)) {
				setSearchQuery("");
			}
		};

		const handleScroll = () => {
			// Close search dropdown when scrolling
			if (searchQuery) {
				setSearchQuery("");
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		window.addEventListener("scroll", handleScroll);
		
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			window.removeEventListener("scroll", handleScroll);
		};
	}, [searchQuery]);

	useEffect(() => {
		const initializePage = async () => {
			try {
				setLoading(true);
				const storedEmail = sessionStorage.getItem("userEmail");

				if (storedEmail) {
					const { data: profile, error: profileError } = await supabase
						.from("profiles")
						.select("id, full_name")
						.eq("email", storedEmail)
						.maybeSingle();

					if (profileError) {
						console.error("Profile Error:", profileError.message);
					} else if (profile) {
						setUser({ email: storedEmail, id: profile.id });
						sessionStorage.setItem("userUuid", profile.id);
						setUserName(profile.full_name || "The Collector");
						fetchNotifications(profile.id);
					}
				}

				const { data: productData } = await supabase
					.from("products")
					.select("*");
				setProducts(productData || []);
			} catch (error) {
				console.error("CRITICAL SCRIPT ERROR:", error.message);
			} finally {
				setLoading(false);
			}
		};

		initializePage();

		const syncAuth = () => {
			if (!sessionStorage.getItem("userEmail")) {
				setUser(null);
				setUserName("");
				sessionStorage.removeItem("userUuid");
			}
		};

		// Prevent back navigation to login page after successful login
		const preventBackToLogin = () => {
			// Replace current state to prevent going back to login
			window.history.pushState(null, '', window.location.pathname);
		};

		preventBackToLogin();
		window.addEventListener('popstate', preventBackToLogin);
		window.addEventListener("storage", syncAuth);
		
		return () => {
			window.removeEventListener('popstate', preventBackToLogin);
			window.removeEventListener("storage", syncAuth);
		};
	}, []);

	const handleLogout = async () => {
		sessionStorage.clear();
		setUser(null);
		setUserName("");
		await supabase.auth.signOut();
		navigate("/");
	};

	const handleDeleteAccount = async () => {
		setIsDropdownOpen(false);
		Swal.fire({
			title: "TERMINATE ACCOUNT?",
			text: "Permanent action. Your history will be erased from our system.",
			icon: "warning",
			showCancelButton: true,
			confirmButtonColor: "#d33",
			confirmButtonText: "DELETE PERMANENTLY",
			background: "#FDFBF7",
			customClass: { popup: "rounded-[2rem]" },
		}).then(async (result) => {
			if (result.isConfirmed) {
				const { error: profileError } = await supabase
					.from("profiles")
					.delete()
					.eq("id", user.id);

				const { error: rpcError } = await supabase.rpc("delete_user");

				if (!profileError && !rpcError) {
					sessionStorage.clear();
					await supabase.auth.signOut();
					toast.success("Account Purged");
					navigate("/");
					window.location.reload();
				} else {
					console.error("Purge Error:", profileError || rpcError);
					luxeAlert(
						"Vault Error",
						"Could not complete termination. Contact administrator.",
					);
				}
			}
		});
	};

	const filteredProducts = products.filter((p) => {
		const name = p?.name?.toLowerCase() ?? "";
		const cat = p?.category?.toLowerCase() ?? "";
		const q = searchQuery.toLowerCase();
		return name.includes(q) || cat.includes(q);
	});

	// Manual navigation for hero carousel
	const handlePrevSlide = () => {
		setCurrentSlide((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length);
	};

	const handleNextSlide = () => {
		setCurrentSlide((prev) => (prev + 1) % carouselSlides.length);
	};

	// Manual navigation for collection carousel
	const handleCollectionNav = (index) => {
		setCurrentCollectionSlide(index);
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
				<div className="text-[#D4AF37] font-black uppercase tracking-[0.5em] animate-pulse">
					LUXE...
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#FDFBF7] text-black overflow-x-hidden select-none">
			<Toaster position="top-right" />

			{/* MOBILE SEARCH OVERLAY */}
			{isSearchOpen && (
				<div className="fixed inset-0 z-[120] bg-[#FDFBF7] flex flex-col">
					<div className="flex items-center justify-between p-6 border-b border-black/10">
						<h2 className="text-xl font-black uppercase tracking-tighter">
							Search Products
						</h2>
						<button
							onClick={() => setIsSearchOpen(false)}
							className="p-2 bg-black/5 rounded-full"
						>
							<span className="material-symbols-outlined">close</span>
						</button>
					</div>

					<div className="p-6">
						<input
							type="text"
							placeholder="Search for luxury bags..."
							className="w-full bg-white border border-black/10 rounded-2xl py-5 px-6 focus:border-[#D4AF37]/50 outline-none shadow-sm text-lg"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							autoFocus
						/>
					</div>

					<div className="flex-1 overflow-y-auto px-6">
						{searchQuery && filteredProducts.length > 0 ? (
							<div className="space-y-3">
								{filteredProducts.map((p) => (
									<Link
										key={p.id}
										to={`/product/${p.id}`}
										onClick={() => setIsSearchOpen(false)}
										className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-black/5 hover:border-[#D4AF37]/30 transition-all"
									>
										<img
											src={p.image}
											className="size-16 rounded-xl object-cover"
											alt=""
										/>
										<div>
											<span className="text-lg font-black uppercase block">
												{p.name}
											</span>
											<span className="text-sm text-[#D4AF37] font-bold">
												GH₵{p.price?.toLocaleString()}
											</span>
										</div>
									</Link>
								))}
							</div>
						) : searchQuery ? (
							<div className="text-center py-20 text-black/30">
								<span className="material-symbols-outlined text-6xl mb-4">
									search_off
								</span>
								<p className="text-sm uppercase font-bold">No products found</p>
							</div>
						) : null}
					</div>
				</div>
			)}

			{/* NOTIFICATION INBOX OVERLAY */}
			{isInboxOpen && (
				<div className="fixed inset-0 z-[110] flex items-start justify-end p-4 md:p-8">
					<div
						className="absolute inset-0 bg-black/20 backdrop-blur-sm"
						onClick={() => setIsInboxOpen(false)}
					></div>
					<div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-black/5 flex flex-col max-h-[80vh] animate-in slide-in-from-right-8 duration-500">
						<div className="p-8 border-b border-black/5 flex justify-between items-center">
							<div>
								<h2 className="text-xl font-black uppercase tracking-tighter">
									Mail
								</h2>
								<p className="text-[15px] font-bold text-[#D4AF37] uppercase tracking-widest">
									Client Notifications
								</p>
							</div>
							<button
								onClick={() => setIsInboxOpen(false)}
								className="p-2 bg-black/5 rounded-full"
							>
								<span className="material-symbols-outlined">close</span>
							</button>
						</div>

						<div className="flex-1 overflow-y-auto p-4 space-y-3">
							{notifications.length > 0 ? (
								notifications.map((n) => (
									<div
										key={n.id}
										className={`p-6 rounded-3xl border transition-all ${n.is_read ? "bg-white border-black/5 opacity-60" : "bg-[#FDFBF7] border-[#D4AF37]/20 shadow-sm"}`}
									>
										<div className="flex justify-between items-start mb-2">
											<h4 className="font-black text-xs uppercase tracking-tight">
												{n.title}
											</h4>
											{!n.is_read && (
												<div className="size-2 bg-[#D4AF37] rounded-full animate-pulse"></div>
											)}
										</div>
										<p className="text-sm text-black/60 mb-4 leading-relaxed">
											{n.message}
										</p>
										<div className="flex gap-4">
											{!n.is_read && (
												<button
													onClick={() => markAsRead(n.id)}
													className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]"
												>
													Mark Read
												</button>
											)}
											<button
												onClick={() => deleteNotification(n.id)}
												className="text-[10px] font-black uppercase tracking-widest text-red-500"
											>
												Delete
											</button>
										</div>
									</div>
								))
							) : (
								<div className="h-40 flex flex-col items-center justify-center text-black/20 italic">
									<span className="material-symbols-outlined text-4xl mb-2">
										mail_outline
									</span>
									<p>Your inbox is empty</p>
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* MOBILE SLIDER MENU */}
			<div
				className={`fixed inset-0 z-[100] transition-all duration-300 ${isMenuOpen ? "visible" : "invisible"}`}
			>
				<div
					className={`absolute inset-0 bg-black/10 backdrop-blur-md transition-opacity duration-300 ${isMenuOpen ? "opacity-100" : "opacity-0"}`}
					onClick={() => setIsMenuOpen(false)}
				></div>
				<div
					className={`absolute top-0 right-0 h-full w-[85%] max-w-xs bg-white/70 backdrop-blur-2xl border-l border-white/20 shadow-2xl transition-transform duration-500 p-8 flex flex-col ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
				>
					<button
						className="self-end mb-8 p-2 bg-black/5 rounded-full"
						onClick={() => setIsMenuOpen(false)}
					>
						<span className="material-symbols-outlined text-2xl">close</span>
					</button>
					<div className="mb-10 pb-6 border-b border-black/5">
						<p className="text-[14px] uppercase font-black text-[#D4AF37] tracking-widest mb-1">
							{user ? "Authenticated Member" : "Guest Mode"}
						</p>
						<h2 className="text-2xl font-black italic tracking-tighter text-black">
							{userName || "The Guest"}
						</h2>
					</div>
					<nav className="flex flex-col gap-2 flex-1">
						<button
							onClick={() => {
								setIsInboxOpen(true);
								setIsMenuOpen(false);
							}}
							className="flex items-center justify-between text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all"
						>
							<div className="flex items-center gap-4">
								<span className="material-symbols-outlined">mail</span> Inbox
							</div>
							{unreadCount > 0 && (
								<span className="bg-[#D4AF37] text-white size-5 rounded-full flex items-center justify-center text-[9px]">
									{unreadCount}
								</span>
							)}
						</button>

						<Link
							className="flex items-center gap-4 text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all"
							to="/shop/underarm"
							onClick={() => setIsMenuOpen(false)}
						>
							<span className="material-symbols-outlined">grid_view</span>{" "}
							Collection
						</Link>

						<Link
							className="flex items-center gap-4 text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all"
							to="/cart"
							onClick={() => setIsMenuOpen(false)}
						>
							<span className="material-symbols-outlined">shopping_bag</span>{" "}
							Bag ({cartCount})
						</Link>

						{user && (
							<Link
								className="flex items-center gap-4 text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all"
								to="/orders"
								onClick={() => setIsMenuOpen(false)}
							>
								<span className="material-symbols-outlined">package_2</span> My
								Orders
							</Link>
						)}
						
						<Link
							className="flex items-center gap-4 text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all"
							to="/support"
							onClick={() => setIsMenuOpen(false)}
						>
							<span className="material-symbols-outlined">support_agent</span> Support
						</Link>

						<Link
							className="flex items-center gap-4 text-xs font-black uppercase tracking-widest p-4 rounded-2xl hover:bg-black/5 transition-all"
							to="/reviews"
							onClick={() => setIsMenuOpen(false)}
						>
							<span className="material-symbols-outlined">reviews</span> Reviews
						</Link>
					</nav>

					<div className="mt-auto pt-6 border-t border-black/10">
						{user ? (
							<>
								<button
									onPointerDown={handleLogout}
									className="w-full flex items-center gap-4 p-4 rounded-2xl active:bg-red-50 active:scale-[0.98] transition-all mb-2"
								>
									<span className="material-symbols-outlined text-red-500">
										logout
									</span>
									<span className="text-red-500 font-black text-[14px] uppercase tracking-widest">
										LOGOUT
									</span>
								</button>
								<button
									onClick={handleDeleteAccount}
									className="w-full p-4 rounded-2xl bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-all shadow-sm"
								>
									Terminate Account
								</button>
							</>
						) : (
							<Link
								to="/login"
								onClick={() => setIsMenuOpen(false)}
								className="w-full flex items-center gap-4 p-4 bg-[#D4AF37] rounded-2xl text-white"
							>
								<span className="material-symbols-outlined">login</span>
								<span className="font-black text-[14px] uppercase tracking-widest">
									Sign In to Login
								</span>
							</Link>
						)}
					</div>
				</div>
			</div>

			{/* HEADER WITH SEARCH IN NAVBAR */}
			<header className="fixed top-0 left-0 w-full z-50 bg-[#FDFBF7]/80 backdrop-blur-xl border-b border-black/5">
				<div className="max-w-[1440px] mx-auto flex items-center justify-between px-8 py-6 gap-8">
					<h1
						className="text-2xl font-black tracking-widest cursor-pointer"
						onClick={() => navigate("/")}
					>
						LUXE
					</h1>

					{/* DESKTOP SEARCH BAR */}
					<div
						className="hidden md:flex flex-1 max-w-xl relative"
						ref={searchRef}
					>
						<input
							type="text"
							placeholder="Search luxury bags..."
							className="w-full bg-white/60 border border-black/10 rounded-full py-3 px-6 pr-12 focus:border-[#D4AF37]/50 outline-none text-sm"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
						<span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-black/40">
							search
						</span>

						{searchQuery && (
							<div className="absolute top-full left-0 w-full mt-2 bg-white border border-black/5 rounded-2xl overflow-hidden shadow-2xl z-[60] max-h-80 overflow-y-auto">
								{filteredProducts.length > 0 ? (
									filteredProducts.map((p) => (
										<Link
											key={p.id}
											to={`/product/${p.id}`}
											className="flex items-center gap-4 p-4 hover:bg-[#FDFBF7] border-b border-black/5"
											onClick={() => setSearchQuery("")}
										>
											<img
												src={p.image}
												className="size-14 rounded-xl object-cover"
												alt=""
											/>
											<div className="flex-1">
												<span className="text-sm font-black uppercase block">
													{p.name}
												</span>
												<span className="text-xs text-[#D4AF37] font-bold">
													GH₵{p.price?.toLocaleString()}
												</span>
											</div>
										</Link>
									))
								) : (
									<div className="p-6 text-center text-sm uppercase font-bold text-black/40">
										No products found
									</div>
								)}
							</div>
						)}
					</div>

					<nav className="hidden md:flex items-center gap-6">
						<Link
							className="text-[13px] font-bold uppercase tracking-[0.25em] hover:text-[#D4AF37] transition-colors"
							to="/support"
						>
							Support
						</Link>
						<Link
							className="text-[13px] font-bold uppercase tracking-[0.25em] hover:text-[#D4AF37] transition-colors"
							to="/shop/underarm"
						>
							Shop
						</Link>
						<Link
							className="text-[13px] font-bold uppercase tracking-[0.25em] hover:text-[#D4AF37] transition-colors"
							to="/reviews"
						>
							Reviews
						</Link>

						<button
							onClick={() => setIsInboxOpen(true)}
							className="relative text-[13px] font-bold uppercase tracking-[0.25em] hover:text-[#D4AF37] transition-colors flex items-center gap-2"
						>
							Inbox{" "}
							{unreadCount > 0 && (
								<span className="size-2 bg-[#D4AF37] rounded-full"></span>
							)}
						</button>

						{user ? (
							<div
								className="relative flex items-center gap-4"
								ref={dropdownRef}
							>
								<Link
									className="text-[13px] font-bold uppercase tracking-[0.25em] hover:text-[#D4AF37] transition-colors"
									to="/orders"
								>
									Orders
								</Link>
								<button
									onClick={() => setIsDropdownOpen(!isDropdownOpen)}
									className="flex items-center gap-2 group border-l border-black/10 pl-4"
								>
									<span className="text-[13px] font-black text-[#D4AF37] uppercase italic tracking-widest">
										{userName ? userName.split(" ")[0] : "Collector"}
									</span>
									<span
										className={`material-symbols-outlined text-sm transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
									>
										expand_more
									</span>
								</button>
								{isDropdownOpen && (
									<div className="absolute top-full right-0 mt-4 w-48 bg-white/90 backdrop-blur-xl border border-black/5 shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
										<button
											onClick={handleLogout}
											className="w-full flex items-center gap-3 px-6 py-4 text-[13px] font-black uppercase hover:bg-black/5 transition-colors"
										>
											<span className="material-symbols-outlined text-sm">
												logout
											</span>{" "}
											Logout
										</button>
										<button
											onClick={handleDeleteAccount}
											className="w-full flex items-center gap-3 px-6 py-4 text-[13px] font-black uppercase hover:bg-red-50 text-red-500 border-t border-black/5"
										>
											<span className="material-symbols-outlined text-sm">
												delete_forever
											</span>{" "}
											Delete
										</button>
									</div>
								)}
							</div>
						) : (
							<Link
								className="text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.3em] border border-[#D4AF37]/20 px-6 py-2 rounded-full hover:bg-[#D4AF37] hover:text-white transition-all"
								to="/login"
							>
								Sign In
							</Link>
						)}
					</nav>

					<div className="flex items-center gap-4">
						<button
							className="md:hidden p-2"
							onClick={() => setIsSearchOpen(true)}
						>
							<span className="material-symbols-outlined text-2xl">search</span>
						</button>

						<Link to="/cart" className="relative p-2">
							<span className="material-symbols-outlined text-2xl">
								shopping_bag
							</span>
							{cartCount > 0 && (
								<span className="absolute top-0 right-0 bg-[#D4AF37] text-white text-[9px] font-black size-4 flex items-center justify-center rounded-full">
									{cartCount}
								</span>
							)}
						</Link>
						<button
							className="md:hidden p-2"
							onClick={() => setIsMenuOpen(true)}
						>
							<span className="material-symbols-outlined text-3xl">menu</span>
						</button>
					</div>
				</div>
			</header>

			{/* MAIN CONTENT STARTS HERE - FULL WIDTH, NO PADDING */}
			<main className="pt-24">
				{/* HERO CAROUSEL - Full Width, Responsive Heights, Swipe on Mobile */}
				<section className="relative overflow-hidden h-[300px] md:h-[450px] lg:h-[550px] w-full">
					<div className="relative w-full h-full">
						{carouselSlides.map((slide, index) => (
							<div
								key={slide.id}
								className={`absolute inset-0 transition-all duration-700 ease-in-out ${
									index === currentSlide
										? "opacity-100 scale-100 z-10"
										: index === (currentSlide - 1 + carouselSlides.length) % carouselSlides.length
										? "opacity-0 scale-95 z-0"
										: "opacity-0 scale-105 z-0"
								}`}
								style={{
									backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.3)), url(${slide.image})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
								}}
							>
								<div className="absolute inset-0 flex items-center px-6 md:px-24 lg:px-32">
									<div className={`max-w-2xl text-white transition-all duration-700 ${
										index === currentSlide ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0"
									}`}>
										<p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.5em] text-[#D4AF37] mb-2 md:mb-4">
											{slide.subtitle}
										</p>
										<h2 className="text-2xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-none mb-3 md:mb-6">
											{slide.title}
										</h2>
										<p className="text-xs md:text-base lg:text-lg text-white/90 mb-4 md:mb-8 max-w-xl leading-relaxed hidden md:block">
											{slide.description}
										</p>
										<Link
											to={`/shop/${slide.category}`}
											className="inline-block bg-[#D4AF37] text-white px-6 md:px-10 py-2 md:py-4 rounded-full md:rounded-2xl font-black text-[10px] md:text-[12px] uppercase tracking-widest shadow-xl hover:bg-white hover:text-[#D4AF37] transition-all duration-500"
										>
											Shop {slide.categoryName}
										</Link>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Slide Indicators */}
					<div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-20">
						{carouselSlides.map((_, index) => (
							<button
								key={index}
								onClick={() => setCurrentSlide(index)}
								className={`h-1.5 md:h-2 rounded-full transition-all duration-500 ${
									index === currentSlide
										? "w-8 md:w-12 bg-[#D4AF37]"
										: "w-1.5 md:w-2 bg-white/50 hover:bg-white/80"
								}`}
							/>
						))}
					</div>

					{/* Navigation Buttons - Hidden on Mobile, Visible on Tablet/Desktop */}
					<button
						onClick={handlePrevSlide}
						className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/40 p-3 rounded-full transition-all z-20 items-center justify-center"
					>
						<span className="material-symbols-outlined text-white text-2xl lg:text-3xl">
							chevron_left
						</span>
					</button>
					<button
						onClick={handleNextSlide}
						className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/40 p-3 rounded-full transition-all z-20 items-center justify-center"
					>
						<span className="material-symbols-outlined text-white text-2xl lg:text-3xl">
							chevron_right
						</span>
					</button>
				</section>

				{/* FEATURED COLLECTIONS CAROUSEL - Full Width, Split Layout */}
				<section className="w-full py-12 md:py-16 lg:py-20 bg-white">
					<div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
						<div className="mb-8 md:mb-12">
							<h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight mb-2">
								Featured Collections
							</h2>
							<p className="text-black/60 text-sm md:text-base">
								Discover our handpicked selections
							</p>
						</div>

						<div className="relative w-full">
							{/* Mobile: 350px, Tablet: 400px, Desktop: 450px */}
							<div className="relative h-[350px] md:h-[400px] lg:h-[450px] w-full">
								{bagCategories.map((category, index) => (
									<div
										key={category.id}
										className={`absolute inset-0 transition-opacity duration-1000 ${
											index === currentCollectionSlide ? "opacity-100" : "opacity-0"
										}`}
									>
										<Link
											to={`/shop/${category.id}`}
											className="block h-full w-full"
										>
											{/* Two-column layout on tablet/desktop, stacked on mobile */}
											<div className="h-full flex flex-col md:flex-row overflow-hidden rounded-2xl md:rounded-3xl shadow-xl">
												{/* Image Section - 60% on desktop */}
												<div className="relative h-[180px] md:h-full md:w-[60%] overflow-hidden">
													<img
														src={category.image}
														alt={category.title}
														className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
													/>
													<div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/40 to-transparent"></div>
												</div>
												
												{/* Text Section - 40% on desktop */}
												<div className="flex-1 bg-[#FDFBF7] flex items-center justify-center p-6 md:p-8 lg:p-12">
													<div className="text-center md:text-left max-w-md">
														<p className="text-[#D4AF37] text-xs md:text-sm font-black uppercase tracking-[0.3em] mb-3 md:mb-4">
															Collection
														</p>
														<h3 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-tight mb-4 md:mb-6">
															{category.title}
														</h3>
														<div className="inline-flex items-center gap-2 text-black/70 hover:text-[#D4AF37] transition-colors group">
															<span className="text-sm md:text-base font-bold uppercase tracking-wider">
																Shop Now
															</span>
															<span className="material-symbols-outlined text-xl md:text-2xl group-hover:translate-x-1 transition-transform">
																arrow_forward
															</span>
														</div>
													</div>
												</div>
											</div>
										</Link>
									</div>
								))}
							</div>

							{/* Navigation Buttons - Hidden on Mobile */}
							<button
								onClick={() => handleCollectionNav((currentCollectionSlide - 1 + bagCategories.length) % bagCategories.length)}
								className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-black p-3 lg:p-4 rounded-full hover:bg-white transition-all z-10 shadow-lg items-center justify-center"
								aria-label="Previous collection"
							>
								<span className="material-symbols-outlined text-2xl lg:text-3xl">chevron_left</span>
							</button>
							<button
								onClick={() => handleCollectionNav((currentCollectionSlide + 1) % bagCategories.length)}
								className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-black p-3 lg:p-4 rounded-full hover:bg-white transition-all z-10 shadow-lg items-center justify-center"
								aria-label="Next collection"
							>
								<span className="material-symbols-outlined text-2xl lg:text-3xl">chevron_right</span>
							</button>

							{/* Collection Indicators */}
							<div className="absolute -bottom-6 md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
								{bagCategories.map((_, index) => (
									<button
										key={index}
										onClick={() => handleCollectionNav(index)}
										className={`h-1.5 md:h-2 rounded-full transition-all ${
											index === currentCollectionSlide
												? "bg-[#D4AF37] w-8 md:w-12"
												: "bg-black/30 w-1.5 md:w-2 hover:bg-black/50"
										}`}
										aria-label={`Go to collection ${index + 1}`}
									></button>
								))}
							</div>
						</div>
					</div>
				</section>

				{/* COMMUNITY SECTION */}
				<section className="max-w-[1440px] mx-auto px-8 py-20 border-t border-black/5">
					<h3 className="text-2xl font-black uppercase tracking-widest text-center mb-12 text-black">
						The Community
					</h3>
					<div className="grid grid-cols-2 md:grid-cols-6 gap-6">
						{communityImages.map((img) => (
							<div key={img.id} className="group">
								<div className="aspect-square rounded-2xl overflow-hidden border border-black/5 grayscale hover:grayscale-0 transition-all shadow-sm mb-3">
									<div
										className="w-full h-full bg-cover bg-center bg-gray-200"
										style={{ backgroundImage: `url(${img.url})` }}
									></div>
								</div>
								<p className="text-center text-[11px] font-black uppercase tracking-wider text-black/60">
									{img.name}
								</p>
							</div>
						))}
					</div>
				</section>

				{/* SHOPPING MADE EASY SECTION */}
				<section className="max-w-[1440px] mx-auto px-8 py-20 border-t border-black/5">
					<div className="text-center mb-16">
						<h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">
							Shopping Made Easy
						</h2>
						<p className="text-lg text-black/60 max-w-2xl mx-auto">
							Your satisfaction is our priority. Experience luxury shopping with
							unmatched service and quality.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
						{features.map((feature, index) => (
							<div
								key={index}
								className="flex flex-col items-center text-center p-8 bg-white/60 backdrop-blur-sm border border-black/5 rounded-[2rem] hover:shadow-xl transition-all group"
							>
								<div className="size-20 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-6 group-hover:bg-[#D4AF37] transition-all">
									<span className="material-symbols-outlined text-4xl text-[#D4AF37] group-hover:text-white transition-all">
										{feature.icon}
									</span>
								</div>
								<h4 className="text-xl font-black uppercase tracking-tight text-black mb-3">
									{feature.title}
								</h4>
								<p className="text-sm text-black/60 leading-relaxed">
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</section>

				<Footer />
			</main>
		</div>
	);
}

export default Homepage;
