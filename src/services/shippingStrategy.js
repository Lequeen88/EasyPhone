// =========================================================
// PATRÓN DE DISEÑO: STRATEGY
// Componente: Cotizador de Envío y Resumen de Pedido (EasyPhone)
// =========================================================

// 1. Estrategias concretas (Reglas de cálculo desacopladas)
class ZoneRateStrategy {
  constructor(zoneRates = {}) {
    this.zoneRates = zoneRates;
  }

  calculateCost({ zone }) {
    // NC-01 y NC-02: solo se aceptan sectores que existan en la tabla de tarifas.
    // hasOwnProperty evita que nombres como "constructor" (heredados de Object) pasen como sector.
    if (!Object.prototype.hasOwnProperty.call(this.zoneRates, zone)) {
      throw new Error(`Sector no válido: ${zone}`);
    }
    return this.zoneRates[zone];
  }
}

class StorePickupStrategy {
  calculateCost() {
    // Regla de negocio: Retiro en sucursal tiene costo RD$ 0.00
    return 0;
  }
}

class FreeShippingStrategy {
  constructor(minSubtotal, fallbackStrategy) {
    // NC-05: el monto mínimo debe ser un número válido y no negativo
    if (typeof minSubtotal !== 'number' || !Number.isFinite(minSubtotal) || minSubtotal < 0) {
      throw new Error('El monto mínimo debe ser un número mayor o igual a 0');
    }
    this.minSubtotal = minSubtotal;
    this.fallbackStrategy = fallbackStrategy;
  }

  calculateCost(context) {
    if (context.subtotal >= this.minSubtotal) {
      return 0;
    }
    return this.fallbackStrategy.calculateCost(context);
  }
}

// 2. Contexto que arma el resumen de compra
class OrderSummaryContext {
  constructor(strategy, taxRate = 0.18) {
    this.strategy = strategy;
    this.taxRate = taxRate;
  }

  setStrategy(strategy) {
    // NC-04: rechazar estrategias nulas o que no tengan calculateCost
    if (!strategy || typeof strategy.calculateCost !== 'function') {
      throw new Error('Estrategia de envío no válida');
    }
    this.strategy = strategy;
  }

  calculateTotal({ subtotal, zone }) {
    // NC-04: validar que exista una estrategia antes de calcular
    if (!this.strategy || typeof this.strategy.calculateCost !== 'function') {
      throw new Error('Estrategia de envío no definida');
    }
    // NC-03: validar el subtotal (número, finito y no negativo)
    if (typeof subtotal !== 'number' || !Number.isFinite(subtotal) || subtotal < 0) {
      throw new Error('Subtotal inválido');
    }

    const shippingCost = this.strategy.calculateCost({ subtotal, zone });
    const taxAmount = Number((subtotal * this.taxRate).toFixed(2));
    const total = Number((subtotal + shippingCost + taxAmount).toFixed(2));

    return {
      subtotal,
      shippingCost,
      taxAmount,
      total
    };
  }
}

// 3. Ejemplo de ejecución / validación del flujo
const tarifasPorZona = new ZoneRateStrategy({
  "Santiago Centro": 150,
  "Cienfuegos": 250,
  "Gurabo": 200
});

const cotizador = new OrderSummaryContext(tarifasPorZona);

// Caso A: Envío a Santiago Centro (Subtotal RD$ 1,300)
// NC-00: el método correcto es calculateTotal (antes decía calculateSummary y no existe)
console.log("Pedido con Delivery:", cotizador.calculateTotal({
  subtotal: 1300,
  zone: "Santiago Centro"
}));

// Caso B: Cambio dinámico a Retiro en Sucursal
cotizador.setStrategy(new StorePickupStrategy());
console.log("Pedido Retiro en Sucursal:", cotizador.calculateTotal({
  subtotal: 1300,
  zone: "N/A"
}));

// Exportamos las clases para poder probarlas con Jest
module.exports = { ZoneRateStrategy, StorePickupStrategy, FreeShippingStrategy, OrderSummaryContext };
