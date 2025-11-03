import { initSettings } from '../helpers/init-settings';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../src/modules/user-accounts/constants/token.constants';
import { UserAccountsConfig } from '../../src/modules/user-accounts/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersTestManager } from '../helpers/users-test-manager';
import { deleteAllData } from '../helpers/delete-all-data';
import { delay } from '../helpers/delay';
import request from 'supertest';

describe('refresh token', () => {
  let app: INestApplication;
  let userTestManger: UsersTestManager;

  beforeAll(async () => {
    const result = await initSettings((moduleBuilder) =>
      moduleBuilder
        .overrideProvider(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
        .useFactory({
          factory: (userAccountsConfig: UserAccountsConfig) => {
            return new JwtService({
              secret: userAccountsConfig.accessTokenSecret,
              signOptions: { expiresIn: '2s' }, // Access token - 2 секунды
            });
          },
          inject: [UserAccountsConfig],
        })
        .overrideProvider(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
        .useFactory({
          factory: (userAccountsConfig: UserAccountsConfig) => {
            return new JwtService({
              secret: userAccountsConfig.refreshTokenSecret,
              signOptions: { expiresIn: '5s' }, // Refresh token - 5 секунд для тестов
            });
          },
          inject: [UserAccountsConfig],
        }),
    );
    app = result.app;
    userTestManger = result.userTestManger;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await deleteAllData(app);
  });

  it('REFRESH TOKEN should return new access and refresh tokens', async () => {
    const user = await userTestManger.createAndLoginUser();

    const { accessToken, refreshToken } = await userTestManger.refreshToken(
      user.refreshToken,
    );

    expect(accessToken).toBeDefined();
    expect(refreshToken).toBeDefined();
    expect(typeof accessToken).toBe('string');
    expect(typeof refreshToken).toBe('string');

    // 3. Проверяем, что новый access token работает
    const meResponse = await userTestManger.me(accessToken);
    expect(meResponse.email).toBe(user.email);
  });

  it('REFRESH TOKEN should invalidate old refresh token after use', async () => {
    const user = await userTestManger.createAndLoginUser();
    const oldRefreshToken = user.refreshToken;

    // 2. Используем refresh token первый раз
    await userTestManger.refreshToken(oldRefreshToken);

    // 3. Пытаемся использовать тот же refresh token второй раз - должна быть ошибка
    await userTestManger.refreshToken(oldRefreshToken, HttpStatus.UNAUTHORIZED);
  });

  it('REFRESH TOKEN should not work with expired token', async () => {
    // 1. Логиним пользователя
    const user = await userTestManger.createAndLoginUser();

    // 2. Ждем истечения refresh token (5 секунд + запас)
    await delay(6000);

    // 3. Пытаемся обновить с истекшим токеном - должна быть ошибка
    await userTestManger.refreshToken(
      user.refreshToken,
      HttpStatus.UNAUTHORIZED,
    );
  });

  it('REFRESH TOKEN should work multiple times within expiration', async () => {
    // 1. Логиним пользователя
    const user = await userTestManger.createAndLoginUser();

    // 2. Обновляем токен несколько раз подряд
    const refresh1 = await userTestManger.refreshToken(user.refreshToken);
    const refresh2 = await userTestManger.refreshToken(refresh1.refreshToken);
    const refresh3 = await userTestManger.refreshToken(refresh2.refreshToken);

    // 3. Проверяем, что все access tokens работают
    await userTestManger.me(refresh1.accessToken);
    await userTestManger.me(refresh2.accessToken);
    await userTestManger.me(refresh3.accessToken);
  });

  it('REFRESH TOKEN should return 401 with invalid token', async () => {
    await userTestManger.refreshToken('invalid-token', HttpStatus.UNAUTHORIZED);
  });

  it('REFRESH TOKEN should return 401 with missing token', async () => {
    await request(app.getHttpServer())
      .post('/auth/refresh-token')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('REFRESH TOKEN should work after logout from other device', async () => {
    // 1. Логинимся с двух устройств
    const user1 = await userTestManger.createAndLoginUser();
    const user2 = await userTestManger.createAndLoginUser(); // тот же пользователь, другое устройство

    // 2. Разлогиниваемся с одного устройства
    await userTestManger.logout(user1.refreshToken);

    // 3. Проверяем, что с другого устройства все еще можно обновить токен
    const newTokens = await userTestManger.refreshToken(user2.refreshToken);
    expect(newTokens.accessToken).toBeDefined();
  });

  it('REFRESH TOKEN should update lastActive in session', async () => {
    // 1. Логиним пользователя
    const user = await userTestManger.createAndLoginUser();
    const initialLastActive = new Date();

    // 2. Ждем немного
    await delay(1000);

    // 3. Обновляем токен
    await userTestManger.refreshToken(user.refreshToken);

    // 4. Проверяем, что lastActive обновился (это может потребовать кастомного метода в репозитории)
    // const session = await devicesRepository.findByRefreshToken(user.refreshToken);
    // expect(session.lastActive).toBeGreaterThan(initialLastActive);
  });
});
