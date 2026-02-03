# ConnectionGraph Left-to-Right Layout Redesign

## TL;DR

> **Quick Summary**: Redesign the ConnectionGraph component to display production flow horizontally (left→right) with special nodes for base materials and final product, using orthogonal edge routing with rounded corners.
> 
> **Deliverables**:
> - Refactored `ConnectionGraph` function with left-to-right layout
> - New `BaseMaterialNode` and `FinalProductNode` sub-components
> - Topological stage computation algorithm
> - Orthogonal SVG path routing with rounded corners
> 
> **Estimated Effort**: Medium (4-6 hours)
> **Parallel Execution**: NO - sequential (each task builds on previous)
> **Critical Path**: Task 1 → Task 2 → Task 3 → Task 4 → Task 5

---

## Context

### Original Request
> ConnectionGraph currently stacks devices vertically per column (sources above targets). Need to add special nodes for base materials and final output, and make entire flow left-to-right with same-level products aligned vertically.

### Interview Summary
**Key Discussions**:
- **Base Material Nodes**: Separate node per material showing name + requiredRate (column 0)
- **Final Product Node**: Distinct node showing targetProduct name + calculatedOutputRate (rightmost column)
- **Stage Computation**: Topological distance from base materials (BFS from sources)
- **Vertical Alignment**: Group devices consuming same product WITHIN each stage column
- **Edge Routing**: Orthogonal lines with rounded corners (circuit-diagram style)
- **Verification**: Manual browser testing via `npm run dev`

### Research Findings
- **Current implementation**: `ConnectionGraph` function at lines 194-401 in PlanVisualizer.tsx
- **Layout logic**: Uses column-based "品字形" pattern (inverted triangle), processes from sinks backwards
- **Data available**: `plan.baseMaterials[]`, `plan.targetProduct`, `plan.connections[]`, `plan.devices[]`
- **Position storage**: `Map<string, {x: number, y: number}>`
- **Current edges**: Straight `<line>` elements with `markerEnd` arrowheads
- **Card dimensions**: 180×80px, columnGap=40px, rowGap=20px

### Self-Analysis (Gap Review)
**Identified Gaps Addressed**:
1. Edge case: Empty connections → Already handled (shows "无需设备连接" message)
2. Edge case: Single device plan → Will still work (base materials → device → final product)
3. Cycle handling: Current code doesn't handle cycles → Assuming DAG (valid per DependencyNode design)
4. Responsive sizing: Container uses `overflow-x-auto` for horizontal scroll

**Guardrails Applied**:
- DO NOT modify DeviceCard component
- DO NOT change ProductionPlan data structure
- DO NOT add external graph libraries
- Keep existing card dimensions (180×80px)
- Maintain Chinese UI text conventions

---

## Work Objectives

### Core Objective
Transform ConnectionGraph from vertical top-to-bottom layout to horizontal left-to-right flow with special endpoint nodes and orthogonal edge routing.

### Concrete Deliverables
1. Modified `ConnectionGraph` function in `web/src/components/PlanVisualizer.tsx`
2. New `BaseMaterialNode` sub-component (renders material nodes)
3. New `FinalProductNode` sub-component (renders product node)
4. New `computeStages()` helper (topological BFS)
5. New `OrthogonalEdge` SVG path generator

### Definition of Done
- [ ] Layout flows left-to-right (base materials on left, final product on right)
- [ ] Each stage occupies one column
- [ ] Devices consuming same product are grouped vertically within column
- [ ] Base material nodes visible in column 0
- [ ] Final product node visible in rightmost column
- [ ] Edges are orthogonal (right angles) with rounded corners
- [ ] Existing device cards unchanged (180×80px, same content)
- [ ] No TypeScript errors
- [ ] Visual verification in browser passes

### Must Have
- Left-to-right horizontal flow
- Separate base material nodes
- Final product node
- Orthogonal edge routing with rounded corners
- Stage-based column positioning

### Must NOT Have (Guardrails)
- ❌ External graph layout libraries (D3, dagre, etc.)
- ❌ Changes to DeviceCard component styling
- ❌ Modifications to ProductionPlan type
- ❌ Animated transitions (keep static)
- ❌ Zoom/pan controls
- ❌ Mobile-specific responsive breakpoints

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (no component tests)
- **User wants tests**: NO (manual verification chosen)
- **Framework**: N/A

### Manual Browser Verification

**ALL verification MUST be executable by the agent via Playwright skill.**

**Verification Flow:**
1. Start dev server: `npm run dev` in web/
2. Navigate to Manufacturing Simulator page
3. Select a multi-stage product (e.g., one with 3+ production stages)
4. Scroll to "设备连接" (Device Connections) section
5. Verify layout assertions visually

