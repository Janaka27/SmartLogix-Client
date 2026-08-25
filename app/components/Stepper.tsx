export const CHECKOUT_STEPS = ["Cart", "Delivery", "Payment", "Review"] as const;

export function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {CHECKOUT_STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                i <= current ? "bg-white text-black" : "bg-white/15 text-white/60"
              }`}
            >
              {i < current ? "✓" : i + 1}
            </span>
            <span
              className={`hidden text-xs font-medium sm:inline ${
                i <= current ? "text-white" : "text-white/50"
              }`}
            >
              {step}
            </span>
          </div>
          {i < CHECKOUT_STEPS.length - 1 && (
            <span className={`h-px w-6 sm:w-10 ${i < current ? "bg-white" : "bg-white/20"}`} />
          )}
        </div>
      ))}
    </div>
  );
}
