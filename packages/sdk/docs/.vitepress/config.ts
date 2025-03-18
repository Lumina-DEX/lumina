import { defineConfig } from "vitepress"
import d2Plugin from "vitepress-plugin-d2"
import { type Config, Theme } from "vitepress-plugin-d2/dist/config"

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: "LuminaDex SDK",
	description: "SDK for interacting with the Lumina DEX on the Mina blockchain",
	markdown: {
		config: (md) => {
			md.use(
				d2Plugin,
				{
					scale: 1,
					padding: 16,
					theme: Theme.NEUTRAL_DEFAULT,
					darkTheme: Theme.DARK_MUAVE,
					sketch: true
				} satisfies Config
			)
		}
	},
	head: [
		["link", { rel: "icon", type: "image/png", href: "/favicon-96x96.png", sizes: "96x96" }],
		["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
		["link", { rel: "shortcut icon", href: "/favicon.ico" }],
		["link", { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" }],
		["link", { rel: "manifest", href: "/site.webmanifest" }]
	],
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: "Home", link: "/" },
			{ text: "Getting Started", link: "/guide/getting-started" },
			{ text: "API Reference", link: "/api/overview" }
		],
		logo: "/logo.png",
		sidebar: {
			"/guide/": [
				{
					text: "Introduction",
					items: [
						{ text: "Getting Started", link: "/guide/getting-started" },
						{ text: "Core Concepts", link: "/guide/core-concepts" }
					]
				},
				{
					text: "Framework Integration",
					items: [
						{ text: "React Integration", link: "/guide/react-integration" },
						{ text: "Vue Integration", link: "/guide/vue-integration" }
					]
				},
				{
					text: "Features",
					items: [
						{ text: "Wallet Connection", link: "/guide/wallet-connection" },
						{ text: "Swapping Tokens", link: "/guide/swapping-tokens" },
						{ text: "Managing Liquidity", link: "/guide/managing-liquidity" },
						{ text: "Fetching Data", link: "/guide/fetching-data" }
					]
				}
			],
			"/api/": [
				{
					text: "API Reference",
					items: [
						{ text: "Overview", link: "/api/overview" },
						{ text: "Wallet Machine", link: "/api/wallet-machine" },
						{ text: "Dex Machine", link: "/api/dex-machine" },
						{ text: "Helper Functions", link: "/api/helpers" }
					]
				}
			]
		},

		socialLinks: [
			{ icon: "github", link: "https://github.com/Lumina-DEX/lumina/tree/main/packages/sdk" }
		],
		footer: {
			message: "Released under the MIT License.",
			copyright: "Copyright © 2025-present Lumina DEX"
		}
	}
})
