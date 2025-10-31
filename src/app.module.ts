import { configModule } from './config-dynamic-module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { BloggerModule } from './modules/blogger/blogger.module';
import { TestingModule } from './modules/testing/testing.module';
import { APP_FILTER } from '@nestjs/core';
import { AllHttpExceptionsFilter } from './core/filters/all-exceptions-filter';
import { DomainHttpExceptionsFilter } from './core/filters/domain-exception-filter';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreConfig } from './core/core.config';
import { CoreModule } from './core/core.module';

@Module({
  imports: [
    CoreModule,
    MongooseModule.forRootAsync({
      useFactory: (coreConfig: CoreConfig) => {
        const uri = coreConfig.mongoURI;
        console.log('DB_URI', uri);

        return {
          uri: uri,
        };
      },
      inject: [CoreConfig],
    }),
    CqrsModule.forRoot(),
    configModule,
    UserAccountsModule,
    BloggerModule,
    TestingModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllHttpExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainHttpExceptionsFilter,
    },
  ],
})
export class AppModule {}
