import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Building2, ChevronRight, FileText, Trophy, Plus, Save, Trash2, Pencil, ArrowLeft, Upload, X } from 'lucide-react';
import Card from '../../../ui/Card';
import Button from '../../../ui/Button';
import { apiService } from '../../../../services/apiService';
import { LandingBerita, LandingPrestasi } from '../../../../types';

type TabId = 'berita' | 'prestasi';

const toInputDate = (iso: string | undefined) => {
  if (!iso) return '';
  // accept YYYY-MM-DD or full ISO; keep first 10 chars
  return iso.slice(0, 10);
};

const LandingpageSekolah: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('berita');
  const [isMobileDetailView, setIsMobileDetailView] = useState(false);

  const tabs = useMemo(
    () => [
      { id: 'berita' as const, label: 'Berita', icon: FileText },
      { id: 'prestasi' as const, label: 'Prestasi', icon: Trophy },
    ],
    []
  );

  const getTabLabel = (tabId: TabId) => tabs.find((t) => t.id === tabId)?.label || '';

  const handleMenuClick = (tabId: TabId) => {
    setActiveTab(tabId);
    setIsMobileDetailView(true);
  };

  const handleBackClick = () => setIsMobileDetailView(false);

  return (
    <div className="space-y-5 sm:space-y-6 lg:space-y-6">
      <div className="bg-gradient-to-br from-emerald-700 via-emerald-700 to-emerald-500 rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8">
          <div className="flex flex-col gap-2 sm:gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 sm:p-3 bg-white rounded-lg">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-700" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Landingpage Sekolah</h1>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100">
              Kelola konten yang tampil di halaman <span className="font-semibold">/profile-sekolah</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Menu View */}
      {!isMobileDetailView && (
        <div className="lg:hidden">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">Pilih Menu</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleMenuClick(tab.id)}
                    className="w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-4 text-left transition-all duration-200 hover:bg-emerald-50 active:bg-emerald-100"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700" />
                      </div>
                      <span className="text-sm sm:text-base font-medium text-slate-900">{tab.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Desktop + Mobile Detail View */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 ${isMobileDetailView ? 'block lg:grid' : 'hidden lg:grid'}`}>
        <div className="lg:col-span-1 space-y-3 hidden lg:block">
          <div className="bg-white rounded-lg sm:rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900">Menu</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 text-left transition-all duration-200 ${
                      isActive ? 'bg-emerald-50 border-l-4 border-emerald-700' : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                      <span className={`text-xs sm:text-sm font-medium truncate ${isActive ? 'text-emerald-800' : 'text-slate-600'}`}>
                        {tab.label}
                      </span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4 text-emerald-700 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Detail View Header */}
        {isMobileDetailView && (
          <div className="lg:hidden mb-4">
            <button onClick={handleBackClick} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors mb-4">
              <ArrowLeft className="w-5 h-5 text-emerald-700" />
              <span className="text-sm font-medium text-emerald-700">Kembali</span>
            </button>
            <div className="bg-gradient-to-br from-emerald-700 to-emerald-600 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-white">{getTabLabel(activeTab)}</h2>
            </div>
          </div>
        )}

        <div className={`lg:col-span-2 space-y-5 sm:space-y-6 ${isMobileDetailView ? 'block' : 'hidden lg:block'}`}>
          {activeTab === 'berita' && <BeritaTab />}
          {activeTab === 'prestasi' && <PrestasiTab />}
        </div>
      </div>
    </div>
  );
};

const ImageUploadField: React.FC<{
  value?: string;
  onUploaded: (url: string) => void;
  upload: (file: File) => Promise<{ success: boolean; url?: string; message?: string }>;
  label: string;
}> = ({ value, onUploaded, upload, label }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const choose = () => fileInputRef.current?.click();

  const remove = () => {
    onUploaded('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      setUploading(true);
      const res = await upload(file);
      if (!res.success || !res.url) throw new Error(res.message || 'Gagal upload gambar');
      onUploaded(res.url);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Gagal upload gambar');
    } finally {
      setUploading(false);
      // allow re-select same file
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onChange} className="hidden" />
      {value ? (
        <div className="flex items-start gap-4">
          <img src={value} alt="Preview" className="h-28 w-40 object-cover rounded-lg border border-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="text-xs text-slate-500 break-all">{value}</div>
            <div className="flex gap-2">
              <Button onClick={choose} variant="secondary" disabled={uploading} className="flex items-center gap-2">
                <Upload className="w-4 h-4" /> Ganti
              </Button>
              <Button onClick={remove} variant="danger" disabled={uploading} className="flex items-center gap-2">
                <X className="w-4 h-4" /> Hapus
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <Button onClick={choose} variant="secondary" disabled={uploading} className="flex items-center gap-2 w-full sm:w-auto">
          <Upload className="w-4 h-4" /> {uploading ? 'Mengunggah...' : 'Upload Gambar'}
        </Button>
      )}
      {error ? <div className="text-sm text-red-700">{error}</div> : null}
    </div>
  );
};

const BeritaTab: React.FC = () => {
  const [items, setItems] = useState<LandingBerita[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<LandingBerita>>({
    title: '',
    excerpt: '',
    content: '',
    date: toInputDate(new Date().toISOString()),
    imageUrl: '',
    isPublished: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAllLandingBerita();
      if (res.success && res.berita) setItems(res.berita);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: '',
      excerpt: '',
      content: '',
      date: toInputDate(new Date().toISOString()),
      imageUrl: '',
      isPublished: true,
    });
  };

  const startEdit = (item: LandingBerita) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      date: toInputDate(item.date),
      imageUrl: item.imageUrl || '',
      isPublished: item.isPublished,
    });
  };

  const submit = async () => {
    setMessage({ type: '', text: '' });
    try {
      if (!form.title?.trim() || !form.excerpt?.trim() || !form.content?.trim() || !form.date?.trim()) {
        setMessage({ type: 'error', text: 'Judul, ringkasan, isi, dan tanggal wajib diisi.' });
        return;
      }

      if (editingId) {
        const res = await apiService.updateLandingBerita(editingId, form);
        if (!res.success) throw new Error(res.message || 'Gagal memperbarui berita');
        setMessage({ type: 'success', text: res.message || 'Berita berhasil diperbarui.' });
      } else {
        const res = await apiService.createLandingBerita(form);
        if (!res.success) throw new Error(res.message || 'Gagal membuat berita');
        setMessage({ type: 'success', text: res.message || 'Berita berhasil dibuat.' });
      }

      await load();
      resetForm();
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: e?.message || 'Terjadi kesalahan.' });
    } finally {
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const remove = async (id: string) => {
    const ok = window.confirm('Hapus berita ini?');
    if (!ok) return;
    try {
      const res = await apiService.deleteLandingBerita(id);
      if (!res.success) throw new Error(res.message || 'Gagal menghapus berita');
      setMessage({ type: 'success', text: res.message || 'Berita berhasil dihapus.' });
      await load();
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: e?.message || 'Terjadi kesalahan.' });
    } finally {
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-0 shadow-lg">
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Kelola Berita</h3>
              <p className="text-sm text-slate-600">Data berita ini akan tampil di menu Berita pada halaman `/profile-sekolah`.</p>
            </div>
            <Button onClick={resetForm} variant="secondary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Baru
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Judul</label>
              <input
                value={form.title || ''}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Judul berita"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
              <input
                type="date"
                value={toInputDate(form.date)}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ringkasan</label>
              <textarea
                value={form.excerpt || ''}
                onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={3}
                placeholder="Ringkasan singkat"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Isi</label>
              <textarea
                value={form.content || ''}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={6}
                placeholder="Isi berita"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUploadField
                label="Gambar (opsional)"
                value={form.imageUrl || ''}
                onUploaded={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
                upload={async (file) => apiService.uploadLandingBeritaImage(file)}
              />
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={form.isPublished !== false}
                    onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  Tampilkan (Published)
                </label>
              </div>
            </div>
          </div>

          {message.text ? (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            {editingId ? (
              <Button onClick={resetForm} variant="secondary">
                Batal
              </Button>
            ) : null}
            <Button onClick={submit} className="flex items-center gap-2">
              <Save className="w-4 h-4" /> {editingId ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-0 shadow-lg">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Daftar Berita</h3>
            <Button onClick={load} variant="secondary">
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-600">Memuat...</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-slate-600">Belum ada berita.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-slate-900 truncate">{item.title}</div>
                      <span
                        className={`text-[0.7rem] font-semibold px-2.5 py-1 rounded-full ${
                          item.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(item.date).toLocaleDateString('id-ID')} • <span className="truncate">{item.id}</span>
                    </div>
                    <div className="text-sm text-slate-600 mt-2 line-clamp-2">{item.excerpt}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button onClick={() => startEdit(item)} variant="secondary" className="flex items-center gap-2">
                      <Pencil className="w-4 h-4" /> Edit
                    </Button>
                    <Button onClick={() => remove(item.id)} variant="danger" className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

const PrestasiTab: React.FC = () => {
  const [items, setItems] = useState<LandingPrestasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<LandingPrestasi>>({
    title: '',
    excerpt: '',
    content: '',
    date: toInputDate(new Date().toISOString()),
    level: 'Kota',
    imageUrl: '',
    isPublished: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.getAllLandingPrestasi();
      if (res.success && res.prestasi) setItems(res.prestasi);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      title: '',
      excerpt: '',
      content: '',
      date: toInputDate(new Date().toISOString()),
      level: 'Kota',
      imageUrl: '',
      isPublished: true,
    });
  };

  const startEdit = (item: LandingPrestasi) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      excerpt: item.excerpt,
      content: item.content,
      date: toInputDate(item.date),
      level: item.level,
      imageUrl: item.imageUrl || '',
      isPublished: item.isPublished,
    });
  };

  const submit = async () => {
    setMessage({ type: '', text: '' });
    try {
      if (!form.title?.trim() || !form.excerpt?.trim() || !form.content?.trim() || !form.date?.trim()) {
        setMessage({ type: 'error', text: 'Judul, ringkasan, isi, dan tanggal wajib diisi.' });
        return;
      }

      if (editingId) {
        const res = await apiService.updateLandingPrestasi(editingId, form);
        if (!res.success) throw new Error(res.message || 'Gagal memperbarui prestasi');
        setMessage({ type: 'success', text: res.message || 'Prestasi berhasil diperbarui.' });
      } else {
        const res = await apiService.createLandingPrestasi(form);
        if (!res.success) throw new Error(res.message || 'Gagal membuat prestasi');
        setMessage({ type: 'success', text: res.message || 'Prestasi berhasil dibuat.' });
      }

      await load();
      resetForm();
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: e?.message || 'Terjadi kesalahan.' });
    } finally {
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const remove = async (id: string) => {
    const ok = window.confirm('Hapus prestasi ini?');
    if (!ok) return;
    try {
      const res = await apiService.deleteLandingPrestasi(id);
      if (!res.success) throw new Error(res.message || 'Gagal menghapus prestasi');
      setMessage({ type: 'success', text: res.message || 'Prestasi berhasil dihapus.' });
      await load();
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: e?.message || 'Terjadi kesalahan.' });
    } finally {
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  return (
    <div className="space-y-5">
      <Card className="border-0 shadow-lg">
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Kelola Prestasi</h3>
              <p className="text-sm text-slate-600">Data prestasi ini akan tampil di menu Prestasi pada halaman `/profile-sekolah`.</p>
            </div>
            <Button onClick={resetForm} variant="secondary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Baru
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Judul</label>
              <input
                value={form.title || ''}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Judul prestasi"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                <input
                  type="date"
                  value={toInputDate(form.date)}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tingkat</label>
                <select
                  value={form.level || ''}
                  onChange={(e) => setForm((p) => ({ ...p, level: e.target.value as any }))}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="Kota">Kota</option>
                  <option value="Provinsi">Provinsi</option>
                  <option value="Nasional">Nasional</option>
                  <option value="Internasional">Internasional</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ringkasan</label>
              <textarea
                value={form.excerpt || ''}
                onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={3}
                placeholder="Ringkasan singkat"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Isi</label>
              <textarea
                value={form.content || ''}
                onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={6}
                placeholder="Isi prestasi"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageUploadField
                label="Gambar (opsional)"
                value={form.imageUrl || ''}
                onUploaded={(url) => setForm((p) => ({ ...p, imageUrl: url }))}
                upload={async (file) => apiService.uploadLandingPrestasiImage(file)}
              />
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
                  <input
                    type="checkbox"
                    checked={form.isPublished !== false}
                    onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
                    className="w-4 h-4"
                  />
                  Tampilkan (Published)
                </label>
              </div>
            </div>
          </div>

          {message.text ? (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.text}
            </div>
          ) : null}

          <div className="flex justify-end gap-2">
            {editingId ? (
              <Button onClick={resetForm} variant="secondary">
                Batal
              </Button>
            ) : null}
            <Button onClick={submit} className="flex items-center gap-2">
              <Save className="w-4 h-4" /> {editingId ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-0 shadow-lg">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Daftar Prestasi</h3>
            <Button onClick={load} variant="secondary">
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-600">Memuat...</div>
          ) : items.length === 0 ? (
            <div className="py-8 text-center text-slate-600">Belum ada prestasi.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold text-slate-900 truncate">{item.title}</div>
                      {item.level ? (
                        <span className="text-[0.7rem] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                          {item.level}
                        </span>
                      ) : null}
                      <span
                        className={`text-[0.7rem] font-semibold px-2.5 py-1 rounded-full ${
                          item.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {item.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(item.date).toLocaleDateString('id-ID')} • <span className="truncate">{item.id}</span>
                    </div>
                    <div className="text-sm text-slate-600 mt-2 line-clamp-2">{item.excerpt}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button onClick={() => startEdit(item)} variant="secondary" className="flex items-center gap-2">
                      <Pencil className="w-4 h-4" /> Edit
                    </Button>
                    <Button onClick={() => remove(item.id)} variant="danger" className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Hapus
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default LandingpageSekolah;

