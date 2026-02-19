
export const styles = {
  container: "font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; background-color: #ffffff;",
  header: "text-align: center; margin-bottom: 48px;",
  logoText: "font-size: 28px; font-weight: 800; letter-spacing: 4px; color: #000000; text-decoration: none; text-transform: uppercase;",
  heading: "font-size: 24px; font-weight: 700; margin-bottom: 24px; color: #000000; letter-spacing: -0.5px;",
  paragraph: "font-size: 16px; line-height: 1.6; color: #4b5563; margin-bottom: 24px;",
  buttonContainer: "text-align: center; margin: 40px 0;",
  button: "background-color: #000000; color: #ffffff; padding: 16px 40px; border-radius: 0px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; text-transform: uppercase; letter-spacing: 1px; transition: background-color 0.3s ease;",
  footer: "margin-top: 60px; padding-top: 32px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af; letter-spacing: 0.5px;",
  link: "color: #000000; text-decoration: none; font-weight: 600;",
  detailBox: "background-color: #f9fafb; padding: 32px; border-radius: 0px; border: 1px solid #f3f4f6; margin: 32px 0; text-align: left;",
  detailRow: "display: flex; justify-content: space-between; margin-bottom: 16px; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px;",
  detailLabel: "font-weight: 500; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;",
  detailValue: "font-weight: 600; color: #111827; font-size: 15px;"
};

const BASE_URL = "https://booking.wezet.xyz";

export const getBaseLayout = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <title>Wezet Notification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; -webkit-font-smoothing: antialiased;">
  <div style="background-color: #fafafa; padding: 40px 0;">
    <div style="${styles.container}">
      <div style="${styles.header}">
         <a href="${BASE_URL}" style="${styles.logoText}">WEZET</a>
      </div>
      
      ${content}

      <div style="${styles.footer}">
        <p style="margin-bottom: 8px;">&copy; ${new Date().getFullYear()} WEZET PLATFORM. ALL RIGHTS RESERVED.</p>
        <p>
          <a href="${BASE_URL}" style="${styles.link}">WEZET.XYZ</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const getWelcomeTemplate = (name: string) => {
  const content = `
    <h1 style="${styles.heading}">Welcome to Wezet, ${name}.</h1>
    <p style="${styles.paragraph}">
      Your journey towards transformation begins now. We are honored to have you join our exclusive community.
    </p>
    <p style="${styles.paragraph}">
      Your account is now active. Explore our curated sessions and elite programs designed to elevate your experience.
    </p>
    <div style="${styles.buttonContainer}">
      <a href="${BASE_URL}" style="${styles.button}">Book a Session</a>
    </div>
  `;
  return getBaseLayout(content);
};

export const getPasswordResetTemplate = (actionUrl: string) => {
  const content = `
    <h1 style="${styles.heading}">Secure Access Recovery</h1>
    <p style="${styles.paragraph}">
      We received a request to reset the password for your Wezet account. If you did not initiate this, no further action is required.
    </p>
    <div style="${styles.buttonContainer}">
      <a href="${actionUrl}" style="${styles.button}">Reset Password</a>
    </div>
    <p style="${styles.paragraph}; font-size: 13px; margin-top: 32px; color: #9ca3af;">
      This link will expire in 1 hour. For security, do not share this email.
    </p>
  `;
  return getBaseLayout(content);
};

export const getBookingConfirmationTemplate = (data: {
  clientName: string;
  sessionName: string;
  date: string;
  time: string;
  instructorName: string;
  locationName: string;
  address?: string;
  price?: string;
  bookingId: string;
}) => {
  const content = `
    <h1 style="${styles.heading}">Booking Confirmed</h1>
    <p style="${styles.paragraph}">
      Hello ${data.clientName}, your session has been successfully reserved. Details of your appointment follow below.
    </p>
    
    <div style="${styles.detailBox}">
      <div style="${styles.detailRow}">
        <span style="${styles.detailLabel}">Service</span>
        <span style="${styles.detailValue}">${data.sessionName}</span>
      </div>
       <div style="${styles.detailRow}">
        <span style="${styles.detailLabel}">Instructor</span>
        <span style="${styles.detailValue}">${data.instructorName}</span>
      </div>
      <div style="${styles.detailRow}">
        <span style="${styles.detailLabel}">Date</span>
        <span style="${styles.detailValue}">${data.date}</span>
      </div>
      <div style="${styles.detailRow}">
        <span style="${styles.detailLabel}">Time</span>
        <span style="${styles.detailValue}">${data.time}</span>
      </div>
      <div style="${styles.detailRow}">
        <span style="${styles.detailLabel}">Location</span>
        <span style="${styles.detailValue}">${data.locationName}</span>
      </div>
      ${data.address ? `
      <div style="${styles.detailRow}">
        <span style="${styles.detailLabel}">Address</span>
        <span style="${styles.detailValue}">${data.address}</span>
      </div>` : ''}
      ${data.price ? `
      <div style="${styles.detailRow}; border-bottom: none; margin-bottom: 0; padding-bottom: 0;">
        <span style="${styles.detailLabel}">Amount</span>
        <span style="${styles.detailValue}">${data.price}</span>
      </div>` : ''}
    </div>

    <p style="${styles.paragraph}">
      We recommend arriving 10 minutes prior to your session to prepare. We look forward to seeing you soon.
    </p>

    <div style="${styles.buttonContainer}">
      <a href="${BASE_URL}/client-dashboard" style="${styles.button}">Go to Dashboard</a>
    </div>
  `;
  return getBaseLayout(content);
};
