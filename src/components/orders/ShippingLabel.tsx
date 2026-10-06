import { useEffect, useRef } from "react";
import type { StoreOrderRecord } from "../../services/order.service";

// --------------- Code-128 Subset B (ASCII 32-127) encoder ---------------
const C128: Record<number, string> = {
  0:"11011001100",1:"11001101100",2:"11001100110",3:"10010011000",
  4:"10010001100",5:"10001001100",6:"10011001000",7:"10011000100",
  8:"10001100100",9:"11001001000",10:"11001000100",11:"11000100100",
  12:"10110011100",13:"10011011100",14:"10011001110",15:"10111001100",
  16:"10011101100",17:"10011100110",18:"11001110010",19:"11001011100",
  20:"11001001110",21:"11011100100",22:"11001110100",23:"11101101110",
  24:"11101001100",25:"11100101100",26:"11100100110",27:"11101100100",
  28:"11100110100",29:"11100110010",30:"11011011000",31:"11011000110",
  32:"11000110110",33:"10100011000",34:"10001011000",35:"10001000110",
  36:"10110001000",37:"10001101000",38:"10001100010",39:"11010001000",
  40:"11000101000",41:"11000100010",42:"10110111000",43:"10110001110",
  44:"10001101110",45:"10111011000",46:"10111000110",47:"10001110110",
  48:"11101110110",49:"11010001110",50:"11000101110",51:"11011101000",
  52:"11011100010",53:"11011101110",54:"11101011000",55:"11101000110",
  56:"11100010110",57:"11101101000",58:"11101100010",59:"11100011010",
  60:"11101111010",61:"11001000010",62:"11110001010",63:"10100110000",
  64:"10100001100",65:"10010110000",66:"10010000110",67:"10000101100",
  68:"10000100110",69:"10110010000",70:"10110000100",71:"10011010000",
  72:"10011000010",73:"10000110100",74:"10000110010",75:"11000010010",
  76:"11001010000",77:"11110111010",78:"11000010100",79:"10001111010",
  80:"10100111100",81:"10010111100",82:"10010011110",83:"10111100100",
  84:"10011110100",85:"10011110010",86:"11110100100",87:"11110010100",
  88:"11110010010",89:"11011011110",90:"11011110110",91:"11110110110",
  92:"10101111000",93:"10100011110",94:"10001011110",95:"10111101000",
};
const START_B = "11010010000";
const STOP    = "11000111010";

export function encodeC128(text: string): string {
  let chk = 104;
  const bars: string[] = [START_B];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    if (code < 0 || code > 95) continue;
    chk += (i + 1) * code;
    bars.push(C128[code] || "");
  }
  bars.push(C128[chk % 103] || "");
  bars.push(STOP);
  bars.push("11");
  return bars.join("");
}

function drawBarcode(canvas: HTMLCanvasElement, text: string) {
  const enc = encodeC128(text);
  const bw = 2, h = 65;
  canvas.width = enc.length * bw;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, h);
  for (let i = 0; i < enc.length; i++) {
    ctx.fillStyle = enc[i] === "1" ? "#000" : "#fff";
    ctx.fillRect(i * bw, 0, bw, h);
  }
}

// --------------- Tracking code generator ---------------
const CARRIER_PREFIX: Record<string, string> = {
  "GHN": "GHN",
  "GHTK": "GHTK",
  "Viettel Post": "VTP",
  "SCANMS Express": "SCX",
  "J&T Express": "JT",
  "Hoa Toc / Grab": "HTC",
  "Khac": "PKG",
};

export function generateTrackingCode(carrier: string): string {
  const prefix = CARRIER_PREFIX[carrier] ?? "SCX";
  const ts  = Date.now().toString(36).toUpperCase().slice(-4);
  const rnd = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `${prefix}-${ts}${rnd}`;
}

// --------------- ShippingLabel React preview component ---------------
interface LabelProps {
  order: StoreOrderRecord;
  trackingNumber: string;
  carrier: string;
  note?: string;
  storeName?: string;
}

