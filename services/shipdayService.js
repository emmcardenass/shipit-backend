import dotenv from "dotenv";
dotenv.config();

import Shipday from "shipday/integration";
import OrderInfoRequest from "shipday/integration/order/request/order.info.request";
import PaymentMethod from "shipday/integration/order/types/payment.method";
import CardType from "shipday/integration/order/types/card.type";
import OrderItem from "shipday/integration/order/request/order.item";

const shipdayClient = new Shipday(process.env.SHIPDAY_API_KEY, 55800); // El segundo parámetro es opcional, usa tu zona horaria en minutos si es necesario.

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

    order.setRestaurantPhoneNumber("+52" + (pedido.origen.telefono || "8110158436"));
    order.setExpectedDeliveryDate(new Date(pedido.fechaEntregaProgramada).toISOString().split("T")[0]);
    order.setExpectedDeliveryTime("13:00:00"); 
    order.setExpectedPickupTime("09:00:00"); 
    order.setPickupLatLong(pedido.origen.coordenadas[1], pedido.origen.coordenadas[0]);
    order.setDeliveryLatLong(pedido.destino.coordenadas[1], pedido.destino.coordenadas[0]);
    order.setDeliveryInstruction(pedido.envio.instrucciones || "");
    order.setTotalOrderCost(pedido.envio.totalCobrado || 0);
    
    if (pedido.envio.tipoPago === "COD") {
      order.setPaymentMethod(PaymentMethod.CASH);
    } else {
      order.setPaymentMethod(PaymentMethod.PREPAID);
    }

    const items = [];
    items.push(new OrderItem(pedido.envio.contenido || "Paquete", pedido.envio.peso || 1, 1));
    order.setOrderItems(items);

    const res = await shipdayClient.orderService.insertOrder(order);
    console.log("🚀 Pedido registrado en Shipday:", res);
  } catch (error) {
    console.error("❌ Error al registrar en Shipday:", error.message);
    throw new Error("Fallo en la integración con Shipday");
  }
};
