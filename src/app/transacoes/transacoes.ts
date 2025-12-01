import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Transacao, TransacoesService } from '../transacoes-service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-transacoes',
  imports: [FormsModule, CommonModule],
  templateUrl: './transacoes.html',
  styleUrls: ['./transacoes.css'],
})
export class Transacoes implements OnInit {
  private api = inject(TransacoesService);
  private cdr = inject(ChangeDetectorRef);

  transacoes: Transacao[] = [];
  transacoesFiltradas: Transacao[] = [];   // NOVO
  carregando = false;
  salvando = false;
  erro = '';

  // Filtros (NOVO)
  filtroCategoria: string = '';
  filtroTipo: string = '';

  // Saldo (NOVO)
  saldo: number = 0;

  // Bindings do Form
  tipo = '';
  nome = '';
  valor: number = 0;
  categoria = '';
  data = '';

  editandoId: string | null = null;

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.carregando = true;
    this.erro = '';

    this.api
      .listar()
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: xs => {
          this.transacoes = xs;
          this.aplicarFiltros();   
          this.calcularSaldo();   
        },
        error: e => {
          this.erro = e.message ?? 'Falha ao carregar transações';
        }
      });
  }


  aplicarFiltros() {
    this.transacoes = this.transacoes.filter(t => {
      const catOK = this.filtroCategoria
        ? t.categoria.toLowerCase().includes(this.filtroCategoria.toLowerCase())
        : true;

      const tipoOK = this.filtroTipo ? t.tipo === this.filtroTipo : true;

      return catOK && tipoOK;
    });
  }


  calcularSaldo() {
    this.saldo = this.transacoes.reduce((acc, t) => {
      return t.tipo === 'Receita'
        ? acc + t.valor
        : acc - t.valor;
    }, 0);
  }


  categoriaClasse(cat: string): string {
    const mapa: any = {
      Alimentação: 'bg-warning-subtle text-warning-emphasis',
      Transporte: 'bg-info-subtle text-info-emphasis',
      Lazer: 'bg-success-subtle text-success-emphasis',
      Trabalho: 'bg-primary-subtle text-primary-emphasis'
    };

    return mapa[cat] ?? 'bg-secondary-subtle text-secondary-emphasis';
  }

  salvar() {
    if (!this.tipo || !this.nome || !this.categoria || !this.data) {
      this.erro = 'Preencha todos os campos obrigatórios.';
      return;
    }

    const transacao: Transacao = {
      tipo: this.tipo,
      nome: this.nome,
      valor: this.valor,
      categoria: this.categoria,
      data: this.data
    };

    this.salvando = true;
    this.erro = '';

    const request$ = this.editandoId
      ? this.api.atualizar(this.editandoId, transacao)
      : this.api.criar(transacao);

    request$
      .pipe(
        finalize(() => {
          this.salvando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: _ => {
          this.resetarFormulario();
          this.carregar(); // Recarrega lista e aplica filtros automaticamente
        },
        error: e => {
          this.erro = e.message ?? (this.editandoId ? 'Falha ao atualizar' : 'Falha ao criar');
        }
      });
  }

  iniciarEdicao(t: Transacao) {
    this.editandoId = t._id ?? null;

    this.tipo = t.tipo;
    this.nome = t.nome;
    this.valor = t.valor;
    this.categoria = t.categoria;
    this.data = t.data;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicao() {
    this.resetarFormulario();
  }

  excluir(id?: string) {
    if (!id) return;
    this.erro = '';
    this.carregando = true;

    this.api
      .excluir(id)
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: _ => this.carregar(),
        error: e => (this.erro = e.message ?? 'Falha ao excluir transação')
      });
  }

  private resetarFormulario() {
    this.tipo = '';
    this.nome = '';
    this.categoria = '';
    this.data = '';
    this.valor = 0;
    this.editandoId = null;
  }
}
