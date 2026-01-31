# Draft: GitHub Pages Item Search Application

## Requirements (confirmed)
- **Search Page**: Fuzzy search with Fuse.js, real-time matching, grid card display (image + name)
- **Detail Page**: Full item info (cover, name, type, description, rich text document) + synthesis tables
- **Table Rendering**: Entry IDs resolved to item info via item_lookup.json, clickable links
- **Tech Stack**: React + Vite + TypeScript + Tailwind CSS + HashRouter
- **Deployment**: GitHub Pages compatible (static site, hash routing)

## Data Analysis
- **Total items**: 254 (65 devices + 189 items)
- **Catalog**: type5_devices.json (65) + type6_items.json (189) = 39KB combined
- **Lookup**: item_lookup.json (40KB) - keyed by itemId for O(1) access
- **Details**: 254 JSON files in item_details/ (~40KB each, loaded on demand)
- **Synthesis**: 79 JSON files in synthesis_tables/ (~344KB total)

## Data Schema Verified
```typescript
// Catalog item structure (both type5 and type6)
interface CatalogItem {
  itemId: string;
  name: string;
  image: string;
}

// Lookup structure (item_lookup.json)
interface ItemLookup {
  [itemId: string]: CatalogItem;
}

// Synthesis table structure
interface SynthesisTable {
  itemId: string;
  name: string;
  tables: Array<{
    rows: number;
    columns: number;
    headers: Array<Array<{type: "text", text: string}>>;
    data: Array<Array<Array<{type: "entry", id: string, count: string} | {type: "text", text: string}>>>;
  }>;
}
```

## Technical Decisions
- **Router**: HashRouter (required for GitHub Pages - no server-side routing)
- **Search**: Fuse.js with threshold 0.3 for fuzzy matching
- **Data Loading Strategy**: 
  - Load item_lookup.json on startup (40KB) for search index
  - Load item details on-demand when viewing detail page
  - Load synthesis table on-demand (check if file exists via fetch)
- **Styling**: Tailwind CSS for rapid development
- **Image Loading**: Native lazy loading attribute

## Open Questions
- None - all requirements clear from user request

## Scope Boundaries
- **INCLUDE**:
  - React + Vite project setup with TypeScript
  - Search page with Fuse.js integration
  - Detail page with rich text and table rendering
  - Synthesis table component with ID resolution
  - Responsive grid layout
  - GitHub Pages deployment config
  - README with setup instructions

- **EXCLUDE**:
  - Backend/API server (static site only)
  - User authentication
  - Data editing/CRUD operations
  - Multiple language support (Chinese only)
  - PWA features
  - Analytics
