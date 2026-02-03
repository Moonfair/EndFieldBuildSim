# Manufacturing Simulator Redesign - Work Plan

## TL;DR

> **Quick Summary**: Redesign the manufacturing simulation feature to calculate production rates from system bottlenecks instead of user input, with two modes: Minimum Scale (1 device each, bottleneck-limited rate) and Maximum Efficiency (device counts balanced for zero-waste material flow).
> 
> **Deliverables**:
> - Remove target production rate input from UI
> - New constant: `BASE_MATERIAL_EXTRACTION_RATE = 0.5`
> - Redesigned Minimum Scale calculator with chain bottleneck analysis
> - Redesigned Maximum Efficiency calculator with zero-waste flow balancing
> - Updated visualizer showing final output rate and material consumption
> 
> **Estimated Effort**: Medium (3-5 hours)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 2/3 (parallel) → Task 4 → Task 5

---

## Context

### Original Request
User wants to redesign the manufacturing configuration simulation feature:
1. Remove target production rate input - user no longer specifies target
2. "Minimum Scale" (最小规模): Use 1 device per type, calculate rate from chain bottlenecks
3. "Maximum Efficiency" (最高效率): Calculate device counts for zero-waste material flow balance

### Interview Summary
**Key Discussions**:
- Conveyor speed: Fixed 0.5 items/sec (already `TRANSFER_RATE_PER_PIPE`)
- Base material extraction: Fixed 0.5 items/sec (NEW constant needed)
- Recipe batching: Steady-state model (accumulation during production)
- manufacturingTime: 2s (common), 10s (slow), null (defaults to 2s)

**Research Findings**:
- Factorio/Satisfactory calculators use linear programming for flow balance
- Bottleneck = stage with minimum effective rate
- Steady-state: rate = 1/manufacturingTime (accumulation overlaps production)

### Self-Review (Gap Analysis)
**Identified Gaps** (addressed):
- Multiple inputs per recipe: Each input line has 0.5/s limit → resolved by considering sum of input requirements
- Recipe with multiple products: Each output has same rate → handled by products array
- Circular dependencies: Already handled by dependencyTree.ts visited set
- No test infrastructure: Will add manual verification steps

---

## Work Objectives

### Core Objective
Replace user-specified target rate with calculated rates based on physical system constraints (extraction, conveyor, machine speeds) and flow balance requirements.

### Concrete Deliverables
- `ManufacturingSimulator.tsx`: Remove targetRate input, update button handler
- `manufacturing.ts`: Add `calculatedOutputRate` to ProductionPlan, add constant exports
- `minimumScaleCalculator.ts`: Complete rewrite with chain bottleneck analysis
- `efficiencyCalculator.ts`: Complete rewrite with zero-waste flow balancing
- `PlanVisualizer.tsx`: Update to show calculated output rate instead of target rate

### Definition of Done
- [ ] No target rate input visible in UI
- [ ] Minimum Scale mode calculates correct bottleneck-limited rate
- [ ] Maximum Efficiency mode calculates device counts for balanced flow
- [ ] Output shows calculated final output rate (items/sec)
- [ ] Output shows base material consumption rates
- [ ] `npm run build` succeeds without TypeScript errors

### Must Have
- Chain bottleneck analysis for Minimum Scale
- Zero-waste flow balancing for Maximum Efficiency
- BASE_MATERIAL_EXTRACTION_RATE = 0.5 constant
- Final output rate in visualization
- Base material consumption rates

### Must NOT Have (Guardrails)
- NO user-configurable extraction rates (fixed 0.5 for all)
- NO full batch timing simulation (steady-state only)
- NO linear programming library imports (simple iterative algorithm)
- NO changes to recipe database structure
- NO changes to dependency tree building logic
- NO new external dependencies

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (no test setup in web/)
- **User wants tests**: Manual verification (no TDD)
- **QA approach**: Manual verification via browser

