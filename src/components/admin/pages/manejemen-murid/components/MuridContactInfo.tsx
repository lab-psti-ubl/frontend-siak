import React from 'react';
import { Mail, Phone } from 'lucide-react';
import Card from '../../../../ui/Card';
import { User } from '../../../../../types';

interface MuridContactInfoProps {
  murid: User;
  onWhatsAppCall: (phone: string) => void;
}

const MuridContactInfo: React.FC<MuridContactInfoProps> = ({
  murid,
  onWhatsAppCall
}) => {
  return (
    <Card className="p-4">
      <h4 className="font-semibold text-gray-900 mb-3">Informasi Kontak</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Email:</span>
          <span className="font-medium text-gray-900">{murid.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">WhatsApp Ortu:</span>
          {murid.whatsappOrtu ? (
            <button
              onClick={() => onWhatsAppCall(murid.whatsappOrtu || '')}
              className="font-medium text-green-600 hover:text-green-700 transition-colors"
              title="Hubungi via WhatsApp"
            >
              {murid.whatsappOrtu}
            </button>
          ) : (
            <span className="font-medium text-gray-900">-</span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Bergabung:</span>
          <span className="font-medium text-gray-900">
            {murid.createdAt ? new Date(murid.createdAt).toLocaleDateString('id-ID') : '-'}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default MuridContactInfo;