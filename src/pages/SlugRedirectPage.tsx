import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePageBySlugQuery } from "@/lib/pageQueries";

export default function SlugRedirectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: page, isLoading, isError } = usePageBySlugQuery(slug);

  useEffect(() => {
    if (page) {
      // Replace current history entry so back button doesn't loop
      navigate(`/page/${page.id}`, { replace: true });
    }
  }, [page, navigate]);

  if (!slug || isError || (!isLoading && !page)) {
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
