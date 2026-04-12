// src/app/privacidad/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Política de Privacidad — dotaciones.cl",
  description: "Política de privacidad y tratamiento de datos personales de dotaciones.cl, operado por Nexwork SpA.",
  alternates: { canonical: "https://dotaciones.cl/privacidad" },
};

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Sora',sans-serif;background:#FAFAF7;}
  a{text-decoration:none;color:inherit;}

  .hero{background:#0C1F15;padding:56px 40px 64px;}
  .hero-in{max-width:760px;margin:0 auto;}
  .h1{font-size:clamp(28px,4vw,44px);font-weight:800;color:#fff;letter-spacing:-.03em;margin-bottom:10px;}
  .updated{font-size:12px;color:rgba(255,255,255,.35);margin-top:8px;}

  .body{max-width:760px;margin:0 auto;padding:56px 40px;}
  .doc{background:#fff;border:1.5px solid #E5E3DB;border-radius:16px;padding:48px;gap:32px;display:flex;flex-direction:column;}
  .sec h2{font-size:15px;font-weight:700;color:#111;margin-bottom:10px;}
  .sec p,.sec li{font-size:14px;color:#374151;line-height:1.7;font-weight:300;}
  .sec ul{padding-left:20px;margin:8px 0;}
  .sec li{margin:5px 0;}
  .sec a{color:#2D6A4F;text-decoration:underline;text-underline-offset:3px;}
  .divider{height:1px;background:#E5E3DB;}
  .contact-box{background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:16px 20px;margin-top:10px;}
  .contact-box p{font-size:13px;color:#166534;line-height:1.65;}

  @media(max-width:768px){
    .hero,.body{padding-left:20px;padding-right:20px;}
    .doc{padding:28px 22px;}
  }
`;

export default function Privacidad() {
  const sections = [
    {
      title: "1. Responsable del tratamiento",
      content: (
        <p>El sitio dotaciones.cl es operado por <strong>Nexwork SpA</strong>, empresa constituida en Chile. Para consultas sobre privacidad escríbenos a <a href="mailto:contacto@dotaciones.cl">contacto@dotaciones.cl</a>.</p>
      ),
    },
    {
      title: "2. Datos que recopilamos",
      content: (
        <>
          <p style={{ marginBottom: 8 }}>Solo los datos que tú nos proporcionas voluntariamente:</p>
          <ul>
            <li><strong>Email y nombre</strong> — cuando solicitas un análisis IA o te suscribes al blog.</li>
            <li><strong>Empresa y cargo</strong> — opcionales, en el formulario de análisis.</li>
            <li><strong>Datos del cálculo</strong> — parámetros ingresados en la calculadora para generar el análisis. No se asocian a tu identidad sin consentimiento.</li>
          </ul>
          <p style={{ marginTop: 8 }}>No recopilamos cookies de seguimiento ni información de dispositivos más allá de lo estrictamente necesario.</p>
        </>
      ),
    },
    {
      title: "3. Finalidad del tratamiento",
      content: (
        <ul>
          <li>Enviarte el análisis IA de tu dotación por correo electrónico.</li>
          <li>Enviarte nuevos artículos del blog si te suscribiste (cancelable en cualquier momento).</li>
          <li>Mejorar la herramienta a partir del uso agregado y anónimo.</li>
          <li>Contactarte si expresaste interés en consultoría o servicios de Nexwork SpA.</li>
        </ul>
      ),
    },
    {
      title: "4. Servicios de terceros",
      content: (
        <ul>
          <li><strong>Vercel</strong> — hosting y despliegue del sitio web.</li>
          <li><strong>Resend</strong> — envío de correos electrónicos transaccionales.</li>
          <li><strong>Anthropic (Claude)</strong> — generación del análisis IA.</li>
          <li><strong>Notion</strong> — almacenamiento interno de leads y gestión de contenido.</li>
        </ul>
      ),
    },
    {
      title: "5. Base legal",
      content: (
        <p>El tratamiento se basa en tu consentimiento explícito al ingresar tu email. En Chile nos regimos por la <strong>Ley N° 19.628 sobre Protección de la Vida Privada</strong> y sus modificaciones.</p>
      ),
    },
    {
      title: "6. Retención de datos",
      content: (
        <p>Conservamos tus datos mientras mantengas una relación activa con dotaciones.cl. Puedes solicitar la eliminación en cualquier momento escribiéndonos a <a href="mailto:contacto@dotaciones.cl">contacto@dotaciones.cl</a>.</p>
      ),
    },
    {
      title: "7. Tus derechos",
      content: (
        <ul>
          <li>Acceder a los datos que tenemos sobre ti.</li>
          <li>Solicitar la corrección de datos incorrectos.</li>
          <li>Solicitar la eliminación de tus datos.</li>
          <li>Revocar tu consentimiento en cualquier momento.</li>
          <li>Oponerte al uso de tus datos con fines de marketing.</li>
        </ul>
      ),
    },
    {
      title: "8. Cookies",
      content: (
        <p>dotaciones.cl no utiliza cookies de seguimiento ni de publicidad. Podemos usar cookies técnicas estrictamente necesarias para el funcionamiento del sitio.</p>
      ),
    },
    {
      title: "9. Contacto",
      content: (
        <div className="contact-box">
          <p><strong>Nexwork SpA · dotaciones.cl</strong><br />Chile<br /><a href="mailto:contacto@dotaciones.cl">contacto@dotaciones.cl</a></p>
        </div>
      ),
    },
  ];

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#FAFAF7" }}>
      <style dangerouslySetInnerHTML={{ __html: S }} />
      <SiteNav />

      <div className="hero">
        <div className="hero-in">
          <h1 className="h1">Política de Privacidad</h1>
          <div className="updated">Última actualización: 12 de abril de 2026</div>
        </div>
      </div>

      <div className="body">
        <div className="doc">
          {sections.map((sec, i) => (
            <div key={i}>
              <div className="sec">
                <h2>{sec.title}</h2>
                {sec.content}
              </div>
              {i < sections.length - 1 && <div className="divider" />}
            </div>
          ))}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}