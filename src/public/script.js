let isMaster = false;
let nivelAtual = 'graduacao';
let unidadeSelecionada = 'base';
let diaEdicaoAtual = null;
let mesEdicaoAtual = null;
let solicitacoes = [];
let modoSolicitacao = false;

let sessoesUsuarios = {};

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIAS_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const CORES = [
  'bg-normal',
  'bg-verde-fraco', 'bg-verde-forte',
  'bg-azul-fraco', 'bg-azul-forte',
  'bg-vermelho-fraco', 'bg-vermelho-forte',
  'bg-amarelo-fraco', 'bg-amarelo-forte'
];

let unidades = {
  graduacao: [
    { id: 'base', nome: 'Calendário Base (Geral)', modificado: false, autorModificacao: '' },
    { id: 'fac-1', nome: 'Faculdade de Tecnologia', modificado: true, autorModificacao: 'Carlos Administrador' }
  ],
  basica: [
    { id: 'base', nome: 'Calendário Base (Geral)', modificado: false, autorModificacao: '' },
    { id: 'esc-1', nome: 'Colégio Aplicação', modificado: false, autorModificacao: '' }
  ]
};

let dadosCalendario = {};

function init() {
  montarPaleta();
  renderSubTabs();
  renderCalendario();
}

function montarPaleta() {
  const paleta = document.getElementById('paleta-cores');
  paleta.innerHTML = '';
  CORES.forEach(cor => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `cor-opcao ${cor}`;
    b.dataset.cor = cor;
    b.setAttribute('aria-label', 'Escolher cor');
    b.onclick = () => escolherCor(cor);
    paleta.appendChild(b);
  });
}

function escolherCor(cor) {
  document.getElementById('select-cor').value = cor;
  document.querySelectorAll('.cor-opcao').forEach(b => {
    b.classList.toggle('selecionada', b.dataset.cor === cor);
  });
}

function togglePerfil() {
  if (!isMaster) {
    const senha = prompt("Digite a senha do Perfil Master (Simulação: admin):");
    if (senha === "admin") {
      isMaster = true;
      document.getElementById('perfil-status').innerHTML = "Perfil Atual: <strong style='color:#16a34a;'>MASTER (Administração Central)</strong>";
      document.getElementById('btn-login-master').innerText = "Sair do Master";
      document.getElementById('btn-nova-unidade').style.display = "inline-block";
    } else { alert("Senha incorreta!"); }
  } else {
    isMaster = false;
    document.getElementById('perfil-status').innerHTML = "Perfil Atual: <strong>Unidade Acadêmica (Visualização/Solicitação)</strong>";
    document.getElementById('btn-login-master').innerText = "Entrar como Master";
    document.getElementById('btn-nova-unidade').style.display = "none";
  }
  renderSubTabs();
  renderCalendario();
}

function mudarNivel(nivel) {
  nivelAtual = nivel;
  unidadeSelecionada = 'base';
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', (nivel === 'graduacao' && i === 0) || (nivel === 'basica' && i === 1));
  });
  renderSubTabs();
  renderCalendario();
}

function renderSubTabs() {
  const container = document.getElementById('container-unidades');
  container.innerHTML = '';
  
  unidades[nivelAtual].forEach(u => {
    const btn = document.createElement('div');
    btn.className = `sub-tab ${unidadeSelecionada === u.id ? 'active' : ''}`;
    
    let htmlNome = `<strong>${u.nome}</strong>`;
    if (isMaster && u.id !== 'base' && u.modificado) {
      htmlNome += ` <span style="background-color: #fef08a; color: #854d0e; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; border: 1px solid #facc15;">(Modificado)</span>`;
      if (u.autorModificacao) {
        htmlNome += `<span style="font-size: 11px; color: #475569; font-style: italic;">Por: ${u.autorModificacao}</span>`;
      }
    }
    btn.innerHTML = htmlNome;

    btn.onclick = () => {
      unidadeSelecionada = u.id;
      renderSubTabs();
      renderCalendario();
    };
    container.appendChild(btn);
  });

  atualizarBotaoSolicitacoes();
}

