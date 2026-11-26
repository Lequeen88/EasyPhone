// tests/shippingStrategy.test.js
// Pruebas del componente: Cotizador de Envío y Resumen de Pedido (EasyPhone)
// Patrón: Strategy | Herramienta: Jest

const {
  ZoneRateStrategy,
  StorePickupStrategy,
  FreeShippingStrategy,
  OrderSummaryContext,
} = require('../src/services/shippingStrategy');

// Tarifas reales del proyecto (las mismas del ejemplo de shippingStrategy.js)
const TARIFAS = { 'Santiago Centro': 150, Cienfuegos: 250, Gurabo: 200 };

// ======================= CP-01: Cotizar delivery por sector =======================
describe('CP-01 Delivery por sector (ZoneRateStrategy)', () => {
  // Crea un contexto nuevo con la estrategia por sector
  const ctx = () => new OrderSummaryContext(new ZoneRateStrategy(TARIFAS));

  test('válido: Santiago Centro, subtotal 1300 -> envío 150, ITBIS 234, total 1684', () => {
    const r = ctx().calculateTotal({ subtotal: 1300, zone: 'Santiago Centro' });
    expect(r.shippingCost).toBe(150);
    expect(r.taxAmount).toBe(234);
    expect(r.total).toBe(1684);
  });

  test('válido: Cienfuegos, subtotal 1300 -> envío 250, total 1784', () => {
    const r = ctx().calculateTotal({ subtotal: 1300, zone: 'Cienfuegos' });
    expect(r.shippingCost).toBe(250);
    expect(r.total).toBe(1784);
  });

  test('inválido: sector inexistente (ZONA_999) debe lanzar error', () => {
    expect(() => ctx().calculateTotal({ subtotal: 1000, zone: 'ZONA_999' })).toThrow('Sector');
  });

  test('límite: sector "constructor" (heredado de Object) debe lanzar error', () => {
    expect(() => ctx().calculateTotal({ subtotal: 1000, zone: 'constructor' })).toThrow('Sector');
  });
});

// ======================= CP-02: Retiro en sucursal =======================
describe('CP-02 Retiro en sucursal (StorePickupStrategy)', () => {
  const ctx = () => new OrderSummaryContext(new StorePickupStrategy());

  test('válido: envío 0, subtotal 1300 -> total 1534', () => {
    const r = ctx().calculateTotal({ subtotal: 1300, zone: 'N/A' });
    expect(r.shippingCost).toBe(0);
    expect(r.total).toBe(1534);
  });

  test('inválido: estrategia nula debe lanzar un error controlado', () => {
    const c = new OrderSummaryContext(null);
    expect(() => c.calculateTotal({ subtotal: 100, zone: 'N/A' })).toThrow('Estrategia');
  });

  test('límite: subtotal mínimo 1.00 -> total 1.18', () => {
    expect(ctx().calculateTotal({ subtotal: 1, zone: 'N/A' }).total).toBe(1.18);
  });
});

// ======================= CP-03: Envío gratis por monto mínimo =======================
describe('CP-03 Envío gratis (FreeShippingStrategy, mínimo 5000)', () => {
  const ctx = () =>
    new OrderSummaryContext(new FreeShippingStrategy(5000, new ZoneRateStrategy(TARIFAS)));

  test('válido: subtotal 8000 no paga envío', () => {
    expect(ctx().calculateTotal({ subtotal: 8000, zone: 'Gurabo' }).shippingCost).toBe(0);
  });

  test('inválido: monto mínimo negativo debe lanzar error', () => {
    expect(() => new FreeShippingStrategy(-1, new StorePickupStrategy())).toThrow('mínimo');
  });

  test('límite: exactamente 5000 es gratis (se usa >=)', () => {
    expect(ctx().calculateTotal({ subtotal: 5000, zone: 'Gurabo' }).shippingCost).toBe(0);
  });

  test('límite: 4999.99 paga el envío de respaldo (Gurabo = 200)', () => {
    const r = ctx().calculateTotal({ subtotal: 4999.99, zone: 'Gurabo' });
    expect(r.shippingCost).toBe(200);
    expect(r.total).toBe(6099.99);
  });
});

// ======================= CP-04: ITBIS y total =======================
describe('CP-04 ITBIS (18%) y total', () => {
  const ctx = () => new OrderSummaryContext(new StorePickupStrategy());

  test('válido: subtotal 1000 -> ITBIS 180', () => {
    expect(ctx().calculateTotal({ subtotal: 1000, zone: 'N/A' }).taxAmount).toBe(180);
  });

  // Se prueban varios datos inválidos con la misma regla
  test.each([-100, NaN, undefined, '100'])('inválido: subtotal %p debe lanzar error', (s) => {
    expect(() => ctx().calculateTotal({ subtotal: s, zone: 'N/A' })).toThrow('Subtotal');
  });

  test('límite: subtotal 0 -> total 0', () => {
    expect(ctx().calculateTotal({ subtotal: 0, zone: 'N/A' }).total).toBe(0);
  });

  test('límite: redondeo a 2 decimales con 19.99 -> total 23.59', () => {
    expect(ctx().calculateTotal({ subtotal: 19.99, zone: 'N/A' }).total).toBe(23.59);
  });
});

// ======================= CP-05: Cambio de modalidad (integración) =======================
describe('CP-05 Cambio de estrategia con setStrategy (integración)', () => {
  test('válido: Delivery -> Retiro baja el total en 150', () => {
    const c = new OrderSummaryContext(new ZoneRateStrategy(TARIFAS));
    const antes = c.calculateTotal({ subtotal: 1300, zone: 'Santiago Centro' }).total;
    c.setStrategy(new StorePickupStrategy());
    const despues = c.calculateTotal({ subtotal: 1300, zone: 'Santiago Centro' }).total;
    expect(antes - despues).toBe(150);
  });

  test('inválido: setStrategy(undefined) debe lanzar error', () => {
    const c = new OrderSummaryContext(new StorePickupStrategy());
    expect(() => c.setStrategy(undefined)).toThrow('Estrategia');
  });

  test('límite: alternar varias veces no deja estado residual', () => {
    const c = new OrderSummaryContext(new StorePickupStrategy());
    c.setStrategy(new ZoneRateStrategy(TARIFAS));
    c.setStrategy(new StorePickupStrategy());
    c.setStrategy(new ZoneRateStrategy(TARIFAS));
    const nuevo = new OrderSummaryContext(new ZoneRateStrategy(TARIFAS));
    const datos = { subtotal: 500, zone: 'Gurabo' };
    expect(c.calculateTotal(datos)).toEqual(nuevo.calculateTotal(datos));
  });
});
