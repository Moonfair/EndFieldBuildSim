# Custom Data Layer with Admin GUI

## TL;DR

> **Quick Summary**: Add a custom data layer that allows overriding API-fetched items and recipes via an admin GUI, with custom data stored in JSON files and merged at runtime.
> 
> **Deliverables**:
> - Custom data directory with `items.json` and `recipes.json`
> - Data merging utility for runtime override logic
> - Express dev server for file write operations
> - React admin page with Items/Recipes management tabs
> - Dev-only route protection
> 
> **Estimated Effort**: Medium (3-5 days)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Custom data structure → Merge utility → Express server → Admin GUI

---

## Context

### Original Request
Create a custom data layer with admin GUI for an Endfield game wiki web app. Custom data should merge with API data (custom → API → fallback). When custom data is deleted, items automatically revert to API data. Admin page accessible only in local development.

### Interview Summary
**Key Discussions**:
- **Storage**: JSON files in `web/public/data/custom/` (portable, matches existing pattern)
- **Merge**: Runtime merge when app loads (simple, no build complexity)
- **Scope**: Both items and recipes with full override capability
- **Backend**: Express dev server for file writes (clean separation)
- **Access**: Dev-only admin route (secure, no production exposure)
- **Tests**: Manual verification (matches codebase pattern)

**Research Findings**:
- App uses HashRouter, React 19, Vite 7, Tailwind CSS
- Data loading: `fetch(BASE_URL + 'data/file.json')` pattern
- Existing override precedent: `web/public/data/overrides/device_text_map.json`
- No existing backend or test infrastructure

### Gap Analysis (Self-Review)
**Identified Gaps** (addressed in plan):
- CORS handling for Express ↔ Vite communication
- Recipe index rebuilding when custom recipes change
- Unique ID generation for new custom recipes
- Partial override support (only override changed fields)

---

## Work Objectives

### Core Objective
Enable wiki administrators to override API-fetched item and recipe data through a browser-based admin interface, with changes persisted to JSON files and automatically merged at runtime.

### Concrete Deliverables
- `web/public/data/custom/items.json` - Custom item overrides
- `web/public/data/custom/recipes.json` - Custom recipe overrides
- `web/src/utils/dataMerger.ts` - Merge utility with type safety
- `web/server/admin-server.ts` - Express server for CRUD operations
- `web/src/pages/AdminPage.tsx` - Admin GUI with tabs
- `web/src/components/admin/*.tsx` - Admin UI components
- Updated `package.json` with dev:admin script

### Definition of Done
- [ ] Custom data files created and gitignored appropriately
- [ ] Data merging works correctly (custom overrides API)
- [ ] Express server handles GET/POST/DELETE for custom data
- [ ] Admin page loads only in dev mode
- [ ] Items can be viewed, edited, and reset to API
- [ ] Recipes can be viewed, edited, and reset to API
- [ ] `npm run dev:admin` starts both Vite and Express

### Must Have
- Runtime data merging (custom → API fallback)
- CRUD operations for items and recipes
- "Reset to API" functionality per item/recipe
- Dev-only route protection
- CORS support for Express ↔ Vite

### Must NOT Have (Guardrails)
- **NO** modification of `item_lookup.json` or `recipe_database.json` directly
- **NO** admin route in production build
- **NO** Express server in production
- **NO** image upload functionality
- **NO** real-time API validation
- **NO** bulk import/export features
- **NO** recipe dependency visualization
- **NO** authentication system (dev-only access is sufficient)

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO
- **User wants tests**: Manual-only
- **Framework**: None

### Automated Verification Only

Each TODO includes EXECUTABLE verification procedures:

| Type | Verification Tool | Automated Procedure |
|------|------------------|---------------------|
| **Frontend/Admin UI** | Playwright browser via skill | Navigate, interact, verify DOM state |
| **Express API** | curl via Bash | Send requests, validate JSON responses |
| **Data merging** | Node.js REPL via Bash | Import module, call functions, compare output |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Create custom data directory structure
├── Task 2: Implement data merging utility
└── Task 3: Set up Express server skeleton

Wave 2 (After Wave 1):
├── Task 4: Implement Express CRUD endpoints [depends: 1, 3]
├── Task 5: Create admin page skeleton with routing [depends: 2]
└── Task 6: Build item management UI components [depends: 5]

