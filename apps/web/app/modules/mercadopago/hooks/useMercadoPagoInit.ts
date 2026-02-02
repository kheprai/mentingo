import { useEffect, useState } from "react";

import { mercadoPagoPublicKeyQueryOptions } from "~/api/queries/useMercadoPagoPublicKey";
import { queryClient } from "~/api/queryClient";

export const useMercadoPagoInit = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMP = async () => {
      try {
        // Dynamic import to avoid SSR/ESM issues
        const { initMercadoPago } = await import("@mercadopago/sdk-react");

        const { data } = await queryClient.fetchQuery(mercadoPagoPublicKeyQueryOptions());

        const publicKey = data?.publicKey || import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

        if (!publicKey) {
          setError("MercadoPago public key not configured");
          return;
        }

        initMercadoPago(publicKey, { locale: "es-AR" });
        setIsInitialized(true);
      } catch (err) {
        console.error("MercadoPago init error:", err);
        setError("Failed to initialize MercadoPago");
      }
    };

    initMP();
  }, []);

  return { isInitialized, error };
};
