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

// 주요 FMEA 테이블 목록 (새 DB 구조 반영)
const IMPORTANT_TABLES = [
  // ===== 공용 (public) =====
  { name: 'fmea_projects', label: '🗂️ 프로젝트 리스트', desc: '공용: 전체 프로젝트 목록', scope: 'public' },
  { name: 'fmea_registrations', label: '📝 FMEA 기초정보', desc: '공용: 1단계 등록 정보 (고객사, 차종 등)', scope: 'public' },
  { name: 'fmea_cft_members', label: '👥 CFT 멤버', desc: '공용: 프로젝트별 CFT 팀원', scope: 'public' },
  { name: 'apqp_projects', label: '📜 개정이력(APQP)', desc: '공용: 프로젝트 개정 관리 이력', scope: 'public' },
  { name: 'users', label: '👤 사용자 마스터', desc: '공용: 전체 사용자 정보', scope: 'public' },
  { name: 'pfmea_master_datasets', label: '📁 기초정보 마스터', desc: '공용: Import된 마스터셋', scope: 'public' },
  { name: 'fmea_confirmed_states', label: '✅ 확정 상태', desc: '공용: 탭별 확정 상태 이력', scope: 'public' },
  
  // ===== 프로젝트별: 구조분석 (pfmea_...) =====
  { name: 'l1_structures', label: '🏭 1L 구조', desc: '프로젝트: 완제품 구조', scope: 'project' },
  { name: 'l2_structures', label: '⚙️ 2L 구조', desc: '프로젝트: 메인공정 구조', scope: 'project' },
  { name: 'l3_structures', label: '🔧 3L 구조', desc: '프로젝트: 작업요소 구조', scope: 'project' },
  
  // ===== 프로젝트별: 기능분석 (pfmea_...) =====
  { name: 'l1_functions', label: '🎯 1L 기능', desc: '프로젝트: 완제품 기능/요구사항', scope: 'project' },
  { name: 'l2_functions', label: '🎯 2L 기능', desc: '프로젝트: 메인공정 기능/제품특성', scope: 'project' },
  { name: 'l3_functions', label: '🎯 3L 기능', desc: '프로젝트: 작업요소 기능/공정특성', scope: 'project' },
  
  // ===== 프로젝트별: 고장분석 (pfmea_...) =====
  { name: 'failure_effects', label: '💥 고장영향(FE)', desc: '프로젝트: 1L 고장영향 (Severity)', scope: 'project' },
  { name: 'failure_modes', label: '⚠️ 고장형태(FM)', desc: '프로젝트: 2L 고장형태', scope: 'project' },
  { name: 'failure_causes', label: '🔍 고장원인(FC)', desc: '프로젝트: 3L 고장원인 (Occurrence)', scope: 'project' },
  { name: 'failure_links', label: '🔗 고장연결', desc: '프로젝트: FM-FE-FC 연결 관계', scope: 'project' },
  { name: 'failure_analyses', label: '🧩 고장분석(통합)', desc: '프로젝트: All화면용 통합 데이터', scope: 'project' },
  
  // ===== 프로젝트별: 리스크/최적화 (pfmea_...) =====
  { name: 'risk_analyses', label: '📊 리스크 분석', desc: '프로젝트: RPN 계산 결과', scope: 'project' },
  { name: 'optimizations', label: '🛠️ 최적화', desc: '프로젝트: 개선 조치 사항', scope: 'project' },
  
  // ===== 프로젝트별: 백업 (pfmea_...) =====
  { name: 'fmea_legacy_data', label: '📦 전체JSON 백업', desc: '프로젝트: 무결성 보장용 전체 JSON', scope: 'project' },
  
  // ===== 공용: 습득교훈 (Lessons Learned) =====
  { name: 'lessons_learned', label: '📚 습득교훈(LLD)', desc: '공용: FMEA 습득교훈 데이터', scope: 'public' },
  
  // ===== 공용: Control Plan =====
  { name: 'control_plans', label: '📋 CP 헤더', desc: '공용: Control Plan 목록', scope: 'public' },
  { name: 'control_plan_items', label: '📝 CP 항목', desc: '공용: Control Plan 행 데이터', scope: 'public' },
  { name: 'sync_logs', label: '🔄 동기화 로그', desc: '공용: FMEA-CP 동기화 이력', scope: 'public' },
];

