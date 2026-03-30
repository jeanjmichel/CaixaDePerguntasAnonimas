import Database from 'better-sqlite3';
import { runMigrations } from '@/infrastructure/database/migrations';
import { SqliteAdminRepository } from '@/infrastructure/repositories/SqliteAdminRepository';
import { BcryptPasswordHasher } from '@/infrastructure/security/BcryptPasswordHasher';
import { JwtAuthService } from '@/infrastructure/auth/JwtAuthService';
import { UuidGenerator } from '@/infrastructure/id/UuidGenerator';
import { LoginUseCase } from '@/application/use-cases/admin/Login';
import { ListAdminsUseCase } from '@/application/use-cases/admin/ListAdmins';
import { CreateAdminUseCase } from '@/application/use-cases/admin/CreateAdmin';
import { ToggleAdminActiveUseCase } from '@/application/use-cases/admin/ToggleAdminActive';
import { ResetAdminPasswordUseCase } from '@/application/use-cases/admin/ResetAdminPassword';
import { Admin } from '@/domain/entities/Admin';

describe('Admin Management Use Cases — Integration', () => {
  let db: Database.Database;
  let adminRepo: SqliteAdminRepository;
  let passwordHasher: BcryptPasswordHasher;
  let jwtService: JwtAuthService;
  let idGenerator: UuidGenerator;
  let login: LoginUseCase;
  let listAdmins: ListAdminsUseCase;
  let createAdmin: CreateAdminUseCase;
  let toggleAdminActive: ToggleAdminActiveUseCase;
  let resetAdminPassword: ResetAdminPasswordUseCase;

  const seedPassword = 'seedpass123';
  const seedAdminId = 'admin-seed';

  beforeEach(async () => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    runMigrations(db);

    adminRepo = new SqliteAdminRepository(db);
    passwordHasher = new BcryptPasswordHasher();
    jwtService = new JwtAuthService('integration-test-secret', 8);
    idGenerator = new UuidGenerator();

    login = new LoginUseCase(adminRepo, passwordHasher, jwtService);
    listAdmins = new ListAdminsUseCase(adminRepo);
    createAdmin = new CreateAdminUseCase(adminRepo, passwordHasher, idGenerator);
    toggleAdminActive = new ToggleAdminActiveUseCase(adminRepo);
    resetAdminPassword = new ResetAdminPasswordUseCase(adminRepo, passwordHasher);

    const hash = await passwordHasher.hash(seedPassword);
    const admin = new Admin({
      id: seedAdminId,
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

  it('should list admins including the seeded admin', async () => {
    const admins = await listAdmins.execute();

    expect(admins).toHaveLength(1);
    expect(admins[0].username).toBe('admin');
    expect(admins[0]).not.toHaveProperty('passwordHash');
  });

  it('should create a new admin', async () => {
    const result = await createAdmin.execute({ username: 'newadmin', password: 'securepass123' });

    expect(result.username).toBe('newadmin');
    expect(result.mustChangePassword).toBe(true);
    expect(result.isActive).toBe(true);

    const admins = await listAdmins.execute();
    expect(admins).toHaveLength(2);
  });

  it('should reject creating admin with duplicate username', async () => {
    await expect(
      createAdmin.execute({ username: 'admin', password: 'securepass123' }),
    ).rejects.toMatchObject({ code: 'USERNAME_ALREADY_EXISTS' });
  });

  it('should deactivate an admin and prevent login', async () => {
    const created = await createAdmin.execute({ username: 'target', password: 'securepass123' });

    await toggleAdminActive.execute(created.id, seedAdminId);

    await expect(
      login.execute({ username: 'target', password: 'securepass123' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('should reactivate an admin and allow login', async () => {
    const created = await createAdmin.execute({ username: 'target', password: 'securepass123' });

    // Deactivate
    await toggleAdminActive.execute(created.id, seedAdminId);
    // Reactivate
    const reactivated = await toggleAdminActive.execute(created.id, seedAdminId);

    expect(reactivated.isActive).toBe(true);

    const loginResult = await login.execute({ username: 'target', password: 'securepass123' });
    expect(loginResult.token).toBeTruthy();
  });

  it('should reset admin password and set mustChangePassword', async () => {
    const created = await createAdmin.execute({ username: 'target', password: 'oldpass12345' });

    await resetAdminPassword.execute(created.id, seedAdminId, 'newpass12345');

    const loginResult = await login.execute({ username: 'target', password: 'newpass12345' });
    expect(loginResult.mustChangePassword).toBe(true);
  });

  it('should reject login with old password after reset', async () => {
    const created = await createAdmin.execute({ username: 'target', password: 'oldpass12345' });

    await resetAdminPassword.execute(created.id, seedAdminId, 'newpass12345');

    await expect(
      login.execute({ username: 'target', password: 'oldpass12345' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });
  });

  it('should prevent self-toggle', async () => {
    await expect(
      toggleAdminActive.execute(seedAdminId, seedAdminId),
    ).rejects.toMatchObject({ code: 'CANNOT_MODIFY_SELF' });
  });

  it('should prevent self-password-reset', async () => {
    await expect(
      resetAdminPassword.execute(seedAdminId, seedAdminId, 'newpass12345'),
    ).rejects.toMatchObject({ code: 'CANNOT_MODIFY_SELF' });
  });
});
