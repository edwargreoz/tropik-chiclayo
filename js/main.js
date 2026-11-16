/* Tropik Chiclayo — pedido por WhatsApp (solo Chiclayo) + parallax del hero */
(() => {
  'use strict';
  const WA = '51968967241';
  const ML_PER_OZ = 29.5735;
  const MIN_DELIVERY_L = 3;

  const FLAVORS = {
    fresa: 'Fresa', uva: 'Uva', pina: 'Piña golden', maracuya: 'Maracuyá',
    tamarindo: 'Tamarindo', chicha: 'Chicha morada'
  };
  const SIZES = { 8: 6, 16: 10, 32: 18 };           // onzas -> S/
  const CHUPETES = [                                 // [id, nombre, precio]
    ['c-fresa', 'Fresa', 2], ['c-coco', 'Coco', 2], ['c-mani', 'Maní', 2],
    ['c-lucuma', 'Lúcuma', 2], ['c-oreo', 'Choco Oreo', 2],
    ['p-colada', 'Piña colada', 3], ['p-ron', 'Ron con pasas', 3],
    ['p-limon', 'Pie de limón', 3], ['p-leches', 'Tres leches', 3],
    ['p-coctel', 'Cóctel de lúcuma', 3]
  ];
  const money = n => 'S/ ' + n.toFixed(2);
  const $ = (s, r = document) => r.querySelector(s);

  /* ---------- Pedido rápido (hero) ---------- */
  const qf = $('#q-flavor'), qs = $('#q-size'), qp = $('#q-price'), qwa = $('#q-wa');
  Object.entries(FLAVORS).forEach(([k, v]) => qf.add(new Option(v, k)));
  Object.entries(SIZES).forEach(([oz, p]) => qs.add(new Option(`${oz} oz · ${money(p)}`, oz)));
  qs.value = '16';
  function quick() {
    const oz = qs.value, price = SIZES[oz];
    qp.textContent = money(price);
    const msg = `Hola Tropik, quiero 1 cremolada de ${FLAVORS[qf.value]} de ${oz} oz (${money(price)}). Soy de Chiclayo.`;
    qwa.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  }
  qf.addEventListener('change', quick); qs.addEventListener('change', quick); quick();

  /* ---------- Constructor de pedido ---------- */
  const linesEl = $('#lines'), addBtn = $('#add-line');
  const sLiters = $('#s-liters'), sItems = $('#s-items'), sTotal = $('#s-total'),
        sBar = $('#s-bar'), sDeliv = $('#s-deliv'), sWa = $('#s-wa');
  const mDel = $('#m-del'), mRec = $('#m-rec');
  const cName = $('#c-name'), cDist = $('#c-district'), cAddr = $('#c-addr');

  let lines = [{ type: 'cremolada', flavor: 'fresa', size: '16', qty: 1 }];
  let untouched = true;

  const optionsFor = (type) => type === 'cremolada'
    ? Object.entries(FLAVORS).map(([k, v]) => [k, v])
    : CHUPETES.map(([k, n, p]) => [k, `${n} · ${money(p)}`]);

  function lineHTML(l, i) {
    const flavorOpts = optionsFor(l.type).map(([k, v]) => `<option value="${k}"${k === l.flavor ? ' selected' : ''}>${v}</option>`).join('');
    const sizeField = l.type === 'cremolada'
      ? `<select data-f="size" aria-label="Tamaño">${Object.entries(SIZES).map(([oz, p]) => `<option value="${oz}"${oz === l.size ? ' selected' : ''}>${oz} oz · S/${p}</option>`).join('')}</select>`
      : `<select data-f="size" aria-label="Tamaño" disabled><option>Único</option></select>`;
    return `<div class="line" data-i="${i}">
      <div class="field"><label>Producto</label>
        <select data-f="type"><option value="cremolada"${l.type === 'cremolada' ? ' selected' : ''}>Cremolada</option><option value="chupete"${l.type === 'chupete' ? ' selected' : ''}>Chupete</option></select></div>
      <div class="field"><label>Sabor</label><select data-f="flavor">${flavorOpts}</select></div>
      <div class="field"><label>Tamaño</label>${sizeField}</div>
      <div class="acts">
        <div class="qty" role="group" aria-label="Cantidad">
          <button type="button" data-q="-1" aria-label="Quitar uno">−</button>
          <output>${l.qty}</output>
          <button type="button" data-q="1" aria-label="Agregar uno">+</button>
        </div>
        <button type="button" class="rm" data-rm aria-label="Quitar producto"${lines.length === 1 ? ' hidden' : ''}>✕</button>
      </div></div>`;
  }

  const unitPrice = l => l.type === 'cremolada' ? SIZES[l.size] : CHUPETES.find(c => c[0] === l.flavor)[2];
  const lineLabel = l => l.type === 'cremolada'
    ? `Cremolada ${FLAVORS[l.flavor]} ${l.size} oz`
    : `Chupete ${CHUPETES.find(c => c[0] === l.flavor)[1]}`;

  function render() {
    linesEl.innerHTML = lines.map(lineHTML).join('');
    totals();
  }

  function totals() {
    let total = 0, ml = 0, items = 0;
    lines.forEach(l => {
      total += unitPrice(l) * l.qty; items += l.qty;
      if (l.type === 'cremolada') ml += Number(l.size) * ML_PER_OZ * l.qty;
    });
    const liters = ml / 1000, canDeliver = liters >= MIN_DELIVERY_L;
    sLiters.textContent = liters.toFixed(1) + ' L';
    sItems.textContent = String(items);
    sTotal.textContent = money(total);
    sBar.style.width = Math.min(100, liters / MIN_DELIVERY_L * 100) + '%';

    mDel.disabled = !canDeliver;
    if (!canDeliver && mDel.checked) mRec.checked = true;
    const delivery = mDel.checked;

    sDeliv.classList.toggle('ok', canDeliver);
    if (canDeliver) {
      sDeliv.textContent = delivery
        ? 'Delivery en Chiclayo habilitado. Indica tu dirección para enviarlo.'
        : '¡Ya calificas para delivery en Chiclayo! Elige Delivery en «Tus datos» o recoge en tienda.';
    } else {
      const falta = (MIN_DELIVERY_L - liters).toFixed(1);
      sDeliv.textContent = liters === 0
        ? 'Delivery desde 3 litros de cremolada. Si es menos, recoges en Pasaje Agustín Arbulu Neyra #161.'
        : `Te faltan ${falta} L para delivery. Mientras tanto, recoge en Pasaje Agustín Arbulu Neyra #161.`;
    }

    const missingAddr = delivery && !cAddr.value.trim();
    const blocked = items === 0 || missingAddr;
    sWa.setAttribute('aria-disabled', blocked ? 'true' : 'false');
    if (missingAddr) sDeliv.textContent += ' Falta la dirección.';

    const rows = lines.map(l => `• ${l.qty} × ${lineLabel(l)} — ${money(unitPrice(l) * l.qty)}`);
    const msg = [
      'Hola Tropik, quiero hacer este pedido:',
      ...rows,
      `Total: ${money(total)}`,
      liters > 0 ? `Cremoladas: ${liters.toFixed(1)} L` : null,
      `Modalidad: ${delivery ? 'Delivery' : 'Recojo en tienda'}`,
      cName.value.trim() ? `Nombre: ${cName.value.trim()}` : null,
      delivery ? `Distrito: ${cDist.value}` : null,
      delivery && cAddr.value.trim() ? `Dirección: ${cAddr.value.trim()}` : null
    ].filter(Boolean).join('\n');
    sWa.href = blocked ? '#pedido' : `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
    if (blocked) sWa.removeAttribute('target'); else sWa.setAttribute('target', '_blank');
  }

  linesEl.addEventListener('change', e => {
    const row = e.target.closest('.line'); if (!row) return;
    const l = lines[+row.dataset.i], f = e.target.dataset.f; untouched = false;
    if (f === 'type') {
      l.type = e.target.value;
      l.flavor = l.type === 'cremolada' ? 'fresa' : 'c-fresa';
      l.size = '16'; render(); return;
    }
    l[f] = e.target.value; totals();
  });
  linesEl.addEventListener('click', e => {
    const row = e.target.closest('.line'); if (!row) return;
    const l = lines[+row.dataset.i];
    if (e.target.closest('[data-q]')) {
      untouched = false;
      l.qty = Math.min(99, Math.max(1, l.qty + Number(e.target.closest('[data-q]').dataset.q)));
      row.querySelector('output').textContent = l.qty; totals();
    } else if (e.target.closest('[data-rm]')) {
      lines.splice(+row.dataset.i, 1); render();
    }
  });
  addBtn.addEventListener('click', () => { untouched = false; lines.push({ type: 'cremolada', flavor: 'fresa', size: '16', qty: 1 }); render(); });
  [mDel, mRec, cName, cDist, cAddr].forEach(el => el.addEventListener('input', totals));
  [mDel, mRec].forEach(el => el.addEventListener('change', totals));

  // Botones "Pedir" de cada sabor
  document.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => {
    const l = { type: 'cremolada', flavor: b.dataset.add, size: '16', qty: 1 };
    if (untouched) lines = [l]; else lines.push(l);
    untouched = false; render();
    document.getElementById('pedido').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }));
  sWa.addEventListener('click', e => { if (sWa.getAttribute('aria-disabled') === 'true') { e.preventDefault(); (!cAddr.value.trim() && mDel.checked ? cAddr : addBtn).focus(); } });

  render();

  /* ---------- Hero: parallax de dos planos con el puntero (solo puntero fino) ---------- */
  const stage = $('#stage');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (stage && fine.matches && !reduce.matches) {
    const main = stage.querySelector('[data-layer="main"]');
    const sides = [...stage.querySelectorAll('[data-layer="side"]')];
    const bg = stage.querySelector('[data-layer="bg"]');
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.09; cy += (ty - cy) * 0.09;      // suavizado tipo resorte, sin seguir el ratón en crudo
      main.style.setProperty('--x', (cx * 8).toFixed(2) + 'px');
      main.style.setProperty('--y', (cy * 6).toFixed(2) + 'px');
      sides.forEach(s => { s.style.setProperty('--x', (cx * -5).toFixed(2) + 'px'); s.style.setProperty('--y', (cy * -3).toFixed(2) + 'px'); });
      bg.style.setProperty('--bx', (cx * -3).toFixed(2) + 'px');
      bg.style.setProperty('--by', (cy * -3).toFixed(2) + 'px');
      raf = (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.002) ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    stage.addEventListener('pointermove', e => {
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - .5) * 2; ty = ((e.clientY - r.top) / r.height - .5) * 2; kick();
    });
    stage.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
  }
})();
