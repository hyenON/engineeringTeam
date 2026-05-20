import { Controller } from '@nestjs/common';
import { BackfillUsecase } from '../usecase/backfill.usecase';

@Controller('backfill')
export class BackfillController {
  constructor(private readonly backfillUsecase: BackfillUsecase) {}
}
