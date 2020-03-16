import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import Select from "react-select";
import { useRouter } from "next/router";
import PropTypes from "prop-types";
import Markdown from "markdown-to-jsx";
import {
  EmailShareButton,
  FacebookShareButton,
  LinkedinShareButton,
  TwitterShareButton,
  RedditShareButton,
  TelegramShareButton,
  VKShareButton,
  WhatsappShareButton,
  EmailIcon,
  FacebookIcon,
  LinkedinIcon,
  RedditIcon,
  TelegramIcon,
  TwitterIcon,
  VKIcon,
  WhatsappIcon,
} from "react-share";

export default function Home({
  languages,
  markdownTranslation,
  title,
  language,
}) {
  const router = useRouter();
  const [currentLanguage, setLanguage] = useState({
    value: language,
    label: languages.find(({ code }) => code === language).name,
  });

  const options = languages.map(({ code: value, name: label }) => ({
    value,
    label,
  }));

  const handleChange = (selectedLanguage) => {
    setLanguage(selectedLanguage);
    router.push(`/${selectedLanguage.value}`);
  };

  const description = markdownTranslation.split("\n")[8];
  const url = `https://istayhome-info.now.sh/${language}`;

  const selectRef = useRef(null);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  function handleClickOutside(event) {
    if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
      selectRef.current.blur();
      setMenuIsOpen(false);
    }
  }

  useEffect(() => {
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="title" content={title} />
        <meta name="description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={title} />
        <meta
          property="og:description"
          content="With Meta Tags you can edit and experiment with your content then preview how your webpage will look on Google, Facebook, Twitter and more!"
        />
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
      <div
        className="flex justify-start cursor-pointer"
        ref={wrapperRef}
        onClick={() => {
          setMenuIsOpen(!menuIsOpen);
          if (!menuIsOpen) {
            selectRef.current.focus();
          } else {
            selectRef.current.blur();
          }
        }}
      >
        <span className="select-none text-2xl self-center">🌐</span>
        <Select
          ref={selectRef}
          menuIsOpen={menuIsOpen}
          instanceId={1}
          value={currentLanguage}
          onChange={handleChange}
          options={options}
          className="ml-2 flex-1 max-w-xs"
        />
      </div>
      <Image />
      <Sharing url={url} title={title} />
      <Markdown
        options={{
          overrides: {
            h1: {
              props: {
                className: "font-serif text-5xl mb-10 mt-5 text-center",
              },
            },
            h2: { props: { className: "font-serif text-3xl my-6" } },
            p: { props: { className: "font-sans text-lg my-5" } },
            a: {
              props: {
                className:
                  "text-indigo-600 underline transition-colors duration-500 ease-out hover:text-blue-700 hover:bg-yellow-200",
              },
            },
          },
        }}
      >
        {markdownTranslation}
      </Markdown>
    </>
  );
}

export async function getStaticProps({ params }) {
  const Cache = require("lru-cache-fs");
  const { resolve } = require("path");
  const { readFile } = require("fs").promises;

  const cache = new Cache({
    max: 1000,
    cacheName: "istayhome.info", // filename ref to be used
  });

  const { Translate } = require("@google-cloud/translate").v2;
  const translate = new Translate({
    projectId: "istayhome",
  });
  const language = params.language;
  const originalTitle = "Social Distancing: Why, When & How";
  const originalMarkdownArticleFilePath = resolve("./article.md");
  const markdownTranslationCacheFilepath = resolve(
    `./translations/${language}.md`,
  );

  const [title] =
    language === "en"
      ? [originalTitle]
      : cache.get(`title-${language}`) ||
        (await translate.translate(originalTitle, {
          from: "en",
          to: language,
        }));

  cache.set(`title-${language}`, [title]);

  const [languages] =
    cache.get("languages") || (await translate.getLanguages());
  cache.set("languages", [languages]);
  cache.fsDump();

  const markdownTranslation =
    language === "en"
      ? await readFile(originalMarkdownArticleFilePath, "utf-8")
      : await getOrComputeAndCacheMarkdownTranslation({
          language,
          markdownTranslationCacheFilepath,
          originalMarkdownArticleFilePath,
          translate,
        });

  return {
    props: {
      languages,
      markdownTranslation,
      title,
      language,
    },
  };
}

