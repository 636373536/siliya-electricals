// backend/utils/email.js - EMAIL SERVICE USING RESEND (FREE TIER)

const { Resend } = require('resend');

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email using Resend
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.from - Sender email (optional)
 * @returns {Promise} - Resend API response
 */
exports.sendEmail = async (options) => {
  try {
    // Validate required fields
    if (!options.to || !options.subject || !options.html) {
      throw new Error('Missing required email fields: to, subject, html');
    }

    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️  RESEND_API_KEY not configured. Email not sent.');
      console.log('📧 Email that would be sent:', {
        to: options.to,
        subject: options.subject
      });
      return { success: false, message: 'Email service not configured' };
    }

    // Prepare email data
    const emailData = {
      from: options.from || process.env.FROM_EMAIL || 'Siliya Electricals <onboarding@resend.dev>',
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    // Add CC if provided
    if (options.cc) {
      emailData.cc = options.cc;
    }

    // Add reply-to if provided
    if (options.replyTo) {
      emailData.reply_to = options.replyTo;
    }

    // Send email via Resend
    const data = await resend.emails.send(emailData);

    console.log('✅ Email sent successfully:', {
      id: data.id,
      to: options.to,
      subject: options.subject
    });

    return { 
      success: true, 
      id: data.id,
      message: 'Email sent successfully' 
    };

  } catch (error) {
    console.error('❌ Email send error:', {
      error: error.message,
      to: options.to,
      subject: options.subject
    });

    // Don't throw error - just log and return failure
    // This prevents email failures from breaking the main operations
    return { 
      success: false, 
      error: error.message,
      message: 'Failed to send email'
    };
  }
};

/**
 * Send bulk emails (useful for notifications to multiple admins)
 * @param {Array} emails - Array of email options objects
 * @returns {Promise} - Results array
 */
exports.sendBulkEmails = async (emails) => {
  try {
    const results = await Promise.allSettled(
      emails.map(email => exports.sendEmail(email))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`📧 Bulk email results: ${successful} sent, ${failed} failed`);

    return {
      total: results.length,
      successful,
      failed,
      results
    };
  } catch (error) {
    console.error('❌ Bulk email error:', error);
    return {
      total: emails.length,
      successful: 0,
      failed: emails.length,
      error: error.message
    };
  }
};

module.exports = exports;