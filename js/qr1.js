// qr-fix.js - Minimal QR Code Fix
document.addEventListener('DOMContentLoaded', function() {
  // Override problematic functions
  const originalGenerateQRCode = window.generateQRCode;
  const originalDownloadQRCode = window.downloadQRCode;
  
  // Fix generateQRCode
  window.generateQRCode = function() {
    if (!window.currentURLData) {
      alert('Please create a short URL first');
      return;
    }
    
    const qrContainer = document.getElementById('qrContainer');
    const qrcodeElement = document.getElementById('qrcode');
    
    if (!qrContainer || !qrcodeElement) {
      alert('QR code elements not found');
      return;
    }
    
    // Clear previous
    qrcodeElement.innerHTML = '';
    
    // Generate QR code
    QRCode.toCanvas(qrcodeElement, window.currentURLData.shortURL, {
      width: 200,
      height: 200,
      color: {
        dark: '#6a11cb',
        light: '#ffffff'
      }
    }, function(error) {
      if (error) {
        console.error('QR error:', error);
        // Fallback to API
        const encoded = encodeURIComponent(window.currentURLData.shortURL);
        qrcodeElement.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encoded}" alt="QR Code">`;
      }
      
      qrContainer.style.display = 'block';
      qrContainer.scrollIntoView({ behavior: 'smooth' });
    });
  };
  
  // Fix downloadQRCode
  window.downloadQRCode = function() {
    // Try canvas first
    const canvas = document.querySelector('#qrcode canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `qr-${window.currentURLData.key}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      return;
    }
    
    // Try image fallback
    const img = document.querySelector('#qrcode img');
    if (img) {
      const link = document.createElement('a');
      link.download = `qr-${window.currentURLData.key}.png`;
      link.href = img.src;
      link.click();
      return;
    }
    
    alert('Generate a QR code first');
  };
  
  console.log('QR fixes applied');
});