"use client";

import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { StripeElementsOptions } from "@stripe/stripe-js";
import { getStripe } from "@/lib/stripe/client";

const ELEMENTS_APPEARANCE: StripeElementsOptions["appearance"] = {
  theme: "stripe",
  variables: {
    colorPrimary: "#000000",
    colorText: "#000000",
    colorTextSecondary: "#808080",
    colorBackground: "#ffffff",
    colorDanger: "#202020",
    borderRadius: "12px",
    fontFamily: "var(--font-sans), Arial, Helvetica, sans-serif",
  },
  rules: {
    ".Input": { border: "1px solid #e0e0e0", boxShadow: "none" },
    ".Input:focus": { border: "1px solid #000000", boxShadow: "none" },
    ".Label": { fontSize: "12px", fontWeight: "500", color: "#404040" },
  },
};

function PayButton({
  submitting,
  onSubmit,
  error,
}: {
  submitting: boolean;
  onSubmit: () => void;
  error: string | null;
}) {
  return (
    <>
      {error && (
        <p className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs font-medium text-black">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="mt-4 w-full rounded-full bg-primary py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Confirming payment…" : "Pay & Place Order"}
      </button>
    </>
  );
}

function CheckoutForm({ onPaid }: { onPaid: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Please check your card details.");
      setSubmitting(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      onPaid();
      return;
    }

    setError("Payment was not completed. Please try again.");
    setSubmitting(false);
  };

  return (
    <div className="mt-4">
      <PaymentElement />
      <PayButton submitting={submitting} onSubmit={handleSubmit} error={error} />
    </div>
  );
}

export function CardPaymentForm({
  clientSecret,
  onPaid,
}: {
  clientSecret: string;
  onPaid: () => void;
}) {
  return (
    <Elements
      stripe={getStripe()}
      options={{ clientSecret, appearance: ELEMENTS_APPEARANCE }}
    >
      <CheckoutForm onPaid={onPaid} />
    </Elements>
  );
}
