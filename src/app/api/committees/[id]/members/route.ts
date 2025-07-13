import { createClient } from "@/lib/supabase/server/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { data: members, error } = await supabase
      .from("committees_members")
      .select("*")
      .eq("committee_id", id)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch committee members" },
        { status: 500 }
      );
    }

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching committee members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id } = await params;
    
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Member name is required" },
        { status: 400 }
      );
    }

    const { data: member, error } = await supabase
      .from("committees_members")
      .insert([
        {
          committee_id: id,
          name: name.trim(),
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating committee member:", error);
      return NextResponse.json(
        { error: "Failed to create committee member" },
        { status: 500 }
      );
    }

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Error creating committee member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 