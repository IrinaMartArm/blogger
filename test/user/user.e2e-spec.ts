import { HttpStatus, INestApplication } from '@nestjs/common';
import { UserAccountsConfig } from '../../src/modules/user-accounts/user-accounts.config';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constants/token.constants';
import { UsersTestManager } from '../helpers/users-test-manager';
import { CreateUserDto } from '../../src/modules/user-accounts/dto/create-user.dto';
import { PaginatedViewDto } from '../../src/core/dto/base.paginated.view-dto';
import {
  MeViewDto,
  UserViewDto,
} from '../../src/modules/user-accounts/user/api/view-dto/user.view-dto';
import request from 'supertest';
import { EmailService } from '../../src/modules/notifications/email.service';
import { deleteAllData } from '../helpers/delete-all-data';
import { delay } from '../helpers/delay';
import { initSettings } from '../helpers/init-settings';

describe('users', () => {
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
              signOptions: { expiresIn: '2s' },
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

  it('CREATE USER should create user', async () => {
    const body: CreateUserDto = {
      login: 'name1',
      password: 'qwerty',
      email: 'email@email.em',
    };

    const response: UserViewDto = await userTestManger.createUser(body);

    expect(response).toEqual({
      id: expect.any(String),
      login: body.login,
      email: body.email,
      createdAt: expect.any(String),
    });
  });

  it('GET ALL USERS should get users with paging', async () => {
    const users = await userTestManger.createSeveralUsers(12);
    const { body: responseBody } = (await request(app.getHttpServer())
      .get(`/users?pageNumber=2&sortDirection=asc`)
      .auth('admin', 'qwerty')
      .expect(HttpStatus.OK)) as { body: PaginatedViewDto<UserViewDto> };

    expect(responseBody.totalCount).toBe(12);
    expect(responseBody.items).toHaveLength(2);
    expect(responseBody.pagesCount).toBe(2);
    //asc sorting
    expect(responseBody.items[1]).toEqual(users[users.length - 1]);
    //etc...
  });

  it('ME should return users info while "me" request with correct accessTokens', async () => {
    const tokens = await userTestManger.createAndLoginSeveralUsers(1);

    const responseBody = await userTestManger.me(tokens[0].accessToken);

    expect(responseBody).toEqual({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      login: expect.anything(),
      userId: expect.anything(),
      email: expect.anything(),
    } as MeViewDto);
  });

  it(`ME shouldn't return users info while "me" request if accessTokens expired`, async () => {
    const tokens = await userTestManger.createAndLoginSeveralUsers(1);
    await delay(2000);
    await userTestManger.me(tokens[0].accessToken, HttpStatus.UNAUTHORIZED);
  });

  it(`REGISTRATION should register user without really send email`, async () => {
    await request(app.getHttpServer())
      .post(`/auth/registration`)
      .send({
        email: 'email@email.em',
        password: '123123123',
        login: 'login123',
        age: 15,
      } as CreateUserDto)
      .expect(HttpStatus.CREATED);
  });

  it(`REGISTRATION should call email sending method while registration`, async () => {
    const sendEmailMethod = (app.get(EmailService).sendConfirmationEmail = jest
      .fn()
      .mockImplementation(() => Promise.resolve()));

    await request(app.getHttpServer())
      .post(`/auth/registration`)
      .send({
        email: 'email@email.em',
        password: '123123123',
        login: 'login123',
        age: 15,
      } as CreateUserDto)
      .expect(HttpStatus.CREATED);

    expect(sendEmailMethod).toHaveBeenCalled();
  });

  // it('REFRESH TOKEN should return new access and refresh tokens', async () => {
  //   const user = await userTestManger.createAndLoginUser();
  //
  //   const { accessToken, refreshToken } = await userTestManger.refreshToken(
  //     user.refreshToken,
  //   );
  //
  //   expect(accessToken).toBeDefined();
  //   expect(refreshToken).toBeDefined();
  //   expect(typeof accessToken).toBe('string');
  //   expect(typeof refreshToken).toBe('string');
  //
  //   // 3. Проверяем, что новый access token работает
  //   const meResponse = await userTestManger.me(accessToken);
  //   expect(meResponse.email).toBe(user.email);
  // });
});
