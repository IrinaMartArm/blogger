import { CreateUserDto } from '../../../dto/create-user.dto';
import { IsStringWithTrim } from '../../../../../core/decorators/validation/isStringTrim';
import { loginConst, passwordConst } from '../../../constants';
import { IsEmail, IsString } from 'class-validator';
import { Trim } from '../../../../../core/decorators/transform/trim';

export class CreateUserInputDto implements CreateUserDto {
  @IsStringWithTrim(loginConst.min, loginConst.max)
  login: string;

  @IsStringWithTrim(passwordConst.min, passwordConst.max)
  password: string;

  @IsString()
  @IsEmail()
  // @Matches(emailConstraints.match)
  @Trim()
  email: string;
}

export class CheckEmailDto {
  @IsString()
  @IsEmail()
  @Trim()
  email: string;
}

export class NewPasswordInputDto {
  @IsStringWithTrim(passwordConst.min, passwordConst.max)
  newPassword: string;

  @IsString()
  recoveryCode: string;
}
