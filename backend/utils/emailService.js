const nodemailer = require('nodemailer');

/**
 * Create email transporter
 */
const createTransporter = () => {
    return nodemailer.createTransporter({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

/**
 * Send OTP email
 * @param {String} email - Recipient email
 * @param {String} otp - OTP code
 * @param {String} purpose - Purpose of OTP (e.g., 'password_reset', 'email_verification')
 */
const sendOTPEmail = async (email, otp, purpose = 'password_reset') => {
    try {
        const transporter = createTransporter();

        let subject, html;

        if (purpose === 'password_reset') {
            subject = 'Password Reset OTP - GuraNeza';
            html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; text-align: center; letter-spacing: 5px; padding: 20px; background-color: white; border-radius: 5px; margin: 20px 0; }
            .warning { color: #DC2626; font-size: 14px; margin-top: 20px; }
            .footer { text-align: center; color: #6B7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>GuraNeza</h1>
            </div>
            <div class="content">
              <h2>Password Reset Request</h2>
              <p>We received a request to reset your password. Use the OTP code below to complete the process:</p>
              <div class="otp-code">${otp}</div>
              <p>This code will expire in <strong>10 minutes</strong>.</p>
              <p class="warning">⚠️ If you didn't request this password reset, please ignore this email and ensure your account is secure.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} GuraNeza. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
        } else if (purpose === 'email_verification') {
            subject = 'Email Verification - GuraNeza';
            html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #4F46E5; text-align: center; letter-spacing: 5px; padding: 20px; background-color: white; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; color: #6B7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to GuraNeza!</h1>
            </div>
            <div class="content">
              <h2>Verify Your Email</h2>
              <p>Thank you for registering with GuraNeza. Use the OTP code below to verify your email address:</p>
              <div class="otp-code">${otp}</div>
              <p>This code will expire in <strong>10 minutes</strong>.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} GuraNeza. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
        }

        const mailOptions = {
            from: `GuraNeza <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);

        console.log('✅ OTP email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending OTP email:', error);
        throw new Error('Failed to send OTP email. Please try again.');
    }
};

/**
 * Send order confirmation email
 * @param {String} email - Recipient email
 * @param {Object} orderDetails - Order information
 */
const sendOrderConfirmationEmail = async (email, orderDetails) => {
    try {
        const transporter = createTransporter();

        const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
          .order-info { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; color: #6B7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Order Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Thank you for your order!</h2>
            <p>Your order has been successfully placed.</p>
            <div class="order-info">
              <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
              <p><strong>Total:</strong> ${orderDetails.totalPrice} RWF</p>
              <p><strong>Payment Method:</strong> ${orderDetails.paymentMethod}</p>
            </div>
            <p>We'll send you another email when your order ships.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} GuraNeza. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

        const mailOptions = {
            from: `GuraNeza <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Order Confirmation - GuraNeza',
            html: html
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Order confirmation email sent');
    } catch (error) {
        console.error('❌ Error sending order confirmation email:', error);
        // Don't throw error - order is already created
    }
};

module.exports = {
    sendOTPEmail,
    sendOrderConfirmationEmail
};
