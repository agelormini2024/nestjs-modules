# @agelormini2024/payments

Módulo de pagos reutilizable para NestJS. Integra Stripe y MercadoPago como servicios independientes listos para inyectar. Ambos proveedores son opcionales: el proyecto puede usar solo uno o los dos.

## Qué incluye

- **`PaymentsModule`** — módulo dinámico que se configura con `forRootAsync()`
- **`StripeService`** — crear cobros, reembolsos, clientes y verificar webhooks con Stripe
- **`MercadoPagoService`** — crear preferencias, obtener pagos y verificar webhooks con MercadoPago

---

## Instalación

```bash
pnpm add @agelormini2024/payments
```

### Dependencias de pares (peer dependencies)

Solo instalar las del proveedor que el proyecto va a usar:

```bash
# Si usás Stripe:
pnpm add stripe@^17.0.0

# Si usás MercadoPago:
pnpm add mercadopago@^2.0.0

# NestJS (siempre requerido):
pnpm add @nestjs/common @nestjs/core reflect-metadata
```

---

## Configuración

### Registrar el módulo en `AppModule`

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentsModule } from '@agelormini2024/payments';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    PaymentsModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        // Ambos proveedores son opcionales.
        // Configurá solo el que el proyecto necesite.
        stripe: {
          apiKey: config.get('STRIPE_SECRET_KEY'),
          webhookSecret: config.get('STRIPE_WEBHOOK_SECRET'), // opcional
        },
        mercadopago: {
          accessToken: config.get('MP_ACCESS_TOKEN'),
          webhookSecret: config.get('MP_WEBHOOK_SECRET'), // opcional
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}
```

### Variables de entorno

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...   # solo si usás webhooks

# MercadoPago
MP_ACCESS_TOKEN=TEST-...
MP_WEBHOOK_SECRET=tu_secret       # solo si validás firmas de webhooks
```

---

## Uso — Stripe

### Inyectar el servicio

```typescript
import { Injectable } from '@nestjs/common';
import { StripeService } from '@agelormini2024/payments';

@Injectable()
export class PagosService {
  constructor(private readonly stripe: StripeService) {}
}
```

### Crear un PaymentIntent (flujo principal con Stripe)

Un PaymentIntent representa la intención de cobrar. El `clientSecret` que retorna se envía al frontend, que lo usa con Stripe.js para completar el pago.

```typescript
async iniciarPago(monto: number, moneda: string) {
  const intent = await this.stripe.createPaymentIntent({
    amount: monto,       // en centavos: 5000 = $50.00 USD
    currency: moneda,    // 'usd', 'ars', etc.
    metadata: {
      orderId: 'orden-123',
    },
  });

  return { clientSecret: intent.client_secret };
}
```

### Verificar el estado de un pago

```typescript
async verificarPago(paymentIntentId: string) {
  const intent = await this.stripe.retrievePaymentIntent(paymentIntentId);
  return intent.status; // 'succeeded' | 'processing' | 'requires_payment_method' | ...
}
```

### Emitir un reembolso

```typescript
// Reembolso total
await this.stripe.createRefund({ payment_intent: 'pi_...' });

// Reembolso parcial de $10.00
await this.stripe.createRefund({ payment_intent: 'pi_...', amount: 1000 });
```

### Crear un Customer

Útil para guardar métodos de pago y hacer cobros futuros sin que el usuario vuelva a ingresar sus datos.

```typescript
const customer = await this.stripe.createCustomer({
  email: 'usuario@example.com',
  name: 'Juan García',
  metadata: { userId: 'user-123' },
});
```

### Manejar webhooks de Stripe

Los webhooks notifican al servidor cuándo ocurre un evento (pago exitoso, reembolso, etc.).

> **Importante:** el body del request debe llegar como `Buffer` (raw), no como JSON parseado. Configurar `rawBody: true` en el bootstrap de NestJS.

```typescript
// main.ts
app.use(json({ verify: (req: any, _, buf) => { req.rawBody = buf; } }));

// stripe-webhook.controller.ts
import { Controller, Post, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from '@agelormini2024/payments';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly stripe: StripeService) {}

  @Post()
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = this.stripe.constructWebhookEvent(req.rawBody, signature);

    switch (event.type) {
      case 'payment_intent.succeeded':
        const intent = event.data.object;
        // actualizar orden en la DB...
        break;
      case 'payment_intent.payment_failed':
        // notificar al usuario...
        break;
    }

    return { received: true };
  }
}
```

---

## Uso — MercadoPago

### Inyectar el servicio

```typescript
import { Injectable } from '@nestjs/common';
import { MercadoPagoService } from '@agelormini2024/payments';

@Injectable()
export class PagosService {
  constructor(private readonly mp: MercadoPagoService) {}
}
```

### Crear una Preference (flujo principal en Argentina)

Una Preference define qué se vende y devuelve una URL de pago (`init_point`) a la que se redirige al usuario para completar el pago en la plataforma de MercadoPago.