export default function DbViewerPage() {
  const [schemas, setSchemas] = useState<string[]>([]);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<string>('public');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [dbData, setDbData] = useState<DbData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [pendingTable, setPendingTable] = useState<string | null>(null);  // 스키마 변경 후 선택할 테이블

  // 스키마 목록 로드
  const loadSchemas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/db/schemas');
      const data = await res.json();
      if (data.success) {
        // public 스키마를 최상단에, 그 다음 pfmea_ 스키마, 나머지 순
        const sorted = [...data.schemas].sort((a, b) => {
          if (a === 'public') return -1;
          if (b === 'public') return 1;
          const aIsFmea = a.startsWith('pfmea_');
          const bIsFmea = b.startsWith('pfmea_');
          if (aIsFmea && !bIsFmea) return -1;
          if (!aIsFmea && bIsFmea) return 1;
          return a.localeCompare(b);
        });
        setSchemas(sorted);
        // ✅ public 스키마 우선 선택 (Prisma 데이터가 여기 있음)
        if (data.schemas.includes('public')) {
          setSelectedSchema('public');
        } else {
          const fmeaSchema = sorted.find(s => s.startsWith('pfmea_'));
          if (fmeaSchema) {
            setSelectedSchema(fmeaSchema);
          } else if (sorted.length > 0) {
            setSelectedSchema(sorted[0]);
          }
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
    const tableInfo = IMPORTANT_TABLES.find(t => t.name === tableName);
    if (!tableInfo) {
      setSelectedTable(tableName);
      return;
    }
    
    // 프로젝트별 테이블인 경우, pfmea_ 스키마를 찾아서 선택
    if (tableInfo.scope === 'project') {
      const projectSchema = schemas.find(s => s.startsWith('pfmea_'));
      if (projectSchema) {
        if (selectedSchema !== projectSchema) {
          setSelectedSchema(projectSchema);
          setPendingTable(tableName);  // 스키마 변경 후 테이블 선택
        } else {
          setSelectedTable(tableName);
        }
      } else {
        setError('프로젝트 스키마(pfmea_...)를 찾을 수 없습니다.');
      }
    } else {
      // 공용 테이블인 경우
      if (selectedSchema !== 'public') {
        setSelectedSchema('public');
        setPendingTable(tableName);  // 스키마 변경 후 테이블 선택
      } else {
        setSelectedTable(tableName);
      }
    }
  }, [schemas, selectedSchema]);

  useEffect(() => {
    loadSchemas();
  }, [loadSchemas]);

  useEffect(() => {
    if (selectedSchema) {
      loadTables(selectedSchema);
    }
  }, [selectedSchema, loadTables]);

  // 스키마 변경 후 테이블 로드 완료 시 pending 테이블 선택
  useEffect(() => {
    if (pendingTable && tables.length > 0) {
      const tableExists = tables.some(t => t.table === pendingTable);
      if (tableExists) {
        setSelectedTable(pendingTable);
        setPendingTable(null);
      }
    }
  }, [pendingTable, tables]);

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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">⚡ 주요 테이블 바로가기</h2>
            {selectedSchema.startsWith('pfmea_') && (
              <span className="text-xs text-blue-600 font-medium">
                📂 현재 선택: {selectedSchema.replace('pfmea_', '')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {IMPORTANT_TABLES.map(t => {
              const rows = getTableRows(t.name);
              const isSelected = selectedTable === t.name;
              const isScopeMatch = (t.scope === 'public' && selectedSchema === 'public') || 
                                  (t.scope === 'project' && selectedSchema.startsWith('pfmea_'));
              const hasData = rows > 0;
              
              // 프로젝트별 테이블의 경우, 현재 선택된 스키마가 프로젝트 스키마일 때만 활성화
              const isActive = isScopeMatch;
              
              return (
                <button
                  key={t.name}
                  onClick={() => handleQuickSelect(t.name)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-all border ${
                    isSelected 
                      ? 'bg-blue-600 text-white border-blue-700 shadow-inner scale-95' 
                      : !isActive
                        ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                        : hasData 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-300' 
                          : 'bg-white text-gray-500 hover:bg-gray-100 border-gray-300'
                  }`}
                  title={!isActive 
                    ? `이 테이블은 ${t.scope === 'public' ? '공용(public)' : '프로젝트(pfmea_...)'} 스키마에 있습니다. ${t.scope === 'project' ? '프로젝트 스키마를 선택하세요.' : 'public 스키마를 선택하세요.'}` 
                    : `${t.desc}${t.scope === 'project' ? ` (${selectedSchema})` : ''}`}
                  disabled={!isActive && !isSelected}
                >
                  {t.label} ({rows})
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            🟢 녹색: 데이터 있음 | ⚪ 회색: 데이터 없음 | 🔵 파란색: 선택됨
            {selectedSchema.startsWith('pfmea_') && (
              <span className="ml-2 text-blue-600">
                ※ 프로젝트별 테이블은 현재 선택된 프로젝트 스키마의 데이터만 표시됩니다
              </span>
            )}
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
                className="w-full px-3 py-2 border rounded font-bold text-blue-700"
              >
                <option value="">선택하세요</option>
                {schemas.map(schema => {
                  const isFmea = schema.startsWith('pfmea_');
                  const isPublic = schema === 'public';
                  return (
                    <option key={schema} value={schema}>
                      {isPublic ? '⭐ public (공용)' : isFmea ? `📂 ${schema}` : schema}
                    </option>
                  );
                })}
              </select>
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-800">
                <strong>💡 중요 안내:</strong><br/>
                • <strong>공용(public)</strong>: 프로젝트 리스트, 사용자, 기초정보 마스터 저장<br/>
                • <strong>프로젝트(pfmea_...)</strong>: 개별 FMEA 워크시트(구조/기능/고장분석) 저장<br/>
                <span className="text-red-600 font-bold">※ 구조분석 데이터를 보려면 해당 프로젝트 스키마를 선택하세요!</span>
              </div>
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
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">⚠️ 이 테이블에는 데이터가 없습니다 (0행)</div>
                {selectedSchema.startsWith('pfmea_') && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-left text-sm">
                    <div className="font-bold text-yellow-800 mb-2">💡 데이터가 없는 이유:</div>
                    <ul className="list-disc list-inside text-yellow-700 space-y-1">
                      <li><strong>구조분석 미확정</strong>: 워크시트에서 "확정" 버튼을 클릭해야 DB에 저장됩니다</li>
                      <li><strong>저장 오류</strong>: 브라우저 콘솔(F12)에서 오류 메시지를 확인하세요</li>
                      <li><strong>레거시 데이터 확인</strong>: <code className="bg-gray-200 px-1 rounded">public.fmea_legacy_data</code> 테이블에 JSON 백업이 있는지 확인하세요</li>
                    </ul>
                    <div className="mt-3 text-xs text-gray-600">
                      ※ 원자성 테이블(l1/l2/l3_structures 등)은 확정 시에만 저장됩니다.<br/>
                      ※ fmea_legacy_data에 데이터가 있으면 저장은 정상이며, 원자성 변환만 실패한 것입니다.
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* 레거시 데이터 요약 (fmea_legacy_data 선택 시) */}
            {dbData && dbData.data.length > 0 && selectedTable === 'fmea_legacy_data' && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
                <h3 className="font-bold text-green-800 mb-2">📦 레거시 데이터 요약</h3>
                {dbData.data.map((row: any, idx: number) => {
                  const ld = row.data || row.legacy_data || row.legacyData;
                  if (!ld) return null;
                  return (
                    <div key={idx} className="mb-2 p-2 bg-white rounded border text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div><strong>FMEA ID:</strong> {row.fmeaId || row.fmea_id}</div>
                        <div><strong>완제품명 (L1):</strong> {ld.l1?.name || '(없음)'}</div>
                        <div><strong>공정 개수 (L2):</strong> {ld.l2?.length || 0}개</div>
                        <div><strong>작업요소 총계 (L3):</strong> {ld.l2?.reduce((acc: number, p: any) => acc + (p.l3?.length || 0), 0) || 0}개</div>
                        <div><strong>고장영향 (FE):</strong> {ld.l1?.failureScopes?.length || 0}개</div>
                        <div><strong>고장형태 (FM):</strong> {ld.l2?.reduce((acc: number, p: any) => acc + (p.failureModes?.length || 0), 0) || 0}개</div>
                        <div><strong>고장원인 (FC):</strong> {ld.l2?.reduce((acc: number, p: any) => acc + (p.failureCauses?.length || 0), 0) || 0}개</div>
                        <div><strong>고장연결:</strong> {ld.failureLinks?.length || 0}건</div>
                        <div><strong>리스크 분석 (riskData):</strong> {Object.keys(ld.riskData || {}).length}개</div>
                      </div>
                      {Object.keys(ld.riskData || {}).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-purple-600 text-xs">📊 riskData 키 보기</summary>
                          <div className="mt-1 text-xs bg-purple-50 p-2 rounded font-mono max-h-32 overflow-y-auto">
                            {Object.keys(ld.riskData || {}).slice(0, 20).map((key: string, i: number) => (
                              <div key={i} className="flex gap-2">
                                <span className="text-gray-600">{key}:</span>
                                <span className="text-purple-700">{String(ld.riskData[key])}</span>
                              </div>
                            ))}
                            {Object.keys(ld.riskData || {}).length > 20 && (
                              <div className="text-gray-400">... 외 {Object.keys(ld.riskData || {}).length - 20}개</div>
                            )}
                          </div>
                        </details>
                      )}
                      {ld.l2?.length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-blue-600 text-xs">📋 공정 목록 보기</summary>
                          <div className="mt-1 text-xs bg-gray-50 p-2 rounded">
                            {ld.l2.map((p: any, i: number) => (
                              <div key={i} className="flex gap-2 border-b py-1">
                                <span className="font-mono text-gray-500">{p.no}</span>
                                <span>{p.name}</span>
                                <span className="text-gray-400">({p.l3?.length || 0} 작업요소)</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
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
