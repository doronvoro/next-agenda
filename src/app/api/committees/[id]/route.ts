import { createClient } from "@/lib/supabase/server/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    const { error } = await supabase
      .from("committees")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting committee:", error);
      return NextResponse.json(
        { error: "Failed to delete committee" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting committee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { id } = await params;
    
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
      .update({
        name: name.trim(),
        company_id: company_id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating committee:", error);
      return NextResponse.json(
        { error: "Failed to update committee" },
        { status: 500 }
      );
    }

    return NextResponse.json(committee);
  } catch (error) {
    console.error("Error updating committee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 