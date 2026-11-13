import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, updateDoc, where, type Firestore } from 'firebase/firestore';
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Clock3, ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react';

type Entidade = { id: string; nome: string };
type Situacao = 'Agendado' | 'Confirmado' | 'Cancelado';
type Agendamento = {
  id: string; userId: string; paciente: string; procedimento: string;
  clinica: string; cirurgiao: string; data: string; hora: string;
  duracaoMinutos: number; observacoes: string; status: Situacao;
};
type Formulario = Omit<Agendamento, 'id' | 'userId'>;
const novoFormulario = (data: string): Formulario => ({
  paciente: '', procedimento: '', clinica: '', cirurgiao: '',
  data, hora: '09:00', duracaoMinutos: 60, observacoes: '', status: 'Agendado'
});
const dataLocal = (d: Date) => [
  d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'),
  String(d.getDate()).padStart(2, '0')
].join('-');
const hoje = () => dataLocal(new Date());
const dataLegivel = (data: string) => {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(ano, mes - 1, dia));
};
const googleCalendarLink = (a: Agendamento) => {
  const inicio = new Date(`${a.data}T${a.hora}:00`);
  const fim = new Date(inicio.getTime() + a.duracaoMinutos * 60000);
  const formato = (d: Date) => [
    d.getUTCFullYear(), String(d.getUTCMonth() + 1).padStart(2,'0'),
    String(d.getUTCDate()).padStart(2,'0'), 'T',
    String(d.getUTCHours()).padStart(2,'0'),
    String(d.getUTCMinutes()).padStart(2,'0'),
    String(d.getUTCSeconds()).padStart(2,'0'), 'Z'
  ].join('');
  const params = new URLSearchParams({
    action: 'TEMPLATE', text: `Atendimento veterinário — ${a.procedimento || 'Procedimento'}`,
    dates: `${formato(inicio)}/${formato(fim)}`, location: a.clinica,
    details: 'Agendamento criado no AnestVet. Consulte os dados clínicos no aplicativo.'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export default function Agenda({
  db, userId, clinicas, cirurgioes
}: {db: Firestore; userId: string; clinicas: Entidade[]; cirurgioes: Entidade[]}) {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [exibirFormulario, setExibirFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState(hoje);
  const [mesExibido, setMesExibido] = useState(() => hoje().slice(0, 7));
  const [form, setForm] = useState<Formulario>(() => novoFormulario(hoje()));

  useEffect(() => {
    const consulta = query(collection(db, 'agendamentos'), where('userId', '==', userId));
    return onSnapshot(consulta, snapshot => {
      setAgendamentos(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Agendamento)));
      setErro('');
    }, e => setErro(`Não foi possível carregar a agenda: ${e.message}`));
  }, [db, userId]);

  const ordenados = useMemo(() => [...agendamentos].sort((a, b) =>
    `${a.data}T${a.hora}`.localeCompare(`${b.data}T${b.hora}`)), [agendamentos]);
  const doDia = ordenados.filter(a => a.data === diaSelecionado);
  const calendario = useMemo(() => {
    const [ano, mes] = mesExibido.split('-').map(Number);
    const primeiro = new Date(ano, mes - 1, 1);
    const total = new Date(ano, mes, 0).getDate();
    const deslocamento = (primeiro.getDay() + 6) % 7;
    return Array.from({ length: deslocamento + total }, (_, i) =>
      i < deslocamento ? '' : dataLocal(new Date(ano, mes - 1, i - deslocamento + 1)));
  }, [mesExibido]);
  const rotuloMes = useMemo(() => {
    const [ano, mes] = mesExibido.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(ano, mes - 1, 1));
  }, [mesExibido]);

  const moverMes = (delta: number) => {
    const [ano, mes] = mesExibido.split('-').map(Number);
    const novo = new Date(ano, mes - 1 + delta, 1);
    setMesExibido(dataLocal(novo).slice(0, 7));
    setDiaSelecionado(dataLocal(novo));
  };
  const iniciarNovo = () => {
    setEditandoId(null);
    setForm(novoFormulario(diaSelecionado));
    setExibirFormulario(true);
  };
  const iniciarEdicao = (a: Agendamento) => {
    setEditandoId(a.id);
    setForm({
      paciente: a.paciente, procedimento: a.procedimento, clinica: a.clinica,
      cirurgiao: a.cirurgiao, data: a.data, hora: a.hora,
      duracaoMinutos: a.duracaoMinutos || 60, observacoes: a.observacoes || '',
      status: a.status || 'Agendado'
    });
    setExibirFormulario(true);
  };
  const salvar = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.paciente.trim() || !form.procedimento.trim() || !form.data || !form.hora) {
      setErro('Informe paciente, procedimento, data e horário.'); return;
    }
    if (!Number.isFinite(form.duracaoMinutos) || form.duracaoMinutos < 15) {
      setErro('A duração deve ser de pelo menos 15 minutos.'); return;
    }
    setSalvando(true);
    setErro('');
    try {
      const dados = {
        ...form, paciente: form.paciente.trim(), procedimento: form.procedimento.trim(),
        userId, atualizadoEm: serverTimestamp()
      };
      if (editandoId) {
        await updateDoc(doc(db, 'agendamentos', editandoId), dados);
      } else {
        await addDoc(collection(db, 'agendamentos'), { ...dados, criadoEm: serverTimestamp() });
      }
      setDiaSelecionado(form.data);
      setMesExibido(form.data.slice(0, 7));
      setExibirFormulario(false);
      setEditandoId(null);
    } catch (e) {
      setErro(`Não foi possível salvar o agendamento: ${e instanceof Error ? e.message : 'erro desconhecido'}`);
    } finally { setSalvando(false); }
  };
  const excluir = async (a: Agendamento) => {
    if (!confirm(`Excluir o agendamento de ${a.paciente} em ${dataLegivel(a.data)}? Esta ação não altera o Google Agenda.`)) return;
    try { await deleteDoc(doc(db, 'agendamentos', a.id)); setErro(''); }
    catch (e) { setErro(`Falha ao excluir: ${e instanceof Error ? e.message : 'erro desconhecido'}`); }
  };
  const campo = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500';
  const atualizar = <K extends keyof Formulario>(chave: K, valor: Formulario[K]) => setForm(a => ({ ...a, [chave]: valor }));

  return <div className="space-y-4 pb-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Agenda</h1>
        <p className="text-sm text-slate-500">{ordenados.filter(a => a.data >= hoje() && a.status !== 'Cancelado').length} agendamento(s) futuro(s)</p>
      </div>
      <button type="button" onClick={iniciarNovo} className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-sky-700">
        <Plus className="h-4 w-4" /> Agendar
      </button>
    </div>
    {erro && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{erro}</div>}
    <div className="rounded-3xl border border-sky-100 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" aria-label="Mês anterior" onClick={() => moverMes(-1)} className="rounded-lg p-2 hover:bg-slate-100"><ChevronLeft className="h-5 w-5" /></button>
        <h2 className="font-bold capitalize text-slate-800">{rotuloMes}</h2>
        <button type="button" aria-label="Próximo mês" onClick={() => moverMes(1)} className="rounded-lg p-2 hover:bg-slate-100"><ChevronRight className="h-5 w-5" /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].map(d => <span key={d} className="py-1 text-[10px] font-semibold text-slate-400">{d}</span>)}
        {calendario.map((d, i) => d
          ? <button key={d} type="button" onClick={() => setDiaSelecionado(d)}
              className={`relative flex min-h-11 flex-col items-center justify-center rounded-xl text-sm font-semibold transition-colors ${d === diaSelecionado ? 'bg-sky-600 text-white' : d === hoje() ? 'bg-sky-50 text-sky-700' : 'text-slate-700 hover:bg-slate-50'}`}>
              {Number(d.slice(-2))}
              {agendamentos.some(a => a.data === d && a.status !== 'Cancelado') && <span className={`mt-1 h-1 w-1 rounded-full ${d === diaSelecionado ? 'bg-white' : 'bg-sky-500'}`} />}
            </button>
          : <span key={`empty-${i}`} />)}
      </div>
      <button type="button" onClick={() => { const d = hoje(); setDiaSelecionado(d); setMesExibido(d.slice(0,7)); }} className="mt-3 text-xs font-semibold text-sky-700">Ir para hoje</button>
    </div>
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-base font-bold text-slate-900">{dataLegivel(diaSelecionado)}</h2>
      <span className="text-xs text-slate-500">{doDia.length} compromisso(s)</span>
    </div>
    {doDia.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-7 text-center text-sm text-slate-500">
      <CalendarDays className="mx-auto mb-2 h-8 w-8 text-sky-300" /> Nenhum agendamento neste dia.
    </div>}
    {doDia.map(a => <article key={a.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="min-w-16 rounded-xl bg-sky-50 px-2 py-2 text-center text-sm font-bold text-sky-700">{a.hora}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-slate-900">{a.paciente}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${a.status === 'Confirmado' ? 'bg-emerald-50 text-emerald-700' : a.status === 'Cancelado' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>{a.status}</span></div>
          <p className="text-sm text-slate-700">{a.procedimento}</p>
          <p className="mt-1 text-xs text-slate-500">{[a.clinica,a.cirurgiao].filter(Boolean).join(' · ') || 'Local a definir'}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Clock3 className="h-3 w-3" /> {a.duracaoMinutos} minutos</p>
          {a.observacoes && <p className="mt-2 whitespace-pre-wrap text-xs text-slate-500">{a.observacoes}</p>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
        <a href={googleCalendarLink(a)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-2 text-[11px] font-bold text-sky-700" title="Abre o Google Agenda para confirmar manualmente a inclusão">
          <ExternalLink className="h-3.5 w-3.5" /> Google Agenda
        </a>
        <button type="button" onClick={() => iniciarEdicao(a)} className="inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] font-bold text-slate-700"><Pencil className="h-3.5 w-3.5" /> Editar</button>
        <button type="button" onClick={() => excluir(a)} className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-2 text-[11px] font-bold text-rose-700"><Trash2 className="h-3.5 w-3.5" /> Excluir</button>
      </div>
    </article>)}
    <div className="rounded-xl bg-sky-50 p-3 text-xs text-sky-800">
      <strong>Integração Google Agenda:</strong> nesta primeira etapa, o botão abre um evento pronto para você confirmar no Google. A sincronização automática por OAuth será habilitada na próxima etapa. Editar ou excluir aqui ainda não atualiza o Google.
    </div>
    {exibirFormulario && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3">
      <div role="dialog" aria-modal="true" aria-label={editandoId ? 'Editar agendamento' : 'Novo agendamento'} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><CalendarPlus className="h-5 w-5 text-sky-600" />{editandoId ? 'Editar agendamento' : 'Novo agendamento'}</h2>
          <button type="button" aria-label="Fechar" onClick={() => setExibirFormulario(false)}><X className="h-5 w-5 text-slate-500" /></button></div>
        <form onSubmit={salvar} className="space-y-3">
          <label className="block text-xs font-bold text-slate-600">Paciente *
            <input required maxLength={100} className={campo} value={form.paciente} onChange={e => atualizar('paciente', e.target.value)} placeholder="Nome do paciente" /></label>
          <label className="block text-xs font-bold text-slate-600">Procedimento *
            <input required maxLength={150} className={campo} value={form.procedimento} onChange={e => atualizar('procedimento', e.target.value)} placeholder="Ex.: castração" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-bold text-slate-600">Data *
              <input type="date" required className={campo} value={form.data} onChange={e => atualizar('data', e.target.value)} /></label>
            <label className="block text-xs font-bold text-slate-600">Horário *
              <input type="time" required className={campo} value={form.hora} onChange={e => atualizar('hora', e.target.value)} /></label>
          </div>
          <label className="block text-xs font-bold text-slate-600">Duração estimada (minutos)
            <input type="number" min={15} step={15} max={1440} className={campo} value={form.duracaoMinutos} onChange={e => atualizar('duracaoMinutos', Number(e.target.value))} /></label>
          <label className="block text-xs font-bold text-slate-600">Clínica / local
            <input list="agenda-clinicas" className={campo} value={form.clinica} onChange={e => atualizar('clinica', e.target.value)} placeholder="Escolha ou digite" />
            <datalist id="agenda-clinicas">{clinicas.map(c => <option key={c.id} value={c.nome} />)}</datalist></label>
          <label className="block text-xs font-bold text-slate-600">Cirurgião
            <input list="agenda-cirurgioes" className={campo} value={form.cirurgiao} onChange={e => atualizar('cirurgiao', e.target.value)} placeholder="Opcional" />
            <datalist id="agenda-cirurgioes">{cirurgioes.map(c => <option key={c.id} value={c.nome} />)}</datalist></label>
          <label className="block text-xs font-bold text-slate-600">Situação
            <select className={campo} value={form.status} onChange={e => atualizar('status', e.target.value as Situacao)}>
              <option>Agendado</option><option>Confirmado</option><option>Cancelado</option>
            </select></label>
          <label className="block text-xs font-bold text-slate-600">Observações
            <textarea rows={3} className={campo} value={form.observacoes} onChange={e => atualizar('observacoes', e.target.value)} placeholder="Anotações internas" /></label>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={() => setExibirFormulario(false)} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">Cancelar</button>
            <button type="submit" disabled={salvando} className="flex-1 rounded-xl bg-sky-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{salvando ? 'Salvando...' : 'Salvar agendamento'}</button>
          </div>
        </form>
      </div>
    </div>}
  </div>;
}
