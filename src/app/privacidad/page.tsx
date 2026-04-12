// src/app/privacidad/page.tsx
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — dotaciones.cl",
  description: "Política de privacidad y tratamiento de datos personales de dotaciones.cl, operado por Nexwork SpA.",
  alternates: { canonical: "https://dotaciones.cl/privacidad" },
};

export default function Privacidad() {
  const updated = "12 de abril de 2026";

  return (
    <main className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-slate-900 text-lg tracking-tight">
            dotaciones<span className="text-blue-600">.cl</span>
          </Link>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <article className="max-w-3xl mx-auto px-6 py-12">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Política de Privacidad</h1>
          <p className="text-sm text-slate-400">Última actualización: {updated}</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-8 space-y-8 text-sm text-slate-700 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">1. Responsable del tratamiento</h2>
            <p>
              El sitio dotaciones.cl es operado por <strong>Nexwork SpA</strong>, empresa constituida en Chile
              (RUT en proceso de inscripción). Para consultas sobre privacidad puedes escribirnos a{" "}
              <a href="mailto:contacto@dotaciones.cl" className="text-blue-600 hover:underline">
                contacto@dotaciones.cl
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">2. Datos que recopilamos</h2>
            <p className="mb-3">Recopilamos únicamente los datos que tú nos proporcionas voluntariamente:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Email y nombre</strong> — cuando solicitas un análisis IA o te suscribes al blog.</li>
              <li><strong>Nombre de empresa y cargo</strong> — opcionales, cuando los ingresas en el formulario de análisis.</li>
              <li><strong>Datos del cálculo</strong> — los parámetros que ingresas en la calculadora (horas, contratos, días) para generar el análisis. No los asociamos a tu identidad sin tu consentimiento.</li>
            </ul>
            <p className="mt-3">
              No recopilamos datos de navegación, cookies de seguimiento, ni información de dispositivos más allá
              de lo estrictamente necesario para operar el sitio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">3. Finalidad del tratamiento</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Enviarte el análisis IA de tu dotación por correo electrónico.</li>
              <li>Enviarte nuevos artículos del blog si te suscribiste (puedes cancelar en cualquier momento).</li>
              <li>Mejorar la herramienta a partir del uso agregado y anónimo.</li>
              <li>Contactarte si expresaste interés en consultoría o en nuestros servicios.</li>
            </ul>
            <p className="mt-3">
              No usamos tus datos para publicidad de terceros ni los cedemos a otras empresas sin tu autorización explícita.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">4. Servicios de terceros</h2>
            <p className="mb-3">Para operar el sitio utilizamos los siguientes servicios:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Vercel</strong> — hosting y despliegue del sitio web.</li>
              <li><strong>Resend</strong> — envío de correos electrónicos transaccionales.</li>
              <li><strong>Anthropic (Claude)</strong> — generación del análisis IA a partir de los datos del cálculo.</li>
              <li><strong>Notion</strong> — almacenamiento interno de leads y gestión de contenido.</li>
            </ul>
            <p className="mt-3">
              Cada uno de estos proveedores tiene sus propias políticas de privacidad y están sujetos a contratos
              de procesamiento de datos conforme a la normativa vigente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">5. Base legal</h2>
            <p>
              El tratamiento de tus datos se basa en tu consentimiento explícito al ingresar tu email y en la
              ejecución de la prestación que solicitas (análisis IA, suscripción al blog). En Chile, nos regimos
              por la <strong>Ley N° 19.628 sobre Protección de la Vida Privada</strong> y sus modificaciones.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">6. Retención de datos</h2>
            <p>
              Conservamos tu email y los datos asociados mientras mantengas una relación activa con dotaciones.cl
              (suscripción vigente o interés en nuestros servicios). Puedes solicitar la eliminación de tus datos
              en cualquier momento escribiéndonos a{" "}
              <a href="mailto:contacto@dotaciones.cl" className="text-blue-600 hover:underline">
                contacto@dotaciones.cl
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">7. Tus derechos</h2>
            <p className="mb-3">Tienes derecho a:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Acceder a los datos que tenemos sobre ti.</li>
              <li>Solicitar la corrección de datos incorrectos.</li>
              <li>Solicitar la eliminación de tus datos.</li>
              <li>Revocar tu consentimiento en cualquier momento.</li>
              <li>Oponerte al uso de tus datos con fines de marketing.</li>
            </ul>
            <p className="mt-3">
              Para ejercer cualquiera de estos derechos, escríbenos a{" "}
              <a href="mailto:contacto@dotaciones.cl" className="text-blue-600 hover:underline">
                contacto@dotaciones.cl
              </a>{" "}
              y respondemos en un plazo máximo de 10 días hábiles.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">8. Cookies</h2>
            <p>
              dotaciones.cl no utiliza cookies de seguimiento ni de publicidad. Podemos usar cookies técnicas
              estrictamente necesarias para el funcionamiento del sitio (por ejemplo, para el funcionamiento
              del servidor), pero no rastreamos tu comportamiento entre sesiones.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">9. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política ocasionalmente. Cuando lo hagamos, actualizaremos la fecha al
              inicio del documento. Si los cambios son significativos, te informaremos por correo electrónico
              si tienes una suscripción activa.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-3">10. Contacto</h2>
            <p>
              Para cualquier consulta sobre esta política o el tratamiento de tus datos:
            </p>
            <div className="mt-3 bg-slate-50 rounded-lg p-4 text-sm">
              <p className="font-medium text-slate-800">Nexwork SpA</p>
              <p className="text-slate-600">dotaciones.cl</p>
              <p className="text-slate-600">Chile</p>
              <a href="mailto:contacto@dotaciones.cl" className="text-blue-600 hover:underline">
                contacto@dotaciones.cl
              </a>
            </div>
          </section>

        </div>
      </article>

      <footer className="border-t border-gray-200 py-6 px-6 text-center text-xs text-slate-400 mt-8">
        © {new Date().getFullYear()} dotaciones.cl · Nexwork SpA ·{" "}
        <Link href="/privacidad" className="hover:text-slate-600 transition-colors">Política de Privacidad</Link>
      </footer>
    </main>
  );
}