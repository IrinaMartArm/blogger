import { Global, Module } from '@nestjs/common';
import { CoreConfig } from './core.config';

@Global()
@Module({
  imports: [],
  exports: [CoreConfig],
  providers: [CoreConfig],
})
export class CoreModule {}
