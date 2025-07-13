import { createClient } from "@/lib/supabase/server/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const supabase = await createClient();
    const { memberId } = await params;
    
    const { error } = await supabase
      .from("committees_members")
      .delete()
      .eq("id", memberId);

    if (error) {
      console.error("Error deleting committee member:", error);
      return NextResponse.json(
        { error: "Failed to delete committee member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting committee member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { memberId } = await params;
    
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Member name is required" },
        { status: 400 }
      );
    }

    const { data: member, error } = await supabase
      .from("committees_members")
      .update({
        name: name.trim(),
      })
      .eq("id", memberId)
      .select()
      .single();

    if (error) {
      console.error("Error updating committee member:", error);
      return NextResponse.json(
        { error: "Failed to update committee member" },
        { status: 500 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    console.error("Error updating committee member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 