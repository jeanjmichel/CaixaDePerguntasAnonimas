import Database from 'better-sqlite3';
import { IMeetingRepository } from '@/domain/ports/IMeetingRepository';
import { IQuestionRepository } from '@/domain/ports/IQuestionRepository';
import { IAdminRepository } from '@/domain/ports/IAdminRepository';
import { IPasswordHasher } from '@/domain/ports/IPasswordHasher';
import { IIdGenerator } from '@/domain/ports/IIdGenerator';
import { IRateLimiter } from '@/domain/ports/IRateLimiter';
import { ISanitizer } from '@/domain/ports/ISanitizer';
import { IJwtService } from '@/domain/ports/IJwtService';
import { getDatabase } from './database/connection';
import { runMigrations } from './database/migrations';
import { SqliteMeetingRepository } from './repositories/SqliteMeetingRepository';
import { SqliteQuestionRepository } from './repositories/SqliteQuestionRepository';
import { SqliteAdminRepository } from './repositories/SqliteAdminRepository';
import { BcryptPasswordHasher } from './security/BcryptPasswordHasher';
import { InMemoryRateLimiter } from './security/InMemoryRateLimiter';
import { XssSanitizer } from './security/XssSanitizer';
import { UuidGenerator } from './id/UuidGenerator';
import { JwtAuthService } from './auth/JwtAuthService';
import { GetOpenMeetingUseCase } from '@/application/use-cases/public/GetOpenMeeting';
import { ListAvatarsUseCase } from '@/application/use-cases/public/ListAvatars';
import { SubmitQuestionUseCase } from '@/application/use-cases/public/SubmitQuestion';
import { LoginUseCase } from '@/application/use-cases/admin/Login';
import { ChangeOwnPasswordUseCase } from '@/application/use-cases/admin/ChangeOwnPassword';
import { GetCurrentAdminUseCase } from '@/application/use-cases/admin/GetCurrentAdmin';
import { CreateMeetingUseCase } from '@/application/use-cases/meetings/CreateMeeting';
import { UpdateMeetingUseCase } from '@/application/use-cases/meetings/UpdateMeeting';
import { ListMeetingsUseCase } from '@/application/use-cases/meetings/ListMeetings';
import { OpenMeetingForSubmissionsUseCase } from '@/application/use-cases/meetings/OpenMeetingForSubmissions';
import { CloseMeetingForSubmissionsUseCase } from '@/application/use-cases/meetings/CloseMeetingForSubmissions';
import { ListQuestionsByStatusUseCase } from '@/application/use-cases/questions/ListQuestionsByStatus';
import { SelectQuestionUseCase } from '@/application/use-cases/questions/SelectQuestion';
import { DiscardQuestionUseCase } from '@/application/use-cases/questions/DiscardQuestion';
import { AnswerQuestionUseCase } from '@/application/use-cases/questions/AnswerQuestion';
import { ListAdminsUseCase } from '@/application/use-cases/admin/ListAdmins';
import { CreateAdminUseCase } from '@/application/use-cases/admin/CreateAdmin';
import { ToggleAdminActiveUseCase } from '@/application/use-cases/admin/ToggleAdminActive';
import { ResetAdminPasswordUseCase } from '@/application/use-cases/admin/ResetAdminPassword';
import { ApplicationBootstrapper } from '@/application/bootstrap/ApplicationBootstrapper';
import { SqliteMigrationRunner } from './bootstrap/SqliteMigrationRunner';
import { EnvironmentBootstrapConfigProvider } from './bootstrap/EnvironmentBootstrapConfigProvider';

export interface Container {
  db: Database.Database;
  meetingRepository: IMeetingRepository;
  questionRepository: IQuestionRepository;
  adminRepository: IAdminRepository;
  passwordHasher: IPasswordHasher;
  idGenerator: IIdGenerator;
  rateLimiter: IRateLimiter;
  sanitizer: ISanitizer;
  jwtService: IJwtService;
  getOpenMeeting: GetOpenMeetingUseCase;
  listAvatars: ListAvatarsUseCase;
  submitQuestion: SubmitQuestionUseCase;
  login: LoginUseCase;
  changeOwnPassword: ChangeOwnPasswordUseCase;
  getCurrentAdmin: GetCurrentAdminUseCase;
  createMeeting: CreateMeetingUseCase;
  updateMeeting: UpdateMeetingUseCase;
  listMeetings: ListMeetingsUseCase;
  openMeetingForSubmissions: OpenMeetingForSubmissionsUseCase;
  closeMeetingForSubmissions: CloseMeetingForSubmissionsUseCase;
  listQuestionsByStatus: ListQuestionsByStatusUseCase;
  selectQuestion: SelectQuestionUseCase;
  discardQuestion: DiscardQuestionUseCase;
  answerQuestion: AnswerQuestionUseCase;
  listAdmins: ListAdminsUseCase;
  createAdmin: CreateAdminUseCase;
  toggleAdminActive: ToggleAdminActiveUseCase;
  resetAdminPassword: ResetAdminPasswordUseCase;
}

let container: Container | null = null;
let bootstrapPromise: Promise<void> | null = null;

