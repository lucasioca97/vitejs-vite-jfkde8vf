import { useState, useEffect } from 'react';
import { 
  Stethoscope, User, Plus, Activity, Loader2, MapPin, 
  DollarSign, Calendar, FileText, CheckCircle2, Clock, Building2, Pencil, Trash2, X, Check
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

export default function App() {
  const [registos, setRegistos] = useState<any[]>([]);
  const [clinicas, setClinicas] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [salvandoClinica, setSalvandoClinica] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'formulario' | 'historico' | 'clinicas'>('formulario');

  // Estados dos Campos da Ficha
  const [dataProc, setDataProc] = useState('');
  const [local, setLocal] = useState('');
  const [valor, setValor] = useState('');
  const [cirurgiao, setCirurgiao] = useState('');
  const [dataPgto, setDataPgto] = useState('');
  const [paciente, setPaciente] = useState('');
  const [peso, setPeso] = useState('');
  const [formaPgto, setFormaPgto] = useState('');
  const [tutor, setTutor] = useState('');
  const [procedimento, setProcedimento] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Estado do Cadastro e Edição de Clínica
  const [novaClinicaNome, setNovaClinicaNome] = useState('');
  const [clinicaEditandoId, setClinicaEditandoId] = useState<string | null>(null);
  const [nomeEditado, setNomeEditado] = useState('');

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

  // Manipulador de Peso
  const handlePesoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9.,]/g, '');
    if (val.length <= 6) {
      setPeso(val);
    }
  };

  // Manipulador de Valor com Formatação de 2 Casas Decimais
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const apenasDigitos = e.target.value.replace(/\D/g, '');
    if (!apenasDigitos) {
      setValor('');
      return;
    }
    const numero = (parseInt(apenasDigitos, 10) / 100).toFixed(2);
    const formatado = numero.replace('.', ',');
    setValor(formatado);
  };

  const guardarRegisto = async (e: React.FormEvent) => {
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
        peso,
        formaPgto,
        tutor,
        procedimento,
        observacoes,
        dataCriacao: serverTimestamp()
      });

      // Reset formulário
      setDataProc('');
      setLocal('');
      setValor('');
      setCirurgiao('');
      setDataPgto('');
      setPaciente('');
      setPeso('');
      setFormaPgto('');
      setTutor('');
      setProcedimento('');
      setObservacoes('');

      setAbaAtiva('historico');
    } catch (error: any) {
      alert("Erro ao guardar: " + error.message);
    }
    setSalvando(false);
  };

  const guardarClinica = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaClinicaNome.trim()) return;
    setSalvandoClinica(true);
    try {
      await addDoc(collection(db, 'clinicas'), {
        nome: novaClinicaNome.trim(),
        dataCriacao: serverTimestamp()
      });
      setNovaClinicaNome('');
    } catch (error: any) {
      alert("Erro ao cadastrar clínica: " + error.message);
    }
    setSalvandoClinica(false);
  };

  const excluirClinica = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir a clínica "${nome}"?`)) {
      try {
        await deleteDoc(doc(db, 'clinicas', id));
      } catch (error: any) {
        alert("Erro ao excluir clínica: " + error.message);
      }
    }
  };

  const iniciarEdicaoClinica = (id: string, nomeAtual: string) => {
    setClinicaEditandoId(id);
    setNomeEditado(nomeAtual);
  };

  const salvarEdicaoClinica = async (id: string) => {
    if (!nomeEditado.trim()) return;
    try {
      await updateDoc(doc(db, 'clinicas', id), {
        nome: nomeEditado.trim()
      });
      setClinicaEditandoId(null);
      setNomeEditado('');
    } catch (error: any) {
      alert("Erro ao atualizar clínica: " + error.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f1f5f9', padding: '12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        
        {/* Topo / Header */}
        <header style={{ 
          backgroundColor: '#0f172a', 
          color: '#ffffff', 
          padding: '20px 16px', 
          borderRadius: '16px', 
          display: 'flex', 
          alignItems: 'center', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#0284c7', padding: '10px', borderRadius: '12px', display: 'flex' }}>
              <Stethoscope size={26} color="#ffffff" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#ffffff' }}>Ficha Anestésica</h1>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#e2e8f0' }}>Registro veterinário rápido</p>
            </div>
          </div>
        </header>

        {/* Menu de Abas */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', backgroundColor: '#e2e8f0', padding: '4px', borderRadius: '12px' }}>
          <button 
            onClick={() => setAbaAtiva('formulario')} 
            style={{ 
              flex: 1, 
              padding: '10px 6px', 
              borderRadius: '8px', 
              border: 'none', 
              backgroundColor: abaAtiva === 'formulario' ? '#ffffff' : 'transparent', 
              color: abaAtiva === 'formulario' ? '#0284c7' : '#64748b', 
              fontWeight: '700', 
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              boxShadow: abaAtiva === 'formulario' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Plus size={16} /> Nova Ficha
          </button>

          <button 
            onClick={() => setAbaAtiva('historico')} 
            style={{ 
              flex: 1, 
              padding: '10px 6px', 
              borderRadius: '8px', 
              border: 'none', 
              backgroundColor: abaAtiva === 'historico' ? '#ffffff' : 'transparent', 
              color: abaAtiva === 'historico' ? '#0284c7' : '#64748b', 
              fontWeight: '700', 
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              boxShadow: abaAtiva === 'historico' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Activity size={16} /> Histórico
          </button>

          <button 
            onClick={() => setAbaAtiva('clinicas')} 
            style={{ 
              flex: 1, 
              padding: '10px 6px', 
              borderRadius: '8px', 
              border: 'none', 
              backgroundColor: abaAtiva === 'clinicas' ? '#ffffff' : 'transparent', 
              color: abaAtiva === 'clinicas' ? '#0284c7' : '#64748b', 
              fontWeight: '700', 
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              boxShadow: abaAtiva === 'clinicas' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            <Building2 size={16} /> Clínicas
          </button>
        </div>

        {/* Conteúdo da Aba 1: Formulário */}
        {abaAtiva === 'formulario' && (
          <form onSubmit={guardarRegisto} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
            
            {/* Seção 1: Dados do Paciente e Procedimento */}
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left' }}>
                <User size={16} /> Paciente e Procedimento
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Nome do Paciente</label>
                  <input type="text" value={paciente} onChange={(e) => setPaciente(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Peso (kg)</label>
                  <input type="text" inputMode="decimal" value={peso} onChange={handlePesoChange} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ marginBottom: '10px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Procedimento</label>
                <input type="text" value={procedimento} onChange={(e) => setProcedimento(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Nome do Tutor</label>
                <input type="text" value={tutor} onChange={(e) => setTutor(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Seção 2: Local e Equipe */}
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left' }}>
                <MapPin size={16} /> Local e Equipe
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Data do Procedimento</label>
                  <input type="date" value={dataProc} onChange={(e) => setDataProc(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Local / Clínica</label>
                  <select 
                    value={local} 
                    onChange={(e) => setLocal(e.target.value)} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                  >
                    <option value="">Selecione uma clínica...</option>
                    {clinicas.map((item) => (
                      <option key={item.id} value={item.nome}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Cirurgião Responsável</label>
                <input type="text" value={cirurgiao} onChange={(e) => setCirurgiao(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Seção 3: Financeiro */}
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#16a34a', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'left' }}>
                <DollarSign size={16} /> Financeiro e Pagamento
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Valor (R$)</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', paddingLeft: '8px', backgroundColor: '#ffffff' }}>
                    <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600' }}>R$</span>
                    <input 
                      type="text" 
                      inputMode="numeric" 
                      value={valor} 
                      onChange={handleValorChange} 
                      placeholder="0,00"
                      style={{ width: '100%', padding: '10px 8px', border: 'none', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backgroundColor: 'transparent' }} 
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Forma de Pagamento</label>
                  <select 
                    value={formaPgto} 
                    onChange={(e) => setFormaPgto(e.target.value)} 
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#ffffff' }}
                  >
                    <option value="">Selecione...</option>
                    <option value="PIX">PIX</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Débito">Débito</option>
                    <option value="Crédito (à Vista)">Crédito (à Vista)</option>
                    <option value="Crédito (parcelado)">Crédito (parcelado)</option>
                  </select>
                </div>
              </div>

              <div style={{ textAlign: 'left' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px', textAlign: 'left' }}>Data do Pagamento</label>
                <input type="date" value={dataPgto} onChange={(e) => setDataPgto(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Seção 4: Observações */}
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'left' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', textAlign: 'left' }}>
                <FileText size={16} color="#64748b" /> Observações Clínicas
              </label>
              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
            </div>

            {/* Botão de Envio */}
            <button type="submit" disabled={salvando} style={{ 
              backgroundColor: salvando ? '#64748b' : '#0284c7', 
              color: '#ffffff', 
              border: 'none', 
              padding: '14px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              cursor: salvando ? 'not-allowed' : 'pointer', 
              fontSize: '1rem', 
              fontWeight: '700',
              boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.3)',
              transition: 'all 0.2s'
            }}>
              {salvando ? <Loader2 size={22} className="animate-spin" /> : <Plus size={22} />} 
              {salvando ? 'A Salvar Ficha...' : 'Salvar Ficha Anestésica'}
            </button>
          </form>
        )}

        {/* Conteúdo da Aba 2: Histórico */}
        {abaAtiva === 'historico' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', padding: '0 4px' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="#0284c7" /> Histórico Recente
              </h2>
            </div>

            {registos.length === 0 ? (
              <div style={{ backgroundColor: '#ffffff', padding: '32px 16px', borderRadius: '14px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
                Nenhuma ficha cadastrada ainda.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {registos.map((registo) => (
                  <div key={registo.id} style={{ backgroundColor: '#ffffff', borderRadius: '14px', padding: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', textAlign: 'left' }}>
                    
                    {/* Cabeçalho do Card */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#0f172a' }}>{registo.paciente}</span>
                        {registo.peso && <span style={{ marginLeft: '6px', fontSize: '0.8rem', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>{registo.peso} kg</span>}
                      </div>
                      {registo.dataProc && (
                        <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#f8fafc', padding: '4px 8px', borderRadius: '6px' }}>
                          <Calendar size={12} /> {registo.dataProc}
                        </span>
                      )}
                    </div>

                    {/* Procedimento */}
                    <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#334155', marginBottom: '8px' }}>
                      {registo.procedimento}
                    </div>

                    {/* Detalhes Médicos */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.8rem', color: '#64748b', marginBottom: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                      {registo.tutor && <div><strong>Tutor:</strong> {registo.tutor}</div>}
                      {registo.cirurgiao && <div><strong>Cirurgião:</strong> {registo.cirurgiao}</div>}
                      {registo.local && <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><MapPin size={12} /> {registo.local}</div>}
                    </div>

                    {/* Detalhes Financeiros */}
                    {(registo.valor || registo.formaPgto) && (
                      <div style={{ backgroundColor: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#166534', fontWeight: '600' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <DollarSign size={15} /> R$ {registo.valor || '0,00'} {registo.formaPgto && `(${registo.formaPgto})`}
                        </span>
                        {registo.dataPgto ? (
                          <span style={{ fontSize: '0.75rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <CheckCircle2 size={12} /> Pago em {registo.dataPgto}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#b45309', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={12} /> Pendente
                          </span>
                        )}
                      </div>
                    )}

                    {/* Observações */}
                    {registo.observacoes && (
                      <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#475569', backgroundColor: '#f8fafc', padding: '8px', borderRadius: '6px', fontStyle: 'italic', borderLeft: '3px solid #cbd5e1' }}>
                        {registo.observacoes}
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conteúdo da Aba 3: Cadastro de Clínicas */}
        {abaAtiva === 'clinicas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Formulário para Adicionar Clínica */}
            <form onSubmit={guardarClinica} style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={16} /> Cadastrar Nova Clínica
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Nome da Clínica / Hospital</label>
                <input 
                  type="text" 
                  value={novaClinicaNome} 
                  onChange={(e) => setNovaClinicaNome(e.target.value)} 
                  required 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} 
                />
              </div>

              <button type="submit" disabled={salvandoClinica} style={{ 
                backgroundColor: salvandoClinica ? '#64748b' : '#0284c7', 
                color: '#ffffff', 
                border: 'none', 
                padding: '12px', 
                borderRadius: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '8px', 
                cursor: salvandoClinica ? 'not-allowed' : 'pointer', 
                fontSize: '0.9rem', 
                fontWeight: '700',
                width: '100%'
              }}>
                {salvandoClinica ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} 
                {salvandoClinica ? 'A Salvar...' : 'Salvar Clínica'}
              </button>
            </form>

            {/* Lista de Clínicas Cadastradas com Edição e Exclusão */}
            <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'left' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a', marginTop: 0, marginBottom: '12px' }}>Clínicas Cadastradas ({clinicas.length})</h3>
              
              {clinicas.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', margin: '16px 0' }}>Nenhuma clínica cadastrada ainda.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {clinicas.map((item) => (
                    <div key={item.id} style={{ padding: '10px 12px', border: '1px solid #f1f5f9', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      
                      {/* Modo de Edição Inline */}
                      {clinicaEditandoId === item.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                          <input 
                            type="text" 
                            value={nomeEditado} 
                            onChange={(e) => setNomeEditado(e.target.value)} 
                            style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #0284c7', fontSize: '0.9rem', outline: 'none' }}
                          />
                          <button onClick={() => salvarEdicaoClinica(item.id)} style={{ backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}>
                            <Check size={16} />
                          </button>
                          <button onClick={() => setClinicaEditandoId(null)} style={{ backgroundColor: '#94a3b8', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        /* Exibição Normal */
                        <>
                          <div style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 size={16} color="#0284c7" /> {item.nome}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button onClick={() => iniciarEdicaoClinica(item.id, item.nome)} title="Editar" style={{ backgroundColor: '#e0f2fe', color: '#0284c7', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}>
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => excluirClinica(item.id, item.nome)} title="Excluir" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}>
                              <Trash2 size={15} />
                            </button>
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

      </div>
    </div>
  );
}