"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("business_name, address, latitude, longitude")
        .eq("id", user.id)
        .single();

      if (data) {
        setBusinessName(data.business_name ?? "");
        setAddress(data.address ?? "");
        setLatitude(data.latitude);
        setLongitude(data.longitude);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    let lat = latitude;
    let lng = longitude;

    // Si hay dirección, la convertimos a coordenadas
    if (address.trim()) {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });

      const geoData = await res.json();

      if (geoData.error) {
        setSaving(false);
        setError(geoData.error);
        return;
      }

      lat = geoData.latitude;
      lng = geoData.longitude;
      setLatitude(lat);
      setLongitude(lng);
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        business_name: businessName,
        address,
        latitude: lat,
        longitude: lng,
      })
      .eq("id", user.id);

    setSaving(false);

    if (updateError) {
      setError("No se pudo guardar. Intenta de nuevo.");
      return;
    }

    setMessage("Guardado correctamente.");
  }

  if (loading) {
    return <p className="text-slate-400">Cargando...</p>;
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">
        Ajustes del negocio
      </h1>

      <form
        onSubmit={handleSave}
        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5"
      >
        <div className="mb-4">
          <label className="block text-slate-300 text-sm mb-1">
            Nombre del negocio
          </label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-indigo-500"
            placeholder="Mi Negocio"
          />
        </div>

        <div className="mb-4">
          <label className="block text-slate-300 text-sm mb-1">
            Dirección completa
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-indigo-500"
            placeholder="Calle, número, colonia, ciudad"
          />
          <p className="text-slate-500 text-xs mt-1">
            Se usará para calcular tu competencia cercana (5km).
          </p>
        </div>

        {latitude && longitude && (
          <p className="text-slate-500 text-xs mb-4">
            Ubicación detectada: {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </p>
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
        {message && (
          <p className="text-green-400 text-sm mb-4">{message}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}
