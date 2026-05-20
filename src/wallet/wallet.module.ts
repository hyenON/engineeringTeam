import { Module } from '@nestjs/common';
import { WalletController } from './controller/wallet.controller';
import { WalletUsecase } from './usecase/wallet.usecase';

@Module({
  controllers: [WalletController],
  providers: [WalletUsecase],
})
export class WalletModule {}
