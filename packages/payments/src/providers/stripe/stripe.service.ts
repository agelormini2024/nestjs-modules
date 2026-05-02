import { Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PAYMENTS_OPTIONS } from '../../constants/payments.constants';
import { PaymentsModuleOptions } from '../../interfaces/payments-module-options.interface';

/**
 * Servicio que encapsula la integración con Stripe.
 *
 * Expone los casos de uso más comunes: cobros, reembolsos y verificación de webhooks.
 * El cliente de Stripe se inicializa solo si las opciones de Stripe están presentes
 * en la configuración del módulo, lo que permite usar solo MercadoPago si se prefiere.
 *
 * Todos los métodos delegan en el SDK oficial de Stripe. Los tipos de los parámetros
 * y respuestas son los del SDK (`Stripe.PaymentIntentCreateParams`, etc.),
 * por lo que IntelliSense muestra todas las opciones disponibles.
 */
@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: Stripe | null = null;
  private readonly webhookSecret: string | undefined;

  constructor(@Inject(PAYMENTS_OPTIONS) options: PaymentsModuleOptions) {
    if (options.stripe) {
      this.client = new Stripe(options.stripe.apiKey, { apiVersion: '2025-02-24.acacia' });
      this.webhookSecret = options.stripe.webhookSecret;
      this.logger.log('StripeService inicializado');
    }
  }

  /**
   * Retorna el cliente de Stripe inicializado.
   * Lanza un error descriptivo si Stripe no fue configurado en el módulo,
   * para que el desarrollador entienda qué falta sin tener que buscar en el stack trace.
   */
  private get stripe(): Stripe {
    if (!this.client) {
      throw new Error(
        'StripeService no está configurado. Agregá la opción `stripe` en PaymentsModule.forRootAsync().',
      );
    }
    return this.client;
  }

  /**
   * Crea un PaymentIntent en Stripe.
   *
   * Un PaymentIntent representa la intención de cobrar al cliente. Es el punto
   * de partida del flujo de pago con Stripe Elements o el SDK de iOS/Android.
   * El `clientSecret` que retorna se envía al frontend para completar el pago.
   *
   * @example
   * const intent = await this.stripeService.createPaymentIntent({
   *   amount: 5000,        // en centavos: $50.00 USD
   *   currency: 'usd',
   *   metadata: { orderId: '123' },
   * });
   * return { clientSecret: intent.client_secret };
   */
  async createPaymentIntent(
    params: Stripe.PaymentIntentCreateParams,
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create(params);
  }

  /**
   * Obtiene un PaymentIntent por ID. Útil para verificar el estado de un pago.
   */
  async retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(id);
  }

  /**
   * Crea un reembolso total o parcial sobre un PaymentIntent existente.
   *
   * @example
   * // Reembolso total
   * await this.stripeService.createRefund({ payment_intent: 'pi_...' });
   *
   * // Reembolso parcial de $10.00
   * await this.stripeService.createRefund({ payment_intent: 'pi_...', amount: 1000 });
   */
  async createRefund(params: Stripe.RefundCreateParams): Promise<Stripe.Refund> {
    return this.stripe.refunds.create(params);
  }

  /**
   * Crea o actualiza un Customer en Stripe. Sirve para asociar pagos a un usuario
   * y guardar métodos de pago para cobros futuros (suscripciones, etc.).
   */
  async createCustomer(params: Stripe.CustomerCreateParams): Promise<Stripe.Customer> {
    return this.stripe.customers.create(params);
  }

  /**
   * Verifica la firma del webhook de Stripe y retorna el evento parseado.
   *
   * Los webhooks permiten que Stripe notifique al servidor cuando ocurre un evento
   * (pago exitoso, reembolso, disputa, etc.). La verificación de firma garantiza
   * que el request viene realmente de Stripe y no de un tercero.
   *
   * Importante: el `payload` debe ser el body RAW (Buffer), no el objeto parseado.
   * En NestJS se logra con `@RawBody()` o configurando `rawBody: true` en el bootstrap.
   *
   * @example
   * @Post('webhook')
   * handleWebhook(
   *   @RawBody() payload: Buffer,
   *   @Headers('stripe-signature') signature: string,
   * ) {
   *   const event = this.stripeService.constructWebhookEvent(payload, signature);
   *   switch (event.type) {
   *     case 'payment_intent.succeeded': ...
   *   }
   * }
   */
  constructWebhookEvent(payload: Buffer | string, signature: string): Stripe.Event {
    if (!this.webhookSecret) {
      throw new Error(
        'webhookSecret no está configurado en StripeService. ' +
          'Agregá `stripe.webhookSecret` en PaymentsModule.forRootAsync().',
      );
    }
    return this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret);
  }
}
