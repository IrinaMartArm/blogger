import { Extension } from '../exceptions/domain-exception';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';

export type ErrorResponseBodyType = {
  timestamp: string;
  path: string | null;
  message: string;
  code: DomainExceptionCode;
  extensions: Extension[];
};
