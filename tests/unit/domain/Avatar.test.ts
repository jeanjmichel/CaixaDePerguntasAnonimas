import { Avatar } from '@/domain/enums/Avatar';

describe('Avatar', () => {
  describe('getAll', () => {
    it('should return exactly 10 avatars', () => {
      const avatars = Avatar.getAll();
      expect(avatars).toHaveLength(10);
    });

    it('should contain all required avatars', () => {
      const ids = Avatar.getAllIds();
      expect(ids).toContain('ARARA_AZUL');
      expect(ids).toContain('ONCA_PINTADA');
      expect(ids).toContain('MICO_LEAO_DOURADO');
      expect(ids).toContain('TAMANDUA_BANDEIRA');
      expect(ids).toContain('CAPIVARA');
      expect(ids).toContain('QUERO_QUERO');
      expect(ids).toContain('VEADO_CAMPEIRO');
      expect(ids).toContain('BUGIO_RUIVO');
      expect(ids).toContain('JOAO_DE_BARRO');
      expect(ids).toContain('EMA');
    });

    it('each avatar should have id, displayName, and icon', () => {
      const avatars = Avatar.getAll();
      for (const avatar of avatars) {
        expect(avatar.id).toBeTruthy();
        expect(avatar.displayName).toBeTruthy();
        expect(avatar.icon).toBeTruthy();
      }
    });
  });

  describe('findById', () => {
    it('should find an existing avatar by id', () => {
      const avatar = Avatar.findById('CAPIVARA');
      expect(avatar).toBeDefined();
      expect(avatar!.displayName).toBe('Capivara');
      expect(avatar!.icon).toBe('🦫');
    });

    it('should return undefined for non-existent id', () => {
      const avatar = Avatar.findById('NON_EXISTENT');
      expect(avatar).toBeUndefined();
    });
  });

  describe('isValid', () => {
    it('should return true for valid avatar id', () => {
      expect(Avatar.isValid('ARARA_AZUL')).toBe(true);
    });

    it('should return false for invalid avatar id', () => {
      expect(Avatar.isValid('INVALID')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(Avatar.isValid('')).toBe(false);
    });
  });

  describe('random', () => {
    it('should return a valid avatar', () => {
      const avatar = Avatar.random();
      expect(avatar).toBeDefined();
      expect(avatar.id).toBeTruthy();
      expect(Avatar.isValid(avatar.id)).toBe(true);
    });

    it('should return avatars from the predefined list', () => {
      const allIds = new Set(Avatar.getAllIds());
      for (let i = 0; i < 50; i++) {
        const avatar = Avatar.random();
        expect(allIds.has(avatar.id)).toBe(true);
      }
    });
  });
});
