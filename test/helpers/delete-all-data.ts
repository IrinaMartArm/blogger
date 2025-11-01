import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';

export const deleteAllData = async (
  app: INestApplication,
): Promise<Response> => {
  return request(app.getHttpServer()).delete(`/testing/all-data`);
};
