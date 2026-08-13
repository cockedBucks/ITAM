'use client';

import { useEffect, useRef, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Camera, XCircle } from 'lucide-react';

interface QRScannerProps {
  onClose: () => void;
  onScan: (result: string) => void;
}

export default function QRScanner({ onClose, onScan }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let scanner: any = null;

    async function startScanner() {
      try {
        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import('html5-qrcode');

        if (!scannerRef.current) return;

        scanner = new Html5Qrcode('qr-reader');
        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText: string) => {
            // Auto-fill the scanned tag
            onScan(decodedText);
            scanner.stop().catch(() => {});
          },
          () => {
            // Scan error — ignore, keep scanning
          }
        );
        setScanning(true);
      } catch (err) {
        setError(
          'لم يتم العثور على كاميرا أو تم رفض الإذن. تأكد من السماح بالوصول للكاميرا.'
        );
      }
    }

    startScanner();

    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <Modal isOpen={true} onClose={onClose} title="ماسح رمز QR" size="md">
      <div className="flex flex-col items-center gap-4">
        {error ? (
          <div className="text-center py-8">
            <XCircle size={48} className="mx-auto text-red-400/30 mb-4" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : (
          <>
            <div className="relative w-full max-w-sm mx-auto">
              <div
                id="qr-reader"
                ref={scannerRef}
                className="rounded-xl overflow-hidden"
              />
              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-oasis-900/80 rounded-xl">
                  <div className="flex flex-col items-center gap-3">
                    <Camera size={32} className="text-cyan-glow animate-glow-pulse" />
                    <p className="text-sm text-oasis-400">جارِ تشغيل الكاميرا...</p>
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-oasis-400 text-center">
              وجّه الكاميرا نحو رمز QR الخاص بالأصل وسيتم البحث تلقائياً
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
