import { createClient } from "@/lib/supabase/server/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: committees, error } = await supabase
      .from("committees")
      .select(`
        *,
        company:companies!company_id(id, name)
      `)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch committees" },
        { status: 500 }
      );
    }

    return NextResponse.json(committees);
  } catch (error) {
    console.error("Error fetching committees:", error);
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
    
    const { name, company_id } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Committee name is required" },
        { status: 400 }
      );
    }

    if (!company_id) {
      return NextResponse.json(
        { error: "Company is required" },
        { status: 400 }
      );
    }

    const { data: committee, error } = await supabase
      .from("committees")
      .insert([
        {
          name: name.trim(),
          company_id: company_id,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating committee:", error);
      return NextResponse.json(
        { error: "Failed to create committee" },
        { status: 500 }
      );
    }

    return NextResponse.json(committee, { status: 201 });
  } catch (error) {
    console.error("Error creating committee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 