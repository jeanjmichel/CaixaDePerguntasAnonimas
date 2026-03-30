import { ListAvatarsUseCase } from '@/application/use-cases/public/ListAvatars';

describe('ListAvatarsUseCase', () => {
  let useCase: ListAvatarsUseCase;

  beforeEach(() => {
    useCase = new ListAvatarsUseCase();
  });

  it('should return all 10 avatars', () => {
    const result = useCase.execute();

    expect(result).toHaveLength(10);
  });

  it('should return avatars with correct shape', () => {
    const result = useCase.execute();

    for (const avatar of result) {
      expect(avatar).toHaveProperty('id');
      expect(avatar).toHaveProperty('displayName');
      expect(avatar).toHaveProperty('icon');
      expect(typeof avatar.id).toBe('string');
      expect(typeof avatar.displayName).toBe('string');
      expect(typeof avatar.icon).toBe('string');
    }
  });
});
