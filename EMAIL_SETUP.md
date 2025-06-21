# Email Setup Instructions

This application now supports sending emails when messages are sent in protocols. Follow these steps to configure email functionality:

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional: Default recipient for notifications
DEFAULT_RECIPIENT_EMAIL=admin@yourcompany.com
```

## Gmail Setup (Recommended)

1. **Enable 2-Step Verification** on your Google Account
2. **Generate an App Password**:
   - Go to your Google Account settings
   - Navigate to Security > App passwords
   - Select "Mail" as the app
   - Generate the password
   - Use this generated password as `SMTP_PASS`

## Other Email Providers

You can use other SMTP providers by adjusting the configuration:

### Outlook/Hotmail
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

### Yahoo
```bash
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
```

### Custom SMTP Server
```bash
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
```

## How It Works

1. When a user clicks "Send Message" in the protocol messages tab
2. The message is first saved to the database
3. If recipients are selected, a notification email is sent to the default recipient
4. The email includes:
   - Protocol number and committee name
   - Protocol date
   - List of intended recipients
   - The message content
   - Professional HTML formatting

## Current Implementation

**Note:** The current implementation sends notification emails to a default recipient (admin) rather than directly to protocol members, because:

- Protocol members currently only store names, not email addresses
- This provides a notification system for administrators
- The email includes the list of intended recipients for manual follow-up

## Future Enhancements

To send emails directly to protocol members, you would need to:

1. **Add email fields to protocol_members table**:
   ```sql
   ALTER TABLE protocol_members ADD COLUMN email TEXT;
   ```

2. **Update the email API** to use member emails instead of default recipient

3. **Add email validation** when creating/editing protocol members

## Features

- **Recipient Selection**: Users can select specific protocol members (for notification purposes)
- **Template Support**: Pre-defined message templates are available
- **Error Handling**: Email failures don't prevent message saving
- **Loading States**: UI shows sending status to users
- **Fallback System**: Uses default recipient when member emails aren't available

## Troubleshooting

- **Authentication Error**: Make sure your SMTP credentials are correct
- **Gmail Issues**: Use App Passwords, not your regular password
- **Port Issues**: Try port 465 with `secure: true` for SSL connections
- **Firewall**: Ensure your server can connect to SMTP ports
- **Configuration Missing**: Set all required environment variables 