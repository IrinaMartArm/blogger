import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../exceptions/domain-exception';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';
import { Request } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    const ip = Array.isArray(req.ips) && req.ips.length ? req.ips[0] : req.ip;
    return Promise.resolve(ip ?? 'unknown');
  }

  protected throwThrottlingException(): Promise<void> {
    throw new DomainException({
      code: DomainExceptionCode.TooManyRequests,
      message: 'Too many requests',
    });
  }
}
