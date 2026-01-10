/**
 * DB 뷰어 - 웹 브라우저에서 DB 데이터 확인
 * @updated 2026-01-10 - 새로고침 버튼, 주요 테이블 바로가기 추가
 */
'use client';

import { useState, useEffect, useCallback } from 'react';

interface TableInfo {
  schema: string;
  table: string;
  rows: number;
}

interface DbData {
  schema: string;
  table: string;
  columns: string[];
  data: any[];
}

// 주요 FMEA 테이블 목록
const IMPORTANT_TABLES = [
  { name: 'fmea_legacy_data', label: '📦 레거시 데이터', desc: 'FMEA 전체 JSON' },
  { name: 'fmea_confirmed_states', label: '✅ 확정상태', desc: '탭별 확정' },
  { name: 'l1_structures', label: '🏭 1L 구조', desc: '완제품' },
  { name: 'l2_structures', label: '⚙️ 2L 구조', desc: '메인공정' },
  { name: 'l3_structures', label: '🔧 3L 구조', desc: '작업요소' },
  { name: 'l1_functions', label: '📋 1L 기능', desc: '완제품 기능' },
  { name: 'l2_functions', label: '📋 2L 기능', desc: '공정 기능' },
  { name: 'l3_functions', label: '📋 3L 기능', desc: '작업요소 기능' },
  { name: 'failure_effects', label: '💥 고장영향', desc: 'FE' },
  { name: 'failure_modes', label: '🔴 고장형태', desc: 'FM' },
  { name: 'failure_causes', label: '🟠 고장원인', desc: 'FC' },
  { name: 'failure_links', label: '🔗 고장연결', desc: 'FE-FM-FC' },
  { name: 'risk_analyses', label: '📊 리스크', desc: 'S/O/D/AP' },
  { name: 'pfmea_master_datasets', label: '📁 기초정보', desc: '마스터셋' },
  { name: 'pfmea_master_flat_items', label: '📄 기초항목', desc: '플랫 데이터' },
];

