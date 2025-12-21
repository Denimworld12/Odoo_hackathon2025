const PDFDocument = require('pdfkit');

/**
 * Generate a booking receipt PDF
 * @param {Object} booking - Booking details
 * @returns {Promise<Buffer>} - PDF buffer
 */
const generateBookingPDF = (booking) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).fillColor('#4F46E5').text('Aarakshan', { align: 'center' });
      doc.fontSize(12).fillColor('#64748b').text('Booking Confirmation', { align: 'center' });
      doc.moveDown(2);

      // Booking ID
      doc.fontSize(10).fillColor('#94a3b8').text('Booking Reference', { continued: false });
      doc.fontSize(14).fillColor('#1e293b').text(booking.id || 'N/A');
      doc.moveDown(1.5);

      // Divider
      doc.strokeColor('#e2e8f0').lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown(1);

      // Service Details Section
      doc.fontSize(14).fillColor('#4F46E5').text('Service Details');
      doc.moveDown(0.5);

      const details = [
        { label: 'Service', value: booking.service_name || booking.serviceName || 'N/A' },
        { label: 'Provider', value: booking.provider_name || booking.providerName || 'Unassigned' },
        { label: 'Location', value: booking.location || 'N/A' },
        { label: 'Duration', value: booking.duration_minutes ? `${booking.duration_minutes} minutes` : 'N/A' },
      ];

      details.forEach(({ label, value }) => {
        doc.fontSize(10).fillColor('#64748b').text(label, { continued: true });
        doc.text(': ', { continued: true });
        doc.fillColor('#1e293b').text(value);
      });

      doc.moveDown(1.5);

      // Appointment Details Section
      doc.fontSize(14).fillColor('#4F46E5').text('Appointment Details');
      doc.moveDown(0.5);

      const startTime = booking.start_time ? new Date(booking.start_time) : null;
      const appointmentDetails = [
        { 
          label: 'Date', 
          value: startTime ? startTime.toLocaleDateString('en-US', { 
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
          }) : (booking.date || 'N/A')
        },
        { 
          label: 'Time', 
          value: startTime ? startTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', minute: '2-digit', hour12: true 
          }) : (booking.timeSlot || 'N/A')
        },
        { label: 'Status', value: (booking.status || 'PENDING').toUpperCase() },
        { label: 'Payment Status', value: (booking.payment_status || booking.paymentStatus || 'UNPAID').toUpperCase() },
      ];

      appointmentDetails.forEach(({ label, value }) => {
        doc.fontSize(10).fillColor('#64748b').text(label, { continued: true });
        doc.text(': ', { continued: true });
        doc.fillColor('#1e293b').text(value);
      });

      doc.moveDown(1.5);

      // Payment Section
      const price = booking.booking_fee || booking.price || 0;
      if (price > 0) {
        doc.fontSize(14).fillColor('#4F46E5').text('Payment Information');
        doc.moveDown(0.5);
        
        doc.fontSize(10).fillColor('#64748b').text('Amount Paid: ', { continued: true });
        doc.fontSize(16).fillColor('#059669').text(`₹${price}`);
        
        if (booking.payment_id) {
          doc.fontSize(10).fillColor('#64748b').text('Transaction ID: ', { continued: true });
          doc.fillColor('#1e293b').text(booking.payment_id);
        }
        doc.moveDown(1.5);
      }

      // Divider
      doc.strokeColor('#e2e8f0').lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke();
      doc.moveDown(1);

      // Footer
      doc.fontSize(9).fillColor('#94a3b8')
        .text('Thank you for booking with Aarakshan!', { align: 'center' });
      doc.text('Please arrive 10 minutes before your scheduled appointment.', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(8).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generateBookingPDF };
