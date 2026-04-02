export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const { bootstrapApplication } = await import('@/infrastructure/container');
  bootstrapApplication().catch(() => {});
}