Wave 3 (After Wave 2):
├── Task 7: Build recipe management UI components [depends: 4, 5]
├── Task 8: Integrate data merging into existing pages [depends: 2]
└── Task 9: Add npm scripts and documentation [depends: 3, 4]

Critical Path: Task 1 → Task 4 → Task 7 → Task 9
Parallel Speedup: ~40% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 4 | 2, 3 |
| 2 | None | 5, 8 | 1, 3 |
| 3 | None | 4, 9 | 1, 2 |
| 4 | 1, 3 | 7 | 5, 6 |
| 5 | 2 | 6, 7 | 4 |
| 6 | 5 | None | 4, 7 |
| 7 | 4, 5 | None | 8 |
| 8 | 2 | None | 7, 9 |
| 9 | 3, 4 | None | 7, 8 |

---

## TODOs

- [ ] 1. Create custom data directory structure

  **What to do**:
  - Create `web/public/data/custom/` directory
  - Create `items.json` with empty object `{}`
  - Create `recipes.json` with structure `{"recipes": {}, "deletedRecipes": []}`
  - Add `.gitkeep` to preserve directory in git
  - Update `.gitignore` to optionally ignore custom data (user choice)
  - Create TypeScript types for custom data structures

  **Must NOT do**:
  - Do NOT modify existing `item_lookup.json` or `recipe_database.json`
  - Do NOT create complex nested structures beyond what's needed

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file creation task with clear structure
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for file creation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3)
  - **Blocks**: Task 4
  - **Blocked By**: None

  **References**:
  
  **Pattern References**:
  - `web/public/data/overrides/device_text_map.json` - Existing override file pattern
  - `web/public/data/item_lookup.json:1-20` - Item structure to mirror for custom items

  **Type References**:
  - `web/src/types/catalog.ts:CatalogItem` - Item interface to extend for custom items
  - `web/src/types/manufacturing.ts:ManufacturingRecipe` - Recipe interface for custom recipes

  **Acceptance Criteria**:

  **Automated Verification**:
  ```bash
  # Verify directory structure
  ls -la web/public/data/custom/
  # Expected: items.json, recipes.json, .gitkeep
  
  # Verify items.json structure
  cat web/public/data/custom/items.json | head -5
  # Expected: {} or {"items": {}}
  
  # Verify recipes.json structure  
  cat web/public/data/custom/recipes.json | head -5
  # Expected: {"recipes": {}, "deletedRecipes": []}
  
  # Verify types compile
  cd web && npx tsc --noEmit src/types/custom.ts
  # Expected: Exit code 0
  ```

  **Commit**: YES
  - Message: `feat(data): add custom data directory structure and types`
  - Files: `web/public/data/custom/*, web/src/types/custom.ts`

---

- [ ] 2. Implement data merging utility

  **What to do**:
  - Create `web/src/utils/dataMerger.ts`
  - Implement `mergeItems(apiItems, customItems)` function
  - Implement `mergeRecipes(apiRecipes, customRecipes)` function
  - Handle partial overrides (only override provided fields)
  - Rebuild recipe indexes when custom recipes exist
  - Export merged data loading functions for use in pages
  - Add proper TypeScript generics for type safety

  **Must NOT do**:
  - Do NOT fetch data inside merger (separation of concerns)
  - Do NOT cache merged results (let callers handle caching)
  - Do NOT validate item references (keep simple)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Core business logic requiring careful merge semantics
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not a UI task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3)
  - **Blocks**: Tasks 5, 8
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `web/src/utils/recipeLoader.ts:22-73` - Existing recipe loading pattern to follow
  - `web/src/utils/recipeLoader.ts:53-65` - Index population pattern for recipes

  **API/Type References**:
  - `web/src/types/catalog.ts:ItemLookup` - Input type for items
  - `web/src/types/manufacturing.ts:RecipeDatabase` - Input type for recipes
  - `web/src/types/manufacturing.ts:RecipeLookup` - Output type for merged recipes

  **Acceptance Criteria**:

  **Automated Verification**:
  ```bash
  # Verify TypeScript compiles
  cd web && npx tsc --noEmit src/utils/dataMerger.ts
  # Expected: Exit code 0
  
  # Test merge logic with Node.js
  cd web && node -e "
    const { mergeItems } = require('./dist/utils/dataMerger.js');
    const api = { '1': { itemId: '1', name: 'Original' } };
    const custom = { '1': { name: 'Custom Name' } };
    const merged = mergeItems(api, custom);
    console.log(merged['1'].name === 'Custom Name' ? 'PASS' : 'FAIL');
  "
  # Expected: PASS
  ```

  **Commit**: YES
  - Message: `feat(utils): add data merging utility for custom overrides`
  - Files: `web/src/utils/dataMerger.ts`