**Evidence to Capture:**
- Screenshot of the rendered ConnectionGraph
- Visual confirmation of left-to-right flow
- Verification of base material nodes on left
- Verification of final product node on right

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Sequential - Foundation):
└── Task 1: Define node types and data structures

Wave 2 (Sequential - Depends on 1):
└── Task 2: Implement stage computation algorithm

Wave 3 (Sequential - Depends on 2):
└── Task 3: Create special node components

Wave 4 (Sequential - Depends on 3):
└── Task 4: Implement orthogonal edge routing

Wave 5 (Sequential - Depends on 4):
└── Task 5: Integrate and render complete layout

Critical Path: Task 1 → Task 2 → Task 3 → Task 4 → Task 5
Parallel Speedup: None (sequential dependency chain)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 4, 5 | None |
| 2 | 1 | 3, 5 | None |
| 3 | 1 | 5 | 4 (partial) |
| 4 | 1 | 5 | 3 (partial) |
| 5 | 2, 3, 4 | None | None (final integration) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Approach |
|------|-------|---------------------|
| 1-5 | 1, 2, 3, 4, 5 | Single agent, sequential execution |

---

## TODOs

- [ ] 1. Define Node Types and Layout Data Structures

  **What to do**:
  - Add TypeScript interfaces for layout nodes at top of ConnectionGraph function:
    - `LayoutNode`: base interface with `id`, `type`, `x`, `y`, `width`, `height`
    - `DeviceLayoutNode extends LayoutNode`: type='device', deviceId, deviceName
    - `MaterialLayoutNode extends LayoutNode`: type='material', materialId, name, rate
    - `ProductLayoutNode extends LayoutNode`: type='product', productId, name, rate
  - Add `StageInfo` type: `{ stageIndex: number; nodes: string[] }`
  - Update position Map to `Map<string, LayoutNode>`

  **Must NOT do**:
  - Do not modify any code outside ConnectionGraph function yet
  - Do not create separate files for types (keep inline)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small, focused TypeScript type additions
  - **Skills**: [`none needed`]
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No visual changes in this task

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (alone)
  - **Blocks**: Tasks 2, 3, 4, 5
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `web/src/components/PlanVisualizer.tsx:276-281` - Current layout Map pattern: `const layout = new Map<string, { x: number; y: number }>()`
  - `web/src/components/PlanVisualizer.tsx:221` - Current deviceConnections structure

  **Type References**:
  - `web/src/types/manufacturing.ts:60-71` - ProductionPlan interface (devices, connections, baseMaterials, targetProduct)
  - `web/src/types/manufacturing.ts:47-55` - DeviceConfig interface (deviceId, deviceName, inputs, outputs)

  **Acceptance Criteria**:

  ```typescript
  // After edits, verify no TypeScript errors:
  cd web && npx tsc --noEmit
  // Expected: Exit code 0, no errors
  ```

  **Commit**: NO (groups with Task 5)

---

- [ ] 2. Implement Stage Computation Algorithm

  **What to do**:
  - Create `computeStages()` helper function inside ConnectionGraph:
    ```typescript
    function computeStages(
      devices: DeviceConfig[],
      connections: Connection[],
      baseMaterials: Array<{id: string; name: string; requiredRate: number}>
    ): Map<string, number>  // deviceId -> stageIndex
    ```
  - Algorithm (BFS from sources):
    1. Build adjacency: `Map<string, string[]>` (deviceId → downstream deviceIds)
    2. Build reverse adjacency for finding sources
    3. Find source devices (devices whose inputs come from warehouse/baseMaterials)
    4. BFS: sources = stage 1, their consumers = stage 2, etc.
    5. Stage 0 reserved for base materials, final stage for product node
  - Handle edge cases: disconnected devices get their own stage based on inputs

  **Must NOT do**:
  - Do not implement rendering yet
  - Do not use external libraries
  - Do not handle cycles (assume DAG)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Algorithm design requires careful graph traversal logic
  - **Skills**: [`none needed`]
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No visual work

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (alone)
  - **Blocks**: Task 5
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `web/src/components/PlanVisualizer.tsx:246-266` - Current sink-based column building (to be replaced)
  - `web/src/components/PlanVisualizer.tsx:203-217` - Current adjacency building: `itemToConsumers`, `targetToSources`, `sourceToTargets`

  **API/Type References**:
  - `web/src/types/manufacturing.ts:76-82` - Connection interface: `from`, `to`, `itemId`
  - `web/src/types/manufacturing.ts:53` - DeviceConfig.inputs: `Array<{ itemId: string; source: string }>`

  **Algorithm References**:
  - `web/src/utils/dependencyTree.ts:85-102` - Post-order traversal pattern for dependency trees
  - `web/src/utils/efficiencyCalculator.ts:79-91` - collectNodesInPostOrder for traversal reference

  **Acceptance Criteria**:

  ```typescript
  // Verify TypeScript compiles:
  cd web && npx tsc --noEmit
  // Expected: Exit code 0
  
  // Manual logic verification (add console.log temporarily):
  // For a 3-device chain A→B→C:
  //   A (source) should be stage 1
  //   B should be stage 2  
  //   C (sink) should be stage 3
  ```

  **Commit**: NO (groups with Task 5)

