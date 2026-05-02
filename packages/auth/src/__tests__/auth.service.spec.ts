import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth.service';
import { USER_REPOSITORY } from '../constants/auth.constants';
import { AuthUser } from '../interfaces/user-repository.interface';

/**
 * Tests de AuthService.
 *
 * Usamos `@nestjs/testing` para crear un módulo de prueba que simula el
 * entorno de NestJS sin levantar un servidor HTTP real. Esto nos permite
 * probar el servicio de forma aislada, con dependencias mockeadas.
 */
describe('AuthService', () => {
  let service: AuthService;

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: bcrypt.hashSync('password123', 10),
    roles: ['user'],
  };

  /** Mock del UserRepository: simula la DB sin necesitar una conexión real */
  const mockUserRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };

  /** Mock de JwtService: evita generar tokens reales en los tests */
  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('retorna el usuario sin password cuando las credenciales son correctas', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result?.email).toBe('test@example.com');
    });

    it('retorna null cuando el usuario no existe', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('noexiste@example.com', 'password123');

      expect(result).toBeNull();
    });

    it('retorna null cuando el password es incorrecto', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password-incorrecto');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('retorna accessToken y el usuario sin password', async () => {
      const { password: _, ...userWithoutPassword } = mockUser;

      const result = await service.login(userWithoutPassword);

      expect(result.accessToken).toBe('mock-jwt-token');
      expect(result.user).toEqual(userWithoutPassword);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        roles: mockUser.roles,
      });
    });
  });
});
