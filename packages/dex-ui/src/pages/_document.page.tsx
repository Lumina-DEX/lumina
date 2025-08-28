// biome-ignore lint/suspicious/noDocumentImportInPage: <?>
import Document, { Head, Html, Main, NextScript } from "next/document"

export default class MyDocument extends Document {
	render() {
		return (
			<Html>
				<Head>
					<meta name="theme-color" content="#311d72" />
					{["Orbitron", "Cutive Mono", "Metrophobic"].map((font) => (
						<link
							key={font}
							href={`https://fonts.googleapis.com/css?family=${font}&display=swap`}
							rel="stylesheet"
						/>
					))}
				</Head>
				<body className="lightmode">
					<Main />
					<NextScript />
				</body>
			</Html>
		)
	}
}
