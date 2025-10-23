import {
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import {
  DomainException,
  Extension,
} from '../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../core/exceptions/domain-exception-codes';

const errorsTransformer = (errors: ValidationError[]): Extension[] => {
  const errorsForResponse: Extension[] = [];

  for (const error of errors) {
    if (!error.constraints && error.children?.length) {
      errorsTransformer(error.children);
    } else if (error.constraints) {
      const constrainKeys = Object.keys(error.constraints);

      for (const key of constrainKeys) {
        errorsForResponse.push({
          message: error.constraints[key]
            ? `${error.constraints[key]}; Received value: ${error?.value}`
            : '',
          key: error.property,
        });
      }
    }
  }

  return errorsForResponse;
};

export function pipesSetup(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      // whitelist: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const transformedErrors = errorsTransformer(errors);

        throw new DomainException({
          code: DomainExceptionCode.ValidationError,
          message: 'Validation failed',
          extensions: transformedErrors,
        });
      },
    }),
  );
}
