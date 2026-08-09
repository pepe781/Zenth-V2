import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { address } = await req.json();

  if (!address || typeof address !== "string") {
    return NextResponse.json(
      { error: "Falta la dirección." },
      { status: 400 }
    );
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
      address
    )}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "ZenthApp/1.0 (contacto@zenth.app)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "No se pudo consultar la ubicación." },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No se encontró esa dirección. Intenta ser más específico." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Error al buscar la dirección." },
      { status: 500 }
    );
  }
}
