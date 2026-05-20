import { Controller } from '@nestjs/common';
import { ChainUsecase } from '../usecase/chain.usecase';

@Controller('chains')
export class ChainController {
  constructor(private readonly chainUsecase: ChainUsecase) {}
}
