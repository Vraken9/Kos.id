import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import { queryOne } from '@/lib/db';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: '#1f2937',
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669', // Emerald 600
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 150,
    color: '#6b7280',
  },
  value: {
    flex: 1,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  totalBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ecfdf5', // Emerald 50
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#065f46', // Emerald 800
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#065f46',
  }
});

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: string | Date) {
  const d = new Date(date);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WIB`;
}

// PDF Document Component
const ReceiptDocument = ({ booking }: { booking: Record<string, any> }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>kos.id</Text>
          <Text style={styles.subtitle}>Struk Pemesanan Kos</Text>
        </View>
        <View>
          <Text style={{ fontSize: 10, color: '#6b7280', textAlign: 'right' }}>Kode Booking</Text>
          <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{booking.booking_code}</Text>
        </View>
      </View>

      {/* Customer Info */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Nama Pemesan</Text>
          <Text style={styles.value}>{booking.customer_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>No. WhatsApp</Text>
          <Text style={styles.value}>{booking.customer_whatsapp}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tanggal Pesan</Text>
          <Text style={styles.value}>{formatDate(booking.created_at)}</Text>
        </View>
        {booking.confirmed_at && (
          <View style={styles.row}>
            <Text style={styles.label}>Tanggal Konfirmasi</Text>
            <Text style={styles.value}>{formatDate(booking.confirmed_at)}</Text>
          </View>
        )}
      </View>

      <View style={{ marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }} />

      {/* Kos Info */}
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Nama Kos</Text>
          <Text style={styles.value}>{booking.snapshot_kos_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Alamat Kos</Text>
          <Text style={styles.value}>{booking.snapshot_kos_address}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tipe Kamar</Text>
          <Text style={styles.value}>{booking.snapshot_room_type_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tanggal Mulai Sewa</Text>
          <Text style={styles.value}>{formatDate(booking.planned_checkin_date).split(' ')[0]}</Text>
        </View>
      </View>

      {/* Total Box */}
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total Pembayaran (Confirmed)</Text>
        <Text style={styles.totalValue}>{formatRupiah(booking.payment_amount)}</Text>
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 10, color: '#4b5563' }}>WhatsApp Pemilik: {booking.snapshot_owner_whatsapp}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Struk ini adalah bukti pembayaran yang sah diterbitkan oleh sistem kos.id.</Text>
        <Text>Harap simpan struk ini sebagai bukti pemesanan kamar Anda.</Text>
      </View>
    </Page>
  </Document>
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingCode: string }> }
) {
  try {
    const { bookingCode } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const booking = await queryOne<Record<string, any>>(
      'SELECT * FROM bookings WHERE booking_code = ? AND access_token = ? AND status = "confirmed"',
      [bookingCode, token]
    );

    if (!booking) {
      return new NextResponse('Booking not found or not confirmed', { status: 404 });
    }

    const stream = await renderToStream(<ReceiptDocument booking={booking} />);
    
    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="kos-id-receipt-${bookingCode}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return new NextResponse('Server Error', { status: 500 });
  }
}
