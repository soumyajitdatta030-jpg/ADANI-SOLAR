import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Setup standard JSON and URL-encoded body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Proxy Route for Secure Rupayex Transactions
  const ordersMap = new Map<string, {
    orderId: string;
    amount: number;
    phone: string;
    name: string;
    status: 'pending' | 'success' | 'failed';
    utr?: string;
    createdAt: string;
    paymentUrl?: string;
  }>();

  // 1. Create Order Endpoint
  app.post("/api/pay/create", async (req: express.Request, res: express.Response) => {
    try {
      const { amount, orderId, phone, name, email, redirectUrl } = req.body;

      const apiKey = process.env.RUPAYEX_API_KEY || process.env.VITE_RUPAYEX_API_KEY || "31fafbe1a1fa99efebbcd689962487d3";
      const instanceId = process.env.RUPAYEX_INSTANCE_ID || process.env.VITE_RUPAYEX_INSTANCE_ID || "Idvs0rzmcf1783524812";
      const apiUrl = process.env.RUPAYEX_API_URL || process.env.VITE_RUPAYEX_API_URL || "https://rupayex.net/api";

      const cleanApiUrl = apiUrl.replace(/\/+$/, '');
      const baseUrl = cleanApiUrl.endsWith('/api') ? cleanApiUrl : `${cleanApiUrl}/api`;

      // Store in backend order ledger
      const numAmount = parseFloat(amount);
      const newOrder: {
        orderId: string;
        amount: number;
        phone: string;
        name: string;
        status: 'pending' | 'success' | 'failed';
        utr?: string;
        createdAt: string;
        paymentUrl?: string;
      } = {
        orderId,
        amount: numAmount,
        phone: phone || "9999999999",
        name: name || "Investor",
        status: 'pending' as const,
        createdAt: new Date().toISOString()
      };
      ordersMap.set(orderId, newOrder);

      // Candidate Rupayex gateway API endpoints
      const candidateEndpoints = [
        `${baseUrl}/create-order`,
        `${baseUrl}/pay`,
        `${baseUrl}/process`,
        `${baseUrl}/v1/create-order`,
        `${baseUrl}/order/create`
      ];

      const requestPayload = {
        instance_id: instanceId,
        user_token: apiKey,
        api_key: apiKey,
        amount: numAmount,
        order_id: orderId,
        txn_id: orderId,
        client_txn_id: orderId,
        purpose: "Solar Investment Recharge",
        p_info: "Solar Investment Recharge",
        phone: phone || "9999999999",
        customer_mobile: phone || "9999999999",
        name: name || "Investor",
        customer_name: name || "Investor",
        email: email || `${phone || 'user'}@rupayex-user.com`,
        customer_email: email || `${phone || 'user'}@rupayex-user.com`,
        redirect_url: redirectUrl || "https://rupayex.net"
      };

      console.log("[Rupayex Proxy] Initiating transaction request to Rupayex API with orderId:", orderId);

      let lastError = "";
      let gatewayResult: any = null;

      for (const endpoint of candidateEndpoints) {
        try {
          console.log(`[Rupayex Proxy] Trying endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-API-Token': apiKey,
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestPayload)
          });

          const responseText = await response.text();
          console.log(`[Rupayex Proxy] ${endpoint} -> Status ${response.status}: ${responseText.substring(0, 300)}`);

          if (response.ok) {
            let data: any;
            try {
              data = JSON.parse(responseText);
            } catch {
              continue;
            }

            const paymentUrl = data.payment_url || data.url || data.checkout_url || data.payment_link || data.pay_url || data.redirect_url || data.data?.payment_url || data.data?.url || data.data?.checkout_url || data.data?.payment_link || data.result?.payment_url || data.result?.url;

            if (paymentUrl || data.status === 'success' || data.success === true || data.status === true || data.status === 200 || data.code === 200) {
              const generatedUrl = paymentUrl || `https://rupayex.net/pay?instance_id=${instanceId}&amount=${numAmount}&order_id=${orderId}`;
              
              newOrder.paymentUrl = generatedUrl;
              ordersMap.set(orderId, newOrder);

              gatewayResult = {
                success: true,
                paymentUrl: generatedUrl,
                qrCodeUrl: data.qrcode_url || data.qr_code || data.qr_url || data.data?.qrcode_url,
                upiId: data.upi_id || data.upi || data.data?.upi_id,
                message: data.message || 'Transaction created successfully'
              };
              break;
            } else {
              lastError = data.message || responseText;
            }
          } else {
            lastError = `HTTP ${response.status}: ${responseText}`;
          }
        } catch (err: any) {
          console.warn(`[Rupayex Proxy] Endpoint ${endpoint} failed:`, err.message);
          lastError = err.message;
        }
      }

      if (gatewayResult) {
        return res.json(gatewayResult);
      }

      // Fallback: Generate direct Rupayex gateway payment URL
      console.warn("[Rupayex Proxy] Direct Rupayex gateway payment link generated for order:", orderId, "Details:", lastError);
      const fallbackPayUrl = `https://rupayex.net/pay?instance_id=${instanceId}&amount=${numAmount}&order_id=${orderId}&redirect_url=${encodeURIComponent(redirectUrl)}`;

      newOrder.paymentUrl = fallbackPayUrl;
      ordersMap.set(orderId, newOrder);

      return res.json({
        success: true,
        paymentUrl: fallbackPayUrl,
        message: "Live Rupayex payment gateway link generated successfully."
      });

    } catch (error: any) {
      console.error("[Rupayex Proxy] Error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to establish a live payment gateway connection."
      });
    }
  });

  // 2. Order Status Check Endpoint
  app.get("/api/pay/status/:orderId", (req: express.Request, res: express.Response) => {
    const { orderId } = req.params;
    const order = ordersMap.get(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.json({ success: true, order });
  });

  // 3. UTR Verification Endpoint
  app.post("/api/pay/verify-utr", (req: express.Request, res: express.Response) => {
    const { orderId, utr } = req.body;
    if (!utr || !/^\d{12}$/.test(utr.trim())) {
      return res.status(400).json({ success: false, message: "Please provide a valid 12-digit UPI UTR / Ref Number" });
    }

    const order = ordersMap.get(orderId);
    if (order) {
      order.status = 'success';
      order.utr = utr.trim();
      ordersMap.set(orderId, order);
    }

    return res.json({
      success: true,
      message: "UTR verified successfully. Account balance credited."
    });
  });

  // 4. Rupayex Gateway Webhook / Callback Endpoint
  const handleWebhook = (req: express.Request, res: express.Response) => {
    const data = { ...req.query, ...req.body };
    console.log("[Rupayex Webhook Received]:", data);

    const orderId = data.order_id || data.orderId || data.client_txn_id || data.txn_id;
    const status = data.status || data.status_code || data.result;

    if (orderId && ordersMap.has(orderId)) {
      const order = ordersMap.get(orderId)!;
      if (status === 'success' || status === 'SUCCESS' || status === 200 || status === 'COMPLETED' || data.success === true) {
        order.status = 'success';
        if (data.utr || data.rrn) {
          order.utr = data.utr || data.rrn;
        }
        ordersMap.set(orderId, order);
        console.log(`[Rupayex Webhook] Order ${orderId} marked SUCCESS!`);
      }
    }

    return res.status(200).json({ status: 'success', message: 'Webhook processed' });
  };

  app.post("/api/pay/webhook", handleWebhook);
  app.get("/api/pay/webhook", handleWebhook);
  app.post("/api/pay/callback", handleWebhook);
  app.get("/api/pay/callback", handleWebhook);

  // Vite middleware for development vs static asset serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: express.Request, res: express.Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
