import Order from '../models/Order.js';
import User from '../models/User.js';
import Zona from '../models/Zona.js';
import Tarifa from '../models/Tarifa.js';
import { crearEnvioShipday } from "../services/shipdayService.js";
import { crearEnvioRoutal } from "../services/routal.js";

// Crear nuevo pedido con número de guía alfanumérico dinámico por ciudad
export const crearPedido = async (req, res) => {
  try {
    const userId = req.user?._id || null;
const user = await User.findById(userId);

if (!user) {
  return res.status(401).json({ error: "Usuario no autenticado" });
}

// Validar saldo
const { destino, envio } = req.body;
const coordenadasDestino = (destino?.coordenadas || []).map(c => parseFloat(c));
const peso = parseFloat(envio?.peso) || 0;
console.log("➡️ Peso recibido para cálculo:", peso);
const tipoServicio = envio?.tipo || "";
const cod = envio?.cod || 0;
if (cod && Number(cod) > 3000) {
  return res.status(400).json({ error: "El monto máximo permitido para COD es $3000 MXN" });
}

if (!coordenadasDestino.length || !peso || !tipoServicio) {
  return res.status(400).json({ error: "Datos incompletos para calcular precio" });
}

// Buscar zona
const zona = await Zona.findOne({
  poligono: {
    $geoIntersects: {
      $geometry: {
        type: "Point",
        coordinates: coordenadasDestino // ✅ porque tu componente ya manda [lng, lat]
      },
    },
  },
});

if (!zona) {
  return res.status(404).json({ error: "Zona de destino no encontrada (fuera de cobertura)" });
} 

console.log("🟢 Zona encontrada:", zona._id.toString(), zona.nombre);
console.log("🔍 Buscando tarifa con:", {
  zonas: zona._id,
  tipoServicio,
  peso
});

    // Buscar tarifa
    let tarifas = await Tarifa.find({
      zonas: zona._id,
      tipoServicio,
      pesoMin: { $lte: peso },
      pesoMax: { $gte: peso },
    }).sort({ precio: -1 });
    
    let tarifa = tarifas?.[0] || null;
    
    if (!tarifa) {
      console.log("⚠️ No hay tarifa directa en zona:", zona.nombre, "- intentando fallback TODA LA COBERTURA");
    
      const zonaToda = await Zona.findOne({ nombre: "TODA LA COBERTURA" });
    
      if (zonaToda) {
        const caeEnToda = await Zona.findOne({
          _id: zonaToda._id,
          poligono: {
            $geoIntersects: {
              $geometry: {
                type: "Point",
                coordinates: coordenadasDestino // ✅ porque tu componente ya manda [lng, lat]
              },
            },
          },
        });
    
        if (caeEnToda) {
          let tarifasFallback = await Tarifa.find({
            zonas: zonaToda._id,
            tipoServicio,
            pesoMin: { $lte: peso },
            pesoMax: { $gte: peso },
          }).sort({ precio: -1 });
    
          tarifa = tarifasFallback?.[0] || null;
    
          if (!tarifa) {
            return res.status(404).json({ error: "No tenemos cobertura en esta zona por el momento" });
          }
        } else {
          return res.status(404).json({ error: "No tenemos cobertura en esta zona por el momento" });
        }
      } else {
        return res.status(404).json({ error: "No tenemos cobertura en esta zona por el momento" });
      }
    }
    
    // Calcular costo COD (global, no depende de tarifa)
    let costoCOD = 0;
    if (cod && Number(cod) > 0 && Number(cod) <= 3000) {
      costoCOD = 17; // comisión fija global
    }
    
    const totalAPagar = tarifa.precio + costoCOD; 

    // Validar saldo disponible
    if (user.saldoEnvios < totalAPagar) {
      return res.status(400).json({ error: "Saldo insuficiente para crear el pedido" });
    }

    // Descontar saldo
    user.saldoEnvios -= totalAPagar;
    user.transacciones = [
      ...(user.transacciones || []),
      {
        tipo: "Descuento por envío",
        monto: -totalAPagar,
        fecha: new Date(),
      },
    ];
    await user.save();

    // Generar número de guía
    let ciudad = req.body?.origen?.direccion?.toLowerCase() || "";
    let prefijo = "OTR";

    if (ciudad.includes("monterrey")) prefijo = "MTY";
    else if (ciudad.includes("guadalajara")) prefijo = "GDL";
    else if (ciudad.includes("cdmx") || ciudad.includes("ciudad de méxico") || ciudad.includes("mexico")) prefijo = "CDMX";
    else if (ciudad.includes("saltillo")) prefijo = "SLT";
    else if (ciudad.includes("puebla")) prefijo = "PUE";
    else if (ciudad.includes("tijuana")) prefijo = "TIJ";
    else if (ciudad.includes("cancun")) prefijo = "CUN";
    else if (ciudad.includes("merida")) prefijo = "MID";

    const ultimoPedido = await Order.findOne().sort({ createdAt: -1 });
    let nuevoFolio = 1;
    if (ultimoPedido?.envio?.numeroGuia) {
      const ultimaParte = ultimoPedido.envio.numeroGuia.split("-").pop();
      const folioDecimal = parseInt(ultimaParte, 36);
      if (!isNaN(folioDecimal)) nuevoFolio = folioDecimal + 1;
    }

    const folioAlfanumerico = nuevoFolio.toString(36).toUpperCase().padStart(8, "0");
    const numeroGuia = `SHIP-${prefijo}-${folioAlfanumerico}`;

    // Crear pedido
    const envioCompleto = {
      numeroGuia,
      prefijoCiudad: prefijo, // ✅ corregido
      tipo: envio.tipo,
      tipoPago: envio?.tipoPago || "prepago",
      contenido: envio.contenido,
      instrucciones: envio.instrucciones || "",
    
      alto: envio.alto,
      largo: envio.largo,
      ancho: envio.ancho,
      peso: envio.peso,
      dimensiones: envio.dimensiones || "",
    
      cod: envio.cod,
      costo: tarifa.precio,
      costoCOD,
      totalCobrado: totalAPagar,
      zonaCalculada: zona.nombre
    };    
    
    // Datos para el Order (solo el envioCompleto limpio se guarda)
    // Calcular fechas programadas según la lógica de negocio

const ahora = new Date();
const horaActual = ahora.getHours();

// Calcular fecha de recolección programada
let fechaRecoleccion = new Date(ahora);

// Si el pedido se crea entre 9:00 y 12:59 — se recolecta al día siguiente
if (horaActual >= 9 && horaActual < 13) {
  fechaRecoleccion.setDate(fechaRecoleccion.getDate() + 1);
}

// Set hora fija de recolección: 09:00:00
fechaRecoleccion.setHours(9, 0, 0, 0);

// Calcular fecha de entrega programada
let fechaEntrega = new Date(fechaRecoleccion);

// Express y Fulfillment → entrega el mismo día de la recolección
// Standard → entrega el día siguiente a la recolección
if (envio.tipo === 'standard') {
  fechaEntrega.setDate(fechaEntrega.getDate() + 1);
}

// Set hora fija de entrega: 13:00:00
fechaEntrega.setHours(13, 0, 0, 0);

// Construcción final del objeto a guardar
const datos = {
  origen: req.body.origen,
  destino: req.body.destino,
  envio: envioCompleto,
  userId,

  // 🆕 Campos para la lógica de rutas
  fechaRecoleccionProgramada: fechaRecoleccion,
  fechaEntregaProgramada: fechaEntrega,
  estadoEntrega: 'pendiente',
  intentosEntrega: 0,
};
    
    // Guardamos el pedido en la DB
    const nuevoPedido = new Order(datos);
    const pedidoGuardado = await nuevoPedido.save();
    // 🚀 Crear pedido automáticamente en Routal
try {
  const resultadoRoutal = await crearEnvioRoutal(pedidoGuardado);
  if (resultadoRoutal) {
    console.log("📦 Pedido registrado en Routal:", resultadoRoutal.id || resultadoRoutal._id || resultadoRoutal);
  }
} catch (error) {
  console.error("❌ Error al registrar el pedido en Routal:", error.message);
}

// 🚀 Crear pedido automáticamente en Shipday
    try {
      await crearEnvioShipday(pedidoGuardado);
    } catch (error) {
      console.error("❌ Error al registrar el pedido en Shipday:", error.message);
    }    
    
    // 🚀 En la respuesta SÍ podemos mandar todo lo que tú quieras para el frontend:
    res.status(201).json({
      mensaje: "Pedido creado exitosamente",
      guia: pedidoGuardado.envio.numeroGuia,
      pedido: pedidoGuardado,
      costoCOD, // aquí lo mandamos a frontend
      totalCobrado: totalAPagar,
      zonaCalculada: zona.nombre
    });
    

  } catch (error) {
    console.error("❌ Error al crear pedido:", error);
    res.status(500).json({ mensaje: "Error al crear pedido", error });
  }
};

