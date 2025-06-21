import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server/server";

// Email configuration - you'll need to set these environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { protocolId, message, recipientIds } = await request.json();

    if (!protocolId || !message || !recipientIds || !Array.isArray(recipientIds)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get protocol details and recipient information
    const supabase = await createClient();
    
    // Get protocol information
    const { data: protocol, error: protocolError } = await supabase
      .from("protocols")
      .select(`
        *,
        committees (name)
      `)
      .eq("id", protocolId)
      .single();

    if (protocolError || !protocol) {
      return NextResponse.json(
        { error: "Protocol not found" },
        { status: 404 }
      );
    }

    // Get recipient information (protocol members)
    const { data: recipients, error: recipientsError } = await supabase
      .from("protocol_members")
      .select("*")
      .in("id", recipientIds);

    if (recipientsError) {
      return NextResponse.json(
        { error: "Failed to fetch recipients" },
        { status: 500 }
      );
    }

    // Get sender information
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Check if we have email configuration
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json(
        { 
          error: "Email configuration not set up",
          message: "Please configure SMTP settings in environment variables"
        },
        { status: 500 }
      );
    }

    // For now, we'll send to a default email or log the message
    // In a real implementation, you might want to:
    // 1. Add email fields to protocol_members table
    // 2. Or create a separate users table with emails
    // 3. Or use a default admin email for notifications

    const defaultEmail = process.env.DEFAULT_RECIPIENT_EMAIL || process.env.SMTP_USER;
    
    // Prepare email content
    const emailSubject = `Protocol ${protocol.number} - New Message`;
    const recipientNames = recipients.map(r => r.name || `Member ${r.id}`).join(", ");
    
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Protocol ${protocol.number}</h2>
        <p><strong>Committee:</strong> ${protocol.committees?.name || 'N/A'}</p>
        <p><strong>Date:</strong> ${new Date(protocol.date).toLocaleDateString()}</p>
        <p><strong>Recipients:</strong> ${recipientNames}</p>
        <hr style="margin: 20px 0;">
        <h3>Message:</h3>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p style="margin: 0; white-space: pre-wrap;">${message}</p>
        </div>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This message was sent from the Next Agenda platform.<br>
          <strong>Note:</strong> This is a notification email. The actual recipients (${recipientNames}) 
          should be contacted directly as their email addresses are not stored in the system.
        </p>
      </div>
    `;

    // Send email to default recipient
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: defaultEmail,
      subject: emailSubject,
      html: emailHtml,
    };

    try {
      await transporter.sendMail(mailOptions);
      
      return NextResponse.json({
        success: true,
        message: `Message saved and notification sent to ${defaultEmail}`,
        note: `Recipients (${recipientNames}) should be contacted directly as their emails are not stored`,
        results: {
          successful: [{ email: defaultEmail, success: true }],
          failed: [],
          recipients: recipients.map(r => ({ id: r.id, name: r.name }))
        }
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      return NextResponse.json({
        success: false,
        message: "Message saved but email notification failed",
        error: "Email sending failed",
        results: {
          successful: [],
          failed: [{ email: defaultEmail, error: emailError }],
          recipients: recipients.map(r => ({ id: r.id, name: r.name }))
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in send-email API:", error);
    return NextResponse.json(
      { error: "Failed to process email request" },
      { status: 500 }
    );
  }
} 