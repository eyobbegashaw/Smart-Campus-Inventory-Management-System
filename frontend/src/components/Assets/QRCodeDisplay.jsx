
import React, { useRef } from 'react';
// 1. QRCodeCanvas ተብሎ እንዲጠራ ተቀይሯል
import { QRCodeCanvas } from 'qrcode.react'; 
import { FiX, FiDownload, FiPrinter } from 'react-icons/fi';
import { useReactToPrint } from 'react-to-print';


const QRCodeDisplay = ({ isOpen, onClose, asset }) => {
  const qrRef = useRef();

  // 2. አዲሱ የ react-to-print አጠቃቀም
  const handlePrint = useReactToPrint({
    contentRef: qrRef, // አሁን 'contentRef' ነው የሚባለው
    documentTitle: `QR_Code_${asset?.assetTag}`,
  });

  const handleDownload = () => {
    // 3. ከ canvas ላይ ዳታውን መውሰድ
    const canvas = document.getElementById('qr-canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `QR_${asset?.assetTag}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">QR Code</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <FiX size={24} />
          </button>
        </div>

        {/* Print የሚደረገው ክፍል */}
        <div ref={qrRef} className="flex flex-col items-center p-6 bg-white">
          <div className="p-4 border-2 border-gray-100 rounded-lg shadow-sm">
            {/* 4. QRCodeCanvas አጠቃቀም */}
            <QRCodeCanvas
              id="qr-canvas"
              value={JSON.stringify({
                type: 'asset',
                tag: asset?.assetTag,
                name: asset?.name
              })}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          <div className="mt-4 text-center">
            <p className="font-bold text-lg text-gray-900">{asset?.name}</p>
            <p className="text-md text-gray-600 font-mono">{asset?.assetTag}</p>
          </div>
        </div>

        <div className="flex justify-center space-x-4 mt-6">
          <button
            onClick={handleDownload}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiDownload className="mr-2" />
            Download
          </button>
          <button
            onClick={() => handlePrint()}
            className="flex items-center px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <FiPrinter className="mr-2" />
            Print
          </button>
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            Scan this QR code to quickly check out or view asset details.
            Print and attach to the physical asset.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDisplay;
