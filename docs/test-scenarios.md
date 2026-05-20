# 테스트 시나리오

T-01~T-17 전체 시나리오. Given/When/Then 형식으로 구현 전 먼저 작성.

> ✅ 테스트 통과 완료 | ⏳ 미구현

---

## 정상 케이스

### T-01 ✅ — 블록 감지
- **Given** 새 블록 데이터가 들어온다 (number: 100n, hash: '0xaaa', parentHash: '0xbbb')
- **When** `BlockProcessor.process(block)` 호출
- **Then** `blocks` 테이블에 해당 블록이 저장된다

### T-02 ✅ — 중복 블록
- **Given** 동일한 블록이 이미 저장돼 있다
- **When** 같은 블록으로 `process(block)` 을 두 번 호출
- **Then** `blocks` 테이블에 1건만 존재한다 (upsert)

### T-03 ✅ — 트랜잭션 저장
- **Given** 트랜잭션 100건을 포함한 블록이 들어온다
- **When** `BlockProcessor.process(block)` 호출
- **Then** `transactions` 테이블에 100건 전부 저장된다

### T-04 ✅ — 빈 블록
- **Given** 트랜잭션이 0건인 블록이 들어온다
- **When** `BlockProcessor.process(block)` 호출
- **Then** `blocks` 테이블에 블록 1건 저장, `transactions` 는 0건

### T-05 ✅ — Transfer 디코딩
- **Given** ERC-20 Transfer 이벤트가 있는 트랜잭션이 포함된 블록
- **When** `EventDecoder.decodeEvents(transactions)` 호출
- **Then** `token_transfers` 테이블에 저장, `logs` 테이블에는 저장 안 됨

### T-06 ✅ — 지갑 조회
- **Given** 특정 주소가 from/to 로 포함된 트랜잭션들이 DB에 있다
- **When** `WalletService.getTransactions(address, chainId)` 호출
- **Then** 해당 주소 기준 트랜잭션 전체 반환 (최신 블록 순)

### T-07 ✅ — 없는 주소 조회
- **Given** 한 번도 거래하지 않은 주소
- **When** `WalletService.getTransactions(address, chainId)` 호출
- **Then** 에러가 아닌 빈 배열 반환

### T-07b ✅ — 지갑 통계 조회
- **Given** 특정 주소의 트랜잭션 2건, 토큰 전송 3건이 있다
- **When** `WalletService.getStats(address, chainId)` 호출
- **Then** `totalTxCount`, `firstSeenBlock`, `topContracts` 를 올바르게 반환

### T-07c ✅ — 토큰 잔액 조회
- **Given** 특정 주소가 받은 토큰 1500, 보낸 토큰 200
- **When** `WalletService.getBalances(address, chainId)` 호출
- **Then** 컨트랙트별 순 잔액 (받은 - 보낸) 반환

### T-08 ⏳ — 멀티체인
- **Given** Ethereum(chainId: 1) 과 Base(chainId: 8453) 두 체인에서 블록이 들어온다
- **When** 각각 `BlockProcessor.process(block)` 호출
- **Then** `blocks` / `transactions` 에 chainId 별로 독립 저장

### T-08b ✅ — 체인 목록 조회
- **Given** Ethereum, Base 두 체인이 등록돼 있다
- **When** `ChainService.getAllChains()` 호출
- **Then** 2개 체인 목록 반환

### T-08c ✅ — 체인 추가 (upsert)
- **Given** chainId: 1 이 이미 등록돼 있다
- **When** 같은 chainId 로 `ChainService.addChain()` 호출
- **Then** 중복 없이 업데이트됨

### T-08d ✅ — 백필 실행
- **Given** startBlock: 100, endBlock: 200
- **When** `BackfillService.startBackfill(100n, 200n)` 호출
- **Then** `BackfillWorker.run(100n, 200n)` 이 1회 호출됨

### T-08e ✅ — 백필 유효성 검사
- **Given** startBlock > endBlock
- **When** `BackfillService.startBackfill(200n, 100n)` 호출
- **Then** 에러를 던진다

### T-08f ✅ — 인덱서 전체 상태 조회
- **Given** chainId 1, 8453 두 체인의 sync_status 가 있다
- **When** `StatusService.getAllStatus()` 호출
- **Then** 2개 상태 반환

### T-08g ✅ — 특정 체인 상태 조회
- **Given** chainId: 1 의 sync_status 가 있다
- **When** `StatusService.getStatusByChainId(1)` 호출
- **Then** 해당 체인 상태 반환, 없는 chainId 는 null

---

## BlockListener / BackfillWorker

### T-BL1 ✅ — 블록 구독 → BlockProcessor 호출
- **Given** Viem 클라이언트 Stub
- **When** `BlockListener.onBlock(viemBlock)` 호출
- **Then** `BlockProcessor.process()` 가 올바른 블록/트랜잭션으로 호출됨

