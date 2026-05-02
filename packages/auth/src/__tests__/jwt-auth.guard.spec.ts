import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../constants/auth.constants';

/**
 * Tests de JwtAuthGuard.
 *
 * El guard extiende AuthGuard('jwt') de Passport, cuyo comportamiento
 * real no testeamos aquí (eso es responsabilidad de la librería).
 * Lo que testeamos es la lógica propia: el soporte para @Public().
 */
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  const mockExecutionContext = (isPublic: boolean): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: 'Bearer token' } }),
      }),
    }) as unknown as ExecutionContext;

  it('deja pasar la solicitud cuando la ruta está marcada como @Public()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const context = mockExecutionContext(true);
    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('delega en Passport cuando la ruta no está marcada como @Public()', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    /** Mockeamos super.canActivate para evitar ejecutar Passport en el test */
    const superCanActivate = jest
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(true);

    const context = mockExecutionContext(false);
    guard.canActivate(context);

    expect(superCanActivate).toHaveBeenCalledWith(context);
  });
});
