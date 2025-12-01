import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();

// Middleware
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Conexão MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado ao MongoDB'))
    .catch(err => console.error('Erro na conexão:', err.message));


// ---------------------
// SCHEMA & MODEL
// ---------------------
const TransacaoSchema = new mongoose.Schema({
    tipo: { type: String, required: true, trim: true, minlength: 3 },
    nome: { type: String, required: true, trim: true, minlength: 2 },
    valor: { type: Number, required: true, min: 0 },
    categoria: { type: String, required: true, trim: true },
    data: { type: String, required: true }
}, { 
    collection: 'Transacoes',
    timestamps: false // <<< impede createdAt e updatedAt
});

const Transacao = mongoose.models.Transacao || mongoose.model('Transacao', TransacaoSchema);



// ---------------------
// ROTAS
// ---------------------

// Rota inicial
app.get('/', (req, res) => res.json({ msg: 'API Rodando' }));


// Criar transação
app.post('/transacoes', async (req, res) => {
    try {
        const transacao = await Transacao.create(req.body);
        res.status(201).json(transacao);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// Listar todas
app.get('/transacoes', async (req, res) => {
    const transacoes = await Transacao.find();
    res.json(transacoes);
});


// Buscar por ID
app.get('/transacoes/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id))
            return res.status(400).json({ error: 'ID inválido' });

        const transacao = await Transacao.findById(req.params.id);
        if (!transacao) return res.status(404).json({ error: 'Transação não encontrada' });

        res.json(transacao);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Atualizar (PUT) — sem overwrite
app.put('/transacoes/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id))
            return res.status(400).json({ error: 'ID inválido' });

        const transacao = await Transacao.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true } // <<< NÃO apaga campos antigos
        );

        if (!transacao) return res.status(404).json({ error: 'Transação não encontrada' });

        res.json(transacao);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});


// Deletar
app.delete('/transacoes/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id))
            return res.status(400).json({ error: 'ID inválido' });

        const transacao = await Transacao.findByIdAndDelete(req.params.id);
        if (!transacao) return res.status(404).json({ error: 'Transação não encontrada' });

        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Filtrar por categoria
app.get('/transacoes/categoria/:categoria', async (req, res) => {
    try {
        const transacoes = await Transacao.find({ categoria: req.params.categoria });
        res.json(transacoes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Listar entradas
app.get('/transacoes/tipo/entrada', async (req, res) => {
    const entradas = await Transacao.find({ tipo: /entrada/i });
    res.json(entradas);
});

// Listar saídas
app.get('/transacoes/tipo/saida', async (req, res) => {
    const saidas = await Transacao.find({ tipo: /saida/i });
    res.json(saidas);
});


// Calcular saldo
app.get('/saldo', async (req, res) => {
    try {
        const transacoes = await Transacao.find();
        let saldo = 0;

        transacoes.forEach(t => {
            if (t.tipo.toLowerCase() === 'entrada') saldo += t.valor;
            if (t.tipo.toLowerCase() === 'saida') saldo -= t.valor;
        });

        res.json({ saldo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ---------------------
// INICIAR SERVIDOR
// ---------------------
app.listen(process.env.PORT, () =>
    console.log(`Servidor rodando em http://localhost:${process.env.PORT}`)
);
