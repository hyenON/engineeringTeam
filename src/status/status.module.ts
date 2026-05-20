import { Module } from '@nestjs/common';
import { StatusController } from './controller/status.controller';
import { StatusUsecase } from './usecase/status.usecase';

@Module({
  controllers: [StatusController],
  providers: [StatusUsecase],
})
export class StatusModule {}
