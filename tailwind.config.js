/** @type {import('tailwindcss').Config} */
import containerQueries from "@tailwindcss/container-queries";

export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	darkMode: "class",
	theme: {
		extend: {
			colors: {
				primary: "#D4AF37",
				"background-dark": "#000000",
				"accent-gold": "#C5A028",
				"off-white": "#F5F5F5",
				"slate-grey": "#4A4A4A",
				"border-gold": "rgba(212, 175, 55, 0.2)",
				"card-dark": "#0A0A0A",
				"primary-black": "#000000",
				"primary-gold": "#D4AF37",
        "modern-black": "#000000",

			},
			fontFamily: {
				editorial: ["Playfair Display", "serif"],

				display: ["Plus Jakarta Sans", "sans-serif", "Noto Sans"],
			},
		borderRadius: {
			DEFAULT: "0.125rem",
			lg: "0.25rem",
			xl: "0.5rem",
			"2xl": "1rem",
			"3xl": "1.5rem",
			full: "9999px",
		},
		},
	},
	plugins: [
		containerQueries, // 👈 add the container queries plugin here
	],
};
