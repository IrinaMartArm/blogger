import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';
import { DomainException } from '../exceptions/domain-exception';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';

@Injectable()
export class ObjectIdValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): any {
    if (metadata.metatype === Types.ObjectId) {
      if (typeof value !== 'string') {
        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          message: `Id must be a string`,
        });
      }
      if (!isValidObjectId(value)) {
        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          message: `Invalid ObjectId: ${value}`,
        });
      }
      return new Types.ObjectId(value);
    }

    // Если тип не ObjectId, возвращаем значение без изменений
    return value;
  }
}
