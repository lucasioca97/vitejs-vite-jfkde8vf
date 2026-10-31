import { useState, useEffect } from 'react';
import { Stethoscope, User, Plus, Activity, Loader2, MapPin, DollarSign } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

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
  const [salvando, setSalvando] = useState(false);

  // Campos da Ficha
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

  useEffect(() => {
    const q = query(collection(db, 'anestesias'), orderBy('dataCriacao', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegistos(dados);
    });
    return () => unsubscribe();
  }, []);

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

      // Limpar formulário
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
    } catch (error: any) {
      alert("Erro ao guardar: " + error.message);
    }
    setSalvando(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f9ff', padding: '16px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        
        {/* Cabeçalho */}
        <div style={{ backgroundColor: '#164e63', color: 'white', padding: '18px', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Stethoscope size={28} />
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>Ficha Anestésica</h1>
        </div>

        <div style={{ padding: '20px' }}>
          <form onSubmit={guardarRegisto} style={{ marginBottom: '30px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            
            {/* Linha 1: Data, Local, Valor */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Data</label>
                <input type="date" value={dataProc} onChange={(e) => setDataProc(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Local</label>
                <input type="text" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Clínica/Hosp." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Valor</label>
                <input type="text" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="R$" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Linha 2: Cirurgião, Data Pgto */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Cirurgião</label>
                <input type="text" value={cirurgiao} onChange={(e) => setCirurgiao(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Data Pgto</label>
                <input type="date" value={dataPgto} onChange={(e) => setDataPgto(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Linha 3: Paciente, Peso, Forma Pgto */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Paciente</label>
                <input type="text" value={paciente} onChange={(e) => setPaciente(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Peso (kg)</label>
                <input type="text" value={peso} onChange={(e) => setPeso(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Forma Pgto</label>
                <input type="text" value={formaPgto} onChange={(e) => setFormaPgto(e.target.value)} placeholder="Pix/Cartão" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
              </div>
            </div>

            {/* Linha 4: Tutor */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Tutor</label>
              <input type="text" value={tutor} onChange={(e) => setTutor(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>

            {/* Linha 5: Procedimento */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Procedimento</label>
              <input type="text" value={procedimento} onChange={(e) => setProcedimento(e.target.value)} required style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>

            {/* Linha 6: Observações */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>Observações</label>
              <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>

            <button type="submit" disabled={salvando} style={{ backgroundColor: '#164e63', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold' }}>
              {salvando ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />} {salvando ? 'A Guardar...' : 'Salvar Ficha'}
            </button>
          </form>

          {/* Histórico de Fichas */}
          <div>
            <h2 style={{ fontSize: '1.1rem', color: '#164e63', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #cffaff', paddingBottom: '8px', marginBottom: '16px' }}>
              <Activity size={20} /> Histórico de Fichas
            </h2>
            {registos.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#64748b' }}>Nenhuma ficha registada.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {registos.map((registo) => (
                  <div key={registo.id} style={{ padding: '14px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#0f172a', marginBottom: '6px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <User size={16} /> Paciente: {registo.paciente} {registo.peso && `(${registo.peso} kg)`}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#0284c7' }}>{registo.dataProc}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '4px' }}><strong>Procedimento:</strong> {registo.procedimento}</div>
                    {registo.tutor && <div style={{ fontSize: '0.85rem', color: '#475569' }}><strong>Tutor:</strong> {registo.tutor}</div>}
                    {registo.cirurgiao && <div style={{ fontSize: '0.85rem', color: '#475569' }}><strong>Cirurgião:</strong> {registo.cirurgiao}</div>}
                    {registo.local && (
                      <div style={{ fontSize: '0.85rem', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> {registo.local}
                      </div>
                    )}
                    {(registo.valor || registo.formaPgto) && (
                      <div style={{ fontSize: '0.85rem', color: '#166534', marginTop: '4px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <DollarSign size={14} /> {registo.valor} {registo.formaPgto && `via ${registo.formaPgto}`} {registo.dataPgto && `(Pgto: ${registo.dataPgto})`}
                      </div>
                    )}
                    {registo.observacoes && <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>Obs: {registo.observacoes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}