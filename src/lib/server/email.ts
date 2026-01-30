import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

// Initialize Resend client (lazy - only when env var exists)
function getResendClient(): Resend {
	if (!env.RESEND_API_KEY) {
		throw new Error('RESEND_API_KEY environment variable is not set');
	}
	return new Resend(env.RESEND_API_KEY);
}

// Get base URL for email links
function getBaseUrl(): string {
	return env.PUBLIC_BASE_URL || 'http://localhost:5173';
}

/**
 * Send password reset email with reset link
 * @param email - User's email address
 * @param token - Plaintext reset token (will be included in URL)
 */
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
	const resend = getResendClient();
	const resetUrl = `${getBaseUrl()}/auth/reset-password?token=${token}`;

	// Use Resend test domain for development, real domain for production
	const fromAddress = env.RESEND_FROM_EMAIL || 'WoodShop Toolbox <onboarding@resend.dev>';

	const { error } = await resend.emails.send({
		from: fromAddress,
		to: email,
		subject: 'Reset your password - WoodShop Toolbox',
		html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fafaf9;">
          <div style="background-color: white; padding: 32px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #292524; margin: 0 0 16px 0; font-size: 24px;">Reset your password</h1>
            <p style="color: #57534e; line-height: 1.6; margin: 0 0 24px 0;">
              You requested to reset your password for WoodShop Toolbox.
              Click the button below to set a new password. This link expires in 1 hour.
            </p>
            <p style="margin: 0 0 24px 0;">
              <a href="${resetUrl}"
                 style="display: inline-block; background-color: #b45309; color: white; padding: 12px 24px;
                        text-decoration: none; border-radius: 6px; font-weight: 500;">
                Reset Password
              </a>
            </p>
            <p style="color: #78716c; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">
              Or copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; color: #b45309; font-size: 14px; margin: 0 0 24px 0;">
              ${resetUrl}
            </p>
            <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;">
            <p style="color: #a8a29e; font-size: 13px; margin: 0;">
              If you didn't request this password reset, you can safely ignore this email.
              Your password will not be changed.
            </p>
          </div>
        </body>
      </html>
    `
	});

	if (error) {
		console.error('Failed to send password reset email:', error);
		throw new Error(`Failed to send password reset email: ${error.message}`);
	}
}
