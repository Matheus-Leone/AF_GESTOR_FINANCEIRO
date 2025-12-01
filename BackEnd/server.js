import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();


app.use(express.json()); //API aceita arquivo Json

app.use(cors({
  origin: 'http://localhost:4200',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// CONEXÃO MONGODB (MONGOOSE)
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro na conexão:', err.message));

// (opcional, mas deixa as queries mais previsíveis)
mongoose.set('strictQuery', true);


// Modelo de "Classe com seus Atributos"
const TransacaoSchema = new mongoose.Schema({
  tipo:      { type: String, required: true, trim: true, minlength: 3 },
  nome:      { type: String, required: true, trim: true, minlength: 2 },
  valor:     { type: Number, required: true, min: 0 },
  categoria: { type: String, required: true, trim: true },
  data:      { type: String, required: true }
}, {
  collection: 'Transacoes',
  timestamps: false // não cria createdAt / updatedAt
});

const Transacao =
  mongoose.models.Transacao || mongoose.model('Transacao', TransacaoSchema);



// Rota inicial
app.get('/', (req, res) => {
  res.json({ msg: 'API Rodando' });
});


// Criar transação
app.post('/transacoes', async (req, res) => {
  try {
    const transacao = await Transacao.create(req.body);
    res.status(201).json(transacao);
  } catch (err) {
    console.error('Erro ao criar transação:', err);
    res.status(400).json({ error: err.message });
  }
});


// Listar todas
app.get('/transacoes', async (req, res) => {
  try {
    const transacoes = await Transacao.find()
    res.json(transacoes);
  } catch (err) {
    console.error('Erro ao listar transações:', err);
    res.status(500).json({ error: err.message });
  }
});


// Buscar por ID
app.get('/transacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const transacao = await Transacao.findById(id)
    if (!transacao) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    res.json(transacao);
  } catch (err) {
    console.error('Erro ao buscar por ID:', err);
    res.status(500).json({ error: err.message });
  }
});


// Atualizar (PUT)
app.put('/transacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const transacao = await Transacao.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!transacao) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    res.json(transacao);
  } catch (err) {
    console.error('Erro ao atualizar transação:', err);
    res.status(400).json({ error: err.message });
  }
});


// Deletar
app.delete('/transacoes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const transacao = await Transacao.findByIdAndDelete(id).lean();
    if (!transacao) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao deletar transação:', err);
    res.status(500).json({ error: err.message });
  }
});


// Filtrar por categoria
app.get('/transacoes/categoria/:categoria', async (req, res) => {
  try {
    const { categoria } = req.params;
    const transacoes = await Transacao.find({ categoria }).lean();
    res.json(transacoes);
  } catch (err) {
    console.error('Erro ao filtrar por categoria:', err);
    res.status(500).json({ error: err.message });
  }
});


// Listar Receitas
app.get('/transacoes/tipo/Receita', async (req, res) => {
  try {
    const Receita = await Transacao.find({ tipo: /Receita/i }).lean();
    res.json(Receita);
  } catch (err) {
    console.error('Erro ao listar Receitas:', err);
    res.status(500).json({ error: err.message });
  }
});


// Listar Despesa
app.get('/transacoes/tipo/Despesa', async (req, res) => {
  try {
    const Despesas = await Transacao.find({ tipo: /Despesa/i }).lean();
    res.json(Despesas);
  } catch (err) {
    console.error('Erro ao listar Despesas:', err);
    res.status(500).json({ error: err.message });
  }
});


// Calcular saldo
app.get('/saldo', async (req, res) => {
  try {
    const transacoes = await Transacao.find().lean();
    let saldo = 0;

    transacoes.forEach(t => {
      const tipo = String(t.tipo || '').toLowerCase();
      if (tipo === 'Receita') saldo += t.valor;
      if (tipo === 'Despesa')   saldo -= t.valor;
    });

    res.json({ saldo });
  } catch (err) {
    console.error('Erro ao calcular saldo:', err);
    res.status(500).json({ error: err.message });
  }
});



// INICIAR SERVIDOR
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
