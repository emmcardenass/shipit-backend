import dotenv from "dotenv";
dotenv.config();

import Shipday from "shipday/integration/index.js";
import OrderInfoRequest from "shipday/integration/order/request/order.info.request.js";
import PaymentMethod from "shipday/integration/order/types/payment.method.js";
import CardType from "shipday/integration/order/types/card.type.js";
import OrderItem from "shipday/integration/order/request/order.item.js";

const shipdayClient = new Shipday(process.env.SHIPDAY_API_KEY, 55800); 

export const crearEnvioShipday = async (pedido) => {
  try {
    const order = new OrderInfoRequest(
      pedido.envio.numeroGuia,
      pedido.destino.nombre,
      pedido.destino.direccion,
      pedido.destino.email || "sinemail@shipit.com",
      "+52" + (pedido.destino.telefono || "0000000000"),
      "SHIP IT",
      pedido.origen.direccion
    );

    // Teléfono de contacto visible para el repartidor
    order.setRestaurantPhoneNumber("+52" + (pedido.origen.telefono || "8110158436"));

    // Fechas y horas de recolección y entrega (solo hora de inicio)
    order.setExpectedDeliveryDate(new Date(pedido.fechaEntregaProgramada).toISOString().split("T")[0]);

    // Rutas de recolección de 9am a 1pm, entregas de 1pm a 9pm
    order.setExpectedPickupTime("09:00:00"); 
    order.setExpectedDeliveryTime("13:00:00"); 

    // Coordenadas en formato lat, long
    order.setPickupLatLong(pedido.origen.coordenadas[1], pedido.origen.coordenadas[0]);
    order.setDeliveryLatLong(pedido.destino.coordenadas[1], pedido.destino.coordenadas[0]);

    order.setDeliveryInstruction(pedido.envio.instrucciones || "");

    // Enviar solo el monto COD si es contra entrega
    if (pedido.envio.tipoPago === "COD") {
      order.setTotalOrderCost(Number(pedido.envio.cod) || 0);
      order.setPaymentMethod(PaymentMethod.CASH);
    } else {
      order.setTotalOrderCost(0);
      order.setPaymentMethod(PaymentMethod.PREPAID);
    }

    // Lista de ítems enviados
    const items = [];
    items.push(new OrderItem(pedido.envio.contenido || "Paquete", pedido.envio.peso || 1, 1));
    order.setOrderItems(items);

    // Registro final en Shipday
    const res = await shipdayClient.orderService.insertOrder(order);
    console.log("🚀 Pedido registrado en Shipday:", res);
    
  } catch (error) {
    console.error("❌ Error al registrar en Shipday:", error.message);
    throw new Error("Fallo en la integración con Shipday");
  }
};
