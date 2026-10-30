/* Shared services, verified profile and interaction layer for the two selected themes. */
(() => {
 const enabled=['cosmic','obsidian'];
 const theme=document.body.dataset.homeDesign;if(!enabled.includes(theme))return;
 const body=document.body,home=document.getElementById('homeView'),nav=document.querySelector('.tma-nav');
 const computed=getComputedStyle(body);
 for(const [name,token] of [['bg','--home-bg'],['surface','--home-surface'],['ink','--home-ink'],['muted','--home-muted'],['line','--home-line'],['accent','--home-accent']]) body.style.setProperty(`--motion-${name}`,name==='surface'&&theme==='signal'?'#f8f5ec':computed.getPropertyValue(token).trim());
 body.classList.add('local-motion-ui');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const icons={history:'◷',services:'✳',profile:'◉'};
 const create=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
 const main=document.querySelector('.tma-main');
 const makePage=(id,title,subtitle)=>{
  const view=create('section','view local-page');view.id=id+'View';
  view.append(create('span','local-page-eyebrow','ЛИЧНОЕ ПРОСТРАНСТВО'));
  const row=create('div','local-page-title');row.append(create('h2','',title),create('span','local-page-symbol',icons[id]));view.append(row,create('p','local-page-intro',subtitle));main.append(view);return view;
 };
 // Keep a single calculator hub and two personal sections.
 nav.querySelector('[onclick*="history"]')?.remove();
 const services=makePage('services','Услуги','Личная работа с Викторией Барыбиной — выберите то, что откликается вашему запросу.');
 const catalogue=create('div','local-service-list');services.append(catalogue);
 const serviceItems=[
  ['Консультация','Личная встреча с нумерологом','Обсудить вашу ситуацию и вопросы, которые сейчас важны.','✧'],
  ['Персональный разбор','Внимание к вашей истории','Индивидуальный разбор по дате рождения с учётом вашего запроса.','◇'],
  ['Процессинг','Индивидуальная работа с запросом','Формат и содержание работы обсуждаются с Викторией лично.','◎']
 ];
 serviceItems.forEach(([title,desc,detail,symbol])=>{
  const item=create('details','local-service-detail');const summary=create('summary','local-service-item');
  const text=create('span','local-service-text');text.append(create('strong','',title),create('small','',desc));
  summary.append(create('span','local-service-icon',symbol),text,create('span','local-item-arrow','+'));
  const content=create('div','local-service-description');content.append(create('p','',detail));
  const contact=create('a','local-contact-link','Обсудить с Викторией ↗');contact.href='https://t.me/vik_vik937';contact.target='_blank';contact.rel='noopener noreferrer';content.append(contact);
  item.append(summary,content);catalogue.append(item);
 });
 const profile=makePage('profile','Профиль','Ваши данные, продукты и личная работа с Викторией.');
 const profileHero=create('div','local-profile-card');const avatar=create('span','local-profile-avatar','Г');const profileName=create('strong','','Гость');const profileDescription=create('span','','Личное пространство');profileHero.append(avatar,profileName,profileDescription);profile.append(profileHero);
 const sections=create('div','local-profile-sections');
 const section=(title,description,symbol)=>{const box=create('section','local-profile-section');const row=create('div','local-profile-section-title');row.append(create('span','',symbol),create('h3','',title));box.append(row,create('p','',description));return box;};
 const products=section('Мои продукты','Ваши приобретённые продукты и персональные материалы.','◇');
 const purchased=create('div','profile-product-list');products.append(purchased);
 const browse=create('button','local-contact-link','Выбрать продукт →');browse.type='button';browse.onclick=()=>navigateTo('home');products.append(browse);
 sections.append(products,section('Мои записи','Записей пока нет. Обсудить консультацию или другую услугу можно в разделе «Услуги».','◷'));
 const help=section('Помощь','Вопросы о приложении, доступе к продуктам или записи на консультацию.','?');
 const helpLink=create('a','local-contact-link','Написать Виктории ↗');helpLink.href='https://t.me/vik_vik937';helpLink.target='_blank';helpLink.rel='noopener noreferrer';help.append(helpLink);sections.append(help);profile.append(sections);
 const personal=create('details','local-personal-data');personal.append(create('summary','','Личные данные'));
 const personalInfo=create('p','profile-personal-info');personal.append(personalInfo);profile.append(personal);
 function renderProfile() {
  const user=currentState.user;
  const name=user ? [user.first_name,user.last_name].filter(Boolean).join(' ') || user.username || 'Пользователь' : 'Гость';
  profileName.textContent=name;profileDescription.textContent=user?.username?'@'+user.username:'Личное пространство';
  avatar.replaceChildren(document.createTextNode(Array.from(name)[0].toUpperCase()));
  if(user?.photo_url && /^https:\/\//.test(user.photo_url)){const img=create('img');img.src=user.photo_url;img.alt=name;img.referrerPolicy='no-referrer';avatar.replaceChildren(img);}
  personalInfo.textContent=user?`Имя и профиль связаны с вашим аккаунтом Telegram${user.username?' — @'+user.username:''}.`:'Откройте приложение через Telegram, чтобы использовать свой профиль.';
  purchased.replaceChildren();
  const routes={money_code:'moneyCalc',year_forecast:'yearForecast',month_forecast:'monthForecast',compatibility:'compatibility'};
  const labels={money_code:'Денежный код',year_forecast:'Прогноз на год',month_forecast:'Прогноз на месяц',compatibility:'Совместимость'};
  if(!currentState.permissions.length)purchased.append(create('p','','Приобретённых продуктов пока нет.'));
  for(const key of currentState.permissions){
   const product=currentState.products.find(p=>p.id===key);
   const row=create('button','profile-product');row.type='button';row.append(create('span','',product?.name||labels[key]||key),create('small','','Доступ открыт ↗'));
   row.addEventListener('click',()=>{if(routes[key])navigateTo(routes[key]);});purchased.append(row);
  }
 }
 document.addEventListener('app:state',renderProfile);renderProfile();
 // A moving indicator is shared by the working three-tab navigation.
 const indicator=create('span','motion-nav-indicator');indicator.setAttribute('aria-hidden','true');nav.prepend(indicator);
 let frame=0;
 const syncIndicator=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const active=nav.querySelector('.nav-item.active');if(!active||!nav.offsetWidth)return;const outer=nav.getBoundingClientRect(),r=active.getBoundingClientRect();indicator.style.width=r.width+'px';indicator.style.height=r.height+'px';indicator.style.transform=`translate(${r.left-outer.left-nav.clientLeft}px,${r.top-outer.top-nav.clientTop}px)`;});};
 nav.querySelectorAll('.nav-item').forEach(button=>{
  const match=button.getAttribute('onclick')?.match(/switchTab\('([^']+)'/);if(!match)return;const page=match[1];
  button.dataset.localTab=page;button.disabled=false;button.removeAttribute('title');button.removeAttribute('onclick');
  button.addEventListener('click',()=>{switchTab(page,button);document.scrollingElement?.scrollTo({top:0,behavior:'instant'});syncIndicator();});
 });
 const pageObserver=new MutationObserver(()=>{
  const active=document.querySelector('.view.active');
  body.classList.toggle('cosmic-matrix-background',theme==='cosmic'&&['resultView','yearForecastResultView','monthForecastResultView','compatibilityResultView'].includes(active?.id));
  body.classList.toggle('cosmic-input-page',theme==='cosmic'&&['calcView','moneyCalcView','yearForecastView','monthForecastView','compatibilityView'].includes(active?.id));
  body.classList.toggle('local-secondary-page',Boolean(active?.classList.contains('local-page')));
  const tab=active?.id==='homeView'?'home':active?.classList.contains('local-page')?active.id.replace(/View$/,''):null;
  nav.querySelectorAll('.nav-item').forEach(b=>{const activeTab=tab||'home';b.classList.toggle('active',b.dataset.localTab===activeTab);if(b.dataset.localTab===activeTab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  syncIndicator();
 });
 document.querySelectorAll('.view').forEach(view=>pageObserver.observe(view,{attributes:true,attributeFilter:['class']}));
 const resizeObserver=new ResizeObserver(syncIndicator);resizeObserver.observe(nav);nav.querySelectorAll(".nav-item").forEach(button=>resizeObserver.observe(button));syncIndicator();
 // Hover tilt is applied only for a fine pointer; touch keeps its natural scroll.
 const cards=[...home.querySelectorAll('.matrix-card')];
 cards.forEach((card,i)=>{
  if(theme==='cosmic')return;
  card.classList.add('motion-card');card.style.setProperty('--motion-delay',`${Math.min(i,5)*65}ms`);
  const sheen=create('span','motion-sheen');sheen.setAttribute('aria-hidden','true');card.append(sheen);
  let bounds=null,hoverFrame=0;
  card.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')bounds=card.getBoundingClientRect();});
  card.addEventListener('pointermove',e=>{if(!bounds||e.pointerType!=='mouse'||reduce.matches)return;cancelAnimationFrame(hoverFrame);hoverFrame=requestAnimationFrame(()=>{const x=(e.clientX-bounds.left)/bounds.width,y=(e.clientY-bounds.top)/bounds.height;card.style.setProperty('--mx',`${x*100}%`);card.style.setProperty('--my',`${y*100}%`);card.style.setProperty('--rx',`${(0.5-y)*4}deg`);card.style.setProperty('--ry',`${(x-0.5)*5}deg`);});});
  card.addEventListener('pointerleave',()=>{cancelAnimationFrame(hoverFrame);bounds=null;card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg');});
 });
 // Ripples never capture input or change the card's original navigation handler.
 document.querySelectorAll('.motion-card,.tma-nav .nav-item,.local-service-item,.local-history-item,.local-action').forEach(target=>{
  if(theme==='cosmic')return;
  target.addEventListener('pointerdown',e=>{if(reduce.matches||e.button>0)return;const rect=target.getBoundingClientRect();const ripple=create('span','motion-ripple');ripple.setAttribute('aria-hidden','true');const size=Math.max(rect.width,rect.height)*2;ripple.style.cssText=`width:${size}px;height:${size}px;left:${e.clientX-rect.left}px;top:${e.clientY-rect.top}px`;target.append(ripple);ripple.addEventListener('animationend',()=>ripple.remove(),{once:true});});
 });
})();
