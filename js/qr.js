// qr-helper.js - QR Code Generation and Download Helper
// Add this script tag after your main script: <script src="qr-helper.js"></script>

// QR Code Utility Functions
const QRHelper = {
  // Initialize QR Code functionality
  init() {
    console.log('QR Helper initialized');
  },

  // Generate QR Code
  generateQRCode(text, elementId = 'qrcode', options = {}) {
    return new Promise((resolve, reject) => {
      const element = document.getElementById(elementId);
      if (!element) {
        reject(new Error('QR code element not found'));
        return;
      }

      // Clear previous content
      element.innerHTML = '';

      // Default options
      const defaultOptions = {
        width: 200,
        height: 200,
        colorDark: '#6a11cb',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      };

      const finalOptions = { ...defaultOptions, ...options };

      try {
        QRCode.toCanvas(element, text, finalOptions, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve(element.querySelector('canvas'));
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  // Generate QR Code with better error handling
  generateQRCodeWithFallback(text, elementId = 'qrcode') {
    return new Promise((resolve) => {
      this.generateQRCode(text, elementId)
        .then(canvas => resolve({ success: true, canvas }))
        .catch(error => {
          console.error('QR generation failed:', error);
          this.showQRCodeFallback(text, elementId);
          resolve({ success: false, error: error.message });
        });
    });
  },

  // Show fallback QR code using API
  showQRCodeFallback(text, elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const encodedText = encodeURIComponent(text);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedText}&color=6a11cb&bgcolor=ffffff`;

    element.innerHTML = `
      <img src="${qrUrl}" alt="QR Code" style="width: 200px; height: 200px;">
      <p style="color: #ff9800; font-size: 12px; margin-top: 5px;">
        <i class="fas fa-exclamation-triangle"></i> Using fallback QR generator
      </p>
    `;
  },

  // Download QR Code as PNG
  downloadQRCode(canvas, filename = 'qrcode.png') {
    return new Promise((resolve, reject) => {
      if (!canvas || !canvas.toDataURL) {
        reject(new Error('Invalid canvas element'));
        return;
      }

      try {
        // Create download link
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  },

  // Generate and download QR code in one step
  generateAndDownloadQR(text, filename = 'qrcode.png') {
    const tempDiv = document.createElement('div');
    tempDiv.style.display = 'none';
    tempDiv.id = 'temp-qr-container';
    document.body.appendChild(tempDiv);

    return new Promise((resolve, reject) => {
      this.generateQRCode(text, 'temp-qr-container')
        .then(canvas => {
          this.downloadQRCode(canvas, filename)
            .then(() => {
              document.body.removeChild(tempDiv);
              resolve(true);
            })
            .catch(error => {
              document.body.removeChild(tempDiv);
              reject(error);
            });
        })
        .catch(error => {
          document.body.removeChild(tempDiv);
          reject(error);
        });
    });
  },

  // Get QR code as data URL
  getQRCodeDataURL(text) {
    return new Promise((resolve, reject) => {
      const tempDiv = document.createElement('div');
      tempDiv.style.display = 'none';
      tempDiv.id = 'temp-qr-dataurl';
      document.body.appendChild(tempDiv);

      this.generateQRCode(text, 'temp-qr-dataurl')
        .then(canvas => {
          const dataURL = canvas.toDataURL('image/png');
          document.body.removeChild(tempDiv);
          resolve(dataURL);
        })
        .catch(error => {
          document.body.removeChild(tempDiv);
          reject(error);
        });
    });
  },

  // Copy QR code to clipboard (modern browsers)
  copyQRCodeToClipboard(text) {
    return new Promise((resolve, reject) => {
      this.getQRCodeDataURL(text)
        .then(dataURL => {
          fetch(dataURL)
            .then(res => res.blob())
            .then(blob => {
              const item = new ClipboardItem({ 'image/png': blob });
              navigator.clipboard.write([item])
                .then(() => resolve(true))
                .catch(error => reject(error));
            })
            .catch(error => reject(error));
        })
        .catch(error => reject(error));
    });
  },

  // Share QR code (Web Share API)
  async shareQRCode(text, title = 'QR Code') {
    if (!navigator.share) {
      throw new Error('Web Share API not supported');
    }

    try {
      const dataURL = await this.getQRCodeDataURL(text);
      const response = await fetch(dataURL);
      const blob = await response.blob();
      const file = new File([blob], 'qrcode.png', { type: 'image/png' });

      await navigator.share({
        title: title,
        text: `Scan this QR code: ${text}`,
        files: [file]
      });

      return true;
    } catch (error) {
      throw error;
    }
  },

  // Create QR code with logo in center
  generateQRCodeWithLogo(text, logoUrl, elementId = 'qrcode') {
    return new Promise((resolve, reject) => {
      this.generateQRCode(text, elementId)
        .then(canvas => {
          const ctx = canvas.getContext('2d');
          const logo = new Image();
          
          logo.onload = () => {
            // Calculate logo position and size (15% of QR code)
            const logoSize = canvas.width * 0.15;
            const x = (canvas.width - logoSize) / 2;
            const y = (canvas.height - logoSize) / 2;
            
            // Draw white background for logo
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - 2, y - 2, logoSize + 4, logoSize + 4);
            
            // Draw logo
            ctx.drawImage(logo, x, y, logoSize, logoSize);
            
            resolve(canvas);
          };
          
          logo.onerror = () => {
            // If logo fails to load, just return regular QR code
            resolve(canvas);
          };
          
          logo.crossOrigin = 'anonymous';
          logo.src = logoUrl;
        })
        .catch(error => reject(error));
    });
  }
};

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  QRHelper.init();
  
  // Add global QR helper functions to window
  window.QRHelper = QRHelper;
  
  // Override your existing QR functions with better ones
  if (typeof window.generateQRCode === 'undefined') {
    window.generateQRCode = function() {
      if (!window.currentURLData) {
        alert('No URL to generate QR code for');
        return;
      }
      
      const qrContainer = document.getElementById('qrContainer');
      const qrcodeElement = document.getElementById('qrcode');
      
      if (!qrContainer || !qrcodeElement) {
        alert('QR code elements not found');
        return;
      }
      
      QRHelper.generateQRCodeWithFallback(window.currentURLData.shortURL, 'qrcode')
        .then(result => {
          if (result.success) {
            qrContainer.style.display = 'block';
            qrContainer.scrollIntoView({ behavior: 'smooth' });
            
            // Update download button with correct filename
            const downloadBtn = qrContainer.querySelector('[onclick*="downloadQRCode"]');
            if (downloadBtn) {
              downloadBtn.setAttribute('data-filename', `qr-${window.currentURLData.key}.png`);
            }
          } else {
            alert('Failed to generate QR code');
          }
        });
    };
  }
  
  if (typeof window.downloadQRCode === 'undefined') {
    window.downloadQRCode = function() {
      const canvas = document.querySelector('#qrcode canvas');
      const downloadBtn = document.querySelector('[onclick*="downloadQRCode"]');
      const filename = downloadBtn ? downloadBtn.getAttribute('data-filename') || 'qrcode.png' : 'qrcode.png';
      
      if (!canvas) {
        // Try fallback image
        const img = document.querySelector('#qrcode img');
        if (img) {
          const link = document.createElement('a');
          link.download = filename;
          link.href = img.src;
          link.click();
          return;
        }
        
        alert('No QR code to download. Generate one first.');
        return;
      }
      
      QRHelper.downloadQRCode(canvas, filename)
        .then(() => {
          console.log('QR code downloaded successfully');
        })
        .catch(error => {
          console.error('Download failed:', error);
          alert('Failed to download QR code');
        });
    };
  }
  
  // Add enhanced QR code features
  if (typeof window.enhanceQRCodeFeatures === 'undefined') {
    window.enhanceQRCodeFeatures = function() {
      const qrContainer = document.getElementById('qrContainer');
      if (!qrContainer) return;
      
      // Add extra buttons if not already present
      if (!qrContainer.querySelector('.qr-extra-buttons')) {
        const extraButtons = document.createElement('div');
        extraButtons.className = 'qr-extra-buttons';
        extraButtons.style.marginTop = '15px';
        extraButtons.style.display = 'flex';
        extraButtons.style.gap = '10px';
        extraButtons.style.justifyContent = 'center';
        extraButtons.style.flexWrap = 'wrap';
        
        extraButtons.innerHTML = `
          <button class="action-btn" onclick="copyQRCodeToClipboard()" style="background: #2196F3;">
            <i class="fas fa-copy"></i> Copy QR
          </button>
          <button class="action-btn" onclick="shareQRCode()" style="background: #4CAF50;">
            <i class="fas fa-share-alt"></i> Share
          </button>
          <button class="action-btn" onclick="changeQRColor()" style="background: #9C27B0;">
            <i class="fas fa-palette"></i> Color
          </button>
        `;
        
        qrContainer.appendChild(extraButtons);
      }
    };
    
    window.copyQRCodeToClipboard = async function() {
      if (!window.currentURLData) {
        alert('No URL available');
        return;
      }
      
      try {
        await QRHelper.copyQRCodeToClipboard(window.currentURLData.shortURL);
        alert('QR code copied to clipboard!');
      } catch (error) {
        console.error('Copy failed:', error);
        alert('Failed to copy QR code to clipboard');
      }
    };
    
    window.shareQRCode = async function() {
      if (!window.currentURLData) {
        alert('No URL available');
        return;
      }
      
      try {
        await QRHelper.shareQRCode(window.currentURLData.shortURL, 'My Short URL');
      } catch (error) {
        console.error('Share failed:', error);
        alert('Sharing not supported or failed');
      }
    };
    
    window.changeQRColor = function() {
      const color = prompt('Enter QR code color (hex code, e.g., #6a11cb):', '#6a11cb');
      if (color && /^#[0-9A-F]{6}$/i.test(color)) {
        if (window.currentURLData) {
          QRHelper.generateQRCode(window.currentURLData.shortURL, 'qrcode', { colorDark: color })
            .then(() => {
              console.log('QR color updated');
            })
            .catch(error => {
              console.error('Color change failed:', error);
            });
        }
      } else if (color) {
        alert('Invalid color format. Use hex code like #FF0000');
      }
    };
  }
  
  // Enhance QR container when shown
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const qrContainer = document.getElementById('qrContainer');
        if (qrContainer && qrContainer.style.display === 'block') {
          setTimeout(() => {
            if (typeof window.enhanceQRCodeFeatures === 'function') {
              window.enhanceQRCodeFeatures();
            }
          }, 100);
        }
      }
    });
  });
  
  const qrContainer = document.getElementById('qrContainer');
  if (qrContainer) {
    observer.observe(qrContainer, { attributes: true });
  }
  
  console.log('QR Helper loaded successfully');
});

// Make QRHelper available globally
window.QRHelper = QRHelper;