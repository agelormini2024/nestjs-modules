import { ModuleMetadata } from '@nestjs/common';

/** Opciones específicas de Stripe */
export interface StripeOptions {
  /** Clave secreta de la API de Stripe (empieza con `sk_live_` o `sk_test_`) */
  apiKey: string;

  /**
   * Secret para verificar la firma de los webhooks de Stripe.
   * Se obtiene en el dashboard de Stripe al crear un endpoint de webhook.
   * Requerido solo si el proyecto usa webhooks.
   */
  webhookSecret?: string;
}

/** Opciones específicas de MercadoPago */
export interface MercadoPagoOptions {
  /** Access token de la aplicación en MercadoPago (producción o sandbox) */
  accessToken: string;

  /**
   * Secret para verificar la firma de las notificaciones IPN/webhooks de MercadoPago.
   * Se configura en el panel de desarrolladores de MercadoPago.
   * Requerido solo si el proyecto valida firmas de webhooks.
   */
  webhookSecret?: string;
}

/**
 * Opciones de configuración del módulo de pagos.
 * Ambos proveedores son opcionales: si el proyecto solo usa Stripe,
 * no es necesario configurar MercadoPago y viceversa.
 */
export interface PaymentsModuleOptions {
  stripe?: StripeOptions;
  mercadopago?: MercadoPagoOptions;
}

/**
 * Opciones para configurar el módulo de forma asíncrona con `forRootAsync()`.
 * Mismo patrón que en AuthModule: permite leer la configuración desde
 * `ConfigService` u otros providers que se resuelven en runtime.
 *
 * @example
 * PaymentsModule.forRootAsync({
 *   useFactory: (config: ConfigService) => ({
 *     stripe: { apiKey: config.get('STRIPE_SECRET_KEY') },
 *     mercadopago: { accessToken: config.get('MP_ACCESS_TOKEN') },
 *   }),
 *   inject: [ConfigService],
 * })
 */
export interface PaymentsModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useFactory: (...args: any[]) => Promise<PaymentsModuleOptions> | PaymentsModuleOptions;
  inject?: any[];
}
