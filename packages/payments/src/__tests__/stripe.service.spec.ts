import { Test, TestingModule } from '@nestjs/testing';
import Stripe from 'stripe';
import { PAYMENTS_OPTIONS } from '../constants/payments.constants';
import { StripeService } from '../providers/stripe/stripe.service';

/**
 * Tests de StripeService.
 *
 * Mockeamos el constructor de Stripe para evitar llamadas reales a la API.
 * `jest.mock('stripe')` reemplaza el módulo completo por una versión mock
 * donde el constructor y todos sus métodos son jest.fn().
 */
jest.mock('stripe');

const MockedStripe = Stripe as jest.MockedClass<typeof Stripe>;

describe('StripeService', () => {
  let service: StripeService;

  const mockPaymentIntents = {
    create: jest.fn(),
    retrieve: jest.fn(),
  };

  const mockRefunds = {
    create: jest.fn(),
  };

  const mockCustomers = {
    create: jest.fn(),
  };

  const mockWebhooks = {
    constructEvent: jest.fn(),
  };

  beforeEach(async () => {
    MockedStripe.mockImplementation(
      () =>
        ({
          paymentIntents: mockPaymentIntents,
          refunds: mockRefunds,
          customers: mockCustomers,
          webhooks: mockWebhooks,
        }) as any,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: PAYMENTS_OPTIONS,
          useValue: {
            stripe: {
              apiKey: 'sk_test_mock',
              webhookSecret: 'whsec_mock',
            },
          },
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('llama a stripe.paymentIntents.create con los parámetros correctos', async () => {
      const mockIntent = { id: 'pi_mock', client_secret: 'secret_mock' };
      mockPaymentIntents.create.mockResolvedValue(mockIntent);

      const params = { amount: 5000, currency: 'usd' };
      const result = await service.createPaymentIntent(params);

      expect(mockPaymentIntents.create).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockIntent);
    });
  });

  describe('retrievePaymentIntent', () => {
    it('llama a stripe.paymentIntents.retrieve con el ID correcto', async () => {
      const mockIntent = { id: 'pi_mock', status: 'succeeded' };
      mockPaymentIntents.retrieve.mockResolvedValue(mockIntent);

      const result = await service.retrievePaymentIntent('pi_mock');

      expect(mockPaymentIntents.retrieve).toHaveBeenCalledWith('pi_mock');
      expect(result).toEqual(mockIntent);
    });
  });

  describe('createRefund', () => {
    it('llama a stripe.refunds.create con los parámetros correctos', async () => {
      const mockRefund = { id: 're_mock', status: 'succeeded' };
      mockRefunds.create.mockResolvedValue(mockRefund);

      const result = await service.createRefund({ payment_intent: 'pi_mock' });

      expect(mockRefunds.create).toHaveBeenCalledWith({ payment_intent: 'pi_mock' });
      expect(result).toEqual(mockRefund);
    });
  });

  describe('constructWebhookEvent', () => {
    it('verifica la firma y retorna el evento', () => {
      const mockEvent = { type: 'payment_intent.succeeded', data: {} };
      mockWebhooks.constructEvent.mockReturnValue(mockEvent);

      const result = service.constructWebhookEvent(Buffer.from('payload'), 'sig_mock');

      expect(mockWebhooks.constructEvent).toHaveBeenCalledWith(
        Buffer.from('payload'),
        'sig_mock',
        'whsec_mock',
      );
      expect(result).toEqual(mockEvent);
    });

    it('lanza error si webhookSecret no está configurado', async () => {
      const module = await Test.createTestingModule({
        providers: [
          StripeService,
          {
            provide: PAYMENTS_OPTIONS,
            useValue: { stripe: { apiKey: 'sk_test_mock' } }, // sin webhookSecret
          },
        ],
      }).compile();

      const serviceWithoutSecret = module.get<StripeService>(StripeService);

      expect(() =>
        serviceWithoutSecret.constructWebhookEvent(Buffer.from('payload'), 'sig'),
      ).toThrow('webhookSecret no está configurado');
    });
  });

  describe('cuando Stripe no está configurado', () => {
    it('lanza error descriptivo al intentar usar el servicio', async () => {
      const module = await Test.createTestingModule({
        providers: [
          StripeService,
          {
            provide: PAYMENTS_OPTIONS,
            useValue: { mercadopago: { accessToken: 'mp_token' } }, // sin stripe
          },
        ],
      }).compile();

      const unconfiguredService = module.get<StripeService>(StripeService);

      await expect(
        unconfiguredService.createPaymentIntent({ amount: 100, currency: 'usd' }),
      ).rejects.toThrow('StripeService no está configurado');
    });
  });
});
