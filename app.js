const app = document.querySelector("#app");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("#site-nav");

let content = { site: {}, posts: [], episodes: [] };
let state = { query: "", filter: "All" };

const formatDate = (value) =>
  new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${value}T12:00:00`)
  );

const byNewest = (a, b) => new Date(b.date) - new Date(a.date);
const excerpt = (text, max = 150) => (text.length > max ? `${text.slice(0, max).trim()}...` : text);
const route = () => {
  const hashRoute = (location.hash.replace(/^#/, "") || "").replace(/\/$/, "");
  if (hashRoute) return hashRoute || "/";
  const cleanRoute = location.pathname.replace(/\/$/, "") || "/";
  return cleanRoute === "/index.html" ? "/" : cleanRoute;
};
const routePath = () => {
  const current = route();
  const [, section, slug] = current.split("/");
  if (section === "post") return `/post/${slug}`;
  if (section === "episode") return `/episode/${slug}`;
  return current === "/" ? "/" : current;
};
const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function siteUrl(path = routePath()) {
  const base = (content.site.url || `${location.origin}`).replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function absoluteAsset(path = "") {
  if (!path) return siteUrl("/images/covers/be-big-be-bold-be-you.png");
  if (/^https?:\/\//i.test(path)) return path;
  return siteUrl(`/${path.replace(/^\//, "")}`);
}

function setMeta(selector, value, attr = "content") {
  const element = document.querySelector(selector);
  if (element) element.setAttribute(attr, value);
}

function pageMeta() {
  const current = route();
  const [, section, slug] = current.split("/");
  const defaults = {
    title: "iLuvBnMe | Blog, Podcast & Self-Love Tools",
    description: "Tarot, astrology, human design, and self-love for the woman who is done shrinking.",
    image: "images/covers/be-big-be-bold-be-you.png",
    path: routePath(),
    type: "website",
  };

  if (section === "blog") {
    return {
      ...defaults,
      title: "The Journal | iLuvBnMe Blog",
      description: "Read iLuvBnMe essays, rituals, and moon musings on tarot, astrology, human design, and self-love.",
      path: "/blog",
    };
  }
  if (section === "podcast") {
    return {
      ...defaults,
      title: "iLuvBnMe Podcast | Tarot, Stars & Self-Love",
      description: "Listen to weekly iLuvBnMe podcast episodes with tarot readings, astrology guidance, rituals, and self-love transcripts.",
      image: "images/covers/podcast-cover.png",
      path: "/podcast",
    };
  }
  if (section === "post") {
    const post = content.posts.find((item) => item.slug === slug);
    if (post) {
      return {
        ...defaults,
        title: `${post.title} | iLuvBnMe Blog`,
        description: excerpt(post.excerpt, 155),
        image: post.cover,
        path: `/post/${post.slug}`,
        type: "article",
        item: post,
      };
    }
  }
  if (section === "episode") {
    const episode = content.episodes.find((item) => item.slug === slug);
    if (episode) {
      return {
        ...defaults,
        title: `${episode.title} | iLuvBnMe Podcast`,
        description: excerpt(episode.description, 155),
        image: episode.cover,
        path: `/episode/${episode.slug}`,
        type: "article",
        item: episode,
      };
    }
  }
  if (section === "about") return { ...defaults, title: "About Stefy | iLuvBnMe", path: "/about" };
  if (section === "start") {
    return {
      ...defaults,
      title: "Free Self-Love Starter Kit | iLuvBnMe",
      description: "Get the free iLuvBnMe Self-Love Starter Kit with a tarot spread, moon ritual, journal prompts, and cosmic self-love guide.",
      path: "/start",
    };
  }
  if (section === "contact") return { ...defaults, title: "Contact iLuvBnMe", path: "/contact" };
  return defaults;
}

function structuredData(meta) {
  const base = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl("/")}/#organization`,
        name: "iLuvBnMe",
        url: siteUrl("/"),
        logo: absoluteAsset("assets/logo-full-plum.png"),
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl("/")}/#website`,
        name: "iLuvBnMe",
        url: siteUrl("/"),
        description: "Tarot, astrology, human design, and self-love blog and podcast.",
        publisher: { "@id": `${siteUrl("/")}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl("/blog")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  if (meta.item && route().startsWith("/post/")) {
    base["@graph"].push({
      "@type": "BlogPosting",
      headline: meta.item.title,
      description: meta.description,
      image: absoluteAsset(meta.image),
      datePublished: meta.item.date,
      dateModified: meta.item.date,
      mainEntityOfPage: siteUrl(meta.path),
      author: { "@type": "Person", name: "Stefy" },
      publisher: { "@id": `${siteUrl("/")}/#organization` },
    });
  }

  if (meta.item && route().startsWith("/episode/")) {
    base["@graph"].push({
      "@type": "PodcastEpisode",
      name: meta.item.title,
      description: meta.item.description,
      datePublished: meta.item.date,
      timeRequired: meta.item.duration,
      image: absoluteAsset(meta.image),
      url: siteUrl(meta.path),
      partOfSeries: {
        "@type": "PodcastSeries",
        name: "iLuvBnMe: Tarot, Stars & Self-Love",
        url: siteUrl("/podcast"),
      },
    });
  }

  return base;
}

