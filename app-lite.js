/* app-lite.js — versão ES5 para iPad 2 / Safari antigo */
/* Mantém as mesmas funcionalidades do script original usando Firebase v8 (namespaced) */
/* Depende de jQuery 1.12.4 (incluir antes no HTML) */

(function () {
  // Constantes
  var APP_PIN = '1803';

  // Elementos
  var loginScreen = document.getElementById('loginScreen');
  var appEl = document.getElementById('app');
  var listPage = document.getElementById('listPage');
  var detailsPage = document.getElementById('detailsPage');
  var detailsTitle = document.getElementById('detailsTitle');
  var addPedidoBtn = document.getElementById('addPedidoBtn');
  var pedidosList = document.getElementById('pedidosList');
  var emptyMsg = document.getElementById('emptyMsg');
  var countInfo = document.getElementById('countInfo');
  var pedidoForm = document.getElementById('pedidoForm');
  var pedidoIdEl = document.getElementById('pedidoId');
  var nomeEl = document.getElementById('nome');
  var numeroEl = document.getElementById('numero');
  var tipoEntregaEl = document.getElementById('tipoEntrega');
  var enderecoLabel = document.getElementById('enderecoLabel');
  var enderecoEl = document.getElementById('endereco');
  var itensEl = document.getElementById('itens');
  var horarioEl = document.getElementById('horario');
  var valorEl = document.getElementById('valor');
  var pagoEl = document.getElementById('pago');
  var backBtn = document.getElementById('backBtn');
  var saveBtn = document.getElementById('saveBtn');
  var printBtn = document.getElementById('printBtn');
  var deleteBtn = document.getElementById('deleteBtn');

  // Filtros e modais
  var filterBtn = document.getElementById('filterBtn');
  var filterModal = document.getElementById('filterModal');
  var filterCloseBtn = document.getElementById('filterCloseBtn');
  var filterControls = document.getElementById('filterControls');
  var filterModalBody = filterModal.querySelector('.modal-body');

  var completedBtn = document.getElementById('completedBtn');
  var completedModal = document.getElementById('completedModal');
  var completedCloseBtn = document.getElementById('completedCloseBtn');
  var completedList = document.getElementById('completedList');

  // Mobile
  var hamburgerMenu = document.getElementById('hamburgerMenu');
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var mobileAddPedidoBtn = document.getElementById('mobileAddPedidoBtn');
  var mobileFilterBtn = document.getElementById('mobileFilterBtn');
  var mobileCompletedBtn = document.getElementById('mobileCompletedBtn');

  // PIN
  var pinInput = document.getElementById('pinInput');
  var numpad = document.getElementById('numpad');

  // Estado
  var selectedDateFilter = null;
  var orderDirection = 'asc';
  var unsubscribe = null;
  var calendarDate = new Date();
  calendarDate.setDate(1);
  var currentPedido = null;
  window.pedidosData = [];

  var pedidosCol = db.collection('pedidos');

  // Navegação de páginas
  function showListPage() { document.body.classList.remove('details-view'); }
  function showDetailsPage(pedido) {
    currentPedido = pedido || null;
    if (pedido) {
      detailsTitle.textContent = 'Editar Pedido';
      pedidoIdEl.value = pedido.id;
      nomeEl.value = pedido.nome || '';
      numeroEl.value = pedido.numero || '';
      tipoEntregaEl.value = pedido.tipo || 'entrega';
      enderecoEl.value = pedido.endereco || '';
      itensEl.value = pedido.itens || '';
      if (pedido.horario && typeof pedido.horario.toDate === 'function') {
        var horarioDate = pedido.horario.toDate();
        var pad = function (n) { return String(n).length === 1 ? '0' + String(n) : String(n); };
        horarioEl.value = horarioDate.getFullYear() + '-' + pad(horarioDate.getMonth()+1) + '-' + pad(horarioDate.getDate()) + 'T' + pad(horarioDate.getHours()) + ':' + pad(horarioDate.getMinutes());
      } else {
        horarioEl.value = '';
      }
      valorEl.value = (pedido.valor != null) ? Number(pedido.valor).toFixed(2) : '';
      pagoEl.checked = !!pedido.pago;
      deleteBtn.classList.remove('hidden');
      printBtn.classList.remove('hidden');
    } else {
      detailsTitle.textContent = 'Novo Pedido';
      try { pedidoForm.reset(); } catch (e) {}
      pedidoIdEl.value = '';
      deleteBtn.classList.add('hidden');
      printBtn.classList.add('hidden');
    }
    // disparar change
    var evt;
    try { evt = document.createEvent('HTMLEvents'); evt.initEvent('change', true, false); tipoEntregaEl.dispatchEvent(evt); } catch (e) {}
    document.body.classList.add('details-view');
  }
  addPedidoBtn.addEventListener('click', function () { showDetailsPage(null); });
  backBtn.addEventListener('click', showListPage);

  // Clique em card
  pedidosList.addEventListener('click', function (e) {
    var target = e.target || e.srcElement;
    var card = target.closest ? target.closest('.pedido-card') : findClosest(target, 'pedido-card');
    if (!card) return;
    var pedidoId = card.getAttribute('data-id');
    var pedido = window.pedidosData.filter(function (p) { return p.id === pedidoId; })[0];
    if (!pedido) return;
    if (matchesSelector(target, '.complete-btn')) {
      if (confirm('Marcar o pedido de "' + (pedido.nome || '') + '" como concluído?')) {
        marcarComoConcluido(pedidoId);
      }
    } else if (closestMatches(target, '.pedido-card-header') || closestMatches(target, '.pedido-card-body')) {
      showDetailsPage(pedido);
    }
  });

  function matchesSelector(el, sel) {
    if (!el) return false;
    if (el.matches) return el.matches(sel);
    if (el.msMatchesSelector) return el.msMatchesSelector(sel);
    return false;
  }
  function closestMatches(el, sel) {
    var c = el;
    while (c && c !== document) {
      if (matchesSelector(c, sel)) return true;
      c = c.parentNode;
    }
    return false;
  }
  function findClosest(el, className) {
    var c = el;
    while (c && c !== document) {
      if (c.className && (' ' + c.className + ' ').indexOf(' ' + className + ' ') !== -1) return c;
      c = c.parentNode;
    }
    return null;
  }

  function marcarComoConcluido(id) {
    var ref = pedidosCol.doc(id);
    ref.update({ status: 'completed' }).catch(function (err) { alert('Erro ao concluir pedido: ' + (err && err.message)); });
  }

  // Modais
  function openModal(modalEl) { modalEl.classList.remove('hidden'); modalEl.setAttribute('aria-hidden', 'false'); }
  function closeModal(modalEl) { modalEl.classList.add('hidden'); modalEl.setAttribute('aria-hidden', 'true'); }

  filterBtn.addEventListener('click', function () {
    filterModalBody.appendChild(filterControls);
    filterControls.classList.remove('hidden');
    openModal(filterModal);
  });
  filterCloseBtn.addEventListener('click', function () { closeModal(filterModal); });
  filterModal.querySelector('.modal-backdrop').addEventListener('click', function () { closeModal(filterModal); });

  completedBtn.addEventListener('click', function () { renderCompletedPedidos(); openModal(completedModal); });
  completedCloseBtn.addEventListener('click', function () { closeModal(completedModal); });
  completedModal.querySelector('.modal-backdrop').addEventListener('click', function () { closeModal(completedModal); });

  // Mobile menu
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', function () { hamburgerMenu.classList.toggle('is-open'); });
  }
  function closeMobileMenu() { hamburgerMenu.classList.remove('is-open'); }
  mobileAddPedidoBtn.addEventListener('click', function () { closeMobileMenu(); showDetailsPage(null); });
  mobileFilterBtn.addEventListener('click', function () { closeMobileMenu(); filterBtn.click(); });
  mobileCompletedBtn.addEventListener('click', function () { closeMobileMenu(); completedBtn.click(); });

  // Autenticação PIN
  if (!sessionStorage.getItem('loggedIn') && !localStorage.getItem('loggedIn')) {
    showLogin();
  } else {
    showApp();
  }

  // Numpad clicks (usando event delegation)
  numpad.addEventListener('click', function (e) {
    var key = e.target && (e.target.closest ? e.target.closest('.numpad-key') : findClosest(e.target, 'numpad-key'));
    if (!key) return;
    var action = key.getAttribute('data-action');
    var currentVal = pinInput.value || '';
    if (action === 'backspace') {
      pinInput.value = currentVal.slice(0, -1);
    } else if (action === 'clear') {
      pinInput.value = '';
    } else if ((currentVal.length || 0) < (pinInput.maxLength || 6)) {
      pinInput.value = currentVal + key.textContent;
    }
  });

  document.getElementById('pinSubmit').addEventListener('click', function () {
    if ((pinInput.value || '').trim() === APP_PIN) {
      var remember = document.getElementById('rememberCheck').checked;
      (remember ? localStorage : sessionStorage).setItem('loggedIn', '1');
      showApp();
    } else {
      document.getElementById('loginMsg').textContent = 'PIN incorreto.';
      pinInput.value = '';
    }
  });

  function showLogin() { loginScreen.classList.remove('hidden'); appEl.classList.add('hidden'); }
  function showApp() { loginScreen.classList.add('hidden'); appEl.classList.remove('hidden'); initRealtimeListener(); }

  // Form
  tipoEntregaEl.addEventListener('change', function () {
    var isEntrega = tipoEntregaEl.value === 'entrega';
    enderecoLabel.style.display = isEntrega ? 'block' : 'none';
    enderecoEl.required = isEntrega;
  });

  pedidoForm.addEventListener('submit', function (e) {
    if (e && e.preventDefault) e.preventDefault();
    var id = pedidoIdEl.value;
    var horarioVal = horarioEl.value;
    var dataHorario = horarioVal ? new Date(horarioVal) : null;
    var data = {
      nome: (nomeEl.value || '').trim(),
      numero: (numeroEl.value || '').trim() || null,
      tipo: tipoEntregaEl.value,
      endereco: tipoEntregaEl.value === 'entrega' ? (enderecoEl.value || '').trim() : null,
      itens: (itensEl.value || '').trim(),
      horario: dataHorario ? firebase.firestore.Timestamp.fromDate(dataHorario) : null,
      valor: parseFloat(valorEl.value),
      pago: !!pagoEl.checked
    };
    if (!data.nome || !data.itens || !horarioVal || isNaN(data.valor)) {
      return alert('Preencha os campos obrigatórios.');
    }

    saveBtn.disabled = true; saveBtn.textContent = 'Salvando...';
    if (id) {
      pedidosCol.doc(id).update(data).then(function () {
        showListPage();
      }).catch(function (err) {
        alert('Erro: ' + (err && err.message));
      }).finally(function () {
        saveBtn.disabled = false; saveBtn.textContent = 'Salvar';
      });
    } else {
      data.criadoEm = firebase.firestore.Timestamp.now();
      data.status = 'active';
      pedidosCol.add(data).then(function () {
        showListPage();
      }).catch(function (err) {
        alert('Erro: ' + (err && err.message));
      }).finally(function () {
        saveBtn.disabled = false; saveBtn.textContent = 'Salvar';
      });
    }
  });

  // Imprimir e deletar
  printBtn.addEventListener('click', function () {
    if (currentPedido) printTicket(currentPedido);
  });
  deleteBtn.addEventListener('click', function () {
    if (!currentPedido || !confirm('Deletar este pedido? A ação não pode ser desfeita.')) return;
    pedidosCol.doc(currentPedido.id).delete().then(function () { showListPage(); }).catch(function (err) { alert('Erro ao deletar: ' + (err && err.message)); });
  });

  // Listener e renderização
  function initRealtimeListener() {
    if (unsubscribe) {
      try { unsubscribe(); } catch (e) {}
      unsubscribe = null;
    }
    var constraints = [];
    // where status == active
    constraints.push(['where', 'status', '==', 'active']);
    // orderBy horario
    constraints.push(['orderBy', 'horario', orderDirection]);

    var qRef = pedidosCol;
    // apply basic where/order constraints the Firebase v8 way with query() is not needed — using collection + where + orderBy chain
    var queryRef = pedidosCol.where('status', '==', 'active').orderBy('horario', orderDirection);

    if (selectedDateFilter) {
      var start = new Date(selectedDateFilter);
      start.setHours(0,0,0,0);
      var end = new Date(start);
      end.setDate(end.getDate() + 1);
      queryRef = pedidosCol.where('status', '==', 'active')
        .where('horario', '>=', firebase.firestore.Timestamp.fromDate(start))
        .where('horario', '<', firebase.firestore.Timestamp.fromDate(end))
        .orderBy('horario', orderDirection);
    }

    unsubscribe = queryRef.onSnapshot(function (snapshot) {
      window.pedidosData = snapshot.docs.map(function (d) {
        var obj = d.data();
        obj.id = d.id;
        return obj;
      });
      renderPedidos(window.pedidosData);
    }, function (error) {
      console.error('Erro no listener de pedidos ativos:', error);
      alert('Não foi possível carregar os pedidos ativos. Verifique o console para mais detalhes.');
    });
  }

  function renderPedidos(items) {
    pedidosList.innerHTML = '';
    emptyMsg.style.display = (items.length ? 'none' : 'block');
    countInfo.textContent = String(items.length) + ' pedido(s)';
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var horarioDate = item.horario && typeof item.horario.toDate === 'function' ? item.horario.toDate() : null;
      var dataStr = horarioDate ? horarioDate.toLocaleDateString('pt-BR') : '-';
      var horarioStr = horarioDate ? horarioDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-';

      var numeroHtml = item.numero ? '<div><strong>Nº Cliente:</strong> ' + escapeHtml(item.numero) + '</div>' : '';
      var valorStr = 'R$ ' + (Number(item.valor || 0).toFixed(2));
      var cardHtml = '<div class="pedido-card" data-id="' + (item.id || '') + '">' +
        '<div class="pedido-card-header">' + escapeHtml(item.nome) + '</div>' +
        '<div class="pedido-card-body">' +
        numeroHtml +
        '<div><strong>Data:</strong> ' + dataStr + '</div>' +
        '<div><strong>Horário:</strong> ' + horarioStr + '</div>' +
        '<div><strong>Valor:</strong> ' + valorStr + '</div>' +
        '</div>' +
        '<div class="pedido-card-footer"><button class="btn success complete-btn">✔ Concluir Pedido</button></div>' +
        '</div>';
      pedidosList.insertAdjacentHTML('beforeend', cardHtml);
    }
  }

  function renderCompletedPedidos() {
    completedList.innerHTML = '<p>Carregando...</p>';
    try {
      var q = pedidosCol.where('status', '==', 'completed').orderBy('horario', 'desc');
      q.get().then(function (snapshot) {
        var items = snapshot.docs.map(function (d) {
          var obj = d.data(); obj.id = d.id; return obj;
        });
        if (!items || items.length === 0) {
          completedList.innerHTML = '<p class="muted" style="text-align:center;">Nenhum pedido concluído encontrado.</p>';
          return;
        }

        var groupedByDate = {};
        for (var i = 0; i < items.length; i++) {
          var it = items[i];
          var ds = it.horario && typeof it.horario.toDate === 'function' ? it.horario.toDate().toLocaleDateString('pt-BR') : '-';
          if (!groupedByDate[ds]) groupedByDate[ds] = [];
          groupedByDate[ds].push(it);
        }
        for (var d in groupedByDate) {
          groupedByDate[d].sort(function (a,b) { return a.horario.toMillis() - b.horario.toMillis(); });
        }
        var html = '';
        for (var dateStr in groupedByDate) {
          html += '<div class="date-group">';
          html += '<h4 class="date-header">' + dateStr + '</h4>';
          var arr = groupedByDate[dateStr];
          for (var j = 0; j < arr.length; j++) {
            var it2 = arr[j];
            var horarioStr2 = it2.horario && typeof it2.horario.toDate === 'function' ? it2.horario.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-';
            html += '<div class="completed-item"><span><strong>' + horarioStr2 + '</strong> - ' + escapeHtml(it2.nome) + '</span><span>R$ ' + (Number(it2.valor || 0).toFixed(2)) + '</span></div>';
          }
          html += '</div>';
        }
        completedList.innerHTML = html;
      }).catch(function (err) {
        console.error('Erro ao buscar pedidos concluídos:', err);
        completedList.innerHTML = '<p class="muted" style="text-align:center; color: #c82121;"><b>Erro ao carregar pedidos.</b><br>Verifique se o índice do Firestore foi criado corretamente e tente novamente.</p>';
      });
    } catch (err) {
      console.error(err);
      completedList.innerHTML = '<p class="muted" style="text-align:center; color: #c82121;"><b>Erro ao carregar pedidos.</b></p>';
    }
  }

  // Calendário e filtros
  function renderCalendar() {
    var calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    calendarEl.innerHTML = '';
    var year = calendarDate.getFullYear();
    var month = calendarDate.getMonth();
    document.getElementById('monthYear').textContent = calendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    var startWeekday = new Date(year, month, 1).getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    for (var i = 0; i < startWeekday; i++) calendarEl.insertAdjacentHTML('beforeend', '<div class="day"></div>');
    for (var d = 1; d <= daysInMonth; d++) {
      (function (dd) {
        var cell = document.createElement('div');
        var thisDate = new Date(year, month, dd);
        cell.className = 'day';
        cell.textContent = dd;
        if (thisDate.toDateString() === new Date().toDateString()) cell.classList.add('today');
        if (selectedDateFilter && thisDate.toDateString() === selectedDateFilter.toDateString()) cell.classList.add('selected');
        cell.addEventListener('click', function () {
          selectedDateFilter = thisDate;
          initRealtimeListener();
          renderCalendar();
          closeModal(filterModal);
        });
        calendarEl.appendChild(cell);
      })(d);
    }
  }
  document.getElementById('prevMonth').addEventListener('click', function () { calendarDate.setMonth(calendarDate.getMonth() - 1); renderCalendar(); });
  document.getElementById('nextMonth').addEventListener('click', function () { calendarDate.setMonth(calendarDate.getMonth() + 1); renderCalendar(); });
  document.getElementById('clearFilter').addEventListener('click', function () { selectedDateFilter = null; initRealtimeListener(); renderCalendar(); closeModal(filterModal); });
  var orderRadios = document.querySelectorAll('input[name="order"]');
  for (var ri = 0; ri < orderRadios.length; ri++) {
    orderRadios[ri].addEventListener('change', function (e) { orderDirection = e.target.value; initRealtimeListener(); });
  }

  document.getElementById('deleteDayBtn').addEventListener('click', function () {
    var day = selectedDateFilter || new Date();
    if (!confirm('Deletar TODOS os pedidos (ativos e concluídos) do dia ' + day.toLocaleDateString('pt-BR') + '?')) return;
    var start = new Date(day); start.setHours(0,0,0,0);
    var end = new Date(start); end.setDate(end.getDate() + 1);
    var q = pedidosCol.where('horario', '>=', firebase.firestore.Timestamp.fromDate(start)).where('horario', '<', firebase.firestore.Timestamp.fromDate(end));
    q.get().then(function (snaps) {
      if (snaps.empty) return alert('Nenhum pedido encontrado para este dia.');
      var writes = [];
      snaps.forEach(function (s) {
        writes.push(pedidosCol.doc(s.id).delete());
      });
      Promise.all(writes).then(function () {
        alert(String(snaps.size) + ' pedido(s) do dia foram removidos.');
      }).catch(function (err) {
        alert('Erro ao remover pedidos: ' + (err && err.message));
      });
    }).catch(function (err) {
      alert('Erro ao buscar pedidos do dia: ' + (err && err.message));
    });
  });

  // Utilitários
  function escapeHtml(text) {
    text = String(text === undefined || text === null ? '' : text);
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function printTicket(item) {
    var horarioDate = item.horario && typeof item.horario.toDate === 'function' ? item.horario.toDate() : null;
    var horarioStr = horarioDate ? horarioDate.toLocaleString('pt-BR') : '-';
    var itens = escapeHtml(item.itens || '').replace(/\n/g, '<br>');
    var valorStr = 'R$ ' + (Number(item.valor || 0).toFixed(2));
    var win = window.open('', '_blank');
    if (!win) { alert('O navegador bloqueou a abertura da janela de impressão. Permita pop-ups e tente novamente.'); return; }
    var html = '';
    html += '<!doctype html><html><head><meta charset="utf-8"/><title>Pedido</title><style>';
    html += '@page { size: 80mm auto; margin: 3mm; } body { margin:0; font-family: "Arial", sans-serif; font-size: 13px; font-weight: bold; color:#000; background:white; } .ticket { width: 100%; max-width: 80mm; margin: 0 auto; padding: 10px; box-sizing: border-box; } header { text-align:center; margin-bottom:12px; } .brand-title { font-size:1.3em; } .meta { font-size:1em; margin-bottom:12px; } .items { font-size:1.05em; margin-bottom:14px; } .items .desc { margin-bottom:4px; word-break:break-word; } .total { font-size:1.2em; border-top:1px dashed #000; padding-top:8px; margin-top:8px; display:flex; justify-content:space-between; } .quote { margin-top:16px; font-style:italic; font-size:0.85em; text-align:center; font-weight: normal; }';
    html += '</style></head><body><div class="ticket">';
    html += '<header><div class="brand-title">PEDIDO - DuCheffton</div></header>';
    html += '<div class="meta"><div><strong>Nome:</strong> ' + escapeHtml(item.nome) + '</div>';
    html += '<div><strong>Cliente:</strong> ' + (item.numero ? escapeHtml(item.numero) : '-') + '</div>';
    html += '<div><strong>Tipo:</strong> ' + escapeHtml(item.tipo || '-') + '</div>';
    if (item.endereco) html += '<div><strong>Endereço:</strong> ' + escapeHtml(item.endereco) + '</div>';
    html += '<div><strong>Horário:</strong> ' + escapeHtml(horarioStr) + '</div></div>';
    html += '<div class="items"><div><strong>Itens:</strong></div><div class="desc">' + itens + '</div></div>';
    html += '<div class="total"><div>Total:</div><div>' + escapeHtml(valorStr) + '</div></div>';
    html += '<div class="quote">"Se Deus é por nós, quem será contra nós?" Rm. 8:31</div>';
    html += '</div><script>window.onload = function(){ setTimeout(function(){ window.print(); }, 300); }<\/script></body></html>';
    win.document.write(html);
    win.document.close();
  }

  // Inicialização
  renderCalendar();
  console.log('Gerenciador de Pedidos (Lite): Carregado com sucesso!');

  // Start listener when app shown (showApp chama initRealtimeListener)
  function initRealtimeListener() {
    if (unsubscribe) {
      try { unsubscribe(); } catch (e) {}
      unsubscribe = null;
    }
    var queryRef = pedidosCol.where('status', '==', 'active').orderBy('horario', orderDirection);
    if (selectedDateFilter) {
      var start = new Date(selectedDateFilter); start.setHours(0,0,0,0);
      var end = new Date(start); end.setDate(end.getDate() + 1);
      queryRef = pedidosCol.where('status', '==', 'active')
        .where('horario', '>=', firebase.firestore.Timestamp.fromDate(start))
        .where('horario', '<', firebase.firestore.Timestamp.fromDate(end))
        .orderBy('horario', orderDirection);
    }
    unsubscribe = queryRef.onSnapshot(function (snapshot) {
      var arr = [];
      snapshot.forEach(function (d) {
        var obj = d.data();
        obj.id = d.id;
        arr.push(obj);
      });
      window.pedidosData = arr;
      renderPedidos(arr);
    }, function (error) {
      console.error('Erro no listener de pedidos ativos:', error);
      alert('Não foi possível carregar os pedidos ativos. Verifique o console para mais detalhes.');
    });
  }

  // expose renderCompletedPedidos to use from button
  window.renderCompletedPedidos = renderCompletedPedidos;
})();
