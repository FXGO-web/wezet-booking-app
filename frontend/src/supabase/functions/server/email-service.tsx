import * as kv from "./kv_store.tsx";

interface EmailTemplate {
  subject: string;
  body: string;
}

interface BookingEmailData {
  clientName: string;
  clientEmail: string;
  teamMemberName: string;
  serviceName: string;
  date: string;
  time: string;
  location: string;
  price: number;
  currency: string;
  bookingId: string;
}

// Email templates
const EMAIL_TEMPLATES = {
  BOOKING_CONFIRMATION: {
    subject: "✓ Booking Confirmed - {serviceName} with {teamMemberName}",
    body: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #EF7C48; font-size: 28px; margin: 0;">WEZET</h1>
          <p style="color: #64748B; margin: 8px 0 0;">Wellness & Transformation Platform</p>
        </div>
        
        <div style="background: #F8FAFC; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h2 style="color: #0F172A; font-size: 22px; margin: 0 0 16px;">Hi {clientName},</h2>
          <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
            Your booking has been confirmed! We're excited to support you on your wellness journey.
          </p>
        </div>

        <div style="background: #FFF7ED; border-left: 4px solid #EF7C48; padding: 20px; margin-bottom: 24px; border-radius: 8px;">
          <h3 style="color: #0F172A; font-size: 18px; margin: 0 0 16px;">Booking Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Service:</td>
              <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">{serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Team Member:</td>
              <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">{teamMemberName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Date:</td>
              <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">{date}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Time:</td>
              <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">{time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Location:</td>
              <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">{location}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0 16px; color: #64748B; font-size: 14px; border-bottom: 1px solid #E2E8F0;">Price:</td>
              <td style="padding: 8px 0 16px; color: #0F172A; font-weight: 600; text-align: right; border-bottom: 1px solid #E2E8F0;">{price} {currency}</td>
            </tr>
          </table>
        </div>

        <div style="background: #F1F5F9; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="color: #475569; font-size: 14px; margin: 0 0 12px;">
            <strong>Need to reschedule?</strong><br/>
            Contact us at least 48 hours before your session.
          </p>
          <p style="color: #475569; font-size: 14px; margin: 0;">
            <strong>Booking ID:</strong> {bookingId}
          </p>
        </div>

        <div style="text-align: center; padding: 20px; border-top: 1px solid #E2E8F0;">
          <p style="color: #64748B; font-size: 13px; margin: 0;">
            Questions? Reply to this email or contact support@wezet.com
          </p>
          <p style="color: #94A3B8; font-size: 12px; margin: 12px 0 0;">
            © 2025 WEZET. All rights reserved.
          </p>
        </div>
      </div>
    `,
  },

  BOOKING_REMINDER: {
    subject: "⏰ Reminder: Your session with {teamMemberName} is tomorrow",
    body: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #EF7C48; font-size: 28px; margin: 0;">WEZET</h1>
          <p style="color: #64748B; margin: 8px 0 0;">Wellness & Transformation Platform</p>
        </div>
        
        <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 20px; margin-bottom: 24px; border-radius: 8px;">
          <h2 style="color: #0F172A; font-size: 20px; margin: 0 0 12px;">Hi {clientName},</h2>
          <p style="color: #78350F; font-size: 16px; line-height: 1.6; margin: 0;">
            This is a friendly reminder that your session is coming up tomorrow!
          </p>
        </div>

        <div style="background: #F8FAFC; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="color: #0F172A; font-size: 18px; margin: 0 0 16px;">Session Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Service:</td>
              <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">{serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">With:</td>
              <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">{teamMemberName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Tomorrow:</td>
              <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">{date} at {time}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Location:</td>
              <td style="padding: 8px 0; color: #0F172A; font-weight: 600; text-align: right;">{location}</td>
            </tr>
          </table>
        </div>

        <div style="background: #DBEAFE; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <p style="color: #1E40AF; font-size: 14px; margin: 0;">
            💡 <strong>Preparation tip:</strong> Arrive 5-10 minutes early to settle in and get comfortable.
          </p>
        </div>

        <div style="text-align: center; padding: 20px; border-top: 1px solid #E2E8F0;">
          <p style="color: #64748B; font-size: 13px; margin: 0;">
            See you tomorrow! Questions? Contact support@wezet.com
          </p>
        </div>
      </div>
    `,
  },

  BOOKING_CANCELLED: {
    subject: "Booking Cancelled - {serviceName}",
    body: `
      <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #EF7C48; font-size: 28px; margin: 0;">WEZET</h1>
          <p style="color: #64748B; margin: 8px 0 0;">Wellness & Transformation Platform</p>
        </div>
        
        <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 20px; margin-bottom: 24px; border-radius: 8px;">
          <h2 style="color: #0F172A; font-size: 20px; margin: 0 0 12px;">Hi {clientName},</h2>
          <p style="color: #7F1D1D; font-size: 16px; line-height: 1.6; margin: 0;">
            Your booking has been cancelled as requested.
          </p>
        </div>

        <div style="background: #F8FAFC; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="color: #0F172A; font-size: 18px; margin: 0 0 16px;">Cancelled Booking</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Service:</td>
              <td style="padding: 8px 0; color: #0F172A; text-align: right;">{serviceName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Team Member:</td>
              <td style="padding: 8px 0; color: #0F172A; text-align: right;">{teamMemberName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748B; font-size: 14px;">Date:</td>
              <td style="padding: 8px 0; color: #0F172A; text-align: right;">{date} at {time}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; background: #F1F5F9; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
          <p style="color: #334155; font-size: 16px; margin: 0 0 16px;">
            We'd love to see you again soon!
          </p>
          <a href="#" style="display: inline-block; background: #EF7C48; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Book Another Session
          </a>
        </div>

        <div style="text-align: center; padding: 20px; border-top: 1px solid #E2E8F0;">
          <p style="color: #64748B; font-size: 13px; margin: 0;">
            Questions about refunds? Contact support@wezet.com
          </p>
        </div>
      </div>
    `,
  },
};

