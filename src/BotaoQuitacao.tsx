import { useState } from 'react';

export function BotaoQuitacao() {
  const [modalAberto, setModalAberto] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('');
  const [data, setData] = useState('');

  const handleConfirmar = () => {
    // Aqui envia os dados para a sua base de dados ou API
    console.log("Dados enviados:", { formaPagamento, data });
    alert(`Quitação registada com sucesso!\nForma: ${formaPagamento}\nData: ${data}`);
    
    setModalAberto(false);
    setFormaPagamento('');
    setData('');
  };

  return (
    <div className="mt-4">
      {!modalAberto ? (
        <button 
          onClick={() => setModalAberto(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Realizar Quitação
        </button>
      ) : (
        <div className="border p-4 rounded shadow-md bg-white max-w-sm">
          <h3 className="font-bold mb-4 text-gray-800">Confirmar Quitação</h3>
          
          <div className="mb-3">
            <label className="block text-sm mb-1 text-gray-700">Forma de Pagamento:</label>
            <select 
              value={formaPagamento} 
              onChange={(e) => setFormaPagamento(e.target.value)}
              className="w-full border p-2 rounded"
            >
              <option value="">Selecione...</option>
              <option value="pix">PIX</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="boleto">Boleto</option>
              <option value="dinheiro">Dinheiro</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1 text-gray-700">Data:</label>
            <input 
              type="date" 
              value={data} 
              onChange={(e) => setData(e.target.value)}
              className="w-full border p-2 rounded"
            />
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleConfirmar}
              disabled={!formaPagamento || !data}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 flex-1"
            >
              Confirmar
            </button>
            <button 
              onClick={() => setModalAberto(false)}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded flex-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