---

- [ ] 3. Set up Express server skeleton

  **What to do**:
  - Create `web/server/` directory
  - Create `web/server/admin-server.ts` with Express app
  - Configure CORS to allow requests from Vite dev server (localhost:5173)
  - Add JSON body parser middleware
  - Create placeholder routes for `/api/custom/items` and `/api/custom/recipes`
  - Add error handling middleware
  - Set server to run on port 3001
  - Add `ts-node` or `tsx` to devDependencies for running TypeScript

  **Must NOT do**:
  - Do NOT implement actual CRUD logic yet (Task 4)
  - Do NOT add authentication
  - Do NOT use database (JSON files only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Boilerplate Express setup with standard patterns
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `dev-browser`: Server-side, not browser

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Tasks 4, 9
  - **Blocked By**: None

  **References**:

  **External References**:
  - Express.js docs: https://expressjs.com/en/starter/hello-world.html
  - CORS middleware: https://expressjs.com/en/resources/middleware/cors.html
  - tsx runner: https://github.com/privatenumber/tsx

  **Acceptance Criteria**:

  **Automated Verification**:
  ```bash
  # Install dependencies
  cd web && npm install express cors && npm install -D @types/express @types/cors tsx
  
  # Verify server starts (background, then kill)
  cd web && timeout 5 npx tsx server/admin-server.ts || true
  # Expected: Server listening message or timeout (not crash)
  
  # Verify CORS headers (start server first, then test)
  curl -I -X OPTIONS http://localhost:3001/api/custom/items \
    -H "Origin: http://localhost:5173" \
    -H "Access-Control-Request-Method: GET" 2>/dev/null | grep -i "access-control"
  # Expected: Access-Control-Allow-Origin header present
  ```

  **Commit**: YES
  - Message: `feat(server): add Express admin server skeleton with CORS`
  - Files: `web/server/admin-server.ts, web/package.json`

---

- [ ] 4. Implement Express CRUD endpoints

  **What to do**:
  - Implement `GET /api/custom/items` - Read custom items
  - Implement `POST /api/custom/items/:id` - Create/update custom item
  - Implement `DELETE /api/custom/items/:id` - Delete custom item (reset to API)
  - Implement `GET /api/custom/recipes` - Read custom recipes
  - Implement `POST /api/custom/recipes/:id` - Create/update custom recipe
  - Implement `DELETE /api/custom/recipes/:id` - Delete custom recipe
  - Use `fs.promises` for async file operations
  - Handle concurrent writes with simple file locking or atomic writes
  - Return appropriate HTTP status codes (200, 201, 404, 500)

  **Must NOT do**:
  - Do NOT modify API data files (item_lookup.json, recipe_database.json)
  - Do NOT add complex validation
  - Do NOT implement bulk operations

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: REST API implementation with file I/O
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Backend task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6)
  - **Blocks**: Task 7
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `web/server/admin-server.ts` - Server skeleton from Task 3
  - `web/public/data/custom/items.json` - File to read/write from Task 1

  **Type References**:
  - `web/src/types/custom.ts` - Custom data types from Task 1

  **External References**:
  - Node.js fs.promises: https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options

  **Acceptance Criteria**:

  **Automated Verification**:
  ```bash
  # Start server in background (assume server running on 3001)
  
  # Test GET items (empty initially)
  curl -s http://localhost:3001/api/custom/items
  # Expected: {} or {"items": {}}
  
  # Test POST item
  curl -s -X POST http://localhost:3001/api/custom/items/999 \
    -H "Content-Type: application/json" \
    -d '{"name": "Test Item", "image": "/test.png"}'
  # Expected: {"success": true} or similar
  
  # Verify item persisted
  curl -s http://localhost:3001/api/custom/items | grep "Test Item"
  # Expected: Contains "Test Item"
  
  # Test DELETE item
  curl -s -X DELETE http://localhost:3001/api/custom/items/999
  # Expected: {"success": true}
  
  # Verify item deleted
  curl -s http://localhost:3001/api/custom/items | grep "999" || echo "DELETED"
  # Expected: DELETED
  ```

  **Commit**: YES
  - Message: `feat(server): implement CRUD endpoints for custom items and recipes`
  - Files: `web/server/admin-server.ts`

