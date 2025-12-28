/**
 * 사용자 정보 데이터베이스 (LocalStorage)
 * @ref C:\01_Next_FMEA\packages\core\user-info-db.ts
 */

import { UserInfo, USER_STORAGE_KEY } from '@/types/user';

// UUID 생성
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 전체 사용자 조회
export function getAllUsers(): UserInfo[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(USER_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// 사용자 생성
export function createUser(user: Omit<UserInfo, 'id' | 'createdAt' | 'updatedAt'>): UserInfo {
  const now = new Date().toISOString();
  const newUser: UserInfo = {
    id: generateUUID(),
    ...user,
    createdAt: now,
    updatedAt: now,
  };
  const users = getAllUsers();
  users.push(newUser);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  console.log(`✅ 사용자 생성 완료: ${user.name}`);
  return newUser;
}

// 사용자 수정
export function updateUser(id: string, updates: Partial<Omit<UserInfo, 'id' | 'createdAt'>>): void {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === id);
  if (index !== -1) {
    users[index] = {
      ...users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
    console.log(`✅ 사용자 수정 완료: ID ${id}`);
  }
}

// 사용자 삭제
export function deleteUser(id: string): void {
  const users = getAllUsers().filter(u => u.id !== id);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  console.log(`✅ 사용자 삭제 완료: ID ${id}`);
}

// 이메일로 사용자 조회
export function getUserByEmail(email: string): UserInfo | undefined {
  return getAllUsers().find(u => u.email === email);
}

// 샘플 사용자 데이터 생성
export function createSampleUsers(): void {
  if (getAllUsers().length >= 10) {
    console.log('ℹ️ 샘플 사용자 이미 존재 (10명 이상)');
    return;
  }

  const sampleUsers: Omit<UserInfo, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { factory: '울산공장', department: '품질보증팀', name: '김철수', position: '차장', phone: '010-1234-5678', email: 'kim.cs@example.com', remark: 'FMEA 담당' },
    { factory: '서울공장', department: '생산기술팀', name: '이영희', position: '과장', phone: '010-2345-6789', email: 'lee.yh@example.com', remark: 'CP 담당' },
    { factory: '부산공장', department: '품질관리팀', name: '박민수', position: '대리', phone: '010-3456-7890', email: 'park.ms@example.com', remark: 'PFD 담당' },
    { factory: '울산공장', department: '공정개선팀', name: '최지원', position: '사원', phone: '010-4567-8901', email: 'choi.jw@example.com', remark: 'WS 담당' },
    { factory: '서울공장', department: '프로젝트팀', name: '정수연', position: '부장', phone: '010-5678-9012', email: 'jung.sy@example.com', remark: 'PM 담당' },
    { factory: '부산공장', department: '설계팀', name: '강동훈', position: '차장', phone: '010-6789-0123', email: 'kang.dh@example.com', remark: '설계 검증' },
    { factory: '울산공장', department: '제조팀', name: '윤서아', position: '과장', phone: '010-7890-1234', email: 'yoon.sa@example.com', remark: '제조 공정' },
    { factory: '서울공장', department: 'R&D팀', name: '한지민', position: '선임', phone: '010-8901-2345', email: 'han.jm@example.com', remark: '연구개발' },
    { factory: '부산공장', department: '구매팀', name: '송민호', position: '대리', phone: '010-9012-3456', email: 'song.mh@example.com', remark: '자재 구매' },
    { factory: '울산공장', department: '안전환경팀', name: '임하늘', position: '사원', phone: '010-0123-4567', email: 'lim.hn@example.com', remark: '안전 관리' },
  ];

  console.log('🔄 샘플 사용자 데이터 생성 시작...');
  let createdCount = 0;

  for (const user of sampleUsers) {
    const existing = getUserByEmail(user.email);
    if (!existing) {
      createUser(user);
      createdCount++;
    }
  }

  console.log(`✅ 샘플 사용자 데이터 생성 완료 (${createdCount}명)`);
}





