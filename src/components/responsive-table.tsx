import * as React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const ResponsiveTable = React.forwardRef<HTMLDivElement, ResponsiveTableProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "w-full overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0",
        className
      )}
      {...props}
    >
      <div className="min-w-[600px] lg:min-w-0">
        {children}
      </div>
    </div>
  )
);
ResponsiveTable.displayName = "ResponsiveTable";

interface DataCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const DataCard = React.forwardRef<HTMLDivElement, DataCardProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-white rounded-lg border border-slate-200 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
DataCard.displayName = "DataCard";

interface MobileCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  details: { label: string; value: React.ReactNode }[];
  actions?: React.ReactNode;
}

function MobileCard({ title, subtitle, badge, details, actions }: MobileCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 mb-3 lg:hidden">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-800 truncate">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        {badge && <div className="ml-2 flex-shrink-0">{badge}</div>}
      </div>
      <div className="space-y-2 mb-3">
        {details.map((detail, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="text-slate-500">{detail.label}</span>
            <span className="text-slate-800">{detail.value}</span>
          </div>
        ))}
      </div>
      {actions && <div className="flex gap-2 pt-3 border-t border-slate-100">{actions}</div>}
    </div>
  );
}

export { ResponsiveTable, DataCard, MobileCard };