### T-BL2 ✅ — 트랜잭션 있는 블록의 receipt 조회
- **Given** 트랜잭션 1건 포함, receipt 에 log 1건
- **When** `onBlock()` 호출
- **Then** 트랜잭션에 logs 가 포함되어 process() 에 전달됨

### T-BW1 ✅ — 백필 범위 순서 처리
- **Given** startBlock: 100, endBlock: 103
- **When** `BackfillWorker.run(100n, 103n)` 호출
- **Then** 100, 101, 102, 103 순서대로 처리

### T-BW2 ✅ — 백필 중 pause()
- **Given** 3번째 블록 처리 직후 `pause()` 호출
- **When** `run(100n, 110n)` 실행
- **Then** 3개 처리 후 중단

---

## WalletImportService

### T-WI1 ✅ — ERC-20 이력 import
- **Given** Alchemy Stub 에 보낸/받은 ERC-20 transfer 2건 세팅
- **When** `importHistory(address)` 호출
- **Then** DB 에 2건 저장, amount 는 hex → bigint 변환 정확

### T-WI2 ✅ — 중복 import 방지
- **Given** 동일한 transfer 가 이미 저장된 상태
- **When** `importHistory(address)` 를 두 번 호출
- **Then** DB 에 1건만 존재 (upsert)

### T-WI3 ✅ — 거래 없는 주소
- **Given** Alchemy 응답이 빈 배열
- **When** `importHistory(address)` 호출
- **Then** `{ imported: 0 }` 반환, DB 변화 없음

---

## 실패 케이스

### T-09 ⏳ — RPC 연결 끊김
- **Given** Viem 클라이언트가 disconnect 상태 (Mock 으로 시뮬레이션)
- **When** 블록 구독 중 연결이 끊긴다
- **Then** 에러 로그 기록 + 자동 재연결 시도, 인덱서 상태 `ERROR` → `RECOVERING`

### T-10 ⏳ — rate limit 초과
- **Given** 초당 요청 허용량이 1인 RateLimiter
- **When** 2번 연속으로 `requestToken()` 호출
- **Then** 두 번째 호출은 큐에서 대기 후 backoff 재시도

### T-11 ✅ — ABI 디코딩 실패
- **Given** 잘못된 ABI 데이터가 포함된 로그
- **When** `EventDecoder.decodeEvents(transactions)` 호출
- **Then** `token_transfers` 가 아닌 `logs` 테이블에 raw 데이터로 저장

### T-12 ✅ — DB INSERT 실패
- **Given** Repository 가 연결 오류를 던지도록 Fake 설정
- **When** `BlockProcessor.process(block)` 호출
- **Then** `sync_status` 에 error 기록, 해당 블록 재시도

### T-13 ✅ — 동일 블록 3회 실패
- **Given** 특정 블록 처리 시 Repository 가 항상 오류를 던지는 상태
- **When** `BlockProcessor.process(block)` 호출 (3회 재시도 초과)
- **Then** 해당 블록 skip, 에러 로그 기록, 블록 상태 `SKIPPED`

---

## 복구 케이스

### T-14 ⏳ — 정상 종료 후 재시작
- **Given** `sync_status.last_synced_block` 이 500 으로 저장된 상태
- **When** 인덱서를 재시작
- **Then** 블록 500 이후부터 이어서 처리

### T-15 ⏳ — 비정상 종료 후 재시작
- **Given** 인덱서가 블록 처리 도중 강제 종료됨 (last_synced_block = 500)
- **When** 인덱서 재시작
- **Then** 블록 500 부터 재개, 중복 저장 없음 (upsert)

### T-16 ✅ — reorg 발생
- **Given** 저장된 블록 100 의 hash 와 다른 parentHash 를 가진 블록 101 이 들어온다
- **When** `BlockProcessor.process(block101)` 호출
- **Then** 블록 100 의 `is_reorged = true` 업데이트, 블록 재처리

### T-17 ✅ — 백필 중 실시간 블록
- **Given** BackfillWorker 가 백필 진행 중
- **When** 새 실시간 블록이 들어온다
- **Then** 실시간 블록 먼저 처리 완료, 백필은 대기 후 재개 (`pause()` 로 구현)

---

## 진행 현황

| 구분 | 완료 | 미구현 |
|---|---|---|
| BlockProcessor | T-01~04, T-12, T-13, T-16 | — |
| EventDecoder | T-05, T-11 | — |
| BlockListener | T-BL1, T-BL2 | — |
| BackfillWorker | T-BW1, T-BW2, T-17 | — |
| WalletService | T-06, T-07, T-07b, T-07c | — |
| WalletImportService | T-WI1, T-WI2, T-WI3 | — |
| ChainService | T-08b, T-08c | — |
| BackfillService | T-08d, T-08e | — |
| StatusService | T-08f, T-08g | — |
| Controller / E2E | — | T-08, T-09, T-10, T-14, T-15 |
