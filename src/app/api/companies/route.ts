import { createClient } from "@/lib/supabase/server/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: companies, error } = await supabase
      .from("companies")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch companies" },
        { status: 500 }
      );
    }

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { name, address, number } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    // First, get or create a default organization
    let { data: organizations, error: orgError } = await supabase
      .from("organizations")
      .select("id")
      .limit(1);

    if (orgError) {
      console.error("Error fetching organizations:", orgError);
      return NextResponse.json(
        { error: "Failed to get organization" },
        { status: 500 }
      );
    }

    let organizationId: string;
    if (organizations && organizations.length > 0) {
      organizationId = organizations[0].id;
    } else {
      // Create a default organization if none exists
      const { data: newOrg, error: createOrgError } = await supabase
        .from("organizations")
        .insert([{ name: "Default Organization" }])
        .select("id")
        .single();

      if (createOrgError) {
        console.error("Error creating default organization:", createOrgError);
        return NextResponse.json(
          { error: "Failed to create default organization" },
          { status: 500 }
        );
      }
      organizationId = newOrg.id;
    }

    const { data: company, error } = await supabase
      .from("companies")
      .insert([
        {
          name: name.trim(),
          address: address?.trim() || null,
          number: number?.trim() || null,
          organization_id: organizationId,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating company:", error);
      return NextResponse.json(
        { error: "Failed to create company" },
        { status: 500 }
      );
    }

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 