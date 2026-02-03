# Manufacturing Simulator Bug Fixes

## TL;DR

> **Quick Summary**: Fix 4 issues in the manufacturing simulator: filter 0-count devices, exclude invalid disassembler recipes, add auto-refresh on base material toggle, and redesign flow diagram for compact layout.
> 
> **Deliverables**:
> - Fixed device count calculation (no "0台" devices displayed)
> - Fixed recipe selection (filter recipes with no net output)
> - Auto-refresh when base materials toggled
> - Compact "品字形" flow diagram layout
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 2 → Task 3 (Issue 1/2 fixes must complete before Issue 3)

---

## Context

### Original Request
Fix 4 issues in the EndFieldBuildSim Manufacturing Simulator:
1. "0台" devices displayed when deviceCount = 0
2. "蓝铁矿" incorrectly appearing in base materials due to disassembler recipe issues
3. No auto-refresh when base materials are toggled
4. Flow diagram layout not optimized (needs 品字形 compact layout)

### Interview Summary
**Key Discussions**:
- Root causes identified through code exploration
- All 4 affected files located and analyzed
- Clear implementation paths established

**Research Findings**:
- Issue 1: `efficiencyCalculator.ts:84-87, 117` - deviceCount=0 not filtered
- Issue 2: Recipe selection doesn't check net output (material.count=0 in disassembler recipes)
- Issue 3: `handleBaseMaterialToggle` clears plans but no auto-recalculation trigger
- Issue 4: Simple level-based layout in `ConnectionGraph` needs redesign

### Self-Review
**Identified Gaps (addressed)**:
- Need to filter in both calculators (efficiency AND minimumScale)
- Recipe filtering should happen at load time for efficiency
- Auto-refresh needs debouncing to prevent excessive recalculations
- Flow diagram must handle edge cases (single device, no connections, cycles)

---

## Work Objectives

### Core Objective
Fix calculation bugs and improve UX in the manufacturing simulator component.

### Concrete Deliverables
- `efficiencyCalculator.ts` - Filter devices with count > 0
- `minimumScaleCalculator.ts` - Filter devices with count > 0 (already count=1, but verify)
- `recipeLoader.ts` - Filter invalid recipes at load time
- `ManufacturingSimulator.tsx` - Add useEffect for auto-refresh with debouncing
- `PlanVisualizer.tsx` - Redesign ConnectionGraph for compact layout

### Definition of Done
- [ ] No devices with count=0 appear in any plan
- [ ] Disassembler recipes with no net output are excluded
- [ ] Toggling base materials auto-refreshes the plan without manual button clicks
- [ ] Flow diagram uses compact 品字形 layout when appropriate

### Must Have
- Filter count=0 devices in efficiency calculator
- Filter recipes where product appears in materials with same count
- useEffect auto-refresh on baseMaterialIds change
- Compact vertical layout for 2-to-1 device connections

### Must NOT Have (Guardrails)
- DO NOT change the core calculation algorithms beyond filtering
- DO NOT add new dependencies for the flow diagram (use CSS/existing tools)
- DO NOT modify the data files or recipe database structure
- DO NOT introduce breaking changes to ProductionPlan interface
- DO NOT over-engineer the layout algorithm (keep it simple and maintainable)

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (npm test available, but no specific tests for calculator)
- **User wants tests**: Manual verification (existing project has no test suite)
- **Framework**: None configured for unit tests
- **QA approach**: Manual verification via browser

### Automated Verification (For all tasks)

**Frontend/UI verification** (using playwright skill or browser inspection):
1. Navigate to item detail page with synthesis table
2. Click "模拟制造配置" button
3. Verify device counts are all > 0
4. Toggle base materials
5. Verify plan auto-refreshes
6. Verify flow diagram layout

---

## Task Dependency Graph

| Task | Depends On | Reason |
|------|------------|--------|
| Task 1 | None | Foundation - filter invalid recipes at load time |
| Task 2 | None | Can run parallel with Task 1 - different file |
| Task 3 | Task 1, Task 2 | Needs valid data from calculators |
| Task 4 | None | Independent UI work |
| Task 5 | Task 3, Task 4 | Integration testing requires all fixes |

---

## Parallel Execution Graph

```
Wave 1 (Start immediately):
├── Task 1: Filter invalid recipes in recipeLoader.ts
├── Task 2: Filter count=0 devices in calculators
└── Task 4: Redesign ConnectionGraph layout

Wave 2 (After Wave 1 completes):
├── Task 3: Add auto-refresh on base material toggle
└── Task 5: Integration testing and verification

Critical Path: Task 1 → Task 3 → Task 5
Estimated Parallel Speedup: ~40% faster than sequential
```

