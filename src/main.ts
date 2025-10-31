import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import { CoreConfig } from './core/core.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  appSetup(app);

  const coreConfig = app.get<CoreConfig>(CoreConfig);

  const PORT = coreConfig.port;

  await app.listen(PORT, () => {
    console.log(
      'Server is running on port ' + PORT + ' http://localhost:' + PORT,
    );
  });
}
bootstrap();
