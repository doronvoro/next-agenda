import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server/server";
import { format } from "date-fns";
import type { Database } from "@/types/supabase";

export async function GET(request: NextRequest) {
  // Extract protocolId from the URL
  const url = new URL(request.url);
  const match = url.pathname.match(/\/protocols\/(.+?)\/download-pdf/);
  const protocolId = match ? match[1] : null;

  if (!protocolId) {
    return NextResponse.json({ error: "Protocol ID is required" }, { status: 400 });
  }

  try {
    // --- PDF GENERATION LOGIC ---
    const supabase = await createClient();
    const { data: protocol, error: protocolError } = await supabase
      .from("protocols")
      .select("*, committees(*)")
      .eq("id", protocolId)
      .single();
    if (protocolError) throw new Error(`Error fetching protocol: ${protocolError.message}`);

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

    const { data: agendaItems, error: agendaError } = await supabase
      .from("agenda_items")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("display_order");
    if (agendaError) throw new Error(`Error fetching agenda items: ${agendaError.message}`);

    const { data: protocolMembers, error: membersError } = await supabase
      .from("protocol_members")
      .select("*")
      .eq("protocol_id", protocolId);
    if (membersError) throw new Error(`Error fetching members: ${membersError.message}`);

    const { data: protocolAttachments, error: attachmentsError } = await supabase
      .from("protocol_attachments")
      .select("*")
      .eq("protocol_id", protocolId);
    if (attachmentsError) throw new Error(`Error fetching attachments: ${attachmentsError.message}`);

    const { data: protocolMessages, error: messagesError } = await supabase
      .from("protocol_messages")
      .select("*")
      .eq("protocol_id", protocolId)
      .order("created_at");
    if (messagesError) throw new Error(`Error fetching messages: ${messagesError.message}`);

    const { default: React } = await import("react");
    const ReactDOMServer = await import("react-dom/server");
    const ProtocolPdfView = (await import("@/app/dashboard/protocols/[id]/components/ProtocolPdfView")).default;

    type Company = Database["public"]["Tables"]["companies"]["Row"];
    const formatDate = (dateString: string) => format(new Date(dateString), "PPP");

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

    const puppeteer = (await import("puppeteer")).default;
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
    // --- END PDF GENERATION LOGIC ---

    const filename = `protocol-${protocolId}.pdf`;
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    });
  } catch (error) {
    console.error(`Failed to generate PDF for protocol ${protocolId}:`, error, (error instanceof Error ? error.stack : undefined));
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
} 