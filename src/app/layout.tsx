import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Estabilizador | Presupuesto para ingresos variables (Q + $)",
  description:
    "Para trabajadores informales o freelancers: aprende tus meses o semanas buenas y malas y calcula cuanto apartar cada semana para no quedarte sin dinero en temporada baja.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="light">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