async function getOrComputeAndCacheMarkdownTranslation({
  language,
  markdownTranslationCacheFilepath,
  translate,
  originalMarkdownArticleFilePath,
}) {
  const { readFile, writeFile } = require("fs").promises;
  const { promisify } = require("util");
  const marked = promisify(require("marked"));
  const TurndownService = require("turndown");
  const turndownService = new TurndownService({
    headingStyle: "atx",
    hr: "---",
  });
  turndownService.keep(["center"]);

  // we convert to html because Google Translate really works perfectly only for HTML as for structured documents
  const htmlTranslation =
    (await getHtmlTranslationFromCache(markdownTranslationCacheFilepath)) ||
    (await translateHtml({
      html: await marked(
        await readFile(originalMarkdownArticleFilePath, "utf-8"),
      ),
      language,
      translate,
    }));

  const markdownTranslation = turndownService.turndown(htmlTranslation);
  await writeFile(markdownTranslationCacheFilepath, markdownTranslation);

  return markdownTranslation;
}

async function translateHtml({ html, language, translate }) {
  const [htmlTranslation] = await translate.translate(html, {
    from: "en",
    to: language,
  });
  return htmlTranslation;
}

async function getHtmlTranslationFromCache(markdownTranslationCacheFilepath) {
  const { promisify } = require("util");
  const { readFile } = require("fs").promises;
  const marked = promisify(require("marked"));

  if (await fileExists(markdownTranslationCacheFilepath)) {
    return await marked(
      await readFile(markdownTranslationCacheFilepath, "utf-8"),
    );
  }

  return null;
}

async function fileExists(filePath) {
  const { access } = require("fs").promises;

  try {
    await access(filePath);
    return true;
  } catch (e) {
    return false;
  }
}

export async function getStaticPaths() {
  const { Translate } = require("@google-cloud/translate").v2;
  const translate = new Translate({
    projectId: "istayhome",
  });
  const [languages] = await translate.getLanguages();

  return {
    paths: languages.map(({ code }) => {
      return {
        params: { language: code },
      };
    }),
    fallback: false,
  };
}

Home.propTypes = {
  languages: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string,
      name: PropTypes.string,
    }),
  ),
  language: PropTypes.string,
  markdownTranslation: PropTypes.string,
  placeholder: PropTypes.string,
  title: PropTypes.string,
};

