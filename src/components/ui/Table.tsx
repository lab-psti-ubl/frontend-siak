import React, { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableHeaderProps {
  children: ReactNode;
}

interface TableBodyProps {
  children: ReactNode;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
  header?: boolean;
  rowSpan?: number;
  colSpan?: number;
}

const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className={`min-w-full border-collapse ${className}`}>
        {children}
      </table>
    </div>
  );
};

const TableHeader: React.FC<TableHeaderProps> = ({ children }) => {
  return (
    <thead className="bg-gray-50">
      {children}
    </thead>
  );
};

const TableBody: React.FC<TableBodyProps> = ({ children }) => {
  return (
    <tbody className="bg-white">
      {children}
    </tbody>
  );
};

const TableRow: React.FC<TableRowProps> = ({ children, className = '', onClick }) => {
  return (
    <tr 
      className={`${onClick ? 'hover:bg-gray-50 cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

const TableCell: React.FC<TableCellProps> = ({ children, className = '', header = false, rowSpan, colSpan }) => {
  const baseClasses = 'px-6 py-4 text-sm border border-gray-300';
  const headerClasses = 'font-medium text-gray-900 uppercase tracking-wider';
  const cellClasses = 'text-gray-900';

  const Tag = header ? 'th' : 'td';

  return (
    <Tag 
      className={`${baseClasses} ${header ? headerClasses : cellClasses} ${className}`}
      rowSpan={rowSpan}
      colSpan={colSpan}
    >
      {children}
    </Tag>
  );
};

export { Table, TableHeader, TableBody, TableRow, TableCell };