function updateMeta() {
  const meta = pageMeta();
  const url = siteUrl(meta.path);
  const image = absoluteAsset(meta.image);

  document.title = meta.title;
  setMeta("#meta-description", meta.description);
  setMeta("#canonical-link", url, "href");
  setMeta("#og-title", meta.title);
  setMeta("#og-description", meta.description);
  setMeta("#og-url", url);
  setMeta("#og-image", image);
  setMeta("meta[property='og:type']", meta.type);
  setMeta("#twitter-title", meta.title);
  setMeta("#twitter-description", meta.description);
  setMeta("#twitter-image", image);
  const json = document.querySelector("#structured-data");
  if (json) json.textContent = JSON.stringify(structuredData(meta));
}

function shell(inner) {
  updateMeta();
  app.innerHTML = inner;
  app.focus({ preventScroll: true });
  bindForms();
  bindFilters();
  document.querySelectorAll("[data-route]").forEach((link) => {
    link.classList.toggle("active", link.dataset.route === route());
  });
}

function cardArt(label = "iLuvBnMe", image = "") {
  if (image) {
    return `
      <div class="card-art image-art">
        <img src="${image}" alt="" />
      </div>
    `;
  }
  return `
    <div class="card-art" aria-hidden="true">
      <span>${label}</span>
      <i></i><i></i><i></i>
    </div>
  `;
}

function newsletter(source = "site") {
  return `
    <form class="signup-form" name="newsletter" method="POST" data-netlify="true" netlify-honeypot="bot-field">
      <input type="hidden" name="form-name" value="newsletter" />
      <input type="hidden" name="source" value="${source}" />
      <p class="hidden"><label>Do not fill this out <input name="bot-field" /></label></p>
      <label class="sr-only" for="newsletter-${source}">Email address</label>
      <input id="newsletter-${source}" type="email" name="email" placeholder="your@email.com" required />
      <button type="submit">Join the list</button>
      <p class="form-note" role="status"></p>
    </form>
  `;
}

