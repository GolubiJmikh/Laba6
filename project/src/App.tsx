import { useEffect, useState } from 'react';
import { Car, CheckCircle2, XCircle, Percent, Wallet, TrendingUp, Plus, Gauge, RotateCcw } from 'lucide-react';
import {
  PLACE_CREATION_COST,
  MAINTENANCE_COST_PER_SEC,
  REVENUE_PER_CAR,
  INITIAL_PLACES,
  createInitialState,
  addPlace,
  step,
  occupiedCount,
  currentOccupancy,
  averageOccupancy,
  netProfit,
  findOptimalPlaces,
  type SimState,
  type StaticResult,
} from './simulation';

const formatRub = (n: number) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' ₽';

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-medium uppercase tracking-wide">
        <span className={accent}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}

function App() {
  const [state, setState] = useState<SimState>(() => createInitialState());
  const [running, setRunning] = useState(true);
  const [statics] = useState<StaticResult[]>(() => findOptimalPlaces());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setState((s) => step(s)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const opt = statics.reduce((a, b) => (b.profit > a.profit ? b : a), statics[0]);
  const occupied = occupiedCount(state);
  const busy = currentOccupancy(state);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Симуляция парковки</h1>
              <p className="text-sm text-slate-500">Секунда {state.tick}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRunning((r) => !r)}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              {running ? 'Пауза' : 'Продолжить'}
            </button>
            <button
              onClick={() => setState(createInitialState())}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Сброс
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard icon={<Car className="h-4 w-4" />} label="Обслужено" value={String(state.served)} accent="text-emerald-600" />
          <StatCard icon={<XCircle className="h-4 w-4" />} label="Отказы" value={String(state.rejected)} accent="text-rose-600" />
          <StatCard icon={<Percent className="h-4 w-4" />} label="Загруженность" value={`${busy.toFixed(0)}%`} accent="text-amber-600" />
          <StatCard icon={<Wallet className="h-4 w-4" />} label="Доход" value={formatRub(state.revenue)} accent="text-emerald-600" />
          <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Чистая прибыль" value={formatRub(netProfit(state))} accent="text-sky-600" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Парковочные места</h2>
              <span className="text-sm text-slate-500">
                Занято {occupied} из {state.spots.length}
              </span>
            </div>
            <ul className="mt-4 grid gap-2">
              {state.spots.map((s) => (
                <li
                  key={s.id}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors ${
                    s.occupied ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'
                  }`}
                >
                  <span className="font-medium">Место {s.id + 1}</span>
                  {s.occupied ? (
                    <span className="flex items-center gap-2 text-rose-700">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                      Занято, освободится через {s.secondsLeft} с
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-emerald-700">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Свободно
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setState((s) => addPlace(s))}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-600 transition hover:border-emerald-500 hover:text-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Добавить место ({formatRub(PLACE_CREATION_COST)} разово)
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
              <h2 className="font-semibold">Финансы</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Доход ({state.served} × {formatRub(REVENUE_PER_CAR)})</dt>
                  <dd className="font-medium tabular-nums">{formatRub(state.revenue)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Создание мест (разово)</dt>
                  <dd className="font-medium tabular-nums">
                    {formatRub(PLACE_CREATION_COST * Math.max(0, state.spots.length - INITIAL_PLACES))}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Содержание ({state.tick} с × {state.spots.length} × {formatRub(MAINTENANCE_COST_PER_SEC)})</dt>
                  <dd className="font-medium tabular-nums">
                    {formatRub(state.costs - PLACE_CREATION_COST * Math.max(0, state.spots.length - INITIAL_PLACES))}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                  <dt className="font-semibold">Затраты всего</dt>
                  <dd className="font-semibold tabular-nums">{formatRub(state.costs)}</dd>
                </div>
                <div className="flex justify-between text-base">
                  <dt className="font-semibold">Чистая прибыль</dt>
                  <dd className={`font-semibold tabular-nums ${netProfit(state) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatRub(netProfit(state))}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-amber-600" />
                <h2 className="font-semibold">Загруженность</h2>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Средняя за всё время</span>
                    <span className="font-medium text-slate-900 tabular-nums">{averageOccupancy(state).toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, averageOccupancy(state))}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Текущая</span>
                    <span className="font-medium text-slate-900 tabular-nums">{busy.toFixed(0)}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, busy)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <h2 className="font-semibold">
              Оптимальное количество мест
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Модельный расчёт на 15 минут симуляции (900 с), усреднено по 5 прогонам
            с учётом стоимости создания каждого места. На старте — {INITIAL_PLACES} места.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4 font-medium">Мест</th>
                  <th className="py-2 pr-4 font-medium">Обслужено</th>
                  <th className="py-2 pr-4 font-medium">Отказы</th>
                  <th className="py-2 pr-4 font-medium">Загруженность</th>
                  <th className="py-2 font-medium">Чистая прибыль</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {statics.map((r) => {
                  const isBest = r.places === opt.places;
                  return (
                    <tr
                      key={r.places}
                      className={`border-b border-slate-100 ${isBest ? 'bg-emerald-50 font-medium' : ''}`}
                    >
                      <td className="py-2 pr-4">
                        {r.places}
                        {isBest && (
                          <span className="ml-2 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                            оптимум
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-4">{r.served}</td>
                      <td className="py-2 pr-4 text-rose-600">{r.rejected}</td>
                      <td className="py-2 pr-4">{r.occupancy.toFixed(0)}%</td>
                      <td className="py-2">{formatRub(r.profit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Наиболее выгодно содержать <span className="font-semibold text-emerald-700">{opt.places} мест</span> —
            прибыль около {formatRub(opt.profit)} за 15 минут симуляции.
          </p>
        </section>
      </main>
    </div>
  );
}

export default App;
