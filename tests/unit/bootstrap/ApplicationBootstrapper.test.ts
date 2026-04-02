import { ApplicationBootstrapper } from '@/application/bootstrap/ApplicationBootstrapper';
import { IMigrationRunner } from '@/domain/ports/IMigrationRunner';
import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { IPasswordHasher } from '@/domain/ports/IPasswordHasher';
import { IIdGenerator } from '@/domain/ports/IIdGenerator';
import { IBootstrapConfigProvider } from '@/domain/ports/IBootstrapConfigProvider';
import { Admin } from '@/domain/entities/Admin';

describe('ApplicationBootstrapper', () => {
  let migrationRunner: jest.Mocked<IMigrationRunner>;
  let adminRepository: jest.Mocked<IAdminRepository>;
  let passwordHasher: jest.Mocked<IPasswordHasher>;
  let idGenerator: jest.Mocked<IIdGenerator>;
  let configProvider: jest.Mocked<IBootstrapConfigProvider>;
  let bootstrapper: ApplicationBootstrapper;
  let consoleSpy: jest.SpiedFunction<typeof console.log>;

  beforeEach(() => {
    migrationRunner = { run: jest.fn() };
    adminRepository = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };
    passwordHasher = {
      hash: jest.fn().mockResolvedValue('hashed-password'),
      compare: jest.fn(),
    };
    idGenerator = { generate: jest.fn().mockReturnValue('generated-id') };
    configProvider = {
      getSeedAdminConfig: jest.fn().mockReturnValue({
        username: 'admin',
        password: 'secret123',
      }),
    };

    bootstrapper = new ApplicationBootstrapper(
      migrationRunner,
      adminRepository,
      passwordHasher,
      idGenerator,
      configProvider,
    );

    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should run migrations before checking admin', async () => {
    adminRepository.findByUsername.mockResolvedValue(null);

    const callOrder: string[] = [];
    migrationRunner.run.mockImplementation(() => { callOrder.push('migrations'); });
    adminRepository.findByUsername.mockImplementation(async () => {
      callOrder.push('findByUsername');
      return null;
    });

    await bootstrapper.execute();

    expect(callOrder[0]).toBe('migrations');
    expect(callOrder[1]).toBe('findByUsername');
  });

  it('should create admin when none exists with isActive=true and mustChangePassword=true', async () => {
    adminRepository.findByUsername.mockResolvedValue(null);

    await bootstrapper.execute();

    expect(adminRepository.create).toHaveBeenCalledTimes(1);
    const createdAdmin: Admin = adminRepository.create.mock.calls[0][0];
    expect(createdAdmin.id).toBe('generated-id');
    expect(createdAdmin.username).toBe('admin');
    expect(createdAdmin.passwordHash).toBe('hashed-password');
    expect(createdAdmin.isActive).toBe(true);
    expect(createdAdmin.mustChangePassword).toBe(true);
  });

  it('should use username from config provider', async () => {
    configProvider.getSeedAdminConfig.mockReturnValue({
      username: 'custom-admin',
      password: 'secret123',
    });
    adminRepository.findByUsername.mockResolvedValue(null);

    await bootstrapper.execute();

    expect(adminRepository.findByUsername).toHaveBeenCalledWith('custom-admin');
    const createdAdmin: Admin = adminRepository.create.mock.calls[0][0];
    expect(createdAdmin.username).toBe('custom-admin');
  });

  it('should skip creation when admin already exists', async () => {
    const existingAdmin = new Admin({
      id: 'existing-id',
      username: 'admin',
      passwordHash: 'existing-hash',
      mustChangePassword: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    adminRepository.findByUsername.mockResolvedValue(existingAdmin);

    await bootstrapper.execute();

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(adminRepository.create).not.toHaveBeenCalled();
  });

  it('should not overwrite existing admin password', async () => {
    const existingAdmin = new Admin({
      id: 'existing-id',
      username: 'admin',
      passwordHash: 'original-hash',
      mustChangePassword: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    adminRepository.findByUsername.mockResolvedValue(existingAdmin);

    await bootstrapper.execute();

    expect(adminRepository.update).not.toHaveBeenCalled();
    expect(adminRepository.create).not.toHaveBeenCalled();
  });

  it('should skip admin creation when password is undefined', async () => {
    configProvider.getSeedAdminConfig.mockReturnValue({
      username: 'admin',
      password: undefined,
    });

    await bootstrapper.execute();

    expect(adminRepository.findByUsername).not.toHaveBeenCalled();
    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(adminRepository.create).not.toHaveBeenCalled();
  });

  it('should log correct messages when creating admin', async () => {
    adminRepository.findByUsername.mockResolvedValue(null);

    await bootstrapper.execute();

    const messages = consoleSpy.mock.calls.map(call => call[0]);
    expect(messages).toEqual([
      '[Bootstrap] Started',
      '[Bootstrap] Migrations completed',
      '[Bootstrap] Seed admin created',
      '[Bootstrap] Completed',
    ]);
  });

  it('should log correct messages when admin already exists', async () => {
    const existingAdmin = new Admin({
      id: 'existing-id',
      username: 'admin',
      passwordHash: 'hash',
      mustChangePassword: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    adminRepository.findByUsername.mockResolvedValue(existingAdmin);

    await bootstrapper.execute();

    const messages = consoleSpy.mock.calls.map(call => call[0]);
    expect(messages).toEqual([
      '[Bootstrap] Started',
      '[Bootstrap] Migrations completed',
      '[Bootstrap] Seed admin already exists',
      '[Bootstrap] Completed',
    ]);
  });

  it('should log correct messages when password is missing', async () => {
    configProvider.getSeedAdminConfig.mockReturnValue({
      username: 'admin',
      password: undefined,
    });

    await bootstrapper.execute();

    const messages = consoleSpy.mock.calls.map(call => call[0]);
    expect(messages).toEqual([
      '[Bootstrap] Started',
      '[Bootstrap] Migrations completed',
      '[Bootstrap] Skipped: missing seed password',
      '[Bootstrap] Completed',
    ]);
  });

  it('should propagate migration errors', async () => {
    const migrationError = new Error('Migration failed');
    migrationRunner.run.mockImplementation(() => { throw migrationError; });

    await expect(bootstrapper.execute()).rejects.toThrow('Migration failed');

    expect(adminRepository.findByUsername).not.toHaveBeenCalled();
    expect(adminRepository.create).not.toHaveBeenCalled();
  });
});
