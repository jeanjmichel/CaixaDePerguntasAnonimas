/**
 * Provides configuration for initial admin seeding during bootstrap.
 *
 * - `username` always has a value (falls back to 'admin' when SEED_ADMIN_USERNAME is unset)
 * - `password` is `undefined` when SEED_ADMIN_PASSWORD env var is missing or empty
 */
export interface SeedAdminConfig {
  username: string;
  password: string | undefined;
}

export interface IBootstrapConfigProvider {
  getSeedAdminConfig(): SeedAdminConfig;
}
