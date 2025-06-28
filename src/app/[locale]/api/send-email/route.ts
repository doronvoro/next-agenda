import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server/server";
import { format } from "date-fns";
import type { Database } from "@/types/supabase";

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
        committees (*)
      `)
      .eq("id", protocolId)
      .single();

    if (protocolError || !protocol) {
      return NextResponse.json(
        { error: "Protocol not found" },
        { status: 404 }
      );
    }

    // Fetch company using committee.company_id
    let company = null;
    if (protocol?.committees?.company_id) {
      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("id", protocol.committees.company_id)
        .single();
      company = companyData;
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

    // Generate PDF (dynamic imports)
    let pdfAttachment;
    try {
      const { default: React } = await import("react");
      const ReactDOMServer = await import("react-dom/server");
      const ProtocolPdfView = (await import("@/app/[locale]/dashboard/protocols/[id]/components/ProtocolPdfView")).default;
      const puppeteer = (await import("puppeteer")).default;
      type Company = Database["public"]["Tables"]["companies"]["Row"];
      const formatDate = (dateString: string) => format(new Date(dateString), "PPP");

      // Fetch all protocol data for the PDF
      const { data: agendaItems } = await supabase
        .from("agenda_items")
        .select("*")
        .eq("protocol_id", protocolId)
        .order("display_order");
      const { data: protocolMembers } = await supabase
        .from("protocol_members")
        .select("*")
        .eq("protocol_id", protocolId);
      const { data: protocolAttachments } = await supabase
        .from("protocol_attachments")
        .select("*")
        .eq("protocol_id", protocolId);
      const { data: protocolMessages } = await supabase
        .from("protocol_messages")
        .select("*")
        .eq("protocol_id", protocolId)
        .order("created_at");

      const htmlContent = ReactDOMServer.renderToStaticMarkup(
        React.createElement(ProtocolPdfView, {
          protocol,
          agendaItems: agendaItems ?? [],
          protocolMembers: protocolMembers ?? [],
          protocolAttachments: protocolAttachments ?? [],
          protocolMessages: protocolMessages ?? [],
          formatDate,
          company: company as Company,
        })
      );
      const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
      const page = await browser.newPage();
      const fullHtml = `
        <html>
          <head>
            <meta charset=\"UTF-8\">
            <link href=\"https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css\" rel=\"stylesheet\">
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `;
      await page.setContent(fullHtml, { waitUntil: "networkidle0" });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      });
      await browser.close();
      pdfAttachment = {
        filename: `protocol-${protocol.number}.pdf`,
        content: Buffer.from(pdfBuffer),
        contentType: "application/pdf",
      };
    } catch (pdfError) {
      console.error("Failed to generate PDF for email:", pdfError);
      // We can still send the email without the PDF, but we'll log the error.
    }

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
    const defaultEmail = process.env.DEFAULT_RECIPIENT_EMAIL || process.env.SMTP_USER;
    
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: defaultEmail,
      subject: emailSubject,
      html: emailHtml,
      attachments: pdfAttachment ? [pdfAttachment] : [],
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