---

## TODOs

- [ ] 1. Filter Invalid Recipes at Load Time

  **What to do**:
  - In `recipeLoader.ts`, add filtering logic in `populateLookup` or when building the asProducts map
  - Filter out recipes where:
    - Any product.id appears in materials with product.count <= materials.count (no net output)
    - This catches disassembler recipes like 蓝铁瓶 (1→1, 清水 0→1)
  - Add helper function `hasNetOutput(recipe)` that returns false if any product has no net gain

  **Must NOT do**:
  - Modify the recipe database JSON file
  - Remove recipes from byDevice or asMaterials lookups (only asProducts)

  **Recommended Agent Profile**:
  - **Category**: `quick` - Single file modification, clear logic
    - Reason: Simple filtering logic, ~20 lines of code change
  - **Skills**: [`typescript-programmer`]
    - `typescript-programmer`: Type-safe filtering implementation
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not UI work
    - `data-scientist`: Not data processing

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 4)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `web/src/utils/recipeLoader.ts:53-65` - populateLookup function where filtering should be added

  **Type References**:
  - `web/src/types/manufacturing.ts:1-7` - ManufacturingRecipe interface (materials, products arrays)

  **Example of invalid recipe (from exploration)**:
  ```json
  {
    "materials": [
      {"id": "371", "name": "蓝铁瓶", "count": "1"},
      {"id": "381", "name": "清水", "count": "0"}
    ],
    "products": [
      {"id": "371", "name": "蓝铁瓶", "count": "1"},
      {"id": "381", "name": "清水", "count": "1"}
    ]
  }
  ```
  Net output for 蓝铁瓶: 1 - 1 = 0 (invalid for production)

  **Acceptance Criteria**:

  **Automated Verification (using Bash node)**:
  ```bash
  # Agent runs after build:
  cd web && npm run build
  # Verify no build errors
  # Assert: Exit code 0
  ```

  **Manual browser verification**:
  ```
  1. Navigate to: http://localhost:5173/#/detail/381 (清水)
  2. Click: "模拟制造配置" button
  3. Click: "计算方案" button
  4. Verify: 蓝铁瓶 does NOT appear as intermediate product in dependency tree
  5. Screenshot: .sisyphus/evidence/task-1-recipe-filter.png
  ```

  **Commit**: YES
  - Message: `fix(calculator): filter recipes with no net output`
  - Files: `web/src/utils/recipeLoader.ts`
  - Pre-commit: `cd web && npm run build`

---

- [ ] 2. Filter Zero-Count Devices in Calculators

  **What to do**:
  - In `efficiencyCalculator.ts:117`, add condition before `devices.push(device)`:
    ```typescript
    if (deviceCount > 0) {
      devices.push(device);
    }
    ```
  - In `minimumScaleCalculator.ts:86`, verify count is already fixed at 1 (no change needed)
  - Review both files for any other places where count=0 devices might be added

  **Must NOT do**:
  - Change the deviceCount calculation algorithm
  - Remove devices from the devices array after adding them

  **Recommended Agent Profile**:
  - **Category**: `quick` - Trivial single-line fix
    - Reason: One-line conditional check
  - **Skills**: [`typescript-programmer`]
    - `typescript-programmer`: Type-safe implementation
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not UI work

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 4)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `web/src/utils/efficiencyCalculator.ts:84-87` - deviceCount calculation (where count can be 0)
  - `web/src/utils/efficiencyCalculator.ts:117` - devices.push without filter (THE FIX LOCATION)
  - `web/src/utils/minimumScaleCalculator.ts:52` - count already hardcoded to 1 (verify only)
  - `web/src/utils/minimumScaleCalculator.ts:86` - devices.push (verify no issue)

  **Code to modify (efficiencyCalculator.ts:92-117)**:
  ```typescript
  // Current code at line 117:
  devices.push(device);
  
  // Change to:
  if (deviceCount > 0) {
    devices.push(device);
  }
  ```

  **Acceptance Criteria**:

  **Automated Verification (using Bash node)**:
  ```bash
  cd web && npm run build
  # Assert: Exit code 0
  ```

  **Manual browser verification**:
  ```
  1. Navigate to: http://localhost:5173/#/detail/[item-with-complex-tree]
  2. Click: "模拟制造配置" button
  3. Click: "计算方案" button  
  4. Verify: NO device cards show "0 台"
  5. Verify: totalDeviceCount in plan summary matches sum of all device counts
  ```

  **Commit**: YES
  - Message: `fix(calculator): filter devices with count=0`
  - Files: `web/src/utils/efficiencyCalculator.ts`
  - Pre-commit: `cd web && npm run build`

