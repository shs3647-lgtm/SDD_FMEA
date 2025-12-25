/**
 * @file page.tsx
 * @description 메인 대시보드 페이지
 * @author AI Assistant
 * @created 2025-12-25
 * @version 1.0.0
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  return (
    <div className="p-6">
      {/* 페이지 제목 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Welcome to FMEA Smart System
      </h1>

      {/* 대시보드 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 진행 중인 FMEA */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              진행 중인 FMEA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">12</div>
            <p className="text-xs text-gray-400 mt-1">+3 이번 주</p>
          </CardContent>
        </Card>

        {/* 완료된 FMEA */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              완료된 FMEA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">48</div>
            <p className="text-xs text-gray-400 mt-1">총 48개</p>
          </CardContent>
        </Card>

        {/* 개선조치 필요 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              개선조치 필요 (AP=H)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">7</div>
            <p className="text-xs text-gray-400 mt-1">우선 조치 필요</p>
          </CardContent>
        </Card>

        {/* 이번 달 완료율 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              이번 달 완료율
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">85%</div>
            <p className="text-xs text-gray-400 mt-1">목표: 90%</p>
          </CardContent>
        </Card>
      </div>

      {/* 최근 활동 */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {[
                { time: '10분 전', action: 'P-FMEA 고장연결 저장', user: 'Kim' },
                { time: '30분 전', action: 'D-FMEA 신규 등록', user: 'Lee' },
                { time: '1시간 전', action: 'Control Plan 업데이트', user: 'Park' },
                { time: '2시간 전', action: 'PFD 엑셀 임포트', user: 'Choi' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">{activity.time}</span>
                    <span className="text-sm text-gray-700">{activity.action}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">{activity.user}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

