import { useState, useEffect } from 'react';
import { Stethoscope, Calendar, User, Syringe, Plus, Activity, Loader2 } from 'lucide-react';
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
  const [paciente, setPaciente] = useState('');
  const [cirurgia, setCirurgia] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'anestesias'), orderBy('data', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRegistos(dados);
    });
    return () => unsubscribe();
  }, []);

  const guardarRegisto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paciente || !cirurgia) return;
    setSalvando(true);
    try {
      await addDoc(collection(db, 'anestesias'), { paciente, cirurgia, data: serverTimestamp() });
      setPaciente('');
      setCirurgia('');
    } catch (error: any) {
      alert("Erro: " + error.message);
    }
    setSalvando(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f9ff', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '20px', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Stethoscope size={28} />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Registo de Anestesias</h1>
        </div>
        <div style={{ padding: '24px' }}>
          <form onSubmit={guardarRegisto} style={{ marginBottom: '30px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#334155' }}>Nome do Paciente</label>
              <input type="text" value={paciente} onChange={(e) => setPaciente(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500', color: '#334155' }}>Procedimento</label>
              <input type="text" value={cirurgia} onChange={(e) => setCirurgia(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} />
            </div>
            <button type="submit" disabled={salvando} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', width: '100%', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>
              {salvando ? <Loader2 size={24} className="animate-spin" /> : <Plus size={24} />} {salvando ? 'A Guardar...' : 'Adicionar Procedimento'}
            </button>
          </form>
          <div>
            <h2 style={{ fontSize: '1.2rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #bfdbfe', paddingBottom: '10px', marginBottom: '16px' }}>
              <Activity size={22} /> Histórico
            </h2>
            {registos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <Calendar size={48} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '1.1rem' }}>Nenhum registo.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {registos.map((registo) => (
                  <div key={registo.id} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}><User size={16} /> {registo.paciente}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.9rem' }}><Syringe size={16} /> {registo.cirurgia}</div>
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