### Automated Verification (Agent-Executable)

For all tasks, verification will use Playwright browser automation:

**Build Verification:**
```bash
cd web && npm run build
# Assert: Exit code 0
# Assert: No TypeScript errors in output
```

**UI Verification (Playwright):**
```
1. Navigate to: http://localhost:5173/
2. Search for item: "紫晶纤维" (item with known recipe chain)
3. Click item to go to detail page
4. Click "模拟制造配置" button
5. Assert: NO target rate input field visible
6. Click "计算方案" button
7. Assert: Results display with "产出率" showing calculated rate
8. Switch to "最小规模" tab
9. Assert: Device counts all show "1 台"
10. Switch to "最高效率" tab
11. Assert: Device counts may be > 1 for balanced flow
12. Screenshot: .sisyphus/evidence/manufacturing-redesign-verification.png
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Add constants and update types (foundation)
└── (No parallel - Task 1 is foundational)

Wave 2 (After Task 1):
├── Task 2: Redesign minimumScaleCalculator.ts
└── Task 3: Redesign efficiencyCalculator.ts

Wave 3 (After Wave 2):
└── Task 4: Update ManufacturingSimulator.tsx UI

Wave 4 (After Task 4):
└── Task 5: Update PlanVisualizer.tsx

Critical Path: Task 1 → Task 2 → Task 4 → Task 5
Parallel Speedup: ~30% (Tasks 2 and 3 run in parallel)
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 2, 3, 4 | None |
| 2 | 1 | 4 | 3 |
| 3 | 1 | 4 | 2 |
| 4 | 2, 3 | 5 | None |
| 5 | 4 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|------|-------|-------------------|
| 1 | 1 | Single agent, quick task |
| 2 | 2, 3 | Two parallel agents for calculator rewrites |
| 3 | 4 | Single agent, UI changes |
| 4 | 5 | Single agent, visualizer update |

---

## TODOs

### Task 1: Add Constants and Update Types

- [ ] 1. Add BASE_MATERIAL_EXTRACTION_RATE constant and update ProductionPlan type

  **What to do**:
  - Create new file `web/src/utils/constants.ts` with:
    ```typescript
    export const TRANSFER_RATE_PER_PIPE = 0.5; // items per second
    export const BASE_MATERIAL_EXTRACTION_RATE = 0.5; // items per second
    ```
  - Update `web/src/types/manufacturing.ts`:
    - Remove `targetRate` from `ProductionPlan` interface
    - Add `calculatedOutputRate: number` to `ProductionPlan`
    - Add `bottleneckStage?: { stage: string; rate: number; limitedBy: string }` for better bottleneck info
  - Update `web/src/types/manufacturing.ts` `SimulatorState`:
    - Remove `targetRate: number`

  **Must NOT do**:
  - Do NOT modify recipe database structure
  - Do NOT add new external dependencies

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file creation and type modifications
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - `git-master`: Not needed for this task

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (foundational)
  - **Blocks**: Tasks 2, 3, 4
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `web/src/utils/efficiencyCalculator.ts:9` - Current TRANSFER_RATE_PER_PIPE definition (to be replaced by import)
  - `web/src/utils/minimumScaleCalculator.ts:9` - Duplicate constant definition (to be replaced)

  **API/Type References**:
  - `web/src/types/manufacturing.ts:60-70` - Current ProductionPlan interface to modify
  - `web/src/types/manufacturing.ts:86-95` - Current SimulatorState interface to modify

  **WHY Each Reference Matters**:
  - The constant definitions show the current pattern of inline constants that should be consolidated
  - The type definitions show exactly which fields to remove (targetRate) and add (calculatedOutputRate)

  **Acceptance Criteria**:

  ```bash
  # Agent runs:
  cd /Users/moonfair/Projects/EndFieldBuildSim/web && npm run build 2>&1 | head -20
  # Assert: May show errors (expected - other files not updated yet)
  # But constants.ts should exist and be valid TypeScript
  
  # Verify file exists:
  cat web/src/utils/constants.ts
  # Assert: Contains BASE_MATERIAL_EXTRACTION_RATE = 0.5
  # Assert: Contains TRANSFER_RATE_PER_PIPE = 0.5
  ```

  **Commit**: YES
  - Message: `feat(manufacturing): add constants file and update ProductionPlan types`
  - Files: `web/src/utils/constants.ts`, `web/src/types/manufacturing.ts`
  - Pre-commit: None (build may fail until other tasks complete)

---

### Task 2: Redesign Minimum Scale Calculator

- [ ] 2. Rewrite minimumScaleCalculator.ts with chain bottleneck analysis

  **What to do**:
  - Import constants from `constants.ts`
  - Remove `targetRate` parameter from `calculateMinimumScalePlan`
  - Implement chain bottleneck analysis algorithm:
    ```typescript
    // For each stage in production chain:
    // 1. Base material extraction: rate = BASE_MATERIAL_EXTRACTION_RATE (0.5/s)
    // 2. Conveyor transfer: rate = TRANSFER_RATE_PER_PIPE (0.5/s)
    // 3. Machine production: rate = 1 / manufacturingTime per device
    // 
    // For Minimum Scale (1 device each):
    // - Calculate effective rate at each stage
    // - If recipe needs N materials, total input rate = N × 0.5/s
    //   But machine processes all inputs together, so:
    //   - Material gathering rate = min(0.5/s per input line)
    //   - Machine rate = 1/manufacturingTime
    //   - Stage rate = min(gathering, machine)
    // - Final rate = min(all stage rates)
    ```
  - Update return type to use `calculatedOutputRate` instead of `targetRate`
  - Calculate base material consumption rates based on final output rate

  **Algorithm Details**:
  ```typescript
  function calculateMinimumScalePlan(
    targetItemId: string,
    targetItemName: string,
    dependencyTree: DependencyNode
  ): ProductionPlan {
    // Step 1: Select recipes (prefer fewest materials, then fastest)
    const selectedRecipes = selectRecipesForMinScale(dependencyTree);
    
    // Step 2: Build production stages from tree
    const stages = buildProductionStages(dependencyTree, selectedRecipes);
    
    // Step 3: Calculate rate at each stage (1 device each)
    for (const stage of stages) {
      const machineRate = 1 / stage.recipe.manufacturingTime;
      const inputRate = stage.isBaseMaterial 
        ? BASE_MATERIAL_EXTRACTION_RATE 
        : TRANSFER_RATE_PER_PIPE;
      
      // If multiple inputs, each has its own line at inputRate
      // But machine needs ALL materials, so effective input = inputRate
      // (materials arrive in parallel, machine waits for slowest)
      stage.effectiveRate = Math.min(machineRate, inputRate);
    }
    
    // Step 4: Find bottleneck (minimum rate stage)
    const bottleneck = stages.reduce((min, s) => 
      s.effectiveRate < min.effectiveRate ? s : min
    );
    
    // Step 5: Final output rate = bottleneck rate
    const calculatedOutputRate = bottleneck.effectiveRate;
    
    // Step 6: Calculate base material consumption
    // Each base material consumed at: calculatedOutputRate × recipe_count
    
    return {
      type: 'scale',
      name: '最小规模生产方案',
      calculatedOutputRate,
      // ... rest of plan
    };
  }
  ```

  **Must NOT do**:
  - Do NOT change function signature beyond removing targetRate
  - Do NOT import external linear programming libraries
  - Do NOT modify dependencyTree building logic

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Complex algorithm redesign requiring careful mathematical reasoning
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not UI work

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `web/src/utils/minimumScaleCalculator.ts` - Current implementation to replace entirely
  - `web/src/utils/dependencyTree.ts:78-104` - selectOptimalRecipe function pattern

  **API/Type References**:
  - `web/src/types/manufacturing.ts:35-42` - DependencyNode structure
  - `web/src/types/manufacturing.ts:47-55` - DeviceConfig structure
  - `web/src/types/manufacturing.ts:1-7` - ManufacturingRecipe with manufacturingTime

  **Test References**:
  - None (no tests exist)

  **Documentation References**:
  - Draft: `.sisyphus/drafts/manufacturing-simulator-redesign.md` - Algorithm research section

  **WHY Each Reference Matters**:
  - Current minimumScaleCalculator.ts shows the function signature and return type to maintain
  - DependencyNode shows tree structure for traversal
  - ManufacturingRecipe shows manufacturingTime field location

  **Acceptance Criteria**:

  ```bash
  # Agent runs after Task 1 complete:
  cd /Users/moonfair/Projects/EndFieldBuildSim/web && npm run build 2>&1
  # Assert: No TypeScript errors related to minimumScaleCalculator.ts
  
  # Verify imports:
  grep -n "BASE_MATERIAL_EXTRACTION_RATE" web/src/utils/minimumScaleCalculator.ts
  # Assert: Import from constants.ts present
  
  # Verify no targetRate parameter:
  grep -n "targetRate" web/src/utils/minimumScaleCalculator.ts
  # Assert: No matches (parameter removed)
  
  # Verify calculatedOutputRate in return:
  grep -n "calculatedOutputRate" web/src/utils/minimumScaleCalculator.ts
  # Assert: At least one match (in return object)
  ```

  **Commit**: NO (groups with Task 3)

---

### Task 3: Redesign Maximum Efficiency Calculator

- [ ] 3. Rewrite efficiencyCalculator.ts with zero-waste flow balancing

  **What to do**:
  - Import constants from `constants.ts`
  - Remove `targetRate` parameter from `calculateMaximumEfficiencyPlan`
  - Implement zero-waste flow balancing algorithm:
    ```typescript
    // Goal: Calculate device counts so no machine waits for materials
    // 
    // Starting constraint: Base material extraction = 0.5/s per material
    // 
    // Algorithm (bottom-up from base materials):
    // 1. For each base material, input rate = 0.5/s
    // 2. For each stage consuming that material:
    //    - Required device count = inputRate / (1/manufacturingTime)
    //    - Output rate = deviceCount × (1/manufacturingTime)
    // 3. Propagate output rates to next stage
    // 4. Final output rate = output of final stage
    //
    // Key insight: To avoid waste, each stage must produce
    // exactly what the next stage consumes
    ```
  - Calculate device counts to balance material flow
  - Return plan with `calculatedOutputRate`

  **Algorithm Details**:
  ```typescript
  function calculateMaximumEfficiencyPlan(
    targetItemId: string,
    targetItemName: string,
    dependencyTree: DependencyNode
  ): ProductionPlan {
    // Step 1: Select fastest recipes for each item
    const selectedRecipes = selectRecipesForEfficiency(dependencyTree);
    
    // Step 2: Calculate available rates bottom-up
    // Start from base materials (each has 0.5/s extraction)
    const availableRates = new Map<string, number>();
    
    // For base materials: rate = 0.5/s
    for (const baseMaterial of getBaseMaterials(dependencyTree)) {
      availableRates.set(baseMaterial.id, BASE_MATERIAL_EXTRACTION_RATE);
    }
    
    // Step 3: For each non-base item (in dependency order, leaf to root):
    for (const item of getItemsInDependencyOrder(dependencyTree)) {
      const recipe = selectedRecipes.get(item.id);
      if (!recipe) continue;
      
      // Calculate max input rate (limited by slowest input)
      let maxInputRate = Infinity;
      for (const material of recipe.materials) {
        const materialRate = availableRates.get(material.id) || TRANSFER_RATE_PER_PIPE;
        // Need material.count units per production cycle
        // Available: materialRate/sec, need: material.count per (manufacturingTime)
        const effectiveInputRate = materialRate / material.count;
        maxInputRate = Math.min(maxInputRate, effectiveInputRate);
      }
      
      // Machine rate with 1 device
      const singleDeviceRate = 1 / recipe.manufacturingTime;
      
      // Calculate device count to match input rate (zero waste)
      const deviceCount = Math.ceil(maxInputRate / singleDeviceRate);
      
      // Actual output rate with this many devices
      const outputRate = Math.min(maxInputRate, deviceCount * singleDeviceRate);
      availableRates.set(item.id, outputRate);
    }
    
    // Step 4: Final output rate
    const calculatedOutputRate = availableRates.get(targetItemId) || 0;
    
    return {
      type: 'efficiency',
      name: '最高效率生产方案',
      calculatedOutputRate,
      // ... devices, connections, etc.
    };
  }
  ```

  **Must NOT do**:
  - Do NOT use external optimization libraries
  - Do NOT modify dependency tree structure
  - Do NOT create complex iterative solvers (keep it simple)

  **Recommended Agent Profile**:
  - **Category**: `ultrabrain`
    - Reason: Complex algorithm design with flow balancing calculations
  - **Skills**: None needed
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not UI work

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `web/src/utils/efficiencyCalculator.ts` - Current implementation to replace entirely
  - `web/src/utils/efficiencyCalculator.ts:155-183` - calculateRequiredRates BFS pattern (reverse direction needed)
  - `web/src/utils/dependencyTree.ts:106-141` - countRequiredItems traversal pattern

  **API/Type References**:
  - `web/src/types/manufacturing.ts:35-42` - DependencyNode structure
  - `web/src/types/manufacturing.ts:1-7` - ManufacturingRecipe with materials array

  **External References**:
  - Factorio calculator approach: Linear flow balancing (from research)

  **WHY Each Reference Matters**:
  - Current efficiencyCalculator shows structure to maintain
  - calculateRequiredRates shows BFS pattern (but we need bottom-up instead of top-down)
  - countRequiredItems shows tree traversal pattern

  **Acceptance Criteria**:

  ```bash
  # Agent runs after Task 1 complete:
  cd /Users/moonfair/Projects/EndFieldBuildSim/web && npm run build 2>&1
  # Assert: No TypeScript errors related to efficiencyCalculator.ts
  
  # Verify imports:
  grep -n "BASE_MATERIAL_EXTRACTION_RATE" web/src/utils/efficiencyCalculator.ts
  # Assert: Import from constants.ts present
  
  # Verify no targetRate parameter:
  grep -n "targetRate" web/src/utils/efficiencyCalculator.ts
  # Assert: No matches (parameter removed)
  
  # Verify calculatedOutputRate in return:
  grep -n "calculatedOutputRate" web/src/utils/efficiencyCalculator.ts
  # Assert: At least one match
  ```

  **Commit**: YES (groups with Task 2)
  - Message: `feat(manufacturing): redesign calculators with bottleneck analysis and flow balancing`
  - Files: `web/src/utils/minimumScaleCalculator.ts`, `web/src/utils/efficiencyCalculator.ts`
  - Pre-commit: `npm run build`

---

### Task 4: Update ManufacturingSimulator UI

- [ ] 4. Remove target rate input and update calculation calls

  **What to do**:
  - Remove `targetRate` state variable (line 24)
  - Remove target rate input field (lines 176-188)
  - Update `handleCalculatePlans` to call calculators without targetRate parameter
  - Remove `targetRate` from SimulatorState initialization
  - Update any references to `state.targetRate`

  **Specific Changes**:
  ```typescript
  // REMOVE: const [targetRate, setTargetRate] = useState(1);
  
  // REMOVE: Lines 176-188 (target rate input div)
  
  // UPDATE handleCalculatePlans:
  const efficiencyPlan = calculateMaximumEfficiencyPlan(
    targetItemId,
    targetItemName,
    dependencyTree
    // REMOVED: targetRate parameter
  );

  const scalePlan = calculateMinimumScalePlan(
    targetItemId,
    targetItemName,
    dependencyTree
    // REMOVED: targetRate parameter
  );
  
  // UPDATE SimulatorState initialization (line 25-34):
  // REMOVE: targetRate: 1,
  ```

  **Must NOT do**:
  - Do NOT change modal layout/styling
  - Do NOT remove tab switching functionality
  - Do NOT modify BaseMaterialSelector component

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component modification with React patterns
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: UI component patterns and React best practices
  - **Skills Evaluated but Omitted**:
    - `playwright`: Testing comes later

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 3 (sequential)
  - **Blocks**: Task 5
  - **Blocked By**: Tasks 2, 3

  **References**:

  **Pattern References**:
  - `web/src/components/ManufacturingSimulator.tsx:24` - targetRate state to remove
  - `web/src/components/ManufacturingSimulator.tsx:72-106` - handleCalculatePlans to update
  - `web/src/components/ManufacturingSimulator.tsx:176-188` - Input field to remove

  **API/Type References**:
  - `web/src/types/manufacturing.ts:86-95` - Updated SimulatorState (targetRate removed)

  **WHY Each Reference Matters**:
  - Line numbers pinpoint exact code to modify
  - SimulatorState type shows the interface contract after Task 1

  **Acceptance Criteria**:

  ```bash
  # Agent runs:
  cd /Users/moonfair/Projects/EndFieldBuildSim/web && npm run build
  # Assert: Exit code 0, no errors
  
  # Verify targetRate removed:
  grep -n "targetRate" web/src/components/ManufacturingSimulator.tsx
  # Assert: No matches (all references removed)
  
  # Verify input field removed:
  grep -n "目标产出率" web/src/components/ManufacturingSimulator.tsx
  # Assert: No matches
  ```

  **UI Verification (Playwright):**
  ```
  1. Start dev server: npm run dev (in background)
  2. Navigate to: http://localhost:5173/
  3. Search: "铁制零件"
  4. Click first result
  5. Click "模拟制造配置" button
  6. Assert: Modal opens
  7. Assert: NO input field with label "目标产出率"
  8. Assert: "计算方案" button visible
  9. Screenshot: .sisyphus/evidence/task-4-no-target-rate.png
  ```

  **Commit**: YES
  - Message: `feat(manufacturing): remove target rate input from UI`
  - Files: `web/src/components/ManufacturingSimulator.tsx`
  - Pre-commit: `npm run build`

---

### Task 5: Update PlanVisualizer Display

- [ ] 5. Update visualization to show calculated output rate and improve metrics

  **What to do**:
  - Replace "目标产出率" label with "计算产出率"
  - Display `plan.calculatedOutputRate` instead of `plan.targetRate`
  - Add base material consumption summary section
  - Improve bottleneck display to show limiting factor

  **Specific Changes**:
  ```typescript
  // Line 20-24: Change label and value
  <div>
    <div className="text-blue-700">计算产出率</div>  {/* Was: 目标产出率 */}
    <div className="font-medium text-blue-900">
      {plan.calculatedOutputRate.toFixed(3)} 个/秒  {/* Was: plan.targetRate */}
    </div>
  </div>
  
  // Add after bottleneck section (around line 44):
  // New section showing base material consumption summary
  {plan.baseMaterials.length > 0 && (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="font-semibold text-green-900 mb-2">原料消耗总计</h4>
      <div className="text-green-800">
        总消耗：{plan.baseMaterials.reduce((sum, m) => sum + m.requiredRate, 0).toFixed(3)} 个/秒
      </div>
    </div>
  )}
  ```

  **Must NOT do**:
  - Do NOT change DeviceCard component structure
  - Do NOT modify ConnectionGraph visualization (works fine)
  - Do NOT add complex flow diagram (current connection view is sufficient)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI display modifications
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: UI display patterns
  - **Skills Evaluated but Omitted**:
    - `playwright`: Verification step only

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 4 (final)
  - **Blocks**: None (final task)
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `web/src/components/PlanVisualizer.tsx:20-24` - Target rate display to update
  - `web/src/components/PlanVisualizer.tsx:39-44` - Bottleneck section pattern
  - `web/src/components/PlanVisualizer.tsx:60-87` - Base materials section pattern

  **API/Type References**:
  - `web/src/types/manufacturing.ts:60-70` - Updated ProductionPlan with calculatedOutputRate

  **WHY Each Reference Matters**:
  - Line 20-24 shows exact location of label/value to change
  - Bottleneck section shows pattern for new summary section
  - Base materials section shows iteration pattern to reuse

  **Acceptance Criteria**:

  ```bash
  # Agent runs:
  cd /Users/moonfair/Projects/EndFieldBuildSim/web && npm run build
  # Assert: Exit code 0
  
  # Verify label changed:
  grep -n "计算产出率" web/src/components/PlanVisualizer.tsx
  # Assert: At least one match
  
  # Verify old label removed:
  grep -n "目标产出率" web/src/components/PlanVisualizer.tsx
  # Assert: No matches
  
  # Verify calculatedOutputRate used:
  grep -n "calculatedOutputRate" web/src/components/PlanVisualizer.tsx
  # Assert: At least one match
  ```

  **UI Verification (Playwright):**
  ```
  1. Navigate to: http://localhost:5173/
  2. Search: "紫晶纤维" (has complex recipe chain)
  3. Click result
  4. Click "模拟制造配置"
  5. Click "计算方案"
  6. Wait for results
  7. Assert: "计算产出率" label visible (NOT "目标产出率")
  8. Assert: Rate value shows decimal (e.g., "0.500 个/秒")
  9. Assert: "设备总数" shows number
  10. Assert: Base materials section shows consumption rates
  11. Screenshot: .sisyphus/evidence/task-5-final-output.png
  ```

  **Commit**: YES
  - Message: `feat(manufacturing): update visualizer to show calculated output rate`
  - Files: `web/src/components/PlanVisualizer.tsx`
  - Pre-commit: `npm run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `feat(manufacturing): add constants file and update ProductionPlan types` | constants.ts, manufacturing.ts | TypeScript validity |
