import { QRCodeSVG } from 'qrcode.react';
import { User, Kelas, Jurusan } from '../types';
import { normalizeTeacherQRCode } from './qrCodeGenerator';
import { DEFAULT_PROFILE_ICON } from './profilePlaceholder';

export interface KartuPegawaiOptions {
  guru: User;
  kelas?: Kelas;
  jurusan?: Jurusan;
}

export function generateGuruKartuPegawai(
  guru: User, 
  kelas?: Kelas, 
  jurusan?: Jurusan,
  backgroundDepan?: string,
  backgroundBelakang?: string,
  orientation: 'potrait' | 'landscape' = 'potrait'
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Determine which background to use based on orientation
      const frontBackground = orientation === 'potrait' ? backgroundDepan : backgroundBelakang;
      const backBackground = orientation === 'potrait' ? backgroundDepan : backgroundBelakang;
      
      // Create both front and back cards
      Promise.all([
        generateKartuPegawaiCard(guru, 'front', frontBackground, kelas, jurusan, orientation),
        generateKartuPegawaiCard(guru, 'back', backBackground, kelas, jurusan, orientation)
      ]).then(([frontBlob, backBlob]) => {
        // Create ZIP file
        createZipFile(guru, frontBlob, backBlob).then(() => {
          resolve();
        }).catch(reject);
      }).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

function generateKartuPegawaiCard(
  guru: User, 
  side: 'front' | 'back',
  backgroundImage?: string,
  kelas?: Kelas, 
  jurusan?: Jurusan,
  orientation: 'potrait' | 'landscape' = 'potrait'
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas with correct dimensions
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Convert cm to pixels at 300 DPI for high quality print
      const dpi = 300;
      const cmToPx = (cm: number) => (cm / 2.54) * dpi;

      let width: number, height: number;
      
      if (side === 'front') {
        if (orientation === 'potrait') {
          // Portrait: 5.4cm x 8.5cm
          width = cmToPx(5.4);
          height = cmToPx(8.5);
        } else {
          // Landscape: 8.5cm x 5.4cm
          width = cmToPx(8.5);
          height = cmToPx(5.4);
        }
      } else {
        // Back always matches orientation
        if (orientation === 'potrait') {
          // Portrait: 5.4cm x 8.5cm
          width = cmToPx(5.4);
          height = cmToPx(8.5);
        } else {
          // Landscape: 8.5cm x 5.4cm
          width = cmToPx(8.5);
          height = cmToPx(5.4);
        }
      }
      
      canvas.width = width;
      canvas.height = height;

      if (side === 'front') {
        if (orientation === 'potrait') {
          generateKartuPegawaiFrontCanvas(ctx, guru, width, height, backgroundImage, kelas, jurusan).then(() => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to generate front card blob'));
              }
            }, 'image/jpeg', 0.95);
          }).catch(reject);
        } else {
          // Use landscape layout (currently back layout) for front
          generateKartuPegawaiBackCanvas(ctx, guru, width, height, backgroundImage, kelas, jurusan).then(() => {
            canvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to generate front card blob'));
              }
            }, 'image/jpeg', 0.95);
          }).catch(reject);
        }
      } else {
        // Back side shows rules and regulations
        generateKartuPegawaiBackTataTertibCanvas(ctx, width, height, backgroundImage, orientation).then(() => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate back card blob'));
            }
          }, 'image/jpeg', 0.95);
        }).catch(reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

function generateKartuPegawaiFrontCanvas(
  ctx: CanvasRenderingContext2D, 
  guru: User, 
  width: number, 
  height: number,
  backgroundImage?: string,
  kelas?: Kelas, 
  jurusan?: Jurusan
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Load background image if provided
    const loadBackground = (): Promise<void> => {
      return new Promise((resolveBg, rejectBg) => {
        if (backgroundImage) {
          const bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          bgImg.onload = () => {
            ctx.drawImage(bgImg, 0, 0, width, height);
            resolveBg();
          };
          bgImg.onerror = () => {
            // Fallback to gradient if image fails
            createGradientBackground();
            resolveBg();
          };
          bgImg.src = backgroundImage;
        } else {
          createGradientBackground();
          resolveBg();
        }
      });
    };

    const createGradientBackground = () => {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#059669'); // Emerald-600
      gradient.addColorStop(0.3, '#10B981'); // Emerald-500
      gradient.addColorStop(0.7, '#34D399'); // Emerald-400
      gradient.addColorStop(1, '#6EE7B7'); // Emerald-300
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    loadBackground().then(() => {
      // Add decorative pattern overlay (dots)
      ctx.globalAlpha = 0.1;
      const dotSize = Math.max(1, width / 320);
      const dotSpacing = 20;
      const cols = Math.ceil(width / dotSpacing);
      const rows = Math.ceil(height / dotSpacing);
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = (i * width) / cols;
          const y = (j * height) / rows;
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Padding for content
      const padding = width * 0.06; // ~1rem equivalent

      // Generate and add QR code
      const qrSize = Math.min(width * 0.4, height * 0.25); // Proportional to preview
      const qrValue = normalizeTeacherQRCode(guru.qrCode, guru.nip) || generateGuruQRData(guru);
      generateQRCodeImage(qrValue, qrSize).then((qrDataUrl) => {
        const qrImg = new Image();
        qrImg.onload = () => {
          // QR Code positioning - centered
          const qrX = (width - qrSize) / 2;
          const qrY = padding + (height * 0.15);
          
          // White background for QR code with padding
          const qrPadding = width * 0.015;
          ctx.fillStyle = 'white';
          ctx.fillRect(qrX - qrPadding, qrY - qrPadding, qrSize + (qrPadding * 2), qrSize + (qrPadding * 2));
          
          // Draw QR code
          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          // Teacher name - below QR code
          ctx.fillStyle = 'white';
          ctx.font = `bold ${width * 0.08}px Arial, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          const nameY = qrY + qrSize + (qrPadding * 2) + (height * 0.05);
          ctx.fillText(guru.name || '', width / 2, nameY);

          // Teacher details section - grid layout like preview
          const detailsStartY = nameY + (height * 0.08);
          const lineHeight = height * 0.04;
          const labelWidth = width * 0.25;
          const colonWidth = width * 0.05;
          
          ctx.font = `${width * 0.035}px Arial, sans-serif`;
          ctx.fillStyle = 'white';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          // NIP
          ctx.font = `bold ${width * 0.035}px Arial, sans-serif`;
          ctx.fillText('NIP', padding, detailsStartY);
          ctx.font = `${width * 0.035}px Arial, sans-serif`;
          ctx.fillText(':', padding + labelWidth, detailsStartY);
          ctx.fillText(guru.nip || '-', padding + labelWidth + colonWidth, detailsStartY);

          // Jabatan
          const jabatanY = detailsStartY + lineHeight;
          ctx.font = `bold ${width * 0.035}px Arial, sans-serif`;
          ctx.fillText('Jabatan', padding, jabatanY);
          ctx.font = `${width * 0.035}px Arial, sans-serif`;
          ctx.fillText(':', padding + labelWidth, jabatanY);
          const jabatanText = `${guru.subject || 'Staff'}${guru.isWaliKelas ? ' / Wali Kelas' : ''}`;
          ctx.fillText(jabatanText, padding + labelWidth + colonWidth, jabatanY);

          // Bergabung
          const bergabungY = jabatanY + lineHeight;
          ctx.font = `bold ${width * 0.035}px Arial, sans-serif`;
          ctx.fillText('Bergabung', padding, bergabungY);
          ctx.font = `${width * 0.035}px Arial, sans-serif`;
          ctx.fillText(':', padding + labelWidth, bergabungY);
          const tahunBergabung = new Date(guru.createdAt || '').getFullYear();
          ctx.fillText(tahunBergabung.toString(), padding + labelWidth + colonWidth, bergabungY);

          resolve();
        };
        
        qrImg.onerror = () => {
          reject(new Error('Failed to load QR code image'));
        };
        
        qrImg.src = qrDataUrl;
      }).catch(reject);
    }).catch(reject);
  });
}

function generateKartuPegawaiBackCanvas(
  ctx: CanvasRenderingContext2D, 
  guru: User, 
  width: number, 
  height: number,
  backgroundImage?: string,
  kelas?: Kelas, 
  jurusan?: Jurusan
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Load background image if provided
    const loadBackground = (): Promise<void> => {
      return new Promise((resolveBg, rejectBg) => {
        if (backgroundImage) {
          const bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          bgImg.onload = () => {
            ctx.drawImage(bgImg, 0, 0, width, height);
            resolveBg();
          };
          bgImg.onerror = () => {
            // Fallback to gradient if image fails
            createGradientBackground();
            resolveBg();
          };
          bgImg.src = backgroundImage;
        } else {
          createGradientBackground();
          resolveBg();
        }
      });
    };

    const createGradientBackground = () => {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#0D9488'); // Teal-600
      gradient.addColorStop(0.3, '#14B8A6'); // Teal-500
      gradient.addColorStop(0.7, '#5EEAD4'); // Teal-300
      gradient.addColorStop(1, '#99F6E4'); // Teal-200
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    loadBackground().then(() => {
      // Add decorative pattern overlay (dots)
      ctx.globalAlpha = 0.1;
      const dotSize = Math.max(1, width / 320);
      const dotSpacing = 20;
      const cols = Math.ceil(width / dotSpacing);
      const rows = Math.ceil(height / dotSpacing);
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = (i * width) / cols;
          const y = (j * height) / rows;
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Padding for content
      const padding = width * 0.04;

      // Load profile image
      const loadProfileImage = (): Promise<void> => {
        return new Promise((resolveProfile, rejectProfile) => {
          const profileImg = new Image();
          profileImg.crossOrigin = 'anonymous';
          profileImg.onload = () => {
            // Profile photo size - proportional to preview
            const photoSize = Math.min(width * 0.25, height * 0.8);
            const photoX = padding;
            const photoY = (height - photoSize) / 2;
            
            // White background for photo with padding
            const photoPadding = width * 0.01;
            ctx.fillStyle = 'white';
            ctx.fillRect(photoX - photoPadding, photoY - photoPadding, photoSize + (photoPadding * 2), photoSize + (photoPadding * 2));
            
            // Draw rounded rectangle for photo
            const radius = width * 0.01;
            ctx.save();
            ctx.beginPath();
            // Draw rounded rectangle path
            ctx.moveTo(photoX + radius, photoY);
            ctx.lineTo(photoX + photoSize - radius, photoY);
            ctx.quadraticCurveTo(photoX + photoSize, photoY, photoX + photoSize, photoY + radius);
            ctx.lineTo(photoX + photoSize, photoY + photoSize - radius);
            ctx.quadraticCurveTo(photoX + photoSize, photoY + photoSize, photoX + photoSize - radius, photoY + photoSize);
            ctx.lineTo(photoX + radius, photoY + photoSize);
            ctx.quadraticCurveTo(photoX, photoY + photoSize, photoX, photoY + photoSize - radius);
            ctx.lineTo(photoX, photoY + radius);
            ctx.quadraticCurveTo(photoX, photoY, photoX + radius, photoY);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(profileImg, photoX, photoY, photoSize, photoSize);
            ctx.restore();

            // Teacher details on the right
            const detailsX = photoX + photoSize + (photoPadding * 2) + (padding * 0.75);
            const detailsY = (height - (height * 0.3)) / 2;
            const lineHeight = height * 0.08;
            const labelWidth = width * 0.2;

            ctx.font = `${width * 0.04}px Arial, sans-serif`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            // Nama
            ctx.font = `bold ${width * 0.04}px Arial, sans-serif`;
            ctx.fillText('Nama', detailsX, detailsY);
            ctx.font = `${width * 0.04}px Arial, sans-serif`;
            ctx.fillText(': ' + (guru.name || '-'), detailsX + labelWidth, detailsY);

            // NIP
            const nipY = detailsY + lineHeight;
            ctx.font = `bold ${width * 0.04}px Arial, sans-serif`;
            ctx.fillText('NIP', detailsX, nipY);
            ctx.font = `${width * 0.04}px Arial, sans-serif`;
            ctx.fillText(': ' + (guru.nip || '-'), detailsX + labelWidth, nipY);

            // Jabatan
            const jabatanY = nipY + lineHeight;
            ctx.font = `bold ${width * 0.04}px Arial, sans-serif`;
            ctx.fillText('Jabatan', detailsX, jabatanY);
            ctx.font = `${width * 0.04}px Arial, sans-serif`;
            const jabatanText = `${guru.subject || 'Staff'}${guru.isWaliKelas ? ' / Wali Kelas' : ''}`;
            ctx.fillText(': ' + jabatanText, detailsX + labelWidth, jabatanY);

            // Telp
            const telpY = jabatanY + lineHeight;
            ctx.font = `bold ${width * 0.04}px Arial, sans-serif`;
            ctx.fillText('telp.', detailsX, telpY);
            ctx.font = `${width * 0.04}px Arial, sans-serif`;
            ctx.fillText(': ' + (guru.phone || '-'), detailsX + labelWidth, telpY);

            resolveProfile();
          };
          profileImg.onerror = () => {
            // If profile image fails, still draw the details
            const detailsX = padding + (width * 0.3);
            const detailsY = (height - (height * 0.3)) / 2;
            const lineHeight = height * 0.08;
            const labelWidth = width * 0.2;

            ctx.font = `${width * 0.04}px Arial, sans-serif`;
            ctx.fillStyle = 'white';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';

            ctx.font = `bold ${width * 0.04}px Arial, sans-serif`;
            ctx.fillText('Nama', detailsX, detailsY);
            ctx.font = `${width * 0.04}px Arial, sans-serif`;
            ctx.fillText(': ' + (guru.name || '-'), detailsX + labelWidth, detailsY);

            const nipY = detailsY + lineHeight;
            ctx.font = `bold ${width * 0.04}px Arial, sans-serif`;
            ctx.fillText('NIP', detailsX, nipY);
            ctx.font = `${width * 0.04}px Arial, sans-serif`;
            ctx.fillText(': ' + (guru.nip || '-'), detailsX + labelWidth, nipY);

            const jabatanY = nipY + lineHeight;
            ctx.font = `bold ${width * 0.04}px Arial, sans-serif`;
            ctx.fillText('Jabatan', detailsX, jabatanY);
            ctx.font = `${width * 0.04}px Arial, sans-serif`;
            const jabatanText = `${guru.subject || 'Staff'}${guru.isWaliKelas ? ' / Wali Kelas' : ''}`;
            ctx.fillText(': ' + jabatanText, detailsX + labelWidth, jabatanY);

            const telpY = jabatanY + lineHeight;
            ctx.font = `bold ${width * 0.04}px Arial, sans-serif`;
            ctx.fillText('telp.', detailsX, telpY);
            ctx.font = `${width * 0.04}px Arial, sans-serif`;
            ctx.fillText(': ' + (guru.phone || '-'), detailsX + labelWidth, telpY);

            resolveProfile();
          };
          profileImg.src = guru.profileImage || DEFAULT_PROFILE_ICON;
        });
      };

      loadProfileImage().then(() => {
        resolve();
      }).catch(reject);
    }).catch(reject);
  });
}

function generateKartuPegawaiBackTataTertibCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  backgroundImage: string | undefined,
  orientation: 'potrait' | 'landscape' = 'potrait'
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Load background image if provided
    const loadBackground = (): Promise<void> => {
      return new Promise((resolveBg, rejectBg) => {
        if (backgroundImage) {
          const bgImg = new Image();
          bgImg.crossOrigin = 'anonymous';
          bgImg.onload = () => {
            ctx.drawImage(bgImg, 0, 0, width, height);
            resolveBg();
          };
          bgImg.onerror = () => {
            // Fallback to gradient if image fails
            createGradientBackground();
            resolveBg();
          };
          bgImg.src = backgroundImage;
        } else {
          createGradientBackground();
          resolveBg();
        }
      });
    };

    const createGradientBackground = () => {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#0D9488'); // Teal-600
      gradient.addColorStop(0.3, '#14B8A6'); // Teal-500
      gradient.addColorStop(0.7, '#5EEAD4'); // Teal-300
      gradient.addColorStop(1, '#99F6E4'); // Teal-200
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    };

    loadBackground().then(() => {
      // Add decorative pattern overlay (dots)
      ctx.globalAlpha = 0.1;
      const dotSize = Math.max(1, width / 320);
      const dotSpacing = 20;
      const cols = Math.ceil(width / dotSpacing);
      const rows = Math.ceil(height / dotSpacing);
      
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = (i * width) / cols;
          const y = (j * height) / rows;
          ctx.fillStyle = 'white';
          ctx.beginPath();
          if (orientation === 'potrait') {
            ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          } else {
            ctx.fillRect(x, y, dotSize, dotSize);
          }
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Padding for content
      const padding = width * 0.06;

      // Title
      ctx.fillStyle = 'white';
      ctx.font = `bold ${width * 0.045}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const titleY = padding + (height * 0.08);
      
      // Wrap title if needed
      const titleLines = wrapText(ctx, 'TATA TERTIB & KETENTUAN PENGGUNAAN KARTU', width - (padding * 2));
      titleLines.forEach((line, index) => {
        ctx.fillText(line, width / 2, titleY + (index * (width * 0.04)));
      });

      // Rules content
      const contentStartY = titleY + (titleLines.length * (width * 0.04)) + (height * 0.08);
      const lineHeight = height * 0.055;
      ctx.font = `${width * 0.032}px Arial, sans-serif`;
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      let currentY = contentStartY;

      // Rule 1 - Changed from "siswa" to "pegawai"
      const rule1 = 'Kartu ini adalah milik resmi sekolah dan hanya berlaku untuk pegawai aktif.';
      const rule1Lines = wrapText(ctx, '1. ' + rule1, width - (padding * 2));
      rule1Lines.forEach((line) => {
        ctx.fillText(line, padding, currentY);
        currentY += lineHeight * 0.85;
      });
      currentY += lineHeight * 0.3;

      // Rule 2 - Changed from "Siswa" to "Pegawai"
      const rule2 = 'Pegawai wajib membawa kartu ini setiap hari selama berada di lingkungan sekolah';
      const rule2Lines = wrapText(ctx, '2. ' + rule2, width - (padding * 2));
      rule2Lines.forEach((line) => {
        ctx.fillText(line, padding, currentY);
        currentY += lineHeight * 0.85;
      });
      currentY += lineHeight * 0.3;

      // Rule 3
      const rule3 = 'Kartu ini terintegrasi dengan sistem manajemen sekolah (iSchola)';
      const rule3Lines = wrapText(ctx, '3. ' + rule3, width - (padding * 2));
      rule3Lines.forEach((line) => {
        ctx.fillText(line, padding, currentY);
        currentY += lineHeight * 0.85;
      });
      currentY += lineHeight * 0.3;

      // Rule 4 - Changed from "siswa" to "pegawai"
      const rule4 = 'Apabila kartu ini hilang atau rusak, pegawai wajib segera melapor ke bagian Tata Usaha (TU)';
      const rule4Lines = wrapText(ctx, '4. ' + rule4, width - (padding * 2));
      rule4Lines.forEach((line) => {
        ctx.fillText(line, padding, currentY);
        currentY += lineHeight * 0.85;
      });

      resolve();
    }).catch(reject);
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

function generateGuruQRData(guru: User): string {
  // Only return NIP as simple string
  return guru.nip || '';
}

function generateQRCodeImage(qrValue: string, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create a temporary div to render QR code
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      document.body.appendChild(tempDiv);

      // Import React and ReactDOM dynamically
      import('react-dom/client').then(({ createRoot }) => {
        import('react').then((React) => {
          const root = createRoot(tempDiv);
          
          // Render QR code
          root.render(
            React.createElement(QRCodeSVG, {
              value: qrValue,
              size: size,
              level: 'M',
              includeMargin: false,
              style: { width: '100%', height: '100%' }
            })
          );

          // Wait for render and convert to image
          setTimeout(() => {
            const svgElement = tempDiv.querySelector('svg');
            if (svgElement) {
              const svgData = new XMLSerializer().serializeToString(svgElement);
              const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
              const url = URL.createObjectURL(svgBlob);

              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = size;
                canvas.height = size;
                
                if (ctx) {
                  ctx.fillStyle = 'white';
                  ctx.fillRect(0, 0, size, size);
                  ctx.drawImage(img, 0, 0, size, size);
                  
                  const dataUrl = canvas.toDataURL('image/png');
                  
                  // Cleanup
                  document.body.removeChild(tempDiv);
                  URL.revokeObjectURL(url);
                  resolve(dataUrl);
                } else {
                  document.body.removeChild(tempDiv);
                  URL.revokeObjectURL(url);
                  reject(new Error('Could not get canvas context for QR code'));
                }
              };

              img.onerror = () => {
                document.body.removeChild(tempDiv);
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load QR code SVG'));
              };

              img.src = url;
            } else {
              document.body.removeChild(tempDiv);
              reject(new Error('Failed to generate QR code SVG'));
            }
          }, 200);
        }).catch(reject);
      }).catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

async function createZipFile(guru: User, frontBlob: Blob, backBlob: Blob): Promise<void> {
  // Import JSZip dynamically
  const JSZip = (await import('jszip')).default;
  
  const zip = new JSZip();
  
  // Add files to zip
  const guruName = guru.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
  zip.file(`Kartu-Pegawai-${guruName}-Depan.jpg`, frontBlob);
  zip.file(`Kartu-Pegawai-${guruName}-Belakang.jpg`, backBlob);
  
  // Generate zip file
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  
  // Download zip file
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Kartu-Pegawai-${guruName}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function generateAllGuruKartuPegawai(
  gurus: User[],
  kelasMap: Map<string, Kelas>,
  backgroundDepan?: string,
  backgroundBelakang?: string,
  orientation: 'potrait' | 'landscape' = 'potrait',
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  // Import JSZip dynamically
  const JSZip = (await import('jszip')).default;
  
  const zip = new JSZip();
  
  // Determine which background to use based on orientation
  const frontBackground = orientation === 'potrait' ? backgroundDepan : backgroundBelakang;
  const backBackground = orientation === 'potrait' ? backgroundDepan : backgroundBelakang;
  
  // Process each guru
  for (let i = 0; i < gurus.length; i++) {
    const guru = gurus[i];
    
    try {
      // Get kelas for this guru
      const guruKelas = guru.kelasWali ? kelasMap.get(guru.kelasWali) : undefined;
      
      // Generate front and back cards
      const [frontBlob, backBlob] = await Promise.all([
        generateKartuPegawaiCard(guru, 'front', frontBackground, guruKelas, undefined, orientation),
        generateKartuPegawaiCard(guru, 'back', backBackground, guruKelas, undefined, orientation)
      ]);
      
      // Create folder for this guru
      const guruName = guru.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
      const guruFolder = zip.folder(`Kartu-Pegawai-${guruName}`);
      
      if (guruFolder) {
        // Add files to folder
        guruFolder.file(`Kartu-Pegawai-${guruName}-Depan.jpg`, frontBlob);
        guruFolder.file(`Kartu-Pegawai-${guruName}-Belakang.jpg`, backBlob);
      }
      
      // Report progress
      if (onProgress) {
        onProgress(i + 1, gurus.length);
      }
    } catch (error) {
      console.error(`Error generating KTA for guru ${guru.name}:`, error);
      // Continue with next guru even if one fails
    }
  }
  
  // Generate zip file
  const zipBlob = await zip.generateAsync({ 
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  
  // Download zip file
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Kartu-Pegawai-Semua-Guru.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateKartuPegawaiPreview(guru: User, kelas?: Kelas, jurusan?: Jurusan): {
  frontPreview: React.ReactElement;
  backPreview: React.ReactElement;
} {
  const frontPreview = React.createElement('div', {
    className: 'w-80 h-[500px] rounded-2xl p-6 text-white relative overflow-hidden shadow-xl',
    style: {
      background: 'linear-gradient(135deg, #059669 0%, #10B981 30%, #34D399 70%, #6EE7B7 100%)'
    }
  }, [
    // Header section
    React.createElement('div', {
      key: 'header',
      className: 'absolute top-0 left-0 right-0 bg-white bg-opacity-95 p-4 text-center'
    }, [
      React.createElement('div', {
        key: 'logo',
        className: 'w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2'
      }, React.createElement('span', {
        className: 'text-white font-bold text-lg'
      }, 'SMA')),
      React.createElement('h3', {
        key: 'school-name',
        className: 'text-emerald-600 font-bold text-lg'
      }, 'SMA NEGERI 1 JAKARTA'),
      React.createElement('p', {
        key: 'address',
        className: 'text-gray-600 text-xs'
      }, 'Jl. Pendidikan No. 123, Jakarta Pusat 10110')
    ]),
    
    // Title
    React.createElement('div', {
      key: 'title',
      className: 'absolute top-20 left-0 right-0 bg-white p-2 text-center'
    }, React.createElement('h2', {
      className: 'text-emerald-600 font-bold text-xl'
    }, 'KARTU PEGAWAI')),

    // QR Code
    React.createElement('div', {
      key: 'qr',
      className: 'flex justify-center mt-32 mb-6'
    }, React.createElement('div', {
      className: 'bg-white p-4 rounded-lg'
    }, React.createElement(QRCodeSVG, {
      value: normalizeTeacherQRCode(guru.qrCode, guru.nip) || generateGuruQRData(guru),
      size: 140,
      level: 'M',
      includeMargin: false
    }))),

    // Teacher info
    React.createElement('div', {
      key: 'info',
      className: 'text-center mb-4'
    }, [
      React.createElement('h3', {
        key: 'name',
        className: 'text-2xl font-bold mb-2'
      }, guru.name),
      React.createElement('div', {
        key: 'details',
        className: 'space-y-1 text-sm'
      }, [
        React.createElement('p', { key: 'nip' }, `NIP: ${guru.nip || '-'}`),
        React.createElement('p', { key: 'jabatan' }, `Jabatan: Guru${guru.isWaliKelas ? ' / Wali Kelas' : ''}`),
        guru.isWaliKelas && kelas ? 
          React.createElement('p', { key: 'wali-kelas' }, `Wali Kelas: ${kelas.name}`) :
          React.createElement('p', { key: 'mapel' }, `Mata Pelajaran: ${guru.subject || 'Umum'}`)
      ])
    ])
  ]);

  const backPreview = React.createElement('div', {
    className: 'w-80 h-[500px] rounded-2xl p-6 text-white relative overflow-hidden shadow-xl',
    style: {
      background: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 30%, #5EEAD4 70%, #99F6E4 100%)'
    }
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      className: 'text-center mb-6 bg-white bg-opacity-95 p-4 rounded-lg'
    }, [
      React.createElement('div', {
        key: 'logo',
        className: 'w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-2'
      }, React.createElement('span', {
        className: 'text-white font-bold'
      }, 'SMA')),
      React.createElement('h3', {
        key: 'title',
        className: 'text-teal-600 font-bold text-lg'
      }, 'KODE ETIK GURU')
    ]),

    // Rules
    React.createElement('div', {
      key: 'rules',
      className: 'space-y-2 text-sm mb-6'
    }, [
      '1. Melaksanakan tugas dengan penuh tanggung jawab',
      '2. Hadir tepat waktu sesuai jadwal mengajar',
      '3. Menjaga profesionalisme dalam mengajar',
      '4. Menghormati sesama guru dan murid',
      '5. Menjaga kerahasiaan data sekolah',
      '6. Berpakaian rapi dan sopan',
      '7. Menggunakan kartu pegawai setiap hari',
      '8. Menjaga nama baik sekolah'
    ].map((rule, index) => 
      React.createElement('p', { key: index, className: 'text-xs' }, rule)
    )),

    // Contact info
    React.createElement('div', {
      key: 'contact',
      className: 'absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 p-4 text-center'
    }, [
      React.createElement('h4', {
        key: 'contact-title',
        className: 'text-teal-600 font-bold text-sm mb-2'
      }, 'KONTAK SEKOLAH'),
      React.createElement('div', {
        key: 'contact-details',
        className: 'text-gray-600 text-xs space-y-1'
      }, [
        React.createElement('p', { key: 'phone' }, 'Telp: (021) 123-4567'),
        React.createElement('p', { key: 'email' }, 'Email: info@sman1jakarta.sch.id'),
        React.createElement('p', { key: 'emergency', className: 'text-red-600 font-bold' }, 'DARURAT: 112')
      ])
    ])
  ]);

  return { frontPreview, backPreview };
}
