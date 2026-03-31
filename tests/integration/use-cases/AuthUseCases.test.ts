import Database from 'better-sqlite3';
import { runMigrations } from '@/infrastructure/database/migrations';
import { SqliteAdminRepository } from '@/infrastructure/repositories/SqliteAdminRepository';
import { BcryptPasswordHasher } from '@/infrastructure/security/BcryptPasswordHasher';
import { JwtAuthService } from '@/infrastructure/auth/JwtAuthService';
import { LoginUseCase } from '@/application/use-cases/admin/Login';
import { ChangeOwnPasswordUseCase } from '@/application/use-cases/admin/ChangeOwnPassword';
import { GetCurrentAdminUseCase } from '@/application/use-cases/admin/GetCurrentAdmin';
import { ApplicationError } from '@/application/errors/ApplicationError';
import { Admin } from '@/domain/entities/Admin';

describe('Auth Use Cases — Integration', () => {
  let db: Database.Database;
  let adminRepo: SqliteAdminRepository;
  let passwordHasher: BcryptPasswordHasher;
  let jwtService: JwtAuthService;
  let login: LoginUseCase;
  let changeOwnPassword: ChangeOwnPasswordUseCase;
  let getCurrentAdmin: GetCurrentAdminUseCase;

  const seedPassword = 'seedpass123';

  beforeEach(async () => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runMigrations(db);

    adminRepo = new SqliteAdminRepository(db);
    passwordHasher = new BcryptPasswordHasher();
    jwtService = new JwtAuthService('integration-test-secret', 8);

    login = new LoginUseCase(adminRepo, passwordHasher, jwtService);
    changeOwnPassword = new ChangeOwnPasswordUseCase(adminRepo, passwordHasher);
    getCurrentAdmin = new GetCurrentAdminUseCase(adminRepo);

    const hash = await passwordHasher.hash(seedPassword);
    const admin = new Admin({
      id: 'admin-seed',
      username: 'admin',
      passwordHash: hash,
      mustChangePassword: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await adminRepo.create(admin);
  });

  afterEach(() => {
    db.close();
  });

  it('should login with seeded admin credentials', async () => {
    const result = await login.execute({ username: 'admin', password: seedPassword });

    expect(result.token).toBeTruthy();
    expect(result.mustChangePassword).toBe(true);
    expect(result.admin.username).toBe('admin');
  });

  it('should reject login with wrong password', async () => {
    await expect(
      login.execute({ username: 'admin', password: 'wrongpassword' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('should change password and clear mustChangePassword flag', async () => {
    await changeOwnPassword.execute('admin-seed', {
      oldPassword: seedPassword,
      newPassword: 'newsecure123',
    });

    const adminDto = await getCurrentAdmin.execute('admin-seed');
    expect(adminDto.mustChangePassword).toBe(false);
  });

  it('should login with new password after change', async () => {
    await changeOwnPassword.execute('admin-seed', {
      oldPassword: seedPassword,
      newPassword: 'newsecure123',
    });

    const result = await login.execute({ username: 'admin', password: 'newsecure123' });

    expect(result.token).toBeTruthy();
    expect(result.mustChangePassword).toBe(false);
  });

  it('should reject login with old password after change', async () => {
    await changeOwnPassword.execute('admin-seed', {
      oldPassword: seedPassword,
      newPassword: 'newsecure123',
    });

    await expect(
      login.execute({ username: 'admin', password: seedPassword }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('should return admin without passwordHash via GetCurrentAdmin', async () => {
    const result = await getCurrentAdmin.execute('admin-seed');

    expect(result.id).toBe('admin-seed');
    expect(result.username).toBe('admin');
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('should issue JWT with mustChangePassword=false after password change', async () => {
    // Login gets JWT with mustChangePassword=true
    const loginResult = await login.execute({ username: 'admin', password: seedPassword });
    const initialPayload = jwtService.verify(loginResult.token);
    expect(initialPayload?.mustChangePassword).toBe(true);

    // Change password clears the flag in the DB
    await changeOwnPassword.execute('admin-seed', {
      oldPassword: seedPassword,
      newPassword: 'newsecure123',
    });

    // A new JWT should reflect mustChangePassword=false
    const newToken = jwtService.sign({ adminId: 'admin-seed', mustChangePassword: false });
    const newPayload = jwtService.verify(newToken);
    expect(newPayload?.mustChangePassword).toBe(false);

    // Login with new password also confirms the flag is cleared
    const reloginResult = await login.execute({ username: 'admin', password: 'newsecure123' });
    const reloginPayload = jwtService.verify(reloginResult.token);
    expect(reloginPayload?.mustChangePassword).toBe(false);
  });
});
