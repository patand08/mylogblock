import { useState, useRef } from "react";
import { verifyPassword, setAuthenticated } from "@/lib/auth";

interface Props {
  onUnlock: () => void;
}

export default function LockScreen({ onUnlock }: Props) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const ok = await verifyPassword(password);
    setLoading(false);

    if (ok) {
      setAuthenticated();
      onUnlock();
    } else {
      setError(true);
      setPassword("");
      inputRef.current?.focus();
    }
  }

  return (
    <div className="fixed inset-0 bg-lb-base flex items-center justify-center overflow-hidden">
      {/* Decorative background */}
      <img
        src="/y2k-shape-112.svg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.03] pointer-events-none select-none"
      />

      {/* Animated accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] lb-sidebar-accent" />

      <div className="relative z-10 w-full max-w-sm px-8 flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img src="/mylogblock-logo.png" alt="MyLogBlock" className="w-14 h-14 opacity-90" />
          <h1 className="text-2xl font-brand lb-gradient-text">MyLogBlock</h1>
          <p className="text-xs text-lb-text-muted tracking-widest uppercase font-body">
            Block based note taker
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs text-lb-text-muted font-display tracking-widest uppercase">
              Access code
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="password"
                type={showPassword ? "text" : "password"}
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(false); }}
                placeholder="••••••••"
                className={`lb-input text-center tracking-[0.3em] text-lg font-display pr-10
                  ${error ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/30" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lb-text-muted hover:text-lb-text transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-400 text-center animate-pulse">
                Incorrect access code
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="px-4 py-2 rounded-lg font-bold bg-lb-action-orange hover:bg-lb-action-orange/90 text-white disabled:opacity-40 disabled:cursor-not-allowed w-full justify-center flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="opacity-60">Verifying…</span>
            ) : (
              <>
                <span>Enter workspace</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
