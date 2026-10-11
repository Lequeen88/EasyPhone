# EasyPhone — Plataforma de Ventas y Catálogo Digital

## 1. Objetivo del Sistema
Facilitar la consulta y compra en línea de teléfonos móviles y accesorios de tecnología a través de una interfaz interactiva y ligera, ofreciendo transparencia en el cálculo de tarifas de envío por sectores geográficos y múltiples modalidades de entrega.

## 2. Problema que Resuelve
Actualmente, las pequeñas tiendas de tecnología sufren de desorganización en la toma de pedidos por mensajería instantánea, lentitud en la cotización de envíos según la ubicación del cliente y falta de un catálogo centralizado con stock en tiempo real. EasyPhone automatiza la selección de productos y la cotización de delivery.

## 3. Funcionalidades Principales
* **Catálogo interactivo:** Búsqueda y filtrado dinámico por categoría y marca.
* **Carrito de compras:** Gestión de productos seleccionados y resumen de orden.
* **Módulo de delivery parametrizado:** Cálculo automático de tarifas de envío según el sector del usuario o la opción de retiro en sucursal.
* **Generación de código único de pedido:** Emisión de un identificador `#EP-XXXX` para seguimiento del pedido.

## 4. Arquitectura Seleccionada
Arquitectura Desacoplada Cliente-Servidor organizada bajo el patrón **Model-View-Controller (MVC)** en el backend. La interfaz de usuario opera como una Single Page Application (SPA) que consume una API RESTful.

## 5. Herramientas Utilizadas
* **Frontend:** HTML5, CSS3 / Tailwind CSS, JavaScript (React / Next.js).
* **Backend & API:** Node.js / C# (.NET) para endpoints RESTful.
* **Base de Datos:** SQL Server / MariaDB.
* **Modelado & Gestión:** Visual Paradigm Online, GitHub Projects, Git & GitHub.

## 6. Estado Actual del Proyecto
Versión `v1.0.0-alpha` con esquema relacional finalizado, prototipo frontend del catálogo en progreso y API REST en fase de pruebas unitarias.