// Obtener todos los pedidos del cliente logueado
export const obtenerPedidos = async (req, res) => {
  try {
    const pedidos = await Order.find({ userId: req.user._id });
    res.json(pedidos);
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    res.status(500).json({ mensaje: 'Error al obtener pedidos' });
  }
};

// Obtener pedido por ID
export const obtenerPedidoPorId = async (req, res) => {
  try {
    const pedido = await Order.findById(req.params.id);
    if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    res.json(pedido);
  } catch (error) {
    console.error('Error al buscar pedido:', error);
    res.status(500).json({ mensaje: 'Error al buscar pedido' });
  }
};

// Actualizar estado de un pedido
export const actualizarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    const pedido = await Order.findById(req.params.id);
    if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });

    if (
      estado === "entregado" &&
      pedido.envio?.tipoPago === "COD" &&
      Number(pedido.envio?.cod || 0) > 0
    ) {
      const userId = pedido.userId || pedido.usuario || pedido.user || null;
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          const monto = Number(pedido.envio?.cod || 0);
          user.balance = (user.balance || 0) + monto;
          user.transacciones = [
            ...(user.transacciones || []),
            {
              tipo: "Ingreso por COD",
              monto,
              fecha: new Date()
            }
          ];
          await user.save();
          console.log("💰 Balance actualizado directamente en User");
        }
      }
    }

    pedido.estado = estado;
    const actualizado = await pedido.save();

    res.json(actualizado);
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    res.status(500).json({ mensaje: 'Error al actualizar pedido' });
  }
};

