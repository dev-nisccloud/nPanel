/**
 * StatCard Component - Simple metric display card
 * Based on OpenSEO's StatCard pattern
 */

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

export function StatCard({ label, value, trend, icon }: StatCardProps) {
  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wide text-base-content/60">
            {label}
          </p>
          {icon && <div className="text-base-content/40">{icon}</div>}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="text-2xl font-semibold">{value}</p>
          {trend && (
            <span
              className={`text-sm ${
                trend.isPositive ? "text-success" : "text-error"
              }`}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * MetricCard Component - More detailed metric card with description
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function MetricCard({
  title,
  value,
  description,
  trend,
  icon,
  action,
}: MetricCardProps) {
  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm">
      <div className="card-body">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {icon && <div className="text-primary">{icon}</div>}
              <h3 className="text-sm font-medium text-base-content/70">{title}</h3>
            </div>
            <div className="mt-2 flex items-baseline gap-3">
              <p className="text-3xl font-bold">{value}</p>
              {trend && (
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-medium ${
                      trend.isPositive ? "text-success" : "text-error"
                    }`}
                  >
                    {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                  </span>
                  <span className="text-xs text-base-content/60">{trend.label}</span>
                </div>
              )}
            </div>
            {description && (
              <p className="mt-2 text-sm text-base-content/70">{description}</p>
            )}
          </div>
          {action && (
            <button onClick={action.onClick} className="btn btn-ghost btn-sm">
              {action.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * StatsGrid Component - Grid container for stat cards
 */
interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ children, columns = 4 }: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {children}
    </div>
  );
}
