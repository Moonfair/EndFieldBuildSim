import { useState, useEffect, useRef } from 'react';
import type { SimulatorState, DependencyNode, ManufacturingRecipe } from '../types/manufacturing';
import type { ItemLookup } from '../types/catalog';
import { loadRecipeLookup } from '../utils/recipeLoader';
import { buildDependencyTree } from '../utils/dependencyTree';
import { calculateMaximumEfficiencyPlan, getSelectedRecipes } from '../utils/efficiencyCalculator';
import PlanVisualizer from './PlanVisualizer';
import BaseMaterialSelector from './BaseMaterialSelector';

interface ManufacturingSimulatorProps {
  targetItemId: string;
  targetItemName: string;
  itemLookup: ItemLookup;
}

export default function ManufacturingSimulator({
  targetItemId,
  targetItemName,
  itemLookup,
}: ManufacturingSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<SimulatorState>({
    targetItemId,
    baseMaterialIds: new Set(),
    dependencyTree: null,
    efficiencyPlan: null,
    targetRate: 1,
    loading: false,
    error: null,
  });
  const [selectedRecipes, setSelectedRecipes] = useState<Map<string, ManufacturingRecipe>>(new Map());

  const [dependencyTree, setDependencyTree] = useState<DependencyNode | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    console.log('[INIT EFFECT] Running, isOpen:', isOpen);
    if (!isOpen) return;

    const initializeSimulator = async () => {
      console.log('[INIT] Starting initialization for', targetItemName, targetItemId);
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const recipeLookup = await loadRecipeLookup(itemLookup);
        console.log('[INIT] Recipe lookup loaded');
        
        const tree = buildDependencyTree({
          targetItemId,
          targetItemName,
          baseMaterialIds: new Set(),
          recipeLookup,
          cycleGroups: recipeLookup.cycleGroups,
        });
        console.log('[INIT] Tree built:', { isBase: tree.isBase, recipes: tree.recipes.length, children: tree.children.length });

        setDependencyTree(tree);
        
        console.log('[INIT] Calculating efficiency plan (auto-rate mode)');
        const efficiencyPlan = calculateMaximumEfficiencyPlan(
          targetItemId,
          targetItemName,
          tree,
          itemLookup
        );
        console.log('[INIT] Efficiency plan calculated:', { devices: efficiencyPlan.devices.length, rate: efficiencyPlan.calculatedOutputRate });

        const selected = getSelectedRecipes(tree);
        setSelectedRecipes(selected);

        setState((prev) => ({
          ...prev,
          dependencyTree: tree,
          efficiencyPlan,
          loading: false,
        }));
        console.log('[INIT] State updated with plans');
      } catch (error) {
        console.error('Failed to initialize simulator:', error);
        setState((prev) => ({
          ...prev,
          error: '初始化失败，请稍后重试',
          loading: false,
        }));
      }
    };

    initializeSimulator();
  }, [isOpen, targetItemId, targetItemName, itemLookup]);

  useEffect(() => {
    console.log('[REFRESH EFFECT] Running, isOpen:', isOpen, 'dependencyTree:', !!dependencyTree);
    if (!isOpen || !dependencyTree) return;

    const timeoutId = setTimeout(async () => {
      console.log('[REFRESH] Recalculating with base materials:', state.baseMaterialIds.size);
      try {
        const recipeLookup = await loadRecipeLookup(itemLookup);
        const allBaseMaterials = new Set([...state.baseMaterialIds]);

        const tree = buildDependencyTree({
          targetItemId,
          targetItemName,
          baseMaterialIds: allBaseMaterials,
          recipeLookup,
          cycleGroups: recipeLookup.cycleGroups,
        });
        console.log('[REFRESH] Tree rebuilt');

        setDependencyTree(tree);
        
        console.log('[REFRESH] Calculating efficiency plan (auto-rate mode)');
        const efficiencyPlan = calculateMaximumEfficiencyPlan(
          targetItemId,
          targetItemName,
          tree,
          itemLookup
        );
        console.log('[REFRESH] Efficiency plan:', { devices: efficiencyPlan.devices.length, rate: efficiencyPlan.calculatedOutputRate });

        const selected = getSelectedRecipes(tree);
        setSelectedRecipes(selected);

        setState((prev) => ({
          ...prev,
          dependencyTree: tree,
          efficiencyPlan,
        }));
        console.log('[REFRESH] State updated');
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [state.baseMaterialIds, isOpen, targetItemId, targetItemName, itemLookup]);



  const handleBaseMaterialToggle = (itemId: string) => {
    setState((prev) => {
      const newBaseMaterials = new Set(prev.baseMaterialIds);
      if (newBaseMaterials.has(itemId)) {
        newBaseMaterials.delete(itemId);
      } else {
        newBaseMaterials.add(itemId);
      }
      return {
        ...prev,
        baseMaterialIds: newBaseMaterials,
        efficiencyPlan: null,
      };
    });
  };

  const handleUpdateDependencyTree = () => {
    if (!dependencyTree) return;

    const recipeLookupPromise = loadRecipeLookup(itemLookup);

    recipeLookupPromise.then((recipeLookup) => {
      const tree = buildDependencyTree({
        targetItemId,
        targetItemName,
        baseMaterialIds: state.baseMaterialIds,
        recipeLookup,
        cycleGroups: recipeLookup.cycleGroups,
});

      setDependencyTree(tree);

      const selected = getSelectedRecipes(tree);
      setSelectedRecipes(selected);

      setState((prev) => ({
          ...prev,
          dependencyTree: tree,
          efficiencyPlan: null,
        }));
    });
  };

  console.log('[RENDER] State.efficiencyPlan:', state.efficiencyPlan ? `${state.efficiencyPlan.devices.length} devices` : 'null');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
      >
        模拟制造配置
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div ref={panelRef} className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">制造配置模拟器</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="text-sm text-gray-600">
            ℹ️ 最高效率方案自动计算最小整数配比的产出率
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <BaseMaterialSelector
              dependencyTree={dependencyTree}
              selectedIds={state.baseMaterialIds}
              onToggle={handleBaseMaterialToggle}
              onUpdateTree={handleUpdateDependencyTree}
              itemLookup={itemLookup}
              selectedRecipes={selectedRecipes}
            />
          </div>

          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {state.error}
            </div>
          )}

          {dependencyTree && (
            <div className="mb-6">
              {state.efficiencyPlan ? (
                <PlanVisualizer plan={state.efficiencyPlan} itemLookup={itemLookup} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>选择目标产出率并点击"计算方案"查看结果</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
