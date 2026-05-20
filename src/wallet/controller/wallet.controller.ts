import { Controller } from '@nestjs/common';
import { WalletUsecase } from '../usecase/wallet.usecase';

@Controller('wallets')
export class WalletController {
  constructor(private readonly walletUsecase: WalletUsecase) {}
}
