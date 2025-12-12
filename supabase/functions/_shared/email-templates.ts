
export const styles = {
    container: "font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #333333; background-color: #ffffff;",
    header: "text-align: center; margin-bottom: 40px;",
    logoText: "font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #000000; text-decoration: none;",
    heading: "font-size: 20px; font-weight: 600; margin-bottom: 20px; color: #000000;",
    paragraph: "font-size: 16px; line-height: 1.6; color: #444444; margin-bottom: 20px;",
    buttonContainer: "text-align: center; margin: 30px 0;",
    button: "background-color: #000000; color: #ffffff; padding: 12px 30px; border-radius: 4px; text-decoration: none; font-weight: 500; font-size: 14px; display: inline-block;",
    footer: "margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee; text-align: center; font-size: 12px; color: #888888;",
    link: "color: #000000; text-decoration: underline;",
    detailBox: "background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;",
    detailRow: "display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;",
    detailLabel: "font-weight: 500; color: #666;",
    detailValue: "font-weight: 600; color: #000;"
};

const BASE_URL = "https://booking.wezet.xyz";

export const getBaseLayout = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wezet Notification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="${styles.container}">
    <div style="${styles.header}">
       <a href="${BASE_URL}" style="${styles.logoText}">WEZET</a>
    </div>
    
    ${content}

    <div style="${styles.footer}">
      <p>&copy; ${new Date().getFullYear()} Wezet. All rights reserved.</p>
      <p>
        <a href="${BASE_URL}" style="${styles.link}">Visit Website</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

export const getWelcomeTemplate = (name: string) => {
    const content = `
    <h1 style="${styles.heading}">Welcome to Wezet, ${name}!</h1>
    <p style="${styles.paragraph}">
      We are thrilled to have you join our community. Your account has been successfully created.
    </p>
    <p style="${styles.paragraph}">
      You can now book sessions, manage your appointments, and explore our exclusive programs.
    </p>
    <div style="${styles.buttonContainer}">
      <a href="${BASE_URL}" style="${styles.button}">Book Your First Session</a>
    </div>
  `;
    return getBaseLayout(content);
};

export const getPasswordResetTemplate = (actionUrl: string) => {
    const content = `
    <h1 style="${styles.heading}">Reset Your Password</h1>
    <p style="${styles.paragraph}">
      We received a request to reset the password for your Wezet account. If you didn't make this request, you can safely ignore this email.
    </p>
    <div style="${styles.buttonContainer}">
      <a href="${actionUrl}" style="${styles.button}">Reset Password</a>
    </div>
    <p style="${styles.paragraph}; font-size: 14px; margin-top: 20px;">
      Or copy and paste this link into your browser:<br>
      <a href="${actionUrl}" style="color: #666; word-break: break-all;">${actionUrl}</a>
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
      Hi ${data.clientName}, your session is confirmed. We look forward to seeing you.
    </p>
    
    <div style="${styles.detailBox}">
      <div style="${styles.detailRow}">
        <span style="${styles.detailLabel}">Session</span>
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
    </div>

    <p style="${styles.paragraph}">
      Please arrive 10 minutes ealier to get settled.
    </p>

    <div style="${styles.buttonContainer}">
      <a href="${BASE_URL}/client-dashboard" style="${styles.button}">View My Type</a>
    </div>
  `;
    return getBaseLayout(content);
};
