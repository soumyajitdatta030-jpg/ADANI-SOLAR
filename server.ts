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

      if (!apiKey || !instanceId) {
        console.warn("[Rupayex Proxy] API Key or Instance ID missing in server environment variables.");
        return res.status(400).json({
          success: false,
          message: "Payment credentials (API Key or Instance ID) are not configured on the server."
        });
      }

      console.log("[Rupayex Proxy] Initiating transaction request to Rupayex API:", {
        apiUrl,
        instanceId,
        amount,
        orderId,
      });

      // Format correct endpoint base and target create-order
      const baseApiUrl = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`;
      const targetUrl = `${baseApiUrl}/create-order`;

      console.log(`[Rupayex Proxy] Hitting secure Rupayex endpoint: ${targetUrl}`);
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Token': apiKey
        },
        body: JSON.stringify({
          instance_id: instanceId,
          amount: parseFloat(amount),
          order_id: orderId,
          purpose: 'Solar Investment Recharge',
          phone: phone,
          name: name,
          email: email || `${phone}@rupayex-user.com`,
          redirect_url: redirectUrl,
        })
      });

      const responseText = await response.text();
      console.log(`[Rupayex Proxy] Response Status: ${response.status}, Body: ${responseText.substring(0, 1000)}`);

      if (response.ok) {
        let data: any;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          throw new Error(`Rupayex server returned non-JSON response: ${responseText}`);
        }

        if (data.status === 'success' || data.success === true || data.status === true) {
          return res.json({
            success: true,
            paymentUrl: data.payment_url || data.url || data.checkout_url,
            qrCodeUrl: data.qrcode_url || data.qr_url,
            upiId: data.upi_id || data.upi,
            message: data.message || 'Transaction created successfully'
          });
        } else {
          throw new Error(data.message || 'Rupayex API returned a failure status.');
        }
      } else {
        throw new Error(`Rupayex server responded with status ${response.status}: ${responseText}`);
      }
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