export default function DbViewerPage() {
  const [schemas, setSchemas] = useState<string[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string>('new_fmea');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [dbData, setDbData] = useState<DbData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // 스키마 목록 로드
  const loadSchemas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/db/schemas');
      const data = await res.json();
      if (data.success) {
        // pfmea_ 프로젝트 스키마를 상단에 정렬
        const sorted = [...data.schemas].sort((a, b) => {
          const aIsFmea = a.startsWith('pfmea_');
          const bIsFmea = b.startsWith('pfmea_');
          if (aIsFmea && !bIsFmea) return -1;
          if (!aIsFmea && bIsFmea) return 1;
          return a.localeCompare(b);
        });
        setSchemas(sorted);
        // pfmea_ 스키마 우선 선택 (프로젝트 데이터가 여기 있음)
        const fmeaSchema = sorted.find(s => s.startsWith('pfmea_'));
        if (fmeaSchema) {
          setSelectedSchema(fmeaSchema);
        } else if (data.schemas.includes('new_fmea')) {
          setSelectedSchema('new_fmea');
        } else if (sorted.length > 0) {
          setSelectedSchema(sorted[0]);
        }
      } else {
        setError(data.error || '스키마 로드 실패');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 테이블 목록 로드
  const loadTables = useCallback(async (schema: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/db/tables?schema=${encodeURIComponent(schema)}`);
      const data = await res.json();
      if (data.success) {
        setTables(data.tables);
        setLastRefresh(new Date());
      } else {
        setError(data.error || '테이블 로드 실패');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 테이블 데이터 로드
  const loadTableData = useCallback(async (schema: string, table: string) => {
    if (!schema || !table) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/db/data?schema=${encodeURIComponent(schema)}&table=${encodeURIComponent(table)}&limit=200`);
      const data = await res.json();
      if (data.success) {
        setDbData(data.result);
      } else {
        setError(data.error || '데이터 로드 실패');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 새로고침
  const handleRefresh = useCallback(() => {
    if (selectedSchema) {
      loadTables(selectedSchema);
      if (selectedTable) {
        loadTableData(selectedSchema, selectedTable);
      }
    }
  }, [selectedSchema, selectedTable, loadTables, loadTableData]);

  // 주요 테이블 바로가기 클릭
  const handleQuickSelect = useCallback((tableName: string) => {
    setSelectedTable(tableName);
  }, []);

  useEffect(() => {
    loadSchemas();
  }, [loadSchemas]);

  useEffect(() => {
    if (selectedSchema) {
      loadTables(selectedSchema);
    }
  }, [selectedSchema, loadTables]);

  useEffect(() => {
    if (selectedSchema && selectedTable) {
      loadTableData(selectedSchema, selectedTable);
    }
  }, [selectedSchema, selectedTable, loadTableData]);

  // 테이블 행 수 가져오기
  const getTableRows = (tableName: string) => {
    const found = tables.find(t => t.table === tableName);
    return found ? found.rows : 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">📊 PostgreSQL DB 뷰어</h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            🔄 새로고침
            {loading && <span className="animate-spin">⏳</span>}
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium mb-1">DB 연결 정보</label>
              <code className="block p-2 bg-gray-100 rounded text-sm">
                postgresql://postgres:postgres@localhost:5432/fmea_db
              </code>
            </div>
            {lastRefresh && (
              <div className="text-xs text-gray-500">
                마지막 갱신: {lastRefresh.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            ❌ {error}
          </div>
        )}

        {/* 주요 테이블 바로가기 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">⚡ 주요 테이블 바로가기</h2>
          <div className="flex flex-wrap gap-2">
            {IMPORTANT_TABLES.map(t => {
              const rows = getTableRows(t.name);
              const hasData = rows > 0;
              const isSelected = selectedTable === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => handleQuickSelect(t.name)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                    isSelected 
                      ? 'bg-blue-600 text-white' 
                      : hasData 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title={t.desc}
                >
                  {t.label} ({rows})
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            🟢 녹색: 데이터 있음 | ⚪ 회색: 데이터 없음 | 🔵 파란색: 선택됨
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 좌측: 스키마/테이블 선택 */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">스키마 & 테이블</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">스키마 선택</label>
              <select
                value={selectedSchema}
                onChange={(e) => setSelectedSchema(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">선택하세요</option>
                {schemas.map(schema => {
                  const isFmea = schema.startsWith('pfmea_');
                  return (
                    <option key={schema} value={schema}>
                      {isFmea ? '🔷 ' : ''}{schema}
                      {isFmea ? ' (FMEA 프로젝트)' : ''}
                    </option>
                  );
                })}
              </select>
              {selectedSchema?.startsWith('pfmea_') && (
                <div className="mt-1 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  💡 이 스키마는 FMEA 프로젝트 전용입니다. 확정상태는 <code>fmea_confirmed_states</code> 테이블에서 확인하세요.
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">테이블 선택</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="">선택하세요</option>
                {tables.map(t => (
                  <option key={t.table} value={t.table}>
                    {t.table} ({t.rows}행)
                  </option>
                ))}
              </select>
            </div>

            {/* 테이블 목록 (데이터 있는 것만) */}
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-2">📋 데이터 있는 테이블</h3>
              <div className="max-h-[300px] overflow-y-auto space-y-1">
                {tables.filter(t => t.rows > 0).map(t => (
                  <button
                    key={t.table}
                    onClick={() => setSelectedTable(t.table)}
                    className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-blue-50 ${
                      selectedTable === t.table ? 'bg-blue-100 text-blue-800' : ''
                    }`}
                  >
                    <span className="font-mono">{t.table}</span>
                    <span className="float-right text-gray-500">{t.rows}행</span>
                  </button>
                ))}
                {tables.filter(t => t.rows > 0).length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-4">
                    데이터가 있는 테이블이 없습니다
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 우측: 데이터 표시 */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                데이터: <span className="text-blue-600">{selectedSchema}.{selectedTable}</span>
                {dbData && <span className="text-sm font-normal text-gray-500 ml-2">({dbData.data.length}행)</span>}
              </h2>
              {selectedTable && (
                <button
                  onClick={() => loadTableData(selectedSchema, selectedTable)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                >
                  🔄 데이터 새로고침
                </button>
              )}
            </div>
            
            {loading && <div className="text-center py-8">⏳ 로딩 중...</div>}
            
            {!loading && !dbData && selectedTable && (
              <div className="text-center py-8 text-gray-500">
                테이블을 선택하면 데이터가 표시됩니다
              </div>
            )}
            
            {dbData && dbData.data.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                ⚠️ 이 테이블에는 데이터가 없습니다 (0행)
              </div>
            )}
            
            {dbData && dbData.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1 text-left font-semibold text-gray-400 text-xs">#</th>
                      {dbData.columns.map(col => (
                        <th key={col} className="border px-2 py-1 text-left font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dbData.data.slice(0, 100).map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'}>
                        <td className="border px-2 py-1 text-xs text-gray-400">{idx + 1}</td>
                        {dbData.columns.map(col => {
                          const value = row[col];
                          let displayValue = '';
                          let isJson = false;
                          
                          if (value === null || value === undefined) {
                            displayValue = '(NULL)';
                          } else if (typeof value === 'object') {
                            displayValue = JSON.stringify(value, null, 2);
                            isJson = true;
                          } else {
                            displayValue = String(value);
                          }
                          
                          return (
                            <td key={col} className="border px-2 py-1 text-xs break-words max-w-xs">
                              {isJson ? (
                                <details>
                                  <summary className="cursor-pointer text-blue-600">[JSON 데이터]</summary>
                                  <pre className="whitespace-pre-wrap font-mono text-[10px] mt-1 bg-gray-100 p-1 rounded max-h-40 overflow-auto">
                                    {displayValue}
                                  </pre>
                                </details>
                              ) : (
                                <span className={displayValue === '(NULL)' ? 'text-gray-400 italic' : ''}>
                                  {displayValue.length > 50 
                                    ? displayValue.substring(0, 50) + '...'
                                    : displayValue
                                  }
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dbData.data.length > 100 && (
                  <div className="mt-2 text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                    ⚠️ 최대 100행만 표시됩니다 (총 {dbData.data.length}행)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
