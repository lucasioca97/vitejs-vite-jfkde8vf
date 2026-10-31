import React, { useState } from 'react';
import { Stethoscope, Calendar, User, Syringe, FileText, Plus, Activity } from 'lucide-react';

export default function App() {
  const [registos, setRegistos] = useState([]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f9ff', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        
        {/* Cabeçalho */}
        <div style={{ backgroundColor: '#2563eb', color: 'white', padding: '20px', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Stethoscope size={28} />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>Registo de Anestesias</h1>
        </div>
        
        <div style={{ padding: '24px' }}>
          {/* Botão Principal */}
          <button style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '30px', width: '100%', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 'bold', transition: 'background 0.2s' }}>
            <Plus size={24} /> Adicionar Novo Procedimento
          </button>

          {/* Área de Histórico */}
          <div>
            <h2 style={{ fontSize: '1.2rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #bfdbfe', paddingBottom: '10px' }}>
              <Activity size={22} /> Histórico de Hoje
            </h2>
            
            {registos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <Calendar size={48} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '1.1rem' }}>Nenhuma anestesia registada até ao momento.</p>
              </div>
            ) : (
              <p>Os registos aparecerão aqui.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
