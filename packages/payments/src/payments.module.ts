import { DynamicModule, Module } from '@nestjs/common';
import { PAYMENTS_OPTIONS } from './constants/payments.constants';
import type { PaymentsModuleAsyncOptions } from './interfaces/payments-module-options.interface';
import { MercadoPagoService } from './providers/mercadopago/mercadopago.service';
import { StripeService } from './providers/stripe/stripe.service';

/**
 * Módulo de pagos. Registra `StripeService` y `MercadoPagoService` en el
 * contenedor de NestJS y los exporta para que cualquier módulo del proyecto
 * pueda inyectarlos.
 *
 * Ambos servicios se registran siempre, pero cada uno se inicializa solo si
 * su configuración está presente. Si se intenta usar un servicio no configurado,
 * se lanza un error descriptivo en el primer uso.
 *
 * @example
 * // app.module.ts
 * @Module({
 *   imports: [
 *     PaymentsModule.forRootAsync({
 *       useFactory: (config: ConfigService) => ({
 *         stripe: {
 *           apiKey: config.get('STRIPE_SECRET_KEY'),
 *           webhookSecret: config.get('STRIPE_WEBHOOK_SECRET'),
 *         },
 *         mercadopago: {
 *           accessToken: config.get('MP_ACCESS_TOKEN'),
 *           webhookSecret: config.get('MP_WEBHOOK_SECRET'),
 *         },
 *       }),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 */
@Module({})
export class PaymentsModule {
  static forRootAsync(asyncOptions: PaymentsModuleAsyncOptions): DynamicModule {
    return {
      module: PaymentsModule,
      global: true,
      imports: asyncOptions.imports ?? [],
      providers: [
        {
          provide: PAYMENTS_OPTIONS,
          useFactory: asyncOptions.useFactory,
          inject: asyncOptions.inject ?? [],
        },
        StripeService,
        MercadoPagoService,
      ],
      exports: [StripeService, MercadoPagoService],
    };
  }
}