// Replace template variables
function fillTemplate(template: string, data: BookingEmailData): string {
  return template
    .replace(/{clientName}/g, data.clientName)
    .replace(/{clientEmail}/g, data.clientEmail)
    .replace(/{teamMemberName}/g, data.teamMemberName)
    .replace(/{serviceName}/g, data.serviceName)
    .replace(/{date}/g, data.date)
    .replace(/{time}/g, data.time)
    .replace(/{location}/g, data.location)
    .replace(/{price}/g, data.price.toString())
    .replace(/{currency}/g, data.currency)
    .replace(/{bookingId}/g, data.bookingId);
}

// Send email (simulated - in production would use Resend, SendGrid, etc.)
export async function sendBookingEmail(
  type: 'BOOKING_CONFIRMATION' | 'BOOKING_REMINDER' | 'BOOKING_CANCELLED',
  data: BookingEmailData
): Promise<{ success: boolean; message: string }> {
  try {
    const template = EMAIL_TEMPLATES[type];
    const subject = fillTemplate(template.subject, data);
    const body = fillTemplate(template.body, data);

    // Log email for demonstration (in production, integrate with email service)
    console.log('=== EMAIL NOTIFICATION ===');
    console.log('To:', data.clientEmail);
    console.log('Subject:', subject);
    console.log('Type:', type);
    console.log('========================');

    // Store notification in KV for in-app notifications
    const notificationId = crypto.randomUUID();
    const notification = {
      id: notificationId,
      type: type.toLowerCase().replace('_', '-'),
      recipientEmail: data.clientEmail,
      recipientName: data.clientName,
      subject,
      bookingId: data.bookingId,
      createdAt: new Date().toISOString(),
      read: false,
      data: {
        serviceName: data.serviceName,
        teamMemberName: data.teamMemberName,
        date: data.date,
        time: data.time,
      },
    };

    await kv.set(`notification:${notificationId}`, notification);

    // In production, call email service API here
    // Example with Resend:
    // const response = await fetch('https://api.resend.com/emails', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     from: 'WEZET <bookings@wezet.com>',
    //     to: data.clientEmail,
    //     subject,
    //     html: body,
    //   }),
    // });

    return {
      success: true,
      message: `Email notification sent successfully to ${data.clientEmail}`,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      message: `Failed to send email: ${error.message}`,
    };
  }
}

// Get notifications for a user
export async function getNotifications(email: string): Promise<any[]> {
  try {
    const results = await kv.getByPrefix('notification:');
    const notifications = results
      .map(r => r.value)
      .filter((n: any) => n.recipientEmail === email)
      .sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const notification = await kv.get(`notification:${notificationId}`);
    if (!notification) return false;

    const updated = { ...notification, read: true };
    await kv.set(`notification:${notificationId}`, updated);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}
