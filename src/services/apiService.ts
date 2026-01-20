const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  /**
   * Get token from localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  /**
   * Set token to localStorage
   */
  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  /**
   * Remove token from localStorage
   */
  removeToken(): void {
    localStorage.removeItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get token from localStorage
    const token = this.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // If token expired or invalid, remove it
      if (response.status === 401 && token) {
        this.removeToken();
        // Redirect to login if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Public request without authentication token
   */
  private async publicRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        // Return error data instead of throwing for login endpoint
        if (endpoint === '/auth/login') {
          return {
            success: false,
            message: data.message || 'Email atau password salah'
          } as T;
        }
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      // For login endpoint, return error result instead of throwing
      if (endpoint === '/auth/login') {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Terjadi kesalahan saat login'
        } as T;
      }
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    try {
      const result = await this.publicRequest<{
        success: boolean;
        user?: any;
        token?: string;
        requiresActivation?: boolean;
        message?: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Store token if login successful
      if (result.success && result.token) {
        this.setToken(result.token);
      }

      return result;
    } catch (error: any) {
      // Return error result instead of throwing
      return {
        success: false,
        message: error.message || 'Email atau password salah'
      };
    }
  }

  async getCurrentUser(userId?: string, email?: string) {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (email) params.append('email', email);
    
    return this.request<{
      success: boolean;
      user?: any;
      message?: string;
    }>(`/auth/current-user?${params.toString()}`);
  }

  // Activation endpoints
  async getSystemActivation() {
    return this.request<{
      success: boolean;
      activation?: any;
      message?: string;
    }>('/activation');
  }

  async checkSystemActive() {
    return this.request<{
      success: boolean;
      isSystemActive?: boolean;
      message?: string;
    }>('/activation/check');
  }

  async activateSystem(password: string, adminId?: string) {
    return this.request<{
      success: boolean;
      message?: string;
      activation?: any;
    }>('/activation/activate', {
      method: 'POST',
      body: JSON.stringify({ password, adminId }),
    });
  }

  async initializeSystemActivation() {
    return this.request<{
      success: boolean;
      activation?: any;
      message?: string;
    }>('/activation/initialize', {
      method: 'POST',
    });
  }

  // Jenjang endpoints
  async getActiveJenjang() {
    return this.request<{
      success: boolean;
      activeJenjang?: 'SD' | 'SMP' | 'SMA/SMK' | null;
      jenjangList?: any[];
      tingkatAwal?: number;
      tingkatAkhir?: number;
      message?: string;
    }>('/jenjang/active');
  }

  async getAllJenjang() {
    return this.request<{
      success: boolean;
      jenjangList?: any[];
      message?: string;
    }>('/jenjang');
  }

  async setJenjang(jenjang: 'SD' | 'SMP' | 'SMA/SMK') {
    return this.request<{
      success: boolean;
      message?: string;
      jenjangList?: any[];
    }>('/jenjang', {
      method: 'POST',
      body: JSON.stringify({ jenjang }),
    });
  }

  // Guru endpoints
  async getAllGurus() {
    return this.request<{
      success: boolean;
      gurus?: any[];
      count?: number;
      message?: string;
    }>('/guru');
  }

  async getGuruById(id: string) {
    return this.request<{
      success: boolean;
      guru?: any;
      message?: string;
    }>(`/guru/${id}`);
  }

  async createGuru(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      guru?: any;
    }>('/guru', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGuru(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      guru?: any;
    }>(`/guru/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGuru(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/guru/${id}`, {
      method: 'DELETE',
    });
  }

  // Ustadz endpoints
  async getAllUstadz() {
    return this.request<{
      success: boolean;
      ustadz?: any[];
      count?: number;
      message?: string;
    }>('/ustadz');
  }

  async getAvailableGurus() {
    return this.request<{
      success: boolean;
      gurus?: any[];
      message?: string;
    }>('/ustadz/available-gurus');
  }

  async addUstadz(data: {
    guruId?: string;
    name?: string;
    email?: string;
    phone?: string;
    nip?: string;
    password?: string;
    subject?: string;
    isActive?: boolean;
    rfidGuid?: string;
    profileImage?: string;
  }) {
    return this.request<{
      success: boolean;
      message?: string;
      ustadz?: any;
    }>('/ustadz', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUstadzStatus(guruId: string, isActive: boolean) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/ustadz/${guruId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  async removeUstadz(guruId: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/ustadz/${guruId}`, {
      method: 'DELETE',
    });
  }

  // Santri endpoints
  async getAllSantri() {
    return this.request<{
      success: boolean;
      santri?: any[];
      count?: number;
      message?: string;
    }>('/santri');
  }

  async getAvailableMurid() {
    return this.request<{
      success: boolean;
      murid?: any[];
      message?: string;
    }>('/santri/available-murid');
  }

  async addSantri(data: {
    muridId?: string;
    name?: string;
    email?: string;
    nisn?: string;
    password?: string;
    whatsappOrtu?: string;
    isActive?: boolean;
    rfidGuid?: string;
    profileImage?: string;
  }) {
    return this.request<{
      success: boolean;
      message?: string;
      santri?: any;
    }>('/santri', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addAllMurid() {
    return this.request<{
      success: boolean;
      message?: string;
      santri?: any[];
      count?: number;
    }>('/santri/add-all-murid', {
      method: 'POST',
    });
  }

  async updateSantriStatus(santriId: string, isActive: boolean) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/santri/${santriId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    });
  }

  async updateSantri(santriId: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/santri/${santriId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async removeSantri(santriId: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/santri/${santriId}`, {
      method: 'DELETE',
    });
  }

  // Progress Hafalan endpoints
  async getAllProgressHafalan(tahun?: string, santriId?: string) {
    const params = new URLSearchParams();
    if (tahun) params.append('tahun', tahun);
    if (santriId) params.append('santriId', santriId);
    const query = params.toString();
    return this.request<{
      success: boolean;
      data?: any[];
      message?: string;
    }>(`/progress-hafalan${query ? `?${query}` : ''}`);
  }

  async getProgressHafalanBySantri(santriId: string, tahun?: string) {
    const params = new URLSearchParams();
    if (tahun) params.append('tahun', tahun);
    const query = params.toString();
    return this.request<{
      success: boolean;
      data?: any[];
      message?: string;
    }>(`/progress-hafalan/santri/${santriId}${query ? `?${query}` : ''}`);
  }

  async addProgressHafalan(data: {
    santriId: string;
    juz: number;
    surat: string;
    ayatDari: number;
    ayatSampai: number;
    tanggal: string;
    keterangan?: string;
  }) {
    return this.request<{
      success: boolean;
      message?: string;
      data?: any;
    }>('/progress-hafalan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProgressHafalan(id: string, data: {
    juz?: number;
    surat?: string;
    ayatDari?: number;
    ayatSampai?: number;
    tanggal?: string;
    keterangan?: string;
  }) {
    return this.request<{
      success: boolean;
      message?: string;
      data?: any;
    }>(`/progress-hafalan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProgressHafalan(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/progress-hafalan/${id}`, {
      method: 'DELETE',
    });
  }

  async saveHasilTes(id: string, data: {
    hasilTes: 'Mumtaz' | 'Jayid Jiddan' | 'Jayid' | 'Maqbul';
    lafadzKesalahan?: string[];
    catatanPerbaikan?: string;
    poinPerbaikan?: {
      kelancaranHafalan: string;
      ketepatanAyat: string;
      tajwid: string;
      fashahah: string;
    };
    tanggalTes?: string;
  }) {
    return this.request<{
      success: boolean;
      message?: string;
      data?: any;
    }>(`/progress-hafalan/${id}/hasil-tes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Kelas Tahfiz endpoints
  async getAllKelasTahfiz() {
    return this.request<{
      success: boolean;
      kelasTahfiz?: any[];
      count?: number;
      message?: string;
    }>('/kelas-tahfiz');
  }

  async getKelasTahfizById(id: string) {
    return this.request<{
      success: boolean;
      kelasTahfiz?: any;
      message?: string;
    }>(`/kelas-tahfiz/${id}`);
  }

  async createKelasTahfiz(data: {
    id: string;
    namaKelas: string;
    ruangan: string;
    ustadzId: string;
    santriIds?: string[];
  }) {
    return this.request<{
      success: boolean;
      message?: string;
      kelasTahfiz?: any;
    }>('/kelas-tahfiz', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateKelasTahfiz(id: string, data: {
    namaKelas?: string;
    ruangan?: string;
    ustadzId?: string;
    santriIds?: string[];
  }) {
    return this.request<{
      success: boolean;
      message?: string;
      kelasTahfiz?: any;
    }>(`/kelas-tahfiz/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteKelasTahfiz(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/kelas-tahfiz/${id}`, {
      method: 'DELETE',
    });
  }

  // Jadwal Tahfiz endpoints
  async getAllJadwalTahfiz() {
    return this.request<{
      success: boolean;
      jadwalTahfiz?: any[];
      count?: number;
      message?: string;
    }>('/jadwal-tahfiz');
  }

  async getJadwalTahfizById(id: string) {
    return this.request<{
      success: boolean;
      jadwalTahfiz?: any;
      message?: string;
    }>(`/jadwal-tahfiz/${id}`);
  }

  async createJadwalTahfiz(data: {
    kelasId: string;
    hari:
      | 'senin'
      | 'selasa'
      | 'rabu'
      | 'kamis'
      | 'jumat'
      | 'sabtu'
      | 'minggu';
    jamMulai: string;
    jamSelesai: string;
  }) {
    return this.request<{
      success: boolean;
      message?: string;
      jadwalTahfiz?: any;
    }>('/jadwal-tahfiz', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJadwalTahfiz(
    id: string,
    data: {
      kelasId?: string;
      hari?:
        | 'senin'
        | 'selasa'
        | 'rabu'
        | 'kamis'
        | 'jumat'
        | 'sabtu'
        | 'minggu';
      jamMulai?: string;
      jamSelesai?: string;
    }
  ) {
    return this.request<{
      success: boolean;
      message?: string;
      jadwalTahfiz?: any;
    }>(`/jadwal-tahfiz/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteJadwalTahfiz(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/jadwal-tahfiz/${id}`, {
      method: 'DELETE',
    });
  }

  // Profil guru endpoints (untuk guru sendiri)
  async updateProfilGuru(data: {
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
  }) {
    return this.request<{
      success: boolean;
      message?: string;
      guru?: any;
    }>('/guru/profil/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePasswordGuru(data: {
    currentPassword: string;
    newPassword: string;
  }) {
    return this.request<{
      success: boolean;
      message?: string;
    }>('/guru/profil/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Jurusan endpoints
  async getAllJurusan() {
    return this.request<{
      success: boolean;
      jurusan?: any[];
      count?: number;
      message?: string;
    }>('/jurusan');
  }

  async getJurusanById(id: string) {
    return this.request<{
      success: boolean;
      jurusan?: any;
      message?: string;
    }>(`/jurusan/${id}`);
  }

  async getJurusanStats(id: string) {
    return this.request<{
      success: boolean;
      stats?: { kelasCount: number; muridCount: number };
      message?: string;
    }>(`/jurusan/${id}/stats`);
  }

  async createJurusan(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      jurusan?: any;
    }>('/jurusan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJurusan(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      jurusan?: any;
    }>(`/jurusan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteJurusan(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/jurusan/${id}`, {
      method: 'DELETE',
    });
  }

  // Kelas endpoints
  async getAllKelas(params?: { jurusanId?: string; tingkat?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.jurusanId) queryParams.append('jurusanId', params.jurusanId);
    if (params?.tingkat) queryParams.append('tingkat', params.tingkat.toString());
    
    const query = queryParams.toString();
    return this.request<{
      success: boolean;
      kelas?: any[];
      count?: number;
      message?: string;
    }>(`/kelas${query ? `?${query}` : ''}`);
  }

  async getKelasById(id: string) {
    return this.request<{
      success: boolean;
      kelas?: any;
      message?: string;
    }>(`/kelas/${id}`);
  }

  async getKelasStats(id: string) {
    return this.request<{
      success: boolean;
      stats?: { muridCount: number };
      message?: string;
    }>(`/kelas/${id}/stats`);
  }

  async createKelas(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      kelas?: any;
    }>('/kelas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateKelas(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      kelas?: any;
    }>(`/kelas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteKelas(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/kelas/${id}`, {
      method: 'DELETE',
    });
  }

  // Murid endpoints
  async getAllMurid(params?: { kelasId?: string; search?: string; status?: 'active' | 'inactive' }) {
    const queryParams = new URLSearchParams();
    if (params?.kelasId) queryParams.append('kelasId', params.kelasId);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    
    const query = queryParams.toString();
    return this.request<{
      success: boolean;
      murid?: any[];
      count?: number;
      message?: string;
    }>(`/murid${query ? `?${query}` : ''}`);
  }

  async getMuridById(id: string) {
    return this.request<{
      success: boolean;
      murid?: any;
      message?: string;
    }>(`/murid/${id}`);
  }

  async createMurid(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      murid?: any;
    }>('/murid', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMurid(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      murid?: any;
    }>(`/murid/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleMuridStatus(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
      isActive?: boolean;
    }>(`/murid/${id}/toggle-status`, {
      method: 'PATCH',
    });
  }

  async deleteMurid(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/murid/${id}`, {
      method: 'DELETE',
    });
  }

  // Tahun Ajaran endpoints
  async getAllTahunAjaran() {
    return this.request<{
      success: boolean;
      tahunAjaran?: any[];
      count?: number;
      message?: string;
    }>('/tahun-ajaran');
  }

  async getTahunAjaranById(id: string) {
    return this.request<{
      success: boolean;
      tahunAjaran?: any;
      message?: string;
    }>(`/tahun-ajaran/${id}`);
  }

  async getActiveTahunAjaran() {
    return this.request<{
      success: boolean;
      tahunAjaran?: any | null;
      message?: string;
    }>('/tahun-ajaran/active');
  }

  async createTahunAjaran(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      tahunAjaran?: any;
    }>('/tahun-ajaran', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTahunAjaran(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      tahunAjaran?: any;
    }>(`/tahun-ajaran/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async activateTahunAjaran(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
      tahunAjaran?: any;
    }>(`/tahun-ajaran/${id}/activate`, {
      method: 'PATCH',
    });
  }

  async deleteTahunAjaran(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/tahun-ajaran/${id}`, {
      method: 'DELETE',
    });
  }

  // Mata Pelajaran endpoints
  async getAllMataPelajaran() {
    return this.request<{
      success: boolean;
      mataPelajaran?: any[];
      count?: number;
      message?: string;
    }>('/mata-pelajaran');
  }

  async getMataPelajaranById(id: string) {
    return this.request<{
      success: boolean;
      mataPelajaran?: any;
      message?: string;
    }>(`/mata-pelajaran/${id}`);
  }

  async createMataPelajaran(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      mataPelajaran?: any;
    }>('/mata-pelajaran', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMataPelajaran(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      mataPelajaran?: any;
    }>(`/mata-pelajaran/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMataPelajaran(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/mata-pelajaran/${id}`, {
      method: 'DELETE',
    });
  }

  // Guru Mapel endpoints
  async getAllGuruMapel(params?: { guruId?: string; mataPelajaranId?: string; isActive?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.guruId) queryParams.append('guruId', params.guruId);
    if (params?.mataPelajaranId) queryParams.append('mataPelajaranId', params.mataPelajaranId);
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const query = queryParams.toString();
    return this.request<{
      success: boolean;
      guruMapel?: any[];
      count?: number;
      message?: string;
    }>(`/guru-mapel${query ? `?${query}` : ''}`);
  }

  async getGuruMapelByGuruId(guruId: string) {
    return this.request<{
      success: boolean;
      guruMapel?: any[];
      count?: number;
      message?: string;
    }>(`/guru-mapel/guru/${guruId}`);
  }

  async getGuruMapelById(id: string) {
    return this.request<{
      success: boolean;
      guruMapel?: any;
      message?: string;
    }>(`/guru-mapel/${id}`);
  }

  async createGuruMapel(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      guruMapel?: any;
    }>('/guru-mapel', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGuruMapelAssignments(guruId: string, mataPelajaranIds: string[]) {
    return this.request<{
      success: boolean;
      message?: string;
      guruMapel?: any[];
      count?: number;
    }>(`/guru-mapel/guru/${guruId}/assignments`, {
      method: 'PUT',
      body: JSON.stringify({ mataPelajaranIds }),
    });
  }

  async updateGuruMapel(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      guruMapel?: any;
    }>(`/guru-mapel/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGuruMapel(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/guru-mapel/${id}`, {
      method: 'DELETE',
    });
  }

  // Jadwal Pelajaran endpoints
  async getAllJadwalPelajaran(params?: { kelasId?: string; guruId?: string; tahunAjaran?: string; semester?: number; hari?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.kelasId) queryParams.append('kelasId', params.kelasId);
    if (params?.guruId) queryParams.append('guruId', params.guruId);
    if (params?.tahunAjaran) queryParams.append('tahunAjaran', params.tahunAjaran);
    if (params?.semester) queryParams.append('semester', params.semester.toString());
    if (params?.hari) queryParams.append('hari', params.hari);
    
    const query = queryParams.toString();
    return this.request<{
      success: boolean;
      jadwalPelajaran?: any[];
      count?: number;
      message?: string;
    }>(`/jadwal-pelajaran${query ? `?${query}` : ''}`);
  }

  async getJadwalPelajaranById(id: string) {
    return this.request<{
      success: boolean;
      jadwalPelajaran?: any;
      message?: string;
    }>(`/jadwal-pelajaran/${id}`);
  }

  async checkScheduleConflict(data: any) {
    return this.request<{
      success: boolean;
      hasConflict?: boolean;
      conflicts?: any[];
      message?: string;
    }>('/jadwal-pelajaran/check-conflict', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createJadwalPelajaran(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      jadwalPelajaran?: any;
    }>('/jadwal-pelajaran', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJadwalPelajaran(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      jadwalPelajaran?: any;
    }>(`/jadwal-pelajaran/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteJadwalPelajaran(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/jadwal-pelajaran/${id}`, {
      method: 'DELETE',
    });
  }

  // Pengaturan Absen endpoints
  async getAllPengaturanAbsen() {
    return this.request<{
      success: boolean;
      pengaturanAbsen?: any[];
      message?: string;
    }>('/pengaturan-absen');
  }

  async getActivePengaturanAbsen() {
    return this.request<{
      success: boolean;
      pengaturanAbsen?: any;
      message?: string;
    }>('/pengaturan-absen/active');
  }

  async createPengaturanAbsen(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      pengaturanAbsen?: any;
    }>('/pengaturan-absen', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePengaturanAbsen(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      pengaturanAbsen?: any;
    }>(`/pengaturan-absen/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePengaturanAbsen(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/pengaturan-absen/${id}`, {
      method: 'DELETE',
    });
  }

  // Pengaturan SKS endpoints
  async getAllPengaturanSKS() {
    return this.request<{
      success: boolean;
      pengaturanSKS?: any[];
      message?: string;
    }>('/pengaturan-sks');
  }

  async getActivePengaturanSKS() {
    return this.request<{
      success: boolean;
      pengaturanSKS?: any;
      message?: string;
    }>('/pengaturan-sks/active');
  }

  async createPengaturanSKS(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      pengaturanSKS?: any;
    }>('/pengaturan-sks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePengaturanSKS(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      pengaturanSKS?: any;
    }>(`/pengaturan-sks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePengaturanSKS(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/pengaturan-sks/${id}`, {
      method: 'DELETE',
    });
  }

  // Pengaturan Istirahat endpoints
  async getAllPengaturanIstirahat() {
    return this.request<{
      success: boolean;
      pengaturanIstirahat?: any[];
      message?: string;
    }>('/pengaturan-istirahat');
  }

  async getActivePengaturanIstirahat() {
    return this.request<{
      success: boolean;
      pengaturanIstirahat?: any;
      message?: string;
    }>('/pengaturan-istirahat/active');
  }

  async createPengaturanIstirahat(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      pengaturanIstirahat?: any;
    }>('/pengaturan-istirahat', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePengaturanIstirahat(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      pengaturanIstirahat?: any;
    }>(`/pengaturan-istirahat/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePengaturanIstirahat(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/pengaturan-istirahat/${id}`, {
      method: 'DELETE',
    });
  }

  // Profil Sekolah endpoints
  async getProfilSekolah() {
    return this.request<{
      success: boolean;
      profilSekolah?: any;
      message?: string;
    }>('/profil-sekolah');
  }

  async getProfilSekolahPublic() {
    return this.publicRequest<{
      success: boolean;
      profilSekolah?: any;
      message?: string;
    }>('/profil-sekolah/public');
  }

  async saveProfilSekolah(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      profilSekolah?: any;
    }>('/profil-sekolah', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Background KTA endpoints
  async getBackgroundKTA() {
    return this.request<{
      success: boolean;
      backgroundKTA?: any;
      message?: string;
    }>('/background-kta');
  }

  async saveBackgroundKTA(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      backgroundKTA?: any;
    }>('/background-kta', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Data Kepsek endpoints
  async getAllDataKepsek() {
    return this.request<{
      success: boolean;
      dataKepsek?: any[];
      message?: string;
    }>('/data-kepsek');
  }

  async getDataKepsekById(id: string) {
    return this.request<{
      success: boolean;
      dataKepsek?: any;
      message?: string;
    }>(`/data-kepsek/${id}`);
  }

  async createDataKepsek(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      dataKepsek?: any;
    }>('/data-kepsek', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDataKepsek(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      dataKepsek?: any;
    }>(`/data-kepsek/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDataKepsek(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/data-kepsek/${id}`, {
      method: 'DELETE',
    });
  }

  // Pengaturan Komponen Nilai endpoints
  async getAllKomponenNilai() {
    return this.request<{
      success: boolean;
      komponenNilai?: any[];
      message?: string;
    }>('/pengaturan-komponen-nilai');
  }

  async getKomponenNilaiById(id: string) {
    return this.request<{
      success: boolean;
      komponenNilai?: any;
      message?: string;
    }>(`/pengaturan-komponen-nilai/${id}`);
  }

  async createKomponenNilai(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      komponenNilai?: any;
    }>('/pengaturan-komponen-nilai', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateKomponenNilai(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      komponenNilai?: any;
    }>(`/pengaturan-komponen-nilai/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteKomponenNilai(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/pengaturan-komponen-nilai/${id}`, {
      method: 'DELETE',
    });
  }

  async updateAllKomponenNilai(komponenNilai: any[]) {
    return this.request<{
      success: boolean;
      message?: string;
      komponenNilai?: any[];
    }>('/pengaturan-komponen-nilai/all', {
      method: 'PUT',
      body: JSON.stringify({ komponenNilai }),
    });
  }

  // Pengaturan Grade endpoints
  async getAllGrade() {
    return this.request<{
      success: boolean;
      grades?: any[];
      message?: string;
    }>('/pengaturan-grade');
  }

  async getGradeById(id: string) {
    return this.request<{
      success: boolean;
      grade?: any;
      message?: string;
    }>(`/pengaturan-grade/${id}`);
  }

  async createGrade(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      grade?: any;
    }>('/pengaturan-grade', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGrade(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      grade?: any;
    }>(`/pengaturan-grade/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGrade(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/pengaturan-grade/${id}`, {
      method: 'DELETE',
    });
  }

  async updateAllGrade(grades: any[]) {
    return this.request<{
      success: boolean;
      message?: string;
      grades?: any[];
    }>('/pengaturan-grade/all', {
      method: 'PUT',
      body: JSON.stringify({ grades }),
    });
  }

  // Pengaturan Nilai Minimal endpoints
  async getPengaturanNilaiMinimal() {
    return this.request<{
      success: boolean;
      pengaturanNilaiMinimal?: any;
      message?: string;
    }>('/pengaturan-nilai-minimal');
  }

  async savePengaturanNilaiMinimal(data: { nilaiAkhirMinimal: number; tingkatKehadiranMinimal: number }) {
    return this.request<{
      success: boolean;
      message?: string;
      pengaturanNilaiMinimal?: any;
    }>('/pengaturan-nilai-minimal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Sesi Absensi endpoints
  async getAllSesiAbsensi() {
    return this.request<{
      success: boolean;
      sesiAbsensi?: any[];
      message?: string;
    }>('/sesi-absensi');
  }

  async getSesiAbsensiByTanggal(tanggal?: string, jadwalId?: string, createdBy?: string) {
    const queryParams = new URLSearchParams();
    if (tanggal) queryParams.append('tanggal', tanggal);
    if (jadwalId) queryParams.append('jadwalId', jadwalId);
    if (createdBy) queryParams.append('createdBy', createdBy);
    
    const query = queryParams.toString();
    return this.request<{
      success: boolean;
      sesiAbsensi?: any[];
      message?: string;
    }>(`/sesi-absensi/by-tanggal${query ? `?${query}` : ''}`);
  }

  async getSesiAbsensiById(id: string) {
    return this.request<{
      success: boolean;
      sesiAbsensi?: any;
      message?: string;
    }>(`/sesi-absensi/${id}`);
  }

  async createSesiAbsensi(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      sesiAbsensi?: any;
    }>('/sesi-absensi', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSesiAbsensi(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      sesiAbsensi?: any;
    }>(`/sesi-absensi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSesiAbsensi(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/sesi-absensi/${id}`, {
      method: 'DELETE',
    });
  }

  // Sesi Absensi Tahfiz methods
  async getAllSesiAbsensiTahfiz() {
    return this.request<{
      success: boolean;
      sesiAbsensiTahfiz?: any[];
      message?: string;
    }>('/sesi-absensi-tahfiz');
  }

  async getSesiAbsensiTahfizByTanggal(tanggal?: string, jadwalId?: string, createdBy?: string) {
    const queryParams = new URLSearchParams();
    if (tanggal) queryParams.append('tanggal', tanggal);
    if (jadwalId) queryParams.append('jadwalId', jadwalId);
    if (createdBy) queryParams.append('createdBy', createdBy);
    
    const query = queryParams.toString();
    return this.request<{
      success: boolean;
      sesiAbsensiTahfiz?: any[];
      message?: string;
    }>(`/sesi-absensi-tahfiz/by-tanggal${query ? `?${query}` : ''}`);
  }

  async getSesiAbsensiTahfizById(id: string) {
    return this.request<{
      success: boolean;
      sesiAbsensiTahfiz?: any;
      message?: string;
    }>(`/sesi-absensi-tahfiz/${id}`);
  }

  async createSesiAbsensiTahfiz(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      sesiAbsensiTahfiz?: any;
    }>('/sesi-absensi-tahfiz', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSesiAbsensiTahfiz(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      sesiAbsensiTahfiz?: any;
    }>(`/sesi-absensi-tahfiz/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSesiAbsensiTahfiz(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/sesi-absensi-tahfiz/${id}`, {
      method: 'DELETE',
    });
  }

  // Absensi tahfiz management within sesi
  async addAbsensiToSesiTahfiz(sesiId: string, absensiData: any) {
    return this.request<{
      success: boolean;
      message?: string;
      absensi?: any;
      sesiAbsensiTahfiz?: any;
    }>(`/sesi-absensi-tahfiz/${sesiId}/absensi`, {
      method: 'POST',
      body: JSON.stringify(absensiData),
    });
  }

  async bulkAddAbsensiToSesiTahfiz(sesiId: string, absensiList: any[]) {
    return this.request<{
      success: boolean;
      message?: string;
      absensi?: any[];
      sesiAbsensiTahfiz?: any;
    }>(`/sesi-absensi-tahfiz/${sesiId}/absensi/bulk`, {
      method: 'POST',
      body: JSON.stringify({ absensiList }),
    });
  }

  async removeAbsensiFromSesiTahfiz(sesiId: string, absensiId: string) {
    return this.request<{
      success: boolean;
      message?: string;
      sesiAbsensiTahfiz?: any;
    }>(`/sesi-absensi-tahfiz/${sesiId}/absensi/${absensiId}`, {
      method: 'DELETE',
    });
  }

  // Absensi pelajaran management within sesi
  async addAbsensiToSesi(sesiId: string, absensiData: any) {
    return this.request<{
      success: boolean;
      message?: string;
      absensi?: any;
      sesiAbsensi?: any;
    }>(`/sesi-absensi/${sesiId}/absensi`, {
      method: 'POST',
      body: JSON.stringify(absensiData),
    });
  }

  async bulkAddAbsensiToSesi(sesiId: string, absensiList: any[]) {
    return this.request<{
      success: boolean;
      message?: string;
      absensi?: any[];
      sesiAbsensi?: any;
    }>(`/sesi-absensi/${sesiId}/absensi/bulk`, {
      method: 'POST',
      body: JSON.stringify({ absensiList }),
    });
  }

  async removeAbsensiFromSesi(sesiId: string, absensiId: string) {
    return this.request<{
      success: boolean;
      message?: string;
      sesiAbsensi?: any;
    }>(`/sesi-absensi/${sesiId}/absensi/${absensiId}`, {
      method: 'DELETE',
    });
  }

  // Jurnal endpoints
  async getAllJurnal() {
    return this.request<{
      success: boolean;
      jurnal?: any[];
      message?: string;
    }>('/jurnal');
  }

  async getJurnalById(id: string) {
    return this.request<{
      success: boolean;
      jurnal?: any;
      message?: string;
    }>(`/jurnal/${id}`);
  }

  async getJurnalByJadwalId(jadwalId: string) {
    return this.request<{
      success: boolean;
      jurnal?: any[];
      message?: string;
    }>(`/jurnal/by-jadwal/${jadwalId}`);
  }

  async getJurnalByTanggal(tanggal?: string, jadwalId?: string, kelasId?: string) {
    const params = new URLSearchParams();
    if (tanggal) params.append('tanggal', tanggal);
    if (jadwalId) params.append('jadwalId', jadwalId);
    if (kelasId) params.append('kelasId', kelasId);
    
    return this.request<{
      success: boolean;
      jurnal?: any[];
      message?: string;
    }>(`/jurnal/by-tanggal?${params.toString()}`);
  }

  async getJurnalByJadwalIdAndTanggal(jadwalId: string, tanggal: string, kelasId?: string) {
    const params = new URLSearchParams();
    params.append('jadwalId', jadwalId);
    params.append('tanggal', tanggal);
    if (kelasId) params.append('kelasId', kelasId);
    
    return this.request<{
      success: boolean;
      jurnal?: any;
      message?: string;
    }>(`/jurnal/by-jadwal-tanggal?${params.toString()}`);
  }

  async createJurnal(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      jurnal?: any;
    }>('/jurnal', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJurnal(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      jurnal?: any;
    }>(`/jurnal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteJurnal(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/jurnal/${id}`, {
      method: 'DELETE',
    });
  }

  // Jurnal Tahfiz endpoints
  async getAllJurnalTahfiz() {
    return this.request<{
      success: boolean;
      jurnalTahfiz?: any[];
      message?: string;
    }>('/jurnal-tahfiz');
  }

  async getJurnalTahfizById(id: string) {
    return this.request<{
      success: boolean;
      jurnalTahfiz?: any;
      message?: string;
    }>(`/jurnal-tahfiz/${id}`);
  }

  async getJurnalTahfizByJadwalId(jadwalId: string) {
    return this.request<{
      success: boolean;
      jurnalTahfiz?: any[];
      message?: string;
    }>(`/jurnal-tahfiz/by-jadwal/${jadwalId}`);
  }

  async getJurnalTahfizByTanggal(tanggal?: string, jadwalId?: string, kelasId?: string) {
    const params = new URLSearchParams();
    if (tanggal) params.append('tanggal', tanggal);
    if (jadwalId) params.append('jadwalId', jadwalId);
    if (kelasId) params.append('kelasId', kelasId);
    
    return this.request<{
      success: boolean;
      jurnalTahfiz?: any[];
      message?: string;
    }>(`/jurnal-tahfiz/by-tanggal?${params.toString()}`);
  }

  async getJurnalTahfizByJadwalIdAndTanggal(jadwalId: string, tanggal: string, kelasId?: string) {
    const params = new URLSearchParams();
    params.append('jadwalId', jadwalId);
    params.append('tanggal', tanggal);
    if (kelasId) params.append('kelasId', kelasId);
    
    return this.request<{
      success: boolean;
      jurnalTahfiz?: any;
      message?: string;
    }>(`/jurnal-tahfiz/by-jadwal-tanggal?${params.toString()}`);
  }

  async createJurnalTahfiz(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      jurnalTahfiz?: any;
    }>('/jurnal-tahfiz', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateJurnalTahfiz(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      jurnalTahfiz?: any;
    }>(`/jurnal-tahfiz/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteJurnalTahfiz(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/jurnal-tahfiz/${id}`, {
      method: 'DELETE',
    });
  }

  async deletePertemuanJurnalTahfiz(id: string, tanggal: string) {
    return this.request<{
      success: boolean;
      message?: string;
      jurnalTahfiz?: any;
    }>(`/jurnal-tahfiz/pertemuan/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ tanggal }),
    });
  }

  // Izin Guru endpoints
  async getAllIzinGuru() {
    return this.request<{
      success: boolean;
      izinGuru?: any[];
      message?: string;
    }>('/izin-guru');
  }

  async getIzinGuruByStatus(status: string) {
    return this.request<{
      success: boolean;
      izinGuru?: any[];
      message?: string;
    }>(`/izin-guru/by-status?status=${status}`);
  }

  // Public verification endpoint (no auth required)
  async getIzinGuruVerification(id: string) {
    return this.publicRequest<{
      success: boolean;
      izinGuru?: any;
      message?: string;
    }>(`/izin-guru/verification/${id}`);
  }

  async getIzinGuruById(id: string) {
    return this.request<{
      success: boolean;
      izinGuru?: any;
      message?: string;
    }>(`/izin-guru/${id}`);
  }

  async createIzinGuru(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      izinGuru?: any;
    }>('/izin-guru', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateIzinGuru(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      izinGuru?: any;
    }>(`/izin-guru/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteIzinGuru(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/izin-guru/${id}`, {
      method: 'DELETE',
    });
  }

  // Surat Izin endpoints
  async getAllSuratIzin() {
    return this.request<{
      success: boolean;
      suratIzin?: any[];
      message?: string;
    }>('/surat-izin');
  }

  async getSuratIzinByStatus(status: string) {
    return this.request<{
      success: boolean;
      suratIzin?: any[];
      message?: string;
    }>(`/surat-izin/by-status?status=${status}`);
  }

  async getSuratIzinByUstadzId(ustadzId: string) {
    return this.request<{
      success: boolean;
      suratIzin?: any[];
      message?: string;
    }>(`/surat-izin/by-ustadz?ustadzId=${ustadzId}`);
  }

  async getSuratIzinById(id: string) {
    return this.request<{
      success: boolean;
      suratIzin?: any;
      message?: string;
    }>(`/surat-izin/${id}`);
  }

  // Public verification endpoint (no auth required)
  async getSuratIzinVerification(id: string) {
    return this.publicRequest<{
      success: boolean;
      suratIzin?: any;
      message?: string;
    }>(`/surat-izin/verification/${id}`);
  }

  // Public raport verification endpoint (no auth required)
  async getRaportVerification(nisn: string, tahunAjaran?: string, semester?: number) {
    const params = new URLSearchParams();
    if (tahunAjaran) params.append('tahunAjaran', tahunAjaran);
    if (semester) params.append('semester', semester.toString());
    const queryString = params.toString();
    return this.publicRequest<{
      success: boolean;
      studentId?: string;
      semester?: number;
      tahunAjaran?: string;
      data?: any;
      message?: string;
    }>(`/raport/verification/${nisn}${queryString ? `?${queryString}` : ''}`);
  }

  async createSuratIzin(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      suratIzin?: any;
    }>('/surat-izin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSuratIzin(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      suratIzin?: any;
    }>(`/surat-izin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async verifySuratIzin(id: string, data: { status: 'diterima' | 'ditolak'; keterangan?: string; verifiedBy?: string; kelasWali?: string }) {
    return this.request<{
      success: boolean;
      message?: string;
      suratIzin?: any;
    }>(`/surat-izin/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSuratIzin(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/surat-izin/${id}`, {
      method: 'DELETE',
    });
  }

  // Absensi Guru endpoints
  async getAllAbsensiGuru() {
    return this.request<{
      success: boolean;
      absensiGuru?: any[];
      message?: string;
    }>('/absensi-guru');
  }

  async getAbsensiGuruByTanggal(tanggal: string) {
    return this.request<{
      success: boolean;
      absensiGuru?: any[];
      message?: string;
    }>(`/absensi-guru/by-tanggal?tanggal=${tanggal}`);
  }

  async getAbsensiGuruDates(bulan: number, tahun: number) {
    return this.request<{
      success: boolean;
      dates?: string[];
      message?: string;
    }>(`/absensi-guru/dates?bulan=${bulan}&tahun=${tahun}`);
  }

  async getAbsensiGuruById(id: string) {
    return this.request<{
      success: boolean;
      absensiGuru?: any;
      message?: string;
    }>(`/absensi-guru/${id}`);
  }

  async createAbsensiGuru(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      absensiGuru?: any;
    }>('/absensi-guru', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAbsensiGuru(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      absensiGuru?: any;
    }>(`/absensi-guru/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAbsensiGuru(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/absensi-guru/${id}`, {
      method: 'DELETE',
    });
  }

  async getAbsensiGuruByGuruId(guruId: string, bulan?: number, tahun?: number) {
    let url = `/absensi-guru/by-guru/${guruId}`;
    if (bulan && tahun) {
      url += `?bulan=${bulan}&tahun=${tahun}`;
    }
    return this.request<{
      success: boolean;
      absensiGuru?: any[];
      message?: string;
    }>(url);
  }

  async getAbsensiGuruByGuruIdAndTanggal(guruId: string, tanggal: string) {
    return this.request<{
      success: boolean;
      absensiGuru?: any;
      message?: string;
    }>(`/absensi-guru/by-guru-tanggal?guruId=${guruId}&tanggal=${tanggal}`);
  }

  // Absensi (Murid) endpoints
  async getAllAbsensi(params?: {
    muridId?: string;
    kelasId?: string;
    tanggal?: string;
    bulan?: number;
    tahun?: number;
    tahunAjaranId?: string;
    semester?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.muridId) queryParams.append('muridId', params.muridId);
    if (params?.kelasId) queryParams.append('kelasId', params.kelasId);
    if (params?.tanggal) queryParams.append('tanggal', params.tanggal);
    if (params?.bulan) queryParams.append('bulan', params.bulan.toString());
    if (params?.tahun) queryParams.append('tahun', params.tahun.toString());
    if (params?.tahunAjaranId) queryParams.append('tahunAjaranId', params.tahunAjaranId);
    if (params?.semester !== undefined) queryParams.append('semester', params.semester.toString());
    
    const url = queryParams.toString() ? `/absensi?${queryParams.toString()}` : '/absensi';
    return this.request<{
      success: boolean;
      absensi?: any[];
      count?: number;
      message?: string;
    }>(url);
  }

  async getAbsensiById(id: string) {
    return this.request<{
      success: boolean;
      absensi?: any;
      message?: string;
    }>(`/absensi/${id}`);
  }

  async getAbsensiByMuridId(muridId: string, bulan?: number, tahun?: number) {
    let url = `/absensi/by-murid/${muridId}`;
    if (bulan && tahun) {
      url += `?bulan=${bulan}&tahun=${tahun}`;
    } else if (tahun) {
      url += `?tahun=${tahun}`;
    }
    return this.request<{
      success: boolean;
      absensi?: any[];
      count?: number;
      message?: string;
    }>(url);
  }

  async getAbsensiByMuridIdAndTanggal(muridId: string, tanggal: string) {
    return this.request<{
      success: boolean;
      absensi?: any[];
      count?: number;
      message?: string;
    }>(`/absensi/by-murid-tanggal/${muridId}?tanggal=${tanggal}`);
  }

  async createAbsensi(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      absensi?: any;
    }>('/absensi', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAbsensi(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      absensi?: any;
    }>(`/absensi/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAbsensi(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/absensi/${id}`, {
      method: 'DELETE',
    });
  }

  // Session metadata endpoints (for absen kelas)
  async getSessionMetadata(params: {
    tanggal: string;
    kelasId: string;
    sessionType: 'masuk' | 'pulang';
    tahunAjaranId?: string;
    semester?: number;
  }) {
    const queryParams = new URLSearchParams();
    queryParams.append('tanggal', params.tanggal);
    queryParams.append('kelasId', params.kelasId);
    queryParams.append('sessionType', params.sessionType);
    if (params.tahunAjaranId) queryParams.append('tahunAjaranId', params.tahunAjaranId);
    if (params.semester !== undefined) queryParams.append('semester', params.semester.toString());
    
    return this.request<{
      success: boolean;
      session?: any;
      message?: string;
    }>(`/absensi/session/metadata?${queryParams.toString()}`);
  }

  async updateSessionMetadata(data: {
    tanggal: string;
    kelasId: string;
    sessionType: 'masuk' | 'pulang';
    jamBuka?: string;
    jamTutup?: string;
    status: 'dibuka' | 'ditutup';
    createdBy: string;
    tahunAjaranId?: string;
    semester?: number;
  }) {
    return this.request<{
      success: boolean;
      message?: string;
      session?: any;
    }>('/absensi/session/metadata', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async bulkCreateAbsensi(absensiList: any[]) {
    return this.request<{
      success: boolean;
      message?: string;
      absensi?: any[];
      errors?: any[];
    }>('/absensi/bulk', {
      method: 'POST',
      body: JSON.stringify({ absensiList }),
    });
  }

  // Riwayat Kelas Murid endpoints
  async getAllRiwayatKelasMurid(params?: {
    muridId?: string;
    kelasId?: string;
    tahunAjaran?: string;
    semester?: number;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.muridId) queryParams.append('muridId', params.muridId);
    if (params?.kelasId) queryParams.append('kelasId', params.kelasId);
    if (params?.tahunAjaran) queryParams.append('tahunAjaran', params.tahunAjaran);
    if (params?.semester !== undefined) queryParams.append('semester', params.semester.toString());
    if (params?.status) queryParams.append('status', params.status);
    
    const url = queryParams.toString() ? `/riwayat-kelas-murid?${queryParams.toString()}` : '/riwayat-kelas-murid';
    return this.request<{
      success: boolean;
      riwayatKelasMurid?: any[];
      count?: number;
      message?: string;
    }>(url);
  }

  async getRiwayatKelasMuridById(id: string) {
    return this.request<{
      success: boolean;
      riwayatKelasMurid?: any;
      message?: string;
    }>(`/riwayat-kelas-murid/${id}`);
  }

  async getRiwayatKelasMuridByMuridId(muridId: string, tahunAjaran?: string, semester?: number) {
    let url = `/riwayat-kelas-murid/by-murid/${muridId}`;
    const params = new URLSearchParams();
    if (tahunAjaran) params.append('tahunAjaran', tahunAjaran);
    if (semester !== undefined) params.append('semester', semester.toString());
    if (params.toString()) url += `?${params.toString()}`;
    
    return this.request<{
      success: boolean;
      riwayatKelasMurid?: any[];
      count?: number;
      message?: string;
    }>(url);
  }

  async createRiwayatKelasMurid(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      riwayatKelasMurid?: any;
    }>('/riwayat-kelas-murid', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkCreateRiwayatKelasMurid(riwayatList: any[]) {
    return this.request<{
      success: boolean;
      message?: string;
      riwayatKelasMurid?: any[];
      errors?: any[];
    }>('/riwayat-kelas-murid/bulk', {
      method: 'POST',
      body: JSON.stringify({ riwayatList }),
    });
  }

  async updateRiwayatKelasMurid(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      riwayatKelasMurid?: any;
    }>(`/riwayat-kelas-murid/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRiwayatKelasMurid(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/riwayat-kelas-murid/${id}`, {
      method: 'DELETE',
    });
  }

  // Alat RFID endpoints
  async getAllAlatRFID() {
    return this.request<{
      success: boolean;
      alatRfid?: any[];
      message?: string;
    }>('/alat-rfid');
  }

  async getAlatRFIDById(id: string) {
    return this.request<{
      success: boolean;
      alatRfid?: any;
      message?: string;
    }>(`/alat-rfid/${id}`);
  }

  async getAlatRFIDByToken(token: string) {
    return this.request<{
      success: boolean;
      alatRfid?: any;
      message?: string;
    }>(`/alat-rfid/by-token?token=${token}`);
  }

  async createAlatRFID(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      alatRfid?: any;
    }>('/alat-rfid', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAlatRFID(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      alatRfid?: any;
    }>(`/alat-rfid/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async toggleStatusAlatRFID(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
      alatRfid?: any;
    }>(`/alat-rfid/${id}/toggle-status`, {
      method: 'PATCH',
    });
  }

  async deleteAlatRFID(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/alat-rfid/${id}`, {
      method: 'DELETE',
    });
  }

  // Pengaturan Sistem endpoints
  async getPengaturanSistem() {
    return this.request<{
      success: boolean;
      pengaturan?: {
        id: string;
        enableEarlyDeparture: boolean;
        language: string;
        systemType: string;
        createdAt: string;
        updatedAt: string;
      };
      message?: string;
    }>('/pengaturan-sistem');
  }

  async getEnableEarlyDeparture() {
    return this.request<{
      success: boolean;
      enableEarlyDeparture: boolean;
      message?: string;
    }>('/pengaturan-sistem/enable-early-departure');
  }

  async getLanguage() {
    return this.request<{
      success: boolean;
      language: string;
      message?: string;
    }>('/pengaturan-sistem/language');
  }

  async getSystemType() {
    return this.request<{
      success: boolean;
      systemType: string;
      message?: string;
    }>('/pengaturan-sistem/system-type');
  }

  async updatePengaturanSistem(data: { enableEarlyDeparture?: boolean; language?: string; systemType?: string; activationPassword?: string; isInitialSetup?: boolean }) {
    return this.request<{
      success: boolean;
      message?: string;
      pengaturan?: {
        id: string;
        enableEarlyDeparture: boolean;
        language: string;
        systemType: string;
        createdAt: string;
        updatedAt: string;
      };
    }>('/pengaturan-sistem', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Wali Kelas Settings endpoints
  async getWaliKelasSettings() {
    return this.request<{
      success: boolean;
      settings?: any;
      message?: string;
    }>('/wali-kelas-settings');
  }

  async saveWaliKelasSettings(data: { system: 'otomatis' | 'tetap' | 'hapus' }) {
    return this.request<{
      success: boolean;
      message?: string;
      settings?: any;
    }>('/wali-kelas-settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Alumni endpoints
  async getAllAlumni(params?: { tahunLulus?: string; kelasId?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.tahunLulus) queryParams.append('tahunLulus', params.tahunLulus);
    if (params?.kelasId) queryParams.append('kelasId', params.kelasId);
    if (params?.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      alumni?: any[];
      count?: number;
      message?: string;
    }>(`/alumni${queryString ? `?${queryString}` : ''}`);
  }

  async getAlumniById(id: string) {
    return this.request<{
      success: boolean;
      alumni?: any;
      message?: string;
    }>(`/alumni/${id}`);
  }

  async getAlumniByMuridId(muridId: string) {
    return this.request<{
      success: boolean;
      alumni?: any;
      message?: string;
    }>(`/alumni/murid/${muridId}`);
  }

  async createAlumni(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      alumni?: any;
    }>('/alumni', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAlumni(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      alumni?: any;
    }>(`/alumni/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAlumni(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/alumni/${id}`, {
      method: 'DELETE',
    });
  }

  // Nilai endpoints
  async getAllNilai(params?: { guruId?: string; kelasId?: string; mataPelajaranId?: string; muridId?: string; semester?: number; tahunAjaran?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.guruId) queryParams.append('guruId', params.guruId);
    if (params?.kelasId) queryParams.append('kelasId', params.kelasId);
    if (params?.mataPelajaranId) queryParams.append('mataPelajaranId', params.mataPelajaranId);
    if (params?.muridId) queryParams.append('muridId', params.muridId);
    if (params?.semester) queryParams.append('semester', params.semester.toString());
    if (params?.tahunAjaran) queryParams.append('tahunAjaran', params.tahunAjaran);
    
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      nilai?: any[];
      message?: string;
    }>(`/nilai${queryString ? `?${queryString}` : ''}`);
  }

  async getNilaiById(id: string) {
    return this.request<{
      success: boolean;
      nilai?: any;
      message?: string;
    }>(`/nilai/${id}`);
  }

  async createNilai(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      nilai?: any;
    }>('/nilai', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNilai(id: string, data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      nilai?: any;
    }>(`/nilai/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNilai(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/nilai/${id}`, {
      method: 'DELETE',
    });
  }

  async upsertNilai(data: any) {
    return this.request<{
      success: boolean;
      message?: string;
      nilai?: any;
      isNew?: boolean;
    }>('/nilai/upsert', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkUpsertNilai(nilaiList: any[]) {
    return this.request<{
      success: boolean;
      message?: string;
      nilai?: any[];
    }>('/nilai/bulk-upsert', {
      method: 'POST',
      body: JSON.stringify({ nilaiList }),
    });
  }

  // Status Kenaikan Kelas endpoints
  async getAllStatusKenaikanKelas() {
    return this.request<{
      success: boolean;
      data?: any[];
      message?: string;
    }>('/status-kenaikan-kelas');
  }

  async updateStatusKenaikanKelas(id: string, data: any) {
    return this.request<{
      success: boolean;
      data?: any;
      message?: string;
    }>(`/status-kenaikan-kelas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createStatusKenaikanKelas(data: any) {
    return this.request<{
      success: boolean;
      data?: any;
      message?: string;
    }>('/status-kenaikan-kelas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Status Bagi Raport endpoints
  async getAllStatusBagiRaport() {
    return this.request<{
      success: boolean;
      data?: any[];
      message?: string;
    }>('/status-bagi-raport');
  }

  async updateStatusBagiRaport(id: string, data: any) {
    return this.request<{
      success: boolean;
      data?: any;
      message?: string;
    }>(`/status-bagi-raport/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async createStatusBagiRaport(data: any) {
    return this.request<{
      success: boolean;
      data?: any;
      message?: string;
    }>('/status-bagi-raport', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Riwayat Wali Kelas endpoints
  async getAllRiwayatWaliKelas() {
    return this.request<{
      success: boolean;
      data?: any[];
      message?: string;
    }>('/riwayat-wali-kelas');
  }

  async getRiwayatWaliKelasByGuruId(guruId: string) {
    return this.request<{
      success: boolean;
      data?: any[];
      message?: string;
    }>(`/riwayat-wali-kelas/guru/${guruId}`);
  }

  async createRiwayatWaliKelas(data: any) {
    return this.request<{
      success: boolean;
      data?: any;
      message?: string;
    }>('/riwayat-wali-kelas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Info Sekolah endpoints
  async getAllInfoSekolah() {
    return this.request<{
      success: boolean;
      data?: any[];
      message?: string;
    }>('/info-sekolah');
  }

  async getInfoSekolahById(id: string) {
    return this.request<{
      success: boolean;
      data?: any;
      message?: string;
    }>(`/info-sekolah/${id}`);
  }

  async createInfoSekolah(data: any) {
    return this.request<{
      success: boolean;
      data?: any;
      message?: string;
    }>('/info-sekolah', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInfoSekolah(id: string, data: any) {
    return this.request<{
      success: boolean;
      data?: any;
      message?: string;
    }>(`/info-sekolah/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInfoSekolah(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/info-sekolah/${id}`, {
      method: 'DELETE',
    });
  }

  async getInfoSekolahByFilter(params: { jenis?: string; target?: string; isActive?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params.jenis) queryParams.append('jenis', params.jenis);
    if (params.target) queryParams.append('target', params.target);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    return this.request<{
      success: boolean;
      data?: any[];
      message?: string;
    }>(`/info-sekolah/filter?${queryParams.toString()}`);
  }

  // Pengumuman Kelulusan endpoints
  async getAllPengumumanKelulusan() {
    return this.request<{
      success: boolean;
      data?: any[];
      message?: string;
    }>('/pengumuman-kelulusan');
  }

  async getPengumumanKelulusanById(id: string) {
    return this.request<{
      success: boolean;
      data?: any;
      message?: string;
    }>(`/pengumuman-kelulusan/${id}`);
  }

  async createPengumumanKelulusan(data: any) {
    return this.request<{
      success: boolean;
      data?: any;
      message?: string;
    }>('/pengumuman-kelulusan', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePengumumanKelulusan(id: string, data: any) {
    return this.request<{
      success: boolean;
      data?: any;
      message?: string;
    }>(`/pengumuman-kelulusan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePengumumanKelulusan(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/pengumuman-kelulusan/${id}`, {
      method: 'DELETE',
    });
  }

  async getPengumumanKelulusanByFilter(params: { tahunAjaran?: string; isPublished?: boolean; isProcessed?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params.tahunAjaran) queryParams.append('tahunAjaran', params.tahunAjaran);
    if (params.isPublished !== undefined) queryParams.append('isPublished', params.isPublished.toString());
    if (params.isProcessed !== undefined) queryParams.append('isProcessed', params.isProcessed.toString());
    
    return this.request<{
      success: boolean;
      data?: any[];
      message?: string;
    }>(`/pengumuman-kelulusan/filter?${queryParams.toString()}`);
  }

  async getActivePengumumanKelulusan(tahunAjaran?: string) {
    const queryParams = new URLSearchParams();
    if (tahunAjaran) queryParams.append('tahunAjaran', tahunAjaran);
    
    return this.request<{
      success: boolean;
      data?: any | null;
      message?: string;
    }>(`/pengumuman-kelulusan/active?${queryParams.toString()}`);
  }

  // Read Notifications endpoints
  async getReadNotificationsByUserId(userId: string) {
    return this.request<{
      success: boolean;
      data?: {
        userId: string;
        readNotificationIds: string[];
      };
      message?: string;
    }>(`/read-notifications/user/${userId}`);
  }

  async upsertReadNotifications(userId: string, readNotificationIds: string[]) {
    return this.request<{
      success: boolean;
      data?: {
        userId: string;
        readNotificationIds: string[];
      };
      message?: string;
    }>('/read-notifications/upsert', {
      method: 'POST',
      body: JSON.stringify({ userId, readNotificationIds }),
    });
  }

  async markNotificationAsRead(userId: string, notificationId: string) {
    return this.request<{
      success: boolean;
      data?: {
        userId: string;
        readNotificationIds: string[];
      };
      message?: string;
    }>('/read-notifications/mark-as-read', {
      method: 'POST',
      body: JSON.stringify({ userId, notificationId }),
    });
  }

  async markMultipleNotificationsAsRead(userId: string, notificationIds: string[]) {
    return this.request<{
      success: boolean;
      data?: {
        userId: string;
        readNotificationIds: string[];
      };
      message?: string;
    }>('/read-notifications/mark-multiple-as-read', {
      method: 'POST',
      body: JSON.stringify({ userId, notificationIds }),
    });
  }

  // Has Given Kenaikan Kelas Info endpoints
  async getHasGivenKenaikanKelasInfo(tahunAjaran: string, semester: number) {
    const queryParams = new URLSearchParams();
    queryParams.append('tahunAjaran', tahunAjaran);
    queryParams.append('semester', semester.toString());
    
    return this.request<{
      success: boolean;
      data?: { hasGiven: boolean; id?: string; tahunAjaran?: string; semester?: number };
      message?: string;
    }>(`/has-given-kenaikan-kelas-info?${queryParams.toString()}`);
  }

  async setHasGivenKenaikanKelasInfo(tahunAjaran: string, semester: number, hasGiven: boolean = true) {
    return this.request<{
      success: boolean;
      data?: any;
      message?: string;
    }>('/has-given-kenaikan-kelas-info', {
      method: 'POST',
      body: JSON.stringify({ tahunAjaran, semester, hasGiven }),
    });
  }

  async deleteHasGivenKenaikanKelasInfo(tahunAjaran: string, semester: number) {
    const queryParams = new URLSearchParams();
    queryParams.append('tahunAjaran', tahunAjaran);
    queryParams.append('semester', semester.toString());
    
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/has-given-kenaikan-kelas-info?${queryParams.toString()}`, {
      method: 'DELETE',
    });
  }

  // Capaian Pembelajaran endpoints
  async getAllCapaianPembelajaran(params?: { guruId?: string; tingkat?: number; mataPelajaranId?: string; tahunAjaran?: string; semester?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.guruId) queryParams.append('guruId', params.guruId);
    if (params?.tingkat) queryParams.append('tingkat', params.tingkat.toString());
    if (params?.mataPelajaranId) queryParams.append('mataPelajaranId', params.mataPelajaranId);
    if (params?.tahunAjaran) queryParams.append('tahunAjaran', params.tahunAjaran);
    if (params?.semester) queryParams.append('semester', params.semester.toString());
    
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      capaianPembelajaran?: any[];
      count?: number;
      message?: string;
    }>(`/capaian-pembelajaran${queryString ? `?${queryString}` : ''}`);
  }

  async getCapaianPembelajaranById(id: string) {
    return this.request<{
      success: boolean;
      capaianPembelajaran?: any;
      message?: string;
    }>(`/capaian-pembelajaran/${id}`);
  }

  async createCapaianPembelajaran(data: { guruId: string; tingkat: number; mataPelajaranId: string; capaianPembelajaran: string; tahunAjaran: string; semester: number }) {
    return this.request<{
      success: boolean;
      capaianPembelajaran?: any;
      message?: string;
    }>('/capaian-pembelajaran', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCapaianPembelajaran(id: string, data: { capaianPembelajaran: string }) {
    return this.request<{
      success: boolean;
      capaianPembelajaran?: any;
      message?: string;
    }>(`/capaian-pembelajaran/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCapaianPembelajaran(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/capaian-pembelajaran/${id}`, {
      method: 'DELETE',
    });
  }

  // Capaian Pembelajaran Kelas endpoints (new structure)
  async getCapaianPembelajaranKelas(params: { guruId: string; tahunAjaran: string; semester: number }) {
    const queryParams = new URLSearchParams();
    queryParams.append('guruId', params.guruId);
    queryParams.append('tahunAjaran', params.tahunAjaran);
    queryParams.append('semester', params.semester.toString());
    
    return this.request<{
      success: boolean;
      capaianPembelajaran?: any;
      message?: string;
    }>(`/capaian-pembelajaran/guru?${queryParams.toString()}`);
  }

  async createOrUpdateCapaianPembelajaranKelas(data: {
    guruId: string;
    tahunAjaran: string;
    semester: number;
    tingkatData: Array<{
      tingkat: number;
      mataPelajaranData: Array<{
        mataPelajaranId: string;
        capaianPembelajaran: string;
      }>;
    }>;
  }) {
    return this.request<{
      success: boolean;
      capaianPembelajaran?: any;
      message?: string;
    }>('/capaian-pembelajaran/guru', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addOrUpdateCapaianPembelajaranItem(data: {
    guruId: string;
    tahunAjaran: string;
    semester: number;
    tingkat: number;
    mataPelajaranId: string;
    capaianPembelajaran: string;
  }) {
    return this.request<{
      success: boolean;
      capaianPembelajaran?: any;
      message?: string;
    }>('/capaian-pembelajaran/item', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteCapaianPembelajaranItem(data: {
    guruId: string;
    tahunAjaran: string;
    semester: number;
    tingkat: number;
    mataPelajaranId: string;
  }) {
    return this.request<{
      success: boolean;
      capaianPembelajaran?: any;
      message?: string;
    }>('/capaian-pembelajaran/item', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  // Ekstrakulikuler endpoints
  async getAllEkstrakulikuler(params?: { isActive?: boolean }) {
    const queryParams = new URLSearchParams();
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      ekstrakulikuler?: any[];
      count?: number;
      message?: string;
    }>(`/ekstrakulikuler${queryString ? `?${queryString}` : ''}`);
  }

  async getEkstrakulikulerById(id: string) {
    return this.request<{
      success: boolean;
      ekstrakulikuler?: any;
      message?: string;
    }>(`/ekstrakulikuler/${id}`);
  }

  async createEkstrakulikuler(data: { nama: string; deskripsi?: string; pembinaId: string }) {
    return this.request<{
      success: boolean;
      ekstrakulikuler?: any;
      message?: string;
    }>('/ekstrakulikuler', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateEkstrakulikuler(id: string, data: { nama?: string; deskripsi?: string; pembinaId?: string; isActive?: boolean }) {
    return this.request<{
      success: boolean;
      ekstrakulikuler?: any;
      message?: string;
    }>(`/ekstrakulikuler/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteEkstrakulikuler(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/ekstrakulikuler/${id}`, {
      method: 'DELETE',
    });
  }

  // Nilai Ekstrakulikuler endpoints
  async getAllNilaiEkstrakulikuler(params?: { 
    muridId?: string; 
    kelasId?: string; 
    semester?: number; 
    tahunAjaran?: string;
    ekstrakulikulerId?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.muridId) queryParams.append('muridId', params.muridId);
    if (params?.kelasId) queryParams.append('kelasId', params.kelasId);
    if (params?.semester !== undefined) queryParams.append('semester', params.semester.toString());
    if (params?.tahunAjaran) queryParams.append('tahunAjaran', params.tahunAjaran);
    if (params?.ekstrakulikulerId) queryParams.append('ekstrakulikulerId', params.ekstrakulikulerId);
    
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      nilaiEkstrakulikuler?: any[];
      count?: number;
      message?: string;
    }>(`/nilai-ekstrakulikuler${queryString ? `?${queryString}` : ''}`);
  }

  async getNilaiEkstrakulikulerByMuridId(muridId: string, params?: { 
    semester?: number; 
    tahunAjaran?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.semester !== undefined) queryParams.append('semester', params.semester.toString());
    if (params?.tahunAjaran) queryParams.append('tahunAjaran', params.tahunAjaran);
    
    const queryString = queryParams.toString();
    return this.request<{
      success: boolean;
      nilaiEkstrakulikuler?: any[];
      count?: number;
      message?: string;
    }>(`/nilai-ekstrakulikuler/murid/${muridId}${queryString ? `?${queryString}` : ''}`);
  }

  async getNilaiEkstrakulikulerById(id: string) {
    return this.request<{
      success: boolean;
      nilaiEkstrakulikuler?: any;
      message?: string;
    }>(`/nilai-ekstrakulikuler/${id}`);
  }

  async createNilaiEkstrakulikuler(data: { 
    muridId: string; 
    ekstrakulikulerId: string; 
    nilai: number; 
    semester: number; 
    tahunAjaran: string;
  }) {
    return this.request<{
      success: boolean;
      nilaiEkstrakulikuler?: any;
      message?: string;
    }>('/nilai-ekstrakulikuler', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNilaiEkstrakulikuler(id: string, data: { 
    nilai?: number; 
    ekstrakulikulerId?: string;
  }) {
    return this.request<{
      success: boolean;
      nilaiEkstrakulikuler?: any;
      message?: string;
    }>(`/nilai-ekstrakulikuler/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNilaiEkstrakulikuler(id: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>(`/nilai-ekstrakulikuler/${id}`, {
      method: 'DELETE',
    });
  }

  // Nilai Ekstrakulikuler Kelas endpoints (new structure)
  async getNilaiEkstrakulikulerKelas(params: { kelasId: string; tahunAjaran: string; semester: number }) {
    const queryParams = new URLSearchParams();
    queryParams.append('kelasId', params.kelasId);
    queryParams.append('tahunAjaran', params.tahunAjaran);
    queryParams.append('semester', params.semester.toString());
    
    return this.request<{
      success: boolean;
      nilaiEkstrakulikuler?: any;
      message?: string;
    }>(`/nilai-ekstrakulikuler/kelas?${queryParams.toString()}`);
  }

  async createOrUpdateNilaiEkstrakulikulerKelas(data: {
    kelasId: string;
    waliKelasId: string;
    tahunAjaran: string;
    semester: number;
    muridData: Array<{
      muridId: string;
      nilaiEkstrakulikuler: Array<{
        ekstrakulikulerId: string;
        nilai: number;
        predikat: string;
        keterangan: string;
      }>;
    }>;
  }) {
    return this.request<{
      success: boolean;
      nilaiEkstrakulikuler?: any;
      message?: string;
    }>('/nilai-ekstrakulikuler/kelas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addOrUpdateNilaiEkstrakulikulerMurid(data: {
    kelasId: string;
    tahunAjaran: string;
    semester: number;
    muridId: string;
    ekstrakulikulerId: string;
    nilai: number;
  }) {
    return this.request<{
      success: boolean;
      nilaiEkstrakulikuler?: any;
      message?: string;
    }>('/nilai-ekstrakulikuler/murid', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteNilaiEkstrakulikulerMurid(data: {
    kelasId: string;
    tahunAjaran: string;
    semester: number;
    muridId: string;
    ekstrakulikulerId: string;
  }) {
    return this.request<{
      success: boolean;
      nilaiEkstrakulikuler?: any;
      message?: string;
    }>('/nilai-ekstrakulikuler/murid', {
      method: 'DELETE',
      body: JSON.stringify(data),
    });
  }

  // Kokulikuler endpoints
  async getKokulikuler(params: { kelasId: string; tahunAjaran: string; semester: number }) {
    const queryParams = new URLSearchParams();
    queryParams.append('kelasId', params.kelasId);
    queryParams.append('tahunAjaran', params.tahunAjaran);
    queryParams.append('semester', params.semester.toString());
    
    return this.request<{
      success: boolean;
      kokulikuler?: any;
      message?: string;
    }>(`/kokulikuler?${queryParams.toString()}`);
  }

  async createOrUpdateKokulikuler(data: {
    kelasId: string;
    waliKelasId: string;
    tahunAjaran: string;
    semester: number;
    muridData: Array<{ muridId: string; kokulikuler: string }>;
  }) {
    return this.request<{
      success: boolean;
      kokulikuler?: any;
      message?: string;
    }>('/kokulikuler', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateKokulikulerMurid(data: {
    kelasId: string;
    tahunAjaran: string;
    semester: number;
    muridId: string;
    kokulikuler: string;
    waliKelasId?: string;
  }) {
    return this.request<{
      success: boolean;
      kokulikuler?: any;
      message?: string;
    }>('/kokulikuler/murid', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async generateERaport(data: {
    kelasId: string;
    tahunAjaran: string;
    semester: number;
  }) {
    return this.request<{
      success: boolean;
      eraport?: any;
      message?: string;
    }>('/e-raport/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getERaport(params: {
    kelasId: string;
    tahunAjaran: string;
    semester: number;
  }) {
    const queryParams = new URLSearchParams();
    queryParams.append('kelasId', params.kelasId);
    queryParams.append('tahunAjaran', params.tahunAjaran);
    queryParams.append('semester', params.semester.toString());
    
    return this.request<{
      success: boolean;
      eraport?: any;
      message?: string;
    }>(`/e-raport?${queryParams.toString()}`);
  }

  async getERaportByMurid(params: {
    kelasId: string;
    tahunAjaran: string;
    semester: number;
    muridId: string;
  }) {
    const queryParams = new URLSearchParams();
    queryParams.append('kelasId', params.kelasId);
    queryParams.append('tahunAjaran', params.tahunAjaran);
    queryParams.append('semester', params.semester.toString());
    queryParams.append('muridId', params.muridId);
    
    return this.request<{
      success: boolean;
      eraport?: any;
      message?: string;
    }>(`/e-raport/by-murid?${queryParams.toString()}`);
  }

  // Reset Database endpoint
  async resetDatabase(activationPassword: string) {
    return this.request<{
      success: boolean;
      message?: string;
    }>('/reset-database', {
      method: 'POST',
      body: JSON.stringify({ activationPassword }),
    });
  }
}

export const apiService = new ApiService();

