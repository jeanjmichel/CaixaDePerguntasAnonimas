import { IMigrationRunner } from '@/domain/ports/IMigrationRunner';
import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { IPasswordHasher } from '@/domain/ports/IPasswordHasher';
import { IIdGenerator } from '@/domain/ports/IIdGenerator';
import { IBootstrapConfigProvider } from '@/domain/ports/IBootstrapConfigProvider';
import { Admin } from '@/domain/entities/Admin';

export class ApplicationBootstrapper {
  constructor(
    private readonly migrationRunner: IMigrationRunner,
    private readonly adminRepository: IAdminRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly idGenerator: IIdGenerator,
    private readonly configProvider: IBootstrapConfigProvider,
  ) {}

  async execute(): Promise<void> {
    console.log('[Bootstrap] Started');

    this.migrationRunner.run();
    console.log('[Bootstrap] Migrations completed');

    const { username, password } = this.configProvider.getSeedAdminConfig();

    if (password === undefined) {
      console.log('[Bootstrap] Skipped: missing seed password');
      console.log('[Bootstrap] Completed');
      return;
    }

    const existing = await this.adminRepository.findByUsername(username);

    if (existing) {
      console.log('[Bootstrap] Seed admin already exists');
      console.log('[Bootstrap] Completed');
      return;
    }

    const passwordHash = await this.passwordHasher.hash(password);
    const now = new Date();

    const admin = new Admin({
      id: this.idGenerator.generate(),
      username,
      passwordHash,
      mustChangePassword: true,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    await this.adminRepository.create(admin);
    console.log('[Bootstrap] Seed admin created');
    console.log('[Bootstrap] Completed');
  }
}
