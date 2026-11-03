import { useState, useEffect, useMemo, useRef, type FormEvent } from 'react';
import { 
  Syringe, Plus, Activity, Loader2, 
  Clock, Building2, Pencil, Trash2, X, BarChart3, Dog, Download, 
  LayoutGrid, Table, Search, Filter, UserCheck, CheckCircle2, CheckCircle, AlertCircle, ChevronLeft, LogOut, Copy, ChevronDown, ChevronUp, Share2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';

// Configuração Real do Firebase fornecida no seu projeto
const firebaseConfig = {
  apiKey: "AIzaSyAUORPRtwSMaYegEQzA0J71G4i6CYLNvJc",
  authDomain: "registro-de-anestesias.firebaseapp.com",
  projectId: "registro-de-anestesias",
  storageBucket: "registro-de-anestesias.firebasestorage.app",
  messagingSenderId: "470899292665",
  appId: "1:470899292665:web:dbcff34c173d58f0e32528",
  measurementId: "G-G1WTDMM2X9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Tipos TypeScript para evitar erros de compilação no Vercel
export interface Registo {
  id: string;
  dataProc: string;
  local?: string;
  valor?: string;
  cirurgiao?: string;
  dataPgto?: string;
  paciente: string;
  especie?: string;
  peso?: string;
  procedimento: string;
  complexidade?: string;
  formaPgto?: string;
  tutor?: string;
  observacoes?: string;
  dataCriacao?: any;
}

export interface Clinica {
  id: string;
  nome: string;
  dataCriacao?: any;
}

export interface Cirurgiao {
  id: string;
  nome: string;
  dataCriacao?: any;
}

export interface ModalQuitacao {
  id: string;
  paciente: string;
}

export interface FatiaSVG {
  id: string;
  nome: string;
  valor: number;
  porcentagem: number;
  cor: string;
  pathData: string;
}

export interface EscopoGrafico {
  tipo: 'ano' | 'mes' | 'semana';
  chave: string;
}

// Paleta de cores em tons de azul e destaques para o Dashboard
const PALETA_CORES = [
  '#0284c7', '#0369a1', '#2563eb', '#3b82f6', '#0ea5e9', 
  '#06b6d4', '#6366f1', '#8b5cf6', '#10b981', '#f59e0b'
];

export default function App() {
  // Estados tipados para TypeScript
  const [registos, setRegistos] = useState<Registo[]>([]);
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [cirurgioes, setCirurgioes] = useState<Cirurgiao[]>([]);
  
  const [salvando, setSalvando] = useState(false);
  const [salvandoClinica, setSalvandoClinica] = useState(false);
  const [salvandoCirurgiao, setSalvandoCirurgiao] = useState(false);
  
  const [abaAtiva, setAbaAtiva] = useState<'historico' | 'formulario' | 'clinicas' | 'cirurgioes' | 'dashboard'>('historico');

  // Modo de visualização do Histórico
  const [modoVisualizacao, setModoVisualizacao] = useState<'cards' | 'tabela'>('cards');

  // Filtros no Histórico
  const [buscaHistorico, setBuscaHistorico] = useState('');
  const [filtroClinicaHistorico, setFiltroClinicaHistorico] = useState('');
  const [filtroStatusHistorico, setFiltroStatusHistorico] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [ordenacaoHistorico, setOrdenacaoHistorico] = useState<'data-desc' | 'data-asc' | 'paciente-asc' | 'paciente-desc'>('data-desc');

  // Formulário - Data pré-preenchida com HOJE como primeiro item
  const [dataProc, setDataProc] = useState(() => new Date().toISOString().slice(0, 10));
  const [local, setLocal] = useState('');
  const [valor, setValor] = useState('');
  const [cirurgiao, setCirurgiao] = useState('');
  const [dataPgto, setDataPgto] = useState('');
  const [paciente, setPaciente] = useState('');
  const [especie, setEspecie] = useState('Canino');
  const [peso, setPeso] = useState('');
  const [formaPgto, setFormaPgto] = useState('Pix');
  const [statusPgto, setStatusPgto] = useState<'Pago' | 'Pendente'>('Pago');
  const [tutor, setTutor] = useState('');
  const [procedimento, setProcedimento] = useState('');
  const [complexidade, setComplexidade] = useState('Média');
  const [observacoes, setObservacoes] = useState('');

  // Modal Quitação
  const [modalQuitacao, setModalQuitacao] = useState<ModalQuitacao | null>(null);
  const [quitFormaPgto, setQuitFormaPgto] = useState('Pix');
  const [quitDataPgto, setQuitDataPgto] = useState(() => new Date().toISOString().slice(0, 10));

  // Clínicas e Cirurgiões
  const [novaClinicaNome, setNovaClinicaNome] = useState('');
  const [clinicaEditandoId, setClinicaEditandoId] = useState<string | null>(null);
  const [nomeClinicaEditado, setNomeClinicaEditado] = useState('');

  const [novoCirurgiaoNome, setNovoCirurgiaoNome] = useState('');
  const [cirurgiaoEditandoId, setCirurgiaoEditandoId] = useState<string | null>(null);
  const [nomeCirurgiaoEditado, setNomeCirurgiaoEditado] = useState('');

  // Edição em linha
  const [fichaEditandoId, setFichaEditandoId] = useState<string | null>(null);
  const [editFichaData, setEditFichaData] = useState<Partial<Registo>>({});

  // Gráficos e Relatório
  const [nivelDrill, setNivelDrill] = useState<'ano' | 'mes' | 'semana' | 'dia'>('mes');
  const [escopoGrafico, setEscopoGrafico] = useState<EscopoGrafico | null>(null);
  const scrollGraficoRef = useRef<HTMLDivElement>(null);

  const [tipoPeriodo] = useState<'mes' | 'ano' | 'personalizado' | 'todos'>('todos');
  const [mesFiltro] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });
  const [anoFiltro] = useState(() => String(new Date().getFullYear()));
  const [dataInicioFiltro] = useState('');
  const [dataFimFiltro] = useState('');
  const [fatiaHover, setFatiaHover] = useState<FatiaSVG | null>(null);
  const [clinicaPendenteExpandida, setClinicaPendenteExpandida] = useState<string | null>(null);
  const [copiadoWhatsApp, setCopiadoWhatsApp] = useState(false);

  // Escutar Firebase em Tempo Real
  useEffect(() => {
    const q = query(collection(db, 'anestesias'), orderBy('dataCriacao', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Registo[];
      setRegistos(dados);
    }, (error) => {
      console.warn("Usando dados locais se não houver acesso à rede:", error.message);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'clinicas'), orderBy('nome', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Clinica[];
      setClinicas(dados);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'cirurgioes'), orderBy('nome', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Cirurgiao[];
      setCirurgioes(dados);
    });
    return () => unsubscribe();
  }, []);

  // Formatação de data BR dd/mm/aaaa
  const formatarDataBR = (dataStr?: string) => {
    if (!dataStr) return '—';
    const partes = dataStr.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return dataStr;
  };

  const handlePesoChange = (valRaw: string, isEdit = false) => {
    const val = valRaw.replace(/[^0-9.,]/g, '');
    if (val.length <= 6) {
      if (isEdit) setEditFichaData(prev => ({ ...prev, peso: val }));
      else setPeso(val);
    }
  };

  const handleValorChange = (valRaw: string, isEdit = false) => {
    const apenasDigitos = valRaw.replace(/\D/g, '');
    let valFormatado = '';
    if (apenasDigitos) {
      const numero = (parseInt(apenasDigitos, 10) / 100).toFixed(2);
      valFormatado = numero.replace('.', ',');
    }
    if (isEdit) setEditFichaData(prev => ({ ...prev, valor: valFormatado }));
    else setValor(valFormatado);
  };

  // Salvar Ficha no Firebase
  const guardarRegisto = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const dataPagamentoFinal = statusPgto === 'Pago' 
        ? (dataPgto || new Date().toISOString().slice(0, 10))
        : '';

      await addDoc(collection(db, 'anestesias'), {
        dataProc,
        local,
        valor: valor || '0,00',
        cirurgiao,
        dataPgto: dataPagamentoFinal,
        paciente,
        especie,
        peso,
        procedimento,
        complexidade,
        formaPgto: statusPgto === 'Pago' ? formaPgto : '',
        tutor,
        observacoes,
        dataCriacao: serverTimestamp()
      });

      // Reset mantendo a data atual pré-preenchida
      setDataProc(new Date().toISOString().slice(0, 10));
      setLocal('');
      setValor('');
      setCirurgiao('');
      setDataPgto('');
      setPaciente('');
      setEspecie('Canino');
      setPeso('');
      setFormaPgto('Pix');
      setStatusPgto('Pago');
      setTutor('');
      setProcedimento('');
      setComplexidade('Média');
      setObservacoes('');

      setAbaAtiva('historico');
    } catch (error: any) {
      alert("Erro ao gravar ficha no banco de dados: " + (error?.message || error));
    }
    setSalvando(false);
  };

  const abrirModalQuitacao = (id: string, nomePaciente: string) => {
    setModalQuitacao({ id, paciente: nomePaciente });
    setQuitFormaPgto('Pix');
    setQuitDataPgto(new Date().toISOString().slice(0, 10));
  };

  const confirmarQuitacao = async () => {
    if (!modalQuitacao) return;
    try {
      await updateDoc(doc(db, 'anestesias', modalQuitacao.id), {
        dataPgto: quitDataPgto,
        formaPgto: quitFormaPgto
      });
      setModalQuitacao(null);
    } catch (error: any) {
      alert("Erro ao quitar: " + (error?.message || error));
    }
  };

  const alternarStatusPendente = async (id: string) => {
    try {
      await updateDoc(doc(db, 'anestesias', id), {
        dataPgto: '',
        formaPgto: ''
      });
    } catch (error: any) {
      alert("Erro ao alterar status: " + (error?.message || error));
    }
  };

  const excluirFicha = async (id: string, nomePaciente: string) => {
    if (confirm(`Tem certeza que deseja excluir a ficha do paciente "${nomePaciente}"?`)) {
      try {
        await deleteDoc(doc(db, 'anestesias', id));
      } catch (error: any) {
        alert("Erro ao excluir ficha: " + (error?.message || error));
      }
    }
  };

  const iniciarEdicaoFicha = (registo: Registo) => {
    setFichaEditandoId(registo.id);
    setEditFichaData({ ...registo, complexidade: registo.complexidade || 'Média' });
  };

  const salvarEdicaoFicha = async (id: string) => {
    if (!editFichaData.paciente?.trim() || !editFichaData.procedimento?.trim()) {
      alert("Nome do paciente e Procedimento são obrigatórios.");
      return;
    }
    try {
      await updateDoc(doc(db, 'anestesias', id), {
        paciente: editFichaData.paciente || '',
        especie: editFichaData.especie || 'Canino',
        peso: editFichaData.peso || '',
        procedimento: editFichaData.procedimento || '',
        complexidade: editFichaData.complexidade || 'Média',
        tutor: editFichaData.tutor || '',
        dataProc: editFichaData.dataProc || '',
        local: editFichaData.local || '',
        cirurgiao: editFichaData.cirurgiao || '',
        valor: editFichaData.valor || '',
        formaPgto: editFichaData.formaPgto || '',
        dataPgto: editFichaData.dataPgto || '',
        observacoes: editFichaData.observacoes || ''
      });
      setFichaEditandoId(null);
    } catch (error: any) {
      alert("Erro ao atualizar ficha: " + (error?.message || error));
    }
  };

  // Filtros do Histórico
  const registosFiltradosEOrdenados = useMemo(() => {
    return registos.filter(item => {
      const termo = buscaHistorico.toLowerCase();
      const bateBusca = 
        !buscaHistorico || 
        (item.paciente && item.paciente.toLowerCase().includes(termo)) ||
        (item.procedimento && item.procedimento.toLowerCase().includes(termo)) ||
        (item.tutor && item.tutor.toLowerCase().includes(termo)) ||
        (item.cirurgiao && item.cirurgiao.toLowerCase().includes(termo));

      const bateClinica = !filtroClinicaHistorico || item.local === filtroClinicaHistorico;
      
      let bateStatus = true;
      if (filtroStatusHistorico === 'pago') bateStatus = Boolean(item.dataPgto);
      if (filtroStatusHistorico === 'pendente') bateStatus = !item.dataPgto;

      let bateData = true;
      if (filtroDataInicio && item.dataProc < filtroDataInicio) bateData = false;
      if (filtroDataFim && item.dataProc > filtroDataFim) bateData = false;

      return bateBusca && bateClinica && bateStatus && bateData;
    }).sort((a, b) => {
      if (ordenacaoHistorico === 'paciente-asc') return (a.paciente || '').localeCompare(b.paciente || '');
      if (ordenacaoHistorico === 'paciente-desc') return (b.paciente || '').localeCompare(a.paciente || '');
      if (ordenacaoHistorico === 'data-asc') return (a.dataProc || '').localeCompare(b.dataProc || '');
      return (b.dataProc || '').localeCompare(a.dataProc || '');
    });
  }, [registos, buscaHistorico, filtroClinicaHistorico, filtroStatusHistorico, filtroDataInicio, filtroDataFim, ordenacaoHistorico]);

  const exportarCSV = () => {
    if (registosFiltradosEOrdenados.length === 0) return;
    const cabecalho = ["Data Procedimento", "Paciente", "Espécie", "Peso (kg)", "Procedimento", "Complexidade", "Tutor", "Local / Clínica", "Cirurgião", "Valor (R$)", "Forma Pagamento", "Data Pagamento", "Observações"];
    const linhas = registosFiltradosEOrdenados.map(r => [
      `"${formatarDataBR(r.dataProc)}"`, `"${r.paciente || ''}"`, `"${r.especie || 'Canino'}"`, `"${r.peso || ''}"`, `"${r.procedimento || ''}"`, `"${r.complexidade || 'Média'}"`, `"${r.tutor || ''}"`, `"${r.local || ''}"`, `"${r.cirurgiao || ''}"`, `"${r.valor || ''}"`, `"${r.formaPgto || ''}"`, `"${formatarDataBR(r.dataPgto)}"`, `"${(r.observacoes || '').replace(/"/g, '""')}"`
    ]);
    const conteudoCSV = "\uFEFF" + [cabecalho.join(";"), ...linhas.map(l => l.join(";"))].join("\n");
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anestvet_registros_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const guardarClinica = async (e: FormEvent) => {
    e.preventDefault();
    if (!novaClinicaNome.trim()) return;
    setSalvandoClinica(true);
    try {
      await addDoc(collection(db, 'clinicas'), { nome: novaClinicaNome.trim(), dataCriacao: serverTimestamp() });
      setNovaClinicaNome('');
    } catch (error: any) { alert("Erro ao cadastrar clínica: " + (error?.message || error)); }
    setSalvandoClinica(false);
  };

  const excluirClinica = async (id: string, nome: string) => {
    if (confirm(`Excluir a clínica "${nome}"?`)) {
      try { await deleteDoc(doc(db, 'clinicas', id)); } catch (error: any) { alert("Erro ao excluir clínica: " + (error?.message || error)); }
    }
  };

  const salvarEdicaoClinica = async (id: string) => {
    if (!nomeClinicaEditado.trim()) return;
    try {
      await updateDoc(doc(db, 'clinicas', id), { nome: nomeClinicaEditado.trim() });
      setClinicaEditandoId(null);
    } catch (error: any) { alert("Erro ao atualizar clínica: " + (error?.message || error)); }
  };

  const guardarCirurgiao = async (e: FormEvent) => {
    e.preventDefault();
    if (!novoCirurgiaoNome.trim()) return;
    setSalvandoCirurgiao(true);
    try {
      await addDoc(collection(db, 'cirurgioes'), { nome: novoCirurgiaoNome.trim(), dataCriacao: serverTimestamp() });
      setNovoCirurgiaoNome('');
    } catch (error: any) { alert("Erro ao cadastrar cirurgião: " + (error?.message || error)); }
    setSalvandoCirurgiao(false);
  };

  const excluirCirurgiao = async (id: string, nome: string) => {
    if (confirm(`Excluir o cirurgião "${nome}"?`)) {
      try { await deleteDoc(doc(db, 'cirurgioes', id)); } catch (error: any) { alert("Erro ao excluir cirurgião: " + (error?.message || error)); }
    }
  };

  const salvarEdicaoCirurgiao = async (id: string) => {
    if (!nomeCirurgiaoEditado.trim()) return;
    try {
      await updateDoc(doc(db, 'cirurgioes', id), { nome: nomeCirurgiaoEditado.trim() });
      setCirurgiaoEditandoId(null);
    } catch (error: any) { alert("Erro ao atualizar cirurgião: " + (error?.message || error)); }
  };

  // Processamento de Dados do Relatório
  const getAnoFromData = (d: string) => d ? d.slice(0, 4) : '';
  const getMesFromData = (d: string) => d ? d.slice(0, 7) : '';
  const getSemanaFromData = (d: string) => {
    if (!d) return '';
    const dt = new Date(`${d}T00:00:00Z`);
    const day = dt.getUTCDay() || 7;
    dt.setUTCDate(dt.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((dt.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  const dadosGraficoDrill = useMemo(() => {
    const mapaCoresClinicas: Record<string, string> = {};
    clinicas.forEach((c, idx) => { mapaCoresClinicas[c.nome] = PALETA_CORES[idx % PALETA_CORES.length]; });

    const filtrados = registos.filter(r => {
      if (!r.dataProc) return false;
      if (!escopoGrafico) return true;
      if (escopoGrafico.tipo === 'ano') return getAnoFromData(r.dataProc) === escopoGrafico.chave;
      if (escopoGrafico.tipo === 'mes') return getMesFromData(r.dataProc) === escopoGrafico.chave;
      return getSemanaFromData(r.dataProc) === escopoGrafico.chave;
    });

    const grupos: Record<string, Record<string, number>> = {};
    const totaisPorGrupo: Record<string, number> = {};
    const clinicasPresentes = new Set<string>();
    let totalPeriodo = 0;

    filtrados.forEach(r => {
      const v = r.valor ? parseFloat(String(r.valor).replace(/\./g, '').replace(',', '.')) || 0 : 0;
      const cNome = r.local || 'Não informada';
      let ch = '';
      if (nivelDrill === 'ano') ch = getAnoFromData(r.dataProc);
      else if (nivelDrill === 'mes') ch = getMesFromData(r.dataProc);
      else if (nivelDrill === 'semana') ch = getSemanaFromData(r.dataProc);
      else ch = r.dataProc;

      if (!ch) return;
      if (!grupos[ch]) grupos[ch] = {};
      grupos[ch][cNome] = (grupos[ch][cNome] || 0) + v;
      totaisPorGrupo[ch] = (totaisPorGrupo[ch] || 0) + v;
      clinicasPresentes.add(cNome);
      totalPeriodo += v;
    });

    // Se estiver no nível DIA, preencher todos os dias até HOJE
    if (nivelDrill === 'dia') {
      let dataInicial: Date;
      if (escopoGrafico && escopoGrafico.tipo === 'mes') {
        const [anoScope, mesScope] = escopoGrafico.chave.split('-');
        dataInicial = new Date(Number(anoScope), Number(mesScope) - 1, 1);
      } else {
        dataInicial = new Date();
        dataInicial.setDate(dataInicial.getDate() - 30);
      }

      const hoje = new Date();
      const tempIter = new Date(dataInicial);

      while (tempIter <= hoje) {
        const keyDia = tempIter.toISOString().slice(0, 10);
        if (!grupos[keyDia]) {
          grupos[keyDia] = {};
          totaisPorGrupo[keyDia] = 0;
        }
        tempIter.setDate(tempIter.getDate() + 1);
      }
    }

    const chavesOrdenadas = Object.keys(grupos).sort();
    const maiorValorTotal = Math.max(...Object.values(totaisPorGrupo), 1);

    const formatarRotulo = (ch: string, n = nivelDrill) => {
      const ms = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      if (n === 'ano') return ch;
      if (n === 'mes') {
        const [a, m] = ch.split('-');
        return `${ms[Number(m) - 1]}/${a}`;
      }
      if (n === 'semana') {
        const [, s] = ch.split('-W');
        return `Sem ${s}`;
      }
      const [a, m, d] = ch.split('-');
      return `${d}/${m}`;
    };

    return {
      chavesOrdenadas, grupos, totaisPorGrupo, maiorValorTotal, totalPeriodo,
      clinicasPresentes: Array.from(clinicasPresentes), formatarRotulo, mapaCoresClinicas
    };
  }, [registos, clinicas, nivelDrill, escopoGrafico]);

  const metricasDashboard = useMemo(() => {
    const fichas = registos.filter(r => {
      if (!r.dataProc) return false;
      if (tipoPeriodo === 'mes') return r.dataProc.startsWith(mesFiltro);
      if (tipoPeriodo === 'ano') return r.dataProc.startsWith(anoFiltro);
      if (tipoPeriodo === 'personalizado') {
        if (dataInicioFiltro && r.dataProc < dataInicioFiltro) return false;
        if (dataFimFiltro && r.dataProc > dataFimFiltro) return false;
      }
      return true;
    });

    let totalGeral = 0, totalPago = 0, totalPendente = 0, caes = 0, gatos = 0;
    const porClinica: Record<string, number> = {};
    const pendentesPorClinica: Record<string, { valor: number; qtd: number; fichas: Registo[] }> = {};
    const listaFichasPendentes: Registo[] = [];

    fichas.forEach(item => {
      const v = item.valor ? parseFloat(item.valor.replace('.', '').replace(',', '.')) : 0;
      totalGeral += v;
      const cNome = item.local || 'Não informada';

      if (item.dataPgto) {
        totalPago += v;
      } else {
        totalPendente += v;
        if (!pendentesPorClinica[cNome]) pendentesPorClinica[cNome] = { valor: 0, qtd: 0, fichas: [] };
        pendentesPorClinica[cNome].valor += v;
        pendentesPorClinica[cNome].qtd += 1;
        pendentesPorClinica[cNome].fichas.push(item);
        listaFichasPendentes.push(item);
      }

      if (item.especie === 'Felino' || item.especie === 'Gato') gatos++;
      else caes++;

      if (item.local) porClinica[item.local] = (porClinica[item.local] || 0) + v;
    });

    const taxaRecebimento = totalGeral > 0 ? (totalPago / totalGeral) * 100 : 0;
    const listaClinicas = Object.entries(porClinica).sort((a, b) => b[1] - a[1]);
    let anguloAcumulado = 0;

    const fatiasSVG: FatiaSVG[] = listaClinicas.map(([nome, valor], index) => {
      const porcentagem = totalGeral > 0 ? (valor / totalGeral) * 100 : 0;
      const angulo = totalGeral > 0 ? (valor / totalGeral) * 360 : 0;
      const inicioAng = anguloAcumulado;
      const fimAng = anguloAcumulado + angulo;
      anguloAcumulado += angulo;

      const cx = 140, cy = 140, r = 115;
      const radInicio = (inicioAng - 90) * (Math.PI / 180);
      const radFim = (fimAng - 90) * (Math.PI / 180);
      const x1 = cx + r * Math.cos(radInicio);
      const y1 = cy + r * Math.sin(radInicio);
      const x2 = cx + r * Math.cos(radFim);
      const y2 = cy + r * Math.sin(radFim);

      const flagGrandeArc = angulo > 180 ? 1 : 0;
      const pathData = angulo >= 359.9
        ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r}`
        : `M ${x1} ${y1} A ${r} ${r} 0 ${flagGrandeArc} 1 ${x2} ${y2}`;

      return {
        id: `fatia-${index}`, nome, valor, porcentagem,
        cor: PALETA_CORES[index % PALETA_CORES.length], pathData
      };
    });

    return {
      quantidade: fichas.length, totalGeral, totalPago, totalPendente,
      taxaRecebimento, caes, gatos, porClinica, fatiasSVG, pendentesPorClinica, listaFichasPendentes
    };
  }, [registos, tipoPeriodo, mesFiltro, anoFiltro, dataInicioFiltro, dataFimFiltro]);

  // Função para copiar resumo formatado diretamente para WhatsApp
  const copiarResumoWhatsApp = (clinicaNome: string | null = null) => {
    let pendentes: Registo[] = [];
    if (clinicaNome) {
      pendentes = metricasDashboard.pendentesPorClinica[clinicaNome]?.fichas || [];
    } else {
      pendentes = metricasDashboard.listaFichasPendentes;
    }

    if (pendentes.length === 0) return;

    let texto = `📋 *ANESTVET - RELATÓRIO DE PENDÊNCIAS*\n`;
    if (clinicaNome) {
      texto += `🏥 *Clínica:* ${clinicaNome}\n`;
    }
    texto += `🗓️ Data da extração: ${new Date().toLocaleDateString('pt-BR')}\n`;
    texto += `------------------------------------\n\n`;

    let totalResumo = 0;
    pendentes.forEach((f, idx) => {
      const valorNum = f.valor ? parseFloat(f.valor.replace('.', '').replace(',', '.')) || 0 : 0;
      totalResumo += valorNum;
      texto += `${idx + 1}. *${f.paciente}* (${f.especie || 'Canino'})\n`;
      texto += `   • Data: ${formatarDataBR(f.dataProc)}\n`;
      texto += `   • Proc: ${f.procedimento || 'Anestesia'}\n`;
      if (!clinicaNome && f.local) texto += `   • Clínica: ${f.local}\n`;
      if (f.tutor) texto += `   • Tutor: ${f.tutor}\n`;
      texto += `   • *Valor: R$ ${f.valor || '0,00'}*\n\n`;
    });

    texto += `------------------------------------\n`;
    texto += `💰 *TOTAL PENDENTE: R$ ${totalResumo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}*`;

    const el = document.createElement('textarea');
    el.value = texto;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    setCopiadoWhatsApp(true);
    setTimeout(() => setCopiadoWhatsApp(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] text-gray-800 flex flex-col font-sans pb-28">
      
      {/* Navbar AnestVet */}
      <header className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[#0284c7] rounded-full flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Syringe className="w-5 h-5 -rotate-45" />
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">AnestVet</span>
        </div>
        <button className="text-gray-500 hover:text-gray-800 transition-colors p-1">
          <LogOut className="w-6 h-6" />
        </button>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 max-w-xl mx-auto w-full">
        
        {/* ABA: REGISTROS / HISTÓRICO */}
        {abaAtiva === 'historico' && (
          <div className="space-y-4">
            {/* Header Totais */}
            <div className="flex justify-between items-center px-1">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Registros</h1>
                <p className="text-gray-500 font-medium text-sm mt-0.5">
                  {registosFiltradosEOrdenados.length} registro(s) · R$ {metricasDashboard.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={exportarCSV} 
                  title="Exportar CSV"
                  className="p-2.5 bg-sky-50 text-[#0284c7] rounded-xl font-medium border border-sky-100 hover:bg-sky-100 flex items-center gap-1.5 text-xs"
                >
                  <Download className="w-4 h-4" /> CSV
                </button>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setModoVisualizacao('cards')} 
                    className={`p-1.5 rounded-lg text-xs font-semibold ${modoVisualizacao === 'cards' ? 'bg-white text-[#0284c7] shadow-sm' : 'text-gray-500'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setModoVisualizacao('tabela')} 
                    className={`p-1.5 rounded-lg text-xs font-semibold ${modoVisualizacao === 'tabela' ? 'bg-white text-[#0284c7] shadow-sm' : 'text-gray-500'}`}
                  >
                    <Table className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Pesquisa */}
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar paciente, tutor, cirurgia..."
                value={buscaHistorico}
                onChange={(e) => setBuscaHistorico(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#0284c7] shadow-sm"
              />
            </div>

            {/* FILTROS: Status e Períodos */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                <span className="flex items-center gap-1.5"><Filter className="w-4 h-4 text-[#0284c7]" /> Filtros</span>
                {(filtroStatusHistorico || filtroDataInicio || filtroDataFim || filtroClinicaHistorico) && (
                  <button 
                    onClick={() => { setFiltroStatusHistorico(''); setFiltroDataInicio(''); setFiltroDataFim(''); setFiltroClinicaHistorico(''); }}
                    className="text-[#0284c7] text-[11px] font-bold"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>

              {/* Botões de Filtro Status */}
              <div className="flex gap-1.5">
                {[
                  { id: '', label: 'Todos' },
                  { id: 'pago', label: 'Pago' },
                  { id: 'pendente', label: 'Pendente' }
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setFiltroStatusHistorico(st.id)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      filtroStatusHistorico === st.id 
                        ? 'bg-sky-50 text-[#0284c7] border-[#0284c7] font-bold' 
                        : 'bg-gray-50 text-gray-600 border-gray-100'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Filtro de Períodos */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] text-gray-400 font-semibold mb-1">Período De:</label>
                  <input
                    type="date"
                    value={filtroDataInicio}
                    onChange={(e) => setFiltroDataInicio(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs bg-gray-50 text-gray-700 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 font-semibold mb-1">Período Até:</label>
                  <input
                    type="date"
                    value={filtroDataFim}
                    onChange={(e) => setFiltroDataFim(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs bg-gray-50 text-gray-700 outline-none"
                  />
                </div>
              </div>

              {/* Clínica e Ordenação */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-50">
                <select 
                  value={filtroClinicaHistorico} 
                  onChange={(e) => setFiltroClinicaHistorico(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 outline-none"
                >
                  <option value="">Todas as Clínicas</option>
                  {clinicas.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
                <select 
                  value={ordenacaoHistorico} 
                  onChange={(e) => setOrdenacaoHistorico(e.target.value as any)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[#0284c7] outline-none"
                >
                  <option value="data-desc">Mais Recentes</option>
                  <option value="data-asc">Mais Antigos</option>
                  <option value="paciente-asc">Paciente (A-Z)</option>
                </select>
              </div>
            </div>

            {/* LISTAGEM DOS CARDS */}
            {modoVisualizacao === 'cards' ? (
              <div className="space-y-3.5">
                {registosFiltradosEOrdenados.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all">
                    {fichaEditandoId === item.id ? (
                      /* Edição rápida */
                      <div className="space-y-3">
                        <div className="flex justify-between items-center border-b pb-2">
                          <span className="font-bold text-sm text-[#0284c7]">Editar Ficha</span>
                          <button onClick={() => setFichaEditandoId(null)} className="text-gray-400"><X className="w-4 h-4" /></button>
                        </div>
                        <input type="text" value={editFichaData.paciente || ''} onChange={(e) => setEditFichaData({ ...editFichaData, paciente: e.target.value })} placeholder="Paciente" className="w-full border rounded-xl p-2 text-xs" />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={editFichaData.tutor || ''} onChange={(e) => setEditFichaData({ ...editFichaData, tutor: e.target.value })} placeholder="Tutor" className="border rounded-xl p-2 text-xs" />
                          <input type="text" value={editFichaData.peso || ''} onChange={(e) => handlePesoChange(e.target.value, true)} placeholder="Peso kg" className="border rounded-xl p-2 text-xs" />
                        </div>
                        <input type="text" value={editFichaData.procedimento || ''} onChange={(e) => setEditFichaData({ ...editFichaData, procedimento: e.target.value })} placeholder="Procedimento" className="w-full border rounded-xl p-2 text-xs" />
                        <div className="grid grid-cols-2 gap-2">
                          <input type="text" value={editFichaData.valor || ''} onChange={(e) => handleValorChange(e.target.value, true)} placeholder="Valor R$" className="border rounded-xl p-2 text-xs" />
                          <input type="date" value={editFichaData.dataProc || ''} onChange={(e) => setEditFichaData({ ...editFichaData, dataProc: e.target.value })} className="border rounded-xl p-2 text-xs" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => salvarEdicaoFicha(item.id)} className="flex-1 bg-[#0284c7] text-white py-2 rounded-xl text-xs font-bold">Salvar</button>
                        </div>
                      </div>
                    ) : (
                      /* Exibição normal */
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h3 className="font-bold text-gray-900 text-base leading-snug">
                              {item.paciente} <span className="font-normal text-gray-500">· {item.especie || 'Canino'}{item.peso ? `, ${item.peso} kg` : ''}</span>
                            </h3>
                            <p className="text-gray-700 font-medium text-sm mt-0.5">
                              {item.procedimento} {item.complexidade && <span className="text-xs text-sky-700 font-semibold bg-sky-50 px-2 py-0.5 rounded-md border border-sky-100 ml-1">{item.complexidade}</span>}
                            </p>
                          </div>
                          <span className="font-bold text-lg text-gray-900">R$ {item.valor || '0,00'}</span>
                        </div>

                        {/* Detalhes Médicos */}
                        <div className="flex justify-between text-xs text-gray-500 my-3">
                          <div className="space-y-1">
                            <p><span className="text-gray-400">Tutor:</span> {item.tutor || '—'}</p>
                            <p><span className="text-gray-400">Clínica:</span> {item.local || '—'}</p>
                            <p><span className="text-gray-400">Cirurgião:</span> {item.cirurgiao || '—'}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-semibold text-gray-700">{formatarDataBR(item.dataProc)}</p>
                            <p className="font-semibold text-[#0284c7]">{item.formaPgto || 'Pendente'}</p>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                          {item.dataPgto ? (
                            <span className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 border border-emerald-100">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 border border-amber-100">
                              <Clock className="w-3.5 h-3.5" /> Pendente
                            </span>
                          )}

                          <button 
                            onClick={() => iniciarEdicaoFicha(item)}
                            className="p-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 ml-auto"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => excluirFicha(item.id, item.paciente)}
                            className="p-2 border border-gray-200 rounded-xl text-red-500 hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {item.dataPgto ? (
                            <button 
                              onClick={() => alternarStatusPendente(item.id)}
                              className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              Marcar pendente
                            </button>
                          ) : (
                            <button 
                              onClick={() => abrirModalQuitacao(item.id, item.paciente)}
                              className="px-3.5 py-2 bg-[#0284c7] text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition-colors shadow-sm"
                            >
                              Quitar
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Modo Tabela */
              <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 border-b">
                    <tr>
                      <th className="p-3">Data</th>
                      <th className="p-3">Paciente</th>
                      <th className="p-3">Procedimento</th>
                      <th className="p-3">Clínica</th>
                      <th className="p-3">Valor</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {registosFiltradosEOrdenados.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="p-3 font-medium">{formatarDataBR(item.dataProc)}</td>
                        <td className="p-3 font-bold">{item.paciente} <span className="font-normal text-gray-400">({item.especie})</span></td>
                        <td className="p-3">{item.procedimento}</td>
                        <td className="p-3">{item.local || '—'}</td>
                        <td className="p-3 font-bold">R$ {item.valor}</td>
                        <td className="p-3 text-right space-x-1">
                          <button onClick={() => iniciarEdicaoFicha(item)} className="p-1 text-[#0284c7]"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => excluirFicha(item.id, item.paciente)} className="p-1 text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ABA: FORMULÁRIO DE NOVO REGISTRO */}
        {abaAtiva === 'formulario' && (
          <form onSubmit={guardarRegisto} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <button 
                type="button" 
                onClick={() => setAbaAtiva('historico')} 
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Novo Registro</h1>
                <p className="text-xs text-gray-400">Campos com * são obrigatórios.</p>
              </div>
            </div>

            {/* SEÇÃO PACIENTE */}
            <div className="space-y-4">
              <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">PACIENTE E DATA</span>
              
              {/* Data pré-preenchida no topo */}
              <div>
                <label className="block text-xs font-semibold text-[#0284c7] mb-1.5">Data do procedimento *</label>
                <input
                  type="date"
                  required
                  value={dataProc}
                  onChange={(e) => setDataProc(e.target.value)}
                  className="w-full border border-sky-200 bg-sky-50/50 rounded-xl px-4 py-3 text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nome do paciente *</label>
                <input
                  type="text"
                  required
                  value={paciente}
                  onChange={(e) => setPaciente(e.target.value)}
                  placeholder="Ex: Kiara"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tutor *</label>
                <input
                  type="text"
                  required
                  value={tutor}
                  onChange={(e) => setTutor(e.target.value)}
                  placeholder="Ex: Lucas"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              {/* Espécie */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Espécie *</label>
                <div className="flex gap-2">
                  {['Canino', 'Felino', 'Outro'].map((esp) => (
                    <button
                      key={esp}
                      type="button"
                      onClick={() => setEspecie(esp)}
                      className={`flex-1 py-2.5 rounded-full text-xs font-semibold transition-all border ${
                        especie === esp 
                          ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-sm' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {esp}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Peso (kg)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={peso}
                  onChange={(e) => handlePesoChange(e.target.value)}
                  placeholder="Ex: 13"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0284c7]"
                />
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* SEÇÃO PROCEDIMENTO */}
            <div className="space-y-4">
              <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">PROCEDIMENTO</span>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cirurgia *</label>
                <input
                  type="text"
                  required
                  value={procedimento}
                  onChange={(e) => setProcedimento(e.target.value)}
                  placeholder="Ex: Mastectomia"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              {/* Complexidade */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Complexidade *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Baixa', 'Média', 'Alta', 'Emergência'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setComplexidade(c)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        complexidade === c
                          ? 'bg-sky-50 text-[#0284c7] border-[#0284c7] font-bold shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {c === 'Baixa' && '🟢 '}
                      {c === 'Média' && '🔵 '}
                      {c === 'Alta' && '🟠 '}
                      {c === 'Emergência' && '🔴 '}
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clínica */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Clínica / local *</label>
                <div className="flex gap-2">
                  <select
                    required
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0284c7]"
                  >
                    <option value="">Selecione a clínica...</option>
                    {clinicas.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('clinicas')}
                    className="w-12 border border-gray-200 rounded-xl flex items-center justify-center text-[#0284c7] hover:bg-sky-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Cirurgião */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cirurgião *</label>
                <div className="flex gap-2">
                  <select
                    required
                    value={cirurgiao}
                    onChange={(e) => setCirurgiao(e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0284c7]"
                  >
                    <option value="">Selecione o cirurgião...</option>
                    {cirurgioes.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setAbaAtiva('cirurgioes')}
                    className="w-12 border border-gray-200 rounded-xl flex items-center justify-center text-[#0284c7] hover:bg-sky-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* SEÇÃO PAGAMENTO */}
            <div className="space-y-4">
              <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">PAGAMENTO</span>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Valor (R$) *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={valor}
                  onChange={(e) => handleValorChange(e.target.value)}
                  placeholder="R$ 250,00"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0284c7]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Status *</label>
                <div className="flex gap-2">
                  {(['Pendente', 'Pago'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusPgto(st)}
                      className={`flex-1 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                        statusPgto === st
                          ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Métodos de Pagamento */}
              {statusPgto === 'Pago' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Método de pagamento *</label>
                  <div className="flex flex-wrap gap-2">
                    {['Pix', 'Dinheiro', 'Crédito (à vista)', 'Crédito (parcelado)', 'Cartão de débito'].map((metodo) => (
                      <button
                        key={metodo}
                        type="button"
                        onClick={() => setFormaPgto(metodo)}
                        className={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${
                          formaPgto === metodo
                            ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-sm'
                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {metodo}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Observações</label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Protocolo anestésico, intercorrências, ASA..."
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#0284c7]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="w-full bg-[#0284c7] text-white py-4 rounded-2xl font-bold text-sm hover:bg-sky-700 transition-colors shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
            >
              {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar registro'}
            </button>
          </form>
        )}

        {/* ABA: CLÍNICAS */}
        {abaAtiva === 'clinicas' && (
          <div className="space-y-4">
            <form onSubmit={guardarClinica} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0284c7]" /> Cadastrar Clínica
              </h2>
              <input
                type="text"
                required
                value={novaClinicaNome}
                onChange={(e) => setNovaClinicaNome(e.target.value)}
                placeholder="Nome da clínica ou hospital"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0284c7]"
              />
              <button
                type="submit"
                disabled={salvandoClinica}
                className="w-full bg-[#0284c7] text-white py-3 rounded-xl font-bold text-xs"
              >
                {salvandoClinica ? 'Salvando...' : 'Cadastrar'}
              </button>
            </form>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-700">Clínicas Cadastradas ({clinicas.length})</h3>
              <div className="divide-y divide-gray-100">
                {clinicas.map(c => (
                  <div key={c.id} className="py-2.5 flex justify-between items-center text-sm">
                    {clinicaEditandoId === c.id ? (
                      <div className="flex gap-2 w-full">
                        <input type="text" value={nomeClinicaEditado} onChange={(e) => setNomeClinicaEditado(e.target.value)} className="border rounded-lg p-1 text-xs flex-1" />
                        <button onClick={() => salvarEdicaoClinica(c.id)} className="text-emerald-600"><CheckCircle2 className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium text-gray-800">{c.nome}</span>
                        <div className="flex gap-2 text-gray-400">
                          <button onClick={() => { setClinicaEditandoId(c.id); setNomeClinicaEditado(c.nome); }}><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => excluirClinica(c.id, c.nome)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA: CIRURGIÕES */}
        {abaAtiva === 'cirurgioes' && (
          <div className="space-y-4">
            <form onSubmit={guardarCirurgiao} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#0284c7]" /> Cadastrar Cirurgião
              </h2>
              <input
                type="text"
                required
                value={novoCirurgiaoNome}
                onChange={(e) => setNovoCirurgiaoNome(e.target.value)}
                placeholder="Nome do cirurgião"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0284c7]"
              />
              <button
                type="submit"
                disabled={salvandoCirurgiao}
                className="w-full bg-[#0284c7] text-white py-3 rounded-xl font-bold text-xs"
              >
                {salvandoCirurgiao ? 'Salvando...' : 'Cadastrar'}
              </button>
            </form>

            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-700">Cirurgiões Cadastrados ({cirurgioes.length})</h3>
              <div className="divide-y divide-gray-100">
                {cirurgioes.map(c => (
                  <div key={c.id} className="py-2.5 flex justify-between items-center text-sm">
                    {cirurgiaoEditandoId === c.id ? (
                      <div className="flex gap-2 w-full">
                        <input type="text" value={nomeCirurgiaoEditado} onChange={(e) => setNomeCirurgiaoEditado(e.target.value)} className="border rounded-lg p-1 text-xs flex-1" />
                        <button onClick={() => salvarEdicaoCirurgiao(c.id)} className="text-emerald-600"><CheckCircle2 className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium text-gray-800">{c.nome}</span>
                        <div className="flex gap-2 text-gray-400">
                          <button onClick={() => { setCirurgiaoEditandoId(c.id); setNomeCirurgiaoEditado(c.nome); }}><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => excluirCirurgiao(c.id, c.nome)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA: RELATÓRIOS */}
        {abaAtiva === 'dashboard' && (
          <div className="space-y-4">
            
            {/* Gráfico Drill Down por Período */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#0284c7]" /> Faturamento por Período
                  </h2>
                  <p className="text-xs text-gray-500 font-semibold mt-1">
                    Total exibido: <strong className="text-gray-900">R$ {dadosGraficoDrill.totalPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </p>
                </div>
                {(escopoGrafico || nivelDrill !== 'ano') && (
                  <button 
                    onClick={() => { setEscopoGrafico(null); setNivelDrill('ano'); }} 
                    className="text-xs text-[#0284c7] font-bold bg-sky-50 px-2.5 py-1.5 rounded-xl border border-sky-100 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Resetar
                  </button>
                )}
              </div>

              {/* Níveis do Gráfico */}
              <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                {(['ano', 'mes', 'semana', 'dia'] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setNivelDrill(n)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${nivelDrill === n ? 'bg-white text-[#0284c7] shadow-sm' : 'text-gray-500'}`}
                  >
                    {({ ano: 'Ano', mes: 'Mês', semana: 'Semana', dia: 'Dia' })[n]}
                  </button>
                ))}
              </div>

              {/* Desenho do Gráfico */}
              <div ref={scrollGraficoRef} className="overflow-x-auto pt-4 pb-2 bg-gray-50/50 rounded-2xl p-3 border border-gray-100">
                <div className="flex items-end gap-3 min-w-max h-48 border-b border-gray-200 pb-2">
                  {dadosGraficoDrill.chavesOrdenadas.map(ch => {
                    const total = dadosGraficoDrill.totaisPorGrupo[ch] || 0;
                    const alt = (total / dadosGraficoDrill.maiorValorTotal) * 140;
                    return (
                      <div 
                        key={ch} 
                        onClick={() => {
                          if (nivelDrill !== 'dia') {
                            setEscopoGrafico({ tipo: nivelDrill, chave: ch });
                            setNivelDrill(nivelDrill === 'ano' ? 'mes' : nivelDrill === 'mes' ? 'semana' : 'dia');
                          }
                        }}
                        className="w-12 flex flex-col items-center cursor-pointer group"
                      >
                        <span className="text-[10px] font-bold text-gray-500 mb-1">
                          {total > 0 ? `R$${total > 1000 ? `${(total/1000).toFixed(1)}k` : total}` : ''}
                        </span>
                        <div 
                          style={{ height: `${Math.max(alt, 4)}px` }} 
                          className={`w-8 rounded-t-lg transition-all shadow-sm ${total > 0 ? 'bg-[#0284c7] group-hover:bg-sky-700' : 'bg-gray-200/60'}`}
                        />
                        <span className="text-[10px] font-semibold text-gray-600 mt-2 text-center">{dadosGraficoDrill.formatarRotulo(ch)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Faturamento e Quitação */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Faturamento Bruto</span>
                <p className="text-xl font-black text-gray-900">
                  R$ {metricasDashboard.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-[#0284c7] font-semibold">{metricasDashboard.quantidade} procedimento(s)</p>
              </div>

              <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Taxa de Quitação</span>
                <p className="text-xl font-black text-emerald-600">
                  {metricasDashboard.taxaRecebimento.toFixed(1)}%
                </p>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div style={{ width: `${metricasDashboard.taxaRecebimento}%` }} className="h-full bg-emerald-500" />
                </div>
              </div>
            </div>

            {/* Faturamento por Clínica (Gráfico de Rosca) */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0284c7]" /> Faturamento por Clínica
              </h3>

              {metricasDashboard.fatiasSVG.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum procedimento no período selecionado.</p>
              ) : (
                <div className="space-y-4">
                  <div className="relative w-64 h-64 mx-auto">
                    <svg width="256" height="256" viewBox="0 0 280 280" className="-rotate-90 overflow-visible">
                      {metricasDashboard.fatiasSVG.map((fatia) => (
                        <path
                          key={fatia.id}
                          d={fatia.pathData}
                          fill="none"
                          stroke={fatia.cor}
                          strokeWidth={fatiaHover?.id === fatia.id ? "42" : "34"}
                          className="cursor-pointer transition-all duration-200"
                          style={{ opacity: fatiaHover && fatiaHover.id !== fatia.id ? 0.35 : 1 }}
                          onMouseEnter={() => setFatiaHover(fatia)}
                          onMouseLeave={() => setFatiaHover(null)}
                        />
                      ))}
                    </svg>

                    <div className="absolute inset-0 m-auto w-36 h-36 bg-white rounded-full shadow-inner flex flex-col items-center justify-center p-2 text-center pointer-events-none">
                      {fatiaHover ? (
                        <>
                          <span className="text-[10px] font-bold uppercase truncate max-w-[110px]" style={{ color: fatiaHover.cor }}>
                            {fatiaHover.nome}
                          </span>
                          <span className="text-sm font-black text-gray-900">
                            R$ {fatiaHover.valor.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500">
                            {fatiaHover.porcentagem.toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Total</span>
                          <span className="text-base font-black text-gray-900">
                            R$ {metricasDashboard.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tabela de Legendas Alinhada */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-gray-400 px-3 pb-1 border-b border-gray-100">
                      <span className="col-span-6">Clínica</span>
                      <span className="col-span-2 text-center">%</span>
                      <span className="col-span-4 text-right">Total (R$)</span>
                    </div>

                    {metricasDashboard.fatiasSVG.map(fatia => (
                      <div 
                        key={fatia.id} 
                        onMouseEnter={() => setFatiaHover(fatia)}
                        onMouseLeave={() => setFatiaHover(null)}
                        className={`grid grid-cols-12 gap-2 items-center text-xs px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                          fatiaHover?.id === fatia.id ? 'bg-sky-50 border-sky-200' : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <span className="col-span-6 font-bold text-gray-700 flex items-center gap-2 truncate">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: fatia.cor }} />
                          <span className="truncate">{fatia.nome}</span>
                        </span>
                        <span className="col-span-2 text-center font-semibold text-gray-500">
                          {fatia.porcentagem.toFixed(1)}%
                        </span>
                        <span className="col-span-4 text-right font-bold text-emerald-600 truncate">
                          R$ {fatia.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pendências por Clínica Detalhada */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" /> Pendências Financeiras
                </h3>

                {Object.keys(metricasDashboard.pendentesPorClinica).length > 0 && (
                  <button
                    onClick={() => copiarResumoWhatsApp(null)}
                    className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors shadow-sm self-start sm:self-auto"
                  >
                    {copiadoWhatsApp ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Copiado para WhatsApp!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" /> Copiar Tudo p/ WhatsApp
                      </>
                    )}
                  </button>
                )}
              </div>

              {Object.keys(metricasDashboard.pendentesPorClinica).length === 0 ? (
                <div className="p-3 text-center bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-semibold">
                  🎉 Nenhuma pendência financeira no momento!
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 gap-2 text-[11px] font-semibold text-gray-400 px-3 pb-1 border-b border-gray-100">
                    <span className="col-span-5">Clínica</span>
                    <span className="col-span-3 text-center">Pendentes</span>
                    <span className="col-span-4 text-right">Retido (R$)</span>
                  </div>

                  {Object.entries(metricasDashboard.pendentesPorClinica).map(([cNome, dados]) => {
                    const estaExpandida = clinicaPendenteExpandida === cNome;
                    return (
                      <div key={cNome} className="rounded-2xl border border-amber-100 bg-amber-50/30 overflow-hidden transition-all">
                        <div 
                          onClick={() => setClinicaPendenteExpandida(estaExpandida ? null : cNome)}
                          className="grid grid-cols-12 gap-2 items-center text-xs px-3 py-3 cursor-pointer hover:bg-amber-100/40 transition-colors"
                        >
                          <span className="col-span-5 font-bold text-gray-800 flex items-center gap-1.5 truncate">
                            {estaExpandida ? <ChevronUp className="w-4 h-4 text-amber-600 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-amber-600 flex-shrink-0" />}
                            <span className="truncate">{cNome}</span>
                          </span>
                          
                          <span className="col-span-3 text-center">
                            <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[11px]">
                              {dados.qtd} ficha(s)
                            </span>
                          </span>

                          <span className="col-span-4 text-right font-bold text-red-600">
                            R$ {dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {estaExpandida && (
                          <div className="bg-white border-t border-amber-100 p-3 space-y-2.5">
                            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                              <span className="text-[11px] font-bold text-gray-500 uppercase">Detalhamento das Fichas</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); copiarResumoWhatsApp(cNome); }}
                                className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" /> Copiar Clínica
                              </button>
                            </div>

                            <div className="space-y-2">
                              {dados.fichas.map(f => (
                                <div key={f.id} className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-xs flex justify-between items-center">
                                  <div className="space-y-0.5">
                                    <p className="font-bold text-gray-900">{f.paciente} <span className="font-semibold text-gray-500">({f.especie || 'Canino'})</span></p>
                                    <p className="text-[11px] text-gray-600">{f.procedimento || 'Anestesia'} · <span className="text-gray-400">Tutor:</span> {f.tutor || '—'}</p>
                                    <p className="text-[10px] text-[#0284c7] font-semibold">{formatarDataBR(f.dataProc)}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-black text-gray-900 text-sm block">R$ {f.valor || '0,00'}</span>
                                    <button
                                      onClick={() => abrirModalQuitacao(f.id, f.paciente)}
                                      className="mt-1 bg-[#0284c7] text-white px-2.5 py-1 rounded-lg text-[10px] font-bold hover:bg-sky-700 shadow-sm"
                                    >
                                      Quitar
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Atendimentos por Espécie */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Dog className="w-4 h-4 text-[#0284c7]" /> Atendimentos por Espécie
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-sky-800">CANINOS</p>
                  <p className="text-2xl font-black text-[#0284c7]">{metricasDashboard.caes}</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-indigo-800">FELINOS</p>
                  <p className="text-2xl font-black text-indigo-600">{metricasDashboard.gatos}</p>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Modal Quitação */}
      {modalQuitacao && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#0284c7]" /> Quitar Procedimento
            </h3>
            <p className="text-xs text-gray-500">Paciente: <strong className="text-gray-800">{modalQuitacao.paciente}</strong></p>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Forma de Pagamento</label>
              <select 
                value={quitFormaPgto} 
                onChange={(e) => setQuitFormaPgto(e.target.value)}
                className="w-full border rounded-xl p-3 text-sm"
              >
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Crédito (à vista)">Crédito (à vista)</option>
                <option value="Crédito (parcelado)">Crédito (parcelado)</option>
                <option value="Cartão de débito">Cartão de débito</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setModalQuitacao(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-600">Cancelar</button>
              <button onClick={confirmarQuitacao} className="flex-1 py-3 bg-[#0284c7] text-white rounded-xl text-xs font-bold">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-2.5 z-20">
        <div className="max-w-md mx-auto flex justify-between items-center relative">
          
          <button 
            onClick={() => setAbaAtiva('historico')}
            className={`flex flex-col items-center gap-1 ${abaAtiva === 'historico' ? 'text-[#0284c7]' : 'text-gray-400'}`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Registros</span>
          </button>

          <button 
            onClick={() => setAbaAtiva('clinicas')}
            className={`flex flex-col items-center gap-1 ${abaAtiva === 'clinicas' ? 'text-[#0284c7]' : 'text-gray-400'}`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Clínicas</span>
          </button>

          {/* Botão Central + */}
          <div className="relative -top-5">
            <button
              onClick={() => setAbaAtiva('formulario')}
              className="w-14 h-14 bg-[#0284c7] text-white rounded-full flex items-center justify-center shadow-lg shadow-sky-500/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Plus className="w-8 h-8" />
            </button>
          </div>

          <button 
            onClick={() => setAbaAtiva('cirurgioes')}
            className={`flex flex-col items-center gap-1 ${abaAtiva === 'cirurgioes' ? 'text-[#0284c7]' : 'text-gray-400'}`}
          >
            <UserCheck className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Equipe</span>
          </button>

          <button 
            onClick={() => setAbaAtiva('dashboard')}
            className={`flex flex-col items-center gap-1 ${abaAtiva === 'dashboard' ? 'text-[#0284c7]' : 'text-gray-400'}`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Relatórios</span>
          </button>

        </div>
      </nav>

    </div>
  );
}
