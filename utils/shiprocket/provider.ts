import { SHIPROCKET_CONFIG } from "./config.js";
import { getShiprocketClient } from "./client.js";

export interface IShippingProvider {
  createOrder(orderData: any): Promise<any>;
  checkServiceability(pickupPostcode: string, deliveryPostcode: string, weight: number, cod: number): Promise<any>;
  generateAwb(shipmentId: string, courierId: string): Promise<any>;
  requestPickup(shipmentId: string): Promise<any>;
  generateLabel(shipmentId: string): Promise<any>;
}

export class ShiprocketLiveProvider implements IShippingProvider {
  async createOrder(orderData: any): Promise<any> {
    const client = await getShiprocketClient();
    const response = await client.post("/orders/create/adhoc", orderData);
    return response.data;
  }

  async checkServiceability(pickupPostcode: string, deliveryPostcode: string, weight: number, cod: number): Promise<any> {
    const client = await getShiprocketClient();
    const response = await client.get(`/courier/serviceability/`, {
      params: {
        pickup_postcode: pickupPostcode,
        delivery_postcode: deliveryPostcode,
        weight: weight,
        cod: cod,
      },
    });
    return response.data;
  }

  async generateAwb(shipmentId: string, courierId: string): Promise<any> {
    const client = await getShiprocketClient();
    const response = await client.post("/courier/assign/awb", {
      shipment_id: shipmentId,
      courier_id: courierId,
    });
    return response.data;
  }

  async requestPickup(shipmentId: string): Promise<any> {
    const client = await getShiprocketClient();
    const response = await client.post("/courier/generate/pickup", {
      shipment_id: [shipmentId],
    });
    return response.data;
  }

  async generateLabel(shipmentId: string): Promise<any> {
    const client = await getShiprocketClient();
    const response = await client.post("/courier/generate/label", {
      shipment_id: [shipmentId],
    });
    return response.data;
  }
}

export class ShiprocketMockProvider implements IShippingProvider {
  async createOrder(orderData: any): Promise<any> {
    return {
      order_id: `MOCK_ORDER_${Date.now()}`,
      shipment_id: `MOCK_SHIPMENT_${Date.now()}`,
      status: "NEW",
      status_code: 1,
      onboarding_completed_now: 0,
      awb_code: "",
      courier_company_id: "",
      courier_name: "",
    };
  }

  async checkServiceability(pickupPostcode: string, deliveryPostcode: string, weight: number, cod: number): Promise<any> {
    return {
      status: 200,
      data: {
        available_courier_companies: [
          {
            courier_company_id: 1,
            courier_name: "Mock Courier Express",
            rate: 50.0,
            estimated_delivery_days: 3,
          },
          {
            courier_company_id: 2,
            courier_name: "Mock Courier Surface",
            rate: 30.0,
            estimated_delivery_days: 5,
          }
        ]
      }
    };
  }

  async generateAwb(shipmentId: string, courierId: string): Promise<any> {
    return {
      awb_assign_status: 1,
      response: {
        data: {
          awb_code: `MOCK_AWB_${Date.now()}`,
          courier_company_id: courierId,
          courier_name: "Mock Courier",
        }
      }
    };
  }

  async requestPickup(shipmentId: string): Promise<any> {
    return {
      pickup_status: 1,
      response: {
        pickup_scheduled_date: new Date(Date.now() + 86400000).toISOString()
      }
    };
  }

  async generateLabel(shipmentId: string): Promise<any> {
    return {
      label_created: 1,
      label_download_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    };
  }
}

export const getShippingProvider = (): IShippingProvider => {
  if (SHIPROCKET_CONFIG.MODE === "live") {
    return new ShiprocketLiveProvider();
  }
  return new ShiprocketMockProvider();
};
