"use client";

import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

type Props = {
  branches: string[];
  baseUrl: string; // e.g. "https://your-site.vercel.app"
};

function BranchQRCard({ branch, baseUrl }: { branch: string; baseUrl: string }) {
  const url = `${baseUrl}/checkin?branch=${encodeURIComponent(branch)}`;
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Check-in QR — ${branch}</title>
          <style>
            body {
              display: flex; flex-direction: column;
              align-items: center; justify-content: center;
              min-height: 100vh; margin: 0;
              font-family: -apple-system, sans-serif;
              background: white;
            }
            .card {
              text-align: center; padding: 40px;
              border: 2px solid #e5e7eb; border-radius: 16px;
              max-width: 400px;
            }
            .logo-bar {
              background: #0f6e56; border-radius: 10px;
              padding: 16px 24px; margin-bottom: 24px;
            }
            .logo-bar img { height: 48px; }
            h1 { font-size: 24px; font-weight: 700; color: #111; margin: 0 0 4px; }
            p { font-size: 14px; color: #6b7280; margin: 0 0 24px; }
            .branch { font-size: 18px; font-weight: 600; color: #0f6e56; margin: 16px 0 24px; }
            .url { font-size: 11px; color: #9ca3af; margin-top: 20px; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo-bar">
              <img src="${baseUrl}/logo.png" alt="Abundance City Church" />
            </div>
            <h1>Check In</h1>
            <p>Scan to check yourself in</p>
            ${content.innerHTML}
            <p class="branch">${branch}</p>
            <p class="url">${url}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-center text-center">
      <h3 className="text-base font-semibold text-gray-900 mb-1">{branch}</h3>
      <p className="text-xs text-gray-400 mb-4">Members scan this to check in</p>

      {/* QR code */}
      <div ref={printRef} className="bg-white p-3 rounded-lg border border-gray-100 mb-4">
        <QRCodeSVG
          value={url}
          size={180}
          level="M"
          includeMargin
          imageSettings={{
            src: "/logo.png",
            x: undefined,
            y: undefined,
            height: 36,
            width: 36,
            excavate: true,
          }}
        />
      </div>

      {/* URL preview */}
      <p className="text-[10px] text-gray-300 break-all mb-4 max-w-[200px]">{url}</p>

      {/* Actions */}
      <div className="flex gap-2 w-full">
        <button
          onClick={handlePrint}
          className="flex-1 bg-teal-700 text-white rounded-md py-2 text-sm font-medium hover:bg-teal-800"
        >
          Print
        </button>
        <button
          onClick={() => navigator.clipboard.writeText(url)}
          className="flex-1 border border-gray-300 rounded-md py-2 text-sm hover:bg-gray-50"
        >
          Copy link
        </button>
      </div>
    </div>
  );
}

export default function CheckinQRTab({ branches, baseUrl }: Props) {
  if (branches.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-gray-400">
          No branches found. Add a branch to your members first, then come back here to generate QR codes.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-sm text-gray-500">
          One QR code per branch. Print each one and display it at the entrance.
          Members scan it with their phone camera — no app needed — and the check-in
          page opens with the branch already selected.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <BranchQRCard key={branch} branch={branch} baseUrl={baseUrl} />
        ))}
      </div>

      <div className="mt-8 bg-amber-50 border border-amber-100 rounded-lg p-4 text-sm text-amber-800">
        <p className="font-medium mb-1">Before printing</p>
        <p className="text-xs text-amber-700">
          Make sure your dashboard URL is correct in the QR codes above — each link
          should start with <strong>https://</strong>. If you&apos;re testing locally
          (localhost) the QR code won&apos;t work for members on their phones. Deploy
          to Vercel first, then print.
        </p>
      </div>
    </div>
  );
}
