console.log('✅ orderRoutes cargado');
// backend/routes/orderRoutes.js
import express from 'express';
import {
  crearPedido,
  obtenerPedidos,
  obtenerPedidoPorId,
  actualizarEstado,
  asignarRepartidor,
  rastrearPedido,
  obtenerPorNumeroGuia,
  obtenerTodosLosPedidos, // ✅ Importado
  actualizarIntentosEntrega,
} from '../controllers/orderController.js';
import authMiddleware from '../middleware/authMiddleware.js'; // ✅ Importado

const router = express.Router();

console.log("📩 Recibida petición POST /api/orders");
// 🚚 Crear un nuevo pedido
router.post('/', authMiddleware, crearPedido); // ✅ Middleware agregado

// 📦 Obtener todos los pedidos
router.get('/', authMiddleware, obtenerPedidos);

// 🔍 Obtener todos los pedidos para superadmin
router.get('/admin/todos', authMiddleware, obtenerTodosLosPedidos); // ✅ Nueva ruta

// 🔍 Obtener pedido por ID (admin)
router.get('/:id', obtenerPedidoPorId);

// 🔄 Actualizar estado
router.put('/:id', authMiddleware, actualizarEstado);

// 🚚 Asignar repartidor
router.put('/assign-driver/:orderId', asignarRepartidor);

// 🔎 Rastrear paquete por número de guía
router.get('/rastreo/:id', rastrearPedido); // ✅ Nueva ruta al final

router.get('/guia/:numeroGuia', obtenerPorNumeroGuia);

router.put('/admin/update-intentos/:id', authMiddleware, actualizarIntentosEntrega);

export default router;
