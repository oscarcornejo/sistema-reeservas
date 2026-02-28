/**
 * @fileoverview Plantillas HTML de email.
 * Usa inline styles para compatibilidad con clientes de correo.
 */

interface BookingConfirmationData {
    clientName: string;
    businessName: string;
    serviceName: string;
    professionalName: string;
    date: string;
    startTime: string;
    duration: number;
    price: string;
}

/**
 * Plantilla de confirmación de reserva para el cliente.
 */
export function bookingConfirmationTemplate(data: BookingConfirmationData) {
    const subject = `Confirmación de reserva — ${data.businessName}`;

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#f4f4f5;color:#18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#7c3aed;padding:24px 32px;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">TurnoPro</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#18181b;">
                ¡Reserva confirmada!
              </h2>
              <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.5;">
                Hola ${data.clientName}, tu cita ha sido agendada exitosamente.
              </p>
              <!-- Detalles -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf5ff;border-radius:8px;padding:20px;border:1px solid #e9d5ff;">
                <tr>
                  <td style="padding:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#71717a;width:140px;">Negocio</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:500;color:#18181b;">${data.businessName}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#71717a;">Servicio</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:500;color:#18181b;">${data.serviceName}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#71717a;">Profesional</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:500;color:#18181b;">${data.professionalName}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#71717a;">Fecha</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:500;color:#18181b;">${data.date}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#71717a;">Hora</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:500;color:#18181b;">${data.startTime}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#71717a;">Duración</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:500;color:#18181b;">${data.duration} min</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#71717a;">Precio</td>
                        <td style="padding:6px 0;font-size:14px;font-weight:600;color:#7c3aed;">${data.price}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;color:#a1a1aa;line-height:1.5;">
                Si necesitas cancelar o reprogramar, contacta directamente al negocio.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f4f4f5;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center;">
                Enviado por TurnoPro — Gestión de turnos inteligente
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

    return { subject, html };
}
