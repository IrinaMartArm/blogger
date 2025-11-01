import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import { CoreConfig } from './core/core.config';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  appSetup(app);

  app.set('trust proxy', true); //'loopback' означает доверять только локальным прокси, то есть 127.0.0.1 и ::1.
  //1 — доверять первому прокси (если у тебя один внешний прокси перед приложением, например Nginx).
  //'true' — доверять всем прокси (чаще всего не рекомендуется по соображениям безопасности).

  const coreConfig = app.get<CoreConfig>(CoreConfig);

  const PORT = coreConfig.port;

  await app.listen(PORT, () => {
    console.log(
      'Server is running on port ' + PORT + ' http://localhost:' + PORT,
    );
    console.log('NODE_ENV: ', coreConfig.env);
  });
}
bootstrap();
