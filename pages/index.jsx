import React from "react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push(`/${navigator.language.slice(0, 2)}`);
  });

  const title = "COVID-19, Social Distancing: Why, When & How (100+ languages)";
  const description =
    "This article explains why, when & how to practice social distancing while we all fight against the COVID-19 coronavirus. It's available in 100+ languages, share it as much as possible.";
  const url = "https://istayhome-info.now.sh";

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="title" content={title} />
        <meta name="description" content={description} />
        <noscript>
          <meta httpEquiv="refresh" content="0; url=/en" />
        </noscript>
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta
          property="og:image"
          content="https://istayhome-info.now.sh/social.png"
        />

        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={url} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <meta
          property="twitter:image"
          content="https://istayhome-info.now.sh/social.png"
        />
      </Head>

      <div className="h-screen flex items-center">
        <p className="text-lg flex-1 text-center">
          Please wait while we redirect you to your language...
        </p>
      </div>
    </>
  );
}