export function ShippingLabel({ order, trackingNumber, carrier, note, storeName }: LabelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && trackingNumber) drawBarcode(canvasRef.current, trackingNumber);
  }, [trackingNumber]);

  const totalVnd = Number(order.finalAmount).toLocaleString("vi-VN");
  const printDate = new Date().toLocaleDateString("vi-VN");
  const isCod = order.paymentMethod === "COD";
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=${encodeURIComponent(trackingNumber)}&format=png`;

  return (
    <div style={{ width: "315px", fontFamily: "Arial,sans-serif", fontSize: "10px", color: "#000", background: "#fff", border: "2px solid #000", padding: "10px", boxSizing: "border-box" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #000", paddingBottom: "6px", marginBottom: "6px" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: "15px", letterSpacing: "0.5px" }}>{carrier.toUpperCase()}</div>
          <div style={{ fontSize: "8px", color: "#555" }}>SCANMS Logistics Simulation</div>
        </div>
        <div style={{ textAlign: "right", fontSize: "8px", color: "#444" }}>
          <div>In: {printDate}</div>
          <div>Don #{order.externalOrderSn}</div>
        </div>
      </div>

      {/* Barcode */}
      <div style={{ textAlign: "center", marginBottom: "6px" }}>
        <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "48px", display: "block", margin: "0 auto" }} />
        <div style={{ fontWeight: 900, fontSize: "13px", letterSpacing: "2px", fontFamily: "monospace", marginTop: "3px" }}>{trackingNumber}</div>
      </div>

      <div style={{ borderBottom: "1px dashed #000", margin: "6px 0" }} />

      {/* Addresses */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
        <div style={{ flex: 1, borderRight: "1px solid #ccc", paddingRight: "8px" }}>
          <div style={{ fontSize: "7px", fontWeight: 700, color: "#555", textTransform: "uppercase" }}>Nguoi gui</div>
          <div style={{ fontWeight: 700, marginTop: "2px" }}>{storeName ?? "SCANMS Store"}</div>
          <div style={{ fontSize: "8px", color: "#666" }}>San TMDT SCANMS</div>
        </div>
        <div style={{ flex: 1.3 }}>
          <div style={{ fontSize: "7px", fontWeight: 700, color: "#555", textTransform: "uppercase" }}>Nguoi nhan</div>
          <div style={{ fontWeight: 900, fontSize: "12px", marginTop: "2px" }}>{order.customerName}</div>
          <div style={{ fontSize: "10px", fontWeight: 700 }}>{"\uD83D\uDCDE"} {order.customerPhone}</div>
          <div style={{ fontSize: "8px", color: "#333", marginTop: "2px", lineHeight: "1.4" }}>{order.shippingAddress}</div>
        </div>
      </div>

      <div style={{ borderBottom: "1px dashed #000", margin: "6px 0" }} />

      {/* Items */}
      <div style={{ marginBottom: "6px" }}>
        <div style={{ fontSize: "7px", fontWeight: 700, color: "#555", textTransform: "uppercase", marginBottom: "2px" }}>Noi dung kien hang</div>
        {(order.items ?? []).slice(0, 5).map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", marginBottom: "1px" }}>
            <span style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title} x{item.quantity}</span>
            <span style={{ fontWeight: 600 }}>{Number(item.unitPrice * item.quantity).toLocaleString("vi-VN")} d</span>
          </div>
        ))}
      </div>

      {/* COD box */}
      <div style={{ background: isCod ? "#fff3cd" : "#d4edda", border: `2px solid ${isCod ? "#ffc107" : "#28a745"}`, borderRadius: "4px", padding: "5px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: "9px" }}>{isCod ? "\uD83D\uDCB0 COD - THU TIEN KHI GIAO" : "\u2705 DA THANH TOAN ONLINE"}</div>
          <div style={{ fontSize: "7px", color: "#666" }}>PT: {order.paymentMethod}</div>
        </div>
        {isCod && <div style={{ fontWeight: 900, fontSize: "14px", color: "#c0392b" }}>{totalVnd} d</div>}
      </div>

      {/* Bottom: note + QR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, paddingRight: "8px" }}>
          {note && <div style={{ fontSize: "8px", background: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: "3px", padding: "4px" }}><strong>Ghi chu:</strong> {note}</div>}
          <div style={{ fontSize: "6px", color: "#999", marginTop: "4px" }}>Khong mo hang khi chua thanh toan - SCANMS</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <img src={qr} width="64" height="64" alt="QR" />
          <div style={{ fontSize: "6px", color: "#888" }}>Tra cuu van don</div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid #ccc", marginTop: "6px", paddingTop: "4px", fontSize: "6px", color: "#999", textAlign: "center" }}>
        SCANMS Platform - scanms.com - 1900-SCANMS
      </div>
    </div>
  );
}

// --------------- printShippingLabel ---------------
export function printShippingLabel(
  order: StoreOrderRecord,
  trackingNumber: string,
  carrier: string,
  note?: string,
  storeName?: string,
) {
  const enc = encodeC128(trackingNumber);
  const bw = 2;
  const tw = enc.length * bw;
  const bars = Array.from(enc).map((b, i) =>
    b === "1" ? `<rect x="${i * bw}" y="0" width="${bw}" height="70" fill="#000"/>` : ""
  ).join("");

  const totalVnd = Number(order.finalAmount).toLocaleString("vi-VN");
  const printDate = new Date().toLocaleDateString("vi-VN");
  const isCod = order.paymentMethod === "COD";
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=72x72&data=${encodeURIComponent(trackingNumber)}&format=png`;
  const rows = (order.items ?? []).slice(0, 6).map(item =>
    `<tr><td style="font-size:8px;padding:1px 0;max-width:60mm;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.title} x${item.quantity}</td><td style="font-size:8px;text-align:right;font-weight:600">${Number(item.unitPrice * item.quantity).toLocaleString("vi-VN")} d</td></tr>`
  ).join("");

  const win = window.open("", "_blank", "width=480,height=700");
  if (!win) { alert("Trinh duyet da chan popup. Vui long cho phep popup tu trang nay."); return; }

  win.document.write(
    `<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"/>` +
    `<title>Phieu Giao Hang - ${trackingNumber}</title>` +
    `<style>@page{size:A6 portrait;margin:0}*{box-sizing:border-box;margin:0;padding:0}` +
    `body{width:105mm;min-height:148mm;font-family:Arial,sans-serif;font-size:10px;color:#000;background:#fff;padding:6mm}` +
    `@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>` +
    `<div style="display:flex;justify-content:space-between;border-bottom:2px solid #000;padding-bottom:3mm;margin-bottom:3mm">` +
    `<div><div style="font-weight:900;font-size:15px">${carrier.toUpperCase()}</div><div style="font-size:8px;color:#555">SCANMS Logistics Simulation</div></div>` +
    `<div style="text-align:right;font-size:8px;color:#444"><div>In: ${printDate}</div><div>Don #${order.externalOrderSn}</div></div></div>` +
    `<div style="text-align:center;margin-bottom:3mm">` +
    `<svg width="${tw}" height="70" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;display:block;margin:0 auto"><rect width="${tw}" height="70" fill="#fff"/>${bars}</svg>` +
    `<div style="font-weight:900;font-size:14px;letter-spacing:3px;font-family:monospace;margin-top:2px">${trackingNumber}</div></div>` +
    `<div style="border-bottom:1px dashed #000;margin:3mm 0"></div>` +
    `<div style="display:flex;gap:3mm;margin-bottom:3mm">` +
    `<div style="flex:1;border-right:1px solid #ccc;padding-right:3mm"><div style="font-size:7px;font-weight:700;color:#555;text-transform:uppercase;margin-bottom:1mm">Nguoi gui</div><div style="font-weight:700">${storeName ?? "SCANMS Store"}</div><div style="font-size:8px;color:#666">San TMDT SCANMS</div></div>` +
    `<div style="flex:1.3"><div style="font-size:7px;font-weight:700;color:#555;text-transform:uppercase;margin-bottom:1mm">Nguoi nhan</div><div style="font-weight:900;font-size:12px">${order.customerName}</div><div style="font-size:10px;font-weight:700">\uD83D\uDCDE ${order.customerPhone}</div><div style="font-size:8px;color:#222;margin-top:1mm;line-height:1.4">${order.shippingAddress}</div></div>` +
    `</div><div style="border-bottom:1px dashed #000;margin:3mm 0"></div>` +
    `<div style="font-size:7px;font-weight:700;color:#555;text-transform:uppercase;margin-bottom:1mm">Noi dung kien hang</div>` +
    `<table style="width:100%;border-collapse:collapse;margin-bottom:3mm"><tbody>${rows}</tbody></table>` +
    `<div style="border-radius:3mm;padding:2mm 3mm;display:flex;justify-content:space-between;align-items:center;margin-bottom:3mm;${isCod ? "background:#fff3cd;border:2px solid #ffc107" : "background:#d4edda;border:2px solid #28a745"}">` +
    `<div><div style="font-size:9px;font-weight:900">${isCod ? "\uD83D\uDCB0 COD - THU TIEN KHI GIAO" : "\u2705 DA THANH TOAN ONLINE"}</div><div style="font-size:7px;color:#555">PT: ${order.paymentMethod}</div></div>` +
    `${isCod ? `<div style="font-weight:900;font-size:15px;color:#c0392b">${totalVnd} d</div>` : ""}` +
    `</div>` +
    `<div style="display:flex;justify-content:space-between;align-items:flex-start">` +
    `<div style="flex:1;padding-right:3mm">${note ? `<div style="font-size:8px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:2mm;padding:2mm"><strong>Ghi chu:</strong> ${note}</div>` : ""}<div style="font-size:7px;color:#777;margin-top:2mm">Khong mo hang khi chua thanh toan - SCANMS</div></div>` +
    `<div style="text-align:center"><img src="${qr}" width="72" height="72" alt="QR"/><div style="font-size:6px;color:#888;margin-top:1mm">Tra cuu van don</div></div>` +
    `</div>` +
    `<div style="border-top:1px solid #ccc;margin-top:3mm;padding-top:2mm;font-size:6px;color:#999;text-align:center">SCANMS Platform - scanms.com - 1900-SCANMS</div>` +
    `<script>var i=document.querySelector('img');function p(){setTimeout(function(){window.print();setTimeout(function(){window.close();},500);},400);}if(i&&!i.complete){i.onload=p;i.onerror=p;}else{p();}<\\/script>` +
    `</body></html>`
  );
  win.document.close();
}
