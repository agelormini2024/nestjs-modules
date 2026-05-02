import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../guards/roles.guard';
import { AuthUser } from '../interfaces/user-repository.interface';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const mockContextWithUser = (user: Partial<AuthUser>): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('permite el acceso cuando la ruta no declara roles requeridos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = mockContextWithUser({ roles: ['user'] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('permite el acceso cuando el usuario tiene uno de los roles requeridos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin', 'editor']);

    const context = mockContextWithUser({ roles: ['editor'] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('deniega el acceso cuando el usuario no tiene ninguno de los roles requeridos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = mockContextWithUser({ roles: ['user'] });
    expect(guard.canActivate(context)).toBe(false);
  });

  it('deniega el acceso cuando el usuario no tiene roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);

    const context = mockContextWithUser({ roles: [] });
    expect(guard.canActivate(context)).toBe(false);
  });
});
