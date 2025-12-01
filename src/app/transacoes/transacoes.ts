import { Component, OnInit, inject } from '@angular/core';
import { Transacao, TransacoesService } from '../transacoes-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-transacoes',
  imports: [FormsModule, CommonModule],
  templateUrl: './transacoes.html',
  styleUrls: ['./transacoes.css'],
})
export class Transacoes implements OnInit {
  private api = inject(TransacoesService);
  transacoes: Transacao[] = [];
  carregando = false;   
  salvando = false;
  erro = '';

  // Bindings do Form
  tipo = '';
  nome = '';
  valor: number = 0; 
  categoria = '';
  data = '';

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.carregando = true;
    this.api.listar().subscribe({
      next: xs => {
        this.transacoes = xs;
        this.carregando = false;
      },
      error: e => {
        this.erro = e.message ?? 'Falha ao Carregar';
        this.carregando = false;
      }
    });
  }

  criar() {
    if (!this.tipo || !this.nome || !this.categoria || !this.data) return;

    const transacao: Transacao = {
      tipo: this.tipo,
      nome: this.nome,
      valor: this.valor,
      categoria: this.categoria,
      data: this.data
    };

    this.salvando = true;
    this.api.criar(transacao).subscribe({
      next: _ => {
        this.tipo = '';
        this.nome = '';
        this.categoria = '';
        this.data = '';
        this.valor = 0;
        this.salvando = false;
        this.carregar();
      },
      error: e => {
        this.erro = e.message ?? 'Falha ao criar';
        this.salvando = false;
      }
    });
  }

  excluir(id?: string) {
    if (!id) return;
    this.api.excluir(id).subscribe({
      next: _ => this.carregar(),
      error: e => this.erro = e.message ?? 'Falha ao Excluir'
    });
  }
}