function atualizarBotaoSolicitacoes() {
  const btnSol = document.getElementById('btn-solicitacoes');
  if (!isMaster) {
    btnSol.style.display = 'none';
    return;
  }

  const solDaUnidade = solicitacoes.filter(s => s.unidadeId === unidadeSelecionada);
  if (solDaUnidade.length > 0) {
    btnSol.style.display = 'inline-block';
    btnSol.innerText = `Solicitações (${solDaUnidade.length})`;
  } else {
    btnSol.style.display = 'none';
  }
}

function pegarDia(ano, mes, dia) {
  const chave = `${nivelAtual}_${unidadeSelecionada}_${ano}_${mes}`;
  const salvo = dadosCalendario[chave] && dadosCalendario[chave][dia];
  if (salvo) return salvo;
  
  if (unidadeSelecionada !== 'base') {
    const chaveBase = `${nivelAtual}_base_${ano}_${mes}`;
    const salvoBase = dadosCalendario[chaveBase] && dadosCalendario[chaveBase][dia];
    if (salvoBase) return { ...salvoBase, autor: '' };
  }

  const ds = new Date(ano, mes, dia).getDay();
  return { letivo: ds !== 0 && ds !== 6, cor: 'bg-normal', desc: '', autor: '' };
}

function renderCalendario() {
  renderAno();
  atualizarBotaoSolicitacoes();
}

function renderAno() {
  const ano = parseInt(document.getElementById('select-ano').value);
  const area = document.getElementById('grid-ano');
  area.innerHTML = '';
  const nomesSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  for (let mes = 0; mes < 12; mes++) {
    const linha = document.createElement('div');
    linha.className = 'mes-linha';
    const cal = document.createElement('div');
    cal.className = 'mes-cal';

    const titulo = document.createElement('h3');
    titulo.className = 'mes-titulo';
    titulo.innerText = `${MESES[mes]} - ${ano}`;
    cal.appendChild(titulo);

    const g = document.createElement('div');
    g.className = 'mes-grid';
    nomesSemana.forEach(n => {
      const h = document.createElement('div');
      h.className = 'mini-header';
      h.innerText = n;
      g.appendChild(h);
    });

    const offset = (new Date(ano, mes, 1).getDay() + 6) % 7;
    const total = new Date(ano, mes + 1, 0).getDate();
    for (let v = 0; v < offset; v++) {
      const e = document.createElement('div');
      e.className = 'mini-dia fora-claro';
      g.appendChild(e);
    }

    const eventos = [];
    for (let i = 1; i <= total; i++) {
      const d = pegarDia(ano, mes, i);
      const fds = (offset + i - 1) % 7 >= 5;
      const c = document.createElement('div');
      c.className = `mini-dia ${d.cor}${fds ? ' fds' : ''}`;
      c.title = d.desc || '';
      c.onclick = () => verificarAcessoEdicao(i, mes, ano);
      
      let numHtml = `<span class="${d.letivo ? 'num-letivo' : 'num-nao-letivo'}">${i < 10 ? '0' + i : i}</span>`;
      if (d.travado) numHtml += '<span class="cad">🔒</span>';
      c.innerHTML = numHtml;
      g.appendChild(c);

      if (d.desc) eventos.push({ i, d });
    }

    const resto = (7 - ((offset + total) % 7)) % 7;
    for (let r = 0; r < resto; r++) {
      const e = document.createElement('div');
      e.className = 'mini-dia fora';
      g.appendChild(e);
    }
    cal.appendChild(g);
    linha.appendChild(cal);

    const leg = document.createElement('div');
    leg.className = 'legenda';
    if (eventos.length === 0) {
      leg.innerHTML = '<span class="leg-vazio">Nenhum evento neste mês.</span>';
    } else {
      eventos.forEach(ev => {
        const it = document.createElement('div');
        it.className = 'leg-item';
        it.innerHTML = `<div class="leg-cor ${ev.d.cor}"><span class="${ev.d.letivo ? 'num-letivo' : 'num-nao-letivo'}">${ev.i}</span></div>` +
          `<span>${ev.d.travado ? '🔒 ' : ''}${ev.d.desc}</span>`;
        leg.appendChild(it);
      });
    }
    linha.appendChild(leg);
    area.appendChild(linha);
  }
}

