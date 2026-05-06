import { Inject, Injectable, Logger } from '@nestjs/common';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import type { PaymentResponse } from 'mercadopago/dist/clients/payment/commonTypes';
import type { PaymentCreateRequest } from 'mercadopago/dist/clients/payment/create/types';
import type { PreferenceResponse } from 'mercadopago/dist/clients/preference/commonTypes';
import type { PreferenceRequest } from 'mercadopago/dist/clients/preference/commonTypes';
import { PAYMENTS_OPTIONS } from '../../constants/payments.constants';
import type { PaymentsModuleOptions } from '../../interfaces/payments-module-options.interface';

/**
 * Servicio que encapsula la integración con MercadoPago.
 *
 * MercadoPago es la pasarela de pagos más usada en Argentina y LATAM.
 * Su SDK v2 (el actual) usa un cliente central `MercadoPagoConfig` del que
 * se instancian los recursos (`Preference`, `Payment`, etc.).
 *
 * Flujo típico en Argentina:
 *   1. El backend crea una Preference con los ítems del carrito
 *   2. MercadoPago retorna una URL de pago (`init_point`) que se redirige al usuario
 *   3. El usuario paga en la plataforma de MP
 *   4. MP notifica al backend vía webhook con el resultado
 *   5. El backend verifica el pago con `getPayment()`
 */
@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly mpClient: MercadoPagoConfig | null = null;
  private readonly webhookSecret: string | undefined;

  constructor(@Inject(PAYMENTS_OPTIONS) options: PaymentsModuleOptions) {
    if (options.mercadopago) {
      this.mpClient = new MercadoPagoConfig({
        accessToken: options.mercadopago.accessToken,
      });
      this.webhookSecret = options.mercadopago.webhookSecret;
      this.logger.log('MercadoPagoService inicializado');
    }
  }

  /**
   * Retorna el cliente de MercadoPago inicializado.
   * Lanza un error descriptivo si MP no fue configurado en el módulo.
   */
  private get client(): MercadoPagoConfig {
    if (!this.mpClient) {
      throw new Error(
        'MercadoPagoService no está configurado. Agregá la opción `mercadopago` en PaymentsModule.forRootAsync().',
      );
    }
    return this.mpClient;
  }

  /**
   * Crea una Preference de pago en MercadoPago.
   *
   * Una Preference define qué se vende, el precio y las URLs de retorno.
   * MercadoPago devuelve un `init_point` (URL de pago) que se redirige al usuario.
   * Para testing se usa `sandbox_init_point` en lugar de `init_point`.
   *
   * @example
   * const preference = await this.mpService.createPreference({
   *   items: [{
   *     id: 'prod-123',
   *     title: 'Plan Premium',
   *     quantity: 1,
   *     unit_price: 9999,        // en pesos argentinos
   *     currency_id: 'ARS',
   *   }],
   *   back_urls: {
   *     success: 'https://miapp.com/pago/exitoso',
   *     failure: 'https://miapp.com/pago/error',
   *     pending: 'https://miapp.com/pago/pendiente',
   *   },
   *   auto_return: 'approved',
   *   notification_url: 'https://miapp.com/webhooks/mercadopago',
   * });
   *
   * // Redirigir al usuario:
   * return { checkoutUrl: preference.init_point };
   */
  async createPreference(body: PreferenceRequest): Promise<PreferenceResponse> {
    const preference = new Preference(this.client);
    return preference.create({ body });
  }

  /**
   * Obtiene los detalles de un pago por su ID.
   *
   * Se usa principalmente en el handler del webhook para verificar el estado
   * real del pago antes de actualizar la base de datos.
   *
   * @example
   * // En el webhook handler:
   * const payment = await this.mpService.getPayment(paymentId);
   * if (payment.status === 'approved') {
   *   await this.ordersService.markAsPaid(payment.external_reference);
   * }
   */
  async getPayment(id: string): Promise<PaymentResponse> {
    const payment = new Payment(this.client);
    return payment.get({ id });
  }

  /**
   * Crea un pago directo en MercadoPago (sin Checkout Pro).
   * Útil para cobros con tarjeta vía la API transparente (Checkout API/Bricks).
   */
  async createPayment(body: PaymentCreateRequest): Promise<PaymentResponse> {
    const payment = new Payment(this.client);
    return payment.create({ body });
  }

  /**
   * Verifica la firma HMAC de un webhook de MercadoPago.
   *
   * MP envía la firma en el header `x-signature` con el formato:
   * `ts=<timestamp>,v1=<hash>`. Este método valida que el payload
   * no fue alterado en tránsito.
   *
   * @param xSignature - Valor del header `x-signature`
   * @param xRequestId - Valor del header `x-request-id`
   * @param dataId     - El `data.id` del body del webhook
   *
   * @example
   * @Post('webhook')
   * handleWebhook(
   *   @Body() body: any,
   *   @Headers('x-signature') xSignature: string,
   *   @Headers('x-request-id') xRequestId: string,
   * ) {
   *   this.mpService.verifyWebhookSignature(xSignature, xRequestId, body.data?.id);
   *   const payment = await this.mpService.getPayment(body.data.id);
   * }
   */
  verifyWebhookSignature(xSignature: string, xRequestId: string, dataId: string): void {
    if (!this.webhookSecret) {
      throw new Error(
        'webhookSecret no está configurado en MercadoPagoService. ' +
          'Agregá `mercadopago.webhookSecret` en PaymentsModule.forRootAsync().',
      );
    }

    const parts = xSignature.split(',');
    let ts: string | undefined;
    let hash: string | undefined;

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key?.trim() === 'ts') ts = value?.trim();
      if (key?.trim() === 'v1') hash = value?.trim();
    }

    if (!ts || !hash) {
      throw new Error('Formato de x-signature inválido');
    }

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // La verificación HMAC usa crypto de Node.js, disponible sin dependencias extra
    const crypto = require('crypto');
    const expectedHash = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(manifest)
      .digest('hex');

    if (expectedHash !== hash) {
      throw new Error('Firma de webhook de MercadoPago inválida');
    }
  }
}
