# iLuvBnMe Blog & Podcast Website

This is a static web app you can put live without Squarespace.

## What is included

- Home page
- Blog list, search, category filters, and full post pages
- Podcast page, episode list, show notes, and audio/link fields
- 7 full blog articles imported from the Netlify package
- 7 full podcast episodes imported from the Netlify package, each with show notes and transcript blocks
- Newsletter and contact forms prepared for Netlify Forms
- `/admin` publishing area prepared for Decap CMS on Netlify
- iLuvBnMe logo and founder images from the design files
- SEO basics: per-page metadata, Open Graph/Twitter sharing tags, structured data, `sitemap.xml`, `robots.txt`, and `feed.xml`
- Static SEO pages for `/blog/`, `/podcast/`, every `/post/.../`, and every `/episode/.../`

## SEO launch note

Before launch, update `site.url` in `content.json` to your final domain if it is not `https://iluvbnme.com`.
After the site is live, submit `https://your-domain.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

When content changes, run:

`node scripts/generate-static-pages.js`

That refreshes the static SEO pages, sitemap, feed, and robots file.

## How to preview

Open a local server in this folder, then visit:

`http://localhost:4173`

## How to go live easily

1. Create a free Netlify account.
2. Add this folder to a GitHub repository.
3. In Netlify, choose "Add new site" and connect the repository.
4. Use these build settings:
   - Build command: leave blank
   - Publish directory: `.`
5. In Netlify, enable Forms.
6. To use `/admin`, enable Identity and Git Gateway in Netlify.
7. Invite yourself as an Identity user, then visit `/admin` on the live site.

After that, you can edit `content.json` from the admin area and publish blog posts or podcast episodes to the live site.
