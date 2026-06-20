import React from 'react';

interface CourseCardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({ children, title, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-xl dark:shadow-none border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors ${className}`}>
      {title && (
        <div className="bg-slate-50 dark:bg-slate-850 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
      )}
      <div className="p-6 text-slate-900 dark:text-slate-200">
        {children}
      </div>
    </div>
  );
};