import Database from 'better-sqlite3';
import { runMigrations } from '@/infrastructure/database/migrations';
import { SqliteMeetingRepository } from '@/infrastructure/repositories/SqliteMeetingRepository';
import { SqliteQuestionRepository } from '@/infrastructure/repositories/SqliteQuestionRepository';
import { SqliteAdminRepository } from '@/infrastructure/repositories/SqliteAdminRepository';
import { BcryptPasswordHasher } from '@/infrastructure/security/BcryptPasswordHasher';
import { InMemoryRateLimiter } from '@/infrastructure/security/InMemoryRateLimiter';
import { XssSanitizer } from '@/infrastructure/security/XssSanitizer';
import { UuidGenerator } from '@/infrastructure/id/UuidGenerator';
import { JwtAuthService } from '@/infrastructure/auth/JwtAuthService';
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
import { Container } from '@/infrastructure/container';

export function createTestContainer(): Container {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
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
