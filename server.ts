import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

// Enable large payloads for multimodal invoice images/PDF base64
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Lazy get or initialize Gemini AI Client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Primary Endpoint: Process and Extract Invoice with Gemini 3.7 Flash
app.post('/api/process-invoice', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType, rawText, fileName } = req.body;

    if (!imageBase64 && !rawText) {
      return res.status(400).json({ error: 'Missing image or text payload for invoice extraction' });
    }

    const ai = getGeminiClient();

    // If Gemini API key is not yet set, we provide a smart fallback response with warning
    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY environment variable is not configured. Please add your Gemini API Key in the Settings panel.',
        code: 'MISSING_API_KEY',
      });
    }

    const systemInstruction = `You are an elite, highly precise Document AI specialist & Financial Auditor.
Your task is to analyze the provided invoice, receipt, purchase order, or billing statement and extract structured data with 100% precision.

Auditing Guidelines:
1. Thoroughly parse vendor identity, tax/VAT identification, payment bank details, customer info, invoice metadata, line items, and monetary totals.
2. Verify line-item arithmetic: (quantity * unitPrice) against item totals, and subtotal + taxTotal - discounts against grandTotal.
3. Perform risk analysis: Check for missing tax IDs, ambiguous descriptions, excessive single-item charges, unusual due dates, or missing payment details.
4. Classify the invoice into a high-level category (Software & SaaS, Hardware & Equipment, Professional Services, Logistics & Shipping, Marketing & Advertising, Office & Facilities, Travel & Entertainment, Utilities, Other).
5. Generate a concise 2-sentence executive summary highlighting the primary expenditure and payment timing.
6. Rate your overall extraction confidence from 50 to 99.
7. Return strictly valid JSON adhering to the specified schema.`;

    const extractionPrompt = `Please parse all details from this invoice file "${fileName || 'document'}" and perform a complete financial audit.`;

    const contentsPayload: any[] = [];

    if (imageBase64) {
      // Clean base64 string if data URL prefix exists
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const validMime = mimeType || 'image/png';

      contentsPayload.push({
        inlineData: {
          mimeType: validMime,
          data: cleanBase64,
        },
      });
    }

    if (rawText) {
      contentsPayload.push({
        text: `Raw Invoice Content / Text:\n${rawText}`,
      });
    }

    contentsPayload.push({
      text: extractionPrompt,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: contentsPayload,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            invoiceNumber: { type: Type.STRING, description: 'Invoice or bill number, or placeholder if none' },
            invoiceDate: { type: Type.STRING, description: 'Date of invoice issue in YYYY-MM-DD format if possible' },
            dueDate: { type: Type.STRING, description: 'Payment due date in YYYY-MM-DD format if possible' },
            purchaseOrderNumber: { type: Type.STRING, description: 'PO number if specified' },
            paymentTerms: { type: Type.STRING, description: 'e.g. Net 30, Due upon receipt, 2/10 Net 30' },
            currency: { type: Type.STRING, description: '3-letter ISO currency code, e.g. USD, EUR, GBP, CAD' },
            
            vendor: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                address: { type: Type.STRING },
                phone: { type: Type.STRING },
                email: { type: Type.STRING },
                taxIdOrVat: { type: Type.STRING },
                bankDetails: {
                  type: Type.OBJECT,
                  properties: {
                    bankName: { type: Type.STRING },
                    ibanOrAccount: { type: Type.STRING },
                    swiftBic: { type: Type.STRING },
                    routingNumber: { type: Type.STRING },
                  },
                },
              },
              required: ['name'],
            },
            
            customer: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                address: { type: Type.STRING },
                taxId: { type: Type.STRING },
                contactPerson: { type: Type.STRING },
                email: { type: Type.STRING },
              },
              required: ['name'],
            },

            lineItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unitPrice: { type: Type.NUMBER },
                  taxRate: { type: Type.NUMBER },
                  taxAmount: { type: Type.NUMBER },
                  discount: { type: Type.NUMBER },
                  total: { type: Type.NUMBER },
                  skuOrCode: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ['description', 'quantity', 'unitPrice', 'total'],
              },
            },

            subtotal: { type: Type.NUMBER, description: 'Subtotal before taxes/discounts' },
            taxTotal: { type: Type.NUMBER, description: 'Total tax or VAT amount' },
            discountTotal: { type: Type.NUMBER, description: 'Total discount amount applied' },
            shippingHandling: { type: Type.NUMBER, description: 'Shipping or freight charges' },
            grandTotal: { type: Type.NUMBER, description: 'Final total amount payable' },

            category: {
              type: Type.STRING,
              description: 'Classification: Software & SaaS, Hardware & Equipment, Professional Services, Logistics & Shipping, Marketing & Advertising, Office & Facilities, Travel & Entertainment, Utilities, Other',
            },
            confidenceScore: { type: Type.NUMBER, description: 'Confidence score between 50 and 99' },
            summary: { type: Type.STRING, description: 'Concise executive summary of this invoice' },
            
            anomalies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: 'math_error, high_amount, duplicate_risk, due_date_warning, missing_tax_id, info' },
                  severity: { type: Type.STRING, description: 'low, medium, high, critical' },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  suggestedAction: { type: Type.STRING },
                },
                required: ['type', 'severity', 'title', 'description'],
              },
            },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['invoiceNumber', 'invoiceDate', 'currency', 'vendor', 'customer', 'lineItems', 'subtotal', 'grandTotal', 'category', 'confidenceScore', 'summary'],
        },
      },
    });

    const rawJson = response.text || '{}';
    const parsedData = JSON.parse(rawJson);

    // Format and assign IDs to line items
    if (Array.isArray(parsedData.lineItems)) {
      parsedData.lineItems = parsedData.lineItems.map((item: any, index: number) => ({
        ...item,
        id: `item-${Date.now()}-${index}`,
        quantity: typeof item.quantity === 'number' ? item.quantity : 1,
        unitPrice: typeof item.unitPrice === 'number' ? item.unitPrice : 0,
        total: typeof item.total === 'number' ? item.total : (item.quantity || 1) * (item.unitPrice || 0),
      }));
    } else {
      parsedData.lineItems = [];
    }

    const processedInvoice = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      fileName: fileName || 'uploaded_invoice',
      fileSize: req.body.fileSize || 0,
      fileType: mimeType || 'image/png',
      previewUrl: imageBase64 || undefined,
      uploadedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      status: (parsedData.anomalies && parsedData.anomalies.some((a: any) => a.severity === 'critical' || a.severity === 'high')) ? 'needs_review' : 'approved',
      paymentStatus: 'unpaid',
      notes: '',
      ...parsedData,
    };

    return res.json({ success: true, invoice: processedInvoice });
  } catch (error: any) {
    console.error('Invoice extraction error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process invoice with Gemini AI',
      details: error.toString(),
    });
  }
});

// Secondary Endpoint: Conversational Assistant on Invoice Data
app.post('/api/chat-invoice', async (req: Request, res: Response) => {
  try {
    const { invoiceData, question, conversationHistory = [] } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Gemini API key is not configured.' });
    }

    const systemInstruction = `You are a financial controller and expert invoice consultant.
You are helping the user analyze, verify, and take action on the following invoice data:
${JSON.stringify(invoiceData, null, 2)}

Provide clear, professional, direct answers. You can help verify payment terms, draft vendor emails (disputes, tax ID requests, early discount inquiries), calculate prorated amounts, or explain tax implications.`;

    const chatMessages = [
      ...conversationHistory.map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      })),
      {
        role: 'user',
        parts: [{ text: question }],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: chatMessages as any,
      config: {
        systemInstruction,
      },
    });

    return res.json({
      answer: response.text || 'No response generated.',
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message || 'Error processing question' });
  }
});

// Start Server and Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Invoice Processor v2 server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