---

- [ ] 3. Add Auto-Refresh on Base Material Toggle

  **What to do**:
  - In `ManufacturingSimulator.tsx`, add useEffect that watches `state.baseMaterialIds`
  - When baseMaterialIds changes:
    1. Rebuild dependency tree with new base materials
    2. Recalculate both efficiency and scale plans
  - Add debouncing to prevent excessive recalculations (300ms delay)
  - Remove the need for "重新计算依赖树" button click

  **Implementation approach**:
  ```typescript
  useEffect(() => {
    if (!isOpen || state.baseMaterialIds.size === 0) return;
    
    const timeoutId = setTimeout(() => {
      // Rebuild tree and recalculate
      handleUpdateDependencyTree();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [state.baseMaterialIds]);
  ```

  **Must NOT do**:
  - Remove the manual "计算方案" button entirely
  - Auto-calculate on first open (wait for explicit user action first)

  **Recommended Agent Profile**:
  - **Category**: `quick` - Small React hook addition
    - Reason: Single useEffect hook with debouncing
  - **Skills**: [`typescript-programmer`]
    - `typescript-programmer`: React hooks pattern
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Minor behavior change, not visual

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (Sequential)
  - **Blocks**: Task 5
  - **Blocked By**: Task 1, Task 2 (need valid calculation results)

  **References**:

  **Pattern References**:
  - `web/src/components/ManufacturingSimulator.tsx:38-70` - Existing useEffect for initialization
  - `web/src/components/ManufacturingSimulator.tsx:106-121` - handleBaseMaterialToggle (current behavior)
  - `web/src/components/ManufacturingSimulator.tsx:123-144` - handleUpdateDependencyTree (to be called)

  **Key insight**:
  - handleBaseMaterialToggle already clears plans (line 117-118)
  - Need to ADD a useEffect that triggers rebuild after toggle
  - handleUpdateDependencyTree handles tree rebuild but not plan calculation
  - Need to also call handleCalculatePlans after tree rebuild

  **Acceptance Criteria**:

  **Manual browser verification**:
  ```
  1. Navigate to: http://localhost:5173/#/detail/[item-with-dependencies]
  2. Click: "模拟制造配置" button
  3. Click: "计算方案" button (establish initial plan)
  4. Toggle: Check/uncheck a base material checkbox
  5. Wait: 300ms for debounce
  6. Verify: Plan automatically refreshes (no manual button click needed)
  7. Verify: Device counts and base materials list update
  8. Screenshot: .sisyphus/evidence/task-3-auto-refresh.png
  ```

  **Commit**: YES
  - Message: `feat(simulator): auto-refresh plan on base material toggle`
  - Files: `web/src/components/ManufacturingSimulator.tsx`
  - Pre-commit: `cd web && npm run build`

---

