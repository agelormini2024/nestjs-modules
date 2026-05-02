import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AUTH_OPTIONS, USER_REPOSITORY } from '../constants/auth.constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthUser } from '../interfaces/user-repository.interface';
import { JwtStrategy } from '../strategies/jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed',
    roles: ['user'],
  };

  const mockUserRepository = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };

  const mockAuthOptions = {
    secret: 'test-secret',
    expiresIn: '7d',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: AUTH_OPTIONS, useValue: mockAuthOptions },
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('retorna el usuario cuando el payload es válido y el usuario existe', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const payload: JwtPayload = { sub: 'user-123', email: 'test@example.com', roles: ['user'] };
      const result = await strategy.validate(payload);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
    });

    it('lanza UnauthorizedException cuando el usuario no existe en la DB', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const payload: JwtPayload = { sub: 'user-inexistente', email: 'test@example.com', roles: [] };

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
