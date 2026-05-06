/**
 * @package @agelormini2024/payments
 *
 * Módulo de pagos reutilizable para NestJS.
 * Soporta Stripe y MercadoPago. Ambos proveedores son opcionales.
 */

// Módulo principal
export { PaymentsModule } from './payments.module';

// Servicios — para inyectar en los propios servicios del proyecto
export { StripeService } from './providers/stripe/stripe.service';
export { MercadoPagoService } from './providers/mercadopago/mercadopago.service';

// Interfaces — para configurar el módulo y tipar las opciones
export type {
  PaymentsModuleOptions,
  PaymentsModuleAsyncOptions,
  StripeOptions,
  MercadoPagoOptions,
} from './interfaces/payments-module-options.interface';
