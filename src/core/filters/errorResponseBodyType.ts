import { Extension } from '../exceptions/domain-exception';

export type ErrorResponseBodyType = {
  errorsMessages: Extension[];
};
