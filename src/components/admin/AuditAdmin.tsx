"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuditAdmin() {
  const supabase = createClient();
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setRows(data || []));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1F2C3F] mb-4">Journal d&apos;audit</h2>
      <p className="text-sm text-stone-600 mb-4">
        Dernières actions administrateur (validation, export TMH, etc.).
      </p>
      <div className="overflow-x-auto bg-white border rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Utilisateur</th>
              <th className="p-3">Action</th>
              <th className="p-3">Objet</th>
              <th className="p-3">Détail</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-stone-500">
                  Aucune entrée pour le moment.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3 whitespace-nowrap text-xs">
                    {r.created_at ? new Date(r.created_at).toLocaleString("fr-FR") : ""}
                  </td>
                  <td className="p-3 text-xs">{r.user_email}</td>
                  <td className="p-3 font-medium">{r.action}</td>
                  <td className="p-3">{r.objet}</td>
                  <td className="p-3 text-xs text-stone-500">{r.detail}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