// Asignar repartidor a pedido
export const asignarRepartidor = async (req, res) => {
  try {
    const { assignedDriver } = req.body;
    const pedido = await Order.findById(req.params.orderId);
    if (!pedido) return res.status(404).json({ mensaje: 'Pedido no encontrado' });

    pedido.asignadoA = assignedDriver;
    await pedido.save();

    res.json({ mensaje: 'Repartidor asignado correctamente', pedido });
  } catch (error) {
    console.error('Error al asignar repartidor:', error);
    res.status(500).json({ mensaje: 'Error al asignar repartidor' });
  }
};

// Rastrear pedido por número de guía (ID)
export const rastrearPedido = async (req, res) => {
  try {
    const { id } = req.params;
    const pedido = await Order.findById(id);

    if (!pedido) {
      return res.status(404).json({ mensaje: "Guía no encontrada" });
    }

    const rastreo = {
      guia: pedido._id,
      estado: pedido.estado,
      tipoEnvio: pedido.envio?.tipo || "",
      formaPago: pedido.envio?.tipoPago || "prepago",
      valorCOD: pedido.envio?.valorCOD || 0,
      creado: pedido.createdAt,
      asignadoA: pedido.asignadoA || "Sin asignar",

      remitente: {
        nombre: pedido.envio?.remitente || "",
        telefono: pedido.envio?.telRemitente || "",
        direccion: pedido.origen?.direccion || "",
      },
      destinatario: {
        nombre: pedido.envio?.destinatario || pedido.destino?.nombre || "",
        telefono: pedido.envio?.telDestinatario || pedido.destino?.telefono || "",
        direccion: pedido.destino?.direccion || "",
      },
      detalles: {
        contenido: pedido.envio?.contenido || "",
        peso: pedido.envio?.peso || "",
        dimensiones: pedido.envio?.dimensiones || "",
        instrucciones: pedido.envio?.instrucciones || "",
      }
    };

    res.json(rastreo);
  } catch (error) {
    console.error("Error en rastreo:", error);
    res.status(500).json({ mensaje: "Error al rastrear paquete" });
  }
};

// 🔍 Buscar pedido por número de guía
export const obtenerPorNumeroGuia = async (req, res) => {
  try {
    const numeroGuia = req.params.numeroGuia;
    const pedido = await Order.findOne({ "envio.numeroGuia": numeroGuia });

    if (!pedido) {
      return res.status(404).json({ mensaje: "Guía no encontrada" });
    }

    res.json(pedido);
  } catch (error) {
    console.error("Error al buscar por número de guía:", error);
    res.status(500).json({ mensaje: "Error interno del servidor" });
  }
};

// ✅ Obtener todos los pedidos (para superadmin)
export const obtenerTodosLosPedidos = async (req, res) => {
  try {
    const pedidos = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(pedidos);
  } catch (error) {
    console.error("Error al obtener todos los pedidos:", error);
    res.status(500).json({ mensaje: "Error al obtener pedidos" });
  }
};
