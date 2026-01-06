import { AbsensiGuru, Absensi, PengaturanAbsen, User, TahunAjaran } from '../types';
import { getActiveTahunAjaran } from '../utils/tahunAjaranUtils';

class GlobalAbsenService {
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timer | null = null;
  private lastProcessedDate: string = '';
  private processedGuruToday: Set<string> = new Set();
  private processedMuridToday: Set<string> = new Set();
  private lastCheckTime: number = 0;
  private minCheckInterval: number = 30000;
  private isAfterWorkHours: boolean = false;

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastProcessedDate = new Date().toISOString().split('T')[0];
    this.processedGuruToday.clear();
    this.processedMuridToday.clear();

    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => {
      this.updateWorkHoursStatus();
      if (this.isAfterWorkHours) {
        this.checkAndProcessAutoAlfa();
      }
    }, 5000);
  }

  stop(): void {
    this.isRunning = false;
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private updateWorkHoursStatus(): void {
    try {
      const pengaturanAbsenString = localStorage.getItem('pengaturanAbsen');
      if (!pengaturanAbsenString) return;

      const pengaturanAbsen = JSON.parse(pengaturanAbsenString)[0];
      const jamPulang = pengaturanAbsen?.jamPulang || '16:00';
      const currentTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;

      this.isAfterWorkHours = currentTime > jamPulang;
    } catch (error) {
      console.error('Error updating work hours status:', error);
    }
  }

  private checkAndProcessAutoAlfa(): void {
    try {
      const now = Date.now();
      if (now - this.lastCheckTime < this.minCheckInterval) {
        return;
      }
      this.lastCheckTime = now;

      const today = new Date().toISOString().split('T')[0];

      if (this.lastProcessedDate !== today) {
        this.lastProcessedDate = today;
        this.processedGuruToday.clear();
        this.processedMuridToday.clear();
      }

      const absensiString = localStorage.getItem('absensi');
      const pengaturanAbsenString = localStorage.getItem('pengaturanAbsen');
      const usersString = localStorage.getItem('users');
      const tahunAjaranString = localStorage.getItem('tahunAjaran');

      if (!absensiString || !pengaturanAbsenString || !usersString || !tahunAjaranString) return;

      const absensi: Absensi[] = JSON.parse(absensiString);
      const pengaturanAbsen = JSON.parse(pengaturanAbsenString)[0];
      const users = JSON.parse(usersString);
      const tahunAjaran: TahunAjaran[] = JSON.parse(tahunAjaranString);
      const activeTahunAjaran = getActiveTahunAjaran(tahunAjaran);

      if (!activeTahunAjaran) return;

      const currentTime = `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
      const jamPulang = pengaturanAbsen?.jamPulang || '16:00';
      const jamPulangLimit = this.addMinutes(jamPulang, 0);
      const jamPulangBolosLimit = this.addMinutes(jamPulang, 180);

      const murids = users.filter((u: any) => u.role === 'murid' && u.isActive !== false);
      let hasMuridChanges = false;

      murids.forEach((murid: any) => {
        if (this.processedMuridToday.has(murid.id)) return;

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
            tahunAjaranId: activeTahunAjaran.id,
            semester: activeTahunAjaran.semester,
            keterangan: 'Tidak Melakukan Absen',
            // Legacy fields for backward compatibility
            tipeAbsen: 'masuk',
            status: 'alfa',
            waktu: now,
            statusAbsen: 'alfa',
          };

          absensi.push(newAbsensi);
          this.processedMuridToday.add(murid.id);
          hasMuridChanges = true;
        }
      });

      if (hasMuridChanges) {
        localStorage.setItem('absensi', JSON.stringify(absensi));
        window.dispatchEvent(new CustomEvent('absensi-auto-alfa-processed', {
          detail: { timestamp: new Date().toISOString() }
        }));
      }

      this.processAutoAlfaGuru(pengaturanAbsen, users, today, currentTime, activeTahunAjaran);
    } catch (error) {
      console.error('Error in global absen service:', error);
    }
  }

  private processAutoAlfaGuru(pengaturanAbsen: PengaturanAbsen, users: User[], today: string, currentTime: string, activeTahunAjaran: TahunAjaran): void {
    try {
      const absensiGuruString = localStorage.getItem('absensiGuru');
      const izinGuruString = localStorage.getItem('izinGuru');

      if (!absensiGuruString) return;

      const absensiGuru: AbsensiGuru[] = JSON.parse(absensiGuruString);
      const izinGuru = izinGuruString ? JSON.parse(izinGuruString) : [];

      const jamPulang = pengaturanAbsen?.jamPulang || '16:00';
      const jamPulangLimit = this.addMinutes(jamPulang, 0);
      const jamPulangBolosLimit = this.addMinutes(jamPulang, 180);

      const gurus = users.filter((u: any) => u.role === 'guru' && u.isActive !== false);
      let hasChanges = false;

      gurus.forEach((guru: any) => {
        if (this.processedGuruToday.has(guru.id)) return;

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
              keterangan: 'Tidak Melakukan Absen',
              tahunAjaranId: activeTahunAjaran.id,
              semester: activeTahunAjaran.semester,
              createdAt: new Date().toISOString(),
            };

            absensiGuru.push(newAbsensi);
            this.processedGuruToday.add(guru.id);
            hasChanges = true;
          } else if (
            currentTime > jamPulangBolosLimit &&
            ['tepat_waktu', 'terlambat'].includes(existingAbsensi.statusMasuk) &&
            (existingAbsensi.statusKeluar === 'tidak_keluar' || !existingAbsensi.jamKeluar) &&
            existingAbsensi.statusKeluar !== 'alfa'
          ) {
            const updatedAbsensi: AbsensiGuru = {
              ...existingAbsensi,
              statusKeluar: 'alfa',
              keterangan: 'Bolos Kerja',
              keteranganAbsensi: 'Bolos',
            };

            const index = absensiGuru.findIndex(a => a.id === existingAbsensi.id);
            if (index !== -1) {
              absensiGuru[index] = updatedAbsensi;
              hasChanges = true;
            }
          }
        }
      });

      if (hasChanges) {
        localStorage.setItem('absensiGuru', JSON.stringify(absensiGuru));
        window.dispatchEvent(new CustomEvent('absensi-guru-auto-alfa-processed', {
          detail: { timestamp: new Date().toISOString() }
        }));
      }
    } catch (error) {
      console.error('Error processing guru auto-alfa:', error);
    }
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  isServiceRunning(): boolean {
    return this.isRunning;
  }
}

export const globalAbsenService = new GlobalAbsenService();
