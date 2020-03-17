import React from "react";
import Document, { Html, Head, Main, NextScript } from "next/document";

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps, language: ctx.query.language };
  }

  render() {
    return (
      <Html
        lang={this.props.language ? `${this.props.language}-x-mtfrom-en` : "en"}
      >
        <Head>
          <meta charSet="utf-8" />
          <link
            rel="apple-touch-icon"
            sizes="180x180"
            href="/apple-touch-icon.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="32x32"
            href="/favicon-32x32.png"
          />
          <link
            rel="icon"
            type="image/png"
            sizes="16x16"
            href="/favicon-16x16.png"
          />
          <link rel="manifest" href="/site.webmanifest" />
          <link
            href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&family=Playfair+Display&display=swap"
            rel="stylesheet"
          />
          <link
            rel="alternate machine-translated-from"
            hrefLang="en"
            href="http://www.ariadnelabs.org/resources/articles/news/social-distancing-this-is-not-a-snow-day"
          />
        </Head>
        <body className="bg-yellow-100">
          <main className="bg-white container mx-auto max-w-5xl px-4 sm:px-10 py-6">
            <Main />
            <NextScript />
            <style jsx global>{`
              html {
                font-family: "Roboto", sans-serif;
              }
              h1,
              h2 {
                font-family: "Playfair Display", serif;
              }
            `}</style>
          </main>
        </body>
      </Html>
    );
  }
}

export default MyDocument;
