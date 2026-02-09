import { useState, useEffect, useRef } from 'react';

interface FileInfo {
  path: string;
  lastModified: string | null;
  exists: boolean;
}

interface Script {
  id: string;
  name: string;
  description: string;
  files?: FileInfo[];
}

interface ScriptExecution {
  scriptId: string;
  executionId: string | null;
  status: 'idle' | 'running' | 'success' | 'error';
  output: string[];
  exitCode: number | null;
}

function ScriptCard({ 
  script, 
  execution, 
  onExecute, 
  onCancel 
}: { 
  script: Script; 
  execution?: ScriptExecution; 
  onExecute: () => void; 
  onCancel: () => void; 
}) {
  const isRunning = execution?.status === 'running';
  const isSuccess = execution?.status === 'success';
  
  const formatDate = (isoString: string | null) => {
    if (!isoString) return '未生成';
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  return (
    <div className="border rounded p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{script.name}</h3>
        <button
          onClick={isRunning ? onCancel : onExecute}
          className={`px-4 py-2 rounded ${
            isRunning 
              ? 'bg-red-500 text-white' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
          disabled={execution?.status === undefined}
        >
          {isRunning ? '停止' : '执行'}
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-2">{script.description}</p>
      
      {script.files && script.files.length > 0 && (
        <div className="text-xs text-gray-500 mb-2 space-y-1">
          <div className="font-semibold">输出文件：</div>
          {script.files.map((file, idx) => (
            <div key={idx} className="ml-2">
              <span className={file.exists ? 'text-gray-700' : 'text-gray-400'}>
                {file.path.replace('../data/', '')}
              </span>
              <span className="ml-2">
                {file.exists ? (
                  <span className="text-green-600">
                    {formatDate(file.lastModified)}
                  </span>
                ) : (
                  <span className="text-gray-400">未生成</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {execution && execution.output.length > 0 && (
        <pre className="bg-gray-100 p-2 rounded text-sm max-h-48 overflow-auto">
          {execution.output.join('\n')}
        </pre>
      )}
      {execution && execution.exitCode !== null && (
        <p className={`text-sm mt-2 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
          Exit code: {execution.exitCode}
        </p>
      )}
    </div>
  );
}

export default function ScriptsPanel() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [executions, setExecutions] = useState<Record<string, ScriptExecution>>({});
  const eventSourceRefs = useRef<Record<string, EventSource>>({});

  useEffect(() => {
    fetchScripts();
    
    return () => {
      Object.values(eventSourceRefs.current).forEach(es => es.close());
    };
  }, []);

  const fetchScripts = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/scripts');
      const data = await res.json();
      setScripts(data.scripts);
      
      // Initialize execution state
      const initial: Record<string, ScriptExecution> = {};
      data.scripts.forEach((s: Script) => {
        initial[s.id] = { 
          scriptId: s.id, 
          executionId: null, 
          status: 'idle', 
          output: [], 
          exitCode: null 
        };
      });
      setExecutions(initial);
    } catch (error) {
      console.error('Failed to fetch scripts:', error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const executeScript = (scriptId: string) => {
    setExecutions(prev => ({
      ...prev,
      [scriptId]: { ...prev[scriptId], status: 'running', output: [], exitCode: null }
    }));

    const eventSource = new EventSource(
      `http://localhost:3001/api/scripts/${scriptId}/execute`
    );
    eventSourceRefs.current[scriptId] = eventSource;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'start') {
        setExecutions(prev => ({
          ...prev,
          [scriptId]: { ...prev[scriptId], executionId: data.executionId }
        }));
      } else if (data.type === 'stdout' || data.type === 'stderr') {
        setExecutions(prev => ({
          ...prev,
          [scriptId]: { 
            ...prev[scriptId], 
            output: [...prev[scriptId].output, data.data]
          }
        }));
      } else if (data.type === 'done') {
        setExecutions(prev => ({
          ...prev,
          [scriptId]: { 
            ...prev[scriptId], 
            status: data.exitCode === 0 ? 'success' : 'error',
            exitCode: data.exitCode
          }
        }));
        eventSource.close();
        delete eventSourceRefs.current[scriptId];
      }
    };

    eventSource.onerror = () => {
      setExecutions(prev => ({
        ...prev,
        [scriptId]: { ...prev[scriptId], status: 'error' }
      }));
      eventSource.close();
      delete eventSourceRefs.current[scriptId];
    };
  };

  const cancelScript = async (scriptId: string) => {
    const execution = executions[scriptId];
    if (execution?.executionId) {
      await fetch(`http://localhost:3001/api/scripts/cancel/${execution.executionId}`, {
        method: 'POST'
      });
    }
    
    if (eventSourceRefs.current[scriptId]) {
      eventSourceRefs.current[scriptId].close();
      delete eventSourceRefs.current[scriptId];
    }
    
    setExecutions(prev => ({
      ...prev,
      [scriptId]: { ...prev[scriptId], status: 'idle', executionId: null }
    }));
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">脚本执行</h2>
      <p className="text-gray-600 mb-4 text-sm">
        执行数据收集脚本。建议按顺序执行：目录 → 详情 → 合成表 → 生产表
      </p>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="space-y-4">
          {scripts.map(script => (
            <ScriptCard 
              key={script.id}
              script={script}
              execution={executions[script.id]}
              onExecute={() => executeScript(script.id)}
              onCancel={() => cancelScript(script.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}