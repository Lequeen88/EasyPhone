// scripts/benchmark.js
// Micro-benchmark del componente Cotizador de Envío (EasyPhone).
// Uso (desde la raíz del proyecto):  node scripts/benchmark.js

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

// Carga un módulo sin que se impriman los console.log del código de ejemplo
function cargar(ruta) {
  const log = console.log;
  console.log = () => {};
  const modulo = require(ruta);
  console.log = log;
  return modulo;
}

const corregida = cargar(path.join(__dirname, '..', 'src', 'services', 'shippingStrategy.js'));

// Versión de la Unidad II (commit 7368807) tomada del historial de Git.
// Solo se corrige el nombre del método y se agrega el export para poder ejecutarla.
let original = null;
try {
  const codigo = execSync('git show 7368807:src/services/shippingStrategy.js', { encoding: 'utf8' })
    .replace(/calculateSummary/g, 'calculateTotal') +
    '\nmodule.exports = { ZoneRateStrategy, StorePickupStrategy, FreeShippingStrategy, OrderSummaryContext };\n';
  const archivo = path.join(os.tmpdir(), 'shippingStrategy_unidad2.js');
  fs.writeFileSync(archivo, codigo);
  original = cargar(archivo);
} catch (e) {
  console.log('Aviso: no se pudo leer la versión de la Unidad II desde Git; se omite esa comparación.');
}

const TARIFAS = { 'Santiago Centro': 150, Cienfuegos: 250, Gurabo: 200 };
const sectores = Object.keys(TARIFAS);

// Ejecuta n cotizaciones y devuelve los milisegundos que tardó
function ejecutar(modulo, tipo, n) {
  const { ZoneRateStrategy, StorePickupStrategy, FreeShippingStrategy, OrderSummaryContext } = modulo;
  let ctx;
  if (tipo === 'zona') ctx = new OrderSummaryContext(new ZoneRateStrategy(TARIFAS));
  if (tipo === 'retiro') ctx = new OrderSummaryContext(new StorePickupStrategy());
  if (tipo === 'gratis') ctx = new OrderSummaryContext(new FreeShippingStrategy(5000, new ZoneRateStrategy(TARIFAS)));
  let acumulado = 0;
  const inicio = process.hrtime.bigint();
  for (let i = 0; i < n; i++) {
    acumulado += ctx.calculateTotal({ subtotal: 1000 + (i % 9000), zone: sectores[i % 3] }).total;
  }
  const fin = process.hrtime.bigint();
  if (acumulado < 0) console.log(acumulado); // evita que el motor elimine el ciclo
  return Number(fin - inicio) / 1e6;
}

const mediana = (a) => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
function medir(modulo, tipo, n, repeticiones = 7) {
  ejecutar(modulo, tipo, Math.min(n, 200000)); // calentamiento
  const tiempos = [];
  for (let i = 0; i < repeticiones; i++) tiempos.push(ejecutar(modulo, tipo, n));
  return mediana(tiempos);
}

console.log(`Node.js ${process.version} | CPU: ${os.cpus().length} núcleos\n`);

console.log('1) Rendimiento según la carga (estrategia por sector)');
for (const n of [10000, 100000, 1000000, 10000000]) {
  const ms = medir(corregida, 'zona', n, n >= 1e7 ? 3 : 7);
  console.log(`   ${String(n).padStart(9)} cotizaciones: ${ms.toFixed(1)} ms | ${((ms * 1000) / n).toFixed(3)} µs por cotización | ${(n / (ms / 1000) / 1e6).toFixed(2)} millones/s`);
}

console.log('\n2) Costo por estrategia (1 000 000 de cotizaciones)');
for (const tipo of ['zona', 'retiro', 'gratis']) {
  const ms = medir(corregida, tipo, 1000000);
  console.log(`   ${tipo.padEnd(7)}: ${ms.toFixed(1)} ms | ${(ms / 1000).toFixed(3)} µs por cotización`);
}

if (original) {
  console.log('\n3) Efecto de las validaciones (estrategia por sector, 1 000 000 de cotizaciones)');
  const a = medir(original, 'zona', 1000000);
  const b = medir(corregida, 'zona', 1000000);
  console.log(`   Unidad II: ${(a / 1000).toFixed(3)} µs | Corregida: ${(b / 1000).toFixed(3)} µs | Diferencia: ${(((b - a) / a) * 100).toFixed(1)} %`);
}
