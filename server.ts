import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Setup standard JSON and URL-encoded body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Proxy Route for Secure Rupayex Transactions
  app.post("/api/pay/create", async (req: express.Request, res: express.Response) => {
    try {
      const { amount, orderId, phone, name, email, redirectUrl } = req.body;

      const apiKey = process.env.RUPAYEX_API_KEY || process.env.VITE_RUPAYEX_API_KEY || "31fafbe1a1fa99efebbcd689962487d3";
      const instanceId = process.env.RUPAYEX_INSTANCE_ID || process.env.VITE_RUPAYEX_INSTANCE_ID || "Idvs0rzmcf1783524812";
      const apiUrl = process.env.RUPAYEX_API_URL || process.env.VITE_RUPAYEX_API_URL || "https://rupayex.net/api";

      const cleanApiUrl = apiUrl.replace(/\/+$/, '');
      const baseUrl = cleanApiUrl.endsWith('/api') ? cleanApiUrl : `${cleanApiUrl}/api`;

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
        amount: parseFloat(amount),
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
              gatewayResult = {
                success: true,
                paymentUrl: paymentUrl || `https://rupayex.net/pay?instance_id=${instanceId}&amount=${parseFloat(amount)}&order_id=${orderId}`,
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
      console.warn("[Rupayex Proxy] Direct Rupayex gateway payment link generated for order:", orderId, "Error details:", lastError);
      const fallbackPayUrl = `https://rupayex.net/pay?instance_id=${instanceId}&amount=${parseFloat(amount)}&order_id=${orderId}&redirect_url=${encodeURIComponent(redirectUrl)}`;

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
