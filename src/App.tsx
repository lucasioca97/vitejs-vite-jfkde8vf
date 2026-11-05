
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
