import React from 'react';
import { Users, Award } from 'lucide-react';
import Card from '../../../ui/Card';
import Badge from '../../../ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../../ui/Table';
import { KelulusanData } from './InfoKelulusanUtils';
import { getNilaiMinimalSettings } from '../../../../utils/nilaiUtils';

interface MuridTerbaikSekolahProps {
  muridTerbaik: KelulusanData[];
  currentUserId: string | undefined;
}

const MuridTerbaikSekolah: React.FC<MuridTerbaikSekolahProps> = ({
  muridTerbaik,
  currentUserId
}) => {
  // Get nilai minimal settings from database (via cache)
  const minimalSettings = getNilaiMinimalSettings();

  // Function to determine status based on nilai akhir and kehadiran
  const getStatus = (nilaiAkhir: number, kehadiran: number) => {
    const nilaiAkhirTerpenuhi = nilaiAkhir >= minimalSettings.nilaiAkhirMinimal;
    const kehadiranTerpenuhi = kehadiran >= minimalSettings.tingkatKehadiranMinimal;
    
    // Terpenuhi: nilai akhir >= minimal AND kehadiran >= minimal
    if (nilaiAkhirTerpenuhi && kehadiranTerpenuhi) {
      return { text: 'Terpenuhi', variant: 'success' as const };
    }
    
    // Kurang: nilai akhir < minimal OR kehadiran < minimal
    return { text: 'Kurang', variant: 'warning' as const };
  };

  return (
    <Card className="p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Murid Terbaik Sekolah</h3>

      {muridTerbaik.length > 0 ? (
        <>
          {/* Mobile Card Layout */}
          <div className="block sm:hidden space-y-3">
            {muridTerbaik.map((data, index) => {
              const status = getStatus(data.nilaiAkhir, data.kehadiran);
              return (
                <div
                  key={data.murid.id}
                  className={`p-3 rounded-lg border ${
                    index < 3 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'
                  } ${
                    data.murid.id === currentUserId ? 'ring-2 ring-blue-500 border-blue-300' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {index < 3 && (
                        <Award className={`w-4 h-4 flex-shrink-0 ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-500' : 'text-orange-500'
                        }`} />
                      )}
                      <span className="font-bold text-sm text-gray-900">#{index + 1}</span>
                    </div>
                    <Badge variant={status.variant} size="sm">
                      {status.text}
                    </Badge>
                  </div>
                  <div className="font-semibold text-sm text-gray-900 mb-1">
                    {data.murid.name}
                    {data.murid.id === currentUserId && (
                      <span className="ml-1.5 text-blue-600 text-xs font-normal">(Anda)</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="info" size="sm">{data.kelas?.name}</Badge>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Rata-rata</div>
                      <div className="font-bold text-sm text-gray-900">{data.nilaiAkhir.toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Peringkat</TableCell>
                  <TableCell header>Nama Murid</TableCell>
                  <TableCell header>Kelas</TableCell>
                  <TableCell header>Rata-rata Nilai</TableCell>
                  <TableCell header>Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {muridTerbaik.map((data, index) => (
                  <TableRow key={data.murid.id} className={`
                    ${index < 3 ? 'bg-yellow-50' : ''}
                    ${data.murid.id === currentUserId ? 'ring-2 ring-blue-500' : ''}
                  `}>
                    <TableCell>
                      <div className="flex items-center">
                        {index < 3 && (
                          <Award className={`w-5 h-5 mr-2 ${
                            index === 0 ? 'text-yellow-500' :
                            index === 1 ? 'text-gray-500' : 'text-orange-500'
                          }`} />
                        )}
                        <span className="font-bold">{index + 1}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {data.murid.name}
                        {data.murid.id === currentUserId && (
                          <span className="ml-2 text-blue-600 text-sm">(Anda)</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info">{data.kelas?.name}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-center font-bold">
                        {data.nilaiAkhir.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = getStatus(data.nilaiAkhir, data.kehadiran);
                        return (
                          <Badge variant={status.variant}>
                            {status.text}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="text-center py-6 sm:py-8 text-gray-500">
          <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-gray-300" />
          <p className="text-sm sm:text-base">Belum ada data murid</p>
        </div>
      )}
    </Card>
  );
};

export default MuridTerbaikSekolah;
