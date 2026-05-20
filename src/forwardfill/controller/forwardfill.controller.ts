import { Controller } from '@nestjs/common';
import { ForwardfillUsecase } from '../usecase/forwardfill.usecase';

@Controller('webhook/activity')
export class ForwardfillController {
  constructor(private readonly forwardfillUsecase: ForwardfillUsecase) {}
}
