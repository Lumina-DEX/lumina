/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
	theme: {
		extend: {
			boxShadow: {
				pfp: "3px 3px 5px 0px rgba(0, 0, 0, 0.3)"
			}
		}
	},
	plugins: []
}