```typescript
async iniciarPago(orden: Orden) {
  const preference = await this.mp.createPreference({
    items: [
      {
        id: orden.productId,
        title: orden.productName,
        quantity: 1,
        unit_price: orden.precio,   // en pesos argentinos
        currency_id: 'ARS',
      },
    ],
    back_urls: {
      success: 'https://miapp.com/pago/exitoso',
      failure: 'https://miapp.com/pago/error',
      pending: 'https://miapp.com/pago/pendiente',
    },
    auto_return: 'approved',
    external_reference: orden.id,   // tu ID de referencia para cruzar con el webhook
    notification_url: 'https://miapp.com/webhooks/mercadopago',
  });

  return {
    checkoutUrl: preference.init_point,          // producción
    sandboxUrl: preference.sandbox_init_point,   // testing
  };
}
```

### Verificar un pago

```typescript
async verificarPago(paymentId: string) {
  const payment = await this.mp.getPayment(paymentId);

  // payment.status: 'approved' | 'pending' | 'rejected' | 'cancelled' | ...
  // payment.external_reference: tu ID de orden original
  return {
    status: payment.status,
    orderId: payment.external_reference,
  };
}
```

### Manejar webhooks de MercadoPago

MercadoPago envía notificaciones cuando ocurre un cambio en un pago. Se recomienda siempre verificar la firma para evitar requests fraudulentos.

```typescript
// mp-webhook.controller.ts
import { Body, Controller, Headers, Post } from '@nestjs/common';
import { MercadoPagoService } from '@agelormini2024/payments';

@Controller('webhooks/mercadopago')
export class MpWebhookController {
  constructor(private readonly mp: MercadoPagoService) {}

  @Post()
  async handleWebhook(
    @Body() body: any,
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
  ) {
    // Verificar la firma antes de procesar (requiere webhookSecret configurado)
    this.mp.verifyWebhookSignature(xSignature, xRequestId, body.data?.id);

    if (body.type === 'payment') {
      const payment = await this.mp.getPayment(body.data.id);

      if (payment.status === 'approved') {
        // actualizar orden en la DB usando payment.external_reference
      }
    }

    return { received: true };
  }
}
```

---

## Resumen del flujo — Stripe

```
Frontend                  Backend                      Stripe
   │                         │                            │
   │  POST /pago/iniciar      │                            │
   │─────────────────────────▶│                            │
   │                         │  createPaymentIntent()     │
   │                         │───────────────────────────▶│
   │                         │◀───────────────────────────│
   │   { clientSecret }      │                            │
   │◀─────────────────────────│                            │
   │                         │                            │
   │  [confirma con Stripe.js]│                            │
   │──────────────────────────────────────────────────────▶│
   │                         │                            │
   │                         │  [webhook] payment_intent  │
   │                         │◀───────────────────────────│
   │                         │  constructWebhookEvent()   │
   │                         │  → actualizar orden en DB  │
```

## Resumen del flujo — MercadoPago

```
Frontend                  Backend                    MercadoPago
   │                         │                            │
   │  POST /pago/iniciar      │                            │
   │─────────────────────────▶│                            │
   │                         │  createPreference()        │
   │                         │───────────────────────────▶│
   │                         │◀───────────────────────────│
   │   { checkoutUrl }       │                            │
   │◀─────────────────────────│                            │
   │                         │                            │
   │  [redirige al usuario a checkoutUrl]                 │
   │──────────────────────────────────────────────────────▶│
   │                         │                            │
   │                         │  [webhook] payment         │
   │                         │◀───────────────────────────│
   │                         │  verifyWebhookSignature()  │
   │                         │  getPayment(id)            │
   │                         │  → actualizar orden en DB  │
```

---

## API de referencia

### `PaymentsModule.forRootAsync(options)`

| Opción | Tipo | Requerido | Descripción |
|---|---|---|---|
| `useFactory` | `(...args) => PaymentsModuleOptions` | Sí | Función que retorna la configuración |
| `inject` | `any[]` | No | Servicios inyectados en `useFactory` |
| `imports` | `Module[]` | No | Módulos adicionales necesarios en `useFactory` |

### `StripeService`

| Método | Descripción |
|---|---|
| `createPaymentIntent(params)` | Crea un PaymentIntent para iniciar un cobro |
| `retrievePaymentIntent(id)` | Obtiene el estado actual de un PaymentIntent |
| `createRefund(params)` | Emite un reembolso total o parcial |
| `createCustomer(params)` | Crea un Customer en Stripe |
| `constructWebhookEvent(payload, signature)` | Verifica y parsea un evento de webhook |

### `MercadoPagoService`

| Método | Descripción |
|---|---|
| `createPreference(body)` | Crea una Preference y devuelve la URL de pago |
| `getPayment(id)` | Obtiene los detalles de un pago por ID |
| `createPayment(body)` | Crea un pago directo (API transparente) |
| `verifyWebhookSignature(xSignature, xRequestId, dataId)` | Verifica la firma HMAC de un webhook |
