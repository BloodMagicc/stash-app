async function getPdfText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/build/pdf");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }

  return fullText;
}

export async function extractTextFromPdf(file: File): Promise<string> {
  return await getPdfText(file);
}

async function callGroq(pdfText: string) {
  const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
  if (!apiKey) throw new Error("Groq API key missing");

  const prompt = `
    Extract credit card statement details in INR from the text below.
    Return ONLY a raw JSON object matching this schema without codeblocks:
    {
      "cardIssuer": "string",
      "statementDate": "string",
      "totalAmountDueINR": number,
      "lineItems": [{ "description": "string", "amountINR": number }]
    }
    STATEMENT TEXT:
    ${pdfText}
  `;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You output strict raw JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    }),
  });

  if (!response.ok) throw new Error(`Groq HTTP Error: ${response.status}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function callGemini(pdfText: string) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key missing");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const responseSchema = {
    type: "OBJECT",
    properties: {
      cardIssuer: { type: "STRING" },
      statementDate: { type: "STRING" },
      totalAmountDueINR: { type: "NUMBER" },
      lineItems: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: { description: { type: "STRING" }, amountINR: { type: "NUMBER" } },
          required: ["description", "amountINR"],
        },
      },
    },
    required: ["totalAmountDueINR", "lineItems"],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `Extract credit card statement details in INR:\n${pdfText}` }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema },
    }),
  });

  if (!response.ok) throw new Error(`Gemini HTTP Error: ${response.status}`);
  const data = await response.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

export async function parseStatementWithAI(pdfText: string) {
  try {
    const data = await callGroq(pdfText);
    return { ...data, engineUsed: "Groq (Llama 3.3 70B)" };
  } catch (err) {
    console.warn("Groq failed. Falling back to Gemini...", err);
    const data = await callGemini(pdfText);
    return { ...data, engineUsed: "Gemini 2.5 Flash (Fallback)" };
  }
}
