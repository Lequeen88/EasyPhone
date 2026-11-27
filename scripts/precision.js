// scripts/precision.js
// Compara el ITBIS calculado con Number((subtotal * 0.18).toFixed(2)) contra el redondeo
// exacto (en centavos enteros, mitad hacia arriba) para subtotales de RD$ 0.01 a RD$ 1,000.00.
// Uso (desde la raíz del proyecto):  node scripts/precision.js

const TASA = 0.18;
let diferencias = 0;
const ejemplos = [];
const TOTAL = 100000;

for (let centavos = 1; centavos <= TOTAL; centavos++) {
  const subtotal = centavos / 100;
  const actual = Number((subtotal * TASA).toFixed(2));                 // forma usada en el componente
  const exacto = Math.floor((centavos * 18 + 50) / 100) / 100;         // 18 % en enteros, mitad hacia arriba
  if (actual !== exacto) {
    diferencias++;
    if (ejemplos.length < 5) ejemplos.push({ subtotal, actual, exacto });
  }
}

console.log(`Subtotales evaluados: ${TOTAL}`);
console.log(`Diferencias de 1 centavo: ${diferencias} (${((diferencias / TOTAL) * 100).toFixed(2)} %)`);
console.log('Primeros ejemplos:', ejemplos);
