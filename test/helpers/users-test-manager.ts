import { CreateUserInputDto } from '../../src/modules/user-accounts/user/api/input-dto/users.input-dto';
import { HttpStatus, INestApplication } from '@nestjs/common';
import {
  MeViewDto,
  UserViewDto,
} from '../../src/modules/user-accounts/user/api/view-dto/user.view-dto';
import request, { Response } from 'supertest';
import { delay } from './delay';

const login = 'admin';
const password = 'qwerty';

export class UsersTestManager {
  constructor(private app: INestApplication) {}

  async createUser(
    createModel: CreateUserInputDto,
    statusCode: number = HttpStatus.CREATED,
  ): Promise<UserViewDto> {
    const response: Response = await request(this.app.getHttpServer())
      .post(`/users`)
      .send(createModel)
      .auth(login, password)
      .expect(statusCode);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.body;
  }

  async login(
    login: string,
    password: string,
    statusCode: number = HttpStatus.OK,
  ): Promise<{ accessToken: string }> {
    const response = await request(this.app.getHttpServer())
      .post(`/auth/login`)
      .send({ login, password })
      .expect(statusCode);
    const body = response.body as { accessToken: string };

    return {
      accessToken: body.accessToken,
    };
  }

  async me(
    accessToken: string,
    statusCode: number = HttpStatus.OK,
  ): Promise<MeViewDto> {
    const response = await request(this.app.getHttpServer())
      .get(`/auth/me`)
      .auth(accessToken, { type: 'bearer' })
      .expect(statusCode);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.body;
  }

  async createAndLoginUser(): Promise<{
    email: string;
    accessToken: string;
    refreshToken: string;
    userId: string;
  }> {
    const user = await this.createUser({
      login,
      password,
      email: 'test@test.com',
    });

    const loginResponse = await request(this.app.getHttpServer())
      .post('/auth/login')
      .send({
        login: 'testuser',
        password: 'password123',
      })
      .expect(HttpStatus.OK);

    const accessToken = (loginResponse.body as { accessToken: string })
      .accessToken;
    const setCookieHeader = loginResponse.headers[
      'set-cookie'
    ] as unknown as string[];

    const refreshToken =
      setCookieHeader?.[0]?.split(';')[0]?.split('=')[1] ?? '';

    return {
      email: user.email,
      userId: user.id,
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(
    refreshToken: string,
    expectedStatus: number = HttpStatus.NO_CONTENT,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await request(this.app.getHttpServer())
      .post('/auth/refresh-token')
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(expectedStatus);

    const accessToken = (response.body as { accessToken: string }).accessToken;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (expectedStatus === HttpStatus.NO_CONTENT) {
      return {
        accessToken,
        refreshToken: response.headers['set-cookie'][0]
          .split(';')[0]
          .split('=')[1],
      };
    }

    return { accessToken: '', refreshToken: '' };
  }

  async logout(
    refreshToken: string,
    expectedStatus: number = HttpStatus.NO_CONTENT,
  ): Promise<void> {
    await request(this.app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', `refreshToken=${refreshToken}`)
      .expect(expectedStatus);
  }

  async createSeveralUsers(count: number): Promise<UserViewDto[]> {
    const usersPromises = [] as Promise<UserViewDto>[];

    for (let i = 0; i < count; ++i) {
      await delay(50);
      const response = this.createUser({
        login: `test` + i,
        email: `test${i}@gmail.com`,
        password: '123456789',
      });
      usersPromises.push(response);
    }

    return Promise.all(usersPromises);
  }

  async createAndLoginSeveralUsers(
    count: number,
  ): Promise<{ accessToken: string }[]> {
    const users = await this.createSeveralUsers(count);

    const loginPromises = users.map((user: UserViewDto) =>
      this.login(user.login, '123456789'),
    );

    return await Promise.all(loginPromises);
  }
}
