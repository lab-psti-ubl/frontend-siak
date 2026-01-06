import { AbsensiGuru, Absensi, PengaturanAbsen, User } from '../types';

export type SSEEventType = 'absen-update' | 'absen-auto-save' | 'connection-status' | 'absen-murid-update' | 'absen-auto-alfa';

export interface SSEEventPayload {
  type: SSEEventType;
  data: any;
  timestamp: string;
}

type SSEListener = (event: SSEEventPayload) => void;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class SSEAbsenService {
  private listeners: Set<SSEListener> = new Set();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private autoSaveCheckInterval: NodeJS.Timer | null = null;
  private connectionCheckInterval: NodeJS.Timer | null = null;
  private autoSaveMuridCheckInterval: NodeJS.Timer | null = null;
  private workHoursCheckInterval: NodeJS.Timer | null = null;
  private isAfterWorkHours: boolean = false;
  private eventSource: EventSource | null = null;

  connect(): void {
    if (this.isConnected) return;

    // Connect to backend SSE endpoint
    this.connectToBackendSSE();

    // Keep old logic for backward compatibility (guru absensi)
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.emit('connection-status', { status: 'connected' });

    this.startWorkHoursCheck();
    this.startConnectionCheck();
  }

  private connectToBackendSSE(): void {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('[SSE] No auth token found, skipping backend SSE connection');
        return;
      }

      // Close existing connection if any
      if (this.eventSource) {
        this.eventSource.close();
      }

      // Connect to backend SSE endpoint with token as query parameter
      // EventSource doesn't support custom headers, so we use query param
      const sseUrl = `${API_BASE_URL}/sse/events?token=${encodeURIComponent(token)}`;
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        console.log('[SSE] Connected to backend SSE endpoint');
        this.reconnectAttempts = 0;
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          // Forward backend events to listeners
          this.emit(payload.type as SSEEventType, payload.data);
        } catch (error) {
          console.error('[SSE] Error parsing backend SSE event:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('[SSE] Backend SSE connection error:', error);
        this.eventSource?.close();
        this.eventSource = null;
        
        // Attempt reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            this.connectToBackendSSE();
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };
    } catch (error) {
      console.error('[SSE] Error connecting to backend SSE:', error);
    }
  }

  disconnect(): void {
    this.isConnected = false;
    this.stopAutoSaveCheck();
    this.stopAutoSaveMuridCheck();
    this.stopWorkHoursCheck();
    this.stopConnectionCheck();
    
    // Close backend SSE connection
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    this.emit('connection-status', { status: 'disconnected' });
  }

  private startWorkHoursCheck(): void {
    if (this.workHoursCheckInterval) clearInterval(this.workHoursCheckInterval);

    this.workHoursCheckInterval = setInterval(() => {
      this.updateWorkHoursStatus();
    }, 5000);
  }

  private stopWorkHoursCheck(): void {
    if (this.workHoursCheckInterval) {
      clearInterval(this.workHoursCheckInterval);
      this.workHoursCheckInterval = null;
    }
  }

  private updateWorkHoursStatus(): void {
    try {
      const pengaturanAbsenString = localStorage.getItem('pengaturanAbsen');
      if (!pengaturanAbsenString) return;

      const pengaturanAbsen = JSON.parse(pengaturanAbsenString)[0];
      const jamPulang = pengaturanAbsen?.jamPulang || '16:00';
      const currentTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

      const wasAfterWorkHours = this.isAfterWorkHours;
      this.isAfterWorkHours = currentTime > jamPulang;

      if (this.isAfterWorkHours && !wasAfterWorkHours) {
        this.startAutoSaveCheck();
        this.startAutoSaveMuridCheck();
      } else if (!this.isAfterWorkHours && wasAfterWorkHours) {
        this.stopAutoSaveCheck();
        this.stopAutoSaveMuridCheck();
      }
    } catch (error) {
      console.error('Error updating work hours status:', error);
    }
  }

  subscribe(listener: SSEListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(type: SSEEventType, data: any): void {
    const event: SSEEventPayload = {
      type,
      data,
      timestamp: new Date().toISOString(),
    };

    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in SSE listener:', error);
      }
    });
  }

  private startAutoSaveCheck(): void {
    if (this.autoSaveCheckInterval) clearInterval(this.autoSaveCheckInterval);

    this.autoSaveCheckInterval = setInterval(() => {
      this.checkAndAutoSaveAbsensi();
    }, 10000);
  }

  private stopAutoSaveCheck(): void {
    if (this.autoSaveCheckInterval) {
      clearInterval(this.autoSaveCheckInterval);
      this.autoSaveCheckInterval = null;
    }
  }

  private startAutoSaveMuridCheck(): void {
    if (this.autoSaveMuridCheckInterval) clearInterval(this.autoSaveMuridCheckInterval);

    this.autoSaveMuridCheckInterval = setInterval(() => {
      this.checkAndAutoSaveAbsensiMurid();
    }, 10000);
  }

  private stopAutoSaveMuridCheck(): void {
    if (this.autoSaveMuridCheckInterval) {
      clearInterval(this.autoSaveMuridCheckInterval);
      this.autoSaveMuridCheckInterval = null;
    }
  }

  private startConnectionCheck(): void {
    if (this.connectionCheckInterval) clearInterval(this.connectionCheckInterval);

    this.connectionCheckInterval = setInterval(() => {
      if (!this.isConnected) {
        this.attemptReconnect();
      }
    }, 10000);
  }

  private stopConnectionCheck(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  checkAndAutoSaveAbsensi(): void {
    if (!this.isConnected) return;

    const absensiGuruString = localStorage.getItem('absensiGuru');
    const pengaturanAbsenString = localStorage.getItem('pengaturanAbsen');
    const usersString = localStorage.getItem('users');
    const izinGuruString = localStorage.getItem('izinGuru');

    if (!absensiGuruString || !pengaturanAbsenString || !usersString) return;

    const absensiGuru: AbsensiGuru[] = JSON.parse(absensiGuruString);
    const pengaturanAbsen = JSON.parse(pengaturanAbsenString)[0];
    const users = JSON.parse(usersString);
    const izinGuru = izinGuruString ? JSON.parse(izinGuruString) : [];

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];

    const jamPulang = pengaturanAbsen?.jamPulang || '16:00';
    const toleransiPulang = pengaturanAbsen?.toleransiPulang || 15;
    const jamPulangLimit = this.addMinutes(jamPulang);
    const jamPulangBolosLimit = this.addMinutes(jamPulang, 180);

    const gurus = users.filter((u: any) => u.role === 'guru' && u.isActive !== false);

    const updatedAbsensi: AbsensiGuru[] = [];

    gurus.forEach((guru: any) => {
      const existingAbsensi = absensiGuru.find(
        a => a.guruId === guru.id && a.tanggal === today
      );

      const hasIzinDispen = izinGuru.some(
        i =>
          i.guruId === guru.id &&
          i.status === 'diterima' &&
          i.jenis === 'izin_dispen' &&
          i.tanggalMulai <= today &&
          i.tanggalSelesai >= today
      );

      const hasOtherIzin = izinGuru.some(
        i =>
          i.guruId === guru.id &&
          i.status === 'diterima' &&
          i.jenis !== 'izin_dispen' &&
          i.tanggalMulai <= today &&
          i.tanggalSelesai >= today
      );

      if (currentTime > jamPulangLimit && !hasOtherIzin && !hasIzinDispen) {
        if (!existingAbsensi) {
          const newAbsensi: AbsensiGuru = {
            id: `absensi-guru-auto-${Date.now()}-${guru.id}`,
            guruId: guru.id,
            tanggal: today,
            statusMasuk: 'tidak_masuk',
            statusKeluar: 'tidak_keluar',
            keterangan: 'Auto-saved: Guru tidak hadir (tidak melakukan absen sampai jam pulang)',
            createdAt: new Date().toISOString(),
          };

          const newAbsensiGuru = [...absensiGuru, newAbsensi];
          localStorage.setItem('absensiGuru', JSON.stringify(newAbsensiGuru));
          updatedAbsensi.push(newAbsensi);

          this.emit('absen-auto-save', {
            guruId: guru.id,
            guruName: guru.name,
            absensi: newAbsensi,
          });
        } else if (
          currentTime > jamPulangBolosLimit &&
          ['tepat_waktu', 'terlambat'].includes(existingAbsensi.statusMasuk) &&
          (existingAbsensi.statusKeluar === 'tidak_keluar' || !existingAbsensi.jamKeluar) &&
          existingAbsensi.statusKeluar !== 'alfa'
        ) {
          const updatedAbsensiGuru = absensiGuru.map(a =>
            a.id === existingAbsensi.id
              ? {
                  ...existingAbsensi,
                  statusKeluar: 'alfa',
                  keterangan: 'Bolos Kerja',
                  keteranganAbsensi: 'Bolos',
                }
              : a
          );

          localStorage.setItem('absensiGuru', JSON.stringify(updatedAbsensiGuru));
          const updatedRecord = updatedAbsensiGuru.find(a => a.id === existingAbsensi.id);

          if (updatedRecord) {
            updatedAbsensi.push(updatedRecord);
          }
        }
      }
    });

    if (updatedAbsensi.length > 0) {
      this.emit('absen-update', {
        updatedAbsensi,
        timestamp: new Date().toISOString(),
      });
    }
  }

  checkAndAutoSaveAbsensiMurid(): void {
    if (!this.isConnected) return;

    const absensiString = localStorage.getItem('absensi');
    const pengaturanAbsenString = localStorage.getItem('pengaturanAbsen');
    const usersString = localStorage.getItem('users');
    const tahunAjaranString = localStorage.getItem('tahunAjaran');

    if (!absensiString || !pengaturanAbsenString || !usersString) return;

    const absensi: Absensi[] = JSON.parse(absensiString);
    const pengaturanAbsen = JSON.parse(pengaturanAbsenString)[0];
    const users = JSON.parse(usersString);
    const tahunAjaran: any[] = tahunAjaranString ? JSON.parse(tahunAjaranString) : [];
    const activeTahunAjaran = tahunAjaran.find((ta: any) => ta.isActive);

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = now.toISOString().split('T')[0];

    const jamPulang = pengaturanAbsen?.jamPulang || '16:00';
    const jamPulangLimit = this.addMinutes(jamPulang, 0);

    const murids = users.filter((u: any) => u.role === 'murid' && u.isActive !== false);
    const updatedAbsensi: Absensi[] = [];
    let hasChanges = false;

    murids.forEach((murid: any) => {
      // Find today's absensi (one record per day in new structure)
      const todayAbsensi = absensi.find(
        a => a.muridId === murid.id && a.tanggal === today
      );

      // Check if already checked in/out using new structure
      const alreadyCheckedIn = todayAbsensi?.jamMasuk || todayAbsensi?.statusMasuk;
      const alreadyCheckedOut = todayAbsensi?.jamKeluar || todayAbsensi?.statusKeluar;

      // Backward compatibility: check old structure
      const oldMasuk = absensi.find(
        a => a.muridId === murid.id && a.tipeAbsen === 'masuk' && (a.tanggal === today || a.waktu?.startsWith(today))
      );
      const oldPulang = absensi.find(
        a => a.muridId === murid.id && a.tipeAbsen === 'pulang' && (a.tanggal === today || a.waktu?.startsWith(today))
      );

      const hasMasuk = alreadyCheckedIn || !!oldMasuk;
      const hasPulang = alreadyCheckedOut || !!oldPulang;

      if (currentTime > jamPulangLimit && !hasMasuk && !hasPulang) {
        const now = new Date().toISOString();
        const absensiId = `${today}-${murid.kelasId}-${murid.id}`;

        // Use new structure: one document per day
        const newAbsensi: Absensi = {
          id: absensiId,
          muridId: murid.id,
          tanggal: today,
          kelasId: murid.kelasId,
          jamMasuk: now,
          jamKeluar: now,
          statusMasuk: 'alfa',
          statusKeluar: 'alfa',
          method: 'auto-alfa',
          keterangan: 'Auto-saved: Murid tidak melakukan absen sampai jam pulang',
          tahunAjaranId: activeTahunAjaran?.id || '',
          semester: activeTahunAjaran?.semester || 1,
          // Legacy fields for backward compatibility
          tipeAbsen: 'masuk',
          status: 'alfa',
          waktu: now,
          statusAbsen: 'alfa',
        };

        absensi.push(newAbsensi);
        updatedAbsensi.push(newAbsensi);
        hasChanges = true;

        this.emit('absen-auto-save', {
          muridId: murid.id,
          muridName: murid.name,
          absensi: [newAbsensi],
        });
      }
    });

    if (hasChanges) {
      localStorage.setItem('absensi', JSON.stringify(absensi));
      this.emit('absen-murid-update', {
        updatedAbsensi,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const sseAbsenService = new SSEAbsenService();