---

- [ ] 5. Create admin page skeleton with routing

  **What to do**:
  - Create `web/src/pages/AdminPage.tsx` with tab navigation
  - Add conditional route in `App.tsx` using `import.meta.env.DEV`
  - Create tabs: "Items", "Recipes", "Settings"
  - Add layout consistent with existing app (use Layout component)
  - Create `web/src/components/admin/` directory for admin components
  - Add link to admin page in header (dev mode only)

  **Must NOT do**:
  - Do NOT implement actual CRUD UI yet (Tasks 6, 7)
  - Do NOT add route in production build
  - Do NOT create new CSS framework (use existing Tailwind)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: React routing and layout setup
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Tab navigation and admin layout design
  - **Skills Evaluated but Omitted**:
    - `dev-browser`: Not browser automation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 6)
  - **Blocks**: Tasks 6, 7
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `web/src/App.tsx:1-21` - Existing routing pattern with HashRouter
  - `web/src/components/Layout.tsx` - Layout component to wrap admin page
  - `web/src/pages/SearchPage.tsx:77-105` - Page structure pattern

  **Type References**:
  - `web/src/utils/dataMerger.ts` - Data types for admin display (from Task 2)

  **Acceptance Criteria**:

  **Automated Verification (Playwright)**:
  ```
  # Agent executes via playwright browser automation:
  1. Navigate to: http://localhost:5173/#/admin
  2. Wait for: selector "[data-testid='admin-page']" to be visible
  3. Assert: text "Items" tab exists
  4. Assert: text "Recipes" tab exists  
  5. Assert: text "Settings" tab exists
  6. Click: "Items" tab
  7. Assert: Items panel becomes active
  8. Screenshot: .sisyphus/evidence/task-5-admin-skeleton.png
  ```

  **Commit**: YES
  - Message: `feat(admin): add admin page skeleton with tab navigation`
  - Files: `web/src/pages/AdminPage.tsx, web/src/App.tsx, web/src/components/admin/`

---

- [ ] 6. Build item management UI components

  **What to do**:
  - Create `web/src/components/admin/ItemsPanel.tsx` - Item list with edit/reset actions
  - Create `web/src/components/admin/ItemEditor.tsx` - Form for editing item fields
  - Display merged items (show which are custom vs API)
  - Add "Edit" button to create/modify custom override
  - Add "Reset to API" button to delete custom override
  - Use existing UI components (SearchInput, Skeleton) where applicable
  - Connect to Express API for save/delete operations
  - Show loading and error states

  **Must NOT do**:
  - Do NOT add image upload
  - Do NOT add bulk edit features
  - Do NOT validate against external API

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex React form and list components
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Form design and user interaction patterns
  - **Skills Evaluated but Omitted**:
    - `dev-browser`: Development task, not browser automation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 4, 5 partially)
  - **Blocks**: None
  - **Blocked By**: Task 5

  **References**:

  **Pattern References**:
  - `web/src/pages/SearchPage.tsx:44-50` - Fuse.js search pattern for filtering items
  - `web/src/components/ItemCard.tsx` - Item display pattern
  - `web/src/components/ui/SearchInput.tsx` - Reusable search input

  **API References**:
  - Express endpoints from Task 4: `POST /api/custom/items/:id`, `DELETE /api/custom/items/:id`

  **Type References**:
  - `web/src/types/catalog.ts:CatalogItem` - Item structure
  - `web/src/types/custom.ts` - Custom item override structure

  **Acceptance Criteria**:

  **Automated Verification (Playwright)**:
  ```
  # Agent executes via playwright browser automation:
  1. Navigate to: http://localhost:5173/#/admin
  2. Click: "Items" tab
  3. Wait for: item list to load (selector "[data-testid='items-list']")
  4. Assert: At least 1 item row visible
  5. Click: First "Edit" button
  6. Wait for: editor modal/panel to appear
  7. Fill: input[name="name"] with "Custom Test Name"
  8. Click: "Save" button
  9. Wait for: success message or list refresh
  10. Assert: "Custom Test Name" appears in item list
  11. Click: "Reset to API" button for same item
  12. Assert: Original name restored
  13. Screenshot: .sisyphus/evidence/task-6-item-management.png
  ```

  **Commit**: YES
  - Message: `feat(admin): add item management UI with edit and reset`
  - Files: `web/src/components/admin/ItemsPanel.tsx, web/src/components/admin/ItemEditor.tsx`

