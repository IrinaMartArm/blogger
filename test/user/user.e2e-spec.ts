import { User } from '../../src/modules/user-accounts/domain/user.entity';

describe('User', () => {
  it('should confirm email when code is valid', () => {
    const user = new User();
    user.confirmationCode = '123456';
    user.expirationDate = new Date(Date.now() + 3600000); // +1 hour

    const result = user.confirmEmail('123456');

    expect(result).toBe(true);
    expect(user.isEmailConfirmed).toBe(true);
    expect(user.confirmationCode).toBeNull();
  });
});
describe('AuthService', () => {
  it('should change password with valid recovery code', async () => {
    const user = new User();
    user.confirmationCode = '123456';
    user.expirationDate = new Date(Date.now() + 3600000);

    const result = await authService.setNewPassword({
      recoveryCode: '123456',
      newPassword: 'newPassword123',
    });

    expect(user.passwordHash).not.toBeNull();
    expect(user.confirmationCode).toBeNull();
  });
});
