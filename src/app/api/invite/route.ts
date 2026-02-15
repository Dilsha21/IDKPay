import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET() {
  return NextResponse.json({ message: 'Invitation API is reachable' });
}

export async function POST(request: Request) {
  console.log('[API-INVITE] POST request received (Nodemailer)');

  try {
    const smtpUser = process.env.SMTP_USER?.trim();
    const smtpPass = process.env.SMTP_PASS?.trim();

    if (!smtpUser || !smtpPass) {
      console.error('[API-INVITE] SMTP credentials missing in .env');
      return NextResponse.json(
        { error: 'Email invitation system is not fully configured. Please add SMTP_USER and SMTP_PASS (App Password) to your .env file.' },
        { status: 500 }
      );
    }

    const { toEmail, adminEmail, groupName, adminName } = await request.json();

    if (!toEmail || !adminEmail || !groupName || !adminName) {
      console.error('[API-INVITE] Missing required fields:', { toEmail, adminEmail, groupName, adminName });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your preferred SMTP provider
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    console.log(`[API-INVITE] Sending Nodemailer invite to: ${toEmail} for ${adminName}`);

    const mailOptions = {
      from: `"IDKPay Invitations" <${smtpUser}>`,
      to: toEmail,
      subject: `Invitation to join ${groupName} on IDKPay`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
          <div style="text-align: center; margin-bottom: 25px;">
             <h1 style="color: #0f172a; font-size: 24px; margin-bottom: 5px;">You're Invited to IDKPay!</h1>
             <p style="color: #64748b; font-size: 14px;">Shared Expense Tracking Made Simple</p>
          </div>

          <p style="font-size: 16px; line-height: 1.6;">Hello,</p>
          
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>${adminName}</strong> has invited you to join their expense-sharing group, <strong>"${groupName}"</strong>, on <strong>IDKPay</strong>.
          </p>

          <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0;">
            <p style="margin: 0; font-weight: 600; color: #1e293b;">What is IDKPay?</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #475569;">
              IDKPay is a dedicated platform designed for roommates and friends to effortlessly manage shared finances.
            </p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px; color: #475569;">
              <li>Record shared expenses instantly.</li>
              <li>Automatically calculate "who owes whom".</li>
              <li>Track "Things to Buy" list for the apartment.</li>
              <li>Get weekly summaries and real-time notifications.</li>
            </ul>
          </div>

          <p style="font-size: 16px; line-height: 1.6;">
            Joining the group allows you to maintain a transparent and stress-free financial relationship with your roommates.
          </p>

          <div style="text-align: center; margin: 35px 0;">
            <a href="https://idkpay.vercel.app" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">
              Accept Invitation & Sign Up
            </a>
          </div>

          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            *Note: This invitation was initiated by ${adminEmail} via the IDKPay application. If you don't know this person or weren't expecting this, you can safely ignore this email.
          </p>

          <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
          
          <div style="text-align: center; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} IDKPay. All rights reserved.</p>
            <p style="margin: 5px 0 0 0;"><a href="https://idkpay.vercel.app" style="color: #3b82f6; text-decoration: none;">idkpay.vercel.app</a></p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('[API-INVITE] Nodemailer email sent successfully');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API-INVITE] Nodemailer error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
