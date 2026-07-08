const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const content = JSON.parse(fs.readFileSync(path.join(root, "content.json"), "utf8"));
const baseUrl = (content.site.url || "https://iluvbnme.com").replace(/\/$/, "");
const today = new Date().toISOString().slice(0, 10);

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const excerpt = (text = "", max = 155) => (text.length > max ? `${text.slice(0, max).trim()}...` : text);
const absolute = (asset = "") => {
  if (/^https?:\/\//i.test(asset)) return asset;
  return `${baseUrl}/${asset.replace(/^\//, "")}`;
};

function writeFile(file, html) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

function blockHtml(block) {
  if (typeof block === "string") return `<p>${escapeHtml(block)}</p>`;
  if (!block || typeof block !== "object") return "";
  if (block.t === "h2") return `<h2>${escapeHtml(block.x)}</h2>`;
  if (block.t === "quote") return `<blockquote>${escapeHtml(block.x)}</blockquote>`;
  if (block.t === "cue") return `<p class="transcript-cue">${escapeHtml(block.x)}</p>`;
  if (block.t === "steps") {
    const items = (block.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    return `<div class="steps-block">${block.intro ? `<p>${escapeHtml(block.intro)}</p>` : ""}<ol>${items}</ol></div>`;
  }
  return `<p>${escapeHtml(block.x || "")}</p>`;
}

function page({ title, description, pathName, image, type = "website", schema, body }) {
  const canonical = `${baseUrl}${pathName}`;
  const imageUrl = absolute(image || "images/covers/be-big-be-bold-be-you.png");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="alternate" type="application/rss+xml" title="iLuvBnMe Blog & Podcast Feed" href="/feed.xml" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />
    <meta property="og:image" content="${escapeHtml(imageUrl)}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:site_name" content="iLuvBnMe" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Mulish:wght@300;400;500;600;700;800&family=Parisienne&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/styles.css" />
    <script type="application/ld+json">${JSON.stringify(schema)}</script>
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="/" aria-label="iLuvBnMe home">
        <img src="/assets/logo-mark-plum.png" alt="" />
        <img src="/assets/logo-word-plum.png" alt="iLuvBnMe" />
      </a>
      <nav class="site-nav static-nav" aria-label="Main navigation">
        <a href="/">Home</a>
        <a href="/podcast/">Podcast</a>
        <a href="/blog/">Blog</a>
        <a href="/#\/about">About</a>
        <a class="nav-pill" href="/#\/start">Free Kit</a>
      </nav>
    </header>
    <main>${body}</main>
    <footer class="site-footer">
      <div>
        <img src="/assets/logo-full-plum.png" alt="iLuvBnMe" />
        <p>Tarot, astrology, human design, and self-love for the woman who is done shrinking.</p>
      </div>
      <div>
        <h2>Explore</h2>
        <a href="/podcast/">Podcast</a>
        <a href="/blog/">Blog</a>
        <a href="/#\/start">Self-Love Starter Kit</a>
        <a href="/#\/about">About Stefy</a>
      </div>
      <div>
        <h2>Publish</h2>
        <a href="/admin/">Open admin</a>
        <a href="/#\/contact">Contact</a>
        <a href="/#\/start">Join the list</a>
      </div>
    </footer>
  </body>
</html>
`;
}

function schemaBase() {
  return {
    "@context": "https://schema.org",
    publisher: {
      "@type": "Organization",
      name: "iLuvBnMe",
      logo: absolute("assets/logo-full-plum.png"),
    },
  };
}

function generatePost(post) {
  const pathName = `/post/${post.slug}/`;
  const schema = {
    ...schemaBase(),
    "@type": "BlogPosting",
    headline: post.title,
    description: excerpt(post.excerpt),
    image: absolute(post.cover),
    datePublished: post.date,
    dateModified: post.date,
    mainEntityOfPage: `${baseUrl}${pathName}`,
    author: { "@type": "Person", name: "Stefy" },
  };
  const body = `
    <article class="article">
      <a class="back-link" href="/blog/">Back to blog</a>
      <p class="meta">${escapeHtml(post.category)} . ${escapeHtml(post.date)} . ${escapeHtml(post.readTime)}</p>
      <h1>${escapeHtml(post.title)}</h1>
      <p class="article-excerpt">${escapeHtml(post.excerpt)}</p>
      <div class="card-art image-art"><img src="/${post.cover}" alt="" /></div>
      <div class="article-body">${post.body.map(blockHtml).join("")}</div>
    </article>
  `;
  writeFile(path.join(root, "post", post.slug, "index.html"), page({
    title: `${post.title} | iLuvBnMe Blog`,
    description: excerpt(post.excerpt),
    pathName,
    image: post.cover,
    type: "article",
    schema,
    body,
  }));
}

function generateEpisode(episode) {
  const pathName = `/episode/${episode.slug}/`;
  const schema = {
    ...schemaBase(),
    "@type": "PodcastEpisode",
    name: episode.title,
    description: episode.description,
    datePublished: episode.date,
    image: absolute(episode.cover),
    url: `${baseUrl}${pathName}`,
    partOfSeries: {
      "@type": "PodcastSeries",
      name: "iLuvBnMe: Tarot, Stars & Self-Love",
      url: `${baseUrl}/podcast/`,
    },
  };
  const body = `
    <article class="article episode-detail">
      <a class="back-link" href="/podcast/">Back to podcast</a>
      <p class="meta">${escapeHtml(episode.tag)} . ${escapeHtml(episode.date)} . ${escapeHtml(episode.duration)}</p>
      <h1>${escapeHtml(episode.title)}</h1>
      <p class="article-excerpt">${escapeHtml(episode.description)}</p>
      <div class="card-art image-art"><img src="/${episode.cover}" alt="" /></div>
      <div class="article-body">
        <h2>Show notes</h2>
        <ul class="show-notes">${episode.showNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>
        <h2>Transcript</h2>
        ${episode.transcript.map(blockHtml).join("")}
      </div>
    </article>
  `;
  writeFile(path.join(root, "episode", episode.slug, "index.html"), page({
    title: `${episode.title} | iLuvBnMe Podcast`,
    description: excerpt(episode.description),
    pathName,
    image: episode.cover,
    type: "article",
    schema,
    body,
  }));
}

function generateListing(kind) {
  const isBlog = kind === "blog";
  const items = isBlog ? [...content.posts] : [...content.episodes];
  items.sort((a, b) => new Date(b.date) - new Date(a.date));
  const cards = items
    .map((item) => {
      const href = isBlog ? `/post/${item.slug}/` : `/episode/${item.slug}/`;
      const sub = isBlog ? `${item.category} . ${item.readTime}` : `${item.tag} . ${item.duration}`;
      return `<a class="content-card" href="${href}">
        <div class="card-art image-art"><img src="/${item.cover}" alt="" /></div>
        <div>
          <p class="meta">${escapeHtml(item.date)} . ${escapeHtml(sub)}</p>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(isBlog ? item.excerpt : item.description)}</p>
          <span>${isBlog ? "Read more" : "Show notes"}</span>
        </div>
      </a>`;
    })
    .join("");
  const body = `
    <section class="page-hero">
      <p class="script">${isBlog ? "the journal" : "the podcast"}</p>
      <h1>${isBlog ? "Love letters to who you're growing into" : "iLuvBnMe: Tarot, Stars & Self-Love"}</h1>
      <p>${isBlog ? "Essays, rituals, and moon musings on tarot, astrology, human design, and self-love." : "Weekly readings, cosmic weather, show notes, and full transcripts."}</p>
    </section>
    <section class="card-grid">${cards}</section>
  `;
  writeFile(path.join(root, kind, "index.html"), page({
    title: isBlog ? "The Journal | iLuvBnMe Blog" : "iLuvBnMe Podcast | Tarot, Stars & Self-Love",
    description: isBlog
      ? "Read iLuvBnMe essays, rituals, and moon musings on tarot, astrology, human design, and self-love."
      : "Listen to iLuvBnMe podcast episodes with tarot readings, astrology guidance, rituals, show notes, and transcripts.",
    pathName: `/${kind}/`,
    image: isBlog ? "images/covers/blog-love-letter.png" : "images/covers/podcast-cover.png",
    schema: {
      ...schemaBase(),
      "@type": isBlog ? "Blog" : "CollectionPage",
      name: isBlog ? "The Journal | iLuvBnMe Blog" : "iLuvBnMe Podcast",
      url: `${baseUrl}/${kind}/`,
    },
    body,
  }));
}

function generateSitemapAndFeed() {
  const xml = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&apos;");
  const pages = [
    ["/", today, "weekly", "1.0"],
    ["/blog/", today, "weekly", "0.9"],
    ["/podcast/", today, "weekly", "0.9"],
    ["/start", today, "monthly", "0.8"],
    ["/about", today, "monthly", "0.7"],
    ["/contact", today, "monthly", "0.5"],
    ...content.posts.map((post) => [`/post/${post.slug}/`, post.date, "monthly", "0.8"]),
    ...content.episodes.map((episode) => [`/episode/${episode.slug}/`, episode.date, "monthly", "0.8"]),
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map(([pathName, lastmod, changefreq, priority]) => `  <url>\n    <loc>${xml(`${baseUrl}${pathName}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`)
    .join("\n")}\n</urlset>\n`;
  fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);

  const items = [
    ...content.posts.map((post) => ({
      title: post.title,
      link: `${baseUrl}/post/${post.slug}/`,
      date: post.date,
      description: post.excerpt,
    })),
    ...content.episodes.map((episode) => ({
      title: episode.title,
      link: `${baseUrl}/episode/${episode.slug}/`,
      date: episode.date,
      description: episode.description,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));
  const feed = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${xml(content.site.title)} Blog &amp; Podcast</title>\n    <link>${xml(baseUrl)}</link>\n    <atom:link href="${xml(`${baseUrl}/feed.xml`)}" rel="self" type="application/rss+xml" />\n    <description>Tarot, astrology, human design, rituals, podcast transcripts, and self-love essays from iLuvBnMe.</description>\n    <language>en-us</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n${items
    .map((item) => `    <item>\n      <title>${xml(item.title)}</title>\n      <link>${xml(item.link)}</link>\n      <guid>${xml(item.link)}</guid>\n      <pubDate>${new Date(`${item.date}T12:00:00`).toUTCString()}</pubDate>\n      <description>${xml(item.description)}</description>\n    </item>`)
    .join("\n")}\n  </channel>\n</rss>\n`;
  fs.writeFileSync(path.join(root, "feed.xml"), feed);
  fs.writeFileSync(path.join(root, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${baseUrl}/sitemap.xml\n`);
}

content.posts.forEach(generatePost);
content.episodes.forEach(generateEpisode);
generateListing("blog");
generateListing("podcast");
generateSitemapAndFeed();

console.log(`Generated ${content.posts.length} static post pages and ${content.episodes.length} static episode pages.`);
