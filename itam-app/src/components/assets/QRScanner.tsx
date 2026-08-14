'use client';

import { useEffect, useRef, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Camera, XCircle, RefreshCw, ScanLine } from 'lucide-react';

interface QRScannerProps {
  onClose: () => void;
  onScan: (result: string) => void;
}

export default function QRScanner({ onClose, onScan }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  useEffect(() => {
    mountedRef.current = true;
    let scanInterval: any = null;
    let html5QrCodeScanner: any = null;

    async function startCamera() {
      try {
        setError('');
        setScanning(false);

        // Stop existing stream if running
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Request WebRTC media stream
        let stream: MediaStream | null = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });
        } catch {
          // Fallback if ideal constraints fail
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (!mountedRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        if (mountedRef.current) {
          setScanning(true);
        }

        // Initialize Barcode & QR scanning loop
        let barcodeDetector: any = null;
        if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
          try {
            barcodeDetector = new (window as any).BarcodeDetector({
              formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e'],
            });
          } catch {}
        }

        // Fallback decoder using html5-qrcode
        const { Html5Qrcode } = await import('html5-qrcode');
        const tempDivId = 'temp-canvas-decoder-' + Math.random().toString(36).substring(7);
        let tempDiv = document.getElementById(tempDivId);
        if (!tempDiv) {
          tempDiv = document.createElement('div');
          tempDiv.id = tempDivId;
          tempDiv.style.display = 'none';
          document.body.appendChild(tempDiv);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        let isProcessing = false;

        scanInterval = setInterval(async () => {
          if (isProcessing || !mountedRef.current || !videoRef.current) return;
          const video = videoRef.current;
          if (video.readyState < 2) return; // HAVE_CURRENT_DATA

          isProcessing = true;

          try {
            // 1. Native BarcodeDetector (Fastest & most accurate)
            if (barcodeDetector) {
              const detected = await barcodeDetector.detect(video);
              if (detected && detected.length > 0 && mountedRef.current) {
                const code = detected[0].rawValue;
                if (code) {
                  onScan(code);
                  return;
                }
              }
            }

            // 2. Canvas Frame Decoding Fallback
            if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

              canvas.toBlob(async (blob) => {
                if (!blob || !mountedRef.current) return;
                try {
                  if (!html5QrCodeScanner) {
                    html5QrCodeScanner = new Html5Qrcode(tempDivId, false);
                  }
                  const file = new File([blob], 'frame.png', { type: 'image/png' });
                  const decoded = await html5QrCodeScanner.scanFileV2(file, false);
                  if (decoded && decoded.decodedText && mountedRef.current) {
                    onScan(decoded.decodedText);
                  }
                } catch {}
              }, 'image/png');
            }
          } catch {} finally {
            isProcessing = false;
          }
        }, 300);

      } catch (err: any) {
        if (!mountedRef.current) return;
        console.error('Camera access error:', err);
        setError('تعذر الوصول للكاميرا. يرجى إعطاء الصلاحية للكاميرا من إعدادات المتصفح.');
      }
    }

    startCamera();

    return () => {
      mountedRef.current = false;
      if (scanInterval) clearInterval(scanInterval);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (html5QrCodeScanner) {
        try {
          html5QrCodeScanner.clear();
        } catch {}
      }
    };
  }, [facingMode, onScan]);

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="ماسح الرموز (QR Code & Barcode)" size="md">
      <div className="flex flex-col items-center gap-4">
        {error ? (
          <div className="text-center py-8">
            <XCircle size={48} className="mx-auto text-red-400/30 mb-4" />
            <p className="text-sm text-red-400 max-w-xs mx-auto">{error}</p>
          </div>
        ) : (
          <>
            <div className="relative w-full max-w-sm mx-auto h-[280px] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              {/* Native Live Video Feed */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-2xl"
              />

              {/* Scanning Overlay Reticle */}
              {scanning && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[240px] h-[160px] border-2 border-cyan-400/60 rounded-xl relative flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                    {/* Corner Markers */}
                    <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400" />
                    <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400" />

                    {/* Laser Animated Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-[0_0_10px_#06b6d4]" />
                  </div>
                </div>
              )}

              {/* Loading Indicator when starting camera */}
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#090d16]/90 z-10">
                  <Camera size={36} className="text-cyan-400 animate-pulse mb-3" />
                  <p className="text-xs text-oasis-300 font-medium">جارِ فتح بث الكاميرا...</p>
                </div>
              )}

              {/* Switch Camera Button */}
              <button
                type="button"
                onClick={toggleCamera}
                className="absolute top-3 left-3 z-20 p-2 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white hover:bg-black/80 transition-all text-xs flex items-center gap-1.5"
                title="تبديل الكاميرا"
              >
                <RefreshCw size={14} className="text-cyan-400" />
                <span>تبديل الكاميرا</span>
              </button>
            </div>

            <p className="text-xs text-oasis-400 text-center flex items-center justify-center gap-1.5">
              <ScanLine size={14} className="text-cyan-400" />
              وجّه الكاميرا نحو رمز QR أو Barcode الجهاز وسيتم التعرف عليه تلقائياً
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}