---

- [ ] 3. Create Special Node Components

  **What to do**:
  - Create `BaseMaterialNode` sub-component (inside PlanVisualizer.tsx):
    - Props: `material: {id, name, requiredRate}`, `x`, `y`, `itemLookup`
    - Styling: Different from device cards - use amber/yellow background to indicate "input"
    - Size: Same width (180px), shorter height (60px)
    - Content: Item image, name, rate (个/分钟)
  - Create `FinalProductNode` sub-component:
    - Props: `product: {id, name}`, `rate: number`, `x`, `y`, `itemLookup`
    - Styling: Green background to indicate "output/goal"
    - Size: 180×60px
    - Content: Item image, name, output rate
  - Both use `ItemImage` component for item icons

  **Must NOT do**:
  - Do not modify DeviceCard component
  - Do not create separate files
  - Do not add animations

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Creating visual components with specific styling
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Ensures consistent, polished styling for new node types
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed for component creation

  **Parallelization**:
  - **Can Run In Parallel**: Partially with Task 4
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 5
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `web/src/components/PlanVisualizer.tsx:365-391` - Current device card rendering in ConnectionGraph (style pattern to adapt)
  - `web/src/components/PlanVisualizer.tsx:63-86` - BaseMaterials section in main component (shows material display pattern)

  **Component References**:
  - `web/src/components/ItemImage.tsx` - Image component to use for item icons
  - `web/src/components/PlanVisualizer.tsx:3` - Import statement for ItemImage

  **Style References**:
  - `web/src/components/PlanVisualizer.tsx:372` - Device card classes: `bg-white border border-gray-200 rounded-lg p-3 shadow-sm`
  - Amber classes for input: `bg-amber-50 border-amber-200 text-amber-900`
  - Green classes for output: `bg-green-50 border-green-200 text-green-900`

  **Acceptance Criteria**:

  ```typescript
  // TypeScript compilation:
  cd web && npx tsc --noEmit
  // Expected: Exit code 0
  ```

  **Visual Verification (via Playwright):**
  ```
  # After Task 5 integration:
  1. Navigate to: http://localhost:5173/#/simulator
  2. Select product with base materials
  3. Screenshot: Verify amber nodes on left, green node on right
  4. Assert: BaseMaterialNode shows item image + name + rate
  5. Assert: FinalProductNode shows item image + name + rate
  ```

  **Commit**: NO (groups with Task 5)

---

- [ ] 4. Implement Orthogonal Edge Routing

  **What to do**:
  - Create `generateOrthogonalPath()` helper function:
    ```typescript
    function generateOrthogonalPath(
      fromX: number, fromY: number,  // right edge of source node
      toX: number, toY: number,      // left edge of target node
      cornerRadius: number = 8
    ): string  // SVG path 'd' attribute
    ```
  - Path structure: horizontal → rounded corner → vertical → rounded corner → horizontal
  - Use SVG `path` element instead of `line`
  - Handle cases:
    - Same Y level: simple horizontal line
    - Different Y levels: orthogonal route with 2 rounded corners
  - Rounded corners using quadratic bezier (`Q` command) or arc (`A` command)

  **Must NOT do**:
  - Do not implement complex multi-segment routing
  - Do not handle edge crossing avoidance (simple routing is acceptable)
  - Do not add animations

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: SVG path math requires precision
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Ensures clean visual output
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed for SVG generation

  **Parallelization**:
  - **Can Run In Parallel**: Partially with Task 3
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 5
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `web/src/components/PlanVisualizer.tsx:327-361` - Current SVG edge rendering (to be replaced)
  - `web/src/components/PlanVisualizer.tsx:310-326` - SVG container and marker definitions

  **SVG References**:
  - Current arrowhead marker: `web/src/components/PlanVisualizer.tsx:315-325` - Reuse this marker definition
  - Current line: `<line x1={fromX} y1={fromY} x2={toX} y2={toY - 5} stroke="#6B7280" strokeWidth="2" markerEnd="url(#arrowhead)" />`

  **External Documentation**:
  - SVG path commands: M (move), L (line), Q (quadratic curve), A (arc)
  - For rounded corners: Use Q (quadratic bezier) for smooth corners

  **Acceptance Criteria**:

  ```typescript
  // TypeScript compilation:
  cd web && npx tsc --noEmit
  // Expected: Exit code 0
  
  // Path structure verification (add console.log):
  // generateOrthogonalPath(0, 50, 200, 100, 8)
  // Expected: Path with M, L, Q commands forming right-angle route
  ```

  **Visual Verification (via Playwright):**
  ```
  # After Task 5 integration:
  1. Navigate to: http://localhost:5173/#/simulator
  2. Select product with multiple stages
  3. Screenshot: Verify edges have right-angle turns
  4. Assert: Edges connect right side of source to left side of target
  5. Assert: Corners appear rounded (not sharp 90°)
  ```

  **Commit**: NO (groups with Task 5)

