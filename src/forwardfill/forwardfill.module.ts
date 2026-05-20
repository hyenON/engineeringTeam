import { Module } from '@nestjs/common';
import { ForwardfillController } from './controller/forwardfill.controller';
import { ForwardfillUsecase } from './usecase/forwardfill.usecase';

@Module({
  controllers: [ForwardfillController],
  providers: [ForwardfillUsecase],
})
export class ForwardfillModule {}
