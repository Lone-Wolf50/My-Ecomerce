/** @type {import('tailwindcss').Config} */
import containerQueries from "@tailwindcss/container-queries";

export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	
	theme: {
		extend: {
			colors: {
				"primary": "#D4AF37",
                        "cream": "#FDFBF7",
                        "accent-gold": "#C5A028",
                        "black-solid": "#000000",
                        "slate-grey": "#4A4A4A"


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
