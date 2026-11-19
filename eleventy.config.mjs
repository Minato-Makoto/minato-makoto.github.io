export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "public/google96fbb76f00681fc4.html": "google96fbb76f00681fc4.html" });
  eleventyConfig.addPassthroughCopy({ "public/.nojekyll": ".nojekyll" });

  eleventyConfig.addFilter("safeJson", (value, indent = 0) => {
    return JSON.stringify(value, null, indent).replace(/<\//g, "<\\/");
  });

  eleventyConfig.addFilter("sitemapEntries", (collectionAll = [], catalog) => {
    const siteUrl = catalog.site.url.replace(/\/+$/, "");
    const entries = new Map();

    const addEntry = (urlPath, lastmod = null) => {
      if (!urlPath) return;
      const normalizedPath = urlPath.startsWith("/") ? urlPath : `/${urlPath}`;
      const loc = `${siteUrl}${normalizedPath}`;
      if (!entries.has(loc)) {
        entries.set(loc, { loc, lastmod: lastmod || null });
      }
    };

    for (const item of collectionAll) {
      const url = item && item.url;
      const data = (item && item.data) || {};
      if (!url || data.permalink === false || data.canonical === false || data.sitemap === false) continue;
      if (typeof data.robots === "string" && data.robots.toLowerCase().includes("noindex")) continue;
      if (!url.endsWith("/") && !url.endsWith(".html")) continue;
      if (url === "/404.html") continue;
      addEntry(url, data.lastmod || null);
    }

    for (const node of catalog.nodes || []) {
      addEntry(node.permalink, node.lastmod || null);
    }

    return Array.from(entries.values());
  });

  eleventyConfig.addFilter("nodeSchema", (node, catalog) => {
    const siteUrl = catalog.site.url;
    const author = catalog.author;
    const pageUrl = `${siteUrl}${node.permalink}`;

    if (node.id === "genesis-node") {
      return {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        "url": pageUrl,
        "name": node.seoTitle || node.title,
        "description": node.seoDescription,
        "mainEntity": {
          "@type": "Person",
          "name": author.name,
          "alternateName": author.alternateName,
          "birthDate": "1997-03-29",
          "jobTitle": author.jobTitle,
          "url": `${siteUrl}/`,
          "email": `mailto:${author.email}`,
          "telephone": author.phoneE164,
          "sameAs": author.sameAs
        }
      };
    }

    if (node.video && node.video.exportVideoObject) {
      return {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": node.video.name,
        "description": node.video.description,
        "thumbnailUrl": node.video.thumbnailUrl,
        "uploadDate": node.video.uploadDate,
        "embedUrl": node.video.embedUrl,
        "url": pageUrl,
        "sameAs": node.video.sourceUrl,
        "creator": {
          "@type": "Person",
          "name": author.name,
          "alternateName": author.alternateName,
          "url": `${siteUrl}/`
        }
      };
    }

    return {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": node.title,
      "description": node.seoDescription || node.greeting,
      "url": pageUrl,
      "about": node.category,
      "temporalCoverage": node.year,
      "creator": {
        "@type": "Person",
        "name": author.name,
        "alternateName": author.alternateName,
        "url": `${siteUrl}/`
      }
    };
  });

  eleventyConfig.addFilter("homeSchema", (catalog) => {
    const siteUrl = catalog.site.url;
    const author = catalog.author;
    return [
      {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": author.name,
        "alternateName": author.alternateName,
        "jobTitle": author.jobTitle,
        "url": `${siteUrl}/`,
        "email": `mailto:${author.email}`,
        "telephone": author.phoneE164,
        "sameAs": author.sameAs
      },
      {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        "name": catalog.site.title,
        "description": catalog.site.description,
        "url": `${siteUrl}/`,
        "mainEntity": {
          "@type": "ItemList",
          "itemListElement": catalog.nodes.map((item, idx) => ({
            "@type": "ListItem",
            "position": idx + 1,
            "name": item.title,
            "url": `${siteUrl}${item.permalink}`
          }))
        }
      }
    ];
  });

  return {
    dir: {
      input: "content",
      includes: "../_includes",
      data: "../_data",
      output: "_site"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
}
