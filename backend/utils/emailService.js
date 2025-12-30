const nodemailer = require('nodemailer');

/**
 * Create email transporter
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send OTP email with beautiful styling
 */
const sendOTPEmail = async (email, otp, purpose = 'password_reset') => {
  try {
    const transporter = createTransporter();

    let subject, html;

    if (purpose === 'password_reset') {
      subject = '🔐 Password Reset Code - GuraNeza';
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">🛍️ GuraNeza</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333333; margin-bottom: 20px;">Hello!</p>
              
              <p style="font-size: 16px; color: #666666; line-height: 1.6; margin-bottom: 30px;">
                We received a request to reset your password. Use the verification code below to complete the process:
              </p>
              
              <!-- OTP Box -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <div style="color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Your Verification Code</div>
                    <div style="font-size: 48px; font-weight: 700; color: #ffffff; letter-spacing: 8px; margin: 10px 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">${otp}</div>
                    <div style="color: #ffffff; font-size: 14px; margin-top: 10px; opacity: 0.9;">⏰ Valid for 10 minutes</div>
                  </td>
                </tr>
              </table>
              
              <!-- Warning -->
              <table role="presentation" style="width: 100%; margin: 20px 0;">
                <tr>
                  <td style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                      <strong>⚠️ Security Notice:</strong> If you didn't request this code, please ignore this email. Your account remains secure.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 16px; color: #666666; line-height: 1.6;">
                For your security, this code will expire in <strong>10 minutes</strong>. 
                If you need a new code, please request another password reset.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 14px; margin: 5px 0;"><strong>GuraNeza</strong> - Rwanda's Premier E-Commerce Platform</p>
              <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">This is an automated message, please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            `;
    } else if (purpose === 'login') {
      subject = '🔑 Login Verification Code - GuraNeza';
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">🛍️ GuraNeza</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333333; margin-bottom: 20px;">Hello!</p>
              <p style="font-size: 16px; color: #666666; line-height: 1.6; margin-bottom: 30px;">
                Someone is trying to log in to your account. Please use the verification code below to complete the login process:
              </p>
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <div style="color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Your Login Code</div>
                    <div style="font-size: 48px; font-weight: 700; color: #ffffff; letter-spacing: 8px; margin: 10px 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">${otp}</div>
                    <div style="color: #ffffff; font-size: 14px; margin-top: 10px; opacity: 0.9;">⏰ Valid for 10 minutes</div>
                  </td>
                </tr>
              </table>
              <table role="presentation" style="width: 100%; margin: 20px 0;">
                <tr>
                  <td style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                      <strong>⚠️ Security Notice:</strong> If you didn't attempt to log in, please ignore this email and consider changing your password.
                    </p>
                  </td>
                </tr>
              </table>
              <p style="font-size: 16px; color: #666666; line-height: 1.6;">
                For your security, this code will expire in <strong>10 minutes</strong>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 14px; margin: 5px 0;"><strong>GuraNeza</strong> - Rwanda's Premier E-Commerce Platform</p>
              <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">This is an automated message, please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            `;
    } else if (purpose === 'email_verification') {
      subject = '✅ Verify Your Email - GuraNeza';
      html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">🛍️ GuraNeza</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333333; margin-bottom: 20px;">Welcome to GuraNeza! 🎉</p>
              <p style="font-size: 16px; color: #666666; line-height: 1.6; margin-bottom: 30px;">
                Thank you for joining Rwanda's premier e-commerce platform. 
                To complete your registration, please verify your email address using the code below:
              </p>
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <div style="color: #ffffff; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px;">Verification Code</div>
                    <div style="font-size: 48px; font-weight: 700; color: #ffffff; letter-spacing: 8px; margin: 10px 0; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">${otp}</div>
                  </td>
                </tr>
              </table>
              <p style="font-size: 16px; color: #666666; line-height: 1.6;">
                Once verified, you'll have access to thousands of products from trusted sellers across Rwanda!
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 14px; margin: 5px 0;"><strong>GuraNeza</strong> - Rwanda's Premier E-Commerce Platform</p>
              <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">This is an automated message, please do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
            `;
    }

    const mailOptions = {
      from: `"GuraNeza 🛍️" <${process.env.EMAIL_USER}>`,
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
 */
const sendOrderConfirmationEmail = async (email, orderDetails) => {
  try {
    const transporter = createTransporter();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">🛍️ GuraNeza</h1>
              <div style="background-color: rgba(255, 255, 255, 0.2); color: #ffffff; padding: 10px 20px; border-radius: 20px; display: inline-block; margin-top: 10px; font-size: 14px; font-weight: 600;">✓ Order Confirmed</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 18px; color: #333333; margin-bottom: 20px;">Thank you for your order!</p>
              <p style="font-size: 16px; color: #666666; line-height: 1.6; margin-bottom: 30px;">
                Your order has been successfully placed and is being processed.
              </p>
              <table role="presentation" style="width: 100%; background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <tr>
                  <td>
                    <p style="margin: 10px 0; color: #333333;"><strong>Order ID:</strong> ${orderDetails.orderId}</p>
                    <p style="margin: 10px 0; color: #333333;"><strong>Total:</strong> <span style="color: #10b981; font-size: 20px; font-weight: 700;">${orderDetails.totalPrice} RWF</span></p>
                    <p style="margin: 10px 0; color: #333333;"><strong>Payment Method:</strong> ${orderDetails.paymentMethod}</p>
                  </td>
                </tr>
              </table>
              <p style="font-size: 16px; color: #666666; line-height: 1.6;">
                We'll send you another email when your order ships. You can track your order in your dashboard.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="color: #6c757d; font-size: 14px; margin: 5px 0;"><strong>GuraNeza</strong> - Rwanda's Premier E-Commerce Platform</p>
              <p style="color: #6c757d; font-size: 14px; margin: 5px 0;">Questions? Contact our support team anytime.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

    const mailOptions = {
      from: `"GuraNeza 🛍️" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `✅ Order Confirmed #${orderDetails.orderId} - GuraNeza`,
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
