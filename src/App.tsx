import { useState, useEffect, useMemo, useRef, type FormEvent } from 'react';
import { 
  Stethoscope, User, Plus, Activity, Loader2, MapPin, 
  DollarSign, Calendar, FileText, CheckCircle2, Clock, Building2, 
  Pencil, Trash2, X, Check, Save, BarChart3, Dog, Download, LayoutGrid, Table, Search, Filter, UserCheck, CheckCircle, TrendingUp, AlertCircle, ChevronLeft
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';

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

// Paleta do Dashboard
const PALETA_CORES = [
  '#0284c7', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', 
  '#8b5cf6', '#6366f1', '#14b8a6', '#f97316', '#84cc16'
];

export default function App() {
  const [registos, setRegistos] = useState<any[]>([]);
  const [clinicas, setClinicas] = useState<any[]>([]);
  const [cirurgioes, setCirurgioes] = useState<any[]>([]);
  
  const [salvando, setSalvando] = useState(false);
  const [salvandoClinica, setSalvandoClinica] = useState(false);
  const [salvandoCirurgiao, setSalvandoCirurgiao] = useState(false);
  
  const [abaAtiva, setAbaAtiva] = useState<'formulario' | 'historico' | 'clinicas' | 'cirurgioes' | 'dashboard'>('formulario');

  // Modo de visualização do Histórico
  const [modoVisualizacao, setModoVisualizacao] = useState<'cards' | 'tabela'>('cards');

  // Filtros e Ordenação no Histórico
  const [buscaHistorico, setBuscaHistorico] = useState('');
  const [filtroClinicaHistorico, setFiltroClinicaHistorico] = useState('');
  const [filtroStatusHistorico, setFiltroStatusHistorico] = useState('');
  const [ordenacaoHistorico, setOrdenacaoHistorico] = useState<'data-desc' | 'data-asc' | 'paciente-asc' | 'paciente-desc'>('data-desc');

  // Campos da Ficha
  const [dataProc, setDataProc] = useState(() => new Date().toISOString().slice(0, 10));
  const [local, setLocal] = useState('');
  const [valor, setValor] = useState('');
  const [cirurgiao, setCirurgiao] = useState('');
  const [dataPgto, setDataPgto] = useState('');
  const [paciente, setPaciente] = useState('');
  const [especie, setEspecie] = useState('Cão');
  const [peso, setPeso] = useState('');
  const [formaPgto, setFormaPgto] = useState('');
  const [tutor, setTutor] = useState('');
  const [procedimento, setProcedimento] = useState('');
  const [complexidade, setComplexidade] = useState('Média');
  const [observacoes, setObservacoes] = useState('');

  // Estado para a Janela (Modal) de Quitação
  const [modalQuitacao, setModalQuitacao] = useState<{ id: string; paciente: string } | null>(null);
  const [quitFormaPgto, setQuitFormaPgto] = useState('PIX');
  const [quitDataPgto, setQuitDataPgto] = useState(() => new Date().toISOString().slice(0, 10));

  // Cadastro e Edição de Clínica
  const [novaClinicaNome, setNovaClinicaNome] = useState('');
  const [clinicaEditandoId, setClinicaEditandoId] = useState<string | null>(null);
  const [nomeClinicaEditado, setNomeClinicaEditado] = useState('');

  // Cadastro e Edição de Cirurgião
  const [novoCirurgiaoNome, setNovoCirurgiaoNome] = useState('');
  const [cirurgiaoEditandoId, setCirurgiaoEditandoId] = useState<string | null>(null);
  const [nomeCirurgiaoEditado, setNomeCirurgiaoEditado] = useState('');

  // Edição da Ficha
  const [fichaEditandoId, setFichaEditandoId] = useState<string | null>(null);
  const [editFichaData, setEditFichaData] = useState<any>({});

  // Gráfico de faturamento: nível (granularidade) + escopo (período em que se entrou clicando numa coluna)
  const [nivelDrill, setNivelDrill] = useState<'ano' | 'mes' | 'semana' | 'dia'>('mes');
  const [escopoGrafico, setEscopoGrafico] = useState<{ tipo: 'ano' | 'mes' | 'semana'; chave: string } | null>(null);
  const scrollGraficoRef = useRef<HTMLDivElement>(null);

  // Filtros de Período Geral no Dashboard
  const [tipoPeriodo, setTipoPeriodo] = useState<'mes' | 'ano' | 'personalizado' | 'todos'>('todos');
  const [mesFiltro, setMesFiltro] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });
  const [anoFiltro, setAnoFiltro] = useState(() => String(new Date().getFullYear()));
  const [dataInicioFiltro, setDataInicioFiltro] = useState('');
  const [dataFimFiltro, setDataFimFiltro] = useState('');

  // Hover na Rosca Interativa
  const [fatiaHover, setFatiaHover] = useState<any | null>(null);

  // Buscar Fichas
  useEffect(() => {
    const q = query(collection(db, 'anestesias'), orderBy('dataCriacao', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegistos(dados);
    });
    return () => unsubscribe();
  }, []);

  // Buscar Clínicas
  useEffect(() => {
    const q = query(collection(db, 'clinicas'), orderBy('nome', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setClinicas(dados);
    });
    return () => unsubscribe();
  }, []);

  // Buscar Cirurgiões
  useEffect(() => {
    const q = query(collection(db, 'cirurgioes'), orderBy('nome', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCirurgioes(dados);
    });
    return () => unsubscribe();
  }, []);

  // Entrada de Dados
  const handlePesoChange = (valRaw: string, isEdit = false) => {
    const val = valRaw.replace(/[^0-9.,]/g, '');
    if (val.length <= 6) {
      if (isEdit) {
        setEditFichaData((prev: any) => ({ ...prev, peso: val }));
      } else {
        setPeso(val);
      }
    }
  };

  const handleValorChange = (valRaw: string, isEdit = false) => {
    const apenasDigitos = valRaw.replace(/\D/g, '');
    let valFormatado = '';
    if (apenasDigitos) {
      const numero = (parseInt(apenasDigitos, 10) / 100).toFixed(2);
      valFormatado = numero.replace('.', ',');
    }
    if (isEdit) {
      setEditFichaData((prev: any) => ({ ...prev, valor: valFormatado }));
    } else {
      setValor(valFormatado);
    }
  };

  const guardarRegisto = async (e: FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await addDoc(collection(db, 'anestesias'), {
        dataProc,
        local,
        valor,
        cirurgiao,
        dataPgto,
        paciente,
        especie,
        peso,
        formaPgto,
        tutor,
        procedimento,
        complexidade,
        observacoes,
        dataCriacao: serverTimestamp()
      });

      setDataProc(new Date().toISOString().slice(0, 10));
      setLocal('');
      setValor('');
      setCirurgiao('');
      setDataPgto('');
      setPaciente('');
      setEspecie('Cão');
      setPeso('');
      setFormaPgto('');
      setTutor('');
      setProcedimento('');
      setComplexidade('Média');
      setObservacoes('');

      setAbaAtiva('historico');
    } catch (error: any) {
      alert("Erro ao guardar: " + error.message);
    }
    setSalvando(false);
  };

  // Abrir Modal de Quitação
  const abrirModalQuitacao = (id: string, nomePaciente: string) => {
    setModalQuitacao({ id, paciente: nomePaciente });
    setQuitFormaPgto('PIX');
    setQuitDataPgto(new Date().toISOString().slice(0, 10));
  };

  // Confirmar Quitação com Forma e Data de Pagamento
  const confirmarQuitacao = async () => {
    if (!modalQuitacao) return;
    if (!quitFormaPgto) {
      alert("Por favor, selecione a forma de pagamento.");
      return;
    }
    if (!quitDataPgto) {
      alert("Por favor, selecione a data do pagamento.");
      return;
    }

    try {
      await updateDoc(doc(db, 'anestesias', modalQuitacao.id), {
        dataPgto: quitDataPgto,
        formaPgto: quitFormaPgto
      });
      setModalQuitacao(null);
    } catch (error: any) {
      alert("Erro ao quitar procedimento: " + error.message);
    }
  };

  const excluirFicha = async (id: string, nomePaciente: string) => {
    if (confirm(`Tem certeza que deseja excluir a ficha do paciente "${nomePaciente}"?`)) {
      try {
        await deleteDoc(doc(db, 'anestesias', id));
      } catch (error: any) {
        alert("Erro ao excluir ficha: " + error.message);
      }
    }
  };

  const iniciarEdicaoFicha = (registo: any) => {
    setFichaEditandoId(registo.id);
    setEditFichaData({ ...registo, complexidade: registo.complexidade || 'Média' });
  };

  const salvarEdicaoFicha = async (id: string) => {
    if (!editFichaData.paciente?.trim() || !editFichaData.procedimento?.trim()) {
      alert("Paciente e Procedimento são obrigatórios.");
      return;
    }
    try {
      await updateDoc(doc(db, 'anestesias', id), {
        paciente: editFichaData.paciente || '',
        especie: editFichaData.especie || 'Cão',
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
      alert("Erro ao atualizar ficha: " + error.message);
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

      return bateBusca && bateClinica && bateStatus;
    }).sort((a, b) => {
      if (ordenacaoHistorico === 'paciente-asc') return (a.paciente || '').localeCompare(b.paciente || '');
      if (ordenacaoHistorico === 'paciente-desc') return (b.paciente || '').localeCompare(a.paciente || '');
      if (ordenacaoHistorico === 'data-asc') return (a.dataProc || '').localeCompare(b.dataProc || '');
      return (b.dataProc || '').localeCompare(a.dataProc || '');
    });
  }, [registos, buscaHistorico, filtroClinicaHistorico, filtroStatusHistorico, ordenacaoHistorico]);

  const exportarCSV = () => {
    if (registosFiltradosEOrdenados.length === 0) {
      alert("Não há dados visíveis para exportar.");
      return;
    }
    const cabecalho = ["Data Procedimento", "Paciente", "Espécie", "Peso (kg)", "Procedimento", "Complexidade", "Tutor", "Local / Clínica", "Cirurgião", "Valor (R$)", "Forma Pagamento", "Data Pagamento", "Observações"];
    const linhas = registosFiltradosEOrdenados.map(r => [
      `"${r.dataProc || ''}"`, `"${r.paciente || ''}"`, `"${r.especie || 'Cão'}"`, `"${r.peso || ''}"`, `"${r.procedimento || ''}"`, `"${r.complexidade || 'Média'}"`, `"${r.tutor || ''}"`, `"${r.local || ''}"`, `"${r.cirurgiao || ''}"`, `"${r.valor || ''}"`, `"${r.formaPgto || ''}"`, `"${r.dataPgto || ''}"`, `"${(r.observacoes || '').replace(/"/g, '""')}"`
    ]);
    const conteudoCSV = "\uFEFF" + [cabecalho.join(";"), ...linhas.map(l => l.join(";"))].join("\n");
    const blob = new Blob([conteudoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fichas_anestesicas_${new Date().toISOString().slice(0, 10)}.csv`;
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
    } catch (error: any) { alert("Erro ao cadastrar clínica: " + error.message); }
    setSalvandoClinica(false);
  };

  const excluirClinica = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir a clínica "${nome}"?`)) {
      try { await deleteDoc(doc(db, 'clinicas', id)); } catch (error: any) { alert("Erro ao excluir clínica: " + error.message); }
    }
  };

  const salvarEdicaoClinica = async (id: string) => {
    if (!nomeClinicaEditado.trim()) return;
    try {
      await updateDoc(doc(db, 'clinicas', id), { nome: nomeClinicaEditado.trim() });
      setClinicaEditandoId(null);
      setNomeClinicaEditado('');
    } catch (error: any) { alert("Erro ao atualizar clínica: " + error.message); }
  };

  const guardarCirurgiao = async (e: FormEvent) => {
    e.preventDefault();
    if (!novoCirurgiaoNome.trim()) return;
    setSalvandoCirurgiao(true);
    try {
      await addDoc(collection(db, 'cirurgioes'), { nome: novoCirurgiaoNome.trim(), dataCriacao: serverTimestamp() });
      setNovoCirurgiaoNome('');
    } catch (error: any) { alert("Erro ao cadastrar cirurgião: " + error.message); }
    setSalvandoCirurgiao(false);
  };

  const excluirCirurgiao = async (id: string, nome: string) => {
  if (confirm(`Tem certeza que deseja excluir o cirurgião "${nome}"?`)) {
    try {
      await deleteDoc(doc(db, 'cirurgioes', id));
    } catch (error: any) {
      alert("Erro ao excluir cirurgião: " + error.message);
    }
  }
};

  const salvarEdicaoCirurgiao = async (id: string) => {
    if (!nomeCirurgiaoEditado.trim()) return;
    try {
      await updateDoc(doc(db, 'cirurgioes', id), { nome: nomeCirurgiaoEditado.trim() });
      setCirurgiaoEditandoId(null);
      setNomeCirurgiaoEditado('');
    } catch (error: any) { alert("Erro ao atualizar cirurgião: " + error.message); }
  };

  // Função auxiliar para cor de badge por complexidade
  const getBadgeComplexidade = (nivel: string) => {
    switch (nivel) {
      case 'Baixa':
        return { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' };
      case 'Alta':
        return { bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' };
      case 'Crítica / Especial':
        return { bg: '#fef2f2', color: '#991b1b', border: '#fecaca' };
      default: // Média
        return { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' };
    }
  };

  
  // ==========================================
  // GRÁFICO DE FATURAMENTO POR PERÍODO
  // DRILL-DOWN / DRILL-UP
  // ==========================================

  // Extrai o ano: YYYY
  const getAnoFromData = (dataStr: string) => {
    return dataStr ? dataStr.slice(0, 4) : '';
  };

  // Extrai o mês: YYYY-MM
  const getMesFromData = (dataStr: string) => {
    return dataStr ? dataStr.slice(0, 7) : '';
  };

  // Retorna a semana ISO: YYYY-W10
  const getSemanaFromData = (dataStr: string) => {
    if (!dataStr) return '';

    const data = new Date(`${dataStr}T00:00:00Z`);

    const diaSemana = data.getUTCDay() || 7;

    data.setUTCDate(data.getUTCDate() + 4 - diaSemana);

    const inicioAno = new Date(
      Date.UTC(data.getUTCFullYear(), 0, 1)
    );

    const numeroSemana = Math.ceil(
      (((data.getTime() - inicioAno.getTime()) / 86400000) + 1) / 7
    );

    return `${data.getUTCFullYear()}-W${String(numeroSemana).padStart(2, '0')}`;
  };

  // Calcula segunda-feira e domingo de uma semana ISO
  const getIntervaloSemana = (chave: string) => {
    const [ano, semana] = chave.split('-W');

    const numeroAno = Number(ano);
    const numeroSemana = Number(semana);

    // 4 de janeiro sempre pertence à primeira semana ISO
    const janeiro4 = new Date(Date.UTC(numeroAno, 0, 4));

    const diaSemana = janeiro4.getUTCDay() || 7;

    const segunda = new Date(janeiro4);

    segunda.setUTCDate(
      janeiro4.getUTCDate() - diaSemana + 1 + (numeroSemana - 1) * 7
    );

    const domingo = new Date(segunda);

    domingo.setUTCDate(segunda.getUTCDate() + 6);

    return { segunda, domingo };
  };

  // Formata uma data UTC em DD/MM/YYYY
  const formatarDataCompleta = (data: Date) => {
    const dia = String(data.getUTCDate()).padStart(2, '0');
    const mes = String(data.getUTCMonth() + 1).padStart(2, '0');
    const ano = data.getUTCFullYear();

    return `${dia}/${mes}/${ano}`;
  };

  // Lógica principal do gráfico
  const ALTURA_GRAFICO = 220;

  const dadosGraficoDrill = useMemo(() => {

    // Cores das clínicas
    const mapaCoresClinicas: { [nome: string]: string } = {};
    clinicas.forEach((clinica, index) => {
      mapaCoresClinicas[clinica.nome] = PALETA_CORES[index % PALETA_CORES.length];
    });

    // Aplica apenas o escopo (período clicado). O NÍVEL mostra TODOS os períodos daquele nível.
    const registrosFiltrados = registos.filter(registro => {
      if (!registro.dataProc) return false;
      if (!escopoGrafico) return true;
      if (escopoGrafico.tipo === 'ano') return getAnoFromData(registro.dataProc) === escopoGrafico.chave;
      if (escopoGrafico.tipo === 'mes') return getMesFromData(registro.dataProc) === escopoGrafico.chave;
      return getSemanaFromData(registro.dataProc) === escopoGrafico.chave;
    });

    const grupos: { [chavePeriodo: string]: { [local: string]: number } } = {};
    const totaisPorGrupo: { [chavePeriodo: string]: number } = {};
    const clinicasPresentes = new Set<string>();
    let totalPeriodo = 0;

    registrosFiltrados.forEach(registro => {
      const valorNum = registro.valor
        ? parseFloat(String(registro.valor).replace(/\./g, '').replace(',', '.')) || 0
        : 0;

      const clinicaNome = registro.local || 'Não informada';

      let chave = '';
      if (nivelDrill === 'ano') chave = getAnoFromData(registro.dataProc);
      else if (nivelDrill === 'mes') chave = getMesFromData(registro.dataProc);
      else if (nivelDrill === 'semana') chave = getSemanaFromData(registro.dataProc);
      else chave = registro.dataProc;

      if (!chave) return;

      if (!grupos[chave]) grupos[chave] = {};
      grupos[chave][clinicaNome] = (grupos[chave][clinicaNome] || 0) + valorNum;
      totaisPorGrupo[chave] = (totaisPorGrupo[chave] || 0) + valorNum;
      clinicasPresentes.add(clinicaNome);
      totalPeriodo += valorNum;
    });

    const chavesOrdenadas = Object.keys(grupos).sort();
    const maiorValorTotal = Math.max(...Object.values(totaisPorGrupo), 1);

    const formatarRotulo = (chave: string, nivel: 'ano' | 'mes' | 'semana' | 'dia' = nivelDrill): string => {
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

      if (nivel === 'ano') return chave;

      if (nivel === 'mes') {
        const [ano, mes] = chave.split('-');
        return `${meses[Number(mes) - 1]}/${ano}`;
      }

      if (nivel === 'semana') {
        const [, semana] = chave.split('-W');
        const intervalo = getIntervaloSemana(chave);
        const inicio = formatarDataCompleta(intervalo.segunda).slice(0, 5);
        const fim = formatarDataCompleta(intervalo.domingo).slice(0, 5);
        return `Sem ${semana}\n${inicio} a ${fim}`;
      }

      const [ano, mes, dia] = chave.split('-');
      return `${dia}/${mes}\n${ano}`;
    };

    return {
      chavesOrdenadas,
      grupos,
      totaisPorGrupo,
      maiorValorTotal,
      totalPeriodo,
      clinicasPresentes: Array.from(clinicasPresentes),
      formatarRotulo,
      mapaCoresClinicas
    };

  }, [registos, clinicas, nivelDrill, escopoGrafico]);

  // Sempre mostra o período mais recente (rola o gráfico para a direita)
  useEffect(() => {
    const el = scrollGraficoRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [abaAtiva, nivelDrill, escopoGrafico, dadosGraficoDrill.chavesOrdenadas.length]);

  // Clique numa coluna: filtra por aquele período e abre o próximo nível
  const handleBarClick = (chave: string) => {
    if (nivelDrill === 'dia') return;
    setEscopoGrafico({ tipo: nivelDrill, chave });
    setNivelDrill(nivelDrill === 'ano' ? 'mes' : nivelDrill === 'mes' ? 'semana' : 'dia');
  };

  // Subir nível: desfaz o último clique; sem filtro, apenas sobe um nível
  const handleDrillUp = () => {
    if (escopoGrafico) {
      setNivelDrill(escopoGrafico.tipo);
      setEscopoGrafico(null);
    } else if (nivelDrill === 'dia') setNivelDrill('semana');
    else if (nivelDrill === 'semana') setNivelDrill('mes');
    else if (nivelDrill === 'mes') setNivelDrill('ano');
  };

  // Métricas do Dashboard
  const metricasDashboard = useMemo(() => {
    const fichasFiltradas = registos.filter(r => {
      if (!r.dataProc) return false;
      if (tipoPeriodo === 'mes') return r.dataProc.startsWith(mesFiltro);
      if (tipoPeriodo === 'ano') return r.dataProc.startsWith(anoFiltro);
      if (tipoPeriodo === 'personalizado') {
        if (dataInicioFiltro && r.dataProc < dataInicioFiltro) return false;
        if (dataFimFiltro && r.dataProc > dataFimFiltro) return false;
        return true;
      }
      return true;
    });

    let totalGeral = 0;
    let totalPago = 0;
    let totalPendente = 0;
    let caes = 0;
    let gatos = 0;
    const porClinica: { [key: string]: number } = {};
    const pendentesPorClinica: { [key: string]: { valor: number, qtd: number } } = {};

    fichasFiltradas.forEach(item => {
      const numValor = item.valor ? parseFloat(item.valor.replace('.', '').replace(',', '.')) : 0;
      totalGeral += numValor;

      const clinicaNome = item.local || 'Não informada';

      if (item.dataPgto) {
        totalPago += numValor;
      } else {
        totalPendente += numValor;
        if (!pendentesPorClinica[clinicaNome]) {
          pendentesPorClinica[clinicaNome] = { valor: 0, qtd: 0 };
        }
        pendentesPorClinica[clinicaNome].valor += numValor;
        pendentesPorClinica[clinicaNome].qtd += 1;
      }

      if (item.especie === 'Gato') gatos++;
      else caes++;

      if (item.local) {
        porClinica[item.local] = (porClinica[item.local] || 0) + numValor;
      }
    });

    const taxaRecebimento = totalGeral > 0 ? (totalPago / totalGeral) * 100 : 0;

    const listaClinicasGrafico = Object.entries(porClinica).sort((a, b) => b[1] - a[1]);
    let anguloAcumulado = 0;

    const fatiasSVG = listaClinicasGrafico.map(([nome, valor], index) => {
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
        id: `fatia-${index}`,
        nome,
        valor,
        porcentagem,
        cor: PALETA_CORES[index % PALETA_CORES.length],
        pathData
      };
    });

    return {
      quantidade: fichasFiltradas.length,
      totalGeral,
      totalPago,
      totalPendente,
      taxaRecebimento,
      caes,
      gatos,
      porClinica,
      fatiasSVG,
      pendentesPorClinica
    };
  }, [registos, tipoPeriodo, mesFiltro, anoFiltro, dataInicioFiltro, dataFimFiltro]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '16px 12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto' }}>
        
        {/* Header Superior */}
        <header style={{ 
          backgroundColor: '#0f172a', color: '#ffffff', padding: '18px 20px', borderRadius: '18px', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)', marginBottom: '18px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#0284c7', padding: '10px', borderRadius: '12px', display: 'flex', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)' }}>
              <Stethoscope size={24} color="#ffffff" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.02em' }}>Ficha Anestésica</h1>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Painel Médico Veterinário</p>
            </div>
          </div>
        </header>

        {/* Menu de Navegação */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', backgroundColor: '#e2e8f0', padding: '5px', borderRadius: '14px', flexWrap: 'wrap' }}>
          <button onClick={() => setAbaAtiva('formulario')} style={{ flex: 1, minWidth: '70px', padding: '8px 4px', borderRadius: '10px', border: 'none', backgroundColor: abaAtiva === 'formulario' ? '#ffffff' : 'transparent', color: abaAtiva === 'formulario' ? '#0284c7' : '#64748b', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: abaAtiva === 'formulario' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
            <Plus size={15} /> Nova
          </button>
          <button onClick={() => setAbaAtiva('historico')} style={{ flex: 1, minWidth: '70px', padding: '8px 4px', borderRadius: '10px', border: 'none', backgroundColor: abaAtiva === 'historico' ? '#ffffff' : 'transparent', color: abaAtiva === 'historico' ? '#0284c7' : '#64748b', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: abaAtiva === 'historico' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
            <Activity size={15} /> Histórico
          </button>
          <button onClick={() => setAbaAtiva('clinicas')} style={{ flex: 1, minWidth: '70px', padding: '8px 4px', borderRadius: '10px', border: 'none', backgroundColor: abaAtiva === 'clinicas' ? '#ffffff' : 'transparent', color: abaAtiva === 'clinicas' ? '#0284c7' : '#64748b', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: abaAtiva === 'clinicas' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
            <Building2 size={15} /> Clínicas
          </button>
          <button onClick={() => setAbaAtiva('cirurgioes')} style={{ flex: 1, minWidth: '70px', padding: '8px 4px', borderRadius: '10px', border: 'none', backgroundColor: abaAtiva === 'cirurgioes' ? '#ffffff' : 'transparent', color: abaAtiva === 'cirurgioes' ? '#0284c7' : '#64748b', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: abaAtiva === 'cirurgioes' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
            <UserCheck size={15} /> Cirurgiões
          </button>
          <button onClick={() => setAbaAtiva('dashboard')} style={{ flex: 1, minWidth: '70px', padding: '8px 4px', borderRadius: '10px', border: 'none', backgroundColor: abaAtiva === 'dashboard' ? '#ffffff' : 'transparent', color: abaAtiva === 'dashboard' ? '#0284c7' : '#64748b', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', boxShadow: abaAtiva === 'dashboard' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
            <BarChart3 size={15} /> Dashboard
          </button>
        </div>

        {/* Formulário */}
        {abaAtiva === 'formulario' && (
          <form onSubmit={guardarRegisto} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            
            {/* Paciente, Data e Procedimento */}
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} /> Paciente e Procedimento
              </div>

              {/* DATA DO PROCEDIMENTO NO PRIMEIRO BLOCO */}
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#0284c7', display: 'block', marginBottom: '4px' }}>Data do Procedimento</label>
                <input type="date" value={dataProc} onChange={(e) => setDataProc(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #0284c7', fontSize: '0.95rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box', backgroundColor: '#f0f9ff' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Nome Paciente</label>
                  <input type="text" value={paciente} onChange={(e) => setPaciente(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Espécie</label>
                  <select value={especie} onChange={(e) => setEspecie(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}>
                    <option value="Cão">Cão</option>
                    <option value="Gato">Gato</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Peso (kg)</label>
                  <input type="text" inputMode="decimal" value={peso} onChange={(e) => handlePesoChange(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              {/* PROCEDIMENTO E COMPLEXIDADE (4 NÍVEIS) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '8px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Procedimento</label>
                  <input type="text" value={procedimento} onChange={(e) => setProcedimento(e.target.value)} required placeholder="Ex: Mastectomia, OSH..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Complexidade</label>
                  <select value={complexidade} onChange={(e) => setComplexidade(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff', fontWeight: '600' }}>
                    <option value="Baixa">🟢 Baixa</option>
                    <option value="Média">🔵 Média</option>
                    <option value="Alta">🟠 Alta</option>
                    <option value="Crítica / Especial">🔴 Crítica / Especial</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Nome do Tutor</label>
                <input type="text" value={tutor} onChange={(e) => setTutor(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Local e Equipe */}
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} /> Local e Equipe
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Local / Clínica</label>
                    <button type="button" onClick={() => setAbaAtiva('clinicas')} style={{ border: 'none', backgroundColor: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}><Plus size={12} /> Clínica</button>
                  </div>
                  <select value={local} onChange={(e) => setLocal(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}>
                    <option value="">Selecione...</option>
                    {clinicas.map((item) => (<option key={item.id} value={item.nome}>{item.nome}</option>))}
                  </select>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Cirurgião Responsável</label>
                    <button type="button" onClick={() => setAbaAtiva('cirurgioes')} style={{ border: 'none', backgroundColor: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px' }}><Plus size={12} /> Cirurgião</button>
                  </div>
                  <select value={cirurgiao} onChange={(e) => setCirurgiao(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}>
                    <option value="">Selecione...</option>
                    {cirurgioes.map((item) => (<option key={item.id} value={item.nome}>{item.nome}</option>))}
                  </select>
                </div>
              </div>
            </div>

            {/* Financeiro */}
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={16} /> Financeiro e Pagamento
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Valor (R$)</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', paddingLeft: '8px', backgroundColor: '#ffffff' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>R$</span>
                    <input type="text" inputMode="numeric" value={valor} onChange={(e) => handleValorChange(e.target.value)} placeholder="0,00" style={{ width: '100%', padding: '10px 8px', border: 'none', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backgroundColor: 'transparent' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Forma de Pagamento</label>
                  <select value={formaPgto} onChange={(e) => setFormaPgto(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}>
                    <option value="">Selecione...</option>
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Débito">Débito</option>
                    <option value="Crédito (à Vista)">Crédito (à Vista)</option>
                    <option value="Crédito (parcelado)">Crédito (parcelado)</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Data do Pagamento</label>
                <input type="date" value={dataPgto} onChange={(e) => setDataPgto(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Observações */}
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <FileText size={16} color="#64748b" /> Observações Clínicas
              </label>
              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            <button type="submit" disabled={salvando} style={{ backgroundColor: salvando ? '#64748b' : '#0284c7', color: '#ffffff', border: 'none', padding: '14px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: salvando ? 'not-allowed' : 'pointer', fontSize: '1rem', fontWeight: '700', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}>
              {salvando ? <Loader2 size={22} className="animate-spin" /> : <Plus size={22} />} 
              {salvando ? 'A Salvar Ficha...' : 'Salvar Ficha Anestésica'}
            </button>
          </form>
        )}

        {/* Histórico */}
        {abaAtiva === 'historico' && (
          <div>
            <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={20} color="#0284c7" /> Histórico ({registosFiltradosEOrdenados.length})
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ display: 'flex', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '8px' }}>
                    <button onClick={() => setModoVisualizacao('cards')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: modoVisualizacao === 'cards' ? '#ffffff' : 'transparent', color: modoVisualizacao === 'cards' ? '#0284c7' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><LayoutGrid size={16} /></button>
                    <button onClick={() => setModoVisualizacao('tabela')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: modoVisualizacao === 'tabela' ? '#ffffff' : 'transparent', color: modoVisualizacao === 'tabela' ? '#0284c7' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Table size={16} /></button>
                  </div>
                  <button onClick={exportarCSV} style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Download size={15} /> CSV</button>
                </div>
              </div>

              <div style={{ position: 'relative', marginBottom: '10px' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" value={buscaHistorico} onChange={(e) => setBuscaHistorico(e.target.value)} placeholder="Buscar por paciente, procedimento, tutor ou cirurgião..." style={{ width: '100%', padding: '9px 10px 9px 34px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '8px' }}>
                <select value={filtroClinicaHistorico} onChange={(e) => setFiltroClinicaHistorico(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#fff', outline: 'none' }}>
                  <option value="">Todas Clínicas</option>
                  {clinicas.map((c) => (<option key={c.id} value={c.nome}>{c.nome}</option>))}
                </select>
                <select value={filtroStatusHistorico} onChange={(e) => setFiltroStatusHistorico(e.target.value)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#fff', outline: 'none' }}>
                  <option value="">Todos Status</option>
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                </select>
                <select value={ordenacaoHistorico} onChange={(e) => setOrdenacaoHistorico(e.target.value as any)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: '#fff', outline: 'none', fontWeight: '600', color: '#0284c7' }}>
                  <option value="data-desc">Data (Recentes)</option>
                  <option value="data-asc">Data (Antigos)</option>
                  <option value="paciente-asc">Paciente (A-Z)</option>
                  <option value="paciente-desc">Paciente (Z-A)</option>
                </select>
              </div>
            </div>

            {registosFiltradosEOrdenados.length === 0 ? (
              <div style={{ backgroundColor: '#ffffff', padding: '32px 16px', borderRadius: '16px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>Nenhuma ficha encontrada.</div>
            ) : modoVisualizacao === 'cards' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {registosFiltradosEOrdenados.map((registo) => {
                  const badgeComp = getBadgeComplexidade(registo.complexidade || 'Média');
                  return (
                    <div key={registo.id} style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', textAlign: 'left' }}>
                      {fichaEditandoId === registo.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0284c7', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>Editar Ficha Médica</div>
                          
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#0284c7', display: 'block', marginBottom: '2px' }}>Data Proc.</label>
                            <input type="date" value={editFichaData.dataProc || ''} onChange={(e) => setEditFichaData({ ...editFichaData, dataProc: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '6px' }}>
                            <input type="text" value={editFichaData.paciente || ''} onChange={(e) => setEditFichaData({ ...editFichaData, paciente: e.target.value })} placeholder="Paciente" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                            <select value={editFichaData.especie || 'Cão'} onChange={(e) => setEditFichaData({ ...editFichaData, especie: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}>
                              <option value="Cão">Cão</option>
                              <option value="Gato">Gato</option>
                            </select>
                            <input type="text" value={editFichaData.peso || ''} onChange={(e) => handlePesoChange(e.target.value, true)} placeholder="Peso kg" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '6px' }}>
                            <input type="text" value={editFichaData.procedimento || ''} onChange={(e) => setEditFichaData({ ...editFichaData, procedimento: e.target.value })} placeholder="Procedimento" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                            <select value={editFichaData.complexidade || 'Média'} onChange={(e) => setEditFichaData({ ...editFichaData, complexidade: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}>
                              <option value="Baixa">🟢 Baixa</option>
                              <option value="Média">🔵 Média</option>
                              <option value="Alta">🟠 Alta</option>
                              <option value="Crítica / Especial">🔴 Crítica/Esp.</option>
                            </select>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <input type="text" value={editFichaData.tutor || ''} onChange={(e) => setEditFichaData({ ...editFichaData, tutor: e.target.value })} placeholder="Tutor" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                            <select value={editFichaData.cirurgiao || ''} onChange={(e) => setEditFichaData({ ...editFichaData, cirurgiao: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}>
                              <option value="">Cirurgião...</option>
                              {cirurgioes.map((c) => (<option key={c.id} value={c.nome}>{c.nome}</option>))}
                            </select>
                          </div>

                          <div>
                            <select value={editFichaData.local || ''} onChange={(e) => setEditFichaData({ ...editFichaData, local: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}>
                              <option value="">Clínica...</option>
                              {clinicas.map((c) => (<option key={c.id} value={c.nome}>{c.nome}</option>))}
                            </select>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <input type="text" value={editFichaData.valor || ''} onChange={(e) => handleValorChange(e.target.value, true)} placeholder="Valor R$" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                            <select value={editFichaData.formaPgto || ''} onChange={(e) => setEditFichaData({ ...editFichaData, formaPgto: e.target.value })} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#fff' }}>
                              <option value="">Forma Pgto...</option>
                              <option value="PIX">PIX</option>
                              <option value="Dinheiro">Dinheiro</option>
                              <option value="Débito">Débito</option>
                              <option value="Crédito (à Vista)">Crédito (à Vista)</option>
                              <option value="Crédito (parcelado)">Crédito (parcelado)</option>
                            </select>
                          </div>

                          <input type="date" value={editFichaData.dataPgto || ''} onChange={(e) => setEditFichaData({ ...editFichaData, dataPgto: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />
                          <textarea value={editFichaData.observacoes || ''} onChange={(e) => setEditFichaData({ ...editFichaData, observacoes: e.target.value })} placeholder="Observações" rows={2} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }} />

                          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <button onClick={() => salvarEdicaoFicha(registo.id)} style={{ flex: 1, backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.85rem' }}><Save size={16} /> Salvar Alterações</button>
                            <button onClick={() => setFichaEditandoId(null)} style={{ backgroundColor: '#94a3b8', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '0.85rem' }}><X size={16} /> Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div>
                              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>{registo.paciente}</span>
                              <span style={{ marginLeft: '6px', fontSize: '0.75rem', backgroundColor: registo.especie === 'Gato' ? '#fbcfe8' : '#e0f2fe', color: registo.especie === 'Gato' ? '#9d174d' : '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>{registo.especie || 'Cão'}</span>
                              {registo.peso && <span style={{ marginLeft: '4px', fontSize: '0.75rem', backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '12px', fontWeight: '600' }}>{registo.peso} kg</span>}
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {registo.dataProc && (
                                <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f0f9ff', padding: '4px 8px', borderRadius: '6px', marginRight: '4px', border: '1px solid #bae6fd' }}>
                                  <Calendar size={12} /> {registo.dataProc}
                                </span>
                              )}
                              <button onClick={() => iniciarEdicaoFicha(registo)} title="Editar Ficha" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><Pencil size={15} /></button>
                              <button onClick={() => excluirFicha(registo.id, registo.paciente)} title="Excluir Ficha" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><Trash2 size={15} /></button>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#334155' }}>{registo.procedimento}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', backgroundColor: badgeComp.bg, color: badgeComp.color, border: `1px solid ${badgeComp.border}`, padding: '2px 6px', borderRadius: '6px' }}>
                              {registo.complexidade || 'Média'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.8rem', color: '#64748b', marginBottom: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                            {registo.tutor && <div><strong>Tutor:</strong> {registo.tutor}</div>}
                            {registo.cirurgiao && <div><strong>Cirurgião:</strong> {registo.cirurgiao}</div>}
                            {registo.local && <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={12} /> {registo.local}</div>}
                          </div>

                          <div style={{ backgroundColor: registo.dataPgto ? '#f0fdf4' : '#fffbeb', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: registo.dataPgto ? '#166534' : '#92400e', fontWeight: '600' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <DollarSign size={15} /> R$ {registo.valor || '0,00'} {registo.formaPgto && `(${registo.formaPgto})`}
                            </span>

                            {registo.dataPgto ? (
                              <span style={{ fontSize: '0.75rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '3px' }}><CheckCircle2 size={13} /> Pago em {registo.dataPgto}</span>
                            ) : (
                              <button onClick={() => abrirModalQuitacao(registo.id, registo.paciente)} style={{ backgroundColor: '#16a34a', color: '#ffffff', border: 'none', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={13} /> Quitar
                              </button>
                            )}
                          </div>

                          {registo.observacoes && (
                            <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#475569', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px', fontStyle: 'italic', borderLeft: '3px solid #cbd5e1' }}>
                              {registo.observacoes}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '10px 12px' }}>Data</th>
                      <th style={{ padding: '10px 12px' }}>Paciente</th>
                      <th style={{ padding: '10px 12px' }}>Procedimento</th>
                      <th style={{ padding: '10px 12px' }}>Complexidade</th>
                      <th style={{ padding: '10px 12px' }}>Clínica</th>
                      <th style={{ padding: '10px 12px' }}>Valor</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registosFiltradosEOrdenados.map((registo) => {
                      const badgeComp = getBadgeComplexidade(registo.complexidade || 'Média');
                      return (
                        <tr key={registo.id} style={{ borderBottom: '1px solid #f1f5f9', color: '#334155' }}>
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontWeight: '600' }}>{registo.dataProc || '---'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: '700' }}>
                            {registo.paciente}
                            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', color: registo.especie === 'Gato' ? '#be185d' : '#0284c7' }}>
                              {registo.especie || 'Cão'} {registo.peso ? `(${registo.peso}kg)` : ''}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{registo.procedimento}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: '700', backgroundColor: badgeComp.bg, color: badgeComp.color, border: `1px solid ${badgeComp.border}`, padding: '2px 6px', borderRadius: '6px' }}>
                              {registo.complexidade || 'Média'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>{registo.local || '---'}</td>
                          <td style={{ padding: '10px 12px', fontWeight: '600' }}>R$ {registo.valor || '0,00'}</td>
                          <td style={{ padding: '10px 12px' }}>
                            {registo.dataPgto ? (
                              <span style={{ color: '#15803d', fontWeight: '600', fontSize: '0.75rem', backgroundColor: '#f0fdf4', padding: '2px 6px', borderRadius: '4px' }}>Pago</span>
                            ) : (
                              <button onClick={() => abrirModalQuitacao(registo.id, registo.paciente)} style={{ backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={12} /> Quitar
                              </button>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '4px' }}>
                              <button onClick={() => { setModoVisualizacao('cards'); iniciarEdicaoFicha(registo); }} title="Editar" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', padding: '5px', borderRadius: '5px', cursor: 'pointer' }}><Pencil size={14} /></button>
                              <button onClick={() => excluirFicha(registo.id, registo.paciente)} title="Excluir" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '5px', borderRadius: '5px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Cadastro Clínicas */}
        {abaAtiva === 'clinicas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <form onSubmit={guardarClinica} style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={16} /> Cadastrar Nova Clínica
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Nome da Clínica / Hospital</label>
                <input type="text" value={novaClinicaNome} onChange={(e) => setNovaClinicaNome(e.target.value)} required placeholder="Ex: Hospital Veterinário SanCla" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" disabled={salvandoClinica} style={{ backgroundColor: salvandoClinica ? '#64748b' : '#0284c7', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: salvandoClinica ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: '700', width: '100%' }}>
                {salvandoClinica ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} 
                {salvandoClinica ? 'A Salvar...' : 'Salvar Clínica'}
              </button>
            </form>

            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', textAlign: 'left' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginTop: 0, marginBottom: '12px' }}>Clínicas Cadastradas ({clinicas.length})</h3>
              {clinicas.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', margin: '16px 0' }}>Nenhuma clínica cadastrada ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {clinicas.map((item) => (
                    <div key={item.id} style={{ padding: '10px 12px', border: '1px solid #f1f5f9', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      {clinicaEditandoId === item.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                          <input type="text" value={nomeClinicaEditado} onChange={(e) => setNomeClinicaEditado(e.target.value)} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #0284c7', fontSize: '0.9rem', outline: 'none' }} />
                          <button onClick={() => salvarEdicaoClinica(item.id)} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><Check size={16} /></button>
                          <button onClick={() => setClinicaEditandoId(null)} style={{ backgroundColor: '#94a3b8', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 size={16} color="#0284c7" /> {item.nome}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => { setClinicaEditandoId(item.id); setNomeClinicaEditado(item.nome); }} title="Editar" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><Pencil size={15} /></button>
                            <button onClick={() => excluirClinica(item.id, item.nome)} title="Excluir" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><Trash2 size={15} /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cadastro Cirurgiões */}
        {abaAtiva === 'cirurgioes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <form onSubmit={guardarCirurgiao} style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={16} /> Cadastrar Novo Cirurgião
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Nome Completo do Cirurgião</label>
                <input type="text" value={novoCirurgiaoNome} onChange={(e) => setNovoCirurgiaoNome(e.target.value)} required placeholder="Ex: Dra. Sabrina Micelli" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" disabled={salvandoCirurgiao} style={{ backgroundColor: salvandoCirurgiao ? '#64748b' : '#0284c7', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: salvandoCirurgiao ? 'not-allowed' : 'pointer', fontSize: '0.9rem', fontWeight: '700', width: '100%' }}>
                {salvandoCirurgiao ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} 
                {salvandoCirurgiao ? 'A Salvar...' : 'Salvar Cirurgião'}
              </button>
            </form>

            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', textAlign: 'left' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginTop: 0, marginBottom: '12px' }}>Cirurgiões Cadastrados ({cirurgioes.length})</h3>
              {cirurgioes.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', margin: '16px 0' }}>Nenhum cirurgião cadastrado ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cirurgioes.map((item) => (
                    <div key={item.id} style={{ padding: '10px 12px', border: '1px solid #f1f5f9', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      {cirurgiaoEditandoId === item.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                          <input type="text" value={nomeCirurgiaoEditado} onChange={(e) => setNomeCirurgiaoEditado(e.target.value)} style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #0284c7', fontSize: '0.9rem', outline: 'none' }} />
                          <button onClick={() => salvarEdicaoCirurgiao(item.id)} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><Check size={16} /></button>
                          <button onClick={() => setCirurgiaoEditandoId(null)} style={{ backgroundColor: '#94a3b8', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><X size={16} /></button>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserCheck size={16} color="#0284c7" /> {item.nome}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => { setCirurgiaoEditandoId(item.id); setNomeCirurgiaoEditado(item.nome); }} title="Editar" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><Pencil size={15} /></button>
                            <button onClick={() => excluirCirurgiao(item.id, item.nome)} title="Excluir" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}><Trash2 size={15} /></button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard */}
        {abaAtiva === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            
            
  {/* GRÁFICO DE FATURAMENTO POR PERÍODO */}
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>

              {/* Cabeçalho */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart3 size={20} color="#0284c7" /> Faturamento por Período
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: '600', marginTop: '4px' }}>
                    Total exibido: <strong style={{ color: '#0f172a' }}>R$ {dadosGraficoDrill.totalPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>

                {(escopoGrafico || nivelDrill !== 'ano') && (
                  <button onClick={handleDrillUp} style={{ backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', padding: '7px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ChevronLeft size={16} /> Subir Nível
                  </button>
                )}
              </div>

              {/* Seletor de nível: mostra TODOS os períodos do nível escolhido */}
              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px', marginBottom: '10px' }}>
                {(['ano', 'mes', 'semana', 'dia'] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setNivelDrill(n)}
                    style={{ flex: 1, padding: '7px 4px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', backgroundColor: nivelDrill === n ? '#ffffff' : 'transparent', color: nivelDrill === n ? '#0284c7' : '#64748b', boxShadow: nivelDrill === n ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}
                  >
                    {({ ano: 'Ano', mes: 'Mês', semana: 'Semana', dia: 'Dia' } as const)[n]}
                  </button>
                ))}
              </div>

              {/* Filtro ativo */}
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                {escopoGrafico ? (
                  <>
                    Filtrado em
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '3px 4px 3px 10px', borderRadius: '12px', fontWeight: '800' }}>
                      {dadosGraficoDrill.formatarRotulo(escopoGrafico.chave, escopoGrafico.tipo).replace('\n', ' ')}
                      <button onClick={() => setEscopoGrafico(null)} title="Remover filtro" style={{ border: 'none', backgroundColor: '#bae6fd', color: '#0369a1', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                        <X size={12} />
                      </button>
                    </span>
                  </>
                ) : (
                  <>Mostrando todo o período</>
                )}
                {nivelDrill !== 'dia' && <span style={{ color: '#94a3b8' }}>· clique numa coluna para detalhar</span>}
              </div>

              {dadosGraficoDrill.chavesOrdenadas.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Nenhum dado encontrado para o período selecionado.
                </div>
              ) : (
                <div>
                  {/* Área das colunas */}
                  <div
                    ref={scrollGraficoRef}
                    style={{ overflowX: 'auto', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '24px 12px 12px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', width: 'max-content', minWidth: '100%' }}>
                      {dadosGraficoDrill.chavesOrdenadas.map(chave => {
                        const totalColuna = dadosGraficoDrill.totaisPorGrupo[chave] || 0;
                        const locaisDoGrupo = dadosGraficoDrill.grupos[chave] || {};
                        const alturaPx = totalColuna > 0
                          ? Math.max((totalColuna / dadosGraficoDrill.maiorValorTotal) * ALTURA_GRAFICO, 4)
                          : 0;
                        const clicavel = nivelDrill !== 'dia';

                        return (
                          <div
                            key={chave}
                            onClick={() => handleBarClick(chave)}
                            title={`${dadosGraficoDrill.formatarRotulo(chave).replace('\n', ' ')}\nTotal: R$ ${totalColuna.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                            style={{ width: nivelDrill === 'dia' ? '54px' : '74px', flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', cursor: clicavel ? 'pointer' : 'default' }}
                          >
                            {/* Valor total */}
                            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#475569', marginBottom: '4px', whiteSpace: 'nowrap' }}>
                              R$ {totalColuna >= 1000 ? `${(totalColuna / 1000).toFixed(1)}k` : totalColuna.toFixed(0)}
                            </span>

                            {/* Coluna empilhada por clínica (altura em px) */}
                            <div style={{ width: '100%', maxWidth: '38px', height: `${alturaPx}px`, borderRadius: '6px 6px 0 0', overflow: 'hidden', display: 'flex', flexDirection: 'column-reverse', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                              {Object.entries(locaisDoGrupo).map(([nomeLocal, valorLocal]) => (
                                <div
                                  key={nomeLocal}
                                  title={`${nomeLocal}: R$ ${valorLocal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                  style={{ height: `${totalColuna > 0 ? (valorLocal / totalColuna) * 100 : 0}%`, backgroundColor: dadosGraficoDrill.mapaCoresClinicas[nomeLocal] || '#94a3b8', width: '100%' }}
                                />
                              ))}
                            </div>

                            {/* Rótulo do eixo X */}
                            <div style={{ fontSize: '0.66rem', fontWeight: '700', color: '#0f172a', marginTop: '8px', whiteSpace: 'pre-line', textAlign: 'center', lineHeight: '1.35', minHeight: '30px', width: '100%' }}>
                              {dadosGraficoDrill.formatarRotulo(chave)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legenda (apenas clínicas presentes no gráfico) */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px', justifyContent: 'center' }}>
                    {dadosGraficoDrill.clinicasPresentes.map(nome => (
                      <div key={nome} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: dadosGraficoDrill.mapaCoresClinicas[nome] || '#94a3b8' }} />
                        {nome}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filtro de Período Geral */}
            <div style={{ backgroundColor: '#ffffff', padding: '14px 16px', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Filter size={16} color="#0284c7" /> Filtrar Período do Painel:
                </span>
                <select value={tipoPeriodo} onChange={(e) => setTipoPeriodo(e.target.value as any)} style={{ padding: '6px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', fontWeight: '700', backgroundColor: '#f8fafc', color: '#0284c7', cursor: 'pointer' }}>
                  <option value="todos">Todo o Histórico</option>
                  <option value="mes">Mês Específico</option>
                  <option value="ano">Ano Inteiro</option>
                  <option value="personalizado">Período Personalizado</option>
                </select>
              </div>

              {tipoPeriodo === 'mes' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '600' }}>Mês/Ano:</span>
                  <input type="month" value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', fontWeight: '600' }} />
                </div>
              )}

              {tipoPeriodo === 'ano' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: '600' }}>Ano:</span>
                  <input type="number" value={anoFiltro} onChange={(e) => setAnoFiltro(e.target.value)} placeholder="2026" style={{ width: '100px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', fontWeight: '600' }} />
                </div>
              )}

              {tipoPeriodo === 'personalizado' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '2px' }}>De:</label>
                    <input type="date" value={dataInicioFiltro} onChange={(e) => setDataInicioFiltro(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#475569', fontWeight: '600', display: 'block', marginBottom: '2px' }}>Até:</label>
                    <input type="date" value={dataFimFiltro} onChange={(e) => setDataFimFiltro(e.target.value)} style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Resumos */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
              <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(2, 132, 199, 0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05 }}>
                  <TrendingUp size={120} color="#0284c7" />
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Faturamento Bruto
                  </span>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#0f172a', margin: '4px 0 2px 0' }}>
                    R$ {metricasDashboard.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.8rem', color: '#0284c7', fontWeight: '700' }}>
                  <Activity size={14} /> {metricasDashboard.quantidade} procedimento(s) realizados
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '18px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.08)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Taxa de Quitação
                  </span>
                  <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#10b981', margin: '4px 0 2px 0' }}>
                    {metricasDashboard.taxaRecebimento.toFixed(1)}%
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${metricasDashboard.taxaRecebimento}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px', transition: 'width 0.5s ease-in-out' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico Rosca */}
            <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#0f172a', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ backgroundColor: '#e0f2fe', padding: '8px', borderRadius: '10px', display: 'flex', color: '#0284c7' }}>
                  <Building2 size={20} />
                </div>
                Faturamento por Clínica
              </div>

              {metricasDashboard.fatiasSVG.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, textAlign: 'center', padding: '20px' }}>Nenhum procedimento registrado neste período.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '24px', alignItems: 'center' }}>
                  
                  <div style={{ position: 'relative', width: '280px', height: '280px', margin: '0 auto' }}>
                    <svg width="280" height="280" viewBox="0 0 280 280" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                      {metricasDashboard.fatiasSVG.map((fatia) => (
                        <path
                          key={fatia.id}
                          d={fatia.pathData}
                          fill="none"
                          stroke={fatia.cor}
                          strokeWidth={fatiaHover?.id === fatia.id ? "42" : "34"}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            opacity: fatiaHover && fatiaHover.id !== fatia.id ? 0.35 : 1
                          }}
                          onMouseEnter={() => setFatiaHover(fatia)}
                          onMouseLeave={() => setFatiaHover(null)}
                        />
                      ))}
                    </svg>

                    <div style={{ 
                      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                      width: '170px', height: '170px', backgroundColor: '#ffffff', borderRadius: '50%',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '10px', textAlign: 'center', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06)',
                      pointerEvents: 'none'
                    }}>
                      {fatiaHover ? (
                        <>
                          <span style={{ fontSize: '0.75rem', color: fatiaHover.cor, fontWeight: '800', textTransform: 'uppercase', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                            {fatiaHover.nome}
                          </span>
                          <span style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: '900' }}>
                            R$ {fatiaHover.valor.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '700' }}>
                            {fatiaHover.porcentagem.toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <span style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: '900' }}>
                          R$ {metricasDashboard.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                          <th style={{ padding: '8px' }}>Clínica</th>
                          <th style={{ padding: '8px', textAlign: 'center' }}>%</th>
                          <th style={{ padding: '8px', textAlign: 'right' }}>Total (R$)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricasDashboard.fatiasSVG.map((fatia) => (
                          <tr 
                            key={fatia.id}
                            onMouseEnter={() => setFatiaHover(fatia)}
                            onMouseLeave={() => setFatiaHover(null)}
                            style={{ 
                              borderBottom: '1px solid #f8fafc', 
                              backgroundColor: fatiaHover?.id === fatia.id ? '#f0f9ff' : 'transparent',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s'
                            }}
                          >
                            <td style={{ padding: '8px', fontWeight: '700', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: fatia.cor, display: 'inline-block' }} />
                              {fatia.nome}
                            </td>
                            <td style={{ padding: '8px', textAlign: 'center', color: '#64748b', fontWeight: '600' }}>
                              {fatia.porcentagem.toFixed(1)}%
                            </td>
                            <td style={{ padding: '8px', textAlign: 'right', fontWeight: '800', color: '#16a34a' }}>
                              R$ {fatia.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}
            </div>

            {/* Pendências */}
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ backgroundColor: '#fef3c7', padding: '6px', borderRadius: '8px', display: 'flex', color: '#b45309' }}>
                    <AlertCircle size={18} />
                  </div>
                  Pendências Financeiras por Clínica
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#b45309', backgroundColor: '#fffbeb', padding: '4px 10px', borderRadius: '20px', border: '1px solid #fde68a' }}>
                  {Object.keys(metricasDashboard.pendentesPorClinica).length} clínica(s) com débitos
                </span>
              </div>

              {Object.keys(metricasDashboard.pendentesPorClinica).length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f0fdf4', borderRadius: '14px', color: '#166534', fontWeight: '700', fontSize: '0.85rem' }}>
                  🎉 Excelente! Nenhuma pendência em aberto neste período.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '10px 12px' }}>Clínica</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Fichas Em Aberto</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total Retido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(metricasDashboard.pendentesPorClinica)
                        .sort((a, b) => b[1].valor - a[1].valor)
                        .map(([clinicaNome, dados]) => (
                          <tr key={clinicaNome} style={{ borderBottom: '1px solid #f8fafc', color: '#334155' }}>
                            <td style={{ padding: '12px', fontWeight: '700', color: '#0f172a' }}>{clinicaNome}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '12px', fontWeight: '800', fontSize: '0.75rem' }}>
                                {dados.qtd} ficha(s)
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '800', color: '#dc2626', fontSize: '0.95rem' }}>
                              R$ {dados.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Espécie */}
            <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '800', color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ backgroundColor: '#e0f2fe', padding: '6px', borderRadius: '8px', display: 'flex', color: '#0284c7' }}>
                  <Dog size={18} />
                </div>
                Atendimentos por Espécie
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#0369a1', textTransform: 'uppercase' }}>Cães</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#0284c7' }}>{metricasDashboard.caes}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#0284c7', backgroundColor: '#ffffff', padding: '4px 10px', borderRadius: '12px' }}>
                    {metricasDashboard.quantidade > 0 ? ((metricasDashboard.caes / metricasDashboard.quantidade) * 100).toFixed(0) : 0}%
                  </span>
                </div>

                <div style={{ backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#9d174d', textTransform: 'uppercase' }}>Gatos</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#be185d' }}>{metricasDashboard.gatos}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#be185d', backgroundColor: '#ffffff', padding: '4px 10px', borderRadius: '12px' }}>
                    {metricasDashboard.quantidade > 0 ? ((metricasDashboard.gatos / metricasDashboard.quantidade) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Modal de Quitação */}
        {modalQuitacao && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#ffffff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '400px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={20} color="#16a34a" /> Realizar Quitação
                </h3>
                <button onClick={() => setModalQuitacao(null)} style={{ border: 'none', backgroundColor: 'transparent', color: '#64748b', cursor: 'pointer', padding: '4px' }}>
                  <X size={20} />
                </button>
              </div>

              <p style={{ fontSize: '0.85rem', color: '#475569', marginTop: 0, marginBottom: '16px' }}>
                Paciente: <strong style={{ color: '#0f172a' }}>{modalQuitacao.paciente}</strong>
              </p>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Forma de Pagamento *
                </label>
                <select
                  value={quitFormaPgto}
                  onChange={(e) => setQuitFormaPgto(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', backgroundColor: '#ffffff', fontWeight: '600' }}
                >
                  <option value="PIX">PIX</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Débito">Débito</option>
                  <option value="Crédito (à Vista)">Crédito (à Vista)</option>
                  <option value="Crédito (parcelado)">Crédito (parcelado)</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Data do Pagamento *
                </label>
                <input
                  type="date"
                  value={quitDataPgto}
                  onChange={(e) => setQuitDataPgto(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontWeight: '600' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setModalQuitacao(null)}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarQuitacao}
                  style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)' }}
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