export function bootstrapApplication(): Promise<void> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = (async () => {
    try {
      const db = getDatabase();
      const migrationRunner = new SqliteMigrationRunner(db);
      const adminRepository = new SqliteAdminRepository(db);
      const passwordHasher = new BcryptPasswordHasher();
      const idGenerator = new UuidGenerator();
      const configProvider = new EnvironmentBootstrapConfigProvider();

      const bootstrapper = new ApplicationBootstrapper(
        migrationRunner,
        adminRepository,
        passwordHasher,
        idGenerator,
        configProvider,
      );

      await bootstrapper.execute();
    } catch (error) {
      console.error('[Bootstrap] Failed', error);
      throw error;
    }
  })();

  return bootstrapPromise;
}

export async function ensureBootstrap(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapApplication();
  }
  await bootstrapPromise;
}

export function getContainer(): Container {
  if (container) {
    return container;
  }

  const db = getDatabase();

  const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
  const rateLimitMaxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5', 10);

  const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-me';
  const jwtExpirationHours = parseInt(process.env.JWT_EXPIRATION_HOURS || '8', 10);

  const meetingRepository = new SqliteMeetingRepository(db);
  const questionRepository = new SqliteQuestionRepository(db);
  const adminRepository = new SqliteAdminRepository(db);
  const passwordHasher = new BcryptPasswordHasher();
  const idGenerator = new UuidGenerator();
  const rateLimiter = new InMemoryRateLimiter(rateLimitWindowMs, rateLimitMaxRequests);
  const sanitizer = new XssSanitizer();
  const jwtService = new JwtAuthService(jwtSecret, jwtExpirationHours);

  container = {
    db,
    meetingRepository,
    questionRepository,
    adminRepository,
    passwordHasher,
    idGenerator,
    rateLimiter,
    sanitizer,
    jwtService,
    getOpenMeeting: new GetOpenMeetingUseCase(meetingRepository),
    listAvatars: new ListAvatarsUseCase(),
    submitQuestion: new SubmitQuestionUseCase(meetingRepository, questionRepository, rateLimiter, sanitizer, idGenerator),
    login: new LoginUseCase(adminRepository, passwordHasher, jwtService),
    changeOwnPassword: new ChangeOwnPasswordUseCase(adminRepository, passwordHasher),
    getCurrentAdmin: new GetCurrentAdminUseCase(adminRepository),
    createMeeting: new CreateMeetingUseCase(meetingRepository, idGenerator),
    updateMeeting: new UpdateMeetingUseCase(meetingRepository),
    listMeetings: new ListMeetingsUseCase(meetingRepository),
    openMeetingForSubmissions: new OpenMeetingForSubmissionsUseCase(meetingRepository),
    closeMeetingForSubmissions: new CloseMeetingForSubmissionsUseCase(meetingRepository),
    listQuestionsByStatus: new ListQuestionsByStatusUseCase(questionRepository),
    selectQuestion: new SelectQuestionUseCase(questionRepository),
    discardQuestion: new DiscardQuestionUseCase(questionRepository),
    answerQuestion: new AnswerQuestionUseCase(questionRepository),
    listAdmins: new ListAdminsUseCase(adminRepository),
    createAdmin: new CreateAdminUseCase(adminRepository, passwordHasher, idGenerator),
    toggleAdminActive: new ToggleAdminActiveUseCase(adminRepository),
    resetAdminPassword: new ResetAdminPasswordUseCase(adminRepository, passwordHasher),
  };

  return container;
}

export function createTestContainer(db: Database.Database): Container {
  runMigrations(db);

  const meetingRepository = new SqliteMeetingRepository(db);
  const questionRepository = new SqliteQuestionRepository(db);
  const adminRepository = new SqliteAdminRepository(db);
  const passwordHasher = new BcryptPasswordHasher();
  const idGenerator = new UuidGenerator();
  const rateLimiter = new InMemoryRateLimiter(60000, 5);
  const sanitizer = new XssSanitizer();
  const jwtService = new JwtAuthService('test-secret', 8);

  return {
    db,
    meetingRepository,
    questionRepository,
    adminRepository,
    passwordHasher,
    idGenerator,
    rateLimiter,
    sanitizer,
    jwtService,
    getOpenMeeting: new GetOpenMeetingUseCase(meetingRepository),
    listAvatars: new ListAvatarsUseCase(),
    submitQuestion: new SubmitQuestionUseCase(meetingRepository, questionRepository, rateLimiter, sanitizer, idGenerator),
    login: new LoginUseCase(adminRepository, passwordHasher, jwtService),
    changeOwnPassword: new ChangeOwnPasswordUseCase(adminRepository, passwordHasher),
    getCurrentAdmin: new GetCurrentAdminUseCase(adminRepository),
    createMeeting: new CreateMeetingUseCase(meetingRepository, idGenerator),
    updateMeeting: new UpdateMeetingUseCase(meetingRepository),
    listMeetings: new ListMeetingsUseCase(meetingRepository),
    openMeetingForSubmissions: new OpenMeetingForSubmissionsUseCase(meetingRepository),
    closeMeetingForSubmissions: new CloseMeetingForSubmissionsUseCase(meetingRepository),
    listQuestionsByStatus: new ListQuestionsByStatusUseCase(questionRepository),
    selectQuestion: new SelectQuestionUseCase(questionRepository),
    discardQuestion: new DiscardQuestionUseCase(questionRepository),
    answerQuestion: new AnswerQuestionUseCase(questionRepository),
    listAdmins: new ListAdminsUseCase(adminRepository),
    createAdmin: new CreateAdminUseCase(adminRepository, passwordHasher, idGenerator),
    toggleAdminActive: new ToggleAdminActiveUseCase(adminRepository),
    resetAdminPassword: new ResetAdminPasswordUseCase(adminRepository, passwordHasher),
  };
}
