/**
 * 기초정보 데이터베이스 (LocalStorage)
 * @ref C:\01_Next_FMEA\packages\core\master-data-db.ts
 */

import { 
  BizInfoCustomer, 
  BizInfoProduct, 
  BizInfoFactory,
  BizInfoProject,
  BIZINFO_STORAGE_KEYS 
} from '@/types/bizinfo';

// UUID 생성
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ========== 프로젝트 기초정보 CRUD (통합) ==========
export function getAllProjects(): BizInfoProject[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(BIZINFO_STORAGE_KEYS.projects);
  return data ? JSON.parse(data) : [];
}

export function createProject(project: Omit<BizInfoProject, 'id' | 'createdAt' | 'updatedAt'>): BizInfoProject {
  const now = new Date().toISOString();
  const newProject: BizInfoProject = {
    id: generateUUID(),
    ...project,
    createdAt: now,
    updatedAt: now,
  };
  const projects = getAllProjects();
  projects.push(newProject);
  localStorage.setItem(BIZINFO_STORAGE_KEYS.projects, JSON.stringify(projects));
  return newProject;
}

export function deleteProject(id: string): void {
  const projects = getAllProjects().filter(p => p.id !== id);
  localStorage.setItem(BIZINFO_STORAGE_KEYS.projects, JSON.stringify(projects));
}

// 프로젝트 저장 (신규 또는 수정)
export function saveProject(project: BizInfoProject): BizInfoProject {
  const now = new Date().toISOString();
  const projects = getAllProjects();
  const existingIndex = projects.findIndex(p => p.id === project.id);
  
  if (existingIndex >= 0) {
    // 수정
    projects[existingIndex] = { ...project, updatedAt: now };
  } else {
    // 신규
    projects.push({ ...project, createdAt: now, updatedAt: now });
  }
  
  localStorage.setItem(BIZINFO_STORAGE_KEYS.projects, JSON.stringify(projects));
  return project;
}

// 샘플 프로젝트 기초정보 생성 (10개)
export function createSampleProjects(): void {
  if (getAllProjects().length > 0) {
    console.log('ℹ️ 프로젝트 기초정보 이미 존재');
    return;
  }

  const sampleProjects: Omit<BizInfoProject, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { customerName: '현대자동차', customerCode: 'HMC', factory: '울산공장', modelYear: 'MY2025', program: 'NE1', productName: '도어패널', partNo: 'DP-001' },
    { customerName: '현대자동차', customerCode: 'HMC', factory: '아산공장', modelYear: 'MY2025', program: 'NE2', productName: '후드', partNo: 'HD-002' },
    { customerName: '현대자동차', customerCode: 'HMC', factory: '전주공장', modelYear: 'MY2024', program: 'NE3', productName: '트렁크리드', partNo: 'TL-003' },
    { customerName: '기아자동차', customerCode: 'KIA', factory: '광주공장', modelYear: 'MY2024', program: 'SP2i', productName: '범퍼', partNo: 'BP-004' },
    { customerName: '기아자동차', customerCode: 'KIA', factory: '화성공장', modelYear: 'MY2025', program: 'EV6', productName: '펜더', partNo: 'FD-005' },
    { customerName: '기아자동차', customerCode: 'KIA', factory: '소하리공장', modelYear: 'MY2025', program: 'EV9', productName: '사이드패널', partNo: 'SP-006' },
    { customerName: 'GM대우', customerCode: 'GMD', factory: '부평공장', modelYear: 'MY2024', program: 'X1', productName: '사이드미러', partNo: 'SM-007' },
    { customerName: '르노삼성', customerCode: 'RSM', factory: '부산공장', modelYear: 'MY2025', program: 'XM3', productName: '테일게이트', partNo: 'TG-008' },
    { customerName: '쌍용자동차', customerCode: 'SYM', factory: '평택공장', modelYear: 'MY2024', program: 'J100', productName: '루프패널', partNo: 'RP-009' },
    { customerName: 'TESLA', customerCode: 'TSL', factory: '상하이공장', modelYear: 'MY2025', program: 'Model3', productName: '배터리케이스', partNo: 'BC-010' },
  ];

  sampleProjects.forEach(p => createProject(p));
  console.log('✅ 프로젝트 기초정보 샘플 데이터 생성 완료 (10개)');
}

// ========== 고객 CRUD ==========
export function getAllCustomers(): BizInfoCustomer[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(BIZINFO_STORAGE_KEYS.customers);
  return data ? JSON.parse(data) : [];
}

