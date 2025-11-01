import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { EmailService } from '../../src/modules/notifications/email.service';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { UsersTestManager } from './users-test-manager';
import { deleteAllData } from './delete-all-data';
import { initAppModule } from '../../src/init-app-module';
import { EmailServiceMock } from '../mock/email-service.mock';

export const initSettings = async (
  //передаем callback, который получает ModuleBuilder, если хотим изменить настройку тестового модуля
  addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
) => {
  const DynamicAppModule = await initAppModule();
  const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports: [DynamicAppModule],
  })
    .overrideProvider(EmailService)
    .useClass(EmailServiceMock);

  if (addSettingsToModuleBuilder) {
    addSettingsToModuleBuilder(testingModuleBuilder);
  }

  const testingAppModule = await testingModuleBuilder.compile();

  const app = testingAppModule.createNestApplication();
  // const coreConfig = app.get<CoreConfig>(CoreConfig);
  // appSetup(app, coreConfig.isSwaggerEnabled);

  await app.init();

  const databaseConnection = app.get<Connection>(getConnectionToken());
  // const httpServer = app.getHttpServer();
  const userTestManger = new UsersTestManager(app);

  await deleteAllData(app);

  return {
    app,
    databaseConnection,
    // httpServer,
    userTestManger,
  };
};
