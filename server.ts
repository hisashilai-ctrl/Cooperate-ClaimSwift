import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Body parser with 25MB limit for receipt images
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// Gemini Vision Receipt Scanner endpoint
app.post('/api/scan-receipt', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        error: 'Gemini API key is not configured. Falling back to local smart parser.',
        fallback: true
      });
    }

    // Initialize Gemini API client as per skill guidelines
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    // Extract clean MIME type and raw base64 data
    let mimeType = 'image/png';
    let base64Data = imageBase64;

    const matches = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      mimeType = matches[1];
      base64Data = matches[2];
    }

    // Call Gemini 3.8 Flash Vision Model with structured JSON schema
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            },
            {
              text: 'Analyze this receipt or tax invoice image. Extract the merchant/store name, a concise purpose title, final total amount as a number, transaction date in YYYY-MM-DD format, currency code or symbol, category (Client Meals, Travel / Taxi, Office Supplies, Software / Tech, Entertainment, Hotel / Lodging, or Other), and a brief remark or invoice number.'
            }
          ]
        }
      ],
      config: {
        systemInstruction: 'You are an accurate corporate financial assistant and receipt OCR specialist. Extract structured expense claim details from invoices, receipts, and vouchers. Return strictly JSON matching the response schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            merchant: {
              type: Type.STRING,
              description: 'The vendor or company name on the receipt (e.g. Starbucks, Grab, Din Tai Fung)'
            },
            title: {
              type: Type.STRING,
              description: 'Concise title for the claim (e.g. Client Lunch, Taxi Transfer, Office Supplies)'
            },
            amount: {
              type: Type.NUMBER,
              description: 'The grand total amount paid'
            },
            currency: {
              type: Type.STRING,
              description: 'Currency code or symbol (e.g. RM, USD, EUR, SGD)'
            },
            date: {
              type: Type.STRING,
              description: 'Date of receipt in YYYY-MM-DD format'
            },
            category: {
              type: Type.STRING,
              description: 'Best matching category: Client Meals, Travel / Taxi, Office Supplies, Software / Tech, Entertainment, Hotel / Lodging, Other'
            },
            notes: {
              type: Type.STRING,
              description: 'Short invoice/receipt number or notable line items'
            }
          },
          required: ['merchant', 'amount', 'date', 'category']
        }
      }
    });

    const outputText = response.text || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(outputText);
    } catch (parseErr) {
      console.warn('Failed to parse Gemini response JSON:', outputText);
      return res.status(500).json({ error: 'Failed to parse AI response', raw: outputText });
    }

    return res.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error('Gemini OCR Error:', error);
    return res.status(500).json({
      error: error.message || 'Error processing receipt with Gemini Vision',
      details: String(error)
    });
  }
});

// Setup Vite dev server or static serving
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
