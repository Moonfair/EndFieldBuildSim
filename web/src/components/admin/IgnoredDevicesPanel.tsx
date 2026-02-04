import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ignored_devices';

interface IgnoredDevicesPanelProps {
  onIgnoredDevicesChange?: (deviceIds: string[]) => void;
}

export default function IgnoredDevicesPanel({ onIgnoredDevicesChange }: IgnoredDevicesPanelProps) {
  const [availableDevices, setAvailableDevices] = useState<Array<{ id: string; name: string }>>([]);
  const [ignoredDevices, setIgnoredDevices] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadIgnoredDevices();
    loadAvailableDevices();
  }, []);

  const loadIgnoredDevices = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const deviceIds = JSON.parse(stored) as string[];
        setIgnoredDevices(new Set(deviceIds));
      }
    } catch (error) {
      console.error('Failed to load ignored devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableDevices = async () => {
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}data/recipe_database.json`);
      if (response.ok) {
        const data = await response.json();

        const deviceMap = new Map<string, string>();

        for (const recipe of Object.values(data.recipes || {})) {
          const deviceId = (recipe as any).deviceId;
          const deviceName = (recipe as any).deviceName;

          if (deviceId && deviceName && !deviceMap.has(deviceId)) {
            deviceMap.set(deviceId, deviceName);
          }
        }

        const devices = Array.from(deviceMap.entries()).map(([id, name]) => ({
          id,
          name,
        }));

        devices.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

        setAvailableDevices(devices);
      }
    } catch (error) {
      console.error('Failed to load available devices:', error);
    }
  };

  const toggleIgnoreDevice = (deviceId: string) => {
    setIgnoredDevices((prev) => {
      const newIgnored = new Set(prev);

      if (newIgnored.has(deviceId)) {
        newIgnored.delete(deviceId);
      } else {
        newIgnored.add(deviceId);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newIgnored)));
      onIgnoredDevicesChange?.(Array.from(newIgnored));

      return newIgnored;
    });
  };

  const addAllVisible = () => {
    const filteredDevices = getFilteredDevices();
    const newIgnored = new Set(ignoredDevices);

    filteredDevices.forEach((device) => {
      newIgnored.add(device.id);
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newIgnored)));
    setIgnoredDevices(newIgnored);
    onIgnoredDevicesChange?.(Array.from(newIgnored));
  };

  const removeAllVisible = () => {
    const filteredDevices = getFilteredDevices();
    const newIgnored = new Set(ignoredDevices);

    filteredDevices.forEach((device) => {
      newIgnored.delete(device.id);
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(newIgnored)));
    setIgnoredDevices(newIgnored);
    onIgnoredDevicesChange?.(Array.from(newIgnored));
  };

  const clearAll = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    setIgnoredDevices(new Set());
    onIgnoredDevicesChange?.([]);
  };

  const getFilteredDevices = () => {
    const query = searchQuery.toLowerCase();
    return availableDevices.filter((device) => {
      if (!query) return true;
      return device.name.toLowerCase().includes(query) || device.id.toLowerCase().includes(query);
    });
  };

  if (loading) {
    return <div className="text-gray-500">加载中...</div>;
  }

  const filteredDevices = getFilteredDevices();
  const visibleIgnoredCount = filteredDevices.filter((d) => ignoredDevices.has(d.id)).length;
  const visibleTotalCount = filteredDevices.length;

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">忽略设备配置</h2>
      <p className="text-gray-600 mb-6">
        忽略设备后，该设备相关的所有配方将不会出现在配方库和生产模拟器中。
      </p>

      <div className="mb-4">
        <input
          type="text"
          placeholder="搜索设备名称或ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={addAllVisible}
          disabled={visibleIgnoredCount >= visibleTotalCount}
          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          添加当前页全部
        </button>
        <button
          onClick={removeAllVisible}
          disabled={visibleIgnoredCount === 0}
          className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          移除当前页全部
        </button>
        <button
          onClick={clearAll}
          disabled={ignoredDevices.size === 0}
          className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          清空全部
        </button>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        已忽略 <span className="font-semibold text-gray-900">{ignoredDevices.size}</span> 个设备
        {searchQuery && ` (当前显示 {visibleTotalCount} 个)`}
      </div>

      <div className="border border-gray-300 rounded max-h-96 overflow-y-auto">
        {filteredDevices.length === 0 ? (
          <div className="p-4 text-center text-gray-500">未找到匹配的设备</div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="border-b border-l border-gray-300 px-4 py-2 text-left w-16">忽略</th>
                <th className="border-b border-r border-gray-300 px-4 py-2 text-left">设备名称</th>
                <th className="border-b border-r border-gray-300 px-4 py-2 text-left w-32">设备ID</th>
                <th className="border-b border-r border-gray-300 px-4 py-2 text-left w-24">配方数</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.map((device) => {
                const isIgnored = ignoredDevices.has(device.id);
                return (
                  <tr key={device.id} className={`hover:bg-gray-50 ${isIgnored ? 'bg-gray-100' : ''}`}>
                    <td className="border-b border-l border-gray-300 px-4 py-2">
                      <input
                        type="checkbox"
                        checked={isIgnored}
                        onChange={() => toggleIgnoreDevice(device.id)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className={`border-b border-gray-300 px-4 py-2 ${isIgnored ? 'text-gray-400 line-through' : ''}`}>
                      {device.name}
                    </td>
                    <td className={`border-b border-gray-300 px-4 py-2 text-sm font-mono ${isIgnored ? 'text-gray-400' : ''}`}>
                      {device.id}
                    </td>
                    <td className="border-b border-r border-gray-300 px-4 py-2 text-sm text-gray-600">
                      {device.id === '虚拟_液体模式' || device.id === '虚拟_设备制造'
                        ? (device.id === '虚拟_液体模式' ? '1' : '2')
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}