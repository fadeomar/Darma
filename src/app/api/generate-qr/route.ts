import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

const MAX_QR_TEXT_LENGTH = 2000;

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

    if (text.trim().length === 0 || text.length > MAX_QR_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text is required and must be ${MAX_QR_TEXT_LENGTH} characters or fewer.` },
        { status: 400 },
      );
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
