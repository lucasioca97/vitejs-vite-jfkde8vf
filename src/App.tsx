import { useState, useEffect, useMemo, useRef, type FormEvent } from 'react';
import { 
  Syringe, Plus, Activity, Loader2, 
  Clock, Building2, Pencil, Trash2, X, Check, BarChart3, Dog, Download, LayoutGrid, Table, Search, Filter, UserCheck, CheckCircle2, ChevronLeft, LogOut, MessageCircle, Lock
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';

// Tipagens TypeScript
interface Registo {
  id: string;
  userId: string;
  paciente: string;
  especie?: string;
  peso?: string;
  procedimento: string;
  complexidade?: string;
  tutor?: string;
  local?: string;
  cirurgiao?: string;
  valor?: string;
  formaPgto?: string;
  dataPgto?: string;
  dataProc: string;
  observacoes?: string;
}

interface Clinica {
  id: string;
  userId: string;
  nome: string;
}

interface Cirurgiao {
  id: string;
  userId: string;
  nome: string;
}

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
const auth = getAuth(app);

const PALETA_CORES = [
  '#0284c7', '#0369a1', '#2563eb', '#3b82f6', '#0ea5e9', 
  '#06b6d4', '#6366f1', '#8b5cf6', '#10b981', '#f59e0b'
];

export default function App() {
  // Autenticação Firebase
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [erroLogin, setErroLogin] = useState('');

  // Estados dos Dados
  const [registos, setRegistos] = useState<Registo[]>([]);
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [cirurgioes, setCirurgioes] = useState<Cirurgiao[]>([]);
  const [errosCarregamento, setErrosCarregamento] = useState<Record<string, string>>({});
  
  const [salvando, setSalvando] = useState(false);
  const [salvandoClinica, setSalvandoClinica] = useState(false);
  const [salvandoCirurgiao, setSalvandoCirurgiao] = useState(false);
  
  const [abaAtiva, setAbaAtiva] = useState<'historico' | 'formulario' | 'clinicas' | 'cirurgioes' | 'dashboard'>('historico');
  const [modoVisualizacao, setModoVisualizacao] = useState<'cards' | 'tabela'>('cards');

  // Filtros Histórico
  const [buscaHistorico, setBuscaHistorico] = useState('');
  const [filtroClinicaHistorico, setFiltroClinicaHistorico] = useState('');
  const [filtroStatusHistorico, setFiltroStatusHistorico] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [ordenacaoHistorico, setOrdenacaoHistorico] = useState<'data-desc' | 'data-asc' | 'paciente-asc' | 'paciente-desc'>('data-desc');

  // Filtros Dashboard / Relatórios
  const [relatorioClinica, setRelatorioClinica] = useState('');
  const [relatorioStatus, setRelatorioStatus] = useState('');
  const [relatorioDataInicio, setRelatorioDataInicio] = useState('');
  const [relatorioDataFim, setRelatorioDataFim] = useState('');

  // Campos do Formulário
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

  // Modais e Edições
  const [modalQuitacao, setModalQuitacao] = useState<{ id: string; paciente: string } | null>(null);
  const [quitFormaPgto, setQuitFormaPgto] = useState('Pix');
  const [quitDataPgto, setQuitDataPgto] = useState(() => new Date().toISOString().slice(0, 10));

  const [novaClinicaNome, setNovaClinicaNome] = useState('');
  const [clinicaEditandoId, setClinicaEditandoId] = useState<string | null>(null);
  const [nomeClinicaEditado, setNomeClinicaEditado] = useState('');

  const [novoCirurgiaoNome, setNovoCirurgiaoNome] = useState('');
  const [cirurgiaoEditandoId, setCirurgiaoEditandoId] = useState<string | null>(null);
  const [nomeCirurgiaoEditado, setNomeCirurgiaoEditado] = useState('');

  const [fichaEditandoId, setFichaEditandoId] = useState<string | null>(null);
  const [editFichaData, setEditFichaData] = useState<Partial<Registo>>({});

  // Dashboard Drill Down
  const [nivelDrill, setNivelDrill] = useState<'ano' | 'mes' | 'semana' | 'dia'>('mes');
  const [escopoGrafico, setEscopoGrafico] = useState<{ tipo: 'ano' | 'mes' | 'semana'; chave: string } | null>(null);
  const scrollGraficoRef = useRef<HTMLDivElement>(null);
  const [fatiaHover, setFatiaHover] = useState<{ id: string; nome: string; valor: number; porcentagem: number; cor: string } | null>(null);
  const [clinicaExpandidaPendencia, setClinicaExpandidaPendencia] = useState<string | null>(null);

  // Monitorizar estado da Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // Consultas por proprietario: a ordenacao e feita no cliente para nao
  // depender de indices compostos (userId + dataCriacao/nome).
  useEffect(() => {
    if (!user) {
      setRegistos([]);
      setClinicas([]);
      setCirurgioes([]);
      setErrosCarregamento({});
      return;
    }

    const limparErro = (colecao: string) => {
      setErrosCarregamento(anteriores => {
        if (!(colecao in anteriores)) return anteriores;
        const atualizados = { ...anteriores };
        delete atualizados[colecao];
        return atualizados;
      });
    };

    const registrarErro = (colecao: string, error: Error) => {
      console.error(`Erro ao carregar ${colecao}:`, error);
      setErrosCarregamento(anteriores => ({
        ...anteriores,
        [colecao]: `${error.message}`
      }));
    };

    const qAnestesias = query(
      collection(db, 'anestesias'),
      where('userId', '==', user.uid)
    );
    const unsubAnestesias = onSnapshot(qAnestesias, snapshot => {
      const dados = snapshot.docs.map(documento => ({
        ...documento.data(), id: documento.id
      })) as Registo[];
      setRegistos(dados);
      limparErro('anestesias');
    }, error => registrarErro('anestesias', error));

    const qClinicas = query(
      collection(db, 'clinicas'),
      where('userId', '==', user.uid)
    );
    const unsubClinicas = onSnapshot(qClinicas, snapshot => {
      const dados = snapshot.docs.map(documento => ({
        ...documento.data(), id: documento.id
      })) as Clinica[];
      dados.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      setClinicas(dados);
      limparErro('clinicas');
    }, error => registrarErro('clinicas', error));

    const qCirurgioes = query(
      collection(db, 'cirurgioes'),
      where('userId', '==', user.uid)
    );
    const unsubCirurgioes = onSnapshot(qCirurgioes, snapshot => {
      const dados = snapshot.docs.map(documento => ({
        ...documento.data(), id: documento.id
      })) as Cirurgiao[];
      dados.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      setCirurgioes(dados);
      limparErro('cirurgioes');
    }, error => registrarErro('cirurgioes', error));

    return () => {
      unsubAnestesias();
      unsubClinicas();
      unsubCirurgioes();
    };
  }, [user]);

  // Handlers Autenticação
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setErroLogin('');
    try {
      await signInWithEmailAndPassword(auth, emailLogin, senhaLogin);
    } catch {
      setErroLogin('E-mail ou palavra-passe incorretos.');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // Funções Utilitárias e Sanitização
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

  const guardarRegisto = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSalvando(true);
    try {
      const dataPagamentoFinal = statusPgto === 'Pago' 
        ? (dataPgto || new Date().toISOString().slice(0, 10))
        : '';

      await addDoc(collection(db, 'anestesias'), {
        userId: user.uid,
        dataProc, local, valor, cirurgiao,
        dataPgto: dataPagamentoFinal,
        paciente, especie, peso,
        formaPgto: statusPgto === 'Pago' ? formaPgto : '',
        tutor, procedimento, complexidade, observacoes,
        dataCriacao: serverTimestamp()
      });

      setDataProc(new Date().toISOString().slice(0, 10));
      setLocal(''); setValor(''); setCirurgiao(''); setDataPgto('');
      setPaciente(''); setEspecie('Canino'); setPeso(''); setFormaPgto('Pix');
      setStatusPgto('Pago'); setTutor(''); setProcedimento(''); setComplexidade('Média'); setObservacoes('');
      setAbaAtiva('historico');
    } catch {
      alert("Erro ao guardar o registo.");
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
    } catch {
      alert("Erro ao quitar procedimento.");
    }
  };

  const alternarStatusPendente = async (id: string) => {
    try {
      await updateDoc(doc(db, 'anestesias', id), { dataPgto: '', formaPgto: '' });
    } catch {
      alert("Erro ao alterar status.");
    }
  };

  const excluirFicha = async (id: string, nomePaciente: string) => {
    if (confirm(`Deseja excluir a ficha do paciente "${nomePaciente}"?`)) {
      try {
        await deleteDoc(doc(db, 'anestesias', id));
      } catch {
        alert("Erro ao excluir ficha.");
      }
    }
  };

  const iniciarEdicaoFicha = (registo: Registo) => {
    setFichaEditandoId(registo.id);
    setEditFichaData({ ...registo });
  };

  const salvarEdicaoFicha = async (id: string) => {
    if (!editFichaData.paciente?.trim() || !editFichaData.procedimento?.trim()) {
      alert("Paciente e Procedimento são obrigatórios.");
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
    } catch {
      alert("Erro ao atualizar ficha.");
    }
  };

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

      let batePeriodo = true;
      if (filtroDataInicio && item.dataProc < filtroDataInicio) batePeriodo = false;
      if (filtroDataFim && item.dataProc > filtroDataFim) batePeriodo = false;

      return bateBusca && bateClinica && bateStatus && batePeriodo;
    }).sort((a, b) => {
      if (ordenacaoHistorico === 'paciente-asc') return (a.paciente || '').localeCompare(b.paciente || '');
      if (ordenacaoHistorico === 'paciente-desc') return (b.paciente || '').localeCompare(a.paciente || '');
      if (ordenacaoHistorico === 'data-asc') return (a.dataProc || '').localeCompare(b.dataProc || '');
      return (b.dataProc || '').localeCompare(a.dataProc || '');
    });
  }, [registos, buscaHistorico, filtroClinicaHistorico, filtroStatusHistorico, filtroDataInicio, filtroDataFim, ordenacaoHistorico]);

  const registosRelatorioFiltrados = useMemo(() => {
    return registos.filter(item => {
      const bateClinica = !relatorioClinica || item.local === relatorioClinica;
      let bateStatus = true;
      if (relatorioStatus === 'pago') bateStatus = Boolean(item.dataPgto);
      if (relatorioStatus === 'pendente') bateStatus = !item.dataPgto;

      let batePeriodo = true;
      if (relatorioDataInicio && item.dataProc < relatorioDataInicio) batePeriodo = false;
      if (relatorioDataFim && item.dataProc > relatorioDataFim) batePeriodo = false;

      return bateClinica && bateStatus && batePeriodo;
    });
  }, [registos, relatorioClinica, relatorioStatus, relatorioDataInicio, relatorioDataFim]);

  // Prevenção contra CSV Injection
  const sanitizeCsvField = (field: string | undefined) => {
    if (!field) return '""';
    const clean = field.replace(/"/g, '""');
    if (/^[=+\-@;]/.test(clean)) {
      return `"'${clean}"`;
    }
    return `"${clean}"`;
  };

  const exportarCSV = () => {
    if (registosFiltradosEOrdenados.length === 0) return;
    const cabecalho = ["Data Procedimento", "Paciente", "Espécie", "Peso (kg)", "Procedimento", "Complexidade", "Tutor", "Local / Clínica", "Cirurgião", "Valor (R$)", "Forma Pagamento", "Data Pagamento", "Observações"];
    const linhas = registosFiltradosEOrdenados.map(r => [
      sanitizeCsvField(r.dataProc),
      sanitizeCsvField(r.paciente),
      sanitizeCsvField(r.especie || 'Canino'),
      sanitizeCsvField(r.peso),
      sanitizeCsvField(r.procedimento),
      sanitizeCsvField(r.complexidade || 'Média'),
      sanitizeCsvField(r.tutor),
      sanitizeCsvField(r.local),
      sanitizeCsvField(r.cirurgiao),
      sanitizeCsvField(r.valor),
      sanitizeCsvField(r.formaPgto),
      sanitizeCsvField(r.dataPgto),
      sanitizeCsvField(r.observacoes)
    ]);
    const conteudoCSV = "\uFEFF" + [cabecalho.join(";"), ...linhas.map(l => l.join(";"))].join("\n");
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const linkDownload = document.createElement('a');
    linkDownload.setAttribute('href', url);
    linkDownload.setAttribute('download', `anestvet_registros_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(linkDownload);
    linkDownload.click();
    document.body.removeChild(linkDownload);
    URL.revokeObjectURL(url);
  };

  const guardarClinica = async (e: FormEvent) => {
    e.preventDefault();
    if (!novaClinicaNome.trim() || !user) return;
    setSalvandoClinica(true);
    try {
      await addDoc(collection(db, 'clinicas'), { 
        userId: user.uid, 
        nome: novaClinicaNome.trim(), 
        dataCriacao: serverTimestamp() 
      });
      setNovaClinicaNome('');
    } catch {
      alert("Erro ao cadastrar clínica.");
    }
    setSalvandoClinica(false);
  };

  const excluirClinica = async (id: string, nome: string) => {
    if (confirm(`Excluir clínica "${nome}"?`)) {
      try { await deleteDoc(doc(db, 'clinicas', id)); } catch {
        alert("Erro ao excluir clínica.");
      }
    }
  };

  const salvarEdicaoClinica = async (id: string) => {
    if (!nomeClinicaEditado.trim()) return;
    try {
      await updateDoc(doc(db, 'clinicas', id), { nome: nomeClinicaEditado.trim() });
      setClinicaEditandoId(null); setNomeClinicaEditado('');
    } catch {
      alert("Erro ao atualizar clínica.");
    }
  };

  const guardarCirurgiao = async (e: FormEvent) => {
    e.preventDefault();
    if (!novoCirurgiaoNome.trim() || !user) return;
    setSalvandoCirurgiao(true);
    try {
      await addDoc(collection(db, 'cirurgioes'), { 
        userId: user.uid, 
        nome: novoCirurgiaoNome.trim(), 
        dataCriacao: serverTimestamp() 
      });
      setNovoCirurgiaoNome('');
    } catch {
      alert("Erro ao cadastrar cirurgião.");
    }
    setSalvandoCirurgiao(false);
  };

  const excluirCirurgiao = async (id: string, nome: string) => {
    if (confirm(`Excluir cirurgião "${nome}"?`)) {
      try { await deleteDoc(doc(db, 'cirurgioes', id)); } catch {
        alert("Erro ao excluir cirurgião.");
      }
    }
  };

  const salvarEdicaoCirurgiao = async (id: string) => {
    if (!nomeCirurgiaoEditado.trim()) return;
    try {
      await updateDoc(doc(db, 'cirurgioes', id), { nome: nomeCirurgiaoEditado.trim() });
      setCirurgiaoEditandoId(null); setNomeCirurgiaoEditado('');
    } catch {
      alert("Erro ao atualizar cirurgião.");
    }
  };

  const formatarDataBR = (strData: string) => {
    if (!strData) return '—';
    const partes = strData.split('-');
    if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
    return strData;
  };

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
    const mapaCoresClinicas: { [nome: string]: string } = {};
    clinicas.forEach((c, idx) => { mapaCoresClinicas[c.nome] = PALETA_CORES[idx % PALETA_CORES.length]; });

    const filtrados = registosRelatorioFiltrados.filter(r => {
      if (!r.dataProc) return false;
      if (!escopoGrafico) return true;
      if (escopoGrafico.tipo === 'ano') return getAnoFromData(r.dataProc) === escopoGrafico.chave;
      if (escopoGrafico.tipo === 'mes') return getMesFromData(r.dataProc) === escopoGrafico.chave;
      return getSemanaFromData(r.dataProc) === escopoGrafico.chave;
    });

    const grupos: { [chave: string]: { [local: string]: number } } = {};
    const totaisPorGrupo: { [chave: string]: number } = {};
    const clinicasPresentes = new Set<string>();
    let totalPeriodo = 0;

    if (nivelDrill === 'dia') {
      let dataInicio: Date;
      let dataFim: Date;

      if (escopoGrafico && escopoGrafico.tipo === 'mes') {
        const [ano, mes] = escopoGrafico.chave.split('-').map(Number);
        dataInicio = new Date(Date.UTC(ano, mes - 1, 1));
        const ultimoDiaDoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
        dataFim = new Date(Date.UTC(ano, mes - 1, ultimoDiaDoMes));
      } else if (relatorioDataInicio && relatorioDataFim) {
        dataInicio = new Date(`${relatorioDataInicio}T00:00:00Z`);
        dataFim = new Date(`${relatorioDataFim}T00:00:00Z`);
      } else {
        const agora = new Date();
        dataInicio = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), 1));
        dataFim = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));
      }

      let dataCursor = new Date(dataInicio);
      while (dataCursor <= dataFim) {
        const diaIso = dataCursor.toISOString().slice(0, 10);
        grupos[diaIso] = {};
        totaisPorGrupo[diaIso] = 0;
        dataCursor.setUTCDate(dataCursor.getUTCDate() + 1);
      }
    }

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

    const chavesOrdenadas = Object.keys(grupos).sort();
    const maiorValorTotal = Math.max(...Object.values(totaisPorGrupo), 1);

    const formatarRotulo = (ch: string, n: 'ano' | 'mes' | 'semana' | 'dia' = nivelDrill): string => {
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
      const [, m, d] = ch.split('-');
      return `${d}/${m}`;
    };

    return {
      chavesOrdenadas, grupos, totaisPorGrupo, maiorValorTotal, totalPeriodo,
      clinicasPresentes: Array.from(clinicasPresentes), formatarRotulo, mapaCoresClinicas
    };
  }, [registosRelatorioFiltrados, clinicas, nivelDrill, escopoGrafico, relatorioDataInicio, relatorioDataFim]);

  const metricasDashboard = useMemo(() => {
    let totalGeral = 0, totalPago = 0, totalPendente = 0, caes = 0, gatos = 0;
    const porClinica: { [k: string]: number } = {};
    const pendentesPorClinica: { [k: string]: { valor: number, qtd: number, fichas: Registo[] } } = {};

    registosRelatorioFiltrados.forEach(item => {
      const v = item.valor ? parseFloat(item.valor.replace('.', '').replace(',', '.')) : 0;
      totalGeral += v;
      const cNome = item.local || 'Não informada';

      if (item.dataPgto) {
        totalPago += v;
      } else {
        totalPendente += v;
        if (!pendentesPorClinica[cNome]) {
          pendentesPorClinica[cNome] = { valor: 0, qtd: 0, fichas: [] };
        }
        pendentesPorClinica[cNome].valor += v;
        pendentesPorClinica[cNome].qtd += 1;
        pendentesPorClinica[cNome].fichas.push(item);
      }

      if (item.especie === 'Felino' || item.especie === 'Gato') gatos++;
      else caes++;

      if (item.local) porClinica[item.local] = (porClinica[item.local] || 0) + v;
    });

    const taxaRecebimento = totalGeral > 0 ? (totalPago / totalGeral) * 100 : 0;
    const listaClinicas = Object.entries(porClinica).sort((a, b) => b[1] - a[1]);
    let anguloAcumulado = 0;

    const fatiasSVG = listaClinicas.map(([nome, valor], index) => {
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
      quantidade: registosRelatorioFiltrados.length, totalGeral, totalPago, totalPendente,
      taxaRecebimento, caes, gatos, porClinica, fatiasSVG, pendentesPorClinica
    };
  }, [registosRelatorioFiltrados]);

  const enviarWhatsAppClinica = (clinicaNome: string) => {
    const dados = metricasDashboard.pendentesPorClinica[clinicaNome];

    if (!dados || dados.fichas.length === 0) {
      alert("Não existem pendências para esta clínica.");
      return;
    }

    const dataInicio = relatorioDataInicio
      ? formatarDataBR(relatorioDataInicio)
      : null;
    const dataFim = relatorioDataFim
      ? formatarDataBR(relatorioDataFim)
      : null;

    let periodo = 'Todo o período';
    if (dataInicio && dataFim) {
      periodo = `${dataInicio} a ${dataFim}`;
    } else if (dataInicio) {
      periodo = `A partir de ${dataInicio}`;
    } else if (dataFim) {
      periodo = `Até ${dataFim}`;
    }

    let texto = `*ANESTVET | RELATÓRIO DE PENDÊNCIAS FINANCEIRAS*\n`;
    texto += `Clínica: *${clinicaNome}*\n`;
    texto += `Período: *${periodo}*\n\n`;
    texto += `Prezados, segue a relação dos procedimentos com pagamento pendente no período informado.\n\n`;

    dados.fichas.forEach((f, index) => {
      texto += `*${index + 1}. ${f.paciente}* (${f.especie || 'Canino'})\n`;
      texto += `Data do procedimento: ${formatarDataBR(f.dataProc)}\n`;
      texto += `Procedimento: ${f.procedimento}\n`;
      texto += `Valor: R$ ${f.valor || '0,00'}\n\n`;
    });

    texto += `--------------------------------\n`;
    texto += `*Quantidade de procedimentos:* ${dados.qtd}\n`;
    texto += `*Total pendente: R$ ${dados.valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2
    })}*\n\n`;
    texto += `Atenciosamente,\nAnestVet`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const limparFiltrosRelatorio = () => {
    setRelatorioClinica('');
    setRelatorioStatus('');
    setRelatorioDataInicio('');
    setRelatorioDataFim('');
  };

  // 1. Ecrã de Carregamento da Autenticação
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#0284c7] animate-spin" />
      </div>
    );
  }

  // 2. Ecrã de Login (Utilizador não autenticado)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8faf8] flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl w-full max-w-sm space-y-5 text-left">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-[#0284c7] rounded-full flex items-center justify-center text-white mx-auto shadow-md shadow-sky-500/20">
              <Syringe className="w-6 h-6 -rotate-45" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">AnestVet</h1>
            <p className="text-xs text-gray-500">Inicie sessão para aceder ao sistema</p>
          </div>

          {erroLogin && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold">
              {erroLogin}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail</label>
              <input 
                type="email" 
                required 
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0284c7]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Palavra-passe</label>
              <input 
                type="password" 
                required 
                value={senhaLogin}
                onChange={(e) => setSenhaLogin(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0284c7]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0284c7] text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 hover:bg-sky-700 transition-colors"
            >
              <Lock className="w-4 h-4" /> Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. Aplicação Principal (Utilizador autenticado)
  return (
    <div className="min-h-screen bg-[#f8faf8] text-gray-800 font-sans pb-28">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-[#0284c7] rounded-full flex items-center justify-center text-white shadow-md shadow-sky-500/20">
            <Syringe className="w-5 h-5 -rotate-45" />
          </div>
          <span className="font-bold text-xl text-gray-900 tracking-tight">AnestVet</span>
        </div>
        <button 
          onClick={handleLogout}
          title="Sair da conta"
          className="text-gray-500 hover:text-red-600 transition-colors p-1 flex items-center gap-1.5 text-xs font-semibold"
        >
          <LogOut className="w-5 h-5" /> Sair
        </button>
      </header>

      {/* Main Container */}
      <main className="p-4 max-w-lg mx-auto w-full text-left">
        <div className="mb-3 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-[11px] text-sky-800 break-all">
          <span className="font-bold">Conta conectada:</span> {user.email || '(sem e-mail)'}
          <span className="block"><span className="font-bold">UID:</span> {user.uid}</span>
        </div>

        {Object.keys(errosCarregamento).length > 0 && (
          <div role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-bold mb-2">Falha ao consultar o Firebase</p>
            {Object.entries(errosCarregamento).map(([colecao, mensagem]) => (
              <p key={colecao} className="break-words mb-1">
                <strong>{colecao}:</strong> {mensagem}
              </p>
            ))}
            <p className="mt-2 text-xs">Nenhum dado foi excluído. Confira a mensagem acima antes de alterar as regras.</p>
          </div>
        )}

        
        {/* VIEW: REGISTROS */}
        {abaAtiva === 'historico' && (
          <div className="space-y-4">
            
            {/* Header Totais */}
            <div className="flex justify-between items-center">
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

            {/* Busca & Filtro */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar paciente, tutor, cirurgia..."
                  value={buscaHistorico}
                  onChange={(e) => setBuscaHistorico(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#0284c7] shadow-sm"
                />
              </div>
              <button 
                onClick={() => setFiltroStatusHistorico(filtroStatusHistorico === '' ? 'pago' : filtroStatusHistorico === 'pago' ? 'pendente' : '')}
                className={`border rounded-2xl px-3.5 flex items-center justify-center transition-all ${filtroStatusHistorico ? 'bg-sky-50 border-[#0284c7] text-[#0284c7]' : 'bg-white border-gray-200 text-gray-600'}`}
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>

            {/* Filtros de Status Botões */}
            <div className="flex gap-2">
              {[
                { id: '', label: 'Todos' },
                { id: 'pago', label: 'Pago' },
                { id: 'pendente', label: 'Pendente' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setFiltroStatusHistorico(st.id)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    filtroStatusHistorico === st.id
                      ? 'bg-[#0284c7] text-white border-[#0284c7]'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Filtros de Intervalo de Data */}
            <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Período De:</label>
                <input
                  type="date"
                  value={filtroDataInicio}
                  onChange={(e) => setFiltroDataInicio(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Período Até:</label>
                <input
                  type="date"
                  value={filtroDataFim}
                  onChange={(e) => setFiltroDataFim(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 outline-none"
                />
              </div>
            </div>

            {/* Seletores Secundários */}
            <div className="grid grid-cols-2 gap-2">
              <select 
                value={filtroClinicaHistorico} 
                onChange={(e) => setFiltroClinicaHistorico(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 outline-none"
              >
                <option value="">Todas as Clínicas</option>
                {clinicas.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
              </select>
              <select 
                value={ordenacaoHistorico} 
                onChange={(e) => setOrdenacaoHistorico(e.target.value as any)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-[#0284c7] outline-none"
              >
                <option value="data-desc">Mais Recentes</option>
                <option value="data-asc">Mais Antigos</option>
                <option value="paciente-asc">Paciente (A-Z)</option>
              </select>
            </div>

            {/* LISTA DE CARDS */}
            {modoVisualizacao === 'cards' ? (
              <div className="space-y-3.5">
                {registosFiltradosEOrdenados.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-100 rounded-3xl p-4 shadow-sm">
                    {fichaEditandoId === item.id ? (
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
                        <button onClick={() => salvarEdicaoFicha(item.id)} className="w-full bg-[#0284c7] text-white py-2 rounded-xl text-xs font-bold">Salvar Alterações</button>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h3 className="font-bold text-gray-900 text-base leading-snug">
                              {item.paciente} <span className="font-normal text-gray-500">· {item.especie || 'Canino'}, {item.peso ? `${item.peso} kg` : ''}</span>
                            </h3>
                            <p className="text-gray-700 font-medium text-sm mt-0.5">
                              {item.procedimento} <span className="text-xs text-[#0284c7] font-semibold">({item.complexidade || 'Média'})</span>
                            </p>
                          </div>
                          <span className="font-bold text-lg text-gray-900">R$ {item.valor || '0,00'}</span>
                        </div>

                        <div className="flex justify-between text-xs text-gray-500 my-3">
                          <div className="space-y-1">
                            <p><span className="text-gray-400">Tutor:</span> {item.tutor || '—'}</p>
                            <p><span className="text-gray-400">Clínica:</span> {item.local || '—'}</p>
                            <p><span className="text-gray-400">Cirurgião:</span> {item.cirurgiao || '—'}</p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-medium text-gray-600">{formatarDataBR(item.dataProc)}</p>
                            <p className="font-semibold text-gray-700">{item.formaPgto || 'Pendente'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                          {item.dataPgto ? (
                            <span className="bg-sky-50 text-[#0284c7] text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1 border border-sky-100">
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
                              className="px-3.5 py-2 bg-[#0284c7] text-white rounded-xl text-xs font-semibold shadow-sm"
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

        {/* VIEW: NOVO REGISTRO */}
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

            <div className="space-y-4">
              <span className="text-xs font-bold tracking-wider text-gray-400 uppercase">DATA & PACIENTE</span>
              
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Data do procedimento *</label>
                <input
                  type="date"
                  required
                  value={dataProc}
                  onChange={(e) => setDataProc(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0284c7]"
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Espécie *</label>
                <div className="flex gap-2">
                  {['Canino', 'Felino', 'Outro'].map((esp) => (
                    <button
                      key={esp}
                      type="button"
                      onClick={() => setEspecie(esp)}
                      className={`flex-1 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                        especie === esp 
                          ? 'bg-[#0284c7] text-white border-[#0284c7]' 
                          : 'bg-white text-gray-600 border-gray-200'
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">Complexidade *</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Baixa', 'Média', 'Alta', 'Emergência'].map((comp) => (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => setComplexidade(comp)}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        complexidade === comp 
                          ? 'bg-[#0284c7] text-white border-[#0284c7]' 
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {comp}
                    </button>
                  ))}
                </div>
              </div>

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
                    className="w-12 border border-gray-200 rounded-xl flex items-center justify-center text-[#0284c7]"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

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
                    className="w-12 border border-gray-200 rounded-xl flex items-center justify-center text-[#0284c7]"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

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
                          ? 'bg-[#0284c7] text-white border-[#0284c7]'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {statusPgto === 'Pago' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Método de pagamento *</label>
                  <div className="flex flex-wrap gap-2">
                    {['Pix', 'Dinheiro', 'Crédito (à vista)', 'Crédito (parcelado)', 'Cartão de débito'].map((metodo) => (
                      <button
                        key={metodo}
                        type="button"
                        onClick={() => setFormaPgto(metodo)}
                        className={`px-4 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                          formaPgto === metodo
                            ? 'bg-[#0284c7] text-white border-[#0284c7]'
                            : 'bg-white text-gray-600 border-gray-200'
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
              className="w-full bg-[#0284c7] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2"
            >
              {salvando ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar registro'}
            </button>
          </form>
        )}

        {/* VIEW: CLÍNICAS */}
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
                        <button onClick={() => salvarEdicaoClinica(c.id)} className="text-emerald-600"><Check className="w-4 h-4" /></button>
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

        {/* VIEW: CIRURGIÕES */}
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
                        <button onClick={() => salvarEdicaoCirurgiao(c.id)} className="text-emerald-600"><Check className="w-4 h-4" /></button>
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

        {/* VIEW: DASHBOARD / RELATÓRIOS */}
        {abaAtiva === 'dashboard' && (
          <div className="space-y-4">
            
            {/* PAINEL DE FILTROS DO RELATÓRIO */}
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-[#0284c7]" /> Filtros do Relatório
                </span>
                {(relatorioClinica || relatorioStatus || relatorioDataInicio || relatorioDataFim) && (
                  <button 
                    onClick={limparFiltrosRelatorio}
                    className="text-[11px] font-bold text-red-500 hover:underline"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Status de Pagamento</label>
                <div className="flex gap-1.5">
                  {[
                    { id: '', label: 'Todos' },
                    { id: 'pago', label: 'Pago' },
                    { id: 'pendente', label: 'Pendente' }
                  ].map(st => (
                    <button
                      key={st.id}
                      onClick={() => setRelatorioStatus(st.id)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        relatorioStatus === st.id
                          ? 'bg-[#0284c7] text-white border-[#0284c7]'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Clínica / Local</label>
                <select 
                  value={relatorioClinica} 
                  onChange={(e) => setRelatorioClinica(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:border-[#0284c7]"
                >
                  <option value="">Todas as Clínicas</option>
                  {clinicas.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Período De</label>
                  <input
                    type="date"
                    value={relatorioDataInicio}
                    onChange={(e) => setRelatorioDataInicio(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#0284c7]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Período Até</label>
                  <input
                    type="date"
                    value={relatorioDataFim}
                    onChange={(e) => setRelatorioDataFim(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-gray-700 outline-none focus:border-[#0284c7]"
                  />
                </div>
              </div>
            </div>

            {/* Gráfico Drill Down */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#0284c7]" /> Faturamento
                </h2>
                {(escopoGrafico || nivelDrill !== 'ano') && (
                  <button onClick={() => { setEscopoGrafico(null); setNivelDrill('ano'); }} className="text-xs text-[#0284c7] font-semibold flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Resetar
                  </button>
                )}
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                {(['ano', 'mes', 'semana', 'dia'] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setNivelDrill(n)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg ${nivelDrill === n ? 'bg-white text-[#0284c7] shadow-sm' : 'text-gray-500'}`}
                  >
                    {n.toUpperCase()}
                  </button>
                ))}
              </div>

              <div ref={scrollGraficoRef} className="overflow-x-auto pt-4 pb-2">
                <div className="flex items-end gap-3 min-w-max h-48 border-b border-gray-100 pb-2">
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
                        <span className="text-[10px] font-bold text-gray-500 mb-1">R${total > 1000 ? `${(total/1000).toFixed(1)}k` : total}</span>
                        <div 
                          style={{ height: `${Math.max(alt, 6)}px` }} 
                          className="w-8 bg-[#0284c7] rounded-t-lg group-hover:bg-sky-[#0284c7]/80 transition-all"
                        />
                        <span className="text-[10px] font-semibold text-gray-600 mt-2">{dadosGraficoDrill.formatarRotulo(ch)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Gráfico Rosca por Clínica */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0284c7]" /> Faturamento por Clínica
              </h2>

              <div className="relative w-64 h-64 mx-auto">
                <svg width="256" height="256" viewBox="0 0 280 280" className="rotate-[-90deg]">
                  {metricasDashboard.fatiasSVG.map(fatia => (
                    <path
                      key={fatia.id}
                      d={fatia.pathData}
                      fill="none"
                      stroke={fatia.cor}
                      strokeWidth={fatiaHover?.id === fatia.id ? "42" : "34"}
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setFatiaHover(fatia)}
                      onMouseLeave={() => setFatiaHover(null)}
                    />
                  ))}
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  {fatiaHover ? (
                    <>
                      <span className="text-xs font-bold text-gray-400 uppercase">{fatiaHover.nome}</span>
                      <span className="text-lg font-black text-gray-900">R$ {fatiaHover.valor.toLocaleString('pt-BR')}</span>
                      <span className="text-xs font-bold text-[#0284c7]">{fatiaHover.porcentagem.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-gray-400 uppercase">Total</span>
                      <span className="text-xl font-black text-gray-900">R$ {metricasDashboard.totalGeral.toLocaleString('pt-BR')}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 border-t border-gray-100 pt-3 text-xs font-semibold">
                {metricasDashboard.fatiasSVG.map(fatia => (
                  <div 
                    key={fatia.id} 
                    className="grid grid-cols-12 items-center py-1.5 px-2 rounded-xl hover:bg-sky-50 transition-colors"
                    onMouseEnter={() => setFatiaHover(fatia)}
                    onMouseLeave={() => setFatiaHover(null)}
                  >
                    <div className="col-span-6 flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: fatia.cor }} />
                      <span className="text-gray-700 truncate">{fatia.nome}</span>
                    </div>
                    <div className="col-span-2 text-center text-gray-400 font-bold">
                      {fatia.porcentagem.toFixed(1)}%
                    </div>
                    <div className="col-span-4 text-right font-bold text-gray-900">
                      R$ {fatia.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pendências Financeiras */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-600" /> Pendências Financeiras
                </h2>
              </div>

              <div className="space-y-2 text-xs">
                {Object.entries(metricasDashboard.pendentesPorClinica).map(([cNome, dados]) => (
                  <div key={cNome} className="border border-gray-100 rounded-2xl overflow-hidden">
                    <div 
                      onClick={() => setClinicaExpandidaPendencia(clinicaExpandidaPendencia === cNome ? null : cNome)}
                      className="grid grid-cols-12 items-center p-3 bg-gray-50 cursor-pointer hover:bg-amber-50/50"
                    >
                      <div className="col-span-6 font-bold text-gray-800">{cNome}</div>
                      <div className="col-span-2 text-center text-amber-700 font-bold">{dados.qtd} pend.</div>
                      <div className="col-span-4 text-right font-black text-red-600">
                        R$ {dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    {clinicaExpandidaPendencia === cNome && (
                      <div className="p-3 bg-white space-y-2 border-t border-gray-100">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => enviarWhatsAppClinica(cNome)}
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-semibold shadow-sm transition-colors"
                            title={`Enviar pendências de ${cNome} pelo WhatsApp`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Enviar WhatsApp
                          </button>
                        </div>
                        {dados.fichas.map(f => (
                          <div key={f.id} className="flex justify-between items-center text-[11px] border-b pb-1.5 last:border-0">
                            <div>
                              <p className="font-bold text-gray-800">{f.paciente} <span className="font-normal text-gray-400">({f.especie})</span></p>
                              <p className="text-gray-500">{f.procedimento} · {formatarDataBR(f.dataProc)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900">R$ {f.valor}</p>
                              <button 
                                onClick={() => abrirModalQuitacao(f.id, f.paciente)}
                                className="text-[10px] text-[#0284c7] font-bold underline"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Atendimentos por Espécie */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Dog className="w-4 h-4 text-[#0284c7]" /> Atendimentos por Espécie
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-sky-800 uppercase">CANINOS</p>
                  <p className="text-2xl font-black text-[#0284c7]">{metricasDashboard.caes}</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                  <p className="text-xs font-bold text-indigo-800 uppercase">FELINOS</p>
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
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl text-left">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#0284c7]" /> Quitar Procedimento
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

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Data do Pagamento</label>
              <input 
                type="date"
                value={quitDataPgto}
                onChange={(e) => setQuitDataPgto(e.target.value)}
                className="w-full border rounded-xl p-3 text-sm"
              />
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

          {/* Botão Central */}
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
