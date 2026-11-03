import { useState, useEffect, useMemo, useRef, type FormEvent } from 'react';
import { 
  Plus, Activity, Loader2,
  Building2, Pencil, Trash2, X, Check, BarChart3, Dog, Download, 
  Search, Filter, UserCheck, CheckCircle, TrendingUp, AlertCircle, 
  ChevronLeft, ClipboardList, BarChart2, SlidersHorizontal, LogOut, Syringe
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, deleteDoc, updateDoc } from 'firebase/firestore';
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
  
  const [abaAtiva, setAbaAtiva] = useState<'formulario' | 'historico' | 'clinicas' | 'cirurgioes' | 'dashboard'>('historico');

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
  const [especie, setEspecie] = useState('Canino'); // Alterado para bater com a imagem
  const [raca, setRaca] = useState(''); // Novo campo da imagem
  const [peso, setPeso] = useState('');
  const [formaPgto, setFormaPgto] = useState('');
  const [tutor, setTutor] = useState('');
  const [procedimento, setProcedimento] = useState(''); // Era cirurgia
  const [complexidade, setComplexidade] = useState('Média');
  const [observacoes, setObservacoes] = useState('');

  // Estado para a Janela (Modal) de Quitação
  const [modalQuitacao, setModalQuitacao] = useState<{ id: string; paciente: string } | null>(null);
  const [quitFormaPgto, setQuitFormaPgto] = useState('Pix');
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
        raca,
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
      setEspecie('Canino');
      setRaca('');
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
    setQuitFormaPgto('Pix');
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
    setAbaAtiva('formulario');
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
        especie: editFichaData.especie || 'Canino',
        raca: editFichaData.raca || '',
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
      setAbaAtiva('historico');
    } catch (error: any) {
      alert("Erro ao atualizar ficha: " + error.message);
    }
  };

  const cancelarEdicao = () => {
    setFichaEditandoId(null);
    setEditFichaData({});
    setAbaAtiva('historico');
  };

  const handleToggleStatus = (id: string, dataPgtoAtual: string) => {
      if (dataPgtoAtual) {
          // Desmarcar pagamento
          updateDoc(doc(db, 'anestesias', id), {
            dataPgto: '',
            formaPgto: ''
          });
      } else {
          // Apenas abre o modal de quitação
          const registo = registos.find(r => r.id === id);
          if (registo) {
              abrirModalQuitacao(id, registo.paciente);
          }
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

  const valorTotalHistorico = registosFiltradosEOrdenados.reduce((acc, curr) => {
      const numValor = curr.valor ? parseFloat(curr.valor.replace('.', '').replace(',', '.')) : 0;
      return acc + numValor;
  }, 0);

  const exportarCSV = () => {
    if (registosFiltradosEOrdenados.length === 0) {
      alert("Não há dados visíveis para exportar.");
      return;
    }
    const cabecalho = ["Data Procedimento", "Paciente", "Espécie", "Raça", "Peso (kg)", "Procedimento", "Complexidade", "Tutor", "Local / Clínica", "Cirurgião", "Valor (R$)", "Forma Pagamento", "Data Pagamento", "Observações"];
    const linhas = registosFiltradosEOrdenados.map(r => [
      `"${r.dataProc || ''}"`, `"${r.paciente || ''}"`, `"${r.especie || 'Canino'}"`, `"${r.raca || ''}"`, `"${r.peso || ''}"`, `"${r.procedimento || ''}"`, `"${r.complexidade || 'Média'}"`, `"${r.tutor || ''}"`, `"${r.local || ''}"`, `"${r.cirurgiao || ''}"`, `"${r.valor || ''}"`, `"${r.formaPgto || ''}"`, `"${r.dataPgto || ''}"`, `"${(r.observacoes || '').replace(/"/g, '""')}"`
    ]);
    const conteudoCSV = "﻿" + [cabecalho.join(";"), ...linhas.map(l => l.join(";"))].join("");
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
        return `Sem ${semana}
${inicio} a ${fim}`;
      }

      const [ano, mes, dia] = chave.split('-');
      return `${dia}/${mes}
${ano}`;
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

      if (item.especie === 'Gato' || item.especie === 'Felino') gatos++;
      else if (item.especie === 'Cão' || item.especie === 'Canino') caes++;

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
    <div className="min-h-screen bg-gray-50 font-sans pb-24">
      {/* Header Superior Tailwind */}
      <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-teal-400 p-2 rounded-full text-white">
            <Syringe className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold text-gray-900">AnestVet</span>
        </div>
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-4xl mx-auto">
        
        {/* Formulário */}
        {abaAtiva === 'formulario' && (
          <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
              <div className="sticky top-0 bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100 z-10">
                <button onClick={cancelarEdicao} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {fichaEditandoId ? 'Editar registro' : 'Novo registro'}
                  </h2>
                  <p className="text-sm text-gray-500">Campos com * são obrigatórios.</p>
                </div>
              </div>

              <form onSubmit={fichaEditandoId ? () => salvarEdicaoFicha(fichaEditandoId) : guardarRegisto} className="p-4 pb-24 space-y-8 max-w-2xl mx-auto">
                
                {/* SESSÃO PACIENTE */}
                <section className="space-y-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paciente</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do paciente *</label>
                    <input 
                      required
                      type="text"
                      value={fichaEditandoId ? editFichaData.paciente || '' : paciente}
                      onChange={e => fichaEditandoId ? setEditFichaData({...editFichaData, paciente: e.target.value}) : setPaciente(e.target.value)}
                      className="w-full border border-gray-200 rounded-2xl p-3.5 text-gray-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tutor *</label>
                    <input 
                      required
                      type="text"
                      value={fichaEditandoId ? editFichaData.tutor || '' : tutor}
                      onChange={e => fichaEditandoId ? setEditFichaData({...editFichaData, tutor: e.target.value}) : setTutor(e.target.value)}
                      className="w-full border border-gray-200 rounded-2xl p-3.5 text-gray-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Espécie *</label>
                    <div className="flex flex-wrap gap-2">
                      {['Canino', 'Felino', 'Outro'].map((opcao) => (
                        <button
                          key={opcao}
                          type="button"
                          onClick={() => fichaEditandoId ? setEditFichaData({...editFichaData, especie: opcao}) : setEspecie(opcao)}
                          className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-colors ${
                            (fichaEditandoId ? editFichaData.especie : especie) === opcao 
                              ? 'bg-teal-600 border-teal-600 text-white' 
                              : 'bg-white border-gray-200 text-gray-700 hover:border-teal-600'
                          }`}
                        >
                          {opcao}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Raça</label>
                      <input 
                        type="text"
                        value={fichaEditandoId ? editFichaData.raca || '' : raca}
                        onChange={e => fichaEditandoId ? setEditFichaData({...editFichaData, raca: e.target.value}) : setRaca(e.target.value)}
                        className="w-full border border-gray-200 rounded-2xl p-3.5 text-gray-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Peso</label>
                      <input 
                        type="text"
                        value={fichaEditandoId ? editFichaData.peso || '' : peso}
                        onChange={e => handlePesoChange(e.target.value, !!fichaEditandoId)}
                        className="w-full border border-gray-200 rounded-2xl p-3.5 text-gray-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                      />
                    </div>
                  </div>
                </section>

                {/* SESSÃO PROCEDIMENTO */}
                <section className="space-y-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Procedimento</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Cirurgia *</label>
                    <input 
                      required
                      type="text"
                      value={fichaEditandoId ? editFichaData.procedimento || '' : procedimento}
                      onChange={e => fichaEditandoId ? setEditFichaData({...editFichaData, procedimento: e.target.value}) : setProcedimento(e.target.value)}
                      className="w-full border border-gray-200 rounded-2xl p-3.5 text-gray-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                  
                  {/* Complexidade mantida */}
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Complexidade *</label>
                      <select 
                        value={fichaEditandoId ? editFichaData.complexidade || 'Média' : complexidade}
                        onChange={e => fichaEditandoId ? setEditFichaData({...editFichaData, complexidade: e.target.value}) : setComplexidade(e.target.value)}
                        className="w-full border border-gray-200 rounded-2xl p-3.5 text-gray-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                      >
                        <option value="Baixa">🟢 Baixa</option>
                        <option value="Média">🔵 Média</option>
                        <option value="Alta">🟠 Alta</option>
                        <option value="Crítica / Especial">🔴 Crítica / Especial</option>
                      </select>
                  </div>

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Clínica / local *</label>
                      <select 
                        required
                        value={fichaEditandoId ? editFichaData.local || '' : local}
                        onChange={e => fichaEditandoId ? setEditFichaData({...editFichaData, local: e.target.value}) : setLocal(e.target.value)}
                        className="w-full border border-gray-200 rounded-2xl p-3.5 text-gray-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                      >
                        <option value="">Selecione...</option>
                        {clinicas.map((c) => (<option key={c.id} value={c.nome}>{c.nome}</option>))}
                      </select>
                    </div>
                    <button type="button" onClick={() => setAbaAtiva('clinicas')} className="p-3.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Cirurgião *</label>
                      <select 
                        required
                        value={fichaEditandoId ? editFichaData.cirurgiao || '' : cirurgiao}
                        onChange={e => fichaEditandoId ? setEditFichaData({...editFichaData, cirurgiao: e.target.value}) : setCirurgiao(e.target.value)}
                        className="w-full border border-gray-200 rounded-2xl p-3.5 text-gray-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 bg-white"
                      >
                        <option value="">Selecione...</option>
                        {cirurgioes.map((c) => (<option key={c.id} value={c.nome}>{c.nome}</option>))}
                      </select>
                    </div>
                    <button type="button" onClick={() => setAbaAtiva('cirurgioes')} className="p-3.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Data *</label>
                    <input 
                      required
                      type="date"
                      value={fichaEditandoId ? editFichaData.dataProc || '' : dataProc}
                      onChange={e => fichaEditandoId ? setEditFichaData({...editFichaData, dataProc: e.target.value}) : setDataProc(e.target.value)}
                      className="w-full border border-gray-200 rounded-2xl p-3.5 text-gray-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                </section>

                {/* SESSÃO PAGAMENTO */}
                <section className="space-y-5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pagamento</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Valor (R$) *</label>
                    <input 
                      required
                      type="text"
                      inputMode="numeric"
                      value={fichaEditandoId ? editFichaData.valor || '' : valor}
                      onChange={e => handleValorChange(e.target.value, !!fichaEditandoId)}
                      className="w-full border border-gray-200 rounded-2xl p-3.5 text-gray-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                    <div className="flex gap-2">
                      {['Pendente', 'Pago'].map((opcao) => {
                          const isPago = fichaEditandoId ? !!editFichaData.dataPgto : !!dataPgto;
                          const selecionado = (opcao === 'Pago' && isPago) || (opcao === 'Pendente' && !isPago);
                          
                          return (
                            <button
                                key={opcao}
                                type="button"
                                onClick={() => {
                                    if(opcao === 'Pago') {
                                        const hoje = new Date().toISOString().slice(0, 10);
                                        fichaEditandoId ? setEditFichaData({...editFichaData, dataPgto: hoje}) : setDataPgto(hoje);
                                    } else {
                                        fichaEditandoId ? setEditFichaData({...editFichaData, dataPgto: ''}) : setDataPgto('');
                                    }
                                }}
                                className={`px-6 py-2.5 rounded-full text-sm font-medium border transition-colors ${
                                    selecionado
                                    ? 'bg-teal-600 border-teal-600 text-white' 
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-teal-600'
                                }`}
                            >
                                {opcao}
                            </button>
                          )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Método de pagamento *</label>
                    <div className="flex flex-wrap gap-2">
                      {['Pix', 'Dinheiro', 'Cartão de crédito', 'Cartão de débito', 'Transferência'].map((opcao) => (
                        <button
                          key={opcao}
                          type="button"
                          onClick={() => fichaEditandoId ? setEditFichaData({...editFichaData, formaPgto: opcao}) : setFormaPgto(opcao)}
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                            (fichaEditandoId ? editFichaData.formaPgto : formaPgto) === opcao 
                              ? 'bg-teal-600 border-teal-600 text-white' 
                              : 'bg-white border-gray-200 text-gray-700 hover:border-teal-600'
                          }`}
                        >
                          {opcao}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Observações</label>
                    <textarea 
                      rows={3}
                      value={fichaEditandoId ? editFichaData.observacoes || '' : observacoes}
                      onChange={e => fichaEditandoId ? setEditFichaData({...editFichaData, observacoes: e.target.value}) : setObservacoes(e.target.value)}
                      className="w-full border border-gray-200 rounded-2xl p-3.5 text-gray-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 resize-none"
                      placeholder="Protocolo anestésico, intercorrências, ASA..."
                    />
                  </div>
                </section>

                {/* BOTÕES DE AÇÃO */}
                <div className="pt-4 space-y-4">
                  <button 
                    type="submit"
                    disabled={salvando}
                    className="w-full bg-teal-600 text-white font-semibold rounded-2xl py-4 hover:bg-teal-700 transition-colors shadow-md shadow-teal-200 flex justify-center items-center"
                  >
                     {salvando ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Salvar alterações
                  </button>
                  
                  {fichaEditandoId && (
                    <button 
                      type="button"
                      onClick={() => excluirFicha(fichaEditandoId, editFichaData.paciente)}
                      className="w-full flex items-center justify-center gap-2 text-red-500 font-medium py-3 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                      Excluir
                    </button>
                  )}
                </div>
              </form>
          </div>
        )}

        {/* Histórico */}
        {abaAtiva === 'historico' && (
          <div className="px-4 pt-4">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Registros</h1>
              <div className="flex justify-between items-center mt-1">
                  <p className="text-gray-500">
                      {registosFiltradosEOrdenados.length} registro(s) · R$ {valorTotalHistorico.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <button onClick={exportarCSV} className="text-teal-600 flex items-center gap-1 text-sm font-medium hover:text-teal-700">
                      <Download className="w-4 h-4" /> CSV
                  </button>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Buscar paciente, tutor, cirurgia..."
                  value={buscaHistorico}
                  onChange={(e) => setBuscaHistorico(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
              <button className="p-3 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50">
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Filtros Extras do código antigo */}
            <div className="grid grid-cols-3 gap-2 mb-6">
                <select value={filtroClinicaHistorico} onChange={(e) => setFiltroClinicaHistorico(e.target.value)} className="p-2 rounded-xl border border-gray-200 text-sm outline-none bg-white">
                  <option value="">Clínicas</option>
                  {clinicas.map((c) => (<option key={c.id} value={c.nome}>{c.nome}</option>))}
                </select>
                <select value={filtroStatusHistorico} onChange={(e) => setFiltroStatusHistorico(e.target.value)} className="p-2 rounded-xl border border-gray-200 text-sm outline-none bg-white">
                  <option value="">Status</option>
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                </select>
                <select value={ordenacaoHistorico} onChange={(e) => setOrdenacaoHistorico(e.target.value as any)} className="p-2 rounded-xl border border-gray-200 text-sm outline-none bg-white text-teal-600 font-medium">
                  <option value="data-desc">Data ↓</option>
                  <option value="data-asc">Data ↑</option>
                  <option value="paciente-asc">Paciente A-Z</option>
                  <option value="paciente-desc">Paciente Z-A</option>
                </select>
            </div>

            {registosFiltradosEOrdenados.length === 0 ? (
                <div className="text-center py-10 text-gray-400">Nenhum registro encontrado.</div>
            ) : (
                <div className="space-y-4">
                {registosFiltradosEOrdenados.map(registro => {
                    const isPago = !!registro.dataPgto;
                    return (
                        <div key={registro.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-base text-gray-900">
                                        <span className="font-bold">{registro.paciente}</span>
                                        <span className="text-gray-500 text-sm ml-1">
                                            · {registro.especie} {registro.raca && `, ${registro.raca}`} {registro.peso && `· ${registro.peso}kg`}
                                        </span>
                                    </h3>
                                    <p className="text-gray-700 text-sm mt-1">{registro.procedimento}</p>
                                </div>
                                <span className="font-semibold text-gray-900 whitespace-nowrap">
                                    R$ {registro.valor || '0,00'}
                                </span>
                            </div>

                            <div className="flex justify-between items-end mt-3 text-sm text-gray-500">
                                <div className="space-y-1">
                                    <p>Tutor: {registro.tutor}</p>
                                    <p>Clínica: {registro.local}</p>
                                    <p>Cirurgião: {registro.cirurgiao}</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p>{registro.dataProc ? registro.dataProc.split('-').reverse().join('/') : ''}</p>
                                    <p>{registro.formaPgto}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                                <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                                    isPago ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'
                                }`}>
                                    {isPago && <span>✓</span>} {isPago ? 'Pago' : 'Pendente'}
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => iniciarEdicaoFicha(registro)}
                                        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleToggleStatus(registro.id, registro.dataPgto)}
                                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        {isPago ? 'Marcar pendente' : 'Marcar pago'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                </div>
            )}
          </div>
        )}

        {/* Cadastro Clínicas */}
        {abaAtiva === 'clinicas' && (
          <div className="px-4 pt-4 space-y-6">
            <form onSubmit={guardarClinica} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-teal-600 font-bold mb-4 uppercase text-sm">
                <Building2 className="w-4 h-4" /> Cadastrar Nova Clínica
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome da Clínica</label>
                <input type="text" value={novaClinicaNome} onChange={(e) => setNovaClinicaNome(e.target.value)} required placeholder="Ex: Hospital Veterinário SanCla" className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600" />
              </div>
              <button type="submit" disabled={salvandoClinica} className="w-full bg-teal-600 text-white font-semibold rounded-xl py-3 hover:bg-teal-700 flex justify-center items-center gap-2 transition-colors">
                {salvandoClinica ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} 
                Salvar Clínica
              </button>
            </form>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">Clínicas Cadastradas ({clinicas.length})</h3>
              {clinicas.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Nenhuma clínica cadastrada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {clinicas.map((item) => (
                    <div key={item.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex items-center justify-between">
                      {clinicaEditandoId === item.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <input type="text" value={nomeClinicaEditado} onChange={(e) => setNomeClinicaEditado(e.target.value)} className="flex-1 p-2 rounded-lg border border-teal-600 text-sm outline-none" />
                          <button onClick={() => salvarEdicaoClinica(item.id)} className="bg-green-600 text-white p-2 rounded-lg"><Check size={16} /></button>
                          <button onClick={() => setClinicaEditandoId(null)} className="bg-gray-400 text-white p-2 rounded-lg"><X size={16} /></button>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-gray-700 font-semibold flex items-center gap-2">
                            <Building2 size={16} className="text-teal-600" /> {item.nome}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setClinicaEditandoId(item.id); setNomeClinicaEditado(item.nome); }} className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Pencil size={14} /></button>
                            <button onClick={() => excluirClinica(item.id, item.nome)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14} /></button>
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
          <div className="px-4 pt-4 space-y-6">
            <form onSubmit={guardarCirurgiao} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 text-teal-600 font-bold mb-4 uppercase text-sm">
                <UserCheck className="w-4 h-4" /> Cadastrar Novo Cirurgião
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome Completo</label>
                <input type="text" value={novoCirurgiaoNome} onChange={(e) => setNovoCirurgiaoNome(e.target.value)} required placeholder="Ex: Dra. Sabrina Micelli" className="w-full border border-gray-200 rounded-xl p-3 text-gray-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600" />
              </div>
              <button type="submit" disabled={salvandoCirurgiao} className="w-full bg-teal-600 text-white font-semibold rounded-xl py-3 hover:bg-teal-700 flex justify-center items-center gap-2 transition-colors">
                {salvandoCirurgiao ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} 
                Salvar Cirurgião
              </button>
            </form>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">Cirurgiões Cadastrados ({cirurgioes.length})</h3>
              {cirurgioes.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Nenhum cirurgião cadastrado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {cirurgioes.map((item) => (
                    <div key={item.id} className="p-3 border border-gray-100 rounded-xl bg-gray-50 flex items-center justify-between">
                      {cirurgiaoEditandoId === item.id ? (
                        <div className="flex items-center gap-2 w-full">
                          <input type="text" value={nomeCirurgiaoEditado} onChange={(e) => setNomeCirurgiaoEditado(e.target.value)} className="flex-1 p-2 rounded-lg border border-teal-600 text-sm outline-none" />
                          <button onClick={() => salvarEdicaoCirurgiao(item.id)} className="bg-green-600 text-white p-2 rounded-lg"><Check size={16} /></button>
                          <button onClick={() => setCirurgiaoEditandoId(null)} className="bg-gray-400 text-white p-2 rounded-lg"><X size={16} /></button>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-gray-700 font-semibold flex items-center gap-2">
                            <UserCheck size={16} className="text-teal-600" /> {item.nome}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setCirurgiaoEditandoId(item.id); setNomeCirurgiaoEditado(item.nome); }} className="p-2 bg-teal-50 text-teal-600 rounded-lg"><Pencil size={14} /></button>
                            <button onClick={() => excluirCirurgiao(item.id, item.nome)} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14} /></button>
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
          <div className="px-4 pt-4 space-y-4">
            
            {/* GRÁFICO DE FATURAMENTO POR PERÍODO */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">

              <div className="flex items-start justify-between flex-wrap gap-2 mb-4">
                <div>
                  <div className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-teal-600" /> Faturamento por Período
                  </div>
                  <div className="text-sm text-gray-500 font-medium mt-1">
                    Total exibido: <strong className="text-gray-900">R$ {dadosGraficoDrill.totalPeriodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>

                {(escopoGrafico || nivelDrill !== 'ano') && (
                  <button onClick={handleDrillUp} className="bg-teal-50 text-teal-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Subir Nível
                  </button>
                )}
              </div>

              {/* Seletor de nível */}
              <div className="flex gap-1 bg-gray-50 p-1 rounded-xl mb-3">
                {(['ano', 'mes', 'semana', 'dia'] as const).map(n => (
                  <button
                    key={n}
                    onClick={() => setNivelDrill(n)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${nivelDrill === n ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}
                  >
                    {({ ano: 'Ano', mes: 'Mês', semana: 'Semana', dia: 'Dia' } as const)[n]}
                  </button>
                ))}
              </div>

              {/* Filtro ativo */}
              <div className="text-xs text-gray-500 font-medium mb-3 flex items-center flex-wrap gap-1.5">
                {escopoGrafico ? (
                  <>
                    Filtrado em
                    <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 pl-2 pr-1 py-0.5 rounded-full font-bold">
                      {dadosGraficoDrill.formatarRotulo(escopoGrafico.chave, escopoGrafico.tipo).replace('\n', ' ')}
                      <button onClick={() => setEscopoGrafico(null)} className="text-teal-600 hover:text-teal-800 rounded-full w-4 h-4 flex items-center justify-center">
                        <X size={12} />
                      </button>
                    </span>
                  </>
                ) : (
                  <>Mostrando todo o período</>
                )}
                {nivelDrill !== 'dia' && <span className="text-gray-400">· clique na coluna para detalhar</span>}
              </div>

              {dadosGraficoDrill.chavesOrdenadas.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Nenhum dado encontrado para o período selecionado.
                </div>
              ) : (
                <div>
                  {/* Área das colunas */}
                  <div
                    ref={scrollGraficoRef}
                    className="overflow-x-auto bg-gray-50 rounded-xl border border-gray-100 p-4 pt-6 scrollbar-hide"
                  >
                    <div className="flex items-end gap-2 w-max min-w-full">
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
                            className={`flex flex-col items-center justify-end ${clicavel ? 'cursor-pointer' : 'cursor-default'}`}
                            style={{ width: nivelDrill === 'dia' ? '54px' : '74px', flex: '0 0 auto' }}
                          >
                            <span className="text-[10px] font-bold text-gray-500 mb-1 whitespace-nowrap">
                              R$ {totalColuna >= 1000 ? `${(totalColuna / 1000).toFixed(1)}k` : totalColuna.toFixed(0)}
                            </span>

                            <div className="w-full max-w-[38px] rounded-t-md overflow-hidden flex flex-col-reverse shadow-sm" style={{ height: `${alturaPx}px` }}>
                              {Object.entries(locaisDoGrupo).map(([nomeLocal, valorLocal]) => (
                                <div
                                  key={nomeLocal}
                                  title={`${nomeLocal}: R$ ${valorLocal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                  style={{ height: `${totalColuna > 0 ? (valorLocal / totalColuna) * 100 : 0}%`, backgroundColor: dadosGraficoDrill.mapaCoresClinicas[nomeLocal] || '#94a3b8', width: '100%' }}
                                />
                              ))}
                            </div>

                            <div className="text-[10px] font-bold text-gray-900 mt-2 whitespace-pre-line text-center leading-tight min-h-[30px] w-full">
                              {dadosGraficoDrill.formatarRotulo(chave)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legenda (apenas clínicas presentes no gráfico) */}
                  <div className="flex flex-wrap gap-2.5 mt-4 justify-center">
                    {dadosGraficoDrill.clinicasPresentes.map(nome => (
                      <div key={nome} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: dadosGraficoDrill.mapaCoresClinicas[nome] || '#94a3b8' }} />
                        {nome}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Filtro de Período Geral */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-teal-600" /> Filtrar Geral:
                </span>
                <select value={tipoPeriodo} onChange={(e) => setTipoPeriodo(e.target.value as any)} className="py-1.5 px-3 rounded-lg border border-gray-200 text-sm font-semibold bg-gray-50 text-teal-600 outline-none">
                  <option value="todos">Todo Histórico</option>
                  <option value="mes">Mês</option>
                  <option value="ano">Ano</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>

              {tipoPeriodo === 'mes' && (
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl">
                  <span className="text-xs text-gray-600 font-semibold">Mês/Ano:</span>
                  <input type="month" value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} className="py-1.5 px-2 rounded-lg border border-gray-200 text-sm outline-none font-medium" />
                </div>
              )}

              {tipoPeriodo === 'ano' && (
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl">
                  <span className="text-xs text-gray-600 font-semibold">Ano:</span>
                  <input type="number" value={anoFiltro} onChange={(e) => setAnoFiltro(e.target.value)} placeholder="2026" className="w-24 py-1.5 px-2 rounded-lg border border-gray-200 text-sm outline-none font-medium" />
                </div>
              )}

              {tipoPeriodo === 'personalizado' && (
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-xl">
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-0.5">De:</label>
                    <input type="date" value={dataInicioFiltro} onChange={(e) => setDataInicioFiltro(e.target.value)} className="w-full py-1.5 px-2 rounded-lg border border-gray-200 text-xs outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 font-bold block mb-0.5">Até:</label>
                    <input type="date" value={dataFimFiltro} onChange={(e) => setDataFimFiltro(e.target.value)} className="w-full py-1.5 px-2 rounded-lg border border-gray-200 text-xs outline-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Resumos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="absolute -right-3 -top-3 opacity-5">
                  <TrendingUp size={100} className="text-teal-600" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Faturamento Bruto
                  </span>
                  <div className="text-xl font-black text-gray-900 mt-1">
                    R$ {metricasDashboard.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-teal-600 font-bold">
                  <Activity size={14} /> {metricasDashboard.quantidade} procedimentos
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Taxa de Quitação
                  </span>
                  <div className="text-xl font-black text-green-500 mt-1">
                    {metricasDashboard.taxaRecebimento.toFixed(1)}%
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{ width: `${metricasDashboard.taxaRecebimento}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico Rosca */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <div className="bg-teal-50 p-2 rounded-xl text-teal-600">
                  <Building2 size={18} />
                </div>
                Faturamento por Clínica
              </div>

              {metricasDashboard.fatiasSVG.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Nenhum procedimento registrado neste período.</p>
              ) : (
                <div className="flex flex-col md:grid md:grid-cols-2 gap-6 items-center">
                  
                  <div className="relative w-64 h-64 mx-auto">
                    <svg width="256" height="256" viewBox="0 0 280 280" className="transform -rotate-90 overflow-visible">
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

                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white rounded-full flex flex-col items-center justify-center p-2 text-center shadow-inner pointer-events-none">
                      {fatiaHover ? (
                        <>
                          <span className="text-[10px] font-bold uppercase mb-0.5 truncate max-w-full px-2" style={{ color: fatiaHover.cor }}>
                            {fatiaHover.nome}
                          </span>
                          <span className="text-lg font-black text-gray-900">
                            R$ {fatiaHover.valor.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500">
                            {fatiaHover.porcentagem.toFixed(1)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-black text-gray-900">
                          R$ {metricasDashboard.totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-100 text-gray-500">
                          <th className="py-2">Clínica</th>
                          <th className="py-2 text-center">%</th>
                          <th className="py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metricasDashboard.fatiasSVG.map((fatia) => (
                          <tr 
                            key={fatia.id}
                            onMouseEnter={() => setFatiaHover(fatia)}
                            onMouseLeave={() => setFatiaHover(null)}
                            className={`border-b border-gray-50 cursor-pointer transition-colors ${fatiaHover?.id === fatia.id ? 'bg-teal-50' : 'bg-transparent'}`}
                          >
                            <td className="py-2 font-bold text-gray-700 flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: fatia.cor }} />
                              {fatia.nome}
                            </td>
                            <td className="py-2 text-center text-gray-500 font-semibold">
                              {fatia.porcentagem.toFixed(1)}%
                            </td>
                            <td className="py-2 text-right font-black text-green-600">
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
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <div className="bg-amber-100 p-1.5 rounded-lg text-amber-700">
                    <AlertCircle size={16} />
                  </div>
                  Pendências
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  {Object.keys(metricasDashboard.pendentesPorClinica).length} clínica(s)
                </span>
              </div>

              {Object.keys(metricasDashboard.pendentesPorClinica).length === 0 ? (
                <div className="p-4 text-center bg-green-50 rounded-xl text-green-700 font-bold text-sm">
                  🎉 Excelente! Nenhuma pendência em aberto.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-100 text-gray-500 uppercase tracking-wider text-[10px]">
                        <th className="py-2">Clínica</th>
                        <th className="py-2 text-center">Fichas</th>
                        <th className="py-2 text-right">Retido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(metricasDashboard.pendentesPorClinica)
                        .sort((a, b) => b[1].valor - a[1].valor)
                        .map(([clinicaNome, dados]) => (
                          <tr key={clinicaNome} className="border-b border-gray-50">
                            <td className="py-3 font-bold text-gray-900">{clinicaNome}</td>
                            <td className="py-3 text-center">
                              <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full font-bold text-[10px]">
                                {dados.qtd} un
                              </span>
                            </td>
                            <td className="py-3 text-right font-black text-red-600 text-sm">
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
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="bg-teal-50 p-1.5 rounded-lg text-teal-600">
                  <Dog size={16} />
                </div>
                Por Espécie
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-800 uppercase">Cães</span>
                    <div className="text-xl font-black text-blue-600">{metricasDashboard.caes}</div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 bg-white px-2.5 py-1 rounded-full">
                    {metricasDashboard.quantidade > 0 ? ((metricasDashboard.caes / metricasDashboard.quantidade) * 100).toFixed(0) : 0}%
                  </span>
                </div>

                <div className="bg-pink-50 border border-pink-100 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-pink-800 uppercase">Gatos</span>
                    <div className="text-xl font-black text-pink-600">{metricasDashboard.gatos}</div>
                  </div>
                  <span className="text-xs font-bold text-pink-600 bg-white px-2.5 py-1 rounded-full">
                    {metricasDashboard.quantidade > 0 ? ((metricasDashboard.gatos / metricasDashboard.quantidade) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Modal de Quitação */}
        {modalQuitacao && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="text-green-600 w-6 h-6" /> Quitação
                </h3>
                <button onClick={() => setModalQuitacao(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={20} />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-5">
                Paciente: <strong className="text-gray-900">{modalQuitacao.paciente}</strong>
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Forma de Pagamento *</label>
                  <select
                    value={quitFormaPgto}
                    onChange={(e) => setQuitFormaPgto(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none bg-white font-medium focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  >
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Cartão de crédito">Cartão de crédito</option>
                    <option value="Cartão de débito">Cartão de débito</option>
                    <option value="Transferência">Transferência</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Data *</label>
                  <input
                    type="date"
                    value={quitDataPgto}
                    onChange={(e) => setQuitDataPgto(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 text-sm outline-none font-medium focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setModalQuitacao(null)} className="flex-1 p-3 rounded-xl bg-gray-100 text-gray-600 font-bold text-sm">
                  Cancelar
                </button>
                <button onClick={confirmarQuitacao} className="flex-1 p-3 rounded-xl bg-green-600 text-white font-bold text-sm shadow-lg shadow-green-200">
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MENU INFERIOR COM BOTÃO FLUTUANTE */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 pb-safe flex justify-between items-center z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        {[
          { id: 'historico', icon: <ClipboardList className="w-6 h-6" />, label: 'Registros' },
          { id: 'clinicas', icon: <Building2 className="w-6 h-6" />, label: 'Clínicas' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setAbaAtiva(item.id as any)}
            className={`flex flex-col items-center p-2 w-[72px] transition-colors ${
              abaAtiva === item.id ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        ))}

        {/* Botão Central (+) */}
        <div className="relative -top-6 flex justify-center">
          <button
            onClick={() => {
                setFichaEditandoId(null);
                setEditFichaData({});
                setAbaAtiva('formulario');
            }}
            className="bg-teal-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-teal-200 transform transition active:scale-95 hover:bg-teal-700"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {[
          { id: 'cirurgioes', icon: <UserCheck className="w-6 h-6" />, label: 'Cirurgiões' },
          { id: 'dashboard', icon: <BarChart2 className="w-6 h-6" />, label: 'Dashboard' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setAbaAtiva(item.id as any)}
            className={`flex flex-col items-center p-2 w-[72px] transition-colors ${
              abaAtiva === item.id ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {item.icon}
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
