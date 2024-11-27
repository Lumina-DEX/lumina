/* eslint-disable @next/next/google-font-display */
import Document, { Html, Head, Main, NextScript } from "next/document"

export default class MyDocument extends Document {
	render() {
		return (
			<Html>
				<Head>
					<meta name="theme-color" content="#311d72" />
					<link href="https://fonts.googleapis.com/css?family=Orbitron" rel="stylesheet" />
					<link href="https://fonts.googleapis.com/css?family=Cutive Mono" rel="stylesheet" />
					<link href="https://fonts.googleapis.com/css?family=Metrophobic" rel="stylesheet" />
				</Head>
				<body className="lightmode">
					<Main />
					<NextScript />
				</body>
			</Html>
		)
	}
}
