'use client';

import Modal from '@/components/ui/Modal';
import type { Asset } from '@/types/database';
import { ASSET_TYPE_AR } from '@/types/database';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';

interface QRModalProps {
  asset: Asset;
  onClose: () => void;
}

export default function QRModal({ asset, onClose }: QRModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="رمز QR للأصل" size="sm">
      <div className="flex flex-col items-center gap-6">
        {/* Printable Area */}
        <div className="print-area bg-white rounded-2xl p-8 flex flex-col items-center gap-4">
          <QRCodeSVG
            value={asset.asset_tag}
            size={200}
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#020617"
          />
          <div className="text-center">
            <p
              className="text-xl font-bold text-oasis-950 tracking-widest"
              style={{ fontFamily: 'monospace' }}
            >
              {asset.asset_tag}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {asset.brand} {asset.model} — {ASSET_TYPE_AR[asset.type]}
            </p>
            {asset.serial && (
              <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: 'monospace' }}>
                S/N: {asset.serial}
              </p>
            )}
            <p className="text-[10px] text-gray-400 mt-2">Smart Oasis IT Portal</p>
          </div>
        </div>

        {/* Print Button */}
        <button onClick={handlePrint} className="btn-primary">
          <Printer size={16} />
          طباعة الملصق
        </button>
      </div>
    </Modal>
  );
}