---

- [ ] 7. Build recipe management UI components

  **What to do**:
  - Create `web/src/components/admin/RecipesPanel.tsx` - Recipe list with edit/reset
  - Create `web/src/components/admin/RecipeEditor.tsx` - Form for recipe fields
  - Display recipes grouped by device
  - Allow editing: deviceId, materials, products, manufacturingTime
  - Materials/products editor: Add/remove items with count
  - "Reset to API" removes custom override
  - Connect to Express API for save/delete
  - Generate unique recipe IDs for new recipes: `custom_recipe_${timestamp}`

  **Must NOT do**:
  - Do NOT add recipe dependency visualization
  - Do NOT validate material/product item IDs exist
  - Do NOT auto-calculate manufacturing time

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex nested form with dynamic arrays
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Complex form design with nested structures
  - **Skills Evaluated but Omitted**:
    - `dev-browser`: Development task

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 8, 9)
  - **Blocks**: None
  - **Blocked By**: Tasks 4, 5

  **References**:

  **Pattern References**:
  - `web/src/components/ProductRecipeTable.tsx` - Recipe display pattern
  - `web/src/components/MaterialRecipeTable.tsx` - Material list pattern
  - `web/src/components/admin/ItemEditor.tsx` - Editor pattern from Task 6

  **API References**:
  - Express endpoints: `POST /api/custom/recipes/:id`, `DELETE /api/custom/recipes/:id`

  **Type References**:
  - `web/src/types/manufacturing.ts:ManufacturingRecipe` - Recipe structure
  - `web/src/types/custom.ts` - Custom recipe structure

  **Acceptance Criteria**:

  **Automated Verification (Playwright)**:
  ```
  # Agent executes via playwright browser automation:
  1. Navigate to: http://localhost:5173/#/admin
  2. Click: "Recipes" tab
  3. Wait for: recipe list to load
  4. Click: First "Edit" button (or "Add New Recipe")
  5. Wait for: recipe editor to appear
  6. Fill: manufacturingTime input with "10"
  7. Click: "Add Material" button
  8. Fill: material ID input with "381"
  9. Fill: material count input with "2"
  10. Click: "Save" button
  11. Assert: Recipe appears in list with updated values
  12. Screenshot: .sisyphus/evidence/task-7-recipe-management.png
  ```

  **Commit**: YES
  - Message: `feat(admin): add recipe management UI with materials/products editor`
  - Files: `web/src/components/admin/RecipesPanel.tsx, web/src/components/admin/RecipeEditor.tsx`

---

- [ ] 8. Integrate data merging into existing pages

  **What to do**:
  - Modify `web/src/pages/SearchPage.tsx` to use merged item data
  - Modify `web/src/utils/recipeLoader.ts` to merge custom recipes
  - Load custom data alongside API data
  - Ensure existing functionality works with merged data
  - Add visual indicator for custom items (optional: small badge/icon)

  **Must NOT do**:
  - Do NOT break existing functionality
  - Do NOT change data structures visible to other components
  - Do NOT add heavy loading states (custom data is local, fast)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Modifying existing data flow carefully
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Minimal UI changes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 9)
  - **Blocks**: None
  - **Blocked By**: Task 2

  **References**:

  **Pattern References**:
  - `web/src/pages/SearchPage.tsx:14-29` - Current data loading useEffect
  - `web/src/utils/recipeLoader.ts:22-36` - Current recipe loading
  - `web/src/utils/dataMerger.ts` - Merge utility from Task 2

  **Acceptance Criteria**:

  **Automated Verification (Playwright)**:
  ```
  # Pre-condition: Create a custom item override via admin
  
  # Agent executes via playwright browser automation:
  1. Navigate to: http://localhost:5173/#/
  2. Wait for: search page to load
  3. Search for: custom item name
  4. Assert: Custom item appears in search results with overridden name
  5. Click: Custom item card
  6. Assert: Detail page shows overridden data
  7. Screenshot: .sisyphus/evidence/task-8-merged-data.png
  ```

  **Automated Verification (curl - recipe merge)**:
  ```bash
  # Verify recipe merging works by checking console output
  # (Would need to add a debug endpoint or check browser console)
  cd web && npm run build
  # Expected: Build succeeds with no TypeScript errors
  ```

  **Commit**: YES
  - Message: `feat(data): integrate custom data merging into search and recipe loader`
  - Files: `web/src/pages/SearchPage.tsx, web/src/utils/recipeLoader.ts`

