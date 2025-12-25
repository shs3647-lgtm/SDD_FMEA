# **\[상세 설계서] 지능형 관계성 매핑 PFMEA 데이터베이스 시스템**

## **1. 데이터 모델링 개요 (Data Modeling Overview)**

본 시스템은 사용자가 백지에서 텍스트를 입력하는 대신, 정의된 객체들을 \*\*'연결(Mapping)'\*\*하여 품질 리스크 인과관계를 완성하는 **Graph-based Relational Model**을 지향합니다.

## **2. DB 스키마 상세 설계 (Logical/Physical Schema)**

데이터는 크게 **\[Master]**, **\[Relation]**, **\[Transaction]** 테이블로 구분됩니다.  
**2.1. Master Tables (기초 정보 Pool)**  
모든 데이터의 근간이 되는 독립 객체 테이블입니다.  
**테이블 ID**  
**테이블명**  
**상세 필드 정의 (Type, Constraint)**  
**M\_STR**  
구조 마스터  
ID(PK), Category(Lv1:완제품, Lv2:공정, Lv3:4M), Name, Code  
**M\_FUN**  
기능/특성 마스터  
ID(PK), Type(기능, 요구사항, 제품특성, 공정특성), Description  
**M\_FAIL**  
고장 객체 마스터  
ID(PK), Type(FE, FM, FC), Description, Default\_Score(S/O/D)  
**M\_CONTROL**  
관리 수단 마스터  
ID(PK), Type(Prev, Detc), Description, Method\_Code  
**2.2. Relational Tables (관계 매핑)**  
엔지니어가 워크시트에서 확정한 상하 관계를 저장하는 핵심 테이블입니다.  
**테이블 ID**  
**테이블명**  
**상세 필드 정의 및 FK 관계**  
**R\_ST\_FUN**  
구조-기능 매핑  
REL\_ID(PK), STR\_ID(FK), FUN\_ID(FK)  
**R\_FAIL\_NET**  
고장 인과 네트워크  
NET\_ID(PK), FE\_ID(FK), FM\_ID(FK), FC\_ID(FK)  
**R\_OPTI**  
최적화 연계  
NET\_ID(FK), Prev\_Control\_ID(FK), Detc\_Control\_ID(FK)  
**2.3. Transaction Tables (PFMEA 워크시트 실시간 저장)**  
최종 완성된 FMEA 문서 정보를 담는 테이블입니다.  
**테이블 ID**  
**테이블명**  
**상세 필드 정의**  
**T\_PFMEA**  
워크시트 메인  
W\_ID(PK), NET\_ID(FK), S, O, D, AP\_Result, Special\_Char  
**T\_ACTION**  
개선 조치 내역  
W\_ID(FK), Action\_Plan, Owner, Target\_Date, Revised\_O, Revised\_D

## **3. DB 상세 정의서 (Data Dictionary)**

개발팀의 DB 생성 스크립트 작성을 위한 상세 속성 정의입니다.  
**항목**  
**물리명**  
**타입**  
**길이**  
**Null**  
**설명**  
**고유 식별자**  
OBJ\_ID  
BIGINT  
20  
N  
모든 마스터 데이터의 Global Unique ID  
**계층 번호**  
HIER\_NO  
VARCHAR  
50  
N  
예: 1.1.1 (기능-요구사항-영향 계층 표시)  
**심각도**  
SEVERITY  
INT  
2  
Y  
1~10 점수 (FE와 연결 시 필수)  
**발생도**  
OCCURRENCE  
INT  
2  
Y  
1~10 점수 (FC와 연결 시 필수)  
**검출도**  
DETECTION  
INT  
2  
Y  
1~10 점수 (DC와 연결 시 필수)  
**특성 구분**  
CHAR\_TYPE  
VARCHAR  
10  
Y  
SC(중요), CC(치명) 등 특별특성 분류

## **4. 엑셀 임포트 포맷 및 데이터 로딩 순서 (Data Loading Order)**

관계를 깨뜨리지 않고 DB를 구축하기 위한 **Sequential Import** 절차입니다.  
**Step 1: 마스터 데이터 벌크 로드 (Bulk Load)**  
**포맷**: \[구분] - \[명칭] - \[설명]  
**내용**: 시스템이 팝업으로 띄워줄 모든 '단어'를 먼저 입력합니다.  
**Step 2: 초기 관계성 로드 (Seed Mapping)**  
**포맷**: \[상위 ID] - \[하위 ID]  
**내용**: 사용자가 예시로 준 '와플 생산 공정'의 관계를 로드하여 시스템이 초기 학습을 하게 합니다.  
**Step 3: 워크시트 상호작용 (Interactive Mapping)**  
엔지니어가 화면에서 제품특성(중량)을 선택하면, DB는 R\_ST\_FUN을 조회하여 해당 공정의 중량과 연결된 FM들만 팝업 창에 표시합니다.

## **5. 시스템 아키텍처 및 알고리즘 요구사항**

**Cascading Filter Query**: 1레벨 선택 데이터가 2레벨, 3레벨 팝업 쿼리의 WHERE 절 조건으로 즉시 반영되어야 함.  
**Parent-Child Integrity**: 상위 객체(FE) 삭제 시 하위 객체(FM, FC)의 연결 정보를 유지할지, 삭제할지에 대한 **Referential Integrity** 처리 루틴 포함.  
**Knowledge Base Logic**: 동일한 FM(고장형태)에 대해 가장 빈번하게 매핑된 FC(고장원인)를 추천도 순으로 정렬하는 TOP-N Recommendation 쿼리 구현.

## **6. 결론 및 향후 계획**

본 설계서는 단순히 데이터를 저장하는 것을 넘어, **품질 지식의 관계성**을 데이터베이스화하는 데 중점을 두었습니다. 안티그래비티 개발팀은 위 스키마를 바탕으로 \*\*ERD(Entity Relationship Diagram)\*\*를 완성하고, 프론트엔드에서 **다중 선택 팝업 모듈**을 개발해야 합니다.  
**이 설계서에 누락된 특정 타이어 제조 공정만의 특수 필드나, 추가적인 제어 로직이 필요하신가요?** 필요하다면 즉시 보강하여 최종 개발 가이드를 확정하겠습니다.

