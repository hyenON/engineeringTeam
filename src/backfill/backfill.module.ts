import { Module } from '@nestjs/common';
import { BackfillController } from './controller/backfill.controller';
import { BackfillUsecase } from './usecase/backfill.usecase';

@Module({
  controllers: [BackfillController],
  providers: [BackfillUsecase],
})
export class BackfillModule {}