function verificarAcessoEdicao(dia, mes, ano) {
  if (unidadeSelecionada === 'base' && !isMaster) {
    alert("O Calendário Base é gerenciado exclusivamente pelo Master. Visualização permitida.");
    return;
  }

  const sessaoKey = `${nivelAtual}_${unidadeSelecionada}`;
  if (!isMaster && unidadeSelecionada !== 'base' && !sessoesUsuarios[sessaoKey]) {
    window.pendenteEdicao = { dia, mes, ano };
    document.getElementById('modal-identificacao').style.display = 'flex';
    return;
  }

  abrirEdicaoDia(dia, mes, ano);
}

function fecharModalIdentificacao() {
  document.getElementById('modal-identificacao').style.display = 'none';
}

function salvarIdentificacao() {
  const nome = document.getElementById('id-nome').value.trim();
  const email = document.getElementById('id-email').value.trim();
  if (!nome || !email) {
    alert("Por favor, preencha seu nome e e-mail.");
    return;
  }
  const sessaoKey = `${nivelAtual}_${unidadeSelecionada}`;
  sessoesUsuarios[sessaoKey] = { nome, email };
  fecharModalIdentificacao();
  
  if (window.pendenteEdicao) {
    abrirEdicaoDia(window.pendenteEdicao.dia, window.pendenteEdicao.mes, window.pendenteEdicao.ano);
  }
}

function abrirEdicaoDia(dia, mes, ano) {
  diaEdicaoAtual = dia;
  mesEdicaoAtual = mes;
  const data = pegarDia(ano, mes, dia);
  modoSolicitacao = !!data.travado && !isMaster;

  document.getElementById('modal-titulo').innerText = modoSolicitacao
    ? `🔒 Dia ${dia} de ${MESES[mes]} está travado`
    : `Editar Dia ${dia} de ${MESES[mes]}`;

  const container = document.getElementById('container-eventos-inputs');
  container.innerHTML = '';
  
  if (data.desc) {
    const listaEventos = data.desc.split(' / ');
    listaEventos.forEach(ev => adicionarCampoEvento(ev));
  } else {
    adicionarCampoEvento('');
  }

  escolherCor(data.cor || 'bg-normal');
  document.getElementById('select-letivo').value = data.letivo ? "true" : "false";
  document.getElementById('chk-travar').checked = !!data.travado;
  document.getElementById('input-motivo').value = '';

  const eMaster = isMaster;
  document.getElementById('grupo-cor').style.display = (eMaster || unidadeSelecionada !== 'base') ? 'block' : 'none';
  document.getElementById('grupo-letivo').style.display = (eMaster || unidadeSelecionada !== 'base') ? 'block' : 'none';
  document.getElementById('grupo-motivo').style.display = modoSolicitacao ? 'block' : 'none';
  document.getElementById('grupo-travar').style.display = eMaster ? 'block' : 'none';
  document.getElementById('btn-salvar-dia').style.display = (!eMaster && unidadeSelecionada === 'base') ? 'none' : 'inline-block';
  
  document.getElementById('btn-salvar-dia').innerText = modoSolicitacao ? 'Enviar solicitação' : 'Salvar';
  
  const sessaoKey = `${nivelAtual}_${unidadeSelecionada}`;
  const usuarioLogado = sessoesUsuarios[sessaoKey] ? sessoesUsuarios[sessaoKey].nome : (isMaster ? 'Master' : '');
  document.getElementById('info-autor-sessao').innerText = usuarioLogado ? `Editando como: ${usuarioLogado}` : '';
  
  document.getElementById('modal-dia').style.display = 'flex';
}

