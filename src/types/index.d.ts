import { UserContextDto } from '../modules/user-accounts/dto/user-context.dto';

declare global {
  namespace Express {
    interface Request {
      user?: UserContextDto;
    }
  }
}
