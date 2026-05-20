# AGENTS.md

Claude Code, Codex 등 코딩 에이전트가 이 레포에서 작업할 때 따를 규칙.

## 0. 시작 전 필수

코드 작업 전에 [docs/design.md](./docs/design.md) 의 관련 섹션을 먼저 읽는다.

- 설계 정본은 `docs/design.md`
- 노션 페이지는 회의용 미러 (참고만)

---

## 1. 아키텍처 (절대 규칙)

### 1.1 폴더 구조

모든 기능 모듈은 4-layer 로 구성:

```
src/<module>/
├── controller/        # HTTP 진입점
├── usecase/           # 애플리케이션 로직
├── domain/            # 인터페이스 + 도메인 타입 (외부 의존 0)
└── infrastructure/    # domain 인터페이스 구현체 (Viem, Prisma 등)
```

기능 모듈: `backfill`, `forwardfill`, `wallet`, `chain`, `status`.

공용 도메인 타입은 `src/domain/` 에 위치.

### 1.2 의존성 방향

```
controller → usecase → domain ← infrastructure
```

- 위 방향을 거스르는 import 금지
- `usecase` 는 `infrastructure` 를 **직접 import 금지** (DI 로만 주입)
- `domain/` 폴더는 Viem, Prisma, NestJS 등 외부 라이브러리 import 금지 — 순수 타입과 인터페이스만
- 모듈 간 직접 참조 금지 — 공용 `src/domain/` 또는 DI 로 인터페이스 주입

### 1.3 인터페이스 분리 (ISP)

god interface 금지. 책임별로 쪼갠다.

- `IBackfillRepository`, `IWalletRepository`, `ISyncStatusRepository`, `IChainRepository` 처럼 모듈별 분리
- 인터페이스는 `<module>/domain/` 에 정의
- 구현체는 `<module>/infrastructure/` 에 위치

---

## 2. 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 인터페이스 | 책임 기준 (도구명 금지) | `IBlockchainClient` (O), `IViemClient` (X) |
| 구현체 | 도구 + 책임 | `ViemBlockchainClient implements IBlockchainClient` |
| 유스케이스 | `*Usecase` | `BackfillUsecase` (구 `*Service` 금지) |
| 컨트롤러 | `*Controller` | `BackfillController` |
| 리포지토리 | `*Repository` | `WalletPrismaRepository` |

**파일명:**

- `*.controller.ts` — HTTP 컨트롤러
- `*.usecase.ts` — 유스케이스
- `*.repository.ts` — DB 어댑터
- `*.schema.ts` — Prisma 스키마 / 도메인 스키마
- `*.dto.ts` — 외부 노출 타입
- `*.spec.ts` — 테스트

---

## 3. 코드 근거 주석 (의무)

비자명한 결정은 **반드시** 주석으로 근거 기록.

```ts
// 근거: 동일 블록 3회 연속 실패 시 skip (T-13). sync_status.error_message 에 기록.
const MAX_RETRY = 3;
```

**대상:**

- 상수 값 (왜 3회? 왜 500ms?)
- 라이브러리/버전 선택
- 패턴 채택
- 타입 변환 (예: `bigint` → `Decimal`)
- 외부 SDK 우회/제약 대응

**형식:** `// 근거: ...` 또는 `// 결정: ...` prefix 로 통일.

---

## 4. 비동기 처리 — 이벤트 드리븐

- 직접 호출 (A → B) 대신 이벤트 발행 / 구독으로 강결합 해소
- `POST /backfill` 등은 `@HttpCode(202)` Fire-and-Forget
- usecase 안에서 `try/catch + Logger.error(message, stack)` 로 비동기 에러 추적
- 메시지 큐: Redis Streams 또는 Kafka

---

## 5. NestJS 규칙

- **`@Cron` 데코레이터 금지** — 초 단위 정밀도 한계. 커스텀 워커 / `setInterval` / 이벤트 트리거로 대체
- DI 토큰: `@Inject('IBackfillRepository')` 식
- 모듈 간 직접 import 금지 (공용 모듈 거치거나 DI)
- `private` → `public` 변경 시점 = **별도 모듈로 분리할 신호**

---

## 6. 테스트

- 테스트 파일은 **`src/` 폴더 구조 그대로 미러링**
  - `src/backfill/usecase/backfill.usecase.ts` → `src/backfill/usecase/backfill.usecase.spec.ts` (같은 위치)
- 평면 구조(`test/all-tests.spec.ts`) 금지
- TDD 시나리오는 [docs/test-scenarios.md](./docs/test-scenarios.md) 참고
- 테스트도 단위 (도메인/유스케이스), 통합 (인프라/컨트롤러) 로 명확히 구분

---

## 7. Rate Limit (RPC)

- **Forwardfill 우선**: 예) Infura 500 RPS 중 1 RPS 항상 보장
- **Backfill** 은 나머지 안에서 병렬 처리
- Viem `multicall` / `batch` 활용해 호출 횟수 자체 감소
- 제공자 폴백: **Infura → Alchemy → QuickNode** (무료 한도 누적 활용)

자세한 내용: [docs/design.md §8.4](./docs/design.md)

---

## 8. 금지 사항

- 기존 동작 코드를 **무단 리팩토링 금지** — 작업 요청 범위만
- 요구사항에 없는 기능 추가 금지
- 추측으로 코드 작성 금지 — 모르면 `docs/design.md` 또는 외부 SDK 문서를 확인 후 구현
- 새 파일/폴더 만들기 전 기존 구조 먼저 확인
- 도메인 레이어에 Viem/Prisma 타입 침투 금지 (이전 리뷰의 핵심 지적사항)

---

## 9. 변경 시 동기화

`AGENTS.md` 또는 `docs/design.md` 를 변경하면:

1. 코드와 일관성 유지 (변경한 룰이 기존 코드에 적용되어야 함)
2. 노션 페이지([인덱서 설계 (피드백 이후)](https://www.notion.so/365c782cda0380089666eeff993048b7))도 같이 업데이트하거나, 노션에 "마지막 동기화" 표시
