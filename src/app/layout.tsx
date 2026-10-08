import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Freelance Cashflow Smoother | Tu Sueldo Estabilizado Semanal",
  description:
    "Transforma ingresos variables de freelance, comisiones o plataformas en una cuota semanal exacta de ahorro y un sueldo propio estabilizado con el algoritmo Waterfall Buffer + Gemini 3.8 Flash.",
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
