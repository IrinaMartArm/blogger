import { configModule } from './config-dynamic-module';
import { DynamicModule, Module } from '@nestjs/common';
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
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    configModule,
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
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'short',
          ttl: 10000, //60 секунд
          limit: 5,
        },
      ],
    }),
    CqrsModule.forRoot(),
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
export class AppModule {
  static async forRoot(coreConfig: CoreConfig): Promise<DynamicModule> {
    const dynamicImports: any[] = [];

    if (coreConfig.includeTestingModule) {
      dynamicImports.push(TestingModule);
    }

    // такой мудрёный способ мы используем, чтобы добавить к основным модулям необязательный модуль.
    //@Module — это статический декоратор, он вычисляется на этапе компиляции, не во время запуска.
    // А вот forRoot() — это динамический метод, который вызывается во время выполнения и может принимать аргументы.
    // чтобы не обращаться в декораторе к переменной окружения через process.env в декораторе, потому что
    // запуск декораторов происходит на этапе склейки всех модулей до старта жизненного цикла самого NestJS

    return Promise.resolve({
      module: AppModule,
      imports: dynamicImports,
    });
  }
}