---

- [ ] 5. Integrate and Render Complete Layout

  **What to do**:
  - Refactor main `ConnectionGraph` rendering logic:
    1. Call `computeStages()` to get device stage assignments
    2. Create layout nodes for base materials (stage 0)
    3. Create layout nodes for devices (stages 1 to N-1)
    4. Create layout node for final product (stage N)
    5. Position nodes:
       - X = stageIndex * (cardWidth + columnGap)
       - Y = grouped by consumed product, then stacked with rowGap
    6. Generate edges using `generateOrthogonalPath()`
    7. Render all nodes and edges
  - Update container dimensions calculation
  - Update legend text to describe new layout

  **Must NOT do**:
  - Do not change the overall component structure
  - Do not modify props interface
  - Do not add new dependencies

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Integration of visual components with layout logic
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Ensures cohesive final result
  - **Skills Evaluated but Omitted**:
    - `playwright`: Will be used in verification, not implementation

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (final)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 2, 3, 4

  **References**:

  **Pattern References**:
  - `web/src/components/PlanVisualizer.tsx:275-304` - Current layout positioning loop (to be rewritten)
  - `web/src/components/PlanVisualizer.tsx:300-304` - Container dimension calculation

  **Integration Points**:
  - `web/src/components/PlanVisualizer.tsx:306-308` - Container div with relative positioning
  - `web/src/components/PlanVisualizer.tsx:364-391` - Device card rendering loop

  **Data Flow References**:
  - `web/src/components/PlanVisualizer.tsx:194` - ConnectionGraphProps: `connections`, `devices`, `itemLookup`
  - Access to `plan.baseMaterials` and `plan.targetProduct` needed - must pass through props

  **Acceptance Criteria**:

  ```typescript
  // TypeScript compilation:
  cd web && npx tsc --noEmit
  // Expected: Exit code 0
  
  // Build verification:
  cd web && npm run build
  // Expected: Exit code 0, no errors
  ```

  **Visual Verification (via Playwright):**
  ```
  1. Start dev server: cd web && npm run dev
  2. Navigate to: http://localhost:5173/#/simulator
  3. Select "Manufacturing Simulator" from navigation
  4. Search for a multi-stage product (e.g., "紫晶纤维" or similar)
  5. Click to select, view the production plan
  6. Scroll to "设备连接" section
  7. Screenshot: Save to .sisyphus/evidence/connection-graph-layout.png
  
  Assertions:
  - [ ] Base material nodes visible on LEFT side (amber/yellow styling)
  - [ ] Final product node visible on RIGHT side (green styling)  
  - [ ] Flow direction is LEFT → RIGHT
  - [ ] Devices in same stage are in same column
  - [ ] Devices consuming same product are grouped vertically
  - [ ] Edges have right-angle routing with rounded corners
  - [ ] No visual overlap between nodes
  - [ ] Arrowheads point in correct direction (left to right)
  ```

  **Commit**: YES
  - Message: `feat(visualizer): redesign ConnectionGraph with left-to-right layout`
  - Files: `web/src/components/PlanVisualizer.tsx`
  - Pre-commit: `cd web && npm run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 5 | `feat(visualizer): redesign ConnectionGraph with left-to-right layout` | web/src/components/PlanVisualizer.tsx | npm run build |

---

## Success Criteria

### Verification Commands
```bash
# TypeScript check
cd web && npx tsc --noEmit
# Expected: Exit code 0

# Build check
cd web && npm run build  
# Expected: Exit code 0, no errors

# Dev server for visual verification
cd web && npm run dev
# Expected: Server starts on localhost:5173
```

### Final Checklist
- [ ] All "Must Have" present:
  - [ ] Left-to-right horizontal flow
  - [ ] Separate base material nodes (column 0)
  - [ ] Final product node (rightmost column)
  - [ ] Orthogonal edge routing with rounded corners
  - [ ] Stage-based column positioning
- [ ] All "Must NOT Have" absent:
  - [ ] No external graph libraries added
  - [ ] DeviceCard unchanged
  - [ ] ProductionPlan type unchanged
  - [ ] No animations added
- [ ] TypeScript compiles without errors
- [ ] Build succeeds without errors
- [ ] Visual verification screenshot captured
