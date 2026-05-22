import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

interface QRCodeRequest {
  text: string;
}

interface QRCodeResponse {
  qrCodeUrl?: string;
  error?: string;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<QRCodeResponse>> {
  try {
    const { text }: QRCodeRequest = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const qrCodeUrl: string = await QRCode.toDataURL(text);
    return NextResponse.json({ qrCodeUrl }, { status: 200 });
  } catch (error: unknown) {
    console.error("QR code generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}
