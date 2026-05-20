import { Module } from '@nestjs/common';
import { BackfillModule } from './backfill/backfill.module';
import { ChainModule } from './chain/chain.module';
import { ForwardfillModule } from './forwardfill/forwardfill.module';
import { StatusModule } from './status/status.module';
import { WalletModule } from './wallet/wallet.module';

// 근거: 기본 app.controller/app.service 예제 대신 기능 모듈 조립을 루트 진입점으로 사용한다.
@Module({
  imports: [
    BackfillModule,
    ForwardfillModule,
    WalletModule,
    ChainModule,
    StatusModule,
  ],
})
export class AppModule {}
