import { IBootstrapConfigProvider, SeedAdminConfig } from '@/domain/ports/IBootstrapConfigProvider';

/**
 * Reads bootstrap configuration from environment variables.
 *
 * - SEED_ADMIN_USERNAME: falls back to 'admin' when unset or empty
 * - SEED_ADMIN_PASSWORD: returns undefined when unset or empty (bootstrap skips admin creation)
 */
export class EnvironmentBootstrapConfigProvider implements IBootstrapConfigProvider {
  getSeedAdminConfig(): SeedAdminConfig {
    const rawUsername = process.env.SEED_ADMIN_USERNAME;
    const username = rawUsername && rawUsername.trim() !== '' ? rawUsername.trim() : 'admin';

    const rawPassword = process.env.SEED_ADMIN_PASSWORD;
    const password = rawPassword && rawPassword.trim() !== '' ? rawPassword : undefined;

    return { username, password };
  }
}
