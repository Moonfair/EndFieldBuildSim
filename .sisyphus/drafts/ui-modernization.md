# Draft: UI Modernization for EndFieldBuildSim

## Requirements (confirmed from user request)

- **Unified image sizes**: Currently inconsistent (64px cards, 128px detail, 32px tables)
- **Card-based information display**: Clean card components with proper spacing
- **Mobile/PC responsive design**: Adapt to all screen sizes
- **Advanced UI framework**: User requested "更高级的ui套件" (shadcn/ui recommended)
- **Modern and elegant aesthetics**: Better shadows, animations, hover effects

## Current State Analysis

### Confirmed Issues (from exploration)

1. **CRITICAL BUG**: `ItemCard.tsx` line 13 uses `hover:border-2` causing layout shift
   - Fix: Use `border border-transparent hover:border-blue-500` instead
   
2. **No Design System**: `tailwind.config.js` has empty `extend: {}`
   - No custom colors, spacing, shadows, or typography
   - All values are hardcoded in components

3. **Image Size Inconsistency**:
   - ItemCard: `w-16 h-16` (64px)
   - DetailPage: `w-32 h-32` (128px)
   - SynthesisTable: `w-8 h-8` (32px)

4. **Plain Loading States**: Just "加载中..." text, no animations/skeletons

5. **Dense Grid**: SearchPage uses 6 columns on XL (too cramped)
   - Current: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6`

6. **Legacy CSS**: App.css and parts of index.css contain unused template styles

7. **Inconsistent Shadows**: ItemCard uses `shadow-md`, DetailPage uses `shadow-lg`

### Technology Stack (confirmed)

- React 19.2.0
- Vite 7.2.4
- TypeScript 5.9.3
- Tailwind CSS 4.1.18 (with @tailwindcss/postcss)
- react-router-dom 7.13.0 (HashRouter for GitHub Pages)
- fuse.js 7.1.0

### Data Structure (confirmed)

Items have `subType.name` field that can be displayed on cards:
- "设备" (Devices) - 65 items
- "物品" (Items) - 189 items

## Technical Decisions

### UI Framework Choice
- **Decision**: shadcn/ui (awaiting librarian research for React 19 + Tailwind 4.x compatibility)
- **Rationale**: Copy-paste architecture, minimal bundle impact, built on Radix UI + Tailwind

### Image Sizing Strategy
- **Cards**: Increase from 64px to 96px with `aspect-square` for consistency
- **Detail Hero**: Keep 128px but use `aspect-square`
- **Tables**: Keep 32px (appropriate for inline)

### Responsive Grid Strategy
- **Target**: Max 4 columns instead of 6
- **New Grid**: `grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- **Rationale**: Better density, larger touch targets

### Hover Effect Fix
- **Remove**: `hover:border-2` (causes layout shift)
- **Add**: `border border-transparent hover:border-primary` + `transform hover:-translate-y-1`
- **Add**: Shadow transition instead of border growth

## Research Findings

### From Exploration Agent
- 24 files in web/src/ directory
- 5 React components, 3 pages, 5 type definition files
- No accessibility features (missing focus states, ARIA labels)
- No dark mode support currently

### Pending: shadcn/ui + Tailwind 4.x Research
- Awaiting librarian agent results
- Need: Installation steps, components.json config, React 19 compatibility

## Resolved Questions

1. **Dark Mode**: NO - Not mentioned in request, keep light-only for simplicity
2. **Animation Intensity**: Subtle - User requested "优雅" (elegant), implies professional/refined
3. **Skeleton Loading**: Shimmer effect - Industry standard, more polished than pulse
4. **SubType Badge Color**: Yes, different colors:
   - 设备 (Devices): Blue badge
   - 物品 (Items): Green badge

## Scope Boundaries

### INCLUDE
- Fix ItemCard layout shift bug
- Install and configure shadcn/ui
- Extend Tailwind config with design tokens
- Redesign ItemCard with larger images and badges
- Redesign SearchPage with modern search input, skeleton loading, optimized grid
- Redesign DetailPage with better sectioning
- Add loading skeleton components
- Improve responsive behavior
- Clean up legacy CSS

### EXCLUDE
- Dark mode (keep light-only for now)
- New features (only UI improvements)
- Backend/data changes
- Router changes (keep HashRouter)
- Type definition changes (unless needed for UI)
- Performance optimization (beyond 60fps animations)
- Test infrastructure setup (manual verification instead)

## Verification Strategy

**No test infrastructure exists** → Manual QA with Playwright browser automation

Each task will include:
- Automated browser verification steps (navigate, click, screenshot)
- Responsive testing at 375px (mobile), 768px (tablet), 1920px (desktop)
- All 254 items verified functional after changes

## Clearance Check

- [x] Core objective clearly defined? YES - Modernize UI with unified sizing, cards, responsiveness
- [x] Scope boundaries established? YES - UI only, no dark mode, no new features  
- [x] No critical ambiguities remaining? YES - All questions resolved with sensible defaults
- [x] Technical approach decided? YES - shadcn/ui + Tailwind design tokens
- [x] Test strategy confirmed? YES - Manual verification with Playwright
- [x] No blocking questions outstanding? YES - Proceeding to plan generation

## Files to Modify

| File | Changes |
|------|---------|
| web/tailwind.config.js | Add design tokens (colors, spacing, shadows, animations) |
| web/src/components/ItemCard.tsx | Complete redesign with larger image, badge, fixed hover |
| web/src/components/ItemImage.tsx | Add skeleton loading animation |
| web/src/pages/SearchPage.tsx | Modern search input, skeleton grid, 4-col max |
| web/src/pages/DetailPage.tsx | Hero section, better sectioning |
| web/src/components/Layout.tsx | Better header styling |
| web/src/index.css | Clean up legacy styles, add CSS variables |
| web/package.json | Add shadcn/ui dependencies |
| (new) web/src/components/ui/* | shadcn/ui components (Input, Card, Skeleton, Button) |

---

**Last Updated**: 2026-01-30
**Status**: CLEARANCE PASSED - Ready for plan generation
