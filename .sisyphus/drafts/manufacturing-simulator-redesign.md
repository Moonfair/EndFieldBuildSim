# Draft: Manufacturing Simulator Redesign

## User Request Summary

User wants to redesign the manufacturing configuration simulation feature with these key changes:

1. **Remove target production rate input** - User no longer inputs a target output rate
2. **Two calculation modes**:
   - **Minimum Scale (最小规模)**: Use 1 device per device type, calculate maximum achievable production rate
   - **Maximum Efficiency (最高效率)**: Comprehensive efficiency calculation considering all bottlenecks

## Requirements (Confirmed from User)

### Core Changes
- [x] Remove target rate input from UI
- [x] Output: device configuration (which devices, how many, and their production rates)

### Constants/Speeds
- [x] Conveyor/pipe speed: 0.5 items/sec (2s per item) - already `TRANSFER_RATE_PER_PIPE = 0.5`
- [x] Base material extraction speed: 0.5 items/sec (2s per item) - **NEW constant needed**
- [x] Machine production speed: `1 / manufacturingTime` per device (from recipe data)

### Recipe Batching Rule (Critical)
- [x] Machine can ONLY start production when ALL materials are gathered
- [x] During production run T (duration = manufacturingTime), machine CAN accumulate materials for run T+1
- [x] This overlapping behavior affects throughput calculations

## Technical Decisions

### Current Implementation Analysis

**Files to modify:**
- `ManufacturingSimulator.tsx` - Remove target rate input, change UI
- `efficiencyCalculator.ts` - Completely redesign algorithm
- `minimumScaleCalculator.ts` - Completely redesign algorithm
- `manufacturing.ts` - Possibly add new types

**Current Algorithm (Flawed):**
1. User inputs target rate
2. Efficiency: `deviceCount = ceil(requiredRate / (1/manufacturingTime))`
3. Scale: Each device count = 1, production rate = `min(1/avgProductionTime, totalProductCount/totalMaterialCount)`

**Problems with current approach:**
1. Doesn't consider conveyor/pipe bottleneck (0.5 items/sec)
2. Doesn't consider extraction bottleneck (0.5 items/sec) - no constant exists
3. Doesn't consider recipe batching (must gather all materials first)
4. Doesn't balance intermediate product flows

### Recipe Database Analysis

- `manufacturingTime` exists for SOME recipes (2s or 10s most common)
- Many recipes have `manufacturingTime: null` - defaults to 2s in loader
- Recipe has `materials[]` (inputs) and `products[]` (outputs)
- Each material/product has `id`, `name`, `count`

## Research Findings

### Current Implementation Analysis (from explore agents)

**Data Flow:**
1. User enters `targetRate` in input (ManufacturingSimulator.tsx:180-187)
2. `handleCalculatePlans()` passes rate to both calculators (lines 78-90)
3. Efficiency mode: BFS propagates rate through dependencies, calculates `deviceCount = ceil(requiredRate / (1/manufacturingTime))`
4. Scale mode: Uses `count = 1` for each device type, calculates rate as `min(1/avgTime, products/materials)`

**Constants:**
- `TRANSFER_RATE_PER_PIPE = 0.5` defined in BOTH calculators at line 9
- Used in connection building (rate field)
- Currently NOT used in actual bottleneck calculations (flaw!)

**Recipe Selection:**
- Efficiency: Fastest recipe (min manufacturingTime)
- Scale: Fewest materials, then fastest

**Key Insight:** Current algorithm does NOT consider conveyor rate (0.5) or extraction rate as bottlenecks. It only uses manufacturingTime for calculations.

### Algorithm Research (from librarian agent)

**1. Linear Programming Approach (Factorio/Satisfactory calculators)**
- Model production as system of linear equations
- Variables = number of machines per recipe
- Constraints = material flow balance (inputs = outputs)
- Solve with Simplex method

**2. Bottleneck Analysis**
- Bottleneck = stage with minimum effective rate
- `effective_rate = min(input_rate, machine_rate)`
- Overall throughput limited by slowest stage

**3. Little's Law (for queue validation)**
```
L = λ × W
L = WIP (items in system)
λ = throughput (items/second)
W = flow time (seconds in system)
```

**4. Steady-State vs Batch Simulation**
- Steady-state: Assumes material accumulation overlaps with production
- Rate = `batch_size / manufacturing_time` (simpler, good approximation)
- Full simulation: Models exact timing, more accurate but complex

**5. Key Formula from Factorio calculators:**
```
items_per_second = (items_per_recipe / crafting_time) × num_machines
```

**Recommendation for our redesign:**
- Use chain bottleneck analysis for Minimum Scale
- Use linear balancing for Maximum Efficiency
- Apply Little's Law for validation
- Steady-state model (accumulation during production) simplifies calculations

## User Decisions (CONFIRMED 2026-02-02)

### Q1: Minimum Scale - Production Rate Calculation
**DECISION: Chain Bottleneck Analysis**
- Analyze entire production chain from base materials to final product
- Rate = `min(extraction_rate, conveyor_rate, each_machine_rate)`
- The slowest stage limits the whole chain

### Q2: Maximum Efficiency Target
**DECISION: Zero Waste Balance**
- Calculate device counts so ALL materials flow perfectly
- No machine ever waits for materials
- May require fractional device calculations, round up for practical implementation

### Q3: Base Material Extraction Speed
**DECISION: Fixed 0.5 for ALL base materials**
- New constant: `BASE_MATERIAL_EXTRACTION_RATE = 0.5`
- Simple, matches conveyor rate

### Q4: Recipe Batching Model
**DECISION: Steady-State Model**
- Assume continuous operation after initial startup
- Material accumulation during production overlaps with next batch preparation
- Rate = `1/manufacturingTime` per device (current formula still valid)

### Q5: Output Display
**DECISION: Flow Diagram with Key Metrics**
- Flow diagram showing all device connections
- Final product output rate (items/sec)
- Base material consumption rate (items/sec)
- Total device count
- Bottleneck identification

## Scope Boundaries

### INCLUDE
- Remove target rate input from UI
- New constant: BASE_MATERIAL_EXTRACTION_RATE = 0.5
- Redesign efficiency calculator algorithm
- Redesign minimum scale calculator algorithm
- Display effective production rate in output
- Consider recipe batching in calculations

### EXCLUDE
- Changes to recipe database structure
- Changes to dependency tree building logic (unless necessary)
- Changes to recipe loader
- New UI components beyond removing/modifying existing elements

---

**Last Updated**: 2026-02-02