---

- [ ] 9. Add npm scripts and documentation

  **What to do**:
  - Add `npm run dev:admin` script that starts both Vite and Express
  - Use `concurrently` package to run both servers
  - Update `web/README.md` with admin usage instructions
  - Add "Import API Data" instructions to admin Settings tab
  - Document custom data file formats
  - Add comments to key files explaining the data flow

  **Must NOT do**:
  - Do NOT create separate documentation files (keep in README)
  - Do NOT add complex CLI tools
  - Do NOT automate Python script execution from npm

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Documentation and npm script setup
  - **Skills**: None required
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not a git operation

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 7, 8)
  - **Blocks**: None
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `web/package.json:6-10` - Existing npm scripts pattern
  - `web/README.md` - Existing documentation structure

  **External References**:
  - concurrently: https://www.npmjs.com/package/concurrently

  **Acceptance Criteria**:

  **Automated Verification**:
  ```bash
  # Verify concurrently installed
  cd web && npm install -D concurrently
  
  # Verify dev:admin script exists
  cd web && npm run dev:admin &
  sleep 5
  
  # Verify both servers running
  curl -s http://localhost:5173 > /dev/null && echo "Vite: OK"
  curl -s http://localhost:3001/api/custom/items > /dev/null && echo "Express: OK"
  
  # Kill background processes
  pkill -f "vite|admin-server"
  
  # Verify README updated
  grep -q "Admin" web/README.md && echo "README: OK"
  ```

  **Commit**: YES
  - Message: `docs: add admin server scripts and usage documentation`
  - Files: `web/package.json, web/README.md`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(data): add custom data directory structure and types` | web/public/data/custom/*, web/src/types/custom.ts | tsc --noEmit |
| 2 | `feat(utils): add data merging utility for custom overrides` | web/src/utils/dataMerger.ts | tsc --noEmit |
| 3 | `feat(server): add Express admin server skeleton with CORS` | web/server/admin-server.ts, web/package.json | Server starts without error |
| 4 | `feat(server): implement CRUD endpoints for custom items and recipes` | web/server/admin-server.ts | curl tests pass |
| 5 | `feat(admin): add admin page skeleton with tab navigation` | web/src/pages/AdminPage.tsx, web/src/App.tsx | Route loads in dev |
| 6 | `feat(admin): add item management UI with edit and reset` | web/src/components/admin/Items*.tsx | Edit/reset works |
| 7 | `feat(admin): add recipe management UI with materials/products editor` | web/src/components/admin/Recipe*.tsx | Recipe edit works |
| 8 | `feat(data): integrate custom data merging into search and recipe loader` | web/src/pages/SearchPage.tsx, web/src/utils/recipeLoader.ts | Merged data displays |
| 9 | `docs: add admin server scripts and usage documentation` | web/package.json, web/README.md | npm run dev:admin works |

---

## Success Criteria

### Verification Commands
```bash
# Full system test
cd web && npm run dev:admin &
sleep 5

# 1. Verify both servers running
curl -s http://localhost:5173 | grep -q "html" && echo "✓ Vite running"
curl -s http://localhost:3001/api/custom/items && echo "✓ Express running"

# 2. Verify admin page loads (dev only)
curl -s "http://localhost:5173/#/admin" | grep -q "admin" || echo "✓ Admin route exists"

# 3. Test CRUD cycle
curl -s -X POST http://localhost:3001/api/custom/items/test \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}' && echo "✓ Create works"

curl -s http://localhost:3001/api/custom/items | grep -q "Test" && echo "✓ Read works"

curl -s -X DELETE http://localhost:3001/api/custom/items/test && echo "✓ Delete works"

# 4. Verify production build excludes admin
npm run build
grep -rq "AdminPage" dist/ || echo "✓ Admin excluded from prod"

pkill -f "vite|admin-server"
```

### Final Checklist
- [ ] Custom data files exist and are writable
- [ ] Data merging correctly prioritizes custom over API
- [ ] Express server handles all CRUD operations
- [ ] Admin page only accessible in dev mode
- [ ] Items can be edited and reset
- [ ] Recipes can be edited and reset
- [ ] Existing app functionality unchanged
- [ ] `npm run dev:admin` starts both servers
- [ ] Documentation updated