function Image() {
  return (
    <svg viewBox="0 0 1024 768" className="w-3/5 mx-auto">
      <g fill="#FFFFFF00" fillRule="evenodd">
        <path d="M0 0h1024v768H0z" />
        <path
          d="M372 194l-2 35c5-1 33-10 32-1-2 6-10 13-14 17l-12 12a549 549 0 0140-14c2 0 8-2 10-1 5 4-24 32-28 36l17-7c5-1 18-7 22-2s-6 17-9 21l-13 15c19 17 41 32 64 41 17 7 34 9 52 5a304 304 0 0082-36l-11-14c-5-7-11-15-14-23s8-6 13-6l22 4-15-12c-7-5-15-10-20-18-3-6 5-5 9-4 9 2 18 6 26 9l19 8-11-11c-5-5-11-11-14-18-4-14 26-3 31-1l-3-43-118 32-14 3-13-2-72-14-56-11"
          fill="#ff6161"
        />
        <g fill="#000">
          <path d="M797 688c-4 3-9 5-14 6-3 1-7 3-10 1l-2-5-4-6-11-13c-2-2-5-6-9-6s-4 6-3 9c4 9 13 17 20 23-2 3-11 2-13 2-4-1-4-4-6-7-4-7-12-11-19-15-2-2-7-6-11-5-3 1-2 5-2 8l9 8 11 11-14 1c-6 1-11-2-17-4l-15-5-16-5c-22-8-44-17-65-27-10-4-20-9-31-12-7-3-19-8-21-17-1-5 3-10 3-15 1-6 0-12-2-17-1-5-4-10-6-14-2-6 0-6 5-6l16-6c6-2 12-5 17-9l13-10 10-14 42 51c7 8 15 14 24 20l11 7 15 6a471 471 0 0180 47c2 2 22 14 15 18M570 548l-9 4c1-6 6-14 13-14 3 1 5 3 4 6l-8 4M353 392c-3 2-7 3-9-1 2 0 9-1 9 1m-6-12c-3-1 0-2 1-3l4-4c3-2 6 6 8 8l-13-1m29 26c-5 1-4-6-4-9 1 1 8 8 4 9m18-11c-7 1-11-10-10-15 1-4 6-7 10-7 4-1 9 0 10 4s-6 17-10 18m149 164c-4 2-9 2-13 3l-16 3-9 3-7-9c10-4 17-9 23-17 5-6 10-16 7-24-3-9-15-11-23-8l-10 7c-4 4-5 7-7 11s-4 2-6-2l-5-8c-1-2-3-3-3-5l-1-4c-1-2-2 0-3-1l-1-4-2-2-1-1-1-4c-3-2-5-5-6-8l-2-4c-1-2-4-1-5-3s0-5-2-7l-2-1-2-2-2-5-7-8c-2-3-1-4 3-5l9-4c14-8 27-29 5-36-8-2-15-9-24-6-4 1-8 3-11 6l-6 8c-5 2-3-3-4-5l-4-3-3-3-4-6c-1-1-5-5-1-4-2-4 0-5 3-8 3-4 7-8 7-13 0-10-12-14-19-9-1 2-10 13-8 6 1-4 10-14 14-12-5-6-15 10-18 13-2-4-2-7-5-10-3 5-2 0-2-1l-2-1-3-3c-2 3-1 0-1-1l-3-4-6-4h-6c-3 0-6-2-5 3 1 4 5 6 6 10 1 3-2 7-4 10-2 4-4 4-8 4-3 1-7 2-4 5 1 3 5 2 7 3 3 2 3 7 7 8s7-4 10-5 10-1 12 1c3 3 1 8 1 11 1 5 5 5 9 5 5 0 6 5 9 9l18 27 10 11c2 6-2 9-5 12l-12 16c-3 5-8 4-13 4 1-3 3-4 6-4-4-4-6 1-8 3-3 4-7 4-11 7-1 1-9 6-6 8l14-9-1 9 2 7c-1 4-6 7-9 11l-2 7c-1 2 0 2-2 2-5 2-12 1-15-1-3-1-5-4-6-5-2-2-6-4-6-6-1-4 6-10 8-14 3-10-3-17-13-18 3-2 7-1 10 0-6-7-15-1-20 4l-7-25c-1-6-6-17-4-23 1-3 4-4 6-6l7-8c4-7 6-15 1-22l5-1c-3-3-8-1-11-2s-10 0-11-2c-2-1-1-9-1-11l1-15 2-15c1-4 3-5 6-8 7-5 13-12 11-21h2c-2-3-6-2-9-3 3-8 9-22 19-23 1 4 0 8 3 11s8 4 11 2c4-2 7-5 9-9 1-2 0-6 2-8 3-2 20-1 20 3-1 3-5 7-7 9l-5 13c-1 7 0 16 7 20 8 4 17-1 24-6a115 115 0 0015-13l4-4c3-3 6 1 9 3l14 9 28 20c9 7 18 14 25 23-4 3-3 4-5 8l-4 10c0 7 4 12 10 14 4 1 7 0 11-2l7-4c5-1 9 8 12 11l37 44c1 2 5 5 5 7 1 4-4 7-6 8-1 1-13 12-9 14 1 1 4-6 5-7 3-2 1 2 1 4-1 6 3 9 8 8s10-5 14-9c4 5 10 12 12 19 0 4-3 14 4 15 1 0 4-3 5-1 1 1-3 4-4 4l-6 6-8 7c-3 3-9 10-12 7-2-2-2-4-5-5-2-1-6 0-8 1-3 1-12 5-13 9-2 5 6-1 7-2-1 4-2 10-6 12l-12 4m-53-30c3-8 19-23 28-19-11 3-20 11-28 19m6 25c-4-2-3-9-5-12l-2-6 6-8c6-6 16-15 26-13 11 2 3 18-1 23-3 5-16 20-24 16m-27-11l-39-4c-4-1-8-1-6-6 1-2 6-12 8-12v8c1 4 4 8 8 7 7 0 12-9 15-14l8 12c2 2 7 7 6 9m-76-50c-2 5-6 10-9 14-2-4-3-12 1-15 1-1 10-2 8 1m45 15l2-6c1 4 2 4-2 6m11 4c1 2 4 5 3 8 0 3-2 5-4 7-2 3-8 9-12 5s-2-12-1-16c2-5 10-11 14-4m-8-6c1 0-1-6 1-6 1 3 3 4-1 6m-24-77c-1-3-2-2-2-5 0-2 2-4 3-5l8-7c6-3 14-5 20 1-5 1-21 6-21 13 5-1 10-7 16-9h15c13 5 7 16 0 23-5 5-10 8-15 10l-7 1-2-2c-1 0-1 2-2 1l-4-6-3-5-4-6-2-1v-3m-20 83l11-14c1 8-5 13-11 14m4 3c6-2 9-7 10-14 0-8 5-12 8-19 2-3 3-12 7-9 2 1 3 4 4 6l6 10c1 3 4 6 3 10l-4 9-9 19c-2 3-3 9-7 9-3 0-3-3-5-4-2-2-5 1-7 2 2-4 6-6 11-5-6-6-9 2-14 3-5 2-13-6-17-8l6-7 8-2m-50 51l4-8c1 3-2 6-4 8m97 20l-2 32-1 15c-1 4 0 8-3 12-4 5-12 7-19 9l-13 5-12 5-10 5-10 5c-5 2-8 6-12 8l-10 8-10 6-10 7c-8 4-18 11-27 7 2-3 8-7 8-11 1-6-4-4-7-2-5 3-8 6-11 10-4 5-9 2-14 0l10-9c3-2 7-5 9-9 1-2 1-6-2-7-3-2-7 2-9 3-7 5-11 12-16 18-2 4-3 4-7 3l-14-2 18-20c1-2 3-9-2-9l-7 5c-6 4-12 10-17 17-1 2-2 5-4 5-4 0-11-3-14-4l21-25 22-16 26-19 23-19a253 253 0 0045-60c2-4 2-9 5-12l3-4c1-1 0-2 2-3 2-3 7-1 9 0l12 9 14 5 34 7c-1 4 1 5 2 9 2 5 0 11 0 16m-109-73l-7-12c-2-2-4-5-2-8 2-5 10-5 14-3 10 4 1 18-5 23m-25-87c-1-8 2-13 9-17 4-3 8 1 8 6-1 8-10 16-16 20l-1-9m-1-22c2-1 7 1 9 1l-9 8c0-2-2-7 0-9m10-71c16-3-2 15-7 17 1-3 3-17 7-17m43-31c-2 9-19 19-19 4 0-5 3-4 7-5 3 0 13-4 12 1m-58 14l-5 15-3 5c-1 2-3 2-3 4l4-2-2 14-2 17-1 35 1 19v9c1 1 2 3 1 5-2 4-12-8-16-6 1-4-1-3-3-5l-3-3-1-1h-1c-5-2-6-8-9-12-1-2-2-2-2-5v-8l-1-8c-1-3-3-3-5-5l1-1h-3c-1-1 1-2 2-2-3-2-2-3-1-5l1-2 1-3-2-6v-8l2-6-1-2 1-2 1-7 4-6c1-1 3-2 3-4l-1-1 1-3c1-2 1-4 3-5 2-2 3-1 3-5l-1-3 2-3c3-2 4-4 5-6l5-6c2-3-1-4 3-5v-4l4-1 1-5h4l3-6c3 2 2 1 4-2l2-1 1-3 5-2 3-2 3-2 4-4 7-5 5-4 6-3 5-4 4-1c3 0 4-3 6-4l6-1 16-5 21-5c-6 8-14 16-22 23-3 2-18 12-10 16 3 2 10-3 13-5l15-7c9-4 20-10 30-10-6 8-13 13-20 20-6 6-15 11-12 21-9-2-17-5-26-4h-12l-13 3c-3 1-7 1-10 3l-4 3-4 4c-5 6-10 12-13 20m-27 120l-1-3c3 2 3 2 1 3m-21-35h-2l1-2c1 0 2 1 1 2m-6-12l2-4 2 3-4 1m2 1c3 2 3 5 3 9-4-2-3-5-3-9m55-142c-1 1-2 4-3 2l3-2m-1-3h3l1-1 1-2 3-2 4-6 5-5c2 0 3-1 4-3l3-5 3-1 2-3 2-1v-3l2 2c2-3 3-6 7-8l10-9 3-1 1-3c1-2 2-1 4-1 1-1 1-3 3-2-6 7-6 18-6 26 0 4 2 6-1 9-3 2-8 1-11 3l-14 5c-5 1-8 5-13 7-4 1-7 4-10 6-1 1-4 2-5 1-1 0-2-1-1-3m67-59l7-4c1-1 4-5 6-3 1-3 4-6 6-7l11-5 2-2 4-2 3-4v1l4-2v-2h2c-2 9 0 20 9 25-11 1-22-2-33 0l-16 5c-3 1-6 7-9 4l4-4m53-26c5-5 11-7 17-5 7 2 4 7 3 13-2-3-7-6-10-6-6-1-4 4-1 6 3 1 9 2 11 4 2 3 1 7 2 11l-5-1c1-8-5-8-11-10-5-2-10-6-6-12m19-18v7l-7-4 7-3m18 54l23 8 8 2c3 1 3 1 2 3-2 6-8 5-13 4l-24-5-24-5-23-7c-3 0-21-2-21-4h35c13 1 25 1 37 4m-10-23l1-13c3 5 6 6 11 2 4-4 5-6 10-2 5 3 9 3 14 0 3-2 8-9 11-7 2 0 3 3 4 4l7 3c6 1 9-3 12-6 5-5 5-2 9 1 5 4 9 2 14-1l4 25c0 3 1 7-1 9l-8 2c-8 3-15 7-21 12-3 2-5 4-9 4l-9-5c-3-2-5-4-9-5l-7-2c-3-2 1-8 0-12 0-3-2-9-6-7-6 2-3 12 1 15-7-1-14-2-21-5-5-1-7-7-7-12m113 20c13-4 26-6 41-7h19c3 0 6-3 3-6-4-5-16-3-22-3-14-1-27 1-41 6 1-3 5-3 7-5 3-2 5-4 6-7 4-8 0-16-3-23 7 1 14 5 20 6l4 1 2 2 2-1 2 1 2 2 3-2h1c2 0 1 2 2 3l1 3 3-1 3 2 6 5 1-1h2l2 3 6 4c3 1 3 0 4 4 2-4 3 2 6 3h3l2 3 1-3c2 4 6 10 11 9l1 3h2l1 2 2 1 2 3 3 3 1-4 2 4c0 2-1 1 1 2l4 3c2 2 2 3 4 1l1 4c1 1 5 1 5 3-6-5-2 3 0 0 0 3 3 4 5 6s3 2 4 5l1 1c-2 0 1 3 2 3h1l2 3 5 6c3 2 4 5 5 7l6 9 6 7c3 4 4 13 10 13v3c0 3 0 5 2 7 0-2 1-1 2 0 2 2 1 2 1 4l1 3 2 5c-3 0-5-2-6-5l-2-4-3-2-5-7c-3-2-3-3-5-6l-9-7c-2-3-2-2-5-3s-9-11-13-7c0-3-3-5-5-6l-3-1-2-2h-2l-1-2-5-3-10-7-11-7c-3-1-5 0-7-2l-3-2c-3-1-4 0-5-3-2-3-1-11-1-16l-2-14c-2-5-3-8-9-7l-35 8c-23 4-45 11-68 18-1 0-11 2-9-3 1-2 7-3 9-4l34-11m-4-10l-5 2v-4l5 2m-7-24c1 1 4-2 5-3l8-1c4 0 7 4 6 9-1 7-11 11-17 13 0-2-1-5 1-8 1-2 4-1 6-3 3-6-7-6-9-2l-2-8c2 0 1 2 2 3m10-15l-6 4c-1-4 2-5 6-4m190 162c-3 2-4-1-6-2 3-1 3-1 6 2m11 68l1 14 2 10c0 7-3 15-8 20s-12 10-18 12l-9 4c-3 1-6-1-9 2v-45c0-15 0-30-3-45-2-13-7-28-15-39-3-5-7-8-12-12l-7-5c-4-2-7-2-11-2-6-1-12-2-18 0-5 2-12 3-17 6s-10 4-16 6c-3 2-11 8-14 7-4-1-10-8-12-11l-9-12c-1-1-3-3-3-5 0-3 1-2 4-2l22 5c4 1 11 6 14 3 6-4-2-12-6-15l-17-11c-6-4-14-9-17-15a409 409 0 0148 18c2 2 8 6 11 4 7-4-9-16-11-19l-11-11c-3-2-7-4-8-7 4 1 8 4 12 7l6 2 5 1 5 3 4 1 2 2 2 1 2 3c7 6 16 11 24 16l22 15 23 21 10 14 7 10 13 24c5 8 11 16 12 25m-65 45c2-5 9-11 14-14-3 6-9 10-14 14m12 19c-4 9-21 10-19-3 1-6 6-10 11-14 2-1 6-8 10-7l-1 14c0 3 1 7-1 10m-5-96c2 4 4 7 1 10-2 1-6 5-8 4-7-2 6-12 7-14m-39-33h8v1h3l5 2c-5 3-11 7-17 9-9 1-7-11 1-12m-143 78c-1 2-4-3-4-3 1 0 5 1 4 3m75-51l24-11c1 7-6 15-10 20-3 3-7 7-12 9-4 2-10 1-10-5l2-8c1-3 4-3 6-5m-98-120c1 0 13-2 13 0 0 4-12 1-13 0m-83 85c6-8 16-16 16-27 1-16-17-8-26-7 5-5 28-24 14-31-3-2-9 0-13 1l-21 8c5-6 14-12 14-20-1-9-9-7-16-6-2 1-14 6-16 2v-3l1-5c0-3 2-8 0-12l-1 3-1-7c17 5 35 7 52 11l26 7 27 5 24 5c8 1 16-2 24-4l52-12c20-4 41-8 60-16l2 30c-8-4-21-9-29-2-4 3-5 8-3 12 1 5 5 7 8 10-9-2-32-18-36-2-3 12 11 19 18 26-7-1-16-7-20 2-4 8 1 16 5 22l8 10 4 6 5 5c2 4-2 4-6 5l-10 7c-8 5-15 10-25 12l-29 6c-10 2-18 4-27 1l-13-2c-5 0-8 0-13-3-17-14-37-25-55-37m-32-14l21-10c6-2 15-5 21-4-2 5-5 9-9 12l-10 10c-4 2-8-1-11-3-4-1-9-2-12-5m2 18c3-2 10 3 14 4 6 3 12 5 17 9-6 8-14 15-23 20-6 3-15 6-21 1-7-8 2-23 6-29l1 3c1-2 3-7 6-8m125 65c-4 1-5 0-8-3l-6-7c-2-2-8-7-1-4s12 4 19 3c8-1 15-5 23-6l-13 11c-4 4-8 5-14 6m1 30c-9 7-28 6-21-9 0-3 2-5 3-7l3-2c2-2 1-2 3 0s15 17 12 18m-2-27s4-2 5-1-6 5-5 1m68 108c-2 5-19 12-16 2 1-5 3-8 8-9 3 0 10 2 8 7m30-69c3-4 12-9 16-3 2 3-3 4-6 3l-4-1c-2 0-4 2-6 1m7 4c-1 2-13 12-15 10 4-5 8-11 15-10m-18 97c-4 0-2-6-2-8 1 2 6 8 2 8m10-11c-1-2-5-5-4-8 0-2 6-5 8-4 3 2-1 13-4 12m94-23c-2 5-4 4-9 5s-9 6-14 8c2-3 3-7 6-10 0-1 4-2 2-4-2-1-5 3-6 4a79 79 0 00-12 29v9c-1 5-7 5-11 6-4 2-7 3-11 3h-9c-3 1-5 3-9 3l-9-2h-8c-3-1-3-1-2-4l1 2 3-5c1-2 2-3 1-5 0-4-4-6-4-10-1-4 1-7 3-10 2-4 2-7 0-11l5 1c-2-4-9-3-12-1l-6 3-5-5-10-15c-1-1-2-2-1-4l4-3 10-8 16-12 15-13 16-15c1 3 4 12 7 13 4 0 3-4 3-6l-2-11c0-4 3-5 6-8 4-3 13-10 8-17-4-5-18 5-22 8l-9 7c-3 2-7 7-10 7-4-1-5-5-10-5-4 1-8 4-10 7-6 7-9 16-14 24l-9 10c-4 4-4 8-8 12l-28-36-15-18-5-6-3-10-2-5c1-2 6-4 7-4l19-12 36-22c0 3-2 6 0 9 0-2 1-9 3-10l1 11c1 4 4 7 8 7 8 0 15-9 19-15 3-4 6-8 7-13s0-8 5-10c9-5 19-8 29-11-1 5-2 10 2 13 4 4 10 0 14-2s10-8 15-6c5 1 8 7 11 11 2 4 5 6 2 10l-7 13-2 5 4 4c4 4 10-3 13-5l1 30c1 8 3 15-3 21-6 5-11 11-15 18l-5 12c-2 2-5 6-3 9l4-7c1 5 2 9 7 11s10-1 15-3l-8 34m-6 13c-3 8-7 17-13 23-2 1-8 6-10 5s-1-5-1-7c2-8 5-14 12-20 3-2 7-5 11-5 4-1 3 1 1 4m102 183c-9-12-22-22-35-32l-18-12-20-13c-14-7-29-12-42-20l-19-13-7-7c-2-2-7-5-8-8 4-1 6-4 9-4 1-1 8 1 7-2l5-1h2l4-2 5-1c1-1 0-1-1-2h8l2-3c1 0 2 1 3-1 1 3 1 2 3 1l7-1 18-1h7c2 0 1 2 3 0l-1-2 2-1c3-1 3 1 3 3l5-2c-1 0-2-1-1-2 2 1 4 0 3 3h5l4-1c1-1-1-2 1-3l1 1v1c4 2 3 0 5-3 0 0 2-2 3-1s-1 2-1 3c1 2 4-1 5-2l2-3h5c7-1 13-10 8-16l-4-3-4-4c-3-3-7-6-11-7-9-4-20-7-30-9l-14-2c-3 0-7 2-10 1-5-2 3-12 4-16 4-9 6-20 8-30l1-7c1-2 1-2 3-2l10 1 12-2 4-2v-1l2-2v-2c1 1 0 3 3 3 0-2 0-3 2-4l1-1v-1l3-1 1-5 4 2c0-7 4-11 7-16 1-3 3-5 3-8v-4l3-4v-11l1-13c0-9 0-18-2-26l-2-13-3-9v-4l-2-6-5-13-11-25c-3-7-6-16-11-23l-14-21c-5-7-12-13-17-21a259 259 0 00-129-79l-15-1h-12c-3-1-3-5-4-8-1-4-3-7-6-9l-9-9-13-3-12-1c-4-2-2-3 1-2l1-3 2-2c1-1-1-2-1-3v-5c3 3 4 4 7 2l3-3 2 1c2-1 0-1 1-2l1-2v-3c-2-4-7-4-5-9l3-4-1-4c0-3 1-5-2-6-2-1-4 0-5-3-1-4 0-8-4-11-3-2-7 0-10-1s-6-4-9-2-4 6-8 4c-2-1-3-4-4-6-2-4-4-5-6-2-2 2-6 7-6 9-1 3 2 4-1 6s-5 1-8 4c-2 3 0 5-3 9-4 4-6 5-6 11 0 4-3 7-1 10 2 4 9 6 12 8-1 2-3 3-1 6 1 2 5 3 7 2l3-1c1-1 0-2 2-2l6 4c-3 3-10 4-14 6l-7 3-7 2c-3 2-4 8-6 11-3 4-5 6-9 7l-16 3a569 569 0 00-76 46c-9 7-17 15-25 24l-19 20-20 26c-4 4-8 8-10 14l-8 13-9 17-4 6c-2 3-2 6-2 9l-2-2-3 6-1 4c0 2-1 1-2 3l-2 4c-4 6-6 14-8 21-2 9-2 19-2 29l3 30c1 9 4 18 8 26 4 6 10 10 17 14 3 2 6 1 10 1 3 1 6 2 10 1l4-3 2 1 6-1c4 0 3 7 4 10l2 16 8 31c-11 1-20 3-31 7-10 4-20 6-31 8-10 2-20 5-28 12-4 3-8 7-5 12 2 3 5 4 8 6l-2-3c3 0 3 2 4 2l5 2c4 1 6 5 10 6l4 1h4l3 1 1-1 6 3 1-4 1 3c2 2 5 0 6-1 1 5 11 5 15 5 5 0 9-2 14-1l8 2 9 2 4 2 2-2 3 2h5l2 2h4l5 1 2 1 2-3 5 1c-9 13-21 24-33 34-14 11-27 22-42 31-13 9-25 16-35 28-9 10-22 21-20 36s18 21 31 23c16 4 32 3 49 5l21-1c8-1 15-6 22-10 13-7 24-16 36-23 16-9 31-19 49-25 8-3 16-6 22-12l3-2c2-2 2 0 3-1l3-1 4-1c-1-1-3-3-1-5 3-4 3 2 5 3v-4l2 2c0-3 0-5 2-8 1-2 2-2 2-5 4 4 5-5 5-9 1-3 0-5 2-8l9-8c5-3 10-8 16-4 6 2 8 9 13 13 3 2 6 2 8 6l3 9 14 20c5 5 12 4 18 8l19 8 21 6 10 5 12 4c15 6 30 13 46 16l21 6 9 1c4 1 3 2 5 6 3 6 10 3 15 3l26-2c15 0 30-1 44-6 15-5 31-17 19-34M631 169c1 1 1 1 0 0" />
          <path d="M366 445c4-3 18-2 19 3 1 7-12 17-16 20-6 3-13 4-12-5 1-7 5-13 9-18m12-7c0 2-3 2-4 1 0-1 3-2 4-1m-24 13c3 0 6-5 8-6 1 1-5 9-6 11-2 4-3 10 0 14 6 14 24-5 28-12 3-4 5-10 1-14l-6-4c-2-2 0-4-4-4-2 0-5 3-8 3l-8 4c-1 1-9 7-5 8m196 4c-2 9-11 18-20 18-9 1-12-9-11-17 2-6 7-18 15-17 7 1 17 8 16 16m-6-15c-6-5-14-7-21-3-2 1-11 6-8 10 3-3 6-7 11-8-1 4-5 7-7 11s-3 9-2 13c0 9 6 15 14 14s15-7 19-14c4-9 2-17-6-23m-55 35c-4 6-11 12-18 14-10 3-7-5-4-11 3-5 7-14 14-13l8 2c4 2 2 5 0 8m-9-13c2-2 8-9 9-4 2-2 1-4-2-4s-6 3-8 5c-5 3-8 6-11 11s-11 17-4 22c8 6 19-4 24-10 3-3 7-8 6-13-2-6-9-7-14-7m-33-101c-4 5-13 12-20 12-7-1-4-9-2-12 3-6 8-11 15-11 3 0 7 0 9 2 3 3 0 7-2 9m0-13c-6-2-8-3-12 0-4 2-8 5-11 9-4 5-8 17 3 19s38-22 20-28m15 30c-3 4-7 7-12 7 2-4 7-14 12-15 2-1 5 0 5 3 0 2-3 4-5 5m4-11c-2-2-1-3-5-2l-7 4-5 6c1 3 4-1 5-2 1 1-5 10-6 11-1 5 3 6 7 4 6-2 22-16 11-21m82 143c0-3 1-7 4-9s6-1 6 2c1 4-3 10-5 12-4 2-5-1-5-5m5 8c7-4 12-25-2-19-8 3-5 23 2 19m-67-86l6-4-6 4m2-6c-1 2-6 5-5 8 1 2 3 2 5 1 4-1 6-9 10-10-5-3-6-3-10 1m1-156v25l1 10 5 7c4 1 3-10 3-13v-27c0-5 1-44-5-44l-4 5-1 11 1 26m37 24c0 3 0 6 3 8 2 1 3-1 4-3 2-4 1-11 1-15l-2-28v-12c0-2-1-9-4-9s-3 8-3 10c-1 17-2 33 1 49m145 191c-1 7-22 30-28 17-3-8 4-16 9-20 4-3 8-6 13-5 3 1 7 4 6 8m-11-12l-14 9c-1-1 7-13 8-14 7-8 11-2 15 5-1-4-3-10-7-12-5-2-10 4-12 7-4 6-5 12-7 18l-4 8c-2 2-4 5-4 8l5-5 1 7c1 3 3 5 7 6 6 1 13-5 17-9s9-10 9-16c0-7-7-13-14-12m17-107c-3 5-9 12-16 13-5 1-8-2-6-7 2-4 7-7 11-9 3-1 16-5 11 3m-2-9c-8 0-13 5-19 9 1-5 4-10 8-13 5-4 10-2 16 0-1-4-8-5-11-5-5 1-9 5-12 9l-7 16c-2 2-12 10-10 13l12-12c1 5 2 10 8 10 5-1 10-5 14-8 4-4 13-19 1-19m-103 47c-3 1-9 3-11-1-3-6 5-17 9-21 2-2 4-3 7-2 2 2 6 5 7 8 2 6-7 13-12 16m8-29c2 1 2 4-1 3-2-1-3-4 1-3m3 5c-1-3 1-8-4-8-3 0-7 3-10 4s-6 3-8 7c-1 3 0 3 2 1l-5 16c0 7 4 11 11 10 6-1 11-6 15-11l3-9c0-4-3-6-4-10m29-3c-3-5 3-13 8-11 11 5-5 18-8 11zm9-6c-1 0-8 3-7 5s7-4 7-5zm-360-9c0-2-5 1-5 2 1-2 6 2 5-2m256-158c6 0-2-30-6-28-5 3 0 28 6 28m11-14c6 1 5-12 2-14-6-5-9 13-2 14" />
        </g>
      </g>
    </svg>
  );
}

