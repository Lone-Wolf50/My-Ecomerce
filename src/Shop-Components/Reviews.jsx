import { useState } from "react";
import Navbar from './Navbar.jsx';

function Review() {
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const REVIEWS = [
		{
			id: 1,
			name: "Mila Waters",
			date: "Oct 12, 2023",
			title: "An Ethereal Masterpiece",
			content:
				"The craftsmanship is surprisingly resilient. I've used it daily for my city commute and it looks as pristine as the day I unboxed it. The structure is architectural yet fluid. It's not just Link bag; it's Link conversation starter at every cafe I visit.",
			helpfulCount: 24,
			verified: true,
			rating: 5,
		},
		{
			id: 2,
			name: "Sarah Ross",
			date: "Sept 28, 2023",
			title: "Luxury as it should be",
			content:
				"Customer service was exceptional when I needed to change my order address last minute. The clutch itself is Link masterpiece. Worth every penny for the quality of the premium hardware finish. It pairs beautifully with my silk evening gowns.",
			helpfulCount: 18,
			verified: true,
			rating: 5,
		},
		{
			id: 3,
			name: "Eleanor Vance",
			date: "Sept 15, 2023",
			title: "Timeless Investment",
			content:
				"The minimalism of the design is what drew me in, but the utility is what made me stay. The internal compartments are perfectly sized for modern essentials. The finish is treated beautifully, maintaining its luminous quality through the seasons.",
			helpfulCount: 42,
			verified: true,
			rating: 5,
		},
	];

	return (
		<div className="select-none">
			<div className="flex flex-col min-h-screen max-w-[600px] mx-auto bg-modern-black relative shadow-2xl border-x border-slate-grey/20">
				<Navbar />
				<main className="flex-grow bg-primary-black">
					<section className="max-w-[1200px] mx-auto px-6 pt-20 pb-20">
						<div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 border-b border-white/10 pb-24">
							<div className="text-center lg:text-left">
								<h1 className="font-editorial text-6xl lg:text-8xl mb-8 italic text-primary-gold leading-tight">
									Excellence <br />
									Defined by You
								</h1>
								<p className="text-off-white/80 max-w-md text-xl font-light leading-relaxed">
									Hear from our community of collectors and discover why LUXE is
									the choice for timeless luxury leather artistry.
								</p>
							</div>
							<div className="bg-card-dark p-10 rounded-3xl flex flex-col md:flex-row gap-12 w-full lg:max-w-2xl border border-white/5 shadow-2xl">
								<div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 pb-8 md:pb-0 md:pr-12">
									<span className="text-7xl font-editorial font-bold italic text-off-white">
										4.9
									</span>
									<div className="flex text-accent-gold my-4">
										<span className="material-symbols-outlined fill-icon">
											star
										</span>
										<span className="material-symbols-outlined fill-icon">
											star
										</span>
										<span className="material-symbols-outlined fill-icon">
											star
										</span>
										<span className="material-symbols-outlined fill-icon">
											star
										</span>
										<span className="material-symbols-outlined fill-icon">
											star
										</span>
									</div>
									<p className="text-[11px] uppercase tracking-[0.2em] font-bold text-off-white/40">
										1,240 Reviews
									</p>
								</div>
								<div className="flex-grow space-y-3">
									<div className="flex items-center gap-4 text-sm">
										<span className="w-4 font-bold text-off-white">5</span>
										<div className="flex-grow h-1 bg-white/5 rounded-full overflow-hidden">
											<div
												className="h-full bg-primary-gold"
												style={{ width: "92%" }}
											></div>
										</div>
										<span className="w-8 text-off-white/60 font-medium">
											92%
										</span>
									</div>
									<div className="flex items-center gap-4 text-sm">
										<span className="w-4 font-bold text-off-white">4</span>
										<div className="flex-grow h-1 bg-white/5 rounded-full overflow-hidden">
											<div
												className="h-full bg-primary-gold"
												style={{ width: "5%" }}
											></div>
										</div>
										<span className="w-8 text-off-white/60 font-medium">
											5%
										</span>
									</div>
									<div className="flex items-center gap-4 text-sm">
										<span className="w-4 font-bold text-off-white">3</span>
										<div className="flex-grow h-1 bg-white/5 rounded-full overflow-hidden">
											<div
												className="h-full bg-primary-gold"
												style={{ width: "2%" }}
											></div>
										</div>
										<span className="w-8 text-off-white/60 font-medium">
											2%
										</span>
									</div>
									<div className="flex items-center gap-4 text-sm">
										<span className="w-4 font-bold text-off-white">2</span>
										<div className="flex-grow h-1 bg-white/5 rounded-full overflow-hidden">
											<div
												className="h-full bg-primary-gold"
												style={{ width: "1%" }}
											></div>
										</div>
										<span className="w-8 text-off-white/60 font-medium">
											1%
										</span>
									</div>
									<div className="flex items-center gap-4 text-sm">
										<span className="w-4 font-bold text-off-white">1</span>
										<div className="flex-grow h-1 bg-white/5 rounded-full overflow-hidden">
											<div
												className="h-full bg-primary-gold"
												style={{ width: "0%" }}
											></div>
										</div>
										<span className="w-8 text-off-white/60 font-medium">
											0%
										</span>
									</div>
									<div className="pt-6">
										<button className="w-full bg-accent-gold text-black py-5 rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all duration-300">
											Write Link Review
										</button>
									</div>
								</div>
							</div>
						</div>
					</section>
					<section className="max-w-[1440px] mx-auto px-6 py-28 border-b border-white/5 bg-primary-black">
						<div className="text-center mb-20">
							<h2 className="font-editorial text-5xl italic mb-6 text-primary-gold">
								Our Promise
							</h2>
							<p className="text-off-white/80 max-w-lg mx-auto text-lg font-light">
								Our commitment to excellence extends beyond the product,
								ensuring Link legacy of quality in every interaction.
							</p>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-16">
							<div className="flex flex-col items-center text-center group">
								<div className="size-24 bg-card-dark rounded-full flex items-center justify-center mb-10 border border-white/5 text-primary-gold group-hover:border-primary-gold transition-all duration-700">
									<span className="material-symbols-outlined text-4xl">
										precision_manufacturing
									</span>
								</div>
								<h3 className="font-editorial text-2xl italic mb-4 text-off-white">
									Authentic Artistry
								</h3>
								<p className="text-off-white/70 text-base leading-relaxed px-6 font-light">
									Meticulously handmade using premium materials for unparalleled
									durability and finish.
								</p>
							</div>
							<div className="flex flex-col items-center text-center group">
								<div className="size-24 bg-card-dark rounded-full flex items-center justify-center mb-10 border border-white/5 text-primary-gold group-hover:border-primary-gold transition-all duration-700">
									<span className="material-symbols-outlined text-4xl">
										local_shipping
									</span>
								</div>
								<h3 className="font-editorial text-2xl italic mb-4 text-off-white">
									Secure Delivery
								</h3>
								<p className="text-off-white/70 text-base leading-relaxed px-6 font-light">
									Experience global door-to-door reliability with fully tracked
									and insured shipping services.
								</p>
							</div>
							<div className="flex flex-col items-center text-center group">
								<div className="size-24 bg-card-dark rounded-full flex items-center justify-center mb-10 border border-white/5 text-primary-gold group-hover:border-primary-gold transition-all duration-700">
									<span className="material-symbols-outlined text-4xl">
										verified_user
									</span>
								</div>
								<h3 className="font-editorial text-2xl italic mb-4 text-off-white">
									Lifetime Support
								</h3>
								<p className="text-off-white/70 text-base leading-relaxed px-6 font-light">
									Dedicated customer care ensuring your investment is protected
									and valued for years to come.
								</p>
							</div>
						</div>
					</section>
					<section className="max-w-[1000px] mx-auto px-6 py-28 bg-primary-black">
						<div className="flex items-center justify-center mb-24">
							<h2 className="font-editorial text-5xl italic text-primary-gold text-center">
								Collector Testimonials
							</h2>
						</div>
						<div className="space-y-24">
							<div className="space-y-24">
								{REVIEWS.map((review, index) => (
									<div
										key={review.id}
										className={`group ${index !== 0 ? "pt-24 border-t border-white/5" : ""}`}
									>
										<div className="flex flex-col md:flex-row gap-12">
											{/* Left Column: Reviewer Info */}
											<div className="md:w-56 shrink-0">
												<p className="font-bold text-xl mb-2 text-off-white">
													{review.name}
												</p>

												{review.verified && (
													<div className="flex items-center text-primary-gold text-[11px] font-black uppercase tracking-[0.2em] gap-2 mb-6">
														<span className="material-symbols-outlined text-sm fill-icon">
															verified
														</span>
														Verified Buyer
													</div>
												)}

												<div className="flex text-accent-gold text-sm">
													{[...Array(review.rating)].map((_, i) => (
														<span
															key={i}
															className="material-symbols-outlined fill-icon"
														>
															star
														</span>
													))}
												</div>

												<p className="text-off-white/40 text-[11px] uppercase tracking-widest mt-6">
													{review.date}
												</p>
											</div>

											{/* Right Column: Content */}
											<div className="flex-grow">
												<h4 className="font-editorial text-3xl mb-6 italic text-off-white">
													"{review.title}"
												</h4>
												<p className="text-off-white/80 leading-relaxed text-xl font-light">
													{review.content}
												</p>

												<div className="mt-10 flex items-center gap-8">
													<button className="text-[11px] uppercase tracking-widest font-bold flex items-center gap-2 text-off-white/50 hover:text-primary-gold transition-colors">
														<span className="material-symbols-outlined text-lg">
															thumb_up
														</span>
														Helpful ({review.helpfulCount})
													</button>
													<button className="text-[11px] uppercase tracking-widest font-bold flex items-center gap-2 text-off-white/50 hover:text-primary-gold transition-colors">
														<span className="material-symbols-outlined text-lg">
															reply
														</span>
														Comment
													</button>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
						<div className="mt-28 flex flex-col items-center justify-center">
							<button
								onClick={() => setIsMenuOpen(!isMenuOpen)}
								className="px-16 py-6 rounded-full border border-primary-gold/30 text-primary-gold font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-primary-gold hover:text-black transition-all duration-700"
							>
								Load More Stories
							</button>

							{/* The text now appears below the button only when hit */}
							{isMenuOpen && (
								<p className="mt-12 text-off-white/50 text-sm italic">
									Loading......
								</p>
							)}
						</div>
					</section>
				</main>
				<footer className="bg-primary-black py-12 px-6 border-t border-white/5">
					<div className="max-w-[1440px] mx-auto flex flex-col items-center gap-6">
						<h2 className="text-2xl font-black tracking-tighter italic font-editorial text-primary-gold uppercase">
							LUXE
						</h2>
						<p className="text-off-white/30 text-[10px] uppercase tracking-[0.3em] font-medium">
							© 2026 Luxury Reimagined
						</p>
					</div>
				</footer>
			</div>
		</div>
	);
}
export default Review;
