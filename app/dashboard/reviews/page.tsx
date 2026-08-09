"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  author_name: string;
  rating: number;
  comment: string | null;
  ai_response: string | null;
  source: string;
  created_at: string;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Formulario para agregar reseña manual
  const [authorName, setAuthorName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [adding, setAdding] = useState(false);

  async function loadReviews() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data } = await supabase
      .from("reviews")
      .select("*")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });

    setReviews(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadReviews();
  }, []);

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: inserted, error } = await supabase
      .from("reviews")
      .insert({
        profile_id: user.id,
        author_name: authorName,
        rating,
        comment,
        source: "manual",
      })
      .select()
      .single();

    setAdding(false);
    setAuthorName("");
    setRating(5);
    setComment("");

    if (!error && inserted) {
      setReviews((prev) => [inserted as Review, ...prev]);
      // Generar respuesta automática al agregarla
      handleGenerate(inserted as Review);
    }
  }

  async function handleGenerate(review: Review) {
    setGeneratingId(review.id);

    try {
      const res = await fetch("/api/generate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: review.author_name,
          rating: review.rating,
          comment: review.comment,
        }),
      });

      const data = await res.json();

      if (data.text) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === review.id ? { ...r, ai_response: data.text } : r
          )
        );
      }
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleSaveResponse(review: Review) {
    setSavingId(review.id);

    await supabase
      .from("reviews")
      .update({ ai_response: review.ai_response })
      .eq("id", review.id);

    setSavingId(null);
  }

  function updateLocalResponse(id: string, text: string) {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ai_response: text } : r))
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Reseñas</h1>

      <form
        onSubmit={handleAddReview}
        className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 mb-8"
      >
        <h2 className="text-white font-medium mb-4">Agregar reseña</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-slate-300 text-sm mb-1">
              Nombre del cliente
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              required
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-1">
              Calificación
            </label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-indigo-500"
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} estrella{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-slate-300 text-sm mb-1">
            Comentario
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            rows={3}
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          disabled={adding}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
        >
          {adding ? "Agregando..." : "Agregar y generar respuesta"}
        </button>
      </form>

      {loading ? (
        <p className="text-slate-400">Cargando reseñas...</p>
      ) : reviews.length === 0 ? (
        <p className="text-slate-400">Todavía no hay reseñas.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">
                  {review.author_name}
                </span>
                <span className="text-yellow-400 text-sm">
                  {"★".repeat(review.rating)}
                  {"☆".repeat(5 - review.rating)}
                </span>
              </div>
              <p className="text-slate-300 text-sm mb-4">{review.comment}</p>

              <div className="border-t border-slate-800 pt-3">
                <label className="block text-slate-400 text-xs mb-1">
                  Respuesta (editable)
                </label>
                <textarea
                  value={review.ai_response ?? ""}
                  onChange={(e) =>
                    updateLocalResponse(review.id, e.target.value)
                  }
                  rows={2}
                  placeholder="Aún no hay respuesta generada."
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white text-sm outline-none focus:border-indigo-500"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleGenerate(review)}
                    disabled={generatingId === review.id}
                    className="text-sm bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 transition-colors"
                  >
                    {generatingId === review.id
                      ? "Generando..."
                      : "Regenerar con IA"}
                  </button>
                  <button
                    onClick={() => handleSaveResponse(review)}
                    disabled={savingId === review.id}
                    className="text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg px-3 py-1.5 transition-colors"
                  >
                    {savingId === review.id ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
