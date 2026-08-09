import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { authorName, rating, comment } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta configurar GEMINI_API_KEY en Vercel." },
      { status: 500 }
    );
  }

  const prompt = `Eres el encargado de atención al cliente de un negocio. Redacta una respuesta breve, profesional y cálida en español para esta reseña de Google.

Cliente: ${authorName}
Calificación: ${rating} de 5 estrellas
Comentario: "${comment}"

Reglas:
- Si la calificación es 4 o 5, agradece y sé cercano, sin exagerar.
- Si la calificación es 1, 2 o 3, discúlpate sin ser servil, muestra que se toma en cuenta, e invita a contactar directamente para resolverlo.
- Máximo 3 frases.
- No firmes con un nombre.
- Responde solo con el texto de la respuesta, sin comillas ni explicaciones.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Error de Gemini: ${errText}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    return NextResponse.json({ text });
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo generar la respuesta." },
      { status: 500 }
    );
  }
}
