import { useState, useEffect } from 'react';
import type { SimulatorState, DependencyNode } from '../types/manufacturing';
import type { ItemLookup } from '../types/catalog';
import { loadRecipeLookup } from '../utils/recipeLoader';
import { buildDependencyTree } from '../utils/dependencyTree';
import { calculateMinimumScalePlan } from '../utils/minimumScaleCalculator';
import { calculateMaximumEfficiencyPlan } from '../utils/efficiencyCalculator';
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
  const [activeTab, setActiveTab] = useState<'efficiency' | 'scale'>('efficiency');
  const [targetRate, setTargetRate] = useState(1);
  const [state, setState] = useState<SimulatorState>({
    targetItemId,
    baseMaterialIds: new Set(),
    dependencyTree: null,
    efficiencyPlan: null,
    scalePlan: null,
    targetRate: 1,
    loading: false,
    error: null,
  });

  const [dependencyTree, setDependencyTree] = useState<DependencyNode | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const initializeSimulator = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const recipeLookup = await loadRecipeLookup(itemLookup);
        const tree = buildDependencyTree({
          targetItemId,
          targetItemName,
          baseMaterialIds: new Set(),
          recipeLookup,
        });

        setDependencyTree(tree);
        setState((prev) => ({
          ...prev,
          dependencyTree: tree,
          loading: false,
        }));
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

  const handleCalculatePlans = () => {
    if (!dependencyTree) return;

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const efficiencyPlan = calculateMaximumEfficiencyPlan(
        targetItemId,
        targetItemName,
        dependencyTree,
        targetRate
      );

      const scalePlan = calculateMinimumScalePlan(
        targetItemId,
        targetItemName,
        dependencyTree,
        targetRate
      );

      setState((prev) => ({
        ...prev,
        efficiencyPlan,
        scalePlan,
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to calculate plans:', error);
      setState((prev) => ({
        ...prev,
        error: '计算失败，请稍后重试',
        loading: false,
      }));
    }
  };

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
        scalePlan: null,
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
      });

      setDependencyTree(tree);
      setState((prev) => ({
        ...prev,
        dependencyTree: tree,
        efficiencyPlan: null,
        scalePlan: null,
      }));
    });
  };

  const activePlan = activeTab === 'efficiency' ? state.efficiencyPlan : state.scalePlan;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-4 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        模拟制造配置
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                目标产出率（个/秒）：
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={targetRate}
                onChange={(e) => setTargetRate(parseFloat(e.target.value) || 1)}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleCalculatePlans}
              disabled={state.loading || !dependencyTree}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {state.loading ? '计算中...' : '计算方案'}
            </button>
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
            />
          </div>

          {state.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {state.error}
            </div>
          )}

          {dependencyTree && (
            <div className="mb-6">
              <div className="flex border-b mb-4">
                <button
                  onClick={() => setActiveTab('efficiency')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'efficiency'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  最高效率
                </button>
                <button
                  onClick={() => setActiveTab('scale')}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === 'scale'
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  最小规模
                </button>
              </div>

              {activePlan ? (
                <PlanVisualizer plan={activePlan} itemLookup={itemLookup} />
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