function Sharing({ url, title, summary }) {
  return (
    <div className="flex justify-center">
      <FacebookShareButton className="mx-1" url={url} quote={title}>
        <FacebookIcon size={32} round={true} />
      </FacebookShareButton>
      <EmailShareButton className="mx-1" url={url} subject={title}>
        <EmailIcon size={32} round={true} />
      </EmailShareButton>
      <TwitterShareButton
        className="mx-1"
        url={url}
        title={title}
        via={"vvoyer"}
      >
        <TwitterIcon size={32} round={true} />
      </TwitterShareButton>
      <LinkedinShareButton
        className="mx-1"
        url={url}
        title={title}
        summary={summary}
        source={"I Stay Home"}
      >
        <LinkedinIcon size={32} round={true} />
      </LinkedinShareButton>
      <RedditShareButton className="mx-1" url={url} title={title}>
        <RedditIcon size={32} round={true} />
      </RedditShareButton>
      <TelegramShareButton className="mx-1" url={url} title={title}>
        <TelegramIcon size={32} round={true} />
      </TelegramShareButton>
      <VKShareButton className="mx-1" url={url} title={title}>
        <VKIcon size={32} round={true} />
      </VKShareButton>
      <WhatsappShareButton className="mx-1" url={url} title={title}>
        <WhatsappIcon size={32} round={true} />
      </WhatsappShareButton>
    </div>
  );
}

Sharing.propTypes = {
  url: PropTypes.string,
  title: PropTypes.string,
  summary: PropTypes.string,
};

function closeMenuWhenOutside({ ref, selectRef, setMenuIsOpen }) {}
