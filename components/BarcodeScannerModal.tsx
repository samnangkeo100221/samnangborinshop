'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';
import { soundEffects } from '@/lib/audio';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'ស្កេនបាកូដតាមកាមេរ៉ា',
}) => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCamIndex, setCurrentCamIndex] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const readerElementId = 'html5-qrcode-reader-box';

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
        scannerRef.current = null;
      }
      setIsScanning(false);
    } catch (err) {
      console.warn('Error stopping scanner:', err);
    }
  }, []);

  const startScanning = useCallback(
    async (cameraId: string) => {
      try {
        if (scannerRef.current) {
          await stopScanner();
        }

        const html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          cameraId,
          {
            fps: 15,
            qrbox: { width: 280, height: 180 },
            aspectRatio: 1.333,
          },
          (decodedText) => {
            soundEffects.playBeep();
            onScan(decodedText);
            stopScanner();
            onClose();
          },
          () => {
            // Frame scan loop
          }
        );

        setIsScanning(true);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg('កាមេរ៉ាមិនអាចបើកបាន: ' + msg);
      }
    },
    [onClose, onScan, stopScanner]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    async function initScanner() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (!devices || devices.length === 0) {
          setErrorMsg('រកមិនឃើញកាមេរ៉ាលើឧបករណ៍នេះទេ');
          return;
        }

        setCameras(devices);
        let defaultIndex = devices.findIndex((d) => /back|rear|environment/i.test(d.label));
        if (defaultIndex === -1) defaultIndex = devices.length - 1;
        setCurrentCamIndex(defaultIndex);

        startScanning(devices[defaultIndex].id);
      } catch (e: unknown) {
        if (!isMounted) return;
        const msg = e instanceof Error ? e.message : String(e);
        setErrorMsg('សូមអនុញ្ញាតសិទ្ធិកាមេរ៉ាក្នុង Browser: ' + msg);
      }
    }

    initScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen, startScanning, stopScanner]);

  const switchCamera = async () => {
    if (cameras.length <= 1) return;
    const nextIndex = (currentCamIndex + 1) % cameras.length;
    setCurrentCamIndex(nextIndex);
    await startScanning(cameras[nextIndex].id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-800/80">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-700/60 text-slate-300 hover:bg-slate-700 hover:text-white transition"
            aria-label="បិទ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport */}
        <div className="relative min-h-[300px] bg-black flex items-center justify-center p-2">
          <div id={readerElementId} className="w-full overflow-hidden rounded-xl" />

          {/* Target Reticle Overlay */}
          {isScanning && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-36 border-2 border-dashed border-amber-400 rounded-lg shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-pulse flex flex-col justify-between p-2">
                <span className="text-[10px] text-amber-300 tracking-wider text-center bg-black/50 px-2 py-0.5 rounded">
                  ដាក់បាកូដក្នុងប្រអប់នេះ
                </span>
                <div className="w-full h-0.5 bg-amber-400/80 shadow-[0_0_8px_#fbbf24] animate-bounce" />
                <span className="text-[10px] text-slate-300 text-center">
                  EAN-13, 128, QR
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/90 text-amber-300">
              <AlertCircle className="w-10 h-10 mb-2 text-rose-400" />
              <p className="text-sm font-medium mb-3">{errorMsg}</p>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  if (cameras.length > 0) startScanning(cameras[currentCamIndex].id);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-xs"
              >
                ព្យាយាមម្តងទៀត
              </button>
            </div>
          )}
        </div>

        {/* Controls Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900 px-4 py-3">
          <span className="text-xs text-slate-400">
            {cameras.length > 1 ? `កាមេរ៉ា (${currentCamIndex + 1}/${cameras.length})` : 'កាមេរ៉ាសកម្ម'}
          </span>

          <div className="flex items-center gap-2">
            {cameras.length > 1 && (
              <button
                onClick={switchCamera}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                ប្តូរកាមេរ៉ា
              </button>
            )}
            <button
              onClick={() => {
                stopScanner();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
            >
              បោះបង់
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
