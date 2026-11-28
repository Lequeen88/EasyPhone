// =========================================================
// PATRÓN DE DISEÑO: STRATEGY
// Componente: Cotizador de Envío y Resumen de Pedido (EasyPhone)
// Versión refactorizada (Semana 5): mismo comportamiento, estructura más mantenible.
// =========================================================

// 0. Funciones auxiliares de validación y cálculo (técnica: Extract Method).
//    Cada regla vive en un solo lugar: antes estaba repetida en varios métodos.

// ¿Es un número finito y no negativo? (se usa para el subtotal y el monto mínimo)
const esNumeroNoNegativo = (valor) =>
  typeof valor === 'number' && Number.isFinite(valor) && valor >= 0;

// ¿Es un objeto con el método calculateCost? (contrato que toda estrategia debe cumplir)
const esEstrategiaValida = (estrategia) =>
  Boolean(estrategia) && typeof estrategia.calculateCost === 'function';

// Lanza un error con el mensaje indicado si la estrategia no cumple el contrato
function validarEstrategia(estrategia, mensaje) {
  if (!esEstrategiaValida(estrategia)) {
    throw new Error(mensaje);
  }
}

// Lanza un error si el subtotal no es un número válido (NC-03)
function validarSubtotal(subtotal) {
  if (!esNumeroNoNegativo(subtotal)) {
    throw new Error('Subtotal inválido');
  }
}

// Redondea a 2 decimales (misma regla que antes: Number(x.toFixed(2)))
const redondear = (monto) => Number(monto.toFixed(2));

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
    if (!esNumeroNoNegativo(minSubtotal)) {
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
    validarEstrategia(strategy, 'Estrategia de envío no válida');
    this.strategy = strategy;
  }

  // Calcula el ITBIS del subtotal (método aparte para poder cambiar la regla en un solo lugar)
  calculateTax(subtotal) {
    return redondear(subtotal * this.taxRate);
  }

  calculateTotal({ subtotal, zone }) {
    // Validaciones (el orden se mantiene: primero la estrategia, luego el subtotal)
    validarEstrategia(this.strategy, 'Estrategia de envío no definida'); // NC-04
    validarSubtotal(subtotal); // NC-03

    const shippingCost = this.strategy.calculateCost({ subtotal, zone });
    const taxAmount = this.calculateTax(subtotal);
    const total = redondear(subtotal + shippingCost + taxAmount);

    return { subtotal, shippingCost, taxAmount, total };
  }
}

// 3. Ejemplo de ejecución / validación del flujo
// Ahora vive dentro de una función y solo se ejecuta al correr el archivo directamente
// (node src/services/shippingStrategy.js). Al importar el módulo, no imprime nada.
function ejecutarEjemplo() {
  const tarifasPorZona = new ZoneRateStrategy({
    'Santiago Centro': 150,
    Cienfuegos: 250,
    Gurabo: 200,
  });

  const cotizador = new OrderSummaryContext(tarifasPorZona);

  // Caso A: Envío a Santiago Centro (Subtotal RD$ 1,300)
  console.log('Pedido con Delivery:', cotizador.calculateTotal({ subtotal: 1300, zone: 'Santiago Centro' }));

  // Caso B: Cambio dinámico a Retiro en Sucursal
  cotizador.setStrategy(new StorePickupStrategy());
  console.log('Pedido Retiro en Sucursal:', cotizador.calculateTotal({ subtotal: 1300, zone: 'N/A' }));
}

if (require.main === module) {
  ejecutarEjemplo();
}

// Exportamos las clases (y el ejemplo) para poder probarlos con Jest
module.exports = { ZoneRateStrategy, StorePickupStrategy, FreeShippingStrategy, OrderSummaryContext, ejecutarEjemplo };