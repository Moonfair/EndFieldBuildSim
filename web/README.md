# EndFieldBuildSim Web App

Web application for browsing Endfield game items, devices, and synthesis tables.

## Development

```bash
cd web
npm install
npm run dev
```

Visit http://localhost:5173/

## Build

```bash
cd web
npm run build
```

Built files will be in `web/dist/`

## Deploy to GitHub Pages

See [DEPLOYMENT.md](../DEPLOYMENT.md) for comprehensive deployment instructions including:
- Automatic GitHub Actions deployment
- Manual deployment alternatives
- Configuration and troubleshooting

## Related Documentation

- **[README.md](../README.md)** - Main project guide and data collection workflow
- **[AGENTS.md](../AGENTS.md)** - Developer guide and code style
- **[DEPLOYMENT.md](../DEPLOYMENT.md)** - GitHub Pages deployment guide
- **[WEB_APP_COMPLETION.md](../WEB_APP_COMPLETION.md)** - Web app implementation report

## Project Structure

```
web/
├── public/
│   ├── data/              # JSON data files (254 items + 79 synthesis tables)
│   └── placeholder.png    # Fallback image
├── src/
│   ├── components/
│   │   ├── DocumentRenderer.tsx    # Rich text document renderer
│   │   ├── ItemCard.tsx            # Item card for search results
│   │   ├── ItemImage.tsx           # Lazy-loading image component
│   │   ├── Layout.tsx              # Page layout with header
│   │   └── SynthesisTable.tsx      # Synthesis table renderer
│   ├── pages/
│   │   ├── SearchPage.tsx          # Search page with Fuse.js
│   │   ├── DetailPage.tsx          # Item detail page
│   │   └── NotFoundPage.tsx        # 404 error page
│   ├── types/                       # TypeScript type definitions
│   └── App.tsx                      # Router configuration
└── package.json
```

## Features

- 🔍 **Fuzzy Search**: Search 254 items with real-time filtering
- 📱 **Responsive Design**: Works on mobile and desktop
- 🖼️ **Lazy Loading**: Images load on-demand for better performance
- 🔗 **Item Links**: Click items in tables to navigate to their details
- 📊 **Synthesis Tables**: View item crafting requirements (79 items)
- 📝 **Rich Text**: Formatted descriptions with inline item references

## Tech Stack

- React 18
- TypeScript
- React Router (HashRouter for GitHub Pages)
- Tailwind CSS
- Fuse.js (fuzzy search)
- Vite (build tool)
