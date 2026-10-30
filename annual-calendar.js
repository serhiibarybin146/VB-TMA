/* Manual January prototype, transcribed from the supplied 2025 calendar. */
(() => {
 let entries = [
  [2,'health','Удели внимание здоровью'],[4,'health','Проявляй терпимость'],
  [6,'work','Проговаривай желаемое'],[8,'family','Ставь новые цели'],
  [10,'health','Делай через страхи'],[12,'work','Держи баланс во всем'],
  [14,'relations','Разговор по душам'],[16,'family','Верь в себя и свои умения'],
  [18,'work','Прояви мудрость'],[20,'family','Будь не идеальной'],
  [23,'health','Доверяй ощущениям'],[25,'relations','Не бойся нового'],
  [27,'work','Ставь себя на первое место'],[29,'health','Прояви мудрую позицию'],
  [31,'family','Контролируй эмоции']
 ];
 // January 2 is yellow (relationships) in the source, irrespective of its wording.
 entries[0][1]='relations';
 const categories={relations:'Отношения',family:'Семья, дети',work:'Реализация',health:'Здоровье'};
 const focus=['Уединение, уход в себя','Глубокий самоанализ','Обучение','Изучение чего-то нового','Повышение квалификации','Отношения с мамой','Отношения с партнером','Отношения с ребенком','Поиск ответов','Чувство одиночества','Получение нового опыта','Здоровья'];
 const months=window.annualCalendarMonths;
 months[0]={name:'Январь',entries,focus,advice:['Верь в себя – это ключ к результату']};
 const genitives=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
 const colourKeys={r:'relations',w:'work',f:'family',h:'health'};
 let month=0;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
 const page=el('section','view');page.id='annualCalendarView';
 page.innerHTML=`<button class="calendar-back" type="button">← К калькуляторам</button><p class="calendar-eyebrow">ЛИЧНЫЙ НУМЕРОЛОГИЧЕСКИЙ КАЛЕНДАРЬ</p><h2>Ваш год в деталях</h2><p class="calendar-person">18.12.1990 · 2025 год</p><div class="calendar-toolbar"><h3>Январь <span>2025</span></h3><button type="button" class="calendar-expand">Развернуть ↗</button></div><p class="calendar-note">Прототип января · рекомендации из авторского календаря</p><div class="calendar-legend"></div><div class="calendar-grid" aria-label="Январь 2025"></div><div class="calendar-day-detail" aria-live="polite"></div><section class="calendar-advice"><small>СОВЕТ МЕСЯЦА</small><p>Верь в себя – это ключ к результату</p></section><section class="calendar-focus"><small>ФОКУС МЕСЯЦА</small><ul></ul></section>`;
 document.querySelector('.tma-main').append(page);
 const card=el('button','calendar-home-card');card.type='button';card.append(el('strong','','В разработке'));
 document.querySelector('#homeView .matrix-grid').append(card);
 const allowed=()=>['vik_vik937','serhiibarybin'].includes(currentState.user?.username?.toLowerCase()) || (['localhost','127.0.0.1'].includes(location.hostname)&&currentState.user?.id===900000002);
 const syncAccess=()=>{card.disabled=!allowed();};
 document.addEventListener('app:state',syncAccess);syncAccess();
 const open=()=>{if(!allowed())return;showView('annualCalendarView');document.body.classList.add('calendar-page');window.scrollTo(0,0);};
 card.onclick=open;
 page.querySelector('.calendar-back').onclick=()=>{document.body.classList.remove('calendar-page');navigateTo('home');};
 const legend=page.querySelector('.calendar-legend');
 for(const [key,label] of Object.entries(categories))legend.append(el('span','calendar-category '+key,label));
 const grid=page.querySelector('.calendar-grid'),detail=page.querySelector('.calendar-day-detail');
 const controls=el('div','calendar-month-controls');
 const prev=el('button','','‹'),next=el('button','','›'),picker=el('select','calendar-month-picker');
 prev.type=next.type='button';prev.setAttribute('aria-label','Предыдущий месяц');next.setAttribute('aria-label','Следующий месяц');picker.setAttribute('aria-label','Месяц');
 months.forEach((m,i)=>{const option=el('option','',m.name);option.value=i;picker.append(option);});
 controls.append(prev,picker,next);page.querySelector('.calendar-toolbar').before(controls);
 page.querySelector('.calendar-note').textContent='Рекомендации из авторского календаря · 2025';
 const select=(day,button)=>{
  grid.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  detail.replaceChildren(el('small','',`${day} ${genitives[month].toUpperCase()} · 2025`));
  const entry=entries.find(e=>e[0]===day);
  if(entry){detail.append(el('span','calendar-category '+entry[1],categories[entry[1]]),el('p','',entry[2]));}
  else detail.append(el('p','','В авторском календаре на этот день отдельной рекомендации нет.'));
 };
 function renderMonth(){
 const data=months[month];entries=data.entries.map(([day,key,text])=>[day,colourKeys[key]||key,text]);
 picker.value=month;prev.disabled=month===0;next.disabled=month===11;
 page.querySelector('.calendar-toolbar h3').replaceChildren(document.createTextNode(data.name+' '),el('span','','2025'));
 grid.replaceChildren();grid.setAttribute('aria-label',data.name+' 2025');
 for(const label of ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'])grid.append(el('span','calendar-weekday',label));
 const offset=(new Date(2025,month,1).getDay()+6)%7,days=new Date(2025,month+1,0).getDate(),previousDays=new Date(2025,month,0).getDate();
 for(let cell=0;cell<Math.ceil((offset+days)/7)*7;cell++){
  const day=cell-offset+1;
  if(day<1||day>days){grid.append(el('span','calendar-outside',String(day<1?day+previousDays:day-days)));continue;}
  const entry=entries.find(e=>e[0]===day),button=el('button','calendar-day');button.type='button';
  button.append(el('span','',String(day)));button.setAttribute('aria-label',`${day} ${genitives[month]}${entry?': '+entry[2]:''}`);button.setAttribute('aria-pressed','false');
  if(entry){button.classList.add(entry[1]);button.append(el('i','calendar-dot'),el('small','calendar-day-caption',entry[2]));}
  button.onclick=()=>select(day,button);grid.append(button);
 }
 const list=page.querySelector('.calendar-focus ul');list.replaceChildren();data.focus.forEach(text=>list.append(el('li','',text)));
 const advice=page.querySelector('.calendar-advice');advice.replaceChildren(el('small','','СОВЕТ МЕСЯЦА'));data.advice.forEach(text=>advice.append(el('p','',text)));
 const first=entries[0][0];select(first,grid.querySelectorAll('button')[first-1]);
 }
 prev.onclick=()=>{if(month>0){month--;renderMonth();}};next.onclick=()=>{if(month<11){month++;renderMonth();}};picker.onchange=()=>{month=Number(picker.value);renderMonth();};
 renderMonth();
 page.querySelector('.calendar-expand').onclick=()=>{
  const wide=page.classList.toggle('calendar-wide');document.body.classList.toggle('calendar-expanded',wide);
  page.querySelector('.calendar-expand').textContent=wide?'Свернуть ↙':'Развернуть ↗';
 };
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){page.classList.remove('calendar-wide');document.body.classList.remove('calendar-expanded');page.querySelector('.calendar-expand').textContent='Развернуть ↗';}});
 new MutationObserver(()=>{if(page.classList.contains('active')&&!allowed()){navigateTo('home');return;}if(!page.classList.contains('active'))document.body.classList.remove('calendar-page','calendar-expanded');}).observe(page,{attributes:true,attributeFilter:['class']});
})();
