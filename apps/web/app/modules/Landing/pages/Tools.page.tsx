import { useTranslation } from "react-i18next";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

interface Tool {
  id: string;
  name: string;
  description: string;
  offer?: string;
  price?: string;
  originalPrice?: string;
  url: string;
  logoUrl?: string;
}

const tools: Tool[] = [
  {
    id: "chatgpt",
    name: "ChatGPT Plus",
    description: "Acceso a GPT-4, plugins y funciones avanzadas de IA conversacional.",
    offer: "20% descuento",
    price: "$16/mes",
    originalPrice: "$20/mes",
    url: "https://openai.com/chatgpt",
  },
  {
    id: "claude",
    name: "Claude Pro",
    description: "IA conversacional avanzada con mayor capacidad de contexto y razonamiento.",
    offer: "Prueba gratis 7 dias",
    price: "$20/mes",
    url: "https://claude.ai",
  },
  {
    id: "midjourney",
    name: "Midjourney",
    description: "Generacion de imagenes con IA de alta calidad para proyectos creativos.",
    price: "$10/mes",
    url: "https://midjourney.com",
  },
  {
    id: "notion-ai",
    name: "Notion AI",
    description: "Asistente de IA integrado en Notion para productividad y escritura.",
    offer: "Especial comunidad",
    price: "$8/mes",
    originalPrice: "$10/mes",
    url: "https://notion.so/ai",
  },
  {
    id: "cursor",
    name: "Cursor",
    description: "Editor de codigo con IA integrada para desarrollo mas rapido.",
    offer: "50% primer mes",
    price: "$10/mes",
    originalPrice: "$20/mes",
    url: "https://cursor.sh",
  },
  {
    id: "perplexity",
    name: "Perplexity Pro",
    description: "Motor de busqueda con IA que proporciona respuestas precisas con fuentes.",
    price: "$20/mes",
    url: "https://perplexity.ai",
  },
];

export default function ToolsPage() {
  const { t } = useTranslation();

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl">
            {t("landing.tools.title")}
          </h1>
          <p className="mt-6 text-lg text-neutral-600">{t("landing.tools.description")}</p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Card key={tool.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{tool.name}</CardTitle>
                    {tool.offer && (
                      <Badge variant="success" className="mt-2">
                        {tool.offer}
                      </Badge>
                    )}
                  </div>
                  {tool.logoUrl && (
                    <img
                      src={tool.logoUrl}
                      alt={`${tool.name} logo`}
                      className="h-10 w-10 rounded-lg object-contain"
                    />
                  )}
                </div>
                <CardDescription className="mt-2">{tool.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-neutral-900">{tool.price}</span>
                  {tool.originalPrice && (
                    <span className="text-sm text-neutral-500 line-through">
                      {tool.originalPrice}
                    </span>
                  )}
                </div>
                <Button className="mt-4 w-full" asChild>
                  <a href={tool.url} target="_blank" rel="noopener noreferrer">
                    {t("landing.tools.viewTool")}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-2xl bg-primary-50 p-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900">{t("landing.tools.cta.title")}</h2>
          <p className="mt-4 text-neutral-600">{t("landing.tools.cta.description")}</p>
        </div>
      </div>
    </section>
  );
}
