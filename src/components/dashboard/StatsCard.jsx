import React from "react";
import { motion } from "framer-motion";

export default function StatsCard({ title, value, icon: Icon, color, subtitle }) {
  const colorMap = {
    amber: "from-amber-400 to-amber-500",
    blue: "from-blue-400 to-blue-500",
    green: "from-emerald-400 to-emerald-500",
    red: "from-rose-400 to-rose-500",
    purple: "from-violet-400 to-violet-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[color] || colorMap.amber}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}