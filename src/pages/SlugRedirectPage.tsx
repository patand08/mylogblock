import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPageBySlug } from "@/lib/pageRepo";

export default function SlugRedirectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); return; }

    fetchPageBySlug(slug)
      .then((page) => {
        if (page) {
          // Replace current history entry so back button doesn't loop
          navigate(`/page/${page.id}`, { replace: true });
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true));
  }, [slug, navigate]);

  if (notFound) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-lb-base text-lb-text-muted">
        <span className="text-4xl">🔍</span>
        <p className="font-display text-sm">
          No page found at <span className="text-lb-text font-mono">/{slug}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-lb-base">
      <div className="w-5 h-5 rounded-full border-2 border-lb-neon-purple border-t-transparent animate-spin" />
    </div>
  );
}