function adicionarCampoEvento(valor) {
  const container = document.getElementById('container-eventos-inputs');
  const div = document.createElement('div');
  div.className = 'evento-input-group';
  div.innerHTML = `
    <input type="text" class="input-evento-item" value="${valor}" placeholder="Ex: Início de Inscrições / VA1 Matemática" style="flex:1;">
    <button type="button" class="btn btn-danger" style="padding: 8px 10px;" onclick="this.parentElement.remove()">X</button>
  `;
  container.appendChild(div);
}

function fecharModalDia() { document.getElementById('modal-dia').style.display = 'none'; }

function salvarDia() {
  if (modoSolicitacao) { enviarSolicitacao(); return; }
  
  const inputs = document.querySelectorAll('.input-evento-item');
  let descArray = [];
  inputs.forEach(inp => {
    if (inp.value.trim()) descArray.push(inp.value.trim());
  });
  const desc = descArray.join(' / ');

  const cor = document.getElementById('select-cor').value;
  const letivo = document.getElementById('select-letivo').value === "true";
  
  const sessaoKey = `${nivelAtual}_${unidadeSelecionada}`;
  const autor = isMaster ? "Master" : (sessoesUsuarios[sessaoKey] ? sessoesUsuarios[sessaoKey].nome : "Unidade");
  const travado = isMaster ? document.getElementById('chk-travar').checked : false;

  const ano = parseInt(document.getElementById('select-ano').value);
  const chave = `${nivelAtual}_${unidadeSelecionada}_${ano}_${mesEdicaoAtual}`;
  if (!dadosCalendario[chave]) dadosCalendario[chave] = {};
  dadosCalendario[chave][diaEdicaoAtual] = { desc, cor, letivo, autor, travado };

  if (unidadeSelecionada !== 'base') {
    const u = unidades[nivelAtual].find(x => x.id === unidadeSelecionada);
    if (u) {
      u.modificado = true;
      u.autorModificacao = autor;
    }
  }

  fecharModalDia();
  renderSubTabs();
  renderCalendario();
}

function enviarSolicitacao() {
  const inputs = document.querySelectorAll('.input-evento-item');
  let descArray = [];
  inputs.forEach(inp => { if (inp.value.trim()) descArray.push(inp.value.trim()); });
  const desc = descArray.join(' / ');

  const motivo = document.getElementById('input-motivo').value.trim();
  if (!motivo) {
    alert("Por favor, preencha o Motivo / Solicitação.");
    return;
  }

  const sessaoKey = `${nivelAtual}_${unidadeSelecionada}`;
  const dadosSessao = sessoesUsuarios[sessaoKey];

  const ano = parseInt(document.getElementById('select-ano').value);
  const un = unidades[nivelAtual].find(u => u.id === unidadeSelecionada);
  
  solicitacoes.push({
    id: Date.now(),
    chave: `${nivelAtual}_${unidadeSelecionada}_${ano}_${mesEdicaoAtual}`,
    dia: diaEdicaoAtual, mes: mesEdicaoAtual, ano,
    unidadeId: unidadeSelecionada,
    calendario: `${un.nome} (${nivelAtual === 'graduacao' ? 'Graduação' : 'Ed. Básica'})`,
    desc: desc,
    cor: document.getElementById('select-cor').value,
    letivo: document.getElementById('select-letivo').value === "true",
    motivo: motivo,
    nome: dadosSessao ? dadosSessao.nome : 'Usuário',
    email: dadosSessao ? dadosSessao.email : 'email@escola.br'
  });
  
  fecharModalDia();
  atualizarBotaoSolicitacoes();
  alert('Solicitação enviada ao Master com sucesso.');
}

