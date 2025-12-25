/**
 * @file CommonItemManager.tsx
 * @description 공통 기초정보 관리 컴포넌트 (추가/수정/삭제 가능)
 * @author AI Assistant
 * @created 2025-12-26
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit2, Trash2, Save } from 'lucide-react';
import { CommonItem, CommonCategory, COMMON_CATEGORIES } from './types';

interface CommonItemManagerProps {
  items: CommonItem[];
  onItemsChange: (items: CommonItem[]) => void;
  includeCommon: boolean;
  onIncludeCommonChange: (value: boolean) => void;
}

export default function CommonItemManager({
  items,
  onItemsChange,
  includeCommon,
  onIncludeCommonChange,
}: CommonItemManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CommonItem | null>(null);
  const [formData, setFormData] = useState({
    category: 'MN' as CommonCategory,
    name: '',
    description: '',
    failureCauses: '',
  });

  // 모달 열기 (신규/수정)
  const openModal = (item?: CommonItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        category: item.category,
        name: item.name,
        description: item.description || '',
        failureCauses: (item.failureCauses || []).join(', '),
      });
    } else {
      setEditingItem(null);
      setFormData({ category: 'MN', name: '', description: '', failureCauses: '' });
    }
    setIsModalOpen(true);
  };

  // 저장
  const handleSave = () => {
    const newItem: CommonItem = {
      id: editingItem?.id || `${formData.category}${Date.now()}`,
      category: formData.category,
      categoryName: COMMON_CATEGORIES.find(c => c.code === formData.category)?.name || '',
      name: formData.name,
      description: formData.description,
      failureCauses: formData.failureCauses.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (editingItem) {
      onItemsChange(items.map(i => i.id === editingItem.id ? newItem : i));
    } else {
      onItemsChange([...items, newItem]);
    }
    setIsModalOpen(false);
  };

  // 삭제
  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      onItemsChange(items.filter(i => i.id !== id));
    }
  };

  // 카테고리별 그룹핑
  const groupedItems = COMMON_CATEGORIES.reduce((acc, cat) => {
    acc[cat.code] = items.filter(i => i.category === cat.code);
    return acc;
  }, {} as Record<CommonCategory, CommonItem[]>);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#00587a]">
          🔄 공통 기초정보 (추가/수정/삭제 가능)
        </h2>
        <Button size="sm" onClick={() => openModal()} className="bg-[#00587a] hover:bg-[#004560]">
          <Plus className="h-4 w-4 mr-1" />
          항목 추가
        </Button>
      </div>

      {/* 카테고리별 항목 표시 */}
      <div className="space-y-3 max-h-[250px] overflow-y-auto">
        {COMMON_CATEGORIES.map(cat => {
          const catItems = groupedItems[cat.code] || [];
          if (catItems.length === 0) return null;
          
          return (
            <div key={cat.code} className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${cat.color} text-white text-xs`}>{cat.code}</Badge>
                <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                <span className="text-xs text-gray-400">({catItems.length}개)</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {catItems.map(item => (
                  <div
                    key={item.id}
                    className="group flex items-center gap-1 px-2 py-1 bg-gray-50 border rounded text-xs hover:bg-gray-100"
                  >
                    <span title={item.description}>{item.name}</span>
                    <button
                      onClick={() => openModal(item)}
                      className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 공통 포함 체크박스 */}
      <div className="mt-4 pt-3 border-t flex items-center gap-2">
        <input
          type="checkbox"
          id="includeCommon"
          checked={includeCommon}
          onChange={(e) => onIncludeCommonChange(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="includeCommon" className="text-sm text-gray-600">
          공통 항목을 모든 공정에 자동 포함 ({items.length}개 항목)
        </label>
      </div>

      {/* 추가/수정 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? '공통 항목 수정' : '공통 항목 추가'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">카테고리</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v as CommonCategory })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_CATEGORIES.map(cat => (
                    <SelectItem key={cat.code} value={cat.code}>
                      <div className="flex items-center gap-2">
                        <Badge className={`${cat.color} text-white text-xs`}>{cat.code}</Badge>
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">항목명 *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 작업자, 온도, 그리이스..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">설명</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="항목에 대한 간단한 설명"
              />
            </div>

            <div>
              <label className="text-sm font-medium">관련 고장원인 (콤마로 구분)</label>
              <Input
                value={formData.failureCauses}
                onChange={(e) => setFormData({ ...formData, failureCauses: e.target.value })}
                placeholder="예: 작업표준서 미준수, 교육 부족, 작업 실수"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>취소</Button>
            <Button onClick={handleSave} disabled={!formData.name} className="bg-[#00587a] hover:bg-[#004560]">
              <Save className="h-4 w-4 mr-1" />
              {editingItem ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

