export interface AvatarDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly icon: string;
}

const AVATARS: readonly AvatarDefinition[] = [
  { id: 'ARARA_AZUL', displayName: 'Arara-azul', icon: '🦜' },
  { id: 'ONCA_PINTADA', displayName: 'Onça-pintada', icon: '🐆' },
  { id: 'MICO_LEAO_DOURADO', displayName: 'Mico-leão-dourado', icon: '🐒' },
  { id: 'TAMANDUA_BANDEIRA', displayName: 'Tamanduá-bandeira', icon: '🐾' },
  { id: 'CAPIVARA', displayName: 'Capivara', icon: '🦫' },
  { id: 'QUERO_QUERO', displayName: 'Quero-quero', icon: '🐦' },
  { id: 'VEADO_CAMPEIRO', displayName: 'Veado-campeiro', icon: '🦌' },
  { id: 'BUGIO_RUIVO', displayName: 'Bugio-ruivo', icon: '🐵' },
  { id: 'JOAO_DE_BARRO', displayName: 'João-de-barro', icon: '🏠' },
  { id: 'EMA', displayName: 'Ema', icon: '🦅' },
] as const;

const AVATAR_MAP = new Map<string, AvatarDefinition>(
  AVATARS.map((a) => [a.id, a])
);

export const Avatar = {
  getAll(): readonly AvatarDefinition[] {
    return AVATARS;
  },

  findById(id: string): AvatarDefinition | undefined {
    return AVATAR_MAP.get(id);
  },

  isValid(id: string): boolean {
    return AVATAR_MAP.has(id);
  },

  random(): AvatarDefinition {
    const index = Math.floor(Math.random() * AVATARS.length);
    return AVATARS[index];
  },

  getAllIds(): string[] {
    return AVATARS.map((a) => a.id);
  },
} as const;
