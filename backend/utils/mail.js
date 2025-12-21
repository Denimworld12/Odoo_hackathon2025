const nodemailer = require("nodemailer");
const { generateBookingPDF } = require("./pdfGenerator");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send booking confirmation email with PDF attachment
 * @param {string} toEmail - Recipient email
 * @param {Object} booking - Booking details
 * @returns {Promise}
 */
const sendBookingEmail = async (toEmail, booking) => {
  try {
    // Generate PDF
    const pdfBuffer = await generateBookingPDF(booking);

    const startTime = booking.start_time ? new Date(booking.start_time) : null;
    const dateStr = startTime 
      ? startTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : (booking.date || 'N/A');
    const timeStr = startTime 
      ? startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      : (booking.timeSlot || 'N/A');

    const mailOptions = {
      from: `"Aarakshan" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Booking Confirmation - ${booking.service_name || booking.serviceName || 'Appointment'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4F46E5; margin: 0;">Aarakshan</h1>
            <p style="color: #64748b; margin: 5px 0;">Booking Confirmation</p>
          </div>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px;">Booking Details</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; width: 40%;">Booking ID</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: bold;">${booking.id || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Service</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: bold;">${booking.service_name || booking.serviceName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Provider</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: bold;">${booking.provider_name || booking.providerName || 'Unassigned'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Date</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: bold;">${dateStr}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Time</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: bold;">${timeStr}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Location</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: bold;">${booking.location || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Status</td>
                <td style="padding: 8px 0;">
                  <span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                    ${(booking.status || 'PENDING').toUpperCase()}
                  </span>
                </td>
              </tr>
            </table>
          </div>
          
          ${(booking.booking_fee || booking.price) > 0 ? `
          <div style="background: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 20px; text-align: center;">
            <p style="color: #166534; margin: 0; font-size: 14px;">Amount Paid</p>
            <p style="color: #166534; margin: 5px 0 0 0; font-size: 24px; font-weight: bold;">₹${booking.booking_fee || booking.price}</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; padding: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">
              Please find your booking receipt attached as a PDF.
            </p>
            <p style="color: #94a3b8; margin: 0; font-size: 12px;">
              Please arrive 10 minutes before your scheduled appointment.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">
              Thank you for choosing Aarakshan!
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `booking-${booking.id || 'receipt'}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

module.exports = { transporter, sendBookingEmail };