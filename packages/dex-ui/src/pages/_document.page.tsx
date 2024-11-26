/* eslint-disable @next/next/google-font-display */
import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MyDocument extends Document {
  render() {
    return (
      <Html>
        <Head>
          <meta name="theme-color" content="#311d72" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Lexend:wght@100..900&family=Space+Grotesk:wght@300..700&display=swap"
            rel="stylesheet"></link>

        </Head>
        <body className="lightmode">
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
