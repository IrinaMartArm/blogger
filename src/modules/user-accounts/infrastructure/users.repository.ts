import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domain/user.entity';
import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private UserModel: UserModelType) {}

  async findById(id: Types.ObjectId | string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      _id: id,
      deletedAt: null,
    });
  }

  async save(user: UserDocument) {
    await user.save();
  }

  async find(loginOrEmail: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      $or: [
        { email: loginOrEmail, deletedAt: null },
        { login: loginOrEmail, deletedAt: null },
      ],
    });
  }

  async findByConfirmationCode(code: string): Promise<UserDocument | null> {
    return this.UserModel.findOne({
      confirmationCode: code,
      deletedAt: null,
      // isEmailConfirmed: false,
    });
  }
}
