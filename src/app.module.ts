import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { SETTINGS } from './settings';
import { BloggerModule } from './modules/blogger/blogger.module';

@Module({
  imports: [
    MongooseModule.forRoot(SETTINGS.MONGO_URL),
    UserAccountsModule,
    BloggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