export function createCustomer(customer: Omit<BizInfoCustomer, 'id' | 'createdAt' | 'updatedAt'>): BizInfoCustomer {
  const now = new Date().toISOString();
  const newCustomer: BizInfoCustomer = {
    id: generateUUID(),
    ...customer,
    createdAt: now,
    updatedAt: now,
  };
  const customers = getAllCustomers();
  customers.push(newCustomer);
  localStorage.setItem(BIZINFO_STORAGE_KEYS.customers, JSON.stringify(customers));
  return newCustomer;
}

export function deleteCustomer(id: string): void {
  const customers = getAllCustomers().filter(c => c.id !== id);
  localStorage.setItem(BIZINFO_STORAGE_KEYS.customers, JSON.stringify(customers));
}

// ========== 품명 CRUD ==========
export function getAllProducts(): BizInfoProduct[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(BIZINFO_STORAGE_KEYS.products);
  return data ? JSON.parse(data) : [];
}

export function createProduct(product: Omit<BizInfoProduct, 'id' | 'createdAt' | 'updatedAt'>): BizInfoProduct {
  const now = new Date().toISOString();
  const newProduct: BizInfoProduct = {
    id: generateUUID(),
    ...product,
    createdAt: now,
    updatedAt: now,
  };
  const products = getAllProducts();
  products.push(newProduct);
  localStorage.setItem(BIZINFO_STORAGE_KEYS.products, JSON.stringify(products));
  return newProduct;
}

export function deleteProduct(id: string): void {
  const products = getAllProducts().filter(p => p.id !== id);
  localStorage.setItem(BIZINFO_STORAGE_KEYS.products, JSON.stringify(products));
}

// ========== 공장 CRUD ==========
export function getAllFactories(): BizInfoFactory[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(BIZINFO_STORAGE_KEYS.factories);
  return data ? JSON.parse(data) : [];
}

export function createFactory(factory: Omit<BizInfoFactory, 'id' | 'createdAt' | 'updatedAt'>): BizInfoFactory {
  const now = new Date().toISOString();
  const newFactory: BizInfoFactory = {
    id: generateUUID(),
    ...factory,
    createdAt: now,
    updatedAt: now,
  };
  const factories = getAllFactories();
  factories.push(newFactory);
  localStorage.setItem(BIZINFO_STORAGE_KEYS.factories, JSON.stringify(factories));
  return newFactory;
}

export function deleteFactory(id: string): void {
  const factories = getAllFactories().filter(f => f.id !== id);
  localStorage.setItem(BIZINFO_STORAGE_KEYS.factories, JSON.stringify(factories));
}

// ========== 샘플 데이터 생성 ==========
export function createSampleBizInfo(): void {
  // 고객 샘플
  if (getAllCustomers().length === 0) {
    const sampleCustomers = [
      { name: '현대자동차', code: 'HMC', factory: '울산공장' },
      { name: '기아자동차', code: 'KIA', factory: '광주공장' },
      { name: 'GM대우', code: 'GMD', factory: '부평공장' },
      { name: '르노삼성', code: 'RSM', factory: '부산공장' },
      { name: '쌍용자동차', code: 'SYM', factory: '평택공장' },
    ];
    sampleCustomers.forEach(c => createCustomer(c));
    console.log('✅ 고객 샘플 데이터 생성 완료');
  }

  // 품명 샘플
  if (getAllProducts().length === 0) {
    const sampleProducts = [
      { name: '도어패널', partNo: 'DP-001', description: '차량 도어 패널' },
      { name: '후드', partNo: 'HD-002', description: '차량 후드' },
      { name: '범퍼', partNo: 'BP-003', description: '전/후방 범퍼' },
      { name: '펜더', partNo: 'FD-004', description: '차량 펜더' },
      { name: '사이드미러', partNo: 'SM-005', description: '좌/우 사이드미러' },
    ];
    sampleProducts.forEach(p => createProduct(p));
    console.log('✅ 품명 샘플 데이터 생성 완료');
  }

  // 공장 샘플
  if (getAllFactories().length === 0) {
    const sampleFactories = [
      { name: '울산공장', code: 'ULSAN', address: '울산광역시 북구 양정동' },
      { name: '서울공장', code: 'SEOUL', address: '서울특별시 강남구 역삼동' },
      { name: '부산공장', code: 'BUSAN', address: '부산광역시 강서구 녹산동' },
      { name: '광주공장', code: 'GWANGJU', address: '광주광역시 광산구 하남동' },
      { name: '아산공장', code: 'ASAN', address: '충청남도 아산시 인주면' },
    ];
    sampleFactories.forEach(f => createFactory(f));
    console.log('✅ 공장 샘플 데이터 생성 완료');
  }
}

