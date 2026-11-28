// tests/refactor.test.js
// Pruebas adicionales de la Semana 5: comprueban lo que cambió con la refactorización.
// Las 21 pruebas originales (tests/shippingStrategy.test.js) NO se modificaron.

const path = require('path');
const { execFileSync } = require('child_process');
const {
  ejecutarEjemplo,
  ZoneRateStrategy,
  StorePickupStrategy,
  OrderSummaryContext,
} = require('../src/services/shippingStrategy');

describe('Refactorización Semana 5', () => {
  test('RF-01: importar el módulo ya no imprime nada en consola (ejemplo aislado)', () => {
    const espia = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.isolateModules(() => {
      require('../src/services/shippingStrategy');
    });
    expect(espia).not.toHaveBeenCalled();
    espia.mockRestore();
  });

  test('RF-02: ZoneRateStrategy sin argumentos usa una tabla vacía y rechaza cualquier sector', () => {
    const estrategia = new ZoneRateStrategy(); // cubre la rama pendiente (zoneRates = {})
    expect(() => estrategia.calculateCost({ zone: 'Gurabo' })).toThrow('Sector');
  });

  test('RF-03: calculateTax calcula y redondea el ITBIS igual que antes', () => {
    const cotizador = new OrderSummaryContext(new StorePickupStrategy());
    expect(cotizador.calculateTax(1300)).toBe(234);
    expect(cotizador.calculateTax(100.5)).toBe(18.09);
  });

  test('RF-04: el resumen mantiene el mismo formato de resultado', () => {
    const cotizador = new OrderSummaryContext(new ZoneRateStrategy({ Gurabo: 200 }));
    expect(cotizador.calculateTotal({ subtotal: 1300, zone: 'Gurabo' })).toEqual({
      subtotal: 1300,
      shippingCost: 200,
      taxAmount: 234,
      total: 1734,
    });
  });

  test('RF-05: ejecutarEjemplo imprime los dos casos del ejemplo', () => {
    const espia = jest.spyOn(console, 'log').mockImplementation(() => {});
    ejecutarEjemplo();
    expect(espia).toHaveBeenCalledTimes(2);
    expect(espia.mock.calls[0][0]).toBe('Pedido con Delivery:');
    expect(espia.mock.calls[0][1].total).toBe(1684);
    expect(espia.mock.calls[1][1].total).toBe(1534);
    espia.mockRestore();
  });

  test('RF-06: al ejecutar el archivo directamente con node, el ejemplo sí corre', () => {
    const archivo = path.join(__dirname, '..', 'src', 'services', 'shippingStrategy.js');
    const salida = execFileSync('node', [archivo], { encoding: 'utf8' });
    expect(salida).toContain('Pedido con Delivery');
    expect(salida).toContain('Pedido Retiro en Sucursal');
  });
});