import { formatAdminMessage, getAdminDictionary } from "@/lib/admin/i18n";
import { getAdminLocale } from "@/lib/admin/get-locale";
import { requireAdminPage } from "@/lib/auth/server";
import { getTrafficSummary, type TrafficClass } from "@/lib/security/traffic";

const CLASS_ORDER: TrafficClass[] = ["human", "infra", "bot", "scanner", "other"];

export default async function AdminTrafficPage() {
  await requireAdminPage();
  const locale = await getAdminLocale();
  const dict = getAdminDictionary(locale);
  const summary = getTrafficSummary(6 * 3_600_000);
  const nonInfra = summary.sampleCount - summary.byClass.infra;
  const classLabels = dict.traffic.classes;

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-medium text-slate-500">{dict.traffic.eyebrow}</p>
        <h1 className="text-3xl font-bold">{dict.traffic.title}</h1>
        <p className="mt-2 max-w-3xl text-slate-600">{dict.traffic.copy}</p>
        <p className="mt-2 text-sm text-slate-500">{summary.note}</p>
      </div>

      <section aria-label={dict.traffic.metricsAria} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={dict.traffic.samples} value={String(summary.sampleCount)} note={formatAdminMessage(dict.traffic.windowNote, { hours: summary.windowHours })} />
        <Metric label={dict.traffic.uniqueIps} value={String(summary.uniqueIpHashes)} note={dict.traffic.uniqueIpsNote} />
        <Metric label={dict.traffic.humanish} value={String(summary.byClass.human)} note={dict.traffic.humanishNote} />
        <Metric label={dict.traffic.nonInfra} value={String(nonInfra)} note={dict.traffic.nonInfraNote} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title={dict.traffic.byClass}>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3 font-medium">{dict.traffic.class}</th>
                <th className="py-2 font-medium">{dict.traffic.count}</th>
              </tr>
            </thead>
            <tbody>
              {CLASS_ORDER.map((key) => (
                <tr key={key} className="border-b border-slate-100">
                  <td className="py-2 pr-3">{classLabels[key]}</td>
                  <td className="py-2 tabular-nums">{summary.byClass[key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title={dict.traffic.byCountry}>
          {summary.byCountry.length === 0 ? (
            <p className="text-sm text-slate-500">{dict.traffic.empty}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-medium">{dict.traffic.country}</th>
                  <th className="py-2 pr-3 font-medium">{dict.traffic.count}</th>
                  <th className="py-2 font-medium">{dict.traffic.breakdown}</th>
                </tr>
              </thead>
              <tbody>
                {summary.byCountry.map((row) => (
                  <tr key={row.country} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-3 font-medium">{row.country}</td>
                    <td className="py-2 pr-3 tabular-nums">{row.count}</td>
                    <td className="py-2 text-slate-600">
                      {CLASS_ORDER.filter((c) => row.classes[c])
                        .map((c) => `${classLabels[c]} ${row.classes[c]}`)
                        .join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title={dict.traffic.topPaths}>
          {summary.topPaths.length === 0 ? (
            <p className="text-sm text-slate-500">{dict.traffic.empty}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-medium">{dict.traffic.path}</th>
                  <th className="py-2 pr-3 font-medium">{dict.traffic.count}</th>
                  <th className="py-2 font-medium">{dict.traffic.class}</th>
                </tr>
              </thead>
              <tbody>
                {summary.topPaths.map((row) => (
                  <tr key={row.path} className="border-b border-slate-100">
                    <td className="max-w-[18rem] truncate py-2 pr-3 font-mono text-xs">{row.path}</td>
                    <td className="py-2 pr-3 tabular-nums">{row.count}</td>
                    <td className="py-2">{classLabels[row.class]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>

        <Panel title={dict.traffic.topUa}>
          {summary.topUaFamilies.length === 0 ? (
            <p className="text-sm text-slate-500">{dict.traffic.empty}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-3 font-medium">{dict.traffic.ua}</th>
                  <th className="py-2 pr-3 font-medium">{dict.traffic.count}</th>
                  <th className="py-2 font-medium">{dict.traffic.class}</th>
                </tr>
              </thead>
              <tbody>
                {summary.topUaFamilies.map((row) => (
                  <tr key={row.uaFamily} className="border-b border-slate-100">
                    <td className="py-2 pr-3">{row.uaFamily}</td>
                    <td className="py-2 pr-3 tabular-nums">{row.count}</td>
                    <td className="py-2">{classLabels[row.class]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </section>
    </>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="my-2 text-3xl font-bold">{value}</p>
      <p className="text-sm text-slate-500">{note}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </div>
  );
}
