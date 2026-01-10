/**
 * DB 뷰어 - 웹 브라우저에서 DB 데이터 확인
 */
'use client';

import { useState, useEffect } from 'react';
import { Pool } from 'pg';

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

export default function DbViewerPage() {
  const [schemas, setSchemas] = useState<string[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [dbData, setDbData] = useState<DbData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 스키마 목록 로드
  useEffect(() => {
    loadSchemas();
  }, []);

  // 테이블 목록 로드
  useEffect(() => {
    if (selectedSchema) {
      loadTables(selectedSchema);
    }
  }, [selectedSchema]);

  const loadSchemas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/db/schemas');
      const data = await res.json();
      if (data.success) {
        setSchemas(data.schemas);
        if (data.schemas.length > 0) {
          setSelectedSchema(data.schemas[0]);
        }
      } else {
        setError(data.error || '스키마 로드 실패');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async (schema: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/db/tables?schema=${encodeURIComponent(schema)}`);
      const data = await res.json();
      if (data.success) {
        setTables(data.tables);
        if (data.tables.length > 0) {
          setSelectedTable(data.tables[0].table);
        }
      } else {
        setError(data.error || '테이블 로드 실패');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (schema: string, table: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/db/data?schema=${encodeURIComponent(schema)}&table=${encodeURIComponent(table)}`);
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
  };

  useEffect(() => {
    if (selectedSchema && selectedTable) {
      loadTableData(selectedSchema, selectedTable);
    }
  }, [selectedSchema, selectedTable]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">📊 PostgreSQL DB 뷰어</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">DB 연결 정보</label>
            <code className="block p-2 bg-gray-100 rounded text-sm">
              postgresql://postgres:postgres@localhost:5432/fmea_db
            </code>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            ❌ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                {schemas.map(schema => (
                  <option key={schema} value={schema}>{schema}</option>
                ))}
              </select>
            </div>

            <div>
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
          </div>

          {/* 우측: 데이터 표시 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4">
              데이터: {selectedSchema}.{selectedTable}
            </h2>
            
            {loading && <div className="text-center py-8">⏳ 로딩 중...</div>}
            
            {dbData && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      {dbData.columns.map(col => (
                        <th key={col} className="border px-2 py-1 text-left font-semibold">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dbData.data.slice(0, 100).map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {dbData.columns.map(col => {
                          const value = row[col];
                          let displayValue = '';
                          
                          if (value === null || value === undefined) {
                            displayValue = '(NULL)';
                          } else if (typeof value === 'object') {
                            displayValue = JSON.stringify(value, null, 2);
                          } else {
                            displayValue = String(value);
                          }
                          
                          return (
                            <td key={col} className="border px-2 py-1 text-xs break-words max-w-xs">
                              <pre className="whitespace-pre-wrap font-mono text-xs">
                                {displayValue.length > 100 
                                  ? displayValue.substring(0, 100) + '...'
                                  : displayValue
                                }
                              </pre>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dbData.data.length > 100 && (
                  <div className="mt-2 text-xs text-gray-500">
                    (최대 100행만 표시, 총 {dbData.data.length}행)
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


