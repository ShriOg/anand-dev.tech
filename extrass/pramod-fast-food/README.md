# Pramod Fast Food — Business README

This repository contains the static website for a real business: Pramod Fast Food. The site is intentionally minimal (plain HTML/CSS/JS) so it is easy to host, maintain, and update. Use this README to operate, edit, and deploy the site safely in production.

Business overview
-----------------

- Business name: Pramod Fast Food
- Location: [Insert address]
- Contact (phone): [Insert phone]
- Contact (email): [Insert email]
- Opening hours: [Insert hours]

If you want, I can add these details to `index.html` or a dedicated `contact` page.

Status & scope
---------------

- Static brochure site: presents menu, contact, hours, gallery.
- Does not include a built-in ordering backend. For online ordering, integrate a third-party ordering system, a form-to-email service, or a small server/API.

Project contents
----------------

- `index.html` — Main landing page (menu, hero, contact block).
- `css/style.css` — Primary stylesheet for layout and components.
- `js/` — Optional frontend behavior (small scripts if present).
- `admin/` — Optional management UI (if present, treat as sensitive).
- `old/` — Archive files.

Quick start (production-ready checklist)
---------------------------------------

1. Update business details in `index.html` (phone, address, hours, email).
2. Optimize images (resize and compress) and place them in an `assets/` or `images/` subfolder.
3. Serve the site over HTTPS (GitHub Pages, Netlify, Vercel, or a proper web server behind TLS).
4. Add analytics (privacy-compliant) if needed and a robots sitemap for SEO.
5. Protect any admin pages — they must not be publicly writable.

Production checklist (quick tick-list):

- [ ] Confirm contact details are current in `index.html`.
- [ ] Optimize and version-control `images/` or `assets/`.
- [ ] Enable HTTPS and verify TLS certificate.
- [ ] Test mobile layout and click-to-call on phones.
- [ ] Configure a basic backup of the repository and assets.
- [ ] Add a minimal privacy policy if collecting customer data.

Local preview
-------------

To preview locally, run either built-in Python server or a Node static server:

```bash
cd extrass/pramod-fast-food
python3 -m http.server 8080
# or
http-server -p 8080

# Visit http://localhost:8080
```

Editing content
---------------

- Text and structure: edit `index.html` for content changes.
- Styles: edit `css/style.css` for look-and-feel changes.
- Images: put image files in `images/` (create if missing) and update `src` paths in HTML/CSS.

Recommended content snippets
----------------------------

Menu section (example HTML):

```html
<section id="menu">
	<h2>Menu</h2>
	<ul class="menu-list">
		<li class="menu-item">
			<h3>Veg Thali</h3>
			<p class="price">₹120</p>
			<p class="desc">Rice, dal, sabzi, chapati, salad</p>
		</li>
		<li class="menu-item">
			<h3>Chicken Roll</h3>
			<p class="price">₹80</p>
			<p class="desc">Spiced chicken, fresh chutney</p>
		</li>
	</ul>
</section>
```

Contact / callback form (static → email using form service):

```html
<form action="https://formspree.io/f/<your-id>" method="POST">
	<label>Name<input name="name" required></label>
	<label>Phone<input name="phone" required></label>
	<label>Message<textarea name="message"></textarea></label>
	<button type="submit">Request Callback</button>
</form>
```

Gallery example (responsive grid):

```html
<section id="gallery">
	<h2>Gallery</h2>
	<div class="gallery-grid">
		<figure>
			<img src="images/dish-1.jpg" alt="Signature dish">
			<figcaption>Signature Plate</figcaption>
		</figure>
		<figure>
			<img src="images/interior-1.jpg" alt="Interior view">
			<figcaption>Cozy interior</figcaption>
		</figure>
		<figure>
			<img src="images/dish-2.jpg" alt="Popular snack">
			<figcaption>Popular snack</figcaption>
		</figure>
	</div>
</section>
```

Online ordering options
-----------------------

- Embed a third-party ordering widget (e.g., GloriaFood, Square, Zomato integrations) if you want orders to flow externally.
- For phone-only ordering, provide clear call-to-order instructions and a click-to-call number on mobile.
- For email or WhatsApp orders, include pre-filled message links.

Security, privacy & legal
-------------------------

- Ensure any admin pages are removed from public access or protected via HTTP auth / a simple server-side check.
- Use HTTPS for all production hosting.
- If collecting customer data (forms, orders), publish a minimal privacy policy and secure stored data.

Performance & accessibility
--------------------------

- Optimize images (WebP/AVIF where supported) and set width/height attributes.
- Use semantic HTML, alt attributes for images, and logical heading order for accessibility.

Deployment options
------------------

- GitHub Pages — simplest for static sites. Ensure repository settings point to the correct branch/folder.
- Netlify or Vercel — supports redirects, forms, and staging workflows.
- Traditional VPS (Nginx) — use Certbot for TLS and configure appropriate cache headers.

Maintenance & backups
---------------------

- Keep a copy of the site in a Git repo and tag production releases.
- Backup image assets and any dynamic data (orders, customer records) off-site.

Analytics & monitoring
----------------------

- Add privacy-first analytics (Plausible, SimpleAnalytics) or Google Analytics if needed. Document tracking IDs in this README.

License & ownership
-------------------

- This repo currently does not include a license file. For an in-house business site you can:
	- Keep proprietary rights (no LICENSE file) — suitable for privately maintained sites.
	- Add an open-source license (MIT/Apache) if you want to allow reuse.

If you want, I can create a `LICENSE` file (recommendation: MIT if you want permissive reuse).

Support & contact
-----------------

For help customizing the site, deployment, or adding an ordering backend, contact the maintainer:

- Email: [Insert email]
- Phone / WhatsApp: [Insert phone]

Change log
----------

- v1.0 — Initial business README and operational guidance.

Next steps I can do now
-----------------------

- Add business contact details directly into `index.html`.
- Create `images/` folder and optimize/organize images.
- Add a `LICENSE` file (proprietary or MIT).
- Provide a small admin-protection suggestion (HTTP auth example).

File: [extrass/pramod-fast-food/README.md](extrass/pramod-fast-food/README.md)
