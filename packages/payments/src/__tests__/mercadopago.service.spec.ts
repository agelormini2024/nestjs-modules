import { Test, TestingModule } from '@nestjs/testing';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { PAYMENTS_OPTIONS } from '../constants/payments.constants';
import { MercadoPagoService } from '../providers/mercadopago/mercadopago.service';

/**
 * Tests de MercadoPagoService.
 *
 * Mockeamos el SDK de MercadoPago completo para evitar llamadas reales a la API.
 * El SDK de MP usa clases instanciables (`new Preference(client)`), por lo que
 * mockeamos cada clase por separado.
 */
jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
  Preference: jest.fn().mockImplementation(() => ({
    create: jest.fn(),
  })),
  Payment: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    create: jest.fn(),
  })),
}));

const MockedPreference = Preference as jest.MockedClass<typeof Preference>;
const MockedPayment = Payment as jest.MockedClass<typeof Payment>;

describe('MercadoPagoService', () => {
  let service: MercadoPagoService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MercadoPagoService,
        {
          provide: PAYMENTS_OPTIONS,
          useValue: {
            mercadopago: {
              accessToken: 'TEST-mock-access-token',
              webhookSecret: 'mock-webhook-secret',
            },
          },
        },
      ],
    }).compile();

    service = module.get<MercadoPagoService>(MercadoPagoService);
  });

  describe('createPreference', () => {
    it('crea una preferencia de pago con los ítems correctos', async () => {
      const mockPreferenceResponse = {
        id: 'pref_mock_123',
        init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref_mock_123',
      };

      const mockCreate = jest.fn().mockResolvedValue(mockPreferenceResponse);
      MockedPreference.mockImplementation(() => ({ create: mockCreate }) as any);

      const body = {
        items: [{ id: 'prod-1', title: 'Plan Premium', quantity: 1, unit_price: 9999 }],
      };

      const result = await service.createPreference(body as any);

      expect(mockCreate).toHaveBeenCalledWith({ body });
      expect(result).toEqual(mockPreferenceResponse);
    });
  });

  describe('getPayment', () => {
    it('obtiene un pago por ID', async () => {
      const mockPaymentResponse = {
        id: '123456789',
        status: 'approved',
        external_reference: 'order-123',
      };

      const mockGet = jest.fn().mockResolvedValue(mockPaymentResponse);
      MockedPayment.mockImplementation(() => ({ get: mockGet, create: jest.fn() }) as any);

      const result = await service.getPayment('123456789');

      expect(mockGet).toHaveBeenCalledWith({ id: '123456789' });
      expect(result).toEqual(mockPaymentResponse);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('no lanza error cuando la firma es válida', () => {
      const crypto = require('crypto');
      const secret = 'mock-webhook-secret';
      const ts = '1234567890';
      const xRequestId = 'req-abc';
      const dataId = 'pay-123';
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
      const validHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
      const xSignature = `ts=${ts},v1=${validHash}`;

      expect(() => service.verifyWebhookSignature(xSignature, xRequestId, dataId)).not.toThrow();
    });

    it('lanza error cuando la firma es inválida', () => {
      const xSignature = 'ts=1234567890,v1=firma-invalida';
      expect(() => service.verifyWebhookSignature(xSignature, 'req-id', 'pay-id')).toThrow(
        'Firma de webhook de MercadoPago inválida',
      );
    });

    it('lanza error si webhookSecret no está configurado', async () => {
      const module = await Test.createTestingModule({
        providers: [
          MercadoPagoService,
          {
            provide: PAYMENTS_OPTIONS,
            useValue: {
              mercadopago: { accessToken: 'TEST-token' }, // sin webhookSecret
            },
          },
        ],
      }).compile();

      const serviceWithoutSecret = module.get<MercadoPagoService>(MercadoPagoService);

      expect(() =>
        serviceWithoutSecret.verifyWebhookSignature('ts=1,v1=hash', 'req', 'id'),
      ).toThrow('webhookSecret no está configurado');
    });
  });

  describe('cuando MercadoPago no está configurado', () => {
    it('lanza error descriptivo al intentar usar el servicio', async () => {
      const module = await Test.createTestingModule({
        providers: [
          MercadoPagoService,
          {
            provide: PAYMENTS_OPTIONS,
            useValue: { stripe: { apiKey: 'sk_test' } }, // sin mercadopago
          },
        ],
      }).compile();

      const unconfiguredService = module.get<MercadoPagoService>(MercadoPagoService);

      await expect(unconfiguredService.createPreference({} as any)).rejects.toThrow(
        'MercadoPagoService no está configurado',
      );
    });
  });
});
