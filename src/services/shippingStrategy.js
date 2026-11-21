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
    return this.zoneRates[zone] ?? 0;
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
    this.strategy = strategy;
  }

  calculateTotal({ subtotal, zone }) {
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
console.log("Pedido con Delivery:", cotizador.calculateSummary({
  subtotal: 1300,
  zone: "Santiago Centro"
}));

// Caso B: Cambio dinámico a Retiro en Sucursal
cotizador.setStrategy(new StorePickupStrategy());
console.log("Pedido Retiro en Sucursal:", cotizador.calculateSummary({
  subtotal: 1300,
  zone: "N/A"
}));