function renderHome() {
  const posts = [...content.posts].sort(byNewest);
  const episodes = [...content.episodes].sort(byNewest);
  shell(`
    <section class="hero">
      <div class="hero-copy">
        <p class="script">welcome, beautiful soul</p>
        <h1>You were always the magic.</h1>
        <p class="lede">Tarot, astrology, human design, and self-love to help you understand your energy, trust your intuition, and belong to yourself again.</p>
        <div class="hero-actions">
          <a class="button primary" href="#/start">Get the free kit</a>
          <a class="button secondary" href="#/podcast">Listen to the podcast</a>
        </div>
        ${newsletter("home")}
      </div>
      <div class="hero-portrait">
        <img src="assets/founder.png" alt="Stefy, founder of iLuvBnMe" />
        <span>be big . be bold . be you</span>
      </div>
    </section>

    <section class="intro-grid">
      <article>
        <p class="eyebrow">The Podcast</p>
        <h2>Voice notes for your growth.</h2>
        <p>Weekly readings, cosmic weather, and grounded pep-talks for the woman choosing herself out loud.</p>
        <a href="#/podcast">Listen now</a>
      </article>
      <article>
        <p class="eyebrow">The Journal</p>
        <h2>Love letters to who you are becoming.</h2>
        <p>Essays, rituals, and moon musings for quiet mornings, fresh pages, and honest self-return.</p>
        <a href="#/blog">Read the blog</a>
      </article>
    </section>

    <section class="featured-band">
      <div>
        <p class="script">latest episode</p>
        <h2>${episodes[0]?.title || "Your next episode title"}</h2>
        <p>${episodes[0]?.description || "Add your first podcast episode in the content file or admin area."}</p>
        <a class="button light" href="#/episode/${episodes[0]?.slug || ""}">Show notes</a>
      </div>
    </section>

    <section class="section-head">
      <p class="eyebrow">Fresh from the journal</p>
      <h2>Start where your spirit feels pulled.</h2>
    </section>
    <section class="card-grid">
      ${posts.slice(0, 3).map(postCard).join("")}
    </section>
  `);
}

function postCard(post) {
  return `
    <a class="content-card" href="#/post/${post.slug}">
      ${cardArt(post.category, post.cover)}
      <div>
        <p class="meta">${formatDate(post.date)} . ${post.readTime}</p>
        <h3>${post.title}</h3>
        <p>${post.excerpt}</p>
        <span>Read more</span>
      </div>
    </a>
  `;
}

function episodeCard(episode) {
  return `
    <a class="episode-row" href="#/episode/${episode.slug}">
      <img src="${episode.cover}" alt="" />
      <div>
        <span>${episode.tag}</span>
        <h3>${episode.title}</h3>
        <p>${formatDate(episode.date)} . ${episode.duration} . ${episode.description}</p>
      </div>
      <strong>Play</strong>
    </a>
  `;
}

