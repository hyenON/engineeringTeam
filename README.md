# Blockchain Indexer

이더리움 온체인 데이터를 수집·저장·조회하는 인덱서 서버.
지갑 주소 기반으로 ERC-20 거래내역, 토큰 잔액, 통계를 제공한다.

**Tech Stack:** TypeScript · NestJS · Prisma · PostgreSQL · Viem · Alchemy

---

## 현재 상태

**설계 단계.** 이전 구현의 코드 리뷰 피드백을 기반으로 처음부터 다시 설계 중.

이전 리뷰에서 지적된 사항:
- 도메인 레이어 오염 (Viem 타입이 usecase까지 침투)
- 의존성 방향 위반 (controller → application → service → domain ← infrastructure 규칙 미준수)
- `IRepository` god interface (책임 분리 안 됨)
- backfill / forwardfill 강결합 (독립 배포 불가)
- 비-readable한 네이밍 (`IViemClient` → `IBlockchainClient`)

→ 이번 재설계의 핵심 목표: **모듈별 독립성**과 **의존성 방향 준수**.

---

## 아키텍처

기능별 모듈(backfill / forwardfill / wallet / chain / status) 안에서
`controller → usecase → domain ← infrastructure` 의존성 방향을 강제한다.

```
src/
├── domain/                          # 공용 도메인 타입 (Block, Transaction ...)
│
├── backfill/                        # 과거 블록 소급 처리
│   ├── controller/                  # HTTP 진입점
│   ├── usecase/                     # 애플리케이션 로직
│   ├── domain/                      # 백필 전용 도메인 (인터페이스 포함)
│   └── infrastructure/              # Viem/DB 어댑터
│
├── forwardfill/                     # 실시간 블록 수집
│   ├── controller/
│   ├── usecase/
│   ├── domain/
│   └── infrastructure/
│
├── wallet/                          # 지갑 조회
│   ├── controller/
│   ├── usecase/
│   ├── domain/
│   └── infrastructure/
│
├── chain/                           # 체인 관리
│   ├── controller/
│   ├── usecase/
│   ├── domain/
│   └── infrastructure/
│
├── status/                          # 인덱서 상태 조회
│   ├── controller/
│   ├── usecase/
│   ├── domain/
│   └── infrastructure/
│
└── app.module.ts                    # DI 조립
```

**의존성 규칙:**
- 상위 레이어 → 하위 레이어: `controller → usecase → domain ← infrastructure`
- `domain`은 어떤 외부 모듈에도 의존하지 않음 (Viem, Prisma 등의 타입을 포함 X)
- `infrastructure`는 `domain`의 인터페이스를 구현하는 어댑터
- 모듈 간 직접 참조 금지 (필요 시 공용 `src/domain/`을 통하거나, usecase에서 인터페이스로 주입)

---

## 데이터 흐름 (설계 예정)

```
[과거 데이터]  POST /backfill   → BackfillController → BackfillUsecase → IBlockchainClient
[실시간 데이터] Alchemy Webhook → ForwardfillController → ForwardfillUsecase
[조회]         GET /wallets/*   → WalletController → WalletUsecase → IWalletRepository
```

---

## API 엔드포인트 (예정)

| Method | Path | 모듈 |
|--------|------|------|
| POST | `/backfill` | backfill |
| POST | `/webhook/activity` | forwardfill |
| POST | `/wallets/:address/import` | wallet |
| GET | `/wallets/:address/transactions` | wallet |
| GET | `/wallets/:address/balances` | wallet |
| GET | `/wallets/:address/stats` | wallet |
| GET | `/chains` | chain |
| POST | `/chains` | chain |
| GET | `/status` | status |
| GET | `/status/:chainId` | status |

---

## 로컬 실행 (구현 후 작성)

**사전 준비:**
- Docker Desktop
- Node.js 18+
- Alchemy API Key

---

## 문서

| 파일 | 내용 |
|------|------|
| [Notion 설계서](https://www.notion.so/4-341c782cda038053840de77625bb6d97) | 전체 설계 문서 (요구사항, ERD, API 명세) |
| [docs/test-scenarios.md](./docs/test-scenarios.md) | TDD 시나리오 Given/When/Then |
| `docs/learning-log.md` | (작성 예정) 학습 기록 |
| `docs/decisions.md` | (작성 예정) 설계 결정 (ADR) |
