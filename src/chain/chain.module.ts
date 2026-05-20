import { Module } from '@nestjs/common';
import { ChainController } from './controller/chain.controller';
import { ChainUsecase } from './usecase/chain.usecase';

@Module({
  controllers: [ChainController],
  providers: [ChainUsecase],
})
export class ChainModule {}
