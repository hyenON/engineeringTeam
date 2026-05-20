import { Controller } from '@nestjs/common';
import { StatusUsecase } from '../usecase/status.usecase';

@Controller('status')
export class StatusController {
  constructor(private readonly statusUsecase: StatusUsecase) {}
}
