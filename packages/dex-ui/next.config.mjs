import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: false,
	pageExtensions: ["page.tsx", "page.ts", "page.jsx", "page.js"],
	compress: true,

	webpack(config, { isServer }) {
		if (!isServer) {
			config.resolve.alias = {
				...config.resolve.alias,
				o1js: path.resolve(__dirname, "node_modules/o1js/dist/web/index.js")
			}
		} else {
			config.resolve.alias = {
				...config.resolve.alias,
				o1js: path.resolve(__dirname, "node_modules/o1js/dist/node/index.js")
			}
		}
		config.experiments = { ...config.experiments, topLevelAwait: true }
		config.optimization.minimizer = []
		return config
	},
	// To enable o1js for the web, we must set the COOP and COEP headers.
	// See here for more information: https://docs.minaprotocol.com/zkapps/how-to-write-a-zkapp-ui#enabling-coop-and-coep-headers
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "Cross-Origin-Opener-Policy",
						value: "same-origin"
					},
					{
						key: "Cross-Origin-Embedder-Policy",
						value: "require-corp"
					}
				]
			}
		]
	},
	async rewrites() {
		return [
			{
				source: "/graphql/:path*",
				destination: `https://devnet.minaprotocol.network/graphql/:path*`
			}
		]
	}
}

export default nextConfig