function renderBlock(block) {
  if (typeof block === "string") return `<p>${escapeHtml(block)}</p>`;
  if (!block || typeof block !== "object") return "";
  if (block.t === "h2") return `<h2>${escapeHtml(block.x)}</h2>`;
  if (block.t === "quote") return `<blockquote>${escapeHtml(block.x)}</blockquote>`;
  if (block.t === "cue") return `<p class="transcript-cue">${escapeHtml(block.x)}</p>`;
  if (block.t === "steps") {
    const items = (block.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    return `
      <div class="steps-block">
        ${block.intro ? `<p>${escapeHtml(block.intro)}</p>` : ""}
        <ol>${items}</ol>
      </div>
    `;
  }
  return `<p>${escapeHtml(block.x || "")}</p>`;
}

function renderBlog() {
  const queryParam = new URLSearchParams(location.search).get("q");
  if (queryParam && !state.query) state.query = queryParam;
  const categories = ["All", ...new Set(content.posts.map((post) => post.category))];
  const posts = content.posts
    .filter((post) => state.filter === "All" || post.category === state.filter)
    .filter((post) => `${post.title} ${post.excerpt} ${post.category}`.toLowerCase().includes(state.query.toLowerCase()))
    .sort(byNewest);

  shell(`
    <section class="page-hero">
      <p class="script">the journal</p>
      <h1>Love letters to who you're growing into</h1>
      <p>Essays, rituals, and moon musings on tarot, astrology, human design, and the art of loving yourself.</p>
    </section>
    <section class="toolbar">
      <label>
        <span>Search posts</span>
        <input data-search type="search" value="${state.query}" placeholder="Search tarot, astrology, self-love..." />
      </label>
      <div class="filters">
        ${categories.map((category) => `<button type="button" data-filter="${category}" class="${category === state.filter ? "active" : ""}">${category}</button>`).join("")}
      </div>
    </section>
    <section class="card-grid">
      ${posts.length ? posts.map(postCard).join("") : `<p class="empty">No posts found yet. Try a different search.</p>`}
    </section>
  `);
}

function renderPodcast() {
  const episodes = [...content.episodes].sort(byNewest);
  const featured = episodes.find((episode) => episode.featured) || episodes[0];
  shell(`
    <section class="page-hero">
      <p class="script">the podcast</p>
      <h1>iLuvBnMe: Tarot, Stars & Self-Love</h1>
      <p>Weekly readings, cosmic weather, and real pep-talks for your growth, like voice notes from a friend who believes in you.</p>
    </section>
    <section class="player-card">
      ${cardArt("Now playing", featured?.cover)}
      <div>
        <p class="eyebrow">Latest episode . ${featured ? formatDate(featured.date) : "Coming soon"}</p>
        <h2>${featured?.title || "Add your first episode"}</h2>
        <p>${featured?.description || "Your podcast feed is ready for episode links, show notes, and embedded audio."}</p>
        ${featured?.audioUrl ? `<audio controls src="${featured.audioUrl}"></audio>` : `<p class="audio-placeholder">Add an audio URL in admin to turn this into a real player.</p>`}
        <div class="listen-links">
          <a href="${featured?.spotifyUrl || "#"}">Spotify</a>
          <a href="${featured?.appleUrl || "#"}">Apple</a>
          <a href="${featured?.youtubeUrl || "#"}">YouTube</a>
        </div>
      </div>
    </section>
    <section class="section-head compact">
      <p class="eyebrow">All episodes</p>
      <h2>Choose what your heart needs today.</h2>
    </section>
    <section class="episode-list">
      ${episodes.map(episodeCard).join("")}
    </section>
  `);
}

function renderPost(slug) {
  const post = content.posts.find((item) => item.slug === slug);
  if (!post) return renderNotFound();
  shell(`
    <article class="article">
      <a class="back-link" href="#/blog">Back to blog</a>
      <p class="meta">${post.category} . ${formatDate(post.date)} . ${post.readTime}</p>
      <h1>${post.title}</h1>
      <p class="article-excerpt">${post.excerpt}</p>
      ${cardArt(post.category, post.cover)}
      <div class="article-body">
        ${post.body.map(renderBlock).join("")}
      </div>
      <aside class="article-cta">
        <h2>Want the next love letter?</h2>
        <p>Join the iLuvBnMe list for new posts, episodes, and the Self-Love Starter Kit.</p>
        ${newsletter("article")}
      </aside>
    </article>
  `);
}

function renderEpisode(slug) {
  const episode = content.episodes.find((item) => item.slug === slug);
  if (!episode) return renderNotFound();
  shell(`
    <article class="article episode-detail">
      <a class="back-link" href="#/podcast">Back to podcast</a>
      <p class="meta">${episode.tag} . ${formatDate(episode.date)} . ${episode.duration}</p>
      <h1>${episode.title}</h1>
      <p class="article-excerpt">${episode.description}</p>
      ${episode.audioUrl ? `<audio controls src="${episode.audioUrl}"></audio>` : `<p class="audio-placeholder">Add the audio file or podcast host URL in admin when this episode is ready.</p>`}
      <div class="listen-links">
        <a href="${episode.spotifyUrl}">Spotify</a>
        <a href="${episode.appleUrl}">Apple Podcasts</a>
        <a href="${episode.youtubeUrl}">YouTube</a>
      </div>
      <div class="article-body">
        <h2>Show notes</h2>
        <ul class="show-notes">
          ${episode.showNotes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
        </ul>
        <h2>Transcript</h2>
        ${episode.transcript.map(renderBlock).join("")}
      </div>
    </article>
  `);
}

function renderAbout() {
  shell(`
    <section class="about-page">
      <img src="assets/founder.png" alt="Stefy, founder of iLuvBnMe" />
      <div>
        <p class="script">hi, i'm Stefy</p>
        <h1>You already know who you are.</h1>
        <p>iLuvBnMe was born from a simple, radical idea: loving yourself is not something you earn. It is something you already own.</p>
        <p>Through tarot, the stars, and human design, this space helps you put language to what your spirit has been trying to tell you all along.</p>
        <a class="button primary" href="#/contact">Work with me</a>
      </div>
    </section>
  `);
}

function renderStart() {
  shell(`
    <section class="kit-page">
      <p class="script">a little gift, from me to you</p>
      <h1>The Self-Love Starter Kit</h1>
      <p>A guided tarot spread, moon ritual, self-trust journal prompts, and a cosmic cheat sheet for coming home to yourself.</p>
      ${newsletter("starter-kit")}
    </section>
  `);
}

function renderContact() {
  shell(`
    <section class="contact-page">
      <div>
        <p class="script">send a note</p>
        <h1>Let's create something soulful.</h1>
        <p>Use this for podcast questions, collaborations, readings, or anything iLuvBnMe related.</p>
      </div>
      <form class="contact-form" name="contact" method="POST" data-netlify="true" netlify-honeypot="bot-field">
        <input type="hidden" name="form-name" value="contact" />
        <p class="hidden"><label>Do not fill this out <input name="bot-field" /></label></p>
        <label>Name <input name="name" required /></label>
        <label>Email <input type="email" name="email" required /></label>
        <label>Message <textarea name="message" rows="6" required></textarea></label>
        <button type="submit">Send message</button>
        <p class="form-note" role="status"></p>
      </form>
    </section>
  `);
}

function renderNotFound() {
  shell(`
    <section class="page-hero">
      <p class="script">lost in the stars</p>
      <h1>That page is not here yet.</h1>
      <p>The link may have moved, or the post might still be becoming.</p>
      <a class="button primary" href="#/">Go home</a>
    </section>
  `);
}

function render() {
  const current = route();
  const [, section, slug] = current.split("/");
  if (current === "/") return renderHome();
  if (section === "blog") return renderBlog();
  if (section === "podcast") return renderPodcast();
  if (section === "post") return renderPost(slug);
  if (section === "episode") return renderEpisode(slug);
  if (section === "about") return renderAbout();
  if (section === "start") return renderStart();
  if (section === "contact") return renderContact();
  return renderNotFound();
}

function bindForms() {
  document.querySelectorAll("form[data-netlify]:not([hidden])").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const note = form.querySelector(".form-note");
      const data = new FormData(form);
      try {
        const response = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(data).toString(),
        });
        if (!response.ok) throw new Error("Form failed");
        form.reset();
        if (note) note.textContent = "You're in. Thank you for trusting this space.";
      } catch {
        if (note) note.textContent = "This will work once the site is live on Netlify. For now, your form is ready.";
      }
    });
  });
}

function bindFilters() {
  const search = document.querySelector("[data-search]");
  if (search) {
    search.addEventListener("input", (event) => {
      state.query = event.target.value;
      renderBlog();
    });
  }
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.filter = button.dataset.filter;
      renderBlog();
    });
  });
}

menuToggle.addEventListener("click", () => {
  const open = siteNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
});

siteNav.addEventListener("click", () => {
  siteNav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
});

window.addEventListener("hashchange", render);

fetch("content.json")
  .then((response) => response.json())
  .then((data) => {
    content = data;
    render();
  })
  .catch(() => {
    app.innerHTML = `<section class="page-hero"><h1>Content could not load.</h1><p>Check that content.json is available beside this page.</p></section>`;
  });