function abrirSolicitacoes() {
  const lista = document.getElementById('lista-solicitacoes');
  lista.innerHTML = '';
  
  const solDaUnidade = solicitacoes.filter(s => s.unidadeId === unidadeSelecionada);
  if (solDaUnidade.length === 0) {
    lista.innerHTML = '<p class="leg-vazio">Nenhuma solicitação para esta unidade.</p>';
    document.getElementById('modal-solicitacoes').style.display = 'flex';
    return;
  }

  solDaUnidade.forEach(s => {
    const div = document.createElement('div');
    div.className = 'sol-item';
    div.innerHTML = `<p><strong>Dia ${s.dia} de ${MESES[s.mes]} de ${s.ano}</strong> — ${s.calendario}</p>` +
      `<p>Solicitado por: <strong>${s.nome}</strong> (${s.email})</p>` +
      `<p><strong>Motivo / Solicitação:</strong> ${s.motivo}</p>` +
      `<p>Proposta de alteração: <span class="sol-cor ${s.cor}"></span> "${s.desc || 'sem descrição'}" — ${s.letivo ? 'Dia letivo' : 'Dia não letivo'}</p>` +
      `<div style="display:flex; gap:8px; margin-top:8px;">` +
      `<button class="btn btn-success" onclick="decidirSolicitacao(${s.id}, true)">Aprovar</button>` +
      `<button class="btn btn-danger" onclick="decidirSolicitacao(${s.id}, false)">Recusar</button></div>`;
    lista.appendChild(div);
  });
  document.getElementById('modal-solicitacoes').style.display = 'flex';
}

function decidirSolicitacao(id, aprovar) {
  const s = solicitacoes.find(x => x.id === id);
  if (!s) return;
  if (aprovar) {
    if (!dadosCalendario[s.chave]) dadosCalendario[s.chave] = {};
    dadosCalendario[s.chave][s.dia] = {
      desc: s.desc, cor: s.cor, letivo: s.letivo,
      autor: `${s.nome} (aprovado Master)`, travado: true
    };
    const u = unidades[nivelAtual].find(x => x.id === s.unidadeId);
    if (u) {
      u.modificado = true;
      u.autorModificacao = s.nome;
    }
  }
  solicitacoes = solicitacoes.filter(x => x.id !== id);
  
  const solRestantesDaUnidade = solicitacoes.filter(x => x.unidadeId === unidadeSelecionada);
  if (solRestantesDaUnidade.length === 0) {
    document.getElementById('modal-solicitacoes').style.display = 'none';
  } else {
    abrirSolicitacoes();
  }
  
  renderSubTabs();
  renderCalendario();
}

function abrirModalUnidade() { document.getElementById('modal-unidade').style.display = 'flex'; }
function fecharModalUnidade() { document.getElementById('modal-unidade').style.display = 'none'; }

function cadastrarUnidade() {
  const nome = document.getElementById('nova-unidade-nome').value.trim();
  const clonar = document.getElementById('chk-clonar-base').checked;
  if (nome) {
    const novoId = 'u-' + Date.now();
    unidades[nivelAtual].push({ id: novoId, nome, modificado: false, autorModificacao: '' });

    if (clonar) {
      const ano = parseInt(document.getElementById('select-ano').value);
      for (let m = 0; m < 12; m++) {
        const chaveBase = `${nivelAtual}_base_${ano}_${m}`;
        if (dadosCalendario[chaveBase]) {
          const chaveNova = `${nivelAtual}_${novoId}_${ano}_${m}`;
          dadosCalendario[chaveNova] = JSON.parse(JSON.stringify(dadosCalendario[chaveBase]));
        }
      }
    }

    fecharModalUnidade();
    document.getElementById('nova-unidade-nome').value = '';
    renderSubTabs();
    renderCalendario();
  } else {
    alert("Informe o nome da unidade.");
  }
}

init();