| 2+3 | `feat(manufacturing): redesign calculators with bottleneck analysis and flow balancing` | minimumScaleCalculator.ts, efficiencyCalculator.ts | npm run build |
| 4 | `feat(manufacturing): remove target rate input from UI` | ManufacturingSimulator.tsx | npm run build |
| 5 | `feat(manufacturing): update visualizer to show calculated output rate` | PlanVisualizer.tsx | npm run build + manual UI check |

---

## Success Criteria

### Verification Commands
```bash
# Build succeeds
cd web && npm run build
# Expected: Exit code 0, no errors

# No targetRate in codebase (except types that define it as removed)
grep -r "targetRate" web/src/ --include="*.ts" --include="*.tsx" | grep -v "manufacturing.ts"
# Expected: No matches

# New constant exists
grep "BASE_MATERIAL_EXTRACTION_RATE" web/src/utils/constants.ts
# Expected: export const BASE_MATERIAL_EXTRACTION_RATE = 0.5
```

### Final Checklist
- [ ] No target rate input visible in UI
- [ ] Minimum Scale shows device count = 1 for each device type
- [ ] Minimum Scale shows calculated rate based on bottleneck
- [ ] Maximum Efficiency shows device counts > 1 where needed for flow balance
- [ ] Maximum Efficiency shows calculated output rate
- [ ] Base material consumption rates displayed
- [ ] Build passes without TypeScript errors
- [ ] All "Must NOT Have" guardrails respected
