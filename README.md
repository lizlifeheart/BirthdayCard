# Birthday Card Book

An interactive, flippable virtual birthday card. Swipe or tap to turn the pages,
each turn plays a page-turn sound (synthesized in the browser, or your own
uploaded sound file), and two of the pages have photo frames you can tap to
add your own pictures.

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

The build output lands in `dist/`, which you can deploy anywhere that serves
static files (GitHub Pages, Netlify, Vercel, etc.).

## Deploying to GitHub Pages

1. Push this repo to GitHub.
2. In `vite.config.js`, add a `base` option matching your repo name:
   ```js
   export default defineConfig({
     plugins: [react()],
     base: "/your-repo-name/",
   });
   ```
3. Run `npm run build`, then publish the contents of `dist/` to a `gh-pages`
   branch (e.g. with the `gh-pages` npm package, or GitHub Actions).

## Project structure

```
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx                     # React entry point
    ├── App.jsx                      # App root
    ├── index.css                    # Tailwind + font imports
    ├── styles/
    │   └── book.css                 # 3D page-flip mechanics & book styling
    ├── hooks/
    │   └── usePageTurnSound.js      # Synthesized + custom-upload sound logic
    └── components/
        ├── BirthdayCardBook.jsx     # Layout, state, flip/swipe navigation
        └── PageContent.jsx          # Content for each page (cover, message, photos, wishes)
```

## Customizing

- Edit the default recipient name, message, and wishes in
  `src/components/BirthdayCardBook.jsx`.
- Swap the color palette or fonts in `src/styles/book.css` and `src/index.css`.
- Add more pages by extending the `leaves` array in `BirthdayCardBook.jsx`
  and adding a matching `kind` case in `PageContent.jsx`.

Note: photos, captions, and text edits made in the browser are **not**
persisted anywhere — they only live in that browser tab's memory. If you want
them saved, you'd need to wire up storage (e.g. localStorage, a backend, or a
database) yourself.
