/**
 * Send a WhatsApp notification to the admin after order/inquiry.
 * Opens wa.me in a new tab with a pre-filled message.
 */

const ADMIN_WHATSAPP = '8801688500771'; // Anandabazar BDMart WhatsApp (with country code)

export function sendOrderToWhatsApp(data: {
    adminPhone?: string;
    customerName: string;
    customerContact: string;
    address?: string;
    items: { name?: string; quantity: number; price?: number; color?: string; size?: string }[];
    totalPrice?: number;
    note?: string;
}) {
    const phone = data.adminPhone || ADMIN_WHATSAPP;
    if (!phone) return; // no WhatsApp number configured yet
    const itemLines = data.items.map((item, i) =>
        `${i + 1}. ${item.name || 'Product'} × ${item.quantity}${item.color ? ` (${item.color})` : ''}${item.size ? ` [${item.size}]` : ''}${item.price ? ` — ৳${item.price}` : ''}`
    ).join('\n');

    const msg = `🛒 *New Order — Anandabazar BDMart*

👤 *Name:* ${data.customerName}
📞 *Contact:* ${data.customerContact}
📍 *Address:* ${data.address || 'N/A'}

📦 *Items:*
${itemLines}

💰 *Total:* ৳${data.totalPrice?.toLocaleString() || '—'}
${data.note ? `📝 *Note:* ${data.note}` : ''}
⏰ ${new Date().toLocaleString('en-BD')}`;

    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}

export function sendInquiryToWhatsApp(data: {
    adminPhone?: string;
    customerName: string;
    customerContact: string;
    productName: string;
    message: string;
    color?: string;
    size?: string;
}) {
    const phone = data.adminPhone || ADMIN_WHATSAPP;
    if (!phone) return; // no WhatsApp number configured yet
    const variantInfo = [data.color, data.size].filter(Boolean).join(' / ');

    const msg = `❓ *New Inquiry — Anandabazar BDMart*

👤 *Name:* ${data.customerName}
📞 *Contact:* ${data.customerContact}
📦 *Product:* ${data.productName}${variantInfo ? `\n🎨 *Variant:* ${variantInfo}` : ''}

💬 *Message:*
${data.message}

⏰ ${new Date().toLocaleString('en-BD')}`;

    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
}