- [ ] 4. Redesign ConnectionGraph for Compact Layout

  **What to do**:
  - Redesign the ConnectionGraph component in `PlanVisualizer.tsx`
  - Implement 品字形 (pyramid/compact) layout algorithm:
    - When 2+ devices connect to 1 downstream device, stack them vertically
    - Use CSS Grid or Flexbox for positioning
    - Show connection arrows between devices
    - Display input/output product names on connections
  - Keep the component simple and readable

  **Layout algorithm**:
  ```
  Current (一字型 horizontal):
  [Device A] [Device B] [Device C]
       ↓          ↓         ↓
  [Device D] [Device E] [Device F]

  New (品字形 compact):
       [Device A]  [Device B]
             ↘      ↙
           [Device C]
                ↓
           [Device D]
  ```

  **Must NOT do**:
  - Add external diagram libraries (D3, Mermaid, etc.)
  - Make the layout too complex (keep it CSS-based)
  - Break existing functionality (device cards, counts, rates)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering` - UI/layout redesign
    - Reason: Visual component requiring CSS layout skills
  - **Skills**: [`frontend-ui-ux`, `typescript-programmer`]
    - `frontend-ui-ux`: Visual layout and design
    - `typescript-programmer`: React component logic
  - **Skills Evaluated but Omitted**:
    - `svelte-programmer`: Project uses React

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `web/src/components/PlanVisualizer.tsx:188-283` - Current ConnectionGraph component
  - `web/src/components/PlanVisualizer.tsx:203-217` - Connection building logic
  - `web/src/components/PlanVisualizer.tsx:219-243` - Level-based layout (to be replaced)
  - `web/src/components/PlanVisualizer.tsx:248-272` - Device rendering in levels

  **Type References**:
  - `web/src/types/manufacturing.ts:76-82` - Connection interface (from, to, itemId, count, rate)

  **Current layout issues**:
  - Line 248-272: Simple horizontal rows per level
  - No vertical stacking for devices with common downstream
  - No connection arrows or product labels

  **Acceptance Criteria**:

  **Manual browser verification**:
  ```
  1. Navigate to: http://localhost:5173/#/detail/[item-with-3+-level-tree]
  2. Click: "模拟制造配置" button
  3. Click: "计算方案" button
  4. Scroll to: "设备连接" section
  5. Verify: Devices with common downstream are stacked vertically (品字形)
  6. Verify: Connection lines or arrows show flow direction
  7. Verify: Input/output products labeled on connections
  8. Screenshot: .sisyphus/evidence/task-4-compact-layout.png
  ```

  **Commit**: YES
  - Message: `feat(visualizer): redesign flow diagram for compact 品字形 layout`
  - Files: `web/src/components/PlanVisualizer.tsx`
  - Pre-commit: `cd web && npm run build`

---

- [ ] 5. Integration Testing and Verification

  **What to do**:
  - Test all 4 fixes together in the browser
  - Verify no regressions in existing functionality
  - Document verification steps and results
  - Capture evidence screenshots

  **Test scenarios**:
  1. Item with disassembler recipe (e.g., 蓝铁矿-related) - verify no invalid recipes
  2. Item with complex dependency tree - verify no "0台" devices
  3. Toggle base materials - verify auto-refresh works
  4. Complex tree view - verify compact layout displays correctly

  **Must NOT do**:
  - Skip any verification step
  - Accept partial fixes

  **Recommended Agent Profile**:
  - **Category**: `quick` - Verification tasks
    - Reason: Testing existing implementation
  - **Skills**: [`dev-browser`]
    - `dev-browser`: Browser automation for verification
  - **Skills Evaluated but Omitted**:
    - `typescript-programmer`: No coding needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (Final)
  - **Blocks**: None (Final task)
  - **Blocked By**: Task 3, Task 4

  **References**:

  **Test items to use**:
  - `item_details/381.json` - 清水 (has disassembler recipe issues)
  - `item_details/371.json` - 蓝铁瓶 (involved in invalid recipe)
  - Any item with 3+ level dependency tree

  **Acceptance Criteria**:

  **Manual browser verification (using dev-browser or playwright skill)**:
  ```
  # Test 1: Invalid recipe filtering
  1. Navigate to: http://localhost:5173/#/detail/381
  2. Click: "模拟制造配置"
  3. Click: "计算方案"
  4. Assert: 蓝铁瓶 does NOT appear as required intermediate
  
  # Test 2: Zero-count device filtering
  1. For same item, check all device cards
  2. Assert: No device shows "0 台"
  
  # Test 3: Auto-refresh
  1. Toggle any base material checkbox
  2. Wait: 500ms
  3. Assert: Plan updates without clicking "计算方案"
  
  # Test 4: Compact layout
  1. Scroll to "设备连接" section
  2. Assert: Layout is compact (not flat horizontal rows)
  3. Assert: Connections show direction
  ```

  **Evidence to capture**:
  - `.sisyphus/evidence/integration-test-recipes.png`
  - `.sisyphus/evidence/integration-test-devices.png`
  - `.sisyphus/evidence/integration-test-autorefresh.png`
  - `.sisyphus/evidence/integration-test-layout.png`

  **Commit**: NO (verification only)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `fix(calculator): filter recipes with no net output` | recipeLoader.ts | npm run build |
| 2 | `fix(calculator): filter devices with count=0` | efficiencyCalculator.ts | npm run build |
| 3 | `feat(simulator): auto-refresh plan on base material toggle` | ManufacturingSimulator.tsx | npm run build |
| 4 | `feat(visualizer): redesign flow diagram for compact 品字形 layout` | PlanVisualizer.tsx | npm run build |
| 5 | No commit (verification only) | - | - |

---

## Success Criteria

### Verification Commands
```bash
cd web && npm run build  # Expected: Build succeeds with no errors
cd web && npm run dev    # Expected: Dev server starts
```

### Final Checklist
- [ ] No devices with count=0 appear in efficiency plan
- [ ] No devices with count=0 appear in scale plan
- [ ] Disassembler recipes with no net output are excluded
- [ ] Base material toggle triggers auto-refresh (debounced)
- [ ] Flow diagram uses compact 品字形 layout
- [ ] All builds pass without errors
- [ ] No console errors in browser
- [ ] Existing functionality (search, detail pages) still works
