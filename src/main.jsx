import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');
const billingQuery = () => new URLSearchParams(window.location.search);
const T = (v, lang) => Array.isArray(v) ? v : (typeof v === 'object' && v ? (v[lang] || v.ru || v.en || '') : (v || ''));

const SUPPORTED_LANGUAGES = ['ru', 'en'];
const LANGUAGE_LABELS = { ru: 'Русский', en: 'English' };
const UI_COPY = {
  ru: {
    appTitle: 'MavenLex — AI-анализ договоров для бизнеса',
    appDescription: 'AI-анализ договоров: риски, спорные условия, чеклист перед подписанием, сравнение версий и экспорт отчёта.',
    sourceAuto: 'Автоопределение',
    reportLanguage: 'Язык отчёта',
    documentLanguage: 'Язык документа',
    bilingualNote: 'Можно загрузить русский или английский договор и получить отчёт на выбранном языке.',
    legalDisclaimer: 'Информационный AI-анализ. AI-разбор MavenLex: проверяйте факты и актуальные нормы.'
  },
  en: {
    appTitle: 'MavenLex — AI Contract Analysis for Business',
    appDescription: 'AI contract analysis: risks, disputed clauses, signing checklist, version comparison and report export.',
    sourceAuto: 'Auto-detect',
    reportLanguage: 'Report language',
    documentLanguage: 'Document language',
    bilingualNote: 'Upload Russian or English contracts and receive the report in the selected language.',
    legalDisclaimer: 'MavenLex AI analysis: verify facts, documents and current rules.'
  }
};

const GLOBAL_I18N_PAIRS = [
  ['Home','Главная'], ['Contract','Договор'], ['Compare','Сравнение'], ['Situation','Ситуация'], ['Docs','Документы'], ['Cabinet','Кабинет'], ['Onboarding','Старт'], ['Pricing','Тарифы'], ['Account','Кабинет'], ['Trust','Доверие'], ['Settings','Настройки'], ['Clauses','Пункты'], ['Rewrite','Правки'], ['Security','Безопасность'], ['Support','Поддержка'], ['Help','Помощь'], ['Admin','Админ'], ['Dashboard','Панель'], ['Report','Отчёт'], ['Billing','Оплата'], ['Analytics','Аналитика'], ['Language','Язык'], ['Default jurisdiction','Юрисдикция по умолчанию'], ['Save','Сохранить'], ['Cancel','Отмена'], ['Delete','Удалить'], ['Export','Экспорт'], ['Download','Скачать'], ['Copy','Копировать'], ['Copied','Скопировано'], ['Clear','Очистить'], ['Open','Открыть'], ['Close','Закрыть'], ['Back','Назад'], ['Next','Далее'], ['Continue','Продолжить'], ['Start','Начать'], ['Finish','Завершить'], ['Loading','Загрузка'], ['Error','Ошибка'], ['Ready','Готово'], ['Active','Активен'], ['Blocked','Заблокировано'], ['Allowed','Разрешено'], ['Required','Требуется'], ['Guest','Гость'], ['Owner','Владелец'], ['Member','Участник'], ['Viewer','Наблюдатель'],
  ['AI Legal Assistant','AI юридический ассистент'], ['MAVENLEX INTELLIGENT LEGAL COUNSEL','MAVENLEX ИНТЕЛЛЕКТУАЛЬНЫЙ ЮРИДИЧЕСКИЙ СОВЕТНИК'], ['MULTILINGUAL READY','МУЛЬТИЯЗЫЧНОСТЬ ГОТОВА'], ['SECURE DOCUMENT HANDLING','БЕЗОПАСНАЯ ОБРАБОТКА ДОКУМЕНТОВ'], ['RESULT PREVIEW','ПРЕВЬЮ РЕЗУЛЬТАТА'], ['READY TO USE','ГОТОВО К ИСПОЛЬЗОВАНИЮ'], ['ACTION NAVIGATOR','НАВИГАТОР ДЕЙСТВИЙ'], ['SUBSCRIPTION REQUIRED','ТРЕБУЕТСЯ ПОДПИСКА'], ['ACCESS DENIED','ДОСТУП ЗАПРЕЩЁН'], ['ACCOUNT + HISTORY','АККАУНТ + ИСТОРИЯ'], ['CLIENT ONBOARDING','ПЕРСОНАЛЬНАЯ НАСТРОЙКА'], ['CONTRACT ANALYSIS','АНАЛИЗ ДОГОВОРА'], ['CONTRACT COMPARISON','СРАВНЕНИЕ ДОГОВОРОВ'], ['AI ACTION NAVIGATOR','AI НАВИГАТОР ДЕЙСТВИЙ'], ['REAL USER READINESS','ГОТОВНОСТЬ К РЕАЛЬНЫМ ПОЛЬЗОВАТЕЛЯМ'], ['LAUNCH READINESS','ГОТОВНОСТЬ К ЗАПУСКУ'], ['PRIVACY','КОНФИДЕНЦИАЛЬНОСТЬ'], ['TERMS','УСЛОВИЯ'], ['FAQ','ВОПРОСЫ'],
  ['AI contract and legal situation analysis for business','AI-анализ договоров и юридических ситуаций для бизнеса'], ['AI contract analysis before signing','AI-анализ договора перед подписанием'], ['Review a contract','Проверить договор'], ['Upload contract','Загрузить договор'], ['Analyze situation','Разобрать ситуацию'], ['Analyze a situation','Разобрать ситуацию'], ['Get action plan','Получить план действий'], ['Compare two versions','Сравнить две версии'], ['Compare versions','Сравнить версии'], ['Find a Russian article','Найти статью РФ'], ['Open search','Открыть поиск'], ['Action plan','План действий'], ['AI analysis available','AI-анализ доступен'], ['AI temporarily unavailable','AI временно недоступен'], ['Secure processing','Безопасная обработка'], ['Real-user ready','Готово для реальных пользователей'], ['Answer format','Формат ответа'], ['Russian and English contracts','Русские и английские договоры'], ['Auto-detect','Автоопределение'], ['Your documents are handled carefully','Ваши документы обрабатываются аккуратно'], ['Clear decision: sign, edit or get legal review','Понятное решение: подписывать, править или проверить глубже'], ['Result preview before upload','Превью результата перед загрузкой'], ['Open report preview','Открыть превью отчёта'], ['Next step — pricing and account','Следующий шаг — тарифы и личный кабинет'], ['View pricing','Посмотреть тарифы'], ['Open account','Открыть кабинет'], ['What to do today','Что делать сегодня'], ['What not to do','Что НЕ делать'], ['What to write','Что написать'], ['Last report','Последний отчёт'], ['Last document','Последний документ'], ['Common questions before using MavenLex','Частые вопросы перед использованием MavenLex'],
  ['Active plan required','Нужен активный тариф'], ['This action is available after login and plan selection.','Это действие доступно после входа и выбора подходящего тарифа.'], ['Log in','Войти'], ['Access denied','Нет прав доступа'], ['This area is protected by your account role.','Эта область защищена ролью аккаунта.'], ['Current role','Текущая роль'], ['Page not found','Страница не найдена'], ['Go home','На главную'], ['Analyze contract','Анализ договора'], ['Menu','Меню'], ['Open navigation','Открыть навигацию'], ['Collapse navigation','Свернуть навигацию'],
  ['Account security','Безопасность аккаунта'], ['Account and billing','Аккаунт и оплата'], ['Account, history and limits','Аккаунт, история и лимиты'], ['Analysis and document history','История анализов и документов'], ['Service login required','Требуется вход в аккаунт'], ['Service ready','Сервис готов'], ['Service unavailable','Сервис недоступен'], ['Service online','Сервис онлайн'], ['History loaded','История загружена'], ['Log out','Выйти'], ['Change password','Сменить пароль'], ['Delete account','Удалить аккаунт'], ['Export my data','Экспортировать мои данные'], ['Data export','Экспорт данных'], ['Delete account flow','Удаление аккаунта'], ['Active sessions','Активные сессии'], ['Active devices','Активные устройства'], ['All sessions logged out.','Все сессии завершены.'], ['Account deleted.','Аккаунт удалён.'], ['Account data export prepared.','Экспорт данных аккаунта подготовлен.'], ['Company — optional','Компания — необязательно'],
  ['Choose a contract to analyze','Выберите договор для анализа'], ['Choose file','Выбрать файл'], ['Choose another file','Выбрать другой файл'], ['Choose a contract file first: TXT, DOCX or PDF.','Сначала выберите файл договора: TXT, DOCX или PDF.'], ['Document language','Язык документа'], ['Report language','Язык отчёта'], ['Contract type','Тип договора'], ['Jurisdiction','Юрисдикция'], ['Analysis depth','Глубина анализа'], ['Before uploading','Перед загрузкой'], ['AI is analyzing...','AI анализирует...'], ['Analysis failed','Анализ не удался'], ['Contract Risk Report','Отчёт по рискам договора'], ['Risk score','Оценка риска'], ['Risk Table','Таблица рисков'], ['Decision helper','Помощник решения'], ['Recommendation','Рекомендация'], ['Verification questions','Что проверить'], ['Negotiation Message','Сообщение для переговоров'], ['Detailed Review','Детальный разбор'], ['Pre-signing checklist','Чеклист перед подписанием'], ['Business impact','Влияние на бизнес'], ['Plain language','Простыми словами'], ['Recommended action','Рекомендуемое действие'], ['Safer wording','Более безопасная формулировка'], ['Excerpt','Фрагмент'], ['Risk matrix','Матрица рисков'], ['Risk','Риск'], ['Status','Статус'], ['File','Файл'], ['Date','Дата'], ['Characters','Символов'], ['Clause','Пункт'], ['Action','Действие'],
  ['Choose Pro or Business on Pricing.','Выберите Pro или Business на странице тарифов.'], ['Choose a paid Pro or Business plan to start checkout.','Выберите платный тариф Pro или Business, чтобы начать оплату.'], ['Checkout created. Redirecting to the secure payment page.','Checkout создан. Перенаправляем на безопасную страницу оплаты.'], ['Checking payment...','Проверяем оплату...'], ['Checking payment status and updating Account limits.','Проверяем статус оплаты и обновляем лимиты кабинета.'], ['Back to Pricing','Назад к тарифам'], ['Back to account','Назад в кабинет'], ['Change plan','Сменить тариф'], ['Cancel subscription','Отменить подписку'], ['AI budget exceeded','AI-бюджет превышен'], ['AI budget is within limits.','AI-бюджет в пределах лимита.'], ['AI questions left','Осталось AI-вопросов'], ['Contract reviews','Проверки договоров'], ['Budget used','Бюджет использован'], ['Current plan','Текущий тариф'], ['Free','Free'], ['Pro','Pro'], ['Business','Business'],
  ['Privacy Policy','Политика конфиденциальности'], ['Terms of Service','Условия использования'], ['Security Center','Центр безопасности'], ['Trust Center','Центр доверия'], ['Contact support','Связаться с поддержкой'], ['Use MavenLex as an AI legal analysis system; verify facts and documents carefully.','Для финальных решений используйте MavenLex.'], ['MavenLex AI analysis: verify facts, documents and current rules.','Информационный AI-анализ. AI-разбор MavenLex: проверяйте факты и актуальные нормы.'], ['MavenLex is not legal advice.','MavenLex даёт AI-разбор, риски, действия и готовые формулировки.']
];
const I18N_TO_RU = Object.fromEntries(GLOBAL_I18N_PAIRS);
const I18N_TO_EN = Object.fromEntries(GLOBAL_I18N_PAIRS.map(([en, ru]) => [ru, en]));
function translateUiString(value, lang) {
  if (!value || typeof value !== 'string') return value;
  const dict = lang === 'ru' ? I18N_TO_RU : I18N_TO_EN;
  let out = dict[value] || value;
  const keys = Object.keys(dict).sort((a,b) => b.length - a.length);
  for (const key of keys) {
    const translated = dict[key];
    if (!translated || key === translated || !out.includes(key)) continue;
    out = out.split(key).join(translated);
  }
  return out;
}
function translateDomUi(lang) {
  if (typeof document === 'undefined') return;
  const skip = new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','CODE','PRE']);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || skip.has(parent.tagName) || parent.closest('[data-no-i18n], textarea, input, code, pre')) return NodeFilter.FILTER_REJECT;
      return node.nodeValue && node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(node => {
    const next = translateUiString(node.nodeValue, lang);
    if (next !== node.nodeValue) node.nodeValue = next;
  });
  document.querySelectorAll('[placeholder], [title], [aria-label]').forEach(el => {
    ['placeholder','title','aria-label'].forEach(attr => {
      const value = el.getAttribute(attr);
      if (value) {
        const next = translateUiString(value, lang);
        if (next !== value) el.setAttribute(attr, next);
      }
    });
  });
}
const localizedContractTypes = {
  ru: [
    ['Service agreement', 'Договор услуг'],
    ['NDA', 'NDA / соглашение о конфиденциальности'],
    ['Freelance agreement', 'Договор с фрилансером'],
    ['Employment contract', 'Трудовой договор'],
    ['Lease agreement', 'Договор аренды'],
    ['Supply agreement', 'Договор поставки'],
    ['Partnership agreement', 'Партнёрское соглашение'],
    ['Loan agreement', 'Договор займа'],
    ['Custom agreement', 'Другой договор']
  ],
  en: [
    ['Service agreement', 'Service agreement'],
    ['NDA', 'NDA / confidentiality agreement'],
    ['Freelance agreement', 'Freelance agreement'],
    ['Employment contract', 'Employment contract'],
    ['Lease agreement', 'Lease agreement'],
    ['Supply agreement', 'Supply agreement'],
    ['Partnership agreement', 'Partnership agreement'],
    ['Loan agreement', 'Loan agreement'],
    ['Custom agreement', 'Custom agreement']
  ]
};
function normalizeLanguage(value, fallback = 'ru') { const lang = String(value || '').toLowerCase().slice(0,2); return SUPPORTED_LANGUAGES.includes(lang) ? lang : fallback; }
function languageFromPath(pathname = location.pathname) { if (pathname === '/en' || pathname.startsWith('/en/')) return 'en'; if (pathname === '/ru' || pathname.startsWith('/ru/')) return 'ru'; return normalizeLanguage(localStorage.lang || navigator.language, 'ru'); }

const knownRoutes = new Set(['/home','/analyze','/compare','/situation','/builder','/law','/dashboard','/pricing','/account','/admin','/report','/favorites','/settings','/legal','/privacy','/terms','/security','/faq','/reset-password','/verify-email','/ai-contract-analysis','/contract-risk-analysis','/business-contract-review','/billing/success','/billing/cancel','/subscription-required','/access-denied','/support','/help','/onboarding','/launch','/qa','/clauses','/rewrite','/ai-nda-analysis','/ai-service-agreement-analysis','/ai-lease-analysis','/contract-penalty-analysis','/check-contract-before-signing','/favorites']);

const ROLE_OPTIONS = [
  { value:'user', ru:'Пользователь', en:'User', noteRu:'Обычный клиент: договоры, ситуации, статьи, тарифы, кабинет и история.', noteEn:'Regular customer: contracts, situations, articles, pricing, account and history.' },
  { value:'local_admin', ru:'Локальный админ', en:'Local admin', noteRu:'Помощник владельца: пользователи, поддержка, блокировки, восстановление доступа и простой AI-статус. Без дизайна, ключей и owner-действий.', noteEn:'Owner assistant: users, support, blocks, account recovery and simple AI status. No design, secrets or owner actions.' },
  { value:'owner', ru:'Владелец', en:'Owner', noteRu:'Полный доступ владельца продукта. Owner нельзя удалить, заблокировать или понизить через панель.', noteEn:'Full product-owner access. Owner cannot be deleted, blocked or downgraded from the panel.' }
];
const PUBLIC_ROUTES = new Set(['/home','/pricing','/account','/law','/situation','/analyze','/legal','/privacy','/terms','/security','/faq','/help','/support','/reset-password','/verify-email','/subscription-required','/access-denied','/billing/success','/billing/cancel','/ai-contract-analysis','/contract-risk-analysis','/business-contract-review','/ai-nda-analysis','/ai-service-agreement-analysis','/ai-lease-analysis','/contract-penalty-analysis','/check-contract-before-signing']);
const ROLE_ROUTE_ACCESS = {
  user: new Set(['/home','/analyze','/situation','/law','/pricing','/account','/report','/favorites','/legal','/privacy','/terms','/security','/faq','/help','/support','/reset-password','/verify-email','/billing/success','/billing/cancel']),
  local_admin: new Set(['/home','/account','/dashboard','/support','/help','/faq','/legal','/privacy','/terms','/security','/admin','/reset-password','/verify-email']),
  owner: new Set(Array.from(knownRoutes))
};
function roleLabel(role, lang='ru') {
  const normalized = ({admin:'local_admin', support:'local_admin', analyst:'user', manager:'user', billing:'user'}[role] || role);
  const found = ROLE_OPTIONS.find(r => r.value === normalized) || ROLE_OPTIONS[0];
  return lang === 'ru' ? found.ru : found.en;
}
function canAccessRoute(route, role) {
  if (!knownRoutes.has(route)) return true;
  if (!role) return PUBLIC_ROUTES.has(route);
  return (ROLE_ROUTE_ACCESS[role] || ROLE_ROUTE_ACCESS.user).has(route) || PUBLIC_ROUTES.has(route);
}
function navVisibleForRole(path, role) {
  return canAccessRoute(path, role) && (role || PUBLIC_ROUTES.has(path));
}

function routeFromPath(pathname = location.pathname) { let path = pathname || '/'; if (path === '/ru' || path === '/en') return '/home'; if (path.startsWith('/ru/')) path = path.slice(3) || '/'; if (path.startsWith('/en/')) path = path.slice(3) || '/'; return path === '/' ? '/home' : path; }
function localizedPath(path, lang) { if (path === '/home') return lang === 'en' ? '/en' : '/ru'; return lang === 'en' ? `/en${path}` : `/ru${path}`; }
const contractTypes = ['Service agreement', 'NDA', 'Freelance agreement', 'Employment contract', 'Lease agreement', 'Supply agreement', 'Partnership agreement', 'Loan agreement', 'Custom agreement'];
const JURISDICTION_OPTIONS = [
  { value: 'Russia', ru: 'Россия', en: 'Russia' },
  { value: 'UK', ru: 'Великобритания', en: 'United Kingdom' },
  { value: 'USA', ru: 'США', en: 'United States' },
  { value: 'UAE', ru: 'ОАЭ', en: 'United Arab Emirates' },
  { value: 'Germany', ru: 'Германия', en: 'Germany' },
  { value: 'Sweden', ru: 'Швеция', en: 'Sweden' },
  { value: 'Georgia', ru: 'Грузия', en: 'Georgia' },
  { value: 'Armenia', ru: 'Армения', en: 'Armenia' }
];
function jurisdictionLabel(value, lang) {
  const match = JURISDICTION_OPTIONS.find(option => option.value === value);
  if (!match) return value || '';
  return lang === 'ru' ? match.ru : match.en;
}

const showcaseReport = {
  riskScore: 72,
  riskLevel: 'Medium',
  summary: { ru: 'В отчёте обнаружены риски по штрафам, расторжению и ответственности.', en: 'The report identifies risks related to penalties, termination and liability.' },
  signatureReadiness: { text: { ru: 'Legal Review Recommended', en: 'Legal Review Recommended' } },
  decisionRecommendation: { ru: 'Не подписывать без уточнений по штрафам, расторжению и ответственности.', en: 'Do not sign without clarifying penalties, termination and liability.' },
  risks: [
    { id:'termination', level:'High', score:88, title:{ru:'Расторжение без уведомления',en:'Termination without notice'}, source:'Provider may terminate this agreement without prior notice if payment is delayed.', plainLanguage:{ru:'Второй стороне может быть разрешено прекратить договор внезапно.',en:'The other party may be allowed to terminate suddenly.'}, businessImpact:{ru:'Можно потерять доступ к услуге или деньги без времени на исправление.',en:'You may lose access or money without time to fix the issue.'}, whatToDo:{ru:'Добавить письменное уведомление и 14 дней на исправление.',en:'Add written notice and a 14-day cure period.'}, questionForMavenLex:{ru:'Можно ли ограничить право расторжения и добавить срок на исправление?',en:'Can we limit termination rights and add a cure period?'}, suggestedDraft:{ru:'Расторжение возможно после письменного уведомления и 14 календарных дней на исправление.',en:'Termination is allowed after written notice and a 14-calendar-day cure period.'}, worstCaseScenario:{ru:'В худшем случае договор прекратят внезапно, а бизнес останется без услуги.',en:'Worst case: the contract ends suddenly and the business loses the service.'} },
    { id:'liability', level:'High', score:82, title:{ru:'Ограничение ответственности',en:'Liability limitation'}, source:'The Provider shall not be liable for indirect damages under any circumstances.', plainLanguage:{ru:'Может быть сложно получить компенсацию при ущербе.',en:'It may be difficult to get compensation if losses occur.'}, businessImpact:{ru:'Реальные убытки могут остаться на вас.',en:'Real losses may remain with you.'}, whatToDo:{ru:'Попросить лимит ответственности и исключения для грубой неосторожности.',en:'Ask for a liability cap and carve-outs for gross negligence.'}, questionForMavenLex:{ru:'Достаточно ли защищены мои убытки?',en:'Are my losses protected enough?'}, suggestedDraft:{ru:'Ответственность ограничена суммой оплат за последние 3 месяца, кроме умысла и грубой неосторожности.',en:'Liability is capped at fees paid in the last 3 months except for intent and gross negligence.'}, worstCaseScenario:{ru:'Ущерб возникнет, но договор не даст взыскать компенсацию.',en:'Losses occur, but the contract prevents recovery.'} }
  ],
  worstCaseScenarios: [{ title:{ru:'Внезапное прекращение',en:'Sudden termination'}, scenario:{ru:'Контрагент прекращает договор без времени на исправление.',en:'Counterparty ends the contract without cure time.'}, prevention:{ru:'Добавить notice + cure period.',en:'Add notice + cure period.'} }],
  actionPlan: { ru:['Не подписывать текущую редакцию без правок.', 'Запросить правки по High risk пунктам.', 'Проверить спорные пункты перед подписанием.'], en:['Do not sign current version without edits.', 'Request edits for High risk clauses.', 'Run a deeper check before signing.'] },
  todayPlan: { ru:['Не подписывать текущую редакцию.', 'Запросить правки по расторжению и ответственности.', 'Сохранить договор и переписку.', 'Подготовить что проверить.'], en:['Do not sign the current version.', 'Request edits to termination and liability.', 'Save the contract and correspondence.', 'Prepare verification points.'] },
  dontDo: { ru:['Не подписывать “потом поправим”.', 'Не признавать нарушение письменно.', 'Не платить штраф без расчёта.', 'Не удалять переписку.'], en:['Do not sign “we will fix later”.', 'Do not admit breach in writing.', 'Do not pay a penalty without calculation.', 'Do not delete correspondence.'] },
  alreadySignedPlan: { ru:['Соберите договор и приложения.', 'Сохраните переписку, счета и акты.', 'Проверьте, какой пункт применяют против вас.', 'Попросите письменное обоснование требований.', 'Проверьте, как снизить последствия и зафиксировать позицию.'], en:['Collect the contract and attachments.', 'Save correspondence, invoices and acts.', 'Check which clause is being used against you.', 'Ask for written justification.', 'Check how to reduce consequences and document your position.'] },
  MavenLexPackage: { ru:['Договор и приложения.', 'Переписка.', 'Счета/акты/оплаты.', 'Спорные пункты: расторжение, ответственность, штрафы.', 'Ваша цель: подписать после правок или снизить риск.'], en:['Contract and attachments.', 'Correspondence.', 'Invoices/acts/payments.', 'Disputed clauses: termination, liability, penalties.', 'Your goal: sign after edits or reduce risk.'] },
  moneyRisk: { ru:['Если сумма договора 2 000, штраф 15% = 300.', 'Точная сумма зависит от формулы, сроков и валюты.', 'Попросите лимит штрафа и письменный расчёт.'], en:['If the contract amount is 2,000, a 15% penalty = 300.', 'Exact amount depends on formula, timing and currency.', 'Ask for a penalty cap and written calculation.'] },
  counterpartyMessages: { soft:{ru:'Здравствуйте. Просим спокойно уточнить пункты о расторжении и ответственности перед подписанием.', en:'Hello. We would like to clarify termination and liability before signing.'}, neutral:{ru:'Здравствуйте. Просим направить новую редакцию с уведомлением, сроком на исправление и лимитом ответственности.', en:'Hello. Please send a revised version with notice, cure period and liability cap.'}, firm:{ru:'Здравствуйте. В текущей редакции мы не готовы подписывать договор без правок по расторжению и ответственности.', en:'Hello. We are not ready to sign the current version without edits to termination and liability.'} },
  roleRecommendations: { customer:{ru:['Проверьте ответственность исполнителя и возврат денег.', 'Попросите сроки, качество и право выхода.'], en:['Check provider liability and refund process.', 'Ask for deadlines, quality obligations and exit rights.']}, provider:{ru:['Проверьте штрафы и лимит ответственности.', 'Попросите оплату этапами и порядок приёмки.'], en:['Check penalties and liability cap.', 'Ask for milestone payments and acceptance process.']}, unknown:{ru:['Уточните роль: заказчик или исполнитель.', 'Один пункт может быть выгоден одной стороне и опасен другой.'], en:['Clarify role: customer or provider.', 'The same clause may help one side and harm the other.']} },
  negotiationMessage: { ru:'Здравствуйте! Просим скорректировать пункты о расторжении и ответственности перед подписанием.', en:'Hello, please adjust termination and liability clauses before signing.' },
  MavenLexQuestions: [{ru:'Можно ли добавить срок на исправление нарушения?',en:'Can we add a cure period?'}],
  suggestedEdits: [],
  redline: [],
  timeline: [],
  voiceScript: { ru:'Кратко: договор средне-высокого риска. Главные зоны: расторжение и ответственность.', en:'Summary: medium-high risk. Main areas: termination and liability.' },
  disclaimer: { ru:'Информационный AI-анализ. AI-разбор MavenLex: проверяйте факты и актуальные нормы.', en:'MavenLex AI analysis: verify facts, documents and current rules.' }
};

async function fetchWithTimeout(url, options = {}, timeoutMs = 18000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}


function readCookie(name) {
  try {
    return document.cookie.split('; ').find(row => row.startsWith(`${encodeURIComponent(name)}=`))?.split('=')[1] || '';
  } catch (_) { return ''; }
}

function currentCsrfToken() {
  let sessionObject = null;
  try { sessionObject = JSON.parse(localStorage.getItem('mavenlexServerSession') || 'null'); } catch (_) {}
  return sessionObject?.session?.csrfToken || decodeURIComponent(readCookie('mavenlex_csrf') || '');
}

async function apiJson(path, body, token, method = 'POST') {
  const headers = { 'Content-Type': 'application/json' };
  // v3.3.3: prefer HttpOnly cookie sessions. Bearer token remains only as a legacy fallback.
  if (token) headers.Authorization = `Bearer ${token}`;
  const csrfToken = currentCsrfToken();
  if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(String(method || 'POST').toUpperCase())) headers['X-CSRF-Token'] = csrfToken;
  const res = await fetchWithTimeout(`${API}${path}`, { method, headers, credentials: 'include', body: body === undefined ? undefined : JSON.stringify(body) }, 18000);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed: ${res.status}`);
  return data;
}

function trackPublicEvent(type, payload = {}) {
  try {
    fetch(`${API}/api/analytics/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, path: location.pathname, payload })
    }).catch(() => { logoutServerSession(); });
  } catch (_) {}
}

function friendlyError(error, ru) {
  const msg = String(error?.message || error || '');
  if (msg.includes('aborted') || msg.includes('AbortError')) return ru ? 'Сервис долго не отвечает. Проверьте терминал VS Code и перезапустите npm run dev.' : 'Service timeout. Check the VS Code terminal and restart npm run dev.';
  if (msg.includes('Failed to fetch')) return ru ? 'Сервис недоступен. Локально запустите npm run dev; на .app проверьте /api/health.' : 'Service is unavailable. Locally run npm run dev; on .app check /api/health.';
  if (msg.includes('Authentication required')) return ru ? 'Войдите в аккаунт в Кабинете и повторите действие.' : 'Log in to Account in Account and try again.';
  if (msg.includes('Paid planId is required')) return ru ? 'Для оплаты выберите платный тариф Pro или Business.' : 'Choose a paid Pro or Business plan to start checkout.';
  if (msg.includes('Payments are not enabled')) return ru ? 'Платёжная система пока не включена владельцем сервиса.' : 'Payments are not enabled yet.';
  if (msg.includes('YooKassa') || msg.includes('Stripe') || msg.includes('required secrets')) return ru ? 'Оплата пока недоступна. Попробуйте позже или выберите другой тариф.' : 'Payments are not available yet. Try again later or choose another plan.';
  if (msg.includes('Payment not found')) return ru ? 'Платежная сессия не найдена. Вернитесь на тарифы и начните checkout заново.' : 'Payment session was not found. Return to Pricing and start checkout again.';
  if (msg.includes('AI не работает') || msg.includes('LIVE_AI_NOT_CONFIGURED') || msg.includes('LIVE_AI_FAILED') || msg.includes('LIVE_AI_WEAK_RESPONSE')) return ru ? msg : msg;
  if (msg.includes('AI budget exceeded') || msg.includes('AI_BUDGET_EXCEEDED')) return ru ? 'AI-бюджет тарифа исчерпан. Перейдите на более высокий тариф или дождитесь сброса лимита.' : 'The plan AI budget is exhausted. Upgrade or wait for the limit reset.';
  if (msg.includes('PLAN_LIMIT_REACHED') || msg.includes('limit reached')) return ru ? 'Месячный лимит тарифа закончился. Перейдите на более высокий тариф или дождитесь следующего месяца.' : 'The monthly plan limit is reached. Upgrade the plan or wait until next month.';
  return msg;
}


const PLAN_LIMITS = {
  free: { reviews: 3, questions: 20, exports: 3 },
  pro: { reviews: 30, questions: 300, exports: 30 },
  business: { reviews: 200, questions: 2000, exports: 200 }
};
function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || ''); } catch { return fallback; }
}
function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function uid(prefix = 'ml') {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}
function monthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function cleanSnippet(value, max = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}
function historyTitle(item, ru) {
  if (item?.type === 'contract') return ru ? `Договор: ${item.fileName || 'без названия'}` : `Contract: ${item.fileName || 'untitled'}`;
  if (item?.type === 'situation') return ru ? 'Юридическая ситуация' : 'Legal situation';
  if (item?.type === 'document') return ru ? 'Сгенерированный документ' : 'Generated document';
  return ru ? 'Запись MavenLex' : 'MavenLex record';
}

function formatDateTime(value, ru) {
  if (!value) return '—';
  try { return new Date(value).toLocaleString(ru ? 'ru-RU' : 'en-US'); } catch (_) { return String(value); }
}
function historyKindLabel(item, ru) {
  if (item?.type === 'contract') return ru ? 'Анализ договора' : 'Contract review';
  if (item?.type === 'situation') return ru ? 'AI-вопрос' : 'AI question';
  if (item?.type === 'document') return ru ? 'Документ' : 'Document';
  return ru ? 'Запись' : 'Record';
}
function historyStatusLabel(item, ru) {
  if (item?.type === 'contract') {
    const score = Number(item.riskScore || item.payload?.riskScore || 0);
    if (score >= 80) return ru ? 'Высокий риск' : 'High risk';
    if (score >= 60) return ru ? 'Средний риск' : 'Medium risk';
    if (score > 0) return ru ? 'Умеренный риск' : 'Moderate risk';
  }
  return ru ? 'Сохранено' : 'Saved';
}
function historySummary(item, ru) {
  return item?.summary || item?.question || item?.fileName || (ru ? 'Без краткого описания' : 'No short summary');
}

function workspaceFolder(item) {
  return item?.folder || (item?.type === 'comparison' ? 'Сравнения' : item?.type === 'contract' ? 'Договоры' : item?.type === 'document' ? 'Документы' : 'Разное');
}
function workspaceRiskBucket(item) {
  const score = Number(item?.riskScore || item?.payload?.riskScore || 0);
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  if (score > 0) return 'low';
  return 'none';
}
function historyMatchesWorkspaceFilters(item, filters, query) {
  const q = String(query || '').trim().toLowerCase();
  if (filters.type !== 'all' && item.type !== filters.type) return false;
  if (filters.risk !== 'all' && workspaceRiskBucket(item) !== filters.risk) return false;
  if (filters.folder !== 'all' && workspaceFolder(item) !== filters.folder) return false;
  if (filters.view === 'favorites' && !item.favorite) return false;
  if (filters.view === 'archived' && !item.archived) return false;
  if (filters.view === 'active' && item.archived) return false;
  if (!q) return true;
  const haystack = [item.fileName, item.title, item.summary, item.notes, item.type, workspaceFolder(item)].join(' ').toLowerCase();
  return haystack.includes(q);
}


function escHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch]));
}
function listHtml(items = [], lang = 'ru') {
  const arr = Array.isArray(items) ? items : [];
  return arr.map(x => `<li>${escHtml(T(x, lang))}</li>`).join('');
}
function exportDateStamp() { return new Date().toISOString().slice(0, 10); }
function reportFileBase(report, fallback = 'mavenlex-report') {
  const source = report?.meta?.fileName || fallback;
  return String(source).replace(/\.[a-z0-9]+$/i, '').replace(/[^a-zа-яё0-9_-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 48) || fallback;
}
function riskLevelRu(level) {
  const v = String(level || '').toLowerCase();
  if (v === 'high') return 'Высокий';
  if (v === 'medium') return 'Средний';
  if (v === 'low') return 'Низкий';
  return level || '—';
}
function exportWatermark(plan, lang = 'ru') {
  const ru = lang === 'ru';
  return String(plan || 'free').toLowerCase() === 'free'
    ? (ru ? 'Free export · предварительный AI-анализ' : 'Free export · preliminary AI analysis')
    : (ru ? 'Professional MavenLex export' : 'Professional MavenLex export');
}
function professionalReportHtml(report, lang = 'ru', options = {}) {
  const ru = lang === 'ru';
  const date = new Date(report.meta?.generatedAt || Date.now()).toLocaleString(ru ? 'ru-RU' : 'en-US');
  const risks = report.risks || [];
  const high = risks.filter(r => r.level === 'High').length;
  const med = risks.filter(r => r.level === 'Medium').length;
  const plan = options.plan || report.meta?.plan || 'free';
  const checklist = buildSigningChecklist(report, lang);
  const decision = reportDecisionHelper(report, lang);
  const matrixRows = Object.entries(report.riskMatrix || {}).map(([key, item]) => `<tr><td>${escHtml(key)}</td><td>${escHtml(item.level || '')}</td><td>${escHtml(item.score || 0)}/100</td><td>${escHtml(T(item.reason, lang))}</td></tr>`).join('');
  const checklistHtml = checklist.map((x, i) => `<li><span class="checkMark">${i + 1}</span>${escHtml(x)}</li>`).join('');
  const rows = risks.map((r, i) => `<tr><td>${i + 1}</td><td>${escHtml(T(r.title, lang))}</td><td><b>${escHtml(r.level || '')}</b></td><td>${escHtml(r.score || '')}</td><td>${escHtml(T(r.whatToDo, lang))}</td></tr>`).join('');
  const detail = risks.map((r, i) => `<section class="risk"><h2>${i + 1}. ${escHtml(T(r.title, lang))}</h2><p class="level">${escHtml(r.level || '')} · ${escHtml(r.score || '')}/100</p><h3>${ru?'Фрагмент':'Excerpt'}</h3><blockquote>${escHtml(r.source || '')}</blockquote><h3>${ru?'Простыми словами':'Plain language'}</h3><p>${escHtml(T(r.plainLanguage, lang))}</p><h3>${ru?'Чем опасно':'Business impact'}</h3><p>${escHtml(T(r.businessImpact, lang))}</p><h3>${ru?'Что сделать':'Recommended action'}</h3><p>${escHtml(T(r.whatToDo, lang))}</p><h3>${ru?'Более безопасная формулировка':'Safer wording'}</h3><p>${escHtml(T(r.suggestedDraft, lang))}</p></section>`).join('');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>MavenLex Professional Contract Report</title><style>
    @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.45;margin:0;background:#fff}.watermark{position:fixed;right:14mm;bottom:10mm;color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.08em}.cover{border:1px solid #dbe3ee;border-radius:22px;padding:28px;margin-bottom:22px;background:linear-gradient(135deg,#f8fafc,#eef6ff)}.brand{font-size:13px;font-weight:800;letter-spacing:.12em;color:#0369a1;text-transform:uppercase}.title{font-size:34px;line-height:1.05;margin:10px 0 12px}.muted{color:#64748b}.score{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0}.box{border:1px solid #e2e8f0;border-radius:16px;padding:14px;background:#fff}.box span{display:block;color:#64748b;font-size:12px;font-weight:700}.box b{font-size:24px}.decisionBox{border:1px solid #bae6fd;background:#f0f9ff;border-radius:16px;padding:14px;margin:16px 0}.checklist{display:grid;gap:8px;padding:0;list-style:none}.checklist li{border:1px solid #e5e7eb;border-radius:12px;padding:10px;background:#fff}.checkMark{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:999px;background:#0f172a;color:#fff;font-size:12px;margin-right:8px}h2{font-size:22px;margin:24px 0 8px}h3{font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#475569;margin:16px 0 5px}table{width:100%;border-collapse:collapse;margin:12px 0 20px}th,td{border:1px solid #e5e7eb;padding:10px;vertical-align:top;text-align:left}th{background:#f8fafc}.risk{break-inside:avoid;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:14px}.level{font-weight:800;color:#991b1b}blockquote{margin:0;padding:12px 14px;border-left:4px solid #0f172a;background:#f8fafc;border-radius:8px}.disclaimer{margin-top:26px;padding:14px;border:1px solid #fde68a;background:#fffbeb;border-radius:14px;color:#92400e;font-weight:700}.footer{margin-top:22px;font-size:12px;color:#64748b}.printBtn{position:fixed;top:12px;right:12px;border:0;background:#0f172a;color:#fff;border-radius:999px;padding:10px 14px;font-weight:800}@media print{.printBtn{display:none}.cover{background:#f8fafc}.score{grid-template-columns:repeat(4,1fr)}}
  </style></head><body><button class="printBtn" onclick="window.print()">${ru?'Сохранить PDF':'Save PDF'}</button><div class="watermark">${escHtml(exportWatermark(plan, lang))}</div><section class="cover"><div class="brand">MavenLex</div><h1 class="title">${ru?'Отчёт по рискам договора':'Contract Risk Report'}</h1><p class="muted">${escHtml(T(report.summary, lang))}</p><div class="score"><div class="box"><span>${ru?'Риск':'Risk'}</span><b>${escHtml(report.riskScore || 0)}/100</b></div><div class="box"><span>${ru?'Статус':'Status'}</span><b>${escHtml(T(report.signatureReadiness?.text, lang))}</b></div><div class="box"><span>${ru?'High':'High'}</span><b>${high}</b></div><div class="box"><span>${ru?'Medium':'Medium'}</span><b>${med}</b></div></div><p class="muted">${ru?'Файл':'File'}: ${escHtml(report.meta?.fileName || 'contract')} · ${ru?'Дата':'Date'}: ${escHtml(date)} · ${ru?'Символов':'Characters'}: ${escHtml(report.meta?.extractedCharacters || '—')}</p></section><div class="decisionBox"><h2>${ru?'Итоговое решение':'Decision helper'}</h2><p><b>${escHtml(decision.label)}</b></p><p>${escHtml(decision.reason)}</p><p>${escHtml(decision.action)}</p></div><h2>${ru?'Рекомендация':'Recommendation'}</h2><p>${escHtml(T(report.decisionRecommendation, lang))}</p>${matrixRows ? `<h2>${ru?'Матрица рисков':'Risk matrix'}</h2><table><thead><tr><th>${ru?'Зона':'Area'}</th><th>${ru?'Уровень':'Level'}</th><th>Score</th><th>${ru?'Причина':'Reason'}</th></tr></thead><tbody>${matrixRows}</tbody></table>` : ''}<h2>${ru?'Таблица рисков':'Risk Table'}</h2><table><thead><tr><th>#</th><th>${ru?'Пункт':'Clause'}</th><th>${ru?'Риск':'Risk'}</th><th>Score</th><th>${ru?'Что сделать':'Action'}</th></tr></thead><tbody>${rows}</tbody></table><h2>${ru?'План действий':'Action Plan'}</h2><ol>${listHtml(T(report.actionPlan, lang), lang)}</ol><h2>${ru?'Чеклист перед подписанием':'Pre-signing checklist'}</h2><ol class="checklist">${checklistHtml}</ol><h2>${ru?'Что проверить':'Verification questions'}</h2><ol>${listHtml(report.MavenLexQuestions || [], lang)}</ol><h2>${ru?'Сообщение второй стороне':'Negotiation Message'}</h2><p>${escHtml(T(report.negotiationMessage, lang))}</p><h2>${ru?'Детальный разбор':'Detailed Review'}</h2>${detail}<div class="disclaimer">${escHtml(T(report.disclaimer, lang) || (ru?'Информационный AI-анализ. AI-разбор MavenLex: проверяйте факты и актуальные нормы.':'MavenLex AI analysis: verify facts, documents and current rules.'))}</div><div class="footer">Generated by MavenLex · ${ru?'MavenLex даёт AI-разбор: проверяйте факты, документы и актуальные нормы.':'Use MavenLex as an AI legal analysis system; verify facts and documents carefully.'}</div><script>setTimeout(()=>{}, 200)</script></body></html>`;
}
function downloadReportFile(report, lang, format, options = {}) {
  const html = professionalReportHtml(report, lang, options);
  const safeDate = exportDateStamp();
  const base = reportFileBase(report, 'mavenlex-contract-report');
  if (format === 'html') {
    downloadFile(`${base}-${safeDate}.html`, html, 'text/html;charset=utf-8');
    return;
  }
  if (format === 'doc' || format === 'docx') {
    const wordHtml = `<!doctype html><html><head><meta charset="utf-8"><title>MavenLex Word Export</title></head><body>${html.replace(/^[\s\S]*?<body[^>]*>|<script[\s\S]*?<\/script>|<\/body>[\s\S]*$/gi, '')}</body></html>`;
    downloadFile(`${base}-${safeDate}.doc`, wordHtml, 'application/msword;charset=utf-8');
    return;
  }
  if (format === 'json') {
    downloadFile(`${base}-${safeDate}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), app: 'MavenLex', report }, null, 2), 'application/json;charset=utf-8');
    return;
  }
  const w = window.open('', '_blank');
  if (!w) { alert(lang === 'ru' ? 'Разрешите popups, чтобы открыть PDF export.' : 'Allow popups to open PDF export.'); return; }
  w.document.write(html);
  w.document.close();
  setTimeout(() => { try { w.focus(); w.print(); } catch (_) {} }, 450);
}


function reportDecisionHelper(report, lang = 'ru') {
  const ru = lang === 'ru';
  const score = Number(report?.riskScore || 0);
  const risks = Array.isArray(report?.risks) ? report.risks : [];
  const high = risks.filter(r => r.level === 'High' || Number(r.score || 0) >= 80).length;
  const medium = risks.filter(r => r.level === 'Medium' || (Number(r.score || 0) >= 60 && Number(r.score || 0) < 80)).length;
  if (score >= 80 || high >= 2) return { tone:'critical', label: ru ? 'Не подписывать без правок' : 'Do not sign without edits', action: ru ? 'Сначала закрыть High-risk пункты и показать договор проверке.' : 'Close High-risk clauses first and show the contract to MavenLex.', reason: ru ? 'Есть условия, которые могут повлиять на деньги, ответственность или возможность выйти из договора.' : 'There are terms that may affect money, liability or your ability to exit the contract.' };
  if (score >= 60 || high || medium >= 2) return { tone:'warning', label: ru ? 'Можно обсуждать, но нужны уточнения' : 'Negotiable, but edits are needed', action: ru ? 'Запросить правки, получить новую редакцию и повторно проверить спорные пункты.' : 'Request edits, get a revised version and re-check disputed clauses.', reason: ru ? 'Риски не блокируют сделку автоматически, но подписывать “как есть” не стоит.' : 'The risks do not automatically block the deal, but signing as-is is not recommended.' };
  return { tone:'safe', label: ru ? 'Можно рассматривать подписание после финальной проверки' : 'Can be considered after final review', action: ru ? 'Проверить реквизиты, сроки, приложения и финальную версию перед подписью.' : 'Check details, deadlines, attachments and the final version before signing.', reason: ru ? 'Критичных рисков мало, но итоговое решение всё равно лучше принимать после проверки деталей.' : 'Few critical risks were found, but the final decision should still follow a details review.' };
}
function buildSigningChecklist(report, lang = 'ru') {
  const ru = lang === 'ru';
  const risks = Array.isArray(report?.risks) ? report.risks : [];
  const riskNames = risks.slice(0, 3).map(r => T(r.title, lang)).filter(Boolean);
  const base = ru ? [
    'Понятны стороны договора, реквизиты и полномочия подписантов.',
    'Сроки оплаты, поставки/оказания услуг и приёмки написаны конкретно.',
    'Штрафы, пени и ответственность ограничены разумным пределом.',
    'Есть понятный порядок расторжения и срок на исправление нарушения.',
    'Понятно, что считается нарушением и какие доказательства нужны.',
    'Приложения, счета, акты и техническое задание совпадают с договором.',
    'Спорные пункты проверены MavenLex перед подписанием.'
  ] : [
    'Parties, company details and signing authority are clear.',
    'Payment, delivery/service and acceptance deadlines are specific.',
    'Penalties and liability are capped at a reasonable level.',
    'Termination process and cure period are clear.',
    'Breach triggers and required evidence are clear.',
    'Attachments, invoices, acceptance acts and specifications match the contract.',
    'Disputed clauses are checked by MavenLex before signing.'
  ];
  if (riskNames.length) base.unshift(ru ? `Отдельно проверить найденные риски: ${riskNames.join(', ')}.` : `Specifically review detected risks: ${riskNames.join(', ')}.`);
  return base.slice(0, 8);
}
function reportShareText(report, lang = 'ru', part = 'summary') {
  const ru = lang === 'ru';
  const risks = Array.isArray(report?.risks) ? report.risks : [];
  const decision = reportDecisionHelper(report, lang);
  const checklist = buildSigningChecklist(report, lang);
  const topRisks = [...risks].sort((a,b)=>Number(b.score||0)-Number(a.score||0)).slice(0,5);
  const MavenLexQs = (report?.MavenLexQuestions || []).map(x => T(x, lang)).filter(Boolean).slice(0,5);
  const actions = (Array.isArray(T(report?.actionPlan, lang)) ? T(report?.actionPlan, lang) : []).slice(0,5);
  if (part === 'risks') return `${ru?'Ключевые риски MavenLex':'MavenLex key risks'}\n\n${topRisks.map((r,i)=>`${i+1}. ${T(r.title, lang)} — ${r.level || 'Risk'} ${r.score || '—'}/100\n${T(r.whatToDo, lang)}`).join('\n\n')}`;
  if (part === 'questions') return `${ru?'Вопросы для проверки/контрагента':'Questions to verify/counterparty'}\n\n${(MavenLexQs.length ? MavenLexQs : topRisks.map(r=>T(r.questionForMavenLex,lang)).filter(Boolean)).map((x,i)=>`${i+1}. ${x}`).join('\n')}`;
  if (part === 'checklist') return `${ru?'Чеклист перед подписанием':'Pre-signing checklist'}\n\n${checklist.map((x,i)=>`${i+1}. ${x}`).join('\n')}`;
  if (part === 'decision') return `${ru?'Решение по договору':'Contract decision'}\n\n${decision.label}\n${decision.reason}\n${decision.action}`;
  return `${ru?'Краткое резюме MavenLex':'MavenLex short summary'}\n\n${T(report?.summary, lang)}\n\n${ru?'Оценка риска':'Risk score'}: ${report?.riskScore || 0}/100\n${ru?'Решение':'Decision'}: ${decision.label}\n${ru?'Следующее действие':'Next action'}: ${decision.action}\n\n${actions.length ? (ru?'План действий':'Action plan') + '\n' + actions.map((x,i)=>`${i+1}. ${x}`).join('\n') : ''}`;
}
function reportMarkdown(report, lang = 'ru') {
  const ru = lang === 'ru';
  const risks = Array.isArray(report?.risks) ? report.risks : [];
  const decision = reportDecisionHelper(report, lang);
  const checklist = buildSigningChecklist(report, lang);
  const actions = (Array.isArray(T(report?.actionPlan, lang)) ? T(report?.actionPlan, lang) : []).slice(0,8);
  const MavenLexQs = (report?.MavenLexQuestions || []).map(x => T(x, lang)).filter(Boolean).slice(0,8);
  const date = new Date(report?.meta?.generatedAt || Date.now()).toLocaleString(ru ? 'ru-RU' : 'en-US');
  return `# MavenLex — ${ru?'AI-анализ договора':'AI Contract Analysis'}\n\n` +
    `**${ru?'Файл':'File'}:** ${report?.meta?.fileName || '—'}\n` +
    `**${ru?'Дата':'Date'}:** ${date}\n` +
    `**${ru?'Risk score':'Risk score'}:** ${report?.riskScore || 0}/100\n` +
    `**${ru?'Решение':'Decision'}:** ${decision.label}\n\n` +
    `## ${ru?'Краткое резюме':'Summary'}\n${T(report?.summary, lang)}\n\n` +
    `## ${ru?'Decision helper':'Decision helper'}\n${decision.reason}\n\n${decision.action}\n\n` +
    `## ${ru?'Ключевые риски':'Key risks'}\n` +
    (risks.length ? risks.map((r,i)=>`${i+1}. **${T(r.title, lang)}** — ${r.level || 'Risk'} ${r.score || '—'}/100\n   - ${ru?'Почему важно':'Why it matters'}: ${T(r.businessImpact, lang)}\n   - ${ru?'Что сделать':'What to do'}: ${T(r.whatToDo, lang)}`).join('\n') : (ru?'Риски не найдены.':'No risks detected.')) +
    `\n\n## ${ru?'Чеклист перед подписанием':'Pre-signing checklist'}\n${checklist.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\n` +
    `## ${ru?'Следующие действия':'Next actions'}\n${actions.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\n` +
    `## ${ru?'Что проверить/контрагенту':'Questions to verify/counterparty'}\n${MavenLexQs.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\n` +
    `---\n${T(report?.disclaimer, lang) || (ru?'MavenLex даёт AI-разбор, риски, действия и готовые формулировки.':'MavenLex is not legal advice.')}`;
}
function downloadReportText(report, lang = 'ru', format = 'md') {
  const safeDate = new Date().toISOString().slice(0,10);
  const content = reportMarkdown(report, lang);
  if (format === 'txt') downloadFile(`mavenlex-report-${safeDate}.txt`, content.replace(/^#+\s?/gm, ''), 'text/plain;charset=utf-8');
  else downloadFile(`mavenlex-report-${safeDate}.md`, content, 'text/markdown;charset=utf-8');
}
async function copyReportPart(report, lang = 'ru', part = 'summary') {
  const text = reportShareText(report, lang, part);
  await navigator.clipboard?.writeText(text);
  return text;
}

function comparisonMarkdown(report, lang = 'ru') {
  const ru = lang === 'ru';
  const risks = report?.riskChanges || [];
  const clauses = report?.clauseChanges || [];
  const focus = T(report?.negotiationFocus, lang) || [];
  const actions = T(report?.nextActions, lang) || [];
  return `# MavenLex — ${ru?'сравнение версий договора':'contract version comparison'}\n\n` +
    `**${ru?'Старая версия':'Old version'}:** ${report?.before?.riskScore ?? '—'}/100\n` +
    `**${ru?'Новая версия':'New version'}:** ${report?.after?.riskScore ?? '—'}/100\n` +
    `**${ru?'Изменение риска':'Risk delta'}:** ${report?.riskDelta >= 0 ? '+' : ''}${report?.riskDelta ?? '—'}\n\n` +
    `## ${ru?'Итог':'Decision'}\n${T(report?.decision, lang)}\n\n` +
    `## ${ru?'Изменения рисков':'Risk changes'}\n${risks.map((r,i)=>`${i+1}. ${T(r.title, lang)} — ${r.beforeScore} → ${r.afterScore} (${r.type})`).join('\n') || (ru?'Существенных изменений риска не найдено.':'No material risk changes found.')}\n\n` +
    `## ${ru?'Изменения пунктов':'Clause changes'}\n${clauses.map((c,i)=>`${i+1}. ${T(c.title, lang)} — ${c.beforeStatus} → ${c.afterStatus}`).join('\n') || (ru?'Существенных изменений пунктов не найдено.':'No material clause changes found.')}\n\n` +
    `## ${ru?'Фокус переговоров':'Negotiation focus'}\n${focus.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\n` +
    `## ${ru?'Следующие действия':'Next actions'}\n${actions.map((x,i)=>`${i+1}. ${x}`).join('\n')}\n\n` +
    `---\n${T(report?.disclaimer, lang)}`;
}
function professionalComparisonHtml(report, lang = 'ru') {
  const ru = lang === 'ru';
  const risks = report?.riskChanges || [];
  const clauses = report?.clauseChanges || [];
  const rows = risks.map((r, i) => `<tr><td>${i + 1}</td><td>${escHtml(T(r.title, lang))}</td><td>${escHtml(r.beforeScore ?? '—')}</td><td>${escHtml(r.afterScore ?? '—')}</td><td>${escHtml(T(r.action, lang) || T(r.recommendation, lang))}</td></tr>`).join('');
  const clauseRows = clauses.map((c, i) => `<tr><td>${i + 1}</td><td>${escHtml(T(c.title, lang))}</td><td>${escHtml(c.beforeStatus || '—')}</td><td>${escHtml(c.afterStatus || '—')}</td><td>${escHtml(T(c.recommendation, lang))}</td></tr>`).join('');
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>MavenLex Contract Comparison</title><style>@page{size:A4;margin:14mm}body{font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.45}.cover{border:1px solid #dbe3ee;border-radius:22px;padding:24px;background:#f8fafc;margin-bottom:18px}.brand{text-transform:uppercase;letter-spacing:.12em;color:#0369a1;font-weight:800;font-size:12px}h1{font-size:32px;margin:8px 0}.score{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.box{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px}.box b{font-size:22px}table{width:100%;border-collapse:collapse;margin:12px 0}td,th{border:1px solid #e5e7eb;padding:10px;text-align:left;vertical-align:top}th{background:#f8fafc}.disclaimer{margin-top:20px;padding:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:12px;color:#92400e;font-weight:700}.printBtn{position:fixed;top:12px;right:12px;border:0;background:#0f172a;color:#fff;border-radius:999px;padding:10px 14px;font-weight:800}@media print{.printBtn{display:none}}</style></head><body><button class="printBtn" onclick="window.print()">${ru?'Сохранить PDF':'Save PDF'}</button><section class="cover"><div class="brand">MavenLex</div><h1>${ru?'Сравнение версий договора':'Contract Version Comparison'}</h1><p>${escHtml(T(report?.summary, lang) || T(report?.decision, lang))}</p><div class="score"><div class="box"><span>${ru?'Старая версия':'Old version'}</span><br><b>${report?.before?.riskScore ?? '—'}/100</b></div><div class="box"><span>${ru?'Новая версия':'New version'}</span><br><b>${report?.after?.riskScore ?? '—'}/100</b></div><div class="box"><span>${ru?'Изменение':'Delta'}</span><br><b>${report?.riskDelta >= 0 ? '+' : ''}${report?.riskDelta ?? '—'}</b></div></div></section><h2>${ru?'Итог':'Decision'}</h2><p>${escHtml(T(report?.decision, lang))}</p><h2>${ru?'Изменения рисков':'Risk changes'}</h2><table><thead><tr><th>#</th><th>${ru?'Риск':'Risk'}</th><th>${ru?'Было':'Before'}</th><th>${ru?'Стало':'After'}</th><th>${ru?'Действие':'Action'}</th></tr></thead><tbody>${rows}</tbody></table><h2>${ru?'Изменения пунктов':'Clause changes'}</h2><table><thead><tr><th>#</th><th>${ru?'Пункт':'Clause'}</th><th>${ru?'Было':'Before'}</th><th>${ru?'Стало':'After'}</th><th>${ru?'Комментарий':'Comment'}</th></tr></thead><tbody>${clauseRows}</tbody></table><h2>${ru?'Фокус переговоров':'Negotiation focus'}</h2><ol>${listHtml(T(report?.negotiationFocus, lang), lang)}</ol><h2>${ru?'Сообщение контрагенту':'Counterparty message'}</h2><p>${escHtml(T(report?.counterpartyMessage, lang))}</p><div class="disclaimer">${escHtml(T(report?.disclaimer, lang) || (ru?'Информационный AI-анализ. AI-разбор MavenLex: проверяйте факты и актуальные нормы.':'MavenLex AI analysis: verify facts, documents and current rules.'))}</div></body></html>`;
}
function downloadComparison(report, lang = 'ru', format = 'md') {
  const safeDate = exportDateStamp();
  const content = comparisonMarkdown(report, lang);
  if (format === 'txt') downloadFile(`mavenlex-comparison-${safeDate}.txt`, content.replace(/^#+\s?/gm, ''), 'text/plain;charset=utf-8');
  else if (format === 'html') downloadFile(`mavenlex-comparison-${safeDate}.html`, professionalComparisonHtml(report, lang), 'text/html;charset=utf-8');
  else if (format === 'doc') downloadFile(`mavenlex-comparison-${safeDate}.doc`, professionalComparisonHtml(report, lang), 'application/msword;charset=utf-8');
  else if (format === 'json') downloadFile(`mavenlex-comparison-${safeDate}.json`, JSON.stringify({ exportedAt: new Date().toISOString(), app: 'MavenLex', comparison: report }, null, 2), 'application/json;charset=utf-8');
  else if (format === 'pdf') { const w = window.open('', '_blank'); if (!w) return alert(lang === 'ru' ? 'Разрешите popups, чтобы открыть PDF export.' : 'Allow popups to open PDF export.'); w.document.write(professionalComparisonHtml(report, lang)); w.document.close(); setTimeout(() => { try { w.focus(); w.print(); } catch (_) {} }, 450); }
  else downloadFile(`mavenlex-comparison-${safeDate}.md`, content, 'text/markdown;charset=utf-8');
}
async function copyComparisonPart(report, lang = 'ru', part = 'decision') {
  const ru = lang === 'ru';
  let text = '';
  if (part === 'risks') text = (report?.riskChanges || []).map((r,i)=>`${i+1}. ${T(r.title, lang)}: ${r.beforeScore} → ${r.afterScore}`).join('\n');
  else if (part === 'clauses') text = (report?.clauseChanges || []).map((c,i)=>`${i+1}. ${T(c.title, lang)}: ${c.beforeStatus} → ${c.afterStatus}`).join('\n');
  else if (part === 'message') text = T(report?.counterpartyMessage, lang);
  else text = `${ru?'Итог сравнения':'Comparison decision'}: ${T(report?.decision, lang)}\n${ru?'Изменение риска':'Risk delta'}: ${report?.riskDelta >= 0 ? '+' : ''}${report?.riskDelta}`;
  await navigator.clipboard?.writeText(text || comparisonMarkdown(report, lang));
  return text;
}


function showMavenlexToast(text) {
  const previous = document.querySelector('.mavenlex-toast');
  previous?.remove?.();
  const el = document.createElement('div');
  el.className = 'mavenlex-toast';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

function App() {
  const [route, setRoute] = useState(routeFromPath(location.pathname));
  const [lang, setLang] = useState(languageFromPath(location.pathname));
  const [theme, setTheme] = useState(localStorage.mavenlexTheme || 'ivory');
  const [jurisdiction, setJurisdiction] = useState(localStorage.jurisdiction || 'Sweden');
  const [report, setReport] = useState(() => JSON.parse(localStorage.lastReport || 'null'));
  const [builtContract, setBuiltContract] = useState(() => JSON.parse(localStorage.builtContract || 'null'));
  const [selectedPlan, setSelectedPlan] = useState(localStorage.mavenlexPlan || 'free');
  const [user, setUser] = useState(() => readJson('mavenlexUser', null));
  const [serverSession, setServerSession] = useState(() => readJson('mavenlexServerSession', null));
  const [history, setHistory] = useState(() => readJson('mavenlexHistory', []));
  const [usage, setUsage] = useState(() => readJson('mavenlexUsage', { month: monthKey(), reviews: 0, questions: 0, exports: 0 }));
  const [apiOk, setApiOk] = useState('checking');
  const [apiMessage, setApiMessage] = useState('');
  const [publicConfig, setPublicConfig] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const ru = lang === 'ru';

  useEffect(() => {
    const handler = (e) => {
      const btn = e.target?.closest?.('button');
      if (btn && !btn.disabled) {
        btn.classList.add('mavenlex-pressed');
        setTimeout(() => btn.classList.remove('mavenlex-pressed'), 180);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    localStorage.lang = lang;
    localStorage.mavenlexTheme = theme;
    document.body.classList.toggle('theme-navy', theme === 'navy');
    document.body.classList.toggle('theme-ivory', theme !== 'navy');
  }, [theme, lang]);

  useEffect(() => {
    const ui = publicConfig?.ui || {};
    const colors = ui.colors || {};
    const root = document.documentElement;
    const setVar = (name, value) => { if (value) root.style.setProperty(name, String(value)); };
    setVar('--admin-primary', colors.primary || '#0f172a');
    setVar('--admin-accent', colors.accent || '#2563eb');
    setVar('--admin-cta', colors.cta || '#1f1408');
    setVar('--admin-cta-text', colors.ctaText || '#ffffff');
    setVar('--admin-frame', colors.frame || 'rgba(15,23,42,.12)');
    setVar('--admin-surface', colors.surface || '#ffffff');
    setVar('--admin-muted', colors.muted || '#64748b');
    setVar('--admin-navy-bg', colors.navyBg || '#06182f');
    setVar('--admin-navy-card', colors.navyCard || 'rgba(13,42,74,.86)');
    setVar('--admin-navy-text', colors.navyText || '#eaf6ff');
    document.body.dataset.buttonStyle = ui.buttonStyle || 'premium-pill';
    document.body.dataset.frameStyle = ui.frameStyle || 'soft-glass';
    document.body.dataset.textStyle = ui.textStyle || 'high-contrast';
    document.body.classList.toggle('text-underlined', ui.underlineImportant === true);
    document.body.classList.toggle('compact-hero-enabled', ui.compactHero !== false);
  }, [publicConfig]);

  useEffect(() => {
    localStorage.lang = lang;
    localStorage.jurisdiction = jurisdiction;
    document.documentElement.lang = lang;
    document.title = UI_COPY[lang].appTitle;
    let description = document.querySelector('meta[name="description"]');
    if (!description) { description = document.createElement('meta'); description.setAttribute('name', 'description'); document.head.appendChild(description); }
    description.setAttribute('content', UI_COPY[lang].appDescription);
    let ogLocale = document.querySelector('meta[property="og:locale"]');
    if (!ogLocale) { ogLocale = document.createElement('meta'); ogLocale.setAttribute('property', 'og:locale'); document.head.appendChild(ogLocale); }
    ogLocale.setAttribute('content', lang === 'ru' ? 'ru_RU' : 'en_US');
  }, [lang, jurisdiction]);
  useEffect(() => {
    fetch(`${API}/api/health`).then(async r => {
      if (!r.ok) throw new Error('Service health check failed');
      const data = await r.json();
      setApiOk('online');
      setApiMessage(data.service || 'Service online');
    }).catch(() => { setApiOk('offline'); setApiMessage('Service offline: run npm run dev'); });
    fetch(`${API}/api/public/config`).then(r=>r.json()).then(d=>setPublicConfig(d.designSettings || null)).catch(()=>{});
    fetch(`${API}/api/ai/status`).then(r=>r.json()).then(d=>setAiStatus(d)).catch(()=>{});
    apiJson('/api/auth/me', undefined, undefined, 'GET')
      .then(data => {
        if (data?.user) {
          saveServerSession({ user: data.user, session: data.session, usage: data.usage, usageLimits: data.usageLimits });
          if (data.user.preferredLanguage) setLang(normalizeLanguage(data.user.preferredLanguage, lang));
        }
      })
      .catch(() => {});
    const onPop = () => { const nextLang = languageFromPath(location.pathname); setLang(nextLang); setRoute(routeFromPath(location.pathname)); };
    addEventListener('popstate', onPop); return () => removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    trackPublicEvent('page_view', { route, lang });
  }, [route, lang]);
  useEffect(() => {
    translateDomUi(lang);
    const observer = new MutationObserver(() => translateDomUi(lang));
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label'] });
    return () => observer.disconnect();
  }, [lang, route, report, builtContract, serverSession]);

  function switchLanguage(nextLang) {
    const normalized = normalizeLanguage(nextLang, lang);
    setLang(normalized);
    localStorage.lang = normalized;
    window.history.replaceState({}, '', localizedPath(route, normalized));
    if (serverSession?.user) {
      apiJson('/api/user/profile', { preferredLanguage: normalized }, serverSession, 'PATCH').catch(err => console.warn('[language sync]', err.message));
    }
  }

  function go(path) { const nextPath = localizedPath(path, lang); window.history.pushState({}, '', nextPath); setRoute(path); scrollTo({ top:0, behavior:'smooth' }); }
  function addHistoryItem(item) {
    const next = [{ ...item, id: item.id || uid('hist'), createdAt: item.createdAt || new Date().toISOString() }, ...history].slice(0, 30);
    setHistory(next);
    writeJson('mavenlexHistory', next);
    if (serverSession?.user) {
      apiJson('/api/user/history', { item: next[0] }, undefined).catch(err => console.warn('[server history sync]', err.message));
    }
  }
  function removeHistoryItem(id) {
    const next = history.filter(x => x.id !== id);
    setHistory(next);
    writeJson('mavenlexHistory', next);
    if (serverSession?.user) {
      apiJson(`/api/user/history/${encodeURIComponent(id)}`, undefined, undefined, 'DELETE').catch(err => console.warn('[server history delete]', err.message));
    }
  }  function updateHistoryItem(id, patch) {
    const next = history.map(x => x.id === id ? { ...x, ...patch, updatedAt: new Date().toISOString() } : x);
    setHistory(next);
    writeJson('mavenlexHistory', next);
    if (serverSession?.user) {
      apiJson(`/api/user/history/${encodeURIComponent(id)}`, patch, undefined, 'PATCH').catch(err => console.warn('[server history update]', err.message));
    }
  }

  function clearHistory() {
    setHistory([]);
    writeJson('mavenlexHistory', []);
    if (serverSession?.user) {
      apiJson('/api/user/history/clear', {}, undefined, 'POST').catch(err => console.warn('[server history clear]', err.message));
    }
  }
  function bumpUsage(kind) {
    const base = usage.month === monthKey() ? usage : { month: monthKey(), reviews: 0, questions: 0, exports: 0 };
    const next = { ...base, [kind]: Number(base[kind] || 0) + 1 };
    setUsage(next);
    writeJson('mavenlexUsage', next);
  }
  function saveReport(r) {
    setReport(r);
    localStorage.lastReport = JSON.stringify(r);
    bumpUsage('reviews');
    addHistoryItem({
      type: 'contract',
      fileName: r?.meta?.fileName || 'contract',
      riskScore: r?.riskScore || 0,
      summary: cleanSnippet(T(r?.summary, lang), 220),
      payload: r
    });
    go('/report');
  }
  function saveContract(c) {
    setBuiltContract(c);
    localStorage.builtContract = JSON.stringify(c);
    addHistoryItem({ type: 'document', summary: cleanSnippet(T(c?.summary || c?.contractText, lang), 220), payload: c });
  }
  function choosePlan(plan) { setSelectedPlan(plan); localStorage.mavenlexPlan = plan; trackPublicEvent('plan_selected', { plan }); }
  function saveUser(profile) { const next = { ...profile, createdAt: profile.createdAt || new Date().toISOString() }; setUser(next); writeJson('mavenlexUser', next); }
  function logoutUser() { setUser(null); localStorage.removeItem('mavenlexUser'); }
  function saveServerSession(data) {
    const publicSession = data?.session ? { id: data.session.id, expiresAt: data.session.expiresAt, csrfToken: data.session.csrfToken, mode: data.session.mode || 'cookie' } : null;
    const next = data ? { user: data.user, session: publicSession, usage: data.usage } : null;
    setServerSession(next);
    if (next) writeJson('mavenlexServerSession', next); else localStorage.removeItem('mavenlexServerSession');
  }
  function logoutServerSession() { setServerSession(null); localStorage.removeItem('mavenlexServerSession'); }

  const ctx = { selectedPlan, choosePlan, theme, setTheme, publicConfig, setPublicConfig, aiStatus, setAiStatus, user, saveUser, logoutUser, history, addHistoryItem, removeHistoryItem, updateHistoryItem, clearHistory, usage, bumpUsage, lang, setLang: switchLanguage, ru, jurisdiction, setJurisdiction, report, saveReport, builtContract, saveContract, go, apiOk, apiMessage, serverSession, saveServerSession, logoutServerSession };
  const routeAllowed = canAccessRoute(route, serverSession?.user?.role);
  return <>
    <Shell {...ctx} route={route} />
    {!routeAllowed ? <AccessDeniedPage {...ctx} /> : <>
    {route === '/home' && <Home {...ctx} />}
    {route === '/analyze' && <Analyze {...ctx} />}
    {route === '/compare' && <CompareContracts {...ctx} />}
    {route === '/situation' && <SituationNavigator {...ctx} />}
    {route === '/builder' && <Builder {...ctx} builtContract={builtContract} />}
    {route === '/law' && <LawArticleSearch {...ctx} />}
    {route === '/dashboard' && <Dashboard {...ctx} />}
    {route === '/pricing' && <Pricing {...ctx} />}
    {route === '/onboarding' && <OnboardingFlow {...ctx} />}
    {route === '/launch' && <LaunchReadinessPage {...ctx} />}
    {route === '/qa' && <BrowserQaPage {...ctx} />}
    {route === '/billing/success' && <BillingResult {...ctx} kind="success" />}
    {route === '/billing/cancel' && <BillingResult {...ctx} kind="cancel" />}
    {route === '/subscription-required' && <SubscriptionRequiredPage {...ctx} />}
    {route === '/access-denied' && <AccessDeniedPage {...ctx} />}
    {route === '/account' && <Account {...ctx} />}
    {route === '/reset-password' && <ResetPasswordPage {...ctx} />}
    {route === '/verify-email' && <VerifyEmailPage {...ctx} />}
    {route === '/admin' && <AdminMonitoring {...ctx} />}
    {route === '/report' && <Report {...ctx} report={report || showcaseReport} />}
    {route === '/favorites' && <FavoritesPage {...ctx} />}
    {route === '/settings' && <Settings {...ctx} />}
    {route === '/legal' && <LegalCenter {...ctx} />}
    {route === '/privacy' && <LegalPage {...ctx} kind="privacy" />}
    {route === '/terms' && <LegalPage {...ctx} kind="terms" />}
    {route === '/security' && <LegalPage {...ctx} kind="security" />}
    {route === '/faq' && <PublicFaqPage {...ctx} />}
    {route === '/ai-contract-analysis' && <GrowthLanding {...ctx} kind="ai" />}
    {route === '/contract-risk-analysis' && <GrowthLanding {...ctx} kind="risk" />}
    {route === '/business-contract-review' && <GrowthLanding {...ctx} kind="business" />}
    {route === '/ai-nda-analysis' && <GrowthLanding {...ctx} kind="nda" />}
    {route === '/ai-service-agreement-analysis' && <GrowthLanding {...ctx} kind="service" />}
    {route === '/ai-lease-analysis' && <GrowthLanding {...ctx} kind="lease" />}
    {route === '/contract-penalty-analysis' && <GrowthLanding {...ctx} kind="penalty" />}
    {route === '/check-contract-before-signing' && <GrowthLanding {...ctx} kind="check" />}
    {route === '/support' && <SupportPage {...ctx} />}
    {route === '/help' && <HelpPage {...ctx} />}
    {route === '/clauses' && <ClauseLibraryPage {...ctx} />}
    {route === '/rewrite' && <RewriteAssistantPage {...ctx} />}
    {!knownRoutes.has(route) && <NotFound {...ctx} route={route} />}
    </>}
    <PublicFooter ru={ru} go={go} />
  </>;
}


function SubscriptionRequiredPage({ ru, go, serverSession }) {
  return <main className="page statePage"><section className="glass stateHeroCard"><div className="eyebrow">SUBSCRIPTION REQUIRED</div><h1>{ru?'Нужен активный тариф':'Active plan required'}</h1><p>{ru?'Это действие доступно после входа и выбора подходящего тарифа.':'This action is available after login and plan selection.'}</p><div className="stateActionGrid">{!serverSession?.user && <button className="primary" onClick={()=>go('/account')}>{ru?'Войти':'Log in'}</button>}<button className="secondary" onClick={()=>go('/pricing')}>{ru?'Тарифы':'Pricing'}</button><button className="secondary" onClick={()=>go('/support')}>Support</button></div></section></main>;
}
function AccessDeniedPage({ ru, go, serverSession }) {
  return <main className="page statePage"><section className="glass stateHeroCard dangerState"><div className="eyebrow">ACCESS DENIED</div><h1>{ru?'Нет прав доступа':'Access denied'}</h1><p>{ru?'Эта область защищена ролью аккаунта.':'This area is protected by your account role.'}</p><div className="roleMiniPanel"><span>{ru?'Текущая роль':'Current role'}</span><b>{serverSession?.user?.role || (ru?'Гость':'Guest')}</b></div><div className="stateActionGrid"><button className="primary" onClick={()=>go('/account')}>{ru?'Кабинет':'Account'}</button><button className="secondary" onClick={()=>go('/home')}>{ru?'Главная':'Home'}</button></div></section></main>;
}

function NotFound({ ru, route, go }) {
  return <main className="page notFoundPage">
    <section className="glass notFoundCard">
      <div className="eyebrow">404</div>
      <h1>{ru?'Страница не найдена':'Page not found'}</h1>
      <p>{ru?'Такой страницы нет или ссылка устарела. Вернитесь на главную, в кабинет или к анализу договора.':'This page does not exist or the link is outdated. Go back home, to Account, or to contract analysis.'}</p>
      <small>{route}</small>
      <div className="notFoundActions">
        <button className="primary" onClick={()=>go('/home')}>{ru?'На главную':'Go home'}</button>
        <button className="secondary" onClick={()=>go('/analyze')}>{ru?'Анализ договора':'Analyze contract'}</button>
        <button className="secondary" onClick={()=>go('/account')}>{ru?'Кабинет':'Account'}</button>
      </div>
    </section>
  </main>;
}

function Shell({ lang, setLang, theme, setTheme, ru, route, go, apiOk, apiMessage, serverSession }) {
  const [navOpen, setNavOpen] = useState(false);
  const role = serverSession?.user?.role || '';
  const primaryItems = [['/home', ru?'Главная':'Home'], ['/analyze', ru?'Договор':'Contract'], ['/situation', ru?'Ситуация':'Situation'], ['/law', ru?'Статьи':'Articles'], ['/pricing', ru?'Тарифы':'Pricing'], ['/account', ru?'Кабинет':'Account']].filter(([p]) => navVisibleForRole(p, role));
  const secondaryItems = [['/compare', ru?'Сравнение':'Compare'], ['/builder', ru?'Документы':'Docs'], ['/dashboard', ru?'История':'History'], ['/favorites', ru?'Избранное':'Favorites'], ['/clauses', ru?'Пункты':'Clauses'], ['/rewrite', ru?'Правки':'Rewrite'], ['/legal', ru?'Доверие':'Trust'], ['/settings', ru?'Настройки':'Settings']].filter(([p]) => navVisibleForRole(p, role));
  const items = primaryItems;
  if (['local_admin','admin','owner'].includes(role)) { secondaryItems.push(['/admin', ru?'Админ':'Admin']); }
  const goAndClose = (path) => { go(path); setNavOpen(false); };
  return <header className={`topbar ${navOpen ? 'mobileOpen' : 'mobileClosed'}`}>
    <button
      className="mobileNavToggle"
      type="button"
      onClick={() => setNavOpen(v => !v)}
      aria-expanded={navOpen}
      aria-label={navOpen ? (ru ? 'Свернуть навигацию' : 'Collapse navigation') : (ru ? 'Открыть навигацию' : 'Open navigation')}
    >
      <span>{navOpen ? '×' : '☰'}</span>
      <b>{ru ? 'Меню' : 'Menu'}</b>
    </button>
    <div className="topbarPanel">
      <button className="brand" onClick={() => goAndClose('/home')}><span>⚖</span> MavenLex <em>Intelligent Legal Counsel</em></button>
      <nav className="mainNav">{items.map(([p,t]) => <button key={p} onClick={() => goAndClose(p)} className={route===p?'active':''}>{t}</button>)}<div className="moreNav"><button type="button" className={secondaryItems.some(([p])=>p===route)?'active':''}>{ru?'Ещё':'More'}</button><div className="moreNavMenu">{secondaryItems.map(([p,t]) => <button key={p} onClick={() => goAndClose(p)} className={route===p?'active':''}>{t}</button>)}</div></div></nav>
      <div className="right"><span className={`status ${apiOk}`} title={apiMessage}>{apiOk}</span><button title={ru?'Переключить цветовую тему':'Switch color theme'} onClick={() => setTheme(theme === 'navy' ? 'ivory' : 'navy')} className={theme==='navy'?'active themeToggle':'themeToggle'}>{theme==='navy'?(ru?'Тёмная':'Navy'):(ru?'Светлая':'Ivory')}</button><button title="Русский" onClick={() => { setLang('ru'); window.history.replaceState({}, '', localizedPath(route, 'ru')); }} className={lang==='ru'?'active':''}>RU</button><button title="English" onClick={() => { setLang('en'); window.history.replaceState({}, '', localizedPath(route, 'en')); }} className={lang==='en'?'active':''}>EN</button></div>
    </div>
  </header>;

}

function Home({ ru, go, report, builtContract, apiOk, selectedPlan, serverSession, publicConfig }) {
  const cms = publicConfig?.cms || {};
  const homeTitle = ru ? (cms.homeTitleRu || 'Договор → риски → действия') : (cms.homeTitleEn || 'Contract → risks → actions');
  const rawHomeLead = ru ? (cms.homeLeadRu || 'Можно ли подписывать, где риск и что делать дальше.') : (cms.homeLeadEn || 'Whether to sign, where the risk is and what to do next.');
  const homeLead = String(rawHomeLead || '').length > 64 ? String(rawHomeLead).slice(0, 61).trim() + '…' : rawHomeLead;
  const primaryCta = ru ? (cms.primaryCtaRu || 'Проверить договор') : (cms.primaryCtaEn || 'Review contract');
  const secondaryCta = ru ? (cms.secondaryCtaRu || 'Разобрать ситуацию') : (cms.secondaryCtaEn || 'Analyze situation');
  const actionCards = [
    {
      path: '/analyze',
      kicker: ru ? 'Договор' : 'Contract',
      title: ru ? 'Проверить договор' : 'Review a contract',
      text: ru ? 'Файл → риски → правки.' : 'File → risks → edits.',
      cta: ru ? 'Загрузить договор' : 'Upload contract'
    },
    {
      path: '/compare',
      kicker: ru ? 'Версии' : 'Versions',
      title: ru ? 'Сравнить две версии' : 'Compare two versions',
      text: ru ? 'Покажет изменения и новые риски.' : 'Shows changes and new risks.',
      cta: ru ? 'Сравнить версии' : 'Compare versions'
    },
    {
      path: '/situation',
      kicker: ru ? 'Проблема' : 'Situation',
      title: ru ? 'Разобрать ситуацию' : 'Analyze a situation',
      text: ru ? 'Проблема → безопасный план.' : 'Problem → safe plan.',
      cta: ru ? 'Получить план' : 'Get action plan'
    },
    {
      path: '/law',
      kicker: ru ? 'Закон' : 'Law',
      title: ru ? 'Найти статью РФ' : 'Find a Russian article',
      text: ru ? 'Статья → смысл → действия.' : 'Article → meaning → actions.',
      cta: ru ? 'Открыть поиск' : 'Open search'
    }
  ];

  return <main className="page homePage cleanHome">
    <section className="cleanHero glass premiumHero">
      <div className="heroCopy"><div className="premiumHalo" aria-hidden="true"></div>
        <div className="eyebrow executiveEyebrow">MAVENLEX INTELLIGENT LEGAL COUNSEL</div>
        <h1>{homeTitle}</h1>
        <p className="heroLead">{homeLead}</p>
        <div className="heroActions cleanHeroActions">
          <button className="primary large" onClick={()=>go('/analyze')}>{primaryCta}</button>
          <button className="secondary large" onClick={()=>go('/situation')}>{secondaryCta}</button>
        </div>
        <div className="trustRow compactTrust">
          <span>{apiOk === 'online' ? (ru?'AI-анализ доступен':'AI analysis available') : (ru?'AI временно недоступен':'AI temporarily unavailable')}</span>
          <span>{ru?'План действий':'Action plan'}</span>
          <span>{ru?'Безопасная обработка':'Secure processing'}</span>
        </div>
        <div className="launchTrustStrip"><b>{ru?'Доверие и безопасность уже внутри продукта':'Trust and security are already built in'}</b><span>{ru?'Аккаунт, экспорт данных, удаление профиля и Trust Center оформлены аккуратно и готовы для пользователей.':'Account security, data export, account deletion and the Trust Center are presented cleanly and are ready for real users.'}</span></div>
      </div>
      <div className="cleanHeroMemo">
        <span>{ru?'Формат ответа':'Answer format'}</span>
        <b>{ru?'Вывод → риски → действия':'Conclusion → risks → actions'}</b>
        <p>{ru?'Короткий вывод, понятные риски и следующие шаги без лишней воды.':'A short conclusion, clear risks and next steps without filler.'}</p>
      </div>
    </section>

    <section className="glass firstActionStrip v611">
      <div>
        <div className="eyebrow">FIRST USEFUL ACTION</div>
        <h2>{ru?'Начните с одного действия':'Start with one action'}</h2>
        <p>{ru?'Выберите задачу и сразу получите результат.':'Choose a task and get straight to the result.'}</p>
      </div>
      <div className="firstActionButtons">
        <button className="primary" onClick={()=>go('/analyze')}>{ru?'Проверить договор':'Review contract'}</button>
        <button className="secondary" onClick={()=>go('/situation')}>{ru?'Описать ситуацию':'Describe situation'}</button>
        <button className="secondary" onClick={()=>go('/law')}>{ru?'Найти статью':'Find article'}</button>
      </div>
    </section>

    <section className="glass multilingualStrip optionalHomeDetail"><div><div className="eyebrow">MULTILINGUAL READY</div><h2>{ru?'Русские и английские договоры':'Russian and English contracts'}</h2><p>{ru?'Интерфейс, отчёты и основные сценарии работают на русском и английском. Язык договора можно определить автоматически, а язык отчёта выбрать вручную.':'Interface, reports and core flows work in Russian and English. The document language can be detected automatically, while the report language can be selected manually.'}</p></div><div className="languagePills"><span>RU</span><span>EN</span><span>{ru?'Автоопределение':'Auto-detect'}</span></div></section>


    <section className="glass legalSpecializationShowcase optionalHomeDetail">
      <div>
        <div className="eyebrow">LEGAL SPECIALIZATION</div>
        <h2>{ru?'Юридические сценарии внутри MavenLex':'Legal scenarios inside MavenLex'}</h2>
        <p>{ru?'Разделы помогают быстро перейти к нужной задаче: договор, NDA, аренда, претензия или проверка политики.':'Sections help users jump straight to the right task: contract, NDA, lease, claim or policy review.'}</p>
      </div>
      <div className="legalScenarioGrid">
        {(ru ? ['Договор перед подписанием','NDA','Договор услуг','Аренда','Претензия','Privacy Policy'] : ['Pre-signing contract','NDA','Service agreement','Lease','Claim letter','Privacy Policy']).map(x => <button key={x} onClick={()=>go('/analyze')}>{x}</button>)}
      </div>
    </section>

    <section className="taskGrid premiumCards">
      {actionCards.map(card => <button className="glass taskCard premiumCard" key={card.path} onClick={()=>go(card.path)}>
        <span>{card.kicker}</span>
        <h2>{card.title}</h2>
        <p>{card.text}</p>
        <b>{card.cta} →</b>
      </button>)}
    </section>

    <section className="glass trustUploadBlock optionalHomeDetail">
      <div>
        <div className="eyebrow">SECURE DOCUMENT HANDLING</div>
        <h2>{ru?'Ваши документы обрабатываются аккуратно':'Your documents are handled carefully'}</h2>
        <p>{ru?'Файлы используются только для анализа. Текст договора не публикуется и не применяется для рекламы. Для конфиденциальных договоров можно заранее удалить персональные данные. AI-анализ MavenLex помогает быстрее увидеть риски, действия и готовые формулировки.':'Files are used only for analysis. Contract text is not published or used for advertising. For confidential contracts, remove personal data before uploading. MavenLex AI analysis helps detect risks faster and prepare focused next actions.'}</p>
      </div>
      <ul>
        <li>{ru?'Фокус на рисках, штрафах, сроках и ответственности':'Focus on risks, penalties, deadlines and liability'}</li>
        <li>{ru?'Понятный вывод: подписывать, править или проверить глубже':'Clear decision: sign, edit or get legal review'}</li>
        <li>{ru?'Перед загрузкой конфиденциального договора удалите персональные данные, если это необходимо':'Remove personal data from confidential contracts before uploading when needed'}</li>
        <li>{ru?'Для важных сделок — финальная проверка MavenLex':'For important deals — final careful verification'}</li>
      </ul>
    </section>

    <section className="glass resultPreviewBlock premiumReveal optionalHomeDetail">
      <div>
        <div className="eyebrow">RESULT PREVIEW</div>
        <h2>{ru?'Как будет выглядеть результат':'What the result looks like'}</h2>
        <p>{ru?'Пользователь заранее видит структуру профессионального вывода: риски, действия, сообщения и что проверить.':'Users see the professional output structure in advance: risks, actions, messages and verification points.'}</p>
      </div>
      <div className="resultRiskList">
        {[ru?'Одностороннее расторжение договора':'Unilateral termination', ru?'Неясные сроки оплаты':'Unclear payment deadlines', ru?'Высокая неустойка':'High penalty exposure', ru?'Нет порядка разрешения споров':'No dispute resolution process'].map((x,i)=><span key={x}><b>{i+1}</b>{x}</span>)}
      </div>
      <button className="secondary" onClick={()=>go('/report')}>{ru?'Открыть превью отчёта':'Open report preview'}</button>
    </section>

    <section className="glass launchStrip optionalHomeDetail">
      <div>
        <div className="eyebrow">READY TO USE</div>
        <h2>{ru?'Следующий шаг — тарифы и личный кабинет':'Next step — pricing and account'}</h2>
        <p>{ru?'Ваш текущий тариф: ' + (selectedPlan === 'free' ? 'Free' : selectedPlan === 'pro' ? 'Pro' : 'Business') + '. В кабинете можно контролировать лимиты, анализы и AI-вопросы.' : 'Your current plan: ' + (selectedPlan === 'free' ? 'Free' : selectedPlan === 'pro' ? 'Pro' : 'Business') + '. Account shows limits, reviews and AI questions.'}</p>
      </div>
      <div className="launchActions">
        <button className="secondary" onClick={()=>go('/pricing')}>{ru?'Посмотреть тарифы':'View pricing'}</button>
        <button className="secondary" onClick={()=>go('/account')}>{ru?'Открыть кабинет':'Open account'}</button>
      </div>
    </section>

    <section className="sectionHeader cleanSectionHeader optionalHomeDetail">
      <div>
        <div className="eyebrow">ACTION NAVIGATOR</div>
        <h2>{ru?'Новая логика: меньше экранов, больше пользы':'New logic: fewer screens, more value'}</h2>
      </div>
      <p>{ru?'Главная разгружена: пользователь сначала выбирает задачу, а подробности открываются только внутри нужного раздела.':'The home page is cleaner: the user first chooses a task, and details open only inside the relevant section.'}</p>
    </section>

    <section className="grid three homeFeatureGrid optionalHomeDetail">
      <Feature title={ru?'Что делать сегодня':'What to do today'} text={ru?'AI не просто объясняет закон, а даёт первый безопасный шаг.' : 'AI does not just explain law; it gives the first safe step.'}/>
      <Feature title={ru?'Что НЕ делать':'What not to do'} text={ru?'Отдельно показывает действия, которые могут ухудшить позицию.' : 'Separately shows actions that may make the position worse.'}/>
      <Feature title={ru?'Что написать':'What to write'} text={ru?'Помогает подготовить спокойное сообщение второй стороне.' : 'Helps draft a calm message to the other side.'}/>
    </section>

    {(report || builtContract) && <section className="grid two continuationGrid">
      {report && <Card title={ru?'Последний отчёт':'Last report'} text={T(report.summary, ru?'ru':'en')} action={ru?'Открыть':'Open'} onClick={()=>go('/report')} />}
      {builtContract && <Card title={ru?'Последний документ':'Last document'} text={T(builtContract.title, ru?'ru':'en')} action={ru?'Открыть':'Open'} onClick={()=>go('/builder')} />}
    </section>}
    <SeoInternalLinks ru={ru} go={go} />
    <PublicFaq ru={ru} go={go} />
  </main>;
}

function PublicFaq({ ru, go }) {
  const items = ru ? [
    ['Для чего нужен MavenLex?', 'Чтобы перед подписанием быстро понять главное: какие пункты опасны, где могут быть деньги, сроки, штрафы или односторонние условия, и что лучше уточнить до сделки.'],
    ['Можно ли загружать договор?', 'Да. Документ используется для анализа внутри сервиса. Для особо чувствительных сделок лучше заранее убрать персональные данные, суммы или реквизиты, которые не нужны для проверки.'],
    ['Это заменяет проверки?', 'MavenLex сам даёт первый разбор: риски, спорные условия, действия и план правок.'],
    ['Что я получу на выходе?', 'Короткое резюме, оценку риска, список спорных пунктов, объяснение простым языком, рекомендации по правкам и готовые вопросы для MavenLex или контрагента.'],
    ['С чего начать?', 'Откройте раздел “Договор”, загрузите DOCX, PDF или TXT, выберите цель проверки и получите первый отчёт. Если договора нет — опишите ситуацию в разделе “Ситуация”.']
  ] : [
    ['What is MavenLex for?', 'It helps you understand the essentials before signing: risky clauses, money exposure, deadlines, penalties, one-sided terms, and what to clarify before the deal.'],
    ['Can I upload a contract?', 'Yes. The document is used for in-product analysis. For sensitive matters, remove personal data, amounts, or details that are not needed for review.'],
    ['Does it replace MavenLex?', 'No. MavenLex helps you spot risks earlier and approach MavenLex prepared: with questions, disputed clauses, and a practical edit plan.'],
    ['What do I receive?', 'A short summary, risk score, disputed clauses, plain-language explanation, suggested edits, and ready questions for a specialist or counterparty.'],
    ['Where should I start?', 'Open Contract, upload DOCX, PDF, or TXT, choose the review goal, and get the first report. If there is no contract yet, describe the matter in Situation.']
  ];
  return <section className="glass publicFaqPanel premiumFaqPanel executiveFaqPanel">
    <div className="sectionHeader cleanSectionHeader"><div><div className="eyebrow">CLIENT QUESTIONS</div><h2>{ru?'Понятно перед первым анализом':'Clear before the first review'}</h2></div><p>{ru?'Без сухого FAQ: что делает MavenLex, как безопасно начать и какую пользу получает пользователь уже после первой проверки.':'No dry FAQ: what MavenLex does, how to start safely, and what value the user gets after the first review.'}</p></div>
    <div className="faqGrid">{items.map(([q,a], i) => <article key={q}><span>{String(i + 1).padStart(2, '0')}</span><b>{q}</b><p>{a}</p></article>)}</div>
    <div className="faqActions"><button className="primary" onClick={()=>go('/analyze')}>{ru?'Проверить договор':'Review a contract'}</button><button className="secondary" onClick={()=>go('/situation')}>{ru?'Разобрать ситуацию':'Analyze situation'}</button></div>
  </section>;
}


function SeoInternalLinks({ ru, go }) {
  const links = [
    ['/ai-contract-analysis', ru ? 'AI-анализ договоров' : 'AI contract analysis', ru ? 'Как MavenLex проверяет договоры, риски, штрафы и спорные условия.' : 'How MavenLex reviews contracts, risks, penalties and disputed clauses.'],
    ['/contract-risk-analysis', ru ? 'Анализ рисков договора' : 'Contract risk analysis', ru ? 'Что такое risk score и как читать результат перед подписанием.' : 'What the risk score means and how to read results before signing.'],
    ['/business-contract-review', ru ? 'Проверка договоров для бизнеса' : 'Business contract review', ru ? 'Для предпринимателей, команд, поставщиков и клиентов.' : 'For founders, teams, suppliers and clients.'],
    ['/ai-nda-analysis', ru ? 'AI-анализ NDA' : 'AI NDA analysis', ru ? 'Конфиденциальность, штрафы, срок и запреты.' : 'Confidentiality, penalties, term and restrictions.'],
    ['/ai-service-agreement-analysis', ru ? 'AI-анализ договора услуг' : 'AI service agreement analysis', ru ? 'Оплата, приёмка, ответственность и расторжение.' : 'Payment, acceptance, liability and termination.'],
    ['/contract-penalty-analysis', ru ? 'Анализ штрафов в договоре' : 'Contract penalty analysis', ru ? 'Проверка неустойки, лимитов и худшего сценария.' : 'Review penalties, caps and worst case.'],
    ['/check-contract-before-signing', ru ? 'Проверить договор перед подписанием' : 'Check contract before signing', ru ? 'Финальный чеклист перед решением.' : 'Final checklist before deciding.'],
    ['/faq', 'FAQ', ru ? 'Безопасность, форматы, тарифы и роль AI.' : 'Safety, formats, plans and AI role.']
  ];
  return <section className="glass seoLinksPanel">
    <div><div className="eyebrow">PUBLIC LAUNCH</div><h2>{ru?'Страницы для первых посетителей':'Pages for public visitors'}</h2><p>{ru?'Короткие посадочные страницы объясняют продукт, усиливают SEO и ведут пользователя к загрузке договора или тарифам.':'Short landing pages explain the product, improve SEO structure and guide visitors to upload or pricing.'}</p></div>
    <div className="seoLinksGrid">{links.map(([path,title,text]) => <button key={path} onClick={()=>go(path)}><b>{title}</b><span>{text}</span></button>)}</div>
  </section>;
}

function GrowthLanding({ ru, go, kind }) {
  const copy = {
    ai: {
      label: 'AI CONTRACT ANALYSIS',
      title: ru ? 'AI-анализ договоров перед подписанием' : 'AI contract analysis before signing',
      lead: ru ? 'Загрузите договор и получите понятный разбор: краткое резюме, risk score, спорные условия, практические действия и вопросы для проверки.' : 'Upload a contract and get a clear review: summary, risk score, disputed clauses, practical actions and verification points.',
      bullets: ru ? ['Находит штрафы, расторжение, ответственность и сроки', 'Объясняет юридический текст простыми словами', 'Помогает понять: подписывать, править или остановиться'] : ['Detects penalties, termination, liability and deadlines', 'Explains legal text in plain language', 'Helps decide: sign, edit or get MavenLex review']
    },
    risk: {
      label: 'CONTRACT RISK ANALYSIS',
      title: ru ? 'Анализ рисков договора простым языком' : 'Contract risk analysis in plain language',
      lead: ru ? 'MavenLex показывает не только “есть риск”, а почему пункт опасен, что может случиться в худшем случае и какую правку запросить.' : 'MavenLex shows not only that a risk exists, but why it matters, what the worst case can be and what edit to request.',
      bullets: ru ? ['Risk score по договору', 'High/Medium/Low зоны риска', 'Рекомендации по переговорам и safer wording'] : ['Contract risk score', 'High/Medium/Low risk zones', 'Negotiation recommendations and safer wording']
    },
    business: {
      label: 'BUSINESS CONTRACT REVIEW',
      title: ru ? 'Проверка договоров для бизнеса и предпринимателей' : 'Business contract review for founders and teams',
      lead: ru ? 'Сервис помогает предпринимателям быстро увидеть коммерческие и юридические риски до того, как договор подписан.' : 'The service helps founders and teams see commercial and legal risks before the contract is signed.',
      bullets: ru ? ['Договоры услуг, NDA, аренда, фриланс и партнёрство', 'Вопросы для проверки и пакет документов', 'Тарифы для регулярной работы с договорами'] : ['Service agreements, NDAs, lease, freelance and partnership', 'Verification questions and document package', 'Plans for regular contract work']
    },
    nda: {
      label: 'AI NDA ANALYSIS',
      title: ru ? 'AI-анализ NDA и соглашений о конфиденциальности' : 'AI analysis for NDAs',
      lead: ru ? 'Проверьте срок конфиденциальности, штрафы, запреты, исключения и ответственность до подписания NDA.' : 'Review confidentiality term, penalties, restrictions, carve-outs and liability before signing an NDA.',
      bullets: ru ? ['Сроки и исключения из конфиденциальности', 'Штрафы и чрезмерные ограничения', 'Что уточнить перед подписанием'] : ['Confidentiality term and exceptions', 'Penalties and excessive restrictions', 'What to clarify before signing']
    },
    service: {
      label: 'SERVICE AGREEMENT REVIEW',
      title: ru ? 'AI-анализ договора услуг' : 'AI service agreement review',
      lead: ru ? 'Найдите риски в оплате, приёмке, сроках, ответственности, качестве услуг и порядке расторжения.' : 'Detect risks in payment, acceptance, deadlines, liability, service quality and termination.',
      bullets: ru ? ['Оплата и просрочка', 'Приёмка и результат', 'Ответственность и расторжение'] : ['Payment and delay', 'Acceptance and deliverables', 'Liability and termination']
    },
    lease: {
      label: 'LEASE AGREEMENT ANALYSIS',
      title: ru ? 'AI-анализ договора аренды' : 'AI lease agreement analysis',
      lead: ru ? 'Проверьте платежи, депозит, расторжение, ответственность, ремонт и ограничения использования помещения.' : 'Review rent, deposit, termination, liability, repairs and use restrictions.',
      bullets: ru ? ['Депозит и платежи', 'Расторжение и уведомления', 'Ремонт и ответственность'] : ['Deposit and payments', 'Termination and notices', 'Repairs and liability']
    },
    penalty: {
      label: 'PENALTY RISK ANALYSIS',
      title: ru ? 'Анализ штрафов и неустойки в договоре' : 'Contract penalty analysis',
      lead: ru ? 'Поймите, где штрафы слишком высокие, как они считаются и что попросить ограничить.' : 'Understand where penalties are excessive, how they are calculated and what to cap.',
      bullets: ru ? ['Формула штрафа', 'Лимит ответственности', 'Худший денежный сценарий'] : ['Penalty formula', 'Liability cap', 'Worst-case money exposure']
    },
    check: {
      label: 'PRE-SIGNING CONTRACT CHECK',
      title: ru ? 'Проверить договор перед подписанием' : 'Check a contract before signing',
      lead: ru ? 'Финальная проверка перед решением: риск, чеклист, красные флаги и что проверить.' : 'Final check before deciding: risk, checklist, red flags and verification points.',
      bullets: ru ? ['Risk score', 'Чеклист перед подписью', 'Решение: подписывать, править или MavenLex'] : ['Risk score', 'Pre-signing checklist', 'Decision: sign, edit or MavenLex']
    }
  }[kind] || {};
  return <main className="page growthLandingPage">
    <section className="glass growthHero">
      <div><div className="eyebrow">{copy.label}</div><h1>{copy.title}</h1><p>{copy.lead}</p><div className="heroActions cleanHeroActions"><button className="primary large" onClick={()=>go('/analyze')}>{ru?'Проверить договор':'Review contract'}</button><button className="secondary large" onClick={()=>go('/pricing')}>{ru?'Посмотреть тарифы':'View pricing'}</button></div></div>
      <aside><b>{ru?'Что вы получите':'What you get'}</b><ul>{copy.bullets.map(x=><li key={x}>{x}</li>)}</ul></aside>
    </section>
    <section className="grid three homeFeatureGrid optionalHomeDetail">
      <Feature title={ru?'1. Загрузите файл':'1. Upload'} text={ru?'Поддерживаются TXT, DOCX и текстовые PDF.' : 'TXT, DOCX and text-based PDF are supported.'}/>
      <Feature title={ru?'2. Получите вывод':'2. Get results'} text={ru?'Risk score, спорные условия и практические рекомендации.' : 'Risk score, disputed clauses and practical recommendations.'}/>
      <Feature title={ru?'3. Примите решение':'3. Decide'} text={ru?'Подписывать, править или остановиться.' : 'Sign, edit or show to MavenLex.'}/>
    </section>
    <PublicFaq ru={ru} go={go} />
  </main>;
}

function PublicFaqPage({ ru, go }) {
  return <main className="page faqPage"><PageTitle label="FAQ" title={ru?'Вопросы о MavenLex':'Questions about MavenLex'} text={ru?'Безопасность, форматы файлов, AI-анализ, тарифы и ограничения сервиса.':'Safety, file formats, AI analysis, plans and service limitations.'}/><PublicFaq ru={ru} go={go} /></main>;

}

function PublicFooter({ ru, go }) {
  return <footer className="publicFooter">
    <div>
      <b>MavenLex</b>
      <span>{ru?'AI-анализ договоров и юридических ситуаций. Информационный сервис, не юридическая консультация.':'AI analysis for contracts and legal situations. Informational service, not legal advice.'}</span>
    </div>
    <nav aria-label={ru?'Юридические ссылки':'Legal links'}>
      <button onClick={()=>go('/privacy')}>{ru?'Конфиденциальность':'Privacy'}</button>
      <button onClick={()=>go('/terms')}>{ru?'Условия':'Terms'}</button>
      <button onClick={()=>go('/security')}>{ru?'Безопасность':'Security'}</button>
      <button onClick={()=>go('/faq')}>FAQ</button>
      <button onClick={()=>go('/help')}>{ru?'Помощь':'Help'}</button>
      <button onClick={()=>go('/support')}>{ru?'Поддержка':'Support'}</button>
    </nav>
  </footer>;
}

function HomeStat({ value, label, text }) { return <div className="glass homeStat"><b>{value}</b><span>{label}</span><p>{text}</p></div>; }
function Feature({ title, text }) { return <div className="glass feature"><h3>{title}</h3><p>{text}</p></div>; }


function SituationNavigator({ ru, lang, report, addHistoryItem, bumpUsage, serverSession }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const examples = ru
    ? ['Мне не выплатили зарплату, что делать?', 'Мне пришла претензия по договору', 'Меня вызывают в полицию, как себя вести?', 'Клиент не платит уже 20 дней', 'Работодатель заставляет уволиться']
    : ['My salary was not paid, what should I do?', 'I received a claim under a contract', 'Police want to question me, what should I do?', 'A client has not paid for 20 days', 'My employer is pressuring me to resign'];

  async function run(nextText = text) {
    const question = String(nextText || '').trim();
    if (!question || loading) return;
    setLoading(true); setError(''); setAnswer('');
    try {
      const res = await fetchWithTimeout(`${API}/api/legal-chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(currentCsrfToken() ? { 'X-CSRF-Token': currentCsrfToken() } : {}) },
        body: JSON.stringify({ question: `${question}\n\nРазбери как MavenLex Human Legal Counsel AI: сначала прямой вывод, потом что может грозить, что сделать сегодня, чего не делать, какие доказательства сохранить и что написать второй стороне. Не перенаправляй вовне, отвечай сам по максимуму. Отвечай живым человеческим языком, не шаблоном.`, report: report || {}, language: lang, mode: 'action', history: [] })
      }, 100000);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setAnswer(data.answer || '');
      bumpUsage?.('questions');
      addHistoryItem?.({ type: 'situation', question: cleanSnippet(question, 160), summary: cleanSnippet(data.answer || '', 240), payload: { question, answer: data.answer || '' } });
    } catch (e) {
      setError(friendlyError(e, ru));
    } finally {
      setLoading(false);
    }
  }

  return <main className="page situationPage">
    <PageTitle label="AI ACTION NAVIGATOR" title={ru?'Разобрать юридическую ситуацию':'Analyze a legal situation'} text={ru?'Опишите проблему обычными словами. MavenLex даст практический план: что делать сейчас, чего избегать, что собрать и что написать.' : 'Describe the problem in normal words. MavenLex gives a practical plan: what to do now, what to avoid, what to collect and what to write.'}/>

    <section className="glass situationPanel">
      <div className="situationIntro">
        <div>
          <div className="eyebrow">SITUATION INTAKE</div>
          <h2>{ru?'Напишите, что случилось':'Write what happened'}</h2>
          <p>{ru?'Не нужно знать кодекс или статью. Просто опишите факты: кто, что требует, какие сроки, есть ли документы, уже подписали или нет.' : 'You do not need to know the code or article. Just describe facts: who, what is demanded, deadlines, documents, whether anything is already signed.'}</p>
        </div>
        <div className="situationFormat">
          <b>{ru?'Ответ будет по структуре':'The answer follows a structure'}</b>
          <span>{ru?'вывод · последствия · план · запреты · доказательства · текст сообщения':'conclusion · consequences · plan · avoid · evidence · message'}</span>
        </div>
      </div>
      <textarea className="situationTextarea" value={text} onChange={e=>setText(e.target.value)} placeholder={ru?'Например: работодатель хочет уволить меня без выплат, я ничего не подписывал, есть переписка в Telegram...':'For example: my employer wants to dismiss me without payments, I have not signed anything, I have Telegram messages...'} />
      <div className="promptChips situationChips">
        {examples.map(x => <button key={x} onClick={()=>{setText(x); run(x);}} disabled={loading}>{x}</button>)}
      </div>
      <button className="primary large" onClick={()=>run()} disabled={loading || !text.trim()}>{loading ? (ru?'MavenLex думает...':'MavenLex is thinking...') : (ru?'Получить план действий':'Get action plan')}</button>
      {error && <div className="errorBox">{error}</div>}
    </section>

    {loading && <section className="glass actionLoading"><b>{ru?'MavenLex разбирает ситуацию':'MavenLex is analyzing the situation'}</b><span>{ru?'Определяем риск, срочность, безопасные действия и что проверить.':'Detecting risk, urgency, safe steps and verification points.'}</span><i></i></section>}
    {answer && <section className="glass situationAnswer">
      <div className="answerHeader"><span>{ru?'План действий':'Action plan'}</span><button className="copyMini" onClick={()=>navigator.clipboard?.writeText(answer)}>{ru?'Скопировать':'Copy'}</button></div>
      <pre>{answer}</pre>
      <p className="hint">{ru?'MavenLex даёт AI-разбор. Проверяйте факты, документы и актуальные нормы.':'Informational AI help. Verify important decisions with MavenLex.'}</p>
    </section>}
  </main>;
}

function LawArticleSearch({ ru, lang }) {
  const [code, setCode] = useState('УК РФ');
  const [article, setArticle] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState('');
  const [error, setError] = useState('');
  const [articleChat, setArticleChat] = useState([]);
  const [articleChatQuestion, setArticleChatQuestion] = useState('');
  const [articleChatLoading, setArticleChatLoading] = useState(false);

  const codes = ['УК РФ', 'ГК РФ', 'КоАП РФ', 'ТК РФ', 'НК РФ'];
  const examples = ['228', '159', '330', '421', '450', '12.8', '81'];
  const articleCategoryMap = {
    'Долги': { code:'ГК РФ', article:'330', question:'Долги, просрочка оплаты, неустойка: объясни все ключевые риски, что делать сейчас, что не делать, какие доказательства собрать и как написать второй стороне.' },
    'Аренда': { code:'ГК РФ', article:'450', question:'Аренда: расторжение, залог, уведомления, долг, выселение/возврат помещения. Объясни практические риски и действия.' },
    'Работа': { code:'ТК РФ', article:'81', question:'Работа и увольнение: объясни основания, риски, что делать работнику, что собрать и чего не подписывать без понимания.' },
    'Штрафы': { code:'ГК РФ', article:'330', question:'Штрафы, пеня и неустойка: объясни когда их могут требовать, как спорить размер, какие документы нужны.' },
    'Претензии': { code:'ГК РФ', article:'450', question:'Претензия и спор по договору: объясни порядок действий, ответ на претензию, доказательства и ошибки.' },
    'Ответственность': { code:'ГК РФ', article:'421', question:'Ответственность в договоре: объясни риски, лимиты, штрафы, убытки и как безопаснее формулировать условия.' },
    'Debts': { code:'ГК РФ', article:'330', question:'Debts and late payment: explain risks, evidence, next steps and message to the other side.' },
    'Lease': { code:'ГК РФ', article:'450', question:'Lease dispute: deposit, termination, notices, debt and practical next steps.' },
    'Work': { code:'ТК РФ', article:'81', question:'Employment and dismissal: explain risks, documents, safe actions and what not to sign blindly.' },
    'Penalties': { code:'ГК РФ', article:'330', question:'Penalties and liquidated damages: explain when they apply and how to challenge or limit them.' },
    'Claims': { code:'ГК РФ', article:'450', question:'Contract claim and dispute: explain response strategy, evidence and safe steps.' },
    'Liability': { code:'ГК РФ', article:'421', question:'Contract liability: explain caps, damages, penalties and safer wording.' }
  };

  async function searchLaw(nextArticle = article, nextCode = code, nextQuestion = question) {
    const cleanArticle = String(nextArticle || '').trim();
    if (!cleanArticle || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    setArticleChat([]);
    try {
      const res = await fetchWithTimeout(`${API}/api/law-article-search`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ code: nextCode, article: cleanArticle, question: nextQuestion })
      }, 120000);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Law article search failed');
      setResult(data.result);
      setMode(data.mode);
    } catch (e) {
      setError(friendlyError(e, ru));
    } finally {
      setLoading(false);
    }
  }

  function pickExample(x) {
    setArticle(x);
    searchLaw(x);
  }

  function pickCategory(x) {
    const preset = articleCategoryMap[x];
    if (!preset) { setQuestion(x); return; }
    setCode(preset.code);
    setArticle(preset.article);
    setQuestion(preset.question);
    setTimeout(() => searchLaw(preset.article, preset.code, preset.question), 0);
  }

  async function askArticleChat(nextQuestion = articleChatQuestion) {
    const cleanQuestion = String(nextQuestion || '').trim();
    if (!cleanQuestion || articleChatLoading) return;
    const userMessage = { role: 'user', text: cleanQuestion };
    setArticleChat(prev => [...prev, userMessage]);
    setArticleChatQuestion('');
    setArticleChatLoading(true);
    try {
      const context = result ? {
        type: 'law_article',
        title: result.title,
        area: result.area,
        jurisdiction: result.jurisdiction || 'Россия',
        summary: result.summary,
        mayLeadToViolation: result.mayLeadToViolation,
        howToAvoidViolation: result.howToAvoidViolation,
        whatToDoNow: result.whatToDoNow,
        MavenLexQuestions: result.MavenLexQuestions,
        disclaimer: result.disclaimer
      } : { type: 'law_article', title: `${code} ст. ${article}`, summary: question };
      const res = await fetchWithTimeout(`${API}/api/legal-chat`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify({
          language: lang || (ru ? 'ru' : 'en'),
          mode: 'law_article_followup',
          question: cleanQuestion,
          report: context,
          history: articleChat.map(m => ({ role: m.role, text: m.text })).slice(-8)
        })
      }, 180000);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Article chat failed');
      setArticleChat(prev => [...prev, { role: 'ai', text: data.answer || data.result || (ru ? 'Не удалось сформировать ответ.' : 'Could not prepare an answer.') }]);
    } catch (e) {
      setArticleChat(prev => [...prev, { role: 'ai error', text: friendlyError(e, ru) }]);
    } finally {
      setArticleChatLoading(false);
    }
  }

  const arr = v => Array.isArray(v) ? v : [];
  const followups = ru
    ? ['Объясни проще человеческим языком', 'Что мне делать прямо сейчас?', 'Какие риски по этой статье?', 'Что важно проверить?', 'Приведи пример ситуации']
    : ['Explain it more simply', 'What should I do now?', 'What are the risks under this article?', 'What should I verify?', 'Give an example situation'];

  return <main className="page lawPage">
    <section className="lawHero glass">
      <div>
        <div className="eyebrow executiveEyebrow">RUSSIA LEGAL REFERENCE</div>
        <h1>{ru ? 'Статьи РФ и объяснение простым языком' : 'Russian legal articles explained plainly'}</h1>
        <p>{ru
          ? 'Введите кодекс и номер статьи. MavenLex объяснит смысл, риски, безопасные действия и позволит задать уточняющий вопрос по статье — даже если вопрос написан простыми словами или с ошибками.'
          : 'Enter a Russian code and article number. MavenLex explains the meaning, risks, safe actions and lets you ask follow-up questions in plain or imperfect language.'}</p>
      </div>
      <div className="lawNotice">
        <b>{ru ? 'Юридический разбор' : 'Legal breakdown'}</b>
        <span>{ru ? 'Сначала получите объяснение статьи, затем задайте уточнение в чате ниже.' : 'Get the article explanation first, then ask follow-up questions in the chat below.'}</span>
      </div>
    </section>

    <section className="lawSearchGrid">
      <div className="glass lawSearchPanel">
        <div className="fieldRow">
          <Field label={ru?'Кодекс':'Code'}><select value={code} onChange={e=>setCode(e.target.value)}>{codes.map(x=><option key={x}>{x}</option>)}</select></Field>
          <Field label={ru?'Номер статьи':'Article number'}><input value={article} onChange={e=>setArticle(e.target.value)} placeholder="228, 159, 330..." /></Field>
        </div>
        <Field label={ru?'Ситуация или вопрос — необязательно':'Situation or question — optional'}>
          <textarea value={question} onChange={e=>setQuestion(e.target.value)} placeholder={ru?'Например: мне прислали претензию, что делать?':'For example: I received a claim, what should I do?'} rows="4" />
        </Field>
        <div className="lawChips">{examples.map(x => <button key={x} onClick={()=>pickExample(x)}>ст. {x}</button>)}</div>
        <div className="actions"><button className="primary large" onClick={()=>searchLaw()} disabled={loading || !article.trim()}>{loading ? (ru?'MavenLex проверяет статью...':'MavenLex is checking...') : (ru?'Объяснить статью':'Explain article')}</button></div>
        {error && <div className="error strongError"><b>{ru?'Не удалось найти статью':'Could not search article'}</b><p>{error}</p></div>}
      </div>

      <aside className="glass lawGuide">
        <div className="eyebrow">HOW IT HELPS</div>
        <h2>{ru?'Что покажет MavenLex':'What MavenLex shows'}</h2>
        <ul>
          <li>{ru?'Суть статьи простыми словами':'Plain-language summary'}</li>
          <li>{ru?'Сфера: уголовная, гражданская, административная, трудовая':'Area: criminal, civil, administrative, labour'}</li>
          <li>{ru?'Что может создать риск нарушения':'What may create violation risk'}</li>
          <li>{ru?'Что делать, чтобы не ухудшить ситуацию':'What to do safely'}</li>
          <li>{ru?'Чат для уточнений по статье':'Follow-up chat for the article'}</li>
        </ul>
      </aside>
    </section>

    <section className="glass articleKnowledgeHub v611">
      <div><div className="eyebrow">ARTICLE KNOWLEDGE BASE</div><h2>{ru?'Статьи стали полезнее':'Articles are more useful'}</h2><p>{ru?'Нажмите категорию — MavenLex сам подставит подходящую норму и разберёт тему. Номер статьи знать не нужно.':'Click a category — MavenLex chooses a relevant article and explains the topic. You do not need to know the article number.'}</p></div>
      <div className="articleCategoryPills">{(ru?['Долги','Аренда','Работа','Штрафы','Претензии','Ответственность']:['Debts','Lease','Work','Penalties','Claims','Liability']).map(x=><button key={x} type="button" onClick={()=>pickCategory(x)}>{x}</button>)}</div>
    </section>

    {result && <section className="lawResult glass">
      <div className="lawResultTop">
        <div>
          <div className="eyebrow">{mode === 'live-yandexgpt' ? 'LIVE AI LEGAL REFERENCE' : 'LEGAL REFERENCE'}</div>
          <h2>{result.title}</h2>
          <p>{result.area}</p>
        </div>
        <span className="legalBadge">{result.jurisdiction || 'Россия'}</span>
      </div>
      <div className="lawMemo">
        <article><h3>{ru?'Что это за статья':'What this article is'}</h3><p>{result.summary}</p></article>
        <article><h3>{ru?'Что может привести к нарушению':'What may lead to violation'}</h3><ol>{arr(result.mayLeadToViolation).map((x,i)=><li key={i}>{x}</li>)}</ol></article>
        <article><h3>{ru?'Что делать, чтобы не нарушить':'How to avoid violation'}</h3><ol>{arr(result.howToAvoidViolation).map((x,i)=><li key={i}>{x}</li>)}</ol></article>
        <article><h3>{ru?'Что делать сейчас':'What to do now'}</h3><ol>{arr(result.whatToDoNow).map((x,i)=><li key={i}>{x}</li>)}</ol></article>
        <article><h3>{ru?'Что важно проверить':'What to verify'}</h3><ol>{arr(result.MavenLexQuestions).map((x,i)=><li key={i}>{x}</li>)}</ol></article>
      </div>
      <div className="articleChatPanel">
        <div className="articleChatHeader">
          <div><div className="eyebrow">ARTICLE CHAT</div><h3>{ru?'Спросить подробнее по этой статье':'Ask more about this article'}</h3><p>{ru?'Можно писать простыми словами, с ошибками или коротко. MavenLex поймёт смысл и ответит по статье.' : 'You can write simply, with mistakes, or very briefly. MavenLex will infer the meaning and answer about the article.'}</p></div>
        </div>
        <div className="articleFollowups">{followups.map(x => <button key={x} onClick={()=>askArticleChat(x)} disabled={articleChatLoading}>{x}</button>)}</div>
        <div className="articleChatMessages">
          {articleChat.length ? articleChat.map((m,i)=><div key={i} className={`articleChatBubble ${m.role.includes('ai') ? 'ai' : 'user'} ${m.role.includes('error') ? 'errorBubble' : ''}`}><b>{m.role.includes('ai') ? 'MavenLex' : (ru?'Вы':'You')}</b><p>{m.text}</p></div>) : <div className="articleChatEmpty">{ru?'Задайте вопрос после объяснения статьи: “а если я уже подписал?”, “что мне грозит?”, “как доказать?”':'Ask a follow-up after the explanation: “what if I already signed?”, “what is the risk?”, “how can I prove it?”'}</div>}
        </div>
        <div className="articleChatInput"><textarea value={articleChatQuestion} onChange={e=>setArticleChatQuestion(e.target.value)} placeholder={ru?'Напишите вопрос по статье...':'Ask a question about this article...'} rows="3" onKeyDown={e=>{ if(e.key==='Enter' && (e.ctrlKey || e.metaKey)) askArticleChat(); }} /><button className="primary" onClick={()=>askArticleChat()} disabled={articleChatLoading || !articleChatQuestion.trim()}>{articleChatLoading ? (ru?'Думаю...':'Thinking...') : (ru?'Спросить':'Ask')}</button></div>
      </div>
      <div className="reportDisclaimer">{result.disclaimer}</div>
    </section>}
  </main>;
}


function Analyze({ ru, lang, jurisdiction, setJurisdiction, saveReport, apiOk, apiMessage, serverSession }) {
  const [file, setFile] = useState(null);
  const [contractType, setContractType] = useState('Service agreement');
  const [legalScenario, setLegalScenario] = useState('pre_signing');
  const [reviewSide, setReviewSide] = useState('balanced');
  const [analysisDepth, setAnalysisDepth] = useState('standard');
  const [documentLanguage, setDocumentLanguage] = useState('auto');
  const [reportLanguage, setReportLanguage] = useState(lang);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progressStep, setProgressStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const ref = useRef(null);

  const steps = ru
    ? ['Проверяем файл', 'Извлекаем текст', 'AI изучает риски', 'AI формирует план действий', 'Готовим отчёт']
    : ['Checking file', 'Extracting text', 'AI studies risks', 'AI builds action plan', 'Preparing report'];
  const fileOk = Boolean(file) && /\.(txt|docx|pdf)$/i.test(file.name) && file.size <= 15 * 1024 * 1024;
  const sizeLabel = file ? `${(file.size / 1024 / 1024).toFixed(file.size > 1024 * 1024 ? 2 : 3)} MB` : '';
  const contractTypeOptions = localizedContractTypes[lang] || localizedContractTypes.ru;
  const legalScenarios = ru ? [
    ['pre_signing','Перед подписанием','Проверить, можно ли подписывать сейчас и какие условия исправить.'],
    ['counterparty_risk','Риск контрагента','Найти пункты, которые дают другой стороне слишком много власти.'],
    ['payment_liability','Деньги и ответственность','Проверить оплату, штрафы, компенсации и лимиты ответственности.'],
    ['termination_dispute','Расторжение и спор','Проверить выход из договора, уведомления, суд/арбитраж и доказательства.'],
    ['confidential_data','Конфиденциальность и данные','Проверить NDA, персональные данные, раскрытие информации и безопасность.']
  ] : [
    ['pre_signing','Before signing','Check whether it is safe to sign now and what should be fixed.'],
    ['counterparty_risk','Counterparty risk','Find clauses that give the other side too much leverage.'],
    ['payment_liability','Money and liability','Review payments, penalties, compensation and liability caps.'],
    ['termination_dispute','Termination and dispute','Review exit rights, notices, court/arbitration and evidence.'],
    ['confidential_data','Confidentiality and data','Review NDA, personal data, disclosure and security.']
  ];
  const scenarioLabel = legalScenarios.find(x => x[0] === legalScenario)?.[1] || legalScenarios[0][1];

  useEffect(() => {
    if (!loading) { setProgressStep(0); return; }
    const timer = setInterval(() => setProgressStep(x => Math.min(x + 1, steps.length - 1)), 4200);
    return () => clearInterval(timer);
  }, [loading, steps.length]);

  function chooseFile(nextFile) {
    if (!nextFile) return;
    setFile(nextFile);
    setError('');
    if (!/\.(txt|docx|pdf)$/i.test(nextFile.name)) {
      setError(ru ? 'Этот формат не поддерживается. Загрузите TXT, DOCX или текстовый PDF.' : 'This format is not supported. Upload TXT, DOCX or a text-based PDF.');
    } else if (nextFile.size > 15 * 1024 * 1024) {
      setError(ru ? 'Файл слишком большой. Максимальный размер — 15 MB.' : 'File is too large. Maximum size is 15 MB.');
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    chooseFile(e.dataTransfer.files?.[0]);
  }

  async function analyze() {
    if (!file) { setError(ru?'Сначала выберите файл договора: TXT, DOCX или PDF.':'Choose a contract file first: TXT, DOCX or PDF.'); ref.current?.click(); return; }
    if (!/\.(txt|docx|pdf)$/i.test(file.name)) { setError(ru?'Поддерживаются только TXT, DOCX и текстовые PDF.':'Only TXT, DOCX and text-based PDF files are supported.'); return; }
    if (file.size > 15 * 1024 * 1024) { setError(ru?'Файл слишком большой. Максимум 15 MB.':'File is too large. Maximum 15 MB.'); return; }
    setLoading(true); setError(''); setProgressStep(0);
    try {
      const form = new FormData();
      form.append('contract', file); form.append('language', reportLanguage); form.append('reportLanguage', reportLanguage); form.append('documentLanguage', documentLanguage); form.append('jurisdiction', jurisdiction); form.append('contractType', contractType); form.append('analysisDepth', analysisDepth); form.append('legalScenario', legalScenario); form.append('reviewSide', reviewSide);
      const headers = currentCsrfToken() ? { 'X-CSRF-Token': currentCsrfToken() } : {};
      const res = await fetchWithTimeout(`${API}/api/analyze-contract`, { method:'POST', credentials:'include', headers, body: form }, 130000);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      saveReport(data);
    } catch(e) {
      setError(friendlyError(e, ru));
    } finally { setLoading(false); }
  }

  return <main className="page analyzePage">
    <PageTitle label="CONTRACT ANALYSIS" title={ru?'Проверка договора без хаоса':'Contract review without confusion'} text={ru?'Загрузите договор, выберите тип и юрисдикцию. Система извлечёт текст, найдёт риски и подготовит понятный отчёт.' : 'Upload a contract, select type and jurisdiction. The system extracts text, detects risks and prepares a clear report.'}/>
    <section className="analyzeShell">
      <div className="glass uploadPanel">
        <div className="panelTopline">
          <span className={`statusDot ${apiOk === 'online' ? 'online' : 'offline'}`}></span>
          <div><b>{apiOk === 'online' ? (ru?'Сервис готов':'Service ready') : (ru?'Сервис недоступен':'Service unavailable')}</b><p>{apiMessage}</p></div>
        </div>

        <div className="fileRulesCard glassSoft">
          <b>{ru?'Перед загрузкой':'Before upload'}</b>
          <span>{ru?'Форматы: TXT, DOCX, PDF с выделяемым текстом. Максимум 15 МБ. Сканированные PDF могут не читаться.':'Formats: TXT, DOCX, selectable-text PDF. Maximum 15 MB. Scanned PDFs may not be readable.'}</span>
          <button className="secondary tiny" type="button" onClick={()=>alert(ru?'Для важных договоров удалите лишние персональные данные перед загрузкой.':'For important contracts, remove unnecessary personal data before upload.')}>{ru?'Правила файла':'File rules'}</button>
        </div>

        <div className="formGrid analyzeControls">
          <Field label={ru?'Тип договора':'Contract type'}><select value={contractType} onChange={e=>setContractType(e.target.value)}>{contractTypeOptions.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label={ru?'Юрисдикция':'Jurisdiction'}><select value={jurisdiction} onChange={e=>setJurisdiction(e.target.value)}>{JURISDICTION_OPTIONS.map(option => <option key={option.value} value={option.value}>{jurisdictionLabel(option.value, lang)}</option>)}</select></Field>
          <Field label={UI_COPY[lang].documentLanguage}><select value={documentLanguage} onChange={e=>setDocumentLanguage(e.target.value)}><option value="auto">{UI_COPY[lang].sourceAuto}</option><option value="ru">Русский</option><option value="en">English</option></select></Field>
          <Field label={UI_COPY[lang].reportLanguage}><select value={reportLanguage} onChange={e=>setReportLanguage(e.target.value)}><option value="ru">Русский</option><option value="en">English</option></select></Field>
          <Field label={ru?'Глубина анализа':'Analysis depth'}><select value={analysisDepth} onChange={e=>setAnalysisDepth(e.target.value)}><option value="quick">{ru?'Quick — быстро':'Quick'}</option><option value="standard">{ru?'Standard — оптимально':'Standard'}</option><option value="deep">{ru?'Deep — подробнее':'Deep'}</option></select></Field>
          <Field label={ru?'Позиция пользователя':'Your side'}><select value={reviewSide} onChange={e=>setReviewSide(e.target.value)}><option value="balanced">{ru?'Сбалансированно':'Balanced'}</option><option value="customer">{ru?'Заказчик / покупатель':'Customer / buyer'}</option><option value="provider">{ru?'Исполнитель / поставщик':'Provider / seller'}</option><option value="employee">{ru?'Работник':'Employee'}</option><option value="employer">{ru?'Работодатель':'Employer'}</option></select></Field>
        </div>
        <p className="hint i18nHint">{UI_COPY[lang].bilingualNote}</p>

        <div className="legalScenarioChooser">
          <div><b>{ru?'Юридический фокус проверки':'Legal review focus'}</b><span>{ru?'Выберите цель анализа — отчёт будет понятнее для реального решения.':'Choose the review goal — the report becomes clearer for a real decision.'}</span></div>
          <div className="legalScenarioChips">{legalScenarios.map(([id,title,text]) => <button type="button" key={id} className={legalScenario===id?'active':''} onClick={()=>setLegalScenario(id)}><b>{title}</b><small>{text}</small></button>)}</div>
        </div>

        <div className={`dropzone ${dragging ? 'dragging' : ''} ${file ? 'hasFile' : ''}`} onDragOver={e=>{e.preventDefault(); setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={onDrop} onClick={()=>ref.current?.click()} role="button" tabIndex="0">
          <input ref={ref} type="file" accept=".txt,.docx,.pdf" onChange={e=>chooseFile(e.target.files?.[0])} hidden />
          <div className="uploadIcon">↥</div>
          <div>
            <h2>{file ? file.name : (ru?'Выберите договор для анализа':'Choose a contract to analyze')}</h2>
            <p>{file ? `${sizeLabel} · ${fileOk ? (ru?'Файл готов к анализу':'Ready to analyze') : (ru?'Нужно исправить файл':'File needs attention')}` : (ru?'Перетащите файл сюда или нажмите, чтобы выбрать TXT/DOCX/PDF до 15 MB.':'Drag a file here or click to choose TXT/DOCX/PDF up to 15 MB.')}</p>
          </div>
        </div>

        {loading && <div className="analysisProgress" aria-live="polite">
          {steps.map((step, i) => <div key={step} className={i <= progressStep ? 'done' : ''}><span>{i + 1}</span><p>{step}</p></div>)}
        </div>}

        {error && <div className="error strongError"><b>{ru?'Не удалось проанализировать документ':'Could not analyze the document'}</b><p>{error}</p><ul><li>{ru?'Проверьте размер файла и формат TXT/DOCX/PDF.':'Check file size and TXT/DOCX/PDF format.'}</li><li>{ru?'Если PDF является сканом, попробуйте DOCX или PDF с выделяемым текстом.':'If the PDF is a scan, try DOCX or a selectable-text PDF.'}</li><li>{ru?'Если сервис временно недоступен, повторите позже.':'If the service is temporarily unavailable, try again later.'}</li></ul></div>}

        <div className="actions analyzeActions">
          <button className="primary large" onClick={analyze} disabled={loading || !fileOk}>{loading ? (ru?'AI анализирует договор...':'AI is analyzing...') : (ru?'Запустить глубокий анализ':'Run deep analysis')}</button>
          <button className="secondary large" onClick={()=>ref.current?.click()} disabled={loading}>{ru?'Выбрать другой файл':'Choose another file'}</button>
        </div>
      </div>

      <aside className="glass analyzeHelp">
        <div className="eyebrow">QUALITY CHECK</div>
        <h2>{ru?'Что будет проверено':'What will be reviewed'}</h2>
        <div className="selectedScenarioMini"><span>{ru?'Фокус':'Focus'}</span><b>{scenarioLabel}</b></div>
        <ul>
          <li>{ru?'Штрафы, просрочка оплаты и скрытые обязательства':'Penalties, late payment and hidden obligations'}</li>
          <li>{ru?'Расторжение, автопродление и сроки уведомления':'Termination, auto-renewal and notice periods'}</li>
          <li>{ru?'Ответственность сторон и ограничения компенсации':'Liability exposure and compensation limits'}</li>
          <li>{ru?'Что проверить, action plan и safer wording':'Verification questions, action plan and safer wording'}</li>
        </ul>
        <div className="helpNote trustMiniNote">
          <b>{ru?'Безопасность документов':'Document safety'}</b>
          <p>{ru?'Загружайте только договоры, которые вы вправе анализировать. MavenLex помогает выявить риски, но не является юридической консультацией.' : 'Upload only contracts you are allowed to analyze. MavenLex helps detect risks, but is not legal advice.'}</p>
        </div>
        <div className="helpNote">
          <b>{ru?'Важно':'Important'}</b>
          <p>{ru?'Если PDF является сканом-картинкой, текст может не извлечься. Для лучшего результата используйте DOCX или текстовый PDF.' : 'If the PDF is a scanned image, text may not be extracted. For best results, use DOCX or a text-based PDF.'}</p>
        </div>
      </aside>
    </section>
  </main>;
}

function Builder({ ru, lang, jurisdiction, saveContract, go, builtContract }) {
  const [answers, setAnswers] = useState({
    type:'Service agreement',
    country:jurisdiction,
    partyA:'',
    partyB:'',
    subject:'',
    price:'',
    payment:'50% upfront, 50% after delivery',
    term:'3 months',
    termination:'14 days written notice',
    liability:'Limited to fees paid in the last 3 months'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const required = ['partyA','partyB','subject','price'];
  const labels = {
    partyA: ru?'Сторона A':'Party A',
    partyB: ru?'Сторона B':'Party B',
    subject: ru?'Предмет договора':'Contract subject',
    price: ru?'Цена':'Price'
  };
  const completion = Math.round((required.filter(k => answers[k].trim()).length / required.length) * 100);
  const missing = required.filter(k => !answers[k].trim());
  const set = (k,v) => {
    setAnswers(a => ({ ...a, [k]: v }));
    setError('');
  };
  const mark = k => setTouched(t => ({ ...t, [k]: true }));
  async function generate() {
    if (missing.length) {
      setTouched(required.reduce((acc,k)=>({ ...acc, [k]: true }), {}));
      setError((ru?'Заполните обязательные поля: ':'Fill required fields: ') + missing.map(k=>labels[k]).join(', '));
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await fetchWithTimeout(`${API}/api/generate-contract`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ language: lang, answers }) }, 16000);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      saveContract(data);
      setTimeout(() => document.querySelector('.generated')?.scrollIntoView({ behavior:'smooth', block:'start' }), 80);
    } catch(e) { setError(friendlyError(e, ru)); } finally { setLoading(false); }
  }
  const fieldClass = key => touched[key] && !answers[key].trim() ? 'invalidField' : '';
  return <main className="page builderPage">
    <section className="builderHero glass">
      <div>
        <div className="eyebrow">CONTRACT BUILDER</div>
        <h1>{ru?'Соберите draft-шаблон договора без хаоса':'Build a draft contract template without the chaos'}</h1>
        <p>{ru?'Заполните короткую анкету. Система подготовит draft, инструкции по заполнению, risk check и вопросы для проверки. Для финального решения проверьте факты, документы и актуальные нормы в MavenLex.':'Complete a focused questionnaire. The system prepares a draft, fill-in guidance, risk check and verification points. For final decisions, verify facts, documents and current rules in MavenLex.'}</p>
      </div>
      <div className="builderProgressCard">
        <span>{ru?'Готовность анкеты':'Questionnaire readiness'}</span>
        <strong>{completion}%</strong>
        <div className="progressTrack"><i style={{ width: `${completion}%` }} /></div>
        <p>{missing.length ? (ru?'Осталось заполнить: ':'Still needed: ') + missing.map(k=>labels[k]).join(', ') : (ru?'Готово к генерации draft-шаблона':'Ready to generate the draft template')}</p>
      </div>
    </section>

    <section className="builderLayout">
      <aside className="glass builderGuide">
        <div className="eyebrow">GUIDED FLOW</div>
        <h2>{ru?'Как заполнять':'How to complete it'}</h2>
        <ol>
          <li><b>{ru?'Выберите тип и страну':'Choose type and country'}</b><span>{ru?'Это влияет на структуру draft и предупреждения.':'This affects draft structure and warnings.'}</span></li>
          <li><b>{ru?'Опишите стороны':'Describe the parties'}</b><span>{ru?'Используйте юридические имена компаний или ФИО.':'Use legal company names or full names.'}</span></li>
          <li><b>{ru?'Опишите услугу/предмет':'Describe the subject'}</b><span>{ru?'Чем конкретнее описание, тем понятнее шаблон.':'The clearer the description, the better the template.'}</span></li>
          <li><b>{ru?'Проверьте draft в MavenLex':'Review the draft'}</b><span>{ru?'Экспортируйте и проверьте спорные условия перед подписанием.':'Export and send to MavenLex before signing.'}</span></li>
        </ol>
        <div className="builderDisclaimer"><b>{ru?'Важно':'Important'}</b><p>{ru?'Draft нужен для подготовки и переговоров. Финальную версию нужно проверить по фактам, документам и актуальным нормам.':'The draft is for preparation and negotiation. A MavenLex in your jurisdiction should review the final version.'}</p></div>
      </aside>

      <section className="glass formPanel builderForm">
        <div className="builderSectionTitle"><span>01</span><div><b>{ru?'Основные данные':'Core details'}</b><p>{ru?'Минимум информации для создания понятного draft.':'Minimum information needed for a clear draft.'}</p></div></div>
        <div className="formGrid">
          <Field label={ru?'Тип договора':'Contract type'}><select value={answers.type} onChange={e=>set('type',e.target.value)}>{(localizedContractTypes[lang] || localizedContractTypes.ru).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></Field>
          <Field label={ru?'Юрисдикция':'Jurisdiction'}><select value={answers.country} onChange={e=>set('country',e.target.value)}>{JURISDICTION_OPTIONS.map(option => <option key={option.value} value={option.value}>{jurisdictionLabel(option.value, lang)}</option>)}</select></Field>
          <Field label={ru?'Сторона A *':'Party A *'}><input className={fieldClass('partyA')} value={answers.partyA} onBlur={()=>mark('partyA')} onChange={e=>set('partyA',e.target.value)} placeholder={ru?'Например: Client LLC':'For example: Client LLC'} /></Field>
          <Field label={ru?'Сторона B *':'Party B *'}><input className={fieldClass('partyB')} value={answers.partyB} onBlur={()=>mark('partyB')} onChange={e=>set('partyB',e.target.value)} placeholder={ru?'Например: Provider Ltd':'For example: Provider Ltd'} /></Field>
          <Field label={ru?'Предмет договора *':'Contract subject *'} wide><textarea className={fieldClass('subject')} value={answers.subject} onBlur={()=>mark('subject')} onChange={e=>set('subject',e.target.value)} placeholder={ru?'Например: разработка лендинга, настройка рекламы, консультационные услуги':'For example: landing page development, ad setup, consulting services'} /></Field>
        </div>

        <div className="builderSectionTitle"><span>02</span><div><b>{ru?'Коммерческие условия':'Commercial terms'}</b><p>{ru?'Заполните оплату, сроки и ключевые ограничения.':'Add payment, timing and key limitations.'}</p></div></div>
        <div className="formGrid">
          <Field label={ru?'Цена *':'Price *'}><input className={fieldClass('price')} value={answers.price} onBlur={()=>mark('price')} onChange={e=>set('price',e.target.value)} placeholder="€2,000" /></Field>
          <Field label={ru?'Оплата':'Payment'}><input value={answers.payment} onChange={e=>set('payment',e.target.value)} placeholder="50% upfront, 50% after delivery" /></Field>
          <Field label={ru?'Срок':'Term'}><input value={answers.term} onChange={e=>set('term',e.target.value)} placeholder="3 months" /></Field>
          <Field label={ru?'Расторжение':'Termination'}><input value={answers.termination} onChange={e=>set('termination',e.target.value)} /></Field>
          <Field label={ru?'Ответственность':'Liability'} wide><input value={answers.liability} onChange={e=>set('liability',e.target.value)} /></Field>
        </div>

        {error && <div className="error strongError"><b>{ru?'Нужно исправить':'Needs attention'}</b><p>{error}</p></div>}
        <div className="actions builderActions"><button className="primary large" onClick={generate} disabled={loading || completion < 100}>{loading ? (ru?'Генерируем draft...':'Generating draft...') : (ru?'Создать draft-шаблон':'Generate draft template')}</button><button className="secondary large" onClick={()=>go('/report')}>{ru?'Открыть Report':'Open Report'}</button></div>
      </section>
    </section>
    {builtContract && <GeneratedContract ru={ru} lang={lang} contract={builtContract} />}
  </main>;
}

function downloadFile(name, content, type='text/plain') { const blob = new Blob([content], { type }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 400); }
function GeneratedContract({ ru, lang, contract }) {
  const text = T(contract.contractText, lang);
  const fillGuide = Array.isArray(T(contract.fillGuide, lang)) ? T(contract.fillGuide, lang) : [];
  const risks = Array.isArray(contract.riskCheck) ? contract.riskCheck : [];
  function exportDocx() { downloadFile('mavenlex-draft-contract.docx', text, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); }
  function exportPdf() {
    const safe = text.replace(/[&<>]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));
    const w = window.open('', '_blank');
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Draft Contract</title><style>body{font-family:Arial,sans-serif;padding:42px;line-height:1.6;color:#111827}h1{font-size:28px}pre{white-space:pre-wrap;font-family:Arial,sans-serif}footer{margin-top:30px;padding-top:15px;border-top:1px solid #ddd;color:#666;font-size:12px}</style></head><body><h1>Draft Contract</h1><pre>${safe}</pre><footer>This draft is informational and must be reviewed by MavenLex before signing.</footer><script>window.print()</script></body></html>`);
    w.document.close();
  }
  return <section className="generatedBuilder">
    <div className="generatedHeader glass">
      <div><div className="eyebrow">GENERATED DRAFT</div><h2>{T(contract.title, lang)}</h2><p>{ru?'Проверьте текст, заполните недостающие данные и ещё раз проверьте финальную версию перед подписанием.':'Review the text, fill any missing details and send the final version to MavenLex before signing.'}</p></div>
      <div className="actions"><button className="primary" onClick={exportPdf}>{ru?'Экспорт PDF':'Export PDF'}</button><button className="secondary" onClick={exportDocx}>{ru?'Экспорт Word':'Export Word'}</button></div>
    </div>
    <div className="generatedLayout">
      <article className="glass contractPaper"><pre>{text}</pre></article>
      <aside className="generatedSide">
        <Panel title={ru?'Как заполнять':'How to fill'}><ol>{fillGuide.map((x,i)=><li key={i}>{x}</li>)}</ol></Panel>
        <Panel title={ru?'Risk check':'Risk check'}><ul>{risks.map((x,i)=><li key={i}>{T(x,lang)}</li>)}</ul></Panel>
        <div className="glass builderDisclaimer"><b>{ru?'Не финальная юридическая консультация':'Not final legal advice'}</b><p>{ru?'Этот draft помогает подготовиться к переговорам. Перед подписанием проверьте факты, документы и актуальные нормы.':'This draft helps prepare for negotiation. A MavenLex should review it before signing.'}</p></div>
      </aside>
    </div>
  </section>;
}

function Dashboard({ ru, report, go, selectedPlan, history, usage, updateHistoryItem, removeHistoryItem }) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ view: 'active', type: 'all', risk: 'all', folder: 'all' });
  const folders = useMemo(() => ['all', ...new Set((history || []).map(workspaceFolder))], [history]);
  const visible = useMemo(() => (history || []).filter(item => historyMatchesWorkspaceFilters(item, filters, query)), [history, filters, query]);
  const active = (history || []).filter(x => !x.archived);
  const favorites = active.filter(x => x.favorite).length;
  const highRisk = active.filter(x => workspaceRiskBucket(x) === 'high').length;
  const comparisons = active.filter(x => x.type === 'comparison').length;
  const planLabel = selectedPlan === 'business' ? 'Business' : selectedPlan === 'pro' ? 'Pro' : 'Free';
  function patch(id, patchValue) { updateHistoryItem?.(id, patchValue); }
  return <main className="page workspacePage">
    <PageTitle label="PERSONAL CABINET" title={ru?'Личная история MavenLex':'MavenLex personal history'} text={ru?'Все ваши анализы, сравнения, заметки, избранное и архив в одном месте.':'All your reviews, comparisons, notes, favorites and archive in one place.'}/>
    <section className="grid four workspaceStats"><Metric label={ru?'Всего записей':'Total records'} value={String(history?.length || 0)} /><Metric label={ru?'High-risk':'High-risk'} value={String(highRisk)} /><Metric label={ru?'Сравнения':'Comparisons'} value={String(comparisons)} /><Metric label={ru?'Тариф':'Plan'} value={planLabel} /></section>
    <section className="glass workspaceControls">
      <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={ru?'Поиск по файлу, заметке, папке, резюме...':'Search file, note, folder, summary...'} />
      <select value={filters.view} onChange={e=>setFilters({...filters, view:e.target.value})}><option value="active">{ru?'Активные':'Active'}</option><option value="favorites">{ru?'Избранные':'Favorites'}</option><option value="archived">{ru?'Архив':'Archive'}</option><option value="all">{ru?'Все':'All'}</option></select>
      <select value={filters.type} onChange={e=>setFilters({...filters, type:e.target.value})}><option value="all">{ru?'Все типы':'All types'}</option><option value="contract">{ru?'Анализы':'Reviews'}</option><option value="comparison">{ru?'Сравнения':'Comparisons'}</option><option value="document">{ru?'Документы':'Documents'}</option></select>
      <select value={filters.risk} onChange={e=>setFilters({...filters, risk:e.target.value})}><option value="all">{ru?'Любой риск':'Any risk'}</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="none">—</option></select>
      <select value={filters.folder} onChange={e=>setFilters({...filters, folder:e.target.value})}>{folders.map(f => <option key={f} value={f}>{f === 'all' ? (ru?'Все папки':'All folders') : f}</option>)}</select>
    </section>
    <section className="glass workspaceBoard">
      <div className="historyPanelTop"><div><div className="eyebrow">PERSONAL HISTORY</div><h2>{ru?'История и материалы':'History and saved materials'}</h2><p>{ru?'Сохраняйте важное в избранное, добавляйте заметки и архивируйте старые отчёты.':'Mark important items as favorites, add notes and archive old reports.'}</p></div><button className="primary" onClick={()=>go('/analyze')}>{ru?'Новый анализ':'New review'}</button></div>
      {visible.length ? <div className="workspaceList">{visible.map(item => <article className={`workspaceItem ${item.favorite?'favorite':''} ${item.archived?'archived':''}`} key={item.id}>
        <div className="workspaceItemTop"><div><span className="historyKind">{historyKindLabel(item, ru)} · {workspaceFolder(item)}</span><b>{item.title || historyTitle(item, ru)}</b><small>{formatDateTime(item.createdAt, ru)} · {historyStatusLabel(item, ru)}</small></div><span className={`riskBadge ${workspaceRiskBucket(item)}`}>{item.riskScore || item.payload?.riskScore || '—'}/100</span></div>
        <p>{historySummary(item, ru)}</p>
        <div className="workspaceMetaEdit"><input value={item.folder || workspaceFolder(item)} onChange={e=>patch(item.id,{folder:e.target.value})} placeholder={ru?'Папка':'Folder'} /><input value={item.notes || ''} onChange={e=>patch(item.id,{notes:e.target.value})} placeholder={ru?'Заметка к анализу':'Note for this item'} /></div>
        <div className="historyActions"><button className="secondary" onClick={()=>patch(item.id,{favorite:!item.favorite})}>{item.favorite ? (ru?'Убрать из избранного':'Unfavorite') : (ru?'В избранное':'Favorite')}</button><button className="secondary" onClick={()=>patch(item.id,{archived:!item.archived})}>{item.archived ? (ru?'Вернуть':'Restore') : (ru?'В архив':'Archive')}</button>{item.type==='contract' && <button className="primary" onClick={()=>{localStorage.lastReport=JSON.stringify(item.payload); go('/report');}}>{ru?'Открыть':'Open'}</button>}<button className="secondary dangerMini" onClick={()=>removeHistoryItem?.(item.id)}>{ru?'Удалить':'Delete'}</button></div>
      </article>)}</div> : <div className="emptyHistory polishedEmpty"><b>{ru?'Ничего не найдено':'Nothing found'}</b><p>{ru?'Измените фильтры или загрузите новый договор.':'Change filters or upload a new contract.'}</p><button className="primary" onClick={()=>go('/analyze')}>{ru?'Проверить договор':'Review contract'}</button></div>}
    </section>
  </main>;
}

function Metric({ label, value }) { return <div className="glass metric"><span>{label}</span><b>{value}</b></div>; }
function Card({ title, text, action, onClick }) { return <div className="glass feature"><h3>{title}</h3><p>{text}</p><button className="secondary" onClick={onClick}>{action}</button></div>; }

function CompareContracts({ ru, lang, jurisdiction, serverSession, addHistoryItem, go }) {
  const [oldFile, setOldFile] = useState(null);
  const [newFile, setNewFile] = useState(null);
  const [analysisDepth, setAnalysisDepth] = useState('standard');
  const [userRole, setUserRole] = useState('unknown');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [comparison, setComparison] = useState(() => readJson('mavenlexLastComparison', null));
  const [copied, setCopied] = useState('');
  const oldInputRef = useRef(null);
  const newInputRef = useRef(null);

  async function runCompare() {
    if (!oldFile || !newFile || loading) return;
    setLoading(true); setError(''); setCopied('');
    try {
      const form = new FormData();
      form.append('oldContract', oldFile);
      form.append('newContract', newFile);
      form.append('jurisdiction', jurisdiction || '');
      form.append('analysisDepth', analysisDepth);
      form.append('userRole', userRole);
      const csrfToken = currentCsrfToken();
      const res = await fetchWithTimeout(`${API}/api/compare-contracts`, {
        method: 'POST', credentials: 'include', headers: csrfToken ? { 'X-CSRF-Token': csrfToken } : {}, body: form
      }, 120000);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Comparison failed');
      setComparison(data);
      writeJson('mavenlexLastComparison', data);
      addHistoryItem?.({ type: 'comparison', fileName: `${data.meta?.oldFileName || 'old'} → ${data.meta?.newFileName || 'new'}`, riskScore: data.after?.riskScore || 0, summary: cleanSnippet(T(data.summary, lang), 220), payload: data });
    } catch (e) {
      setError(friendlyError(e, ru));
    } finally {
      setLoading(false);
    }
  }
  async function copy(part) { await copyComparisonPart(comparison, lang, part); setCopied(part); setTimeout(()=>setCopied(''), 1800); }
  const delta = Number(comparison?.riskDelta || 0);
  const worse = (comparison?.riskChanges || []).filter(x => ['new_risk','risk_worse'].includes(x.type));
  const better = (comparison?.riskChanges || []).filter(x => ['risk_removed','risk_better'].includes(x.type));
  return <main className="page comparePage">
    <PageTitle label="CONTRACT COMPARISON" title={ru?'Сравнить две версии договора':'Compare two contract versions'} text={ru?'Загрузите старую и новую редакцию. MavenLex покажет новые риски, улучшения, изменения пунктов и итоговое решение.' : 'Upload old and new drafts. MavenLex shows new risks, improvements, changed clauses and a decision.'}/>
    <section className="glass compareUploadPanel">
      <div className="compareInputs filePickerGrid">
        <div className={`filePickerCard ${oldFile ? 'selected' : ''}`}>
          <div className="filePickerHead"><b>{ru?'Старая версия':'Old version'}</b><span>{ru?'База для сравнения':'Baseline draft'}</span></div>
          <input ref={oldInputRef} type="file" accept=".txt,.docx,.pdf" hidden onChange={e=>setOldFile(e.target.files?.[0] || null)} />
          <button type="button" className="secondary filePickerButton" onClick={()=>oldInputRef.current?.click()}>{oldFile ? (ru?'Выбрать другой файл':'Choose another file') : (ru?'Выбрать файл':'Choose file')}</button>
          <div className="filePickerName">{oldFile?.name || (ru?'TXT, DOCX или PDF до 15 MB':'TXT, DOCX or PDF up to 15 MB')}</div>
        </div>
        <div className={`filePickerCard ${newFile ? 'selected' : ''}`}>
          <div className="filePickerHead"><b>{ru?'Новая версия':'New version'}</b><span>{ru?'Редакция, которую нужно оценить':'Draft to review'}</span></div>
          <input ref={newInputRef} type="file" accept=".txt,.docx,.pdf" hidden onChange={e=>setNewFile(e.target.files?.[0] || null)} />
          <button type="button" className="secondary filePickerButton" onClick={()=>newInputRef.current?.click()}>{newFile ? (ru?'Выбрать другой файл':'Choose another file') : (ru?'Выбрать файл':'Choose file')}</button>
          <div className="filePickerName">{newFile?.name || (ru?'TXT, DOCX или PDF до 15 MB':'TXT, DOCX or PDF up to 15 MB')}</div>
        </div>
      </div>
      <div className="compareOptions">
        <label>{ru?'Глубина':'Depth'}<select value={analysisDepth} onChange={e=>setAnalysisDepth(e.target.value)}><option value="quick">Quick</option><option value="standard">Standard</option><option value="deep">Deep</option></select></label>
        <label>{ru?'Ваша роль':'Your side'}<select value={userRole} onChange={e=>setUserRole(e.target.value)}><option value="unknown">{ru?'Не указано':'Unknown'}</option><option value="customer">{ru?'Заказчик/покупатель':'Customer/buyer'}</option><option value="provider">{ru?'Исполнитель/поставщик':'Provider/seller'}</option></select></label>
      </div>
      <button className="primary large" disabled={!oldFile || !newFile || loading} onClick={runCompare}>{loading ? (ru?'Сравниваем версии...':'Comparing versions...') : (ru?'Сравнить версии':'Compare versions')}</button>
      {error && <div className="errorBox">{error}</div>}
      <p className="hint">{ru?'Файлы используются только для анализа. Для конфиденциальных договоров удалите персональные данные перед загрузкой.':'Files are used only for analysis. Remove personal data from confidential contracts before upload.'}</p>
    </section>
    {loading && <section className="glass actionLoading"><b>{ru?'MavenLex сравнивает версии':'MavenLex is comparing versions'}</b><span>{ru?'Смотрим risk delta, новые риски, удалённые пункты и условия для переговоров.':'Checking risk delta, new risks, removed clauses and negotiation points.'}</span><i></i></section>}
    {comparison && <section className="comparisonReport">
      <section className="glass comparisonHero">
        <div><div className="eyebrow">VERSION DELTA</div><h2>{T(comparison.riskDeltaLabel, lang)}</h2><p>{T(comparison.summary, lang)}</p></div>
        <div className={`deltaBadge ${delta > 0 ? 'worse' : delta < 0 ? 'better' : 'same'}`}>{delta >= 0 ? '+' : ''}{delta}</div>
      </section>
      <section className="reportKpis"><Metric label={ru?'Старая версия':'Old version'} value={`${comparison.before?.riskScore ?? '—'}/100`} /><Metric label={ru?'Новая версия':'New version'} value={`${comparison.after?.riskScore ?? '—'}/100`} /><Metric label={ru?'Новые/хуже':'New/worse'} value={worse.length} /><Metric label={ru?'Лучше/убрано':'Better/removed'} value={better.length} /></section>
      <section className="glass comparisonDecision"><div className="eyebrow">DECISION</div><h2>{ru?'Что делать с новой версией':'What to do with the new version'}</h2><p>{T(comparison.decision, lang)}</p><div className="accountActions"><button className="primary" onClick={()=>copy('decision')}>{ru?'Скопировать итог':'Copy decision'}</button><button className="secondary" onClick={()=>copy('message')}>{ru?'Сообщение контрагенту':'Counterparty message'}</button><button className="primary" onClick={()=>downloadComparison(comparison, lang, 'pdf')}>PDF</button><button className="secondary" onClick={()=>downloadComparison(comparison, lang, 'doc')}>Word</button><button className="secondary" onClick={()=>downloadComparison(comparison, lang, 'html')}>HTML</button><button className="secondary" onClick={()=>downloadComparison(comparison, lang, 'md')}>Markdown</button><button className="secondary" onClick={()=>downloadComparison(comparison, lang, 'txt')}>TXT</button></div>{copied && <small className="successText">{ru?'Скопировано':'Copied'}</small>}</section>
      <section className="grid two comparisonGrids">
        <article className="glass"><b>{ru?'Изменения рисков':'Risk changes'}</b>{(comparison.riskChanges || []).length ? <ol>{comparison.riskChanges.map((r,i)=><li key={i}><span className={`riskBadge ${String(r.level||'').toLowerCase()}`}>{r.type} · {r.beforeScore} → {r.afterScore}</span><strong>{T(r.title, lang)}</strong><small>{T(r.action, lang)}</small></li>)}</ol> : <p>{ru?'Существенных изменений риска не найдено.':'No material risk changes found.'}</p>}<button className="secondary" onClick={()=>copy('risks')}>{ru?'Скопировать риски':'Copy risks'}</button></article>
        <article className="glass"><b>{ru?'Изменения пунктов':'Clause changes'}</b>{(comparison.clauseChanges || []).length ? <ol>{comparison.clauseChanges.map((c,i)=><li key={i}><span>{c.beforeStatus} → {c.afterStatus}</span><strong>{T(c.title, lang)}</strong><small>{T(c.recommendation, lang)}</small></li>)}</ol> : <p>{ru?'Существенных изменений пунктов не найдено.':'No material clause changes found.'}</p>}<button className="secondary" onClick={()=>copy('clauses')}>{ru?'Скопировать пункты':'Copy clauses'}</button></article>
      </section>
      <section className="grid two comparisonGrids"><article className="glass"><b>{ru?'Фокус переговоров':'Negotiation focus'}</b><ol>{(T(comparison.negotiationFocus, lang) || []).map((x,i)=><li key={i}>{x}</li>)}</ol></article><article className="glass"><b>{ru?'Следующие действия':'Next actions'}</b><ol>{(T(comparison.nextActions, lang) || []).map((x,i)=><li key={i}>{x}</li>)}</ol></article></section>
      <section className="glass comparisonTerms"><b>{ru?'Изменения слов/тем':'Changed terms/topics'}</b><div><span><strong>{ru?'Добавлено':'Added'}:</strong> {(comparison.addedTerms || []).slice(0,16).join(', ') || '—'}</span><span><strong>{ru?'Удалено':'Removed'}:</strong> {(comparison.removedTerms || []).slice(0,16).join(', ') || '—'}</span></div></section>
      <p className="hint legalDisclaimer">{T(comparison.disclaimer, lang)}</p>
    </section>}
  </main>;
}


function safeLocalArray(key) {
  try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch (_) { return []; }
}
function writeLocalArray(key, value) {
  localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value.slice(0, 80) : []));
}
function reportStorageId(report) {
  return String(report?.meta?.fileName || report?.meta?.generatedAt || report?.summary?.ru || report?.summary || 'current-report').slice(0,120);
}
function addFavoriteItem(item) {
  const list = safeLocalArray('mavenlexFavorites');
  const id = item.id || `${item.type || 'item'}-${Date.now()}`;
  writeLocalArray('mavenlexFavorites', [{ ...item, id, createdAt: new Date().toISOString() }, ...list.filter(x => x.id !== id)]);
  return id;
}
function removeFavoriteItem(id) {
  writeLocalArray('mavenlexFavorites', safeLocalArray('mavenlexFavorites').filter(x => x.id !== id));
}
function savedReportNotes(report) {
  const id = reportStorageId(report);
  try { return JSON.parse(localStorage.getItem('mavenlexReportNotes') || '{}')[id] || ''; } catch (_) { return ''; }
}
function saveReportNotes(report, text) {
  const id = reportStorageId(report);
  let all = {};
  try { all = JSON.parse(localStorage.getItem('mavenlexReportNotes') || '{}') || {}; } catch (_) {}
  all[id] = text;
  localStorage.setItem('mavenlexReportNotes', JSON.stringify(all));
}

function Report({ ru, lang, report, serverSession, selectedPlan, usage, bumpUsage, go }) {
  const [active, setActive] = useState(0);
  const [chat, setChat] = useState([]);
  const [q, setQ] = useState('');
  const [chatThinking, setChatThinking] = useState(false);
  const [chatMode, setChatMode] = useState('smart');
  const [thinkingStep, setThinkingStep] = useState(0);
  const [personalNote, setPersonalNote] = useState(() => savedReportNotes(report));
  const [reportSavedMessage, setReportSavedMessage] = useState('');
  const [negotiationTone, setNegotiationTone] = useState('neutral');

  if (!report) {
    return <main className="page reportPage">
      <section className="glass emptyReportHero">
        <div>
          <div className="eyebrow">CONTRACT REPORT</div>
          <h1>{ru?'Отчёт появится после анализа договора':'Your report appears after contract analysis'}</h1>
          <p>{ru?'Загрузите PDF, DOCX или TXT в разделе «Договор». MavenLex подготовит риск-скор, краткий вывод, опасные пункты, план правок и что проверить.' : 'Upload a PDF, DOCX or TXT in Contract. MavenLex will prepare a risk score, executive summary, dangerous clauses, edit plan and verification points.'}</p>
          <div className="emptyReportActions">
            <button className="primary large" onClick={()=>go?.('/analyze')}>{ru?'Проверить договор':'Review contract'}</button>
            <button className="secondary large" onClick={()=>go?.('/situation')}>{ru?'Разобрать ситуацию':'Analyze situation'}</button>
          </div>
        </div>
        <div className="emptyReportPreview">
          <span>{ru?'Что будет в отчёте':'What the report includes'}</span>
          <b>{ru?'Риск-скор · вывод · правки · что проверить':'Risk score · verdict · edits · verification points'}</b>
          <ul>
            <li>{ru?'Какие пункты опасны':'Which clauses are dangerous'}</li>
            <li>{ru?'Что попросить изменить':'What to ask to change'}</li>
            <li>{ru?'Можно ли двигаться дальше':'Whether to move forward'}</li>
          </ul>
        </div>
      </section>
    </main>;
  }

  const risks = Array.isArray(report.risks) ? report.risks : [];
  const risk = risks[active] || risks[0];
  const highCount = risks.filter(r => r.level === 'High').length;
  const mediumCount = risks.filter(r => r.level === 'Medium').length;
  const score = Number(report.riskScore || 0);
  const readiness = T(report.signatureReadiness?.text, lang) || (score > 75 ? 'Legal Review Recommended' : 'Review Recommended');
  const riskTone = score >= 80 ? 'critical' : score >= 60 ? 'warning' : 'safe';
  const generatedAt = report.meta?.generatedAt ? new Date(report.meta.generatedAt).toLocaleString(ru ? 'ru-RU' : 'en-US') : (ru ? 'Отчёт готов' : 'Report ready');
  const thinkingLabels = ru
    ? ['Читаю вопрос...', 'Понимаю ситуацию: договор, статья или общий вопрос...', 'Проверяю последствия и риски...', 'Собираю практический план...', 'Формулирую ответ простыми словами...']
    : ['Reading the question...', 'Understanding the situation: contract, statute or general issue...', 'Checking consequences and risks...', 'Preparing a practical plan...', 'Writing a plain-language answer...'];
  const arr = value => Array.isArray(value) ? value : [];
  const todayPlan = arr(T(report.todayPlan, lang));
  const dontDo = arr(T(report.dontDo, lang));
  const alreadySignedPlan = arr(T(report.alreadySignedPlan, lang));
  const MavenLexPackage = arr(T(report.MavenLexPackage, lang));
  const moneyRisk = arr(T(report.moneyRisk, lang));
  const counterpartyMessages = report.counterpartyMessages || {};
  const softMessage = T(counterpartyMessages.soft, lang) || T(report.negotiationMessage, lang);
  const neutralMessage = T(counterpartyMessages.neutral, lang) || T(report.negotiationMessage, lang);
  const firmMessage = T(counterpartyMessages.firm, lang) || T(report.negotiationMessage, lang);
  const roleRecommendations = report.roleRecommendations || {};
  const customerRole = arr(T(roleRecommendations.customer, lang));
  const providerRole = arr(T(roleRecommendations.provider, lang));
  const unknownRole = arr(T(roleRecommendations.unknown, lang));
  const topRisks = [...risks].sort((a, b) => Number(b.score || 0) - Number(a.score || 0)).slice(0, 3);
  const matrixEntries = Object.entries(report.riskMatrix || {});
  const clauseMap = Array.isArray(report.clauseMap) ? report.clauseMap : [];
  const missingClauses = Array.isArray(report.missingClauses) ? report.missingClauses : [];
  const redFlags = Array.isArray(report.redFlags) ? report.redFlags : [];
  const detectedType = T(report.contractIntelligence?.detectedType, lang) || report.contractIntelligence?.selectedType || (ru?'Не определён':'Not detected');
  const nextActions = (todayPlan.length ? todayPlan : arr(T(report.actionPlan, lang))).slice(0, 5);
  const MavenLexQuestions = (report.MavenLexQuestions || []).map(x => T(x, lang)).filter(Boolean).slice(0, 5);
  const reportQualityLabel = score >= 80
    ? (ru ? 'Высокий риск — не подписывать без правок' : 'High risk — do not sign without edits')
    : score >= 60
      ? (ru ? 'Средний риск — сначала согласовать правки' : 'Medium risk — negotiate edits first')
      : (ru ? 'Низкий/умеренный риск — проверьте детали перед подписью' : 'Low/moderate risk — verify details before signing');
  const decisionHelper = reportDecisionHelper(report, lang);
  const signingChecklist = buildSigningChecklist(report, lang);
  const exportLimits = PLAN_LIMITS[selectedPlan || 'free'] || PLAN_LIMITS.free;
  const usedExports = usage?.month === monthKey() ? Number(usage?.exports || 0) : 0;
  const exportLeft = exportLimits.exports === 999 ? Infinity : Math.max(0, Number(exportLimits.exports || 0) - usedExports);
  const guardedExport = (format) => {
    if (exportLeft <= 0) return alert(ru ? 'Лимит экспорта по текущему тарифу закончился. Перейдите на Pro/Business или дождитесь следующего месяца.' : 'Your export limit is reached. Upgrade to Pro/Business or wait until next month.');
    bumpUsage?.('exports');
    downloadReportFile(report, lang, format, { plan: selectedPlan || 'free' });
  };
  const guardedTextExport = (format) => {
    if (exportLeft <= 0) return alert(ru ? 'Лимит экспорта по текущему тарифу закончился.' : 'Your export limit is reached.');
    bumpUsage?.('exports');
    downloadReportText(report, lang, format);
  };
  const copyAndNotify = async (part) => {
    await copyReportPart(report, lang, part);
    alert(ru ? 'Скопировано.' : 'Copied.');
  };
  const activeCounterpartyMessage = negotiationTone === 'soft' ? softMessage : negotiationTone === 'firm' ? firmMessage : neutralMessage;
  const savePersonalNote = () => { saveReportNotes(report, personalNote); try { apiJson('/api/user/history', { item: { id: reportStorageId(report), type:'contract', title: report.meta?.fileName || 'Contract report', summary: T(report.summary, lang), notes: personalNote, favorite: false, payload: report } }, serverSession); } catch (_) {} setReportSavedMessage(ru ? 'Заметка сохранена к этому отчёту.' : 'Note saved to this report.'); };
  const favoriteReport = () => { const item = { id: `report-${reportStorageId(report)}`, type:'report', title: report.meta?.fileName || (ru?'Отчёт по договору':'Contract report'), text: T(report.summary, lang), riskScore: report.riskScore, favorite:true, payload: report }; addFavoriteItem(item); try { apiJson('/api/user/history', { item: { ...item, type:'contract', summary:item.text } }, serverSession); } catch (_) {} setReportSavedMessage(ru ? 'Отчёт добавлен в избранное.' : 'Report added to favorites.'); };
  const favoriteMessage = () => { addFavoriteItem({ id: `message-${reportStorageId(report)}-${negotiationTone}`, type:'message', title: ru?'Сообщение контрагенту':'Counterparty message', text: activeCounterpartyMessage }); setReportSavedMessage(ru ? 'Сообщение добавлено в избранное.' : 'Message added to favorites.'); };

  function copyText(text) {
    navigator.clipboard?.writeText(String(text || ''));
  }

  function speak() {
    const u = new SpeechSynthesisUtterance(T(report.voiceScript || report.summary, lang));
    u.lang = ru ? 'ru-RU' : 'en-US';
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  async function ask(text = q) {
    if (!text.trim() || chatThinking) return;
    setChat(c => [...c, { from: 'user', text }]);
    setQ('');
    setChatThinking(true);
    setThinkingStep(0);
    const stepTimer = setInterval(() => setThinkingStep(x => Math.min(x + 1, thinkingLabels.length - 1)), 3500);
    try {
      const res = await fetchWithTimeout(`${API}/api/legal-chat`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json', ...(serverSession?.session?.csrfToken ? { 'X-CSRF-Token': serverSession.session.csrfToken } : {}), }, body: JSON.stringify({ question:text, report, language:lang, mode: chatMode, history: chat.map(m => ({ role: m.from, text: m.text })).slice(-8) }) }, 120000);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Chat failed');
      setChat(c => [...c, { from:'ai', text:data.answer, mode:data.mode }]);
    } catch(e) {
      setChat(c => [...c, { from:'ai', text: ru ? `AI не смог ответить: ${friendlyError(e, true)}` : `AI could not answer: ${friendlyError(e, false)}` }]);
    } finally {
      clearInterval(stepTimer);
      setChatThinking(false);
      setThinkingStep(0);
    }
  }

  return <main className="page reportPage">
    <section className="reportHero glass">
      <div>
        <div className="eyebrow executiveEyebrow">CONFIDENTIAL LEGAL REVIEW</div>
        <h1>{ru ? 'Юридический отчёт по договору' : 'Executive legal report'}</h1>
        <p>{T(report.summary, lang)}</p>
        <div className="reportMetaLine">
          <span>{ru ? 'Файл' : 'File'}: <b>{report.meta?.fileName || (ru ? 'договор' : 'contract')}</b></span>
          <span>{ru ? 'Дата' : 'Date'}: <b>{generatedAt}</b></span>
          <span>{ru ? 'Текст' : 'Text'}: <b>{report.meta?.extractedCharacters || '—'} chars</b></span>
        </div>
      </div>
      <div className={`reportScoreCard ${riskTone}`}>
        <span>{ru ? 'Общий риск' : 'Overall risk'}</span>
        <strong>{score}/100</strong>
        <b>{readiness}</b>
        <p>{T(report.decisionRecommendation, lang)}</p>
        {report.analysisNotes && <small className="analysisNotes">{T(report.analysisNotes, lang)}</small>}
      </div>
    </section>

    <section className="executiveSummaryBand glass">
      <div>
        <span>{ru?'KEY DECISION':'KEY DECISION'}</span>
        <b>{readiness}</b>
        <p>{T(report.decisionRecommendation, lang)}</p>
      </div>
      <div>
        <span>{ru?'FOCUS AREAS':'FOCUS AREAS'}</span>
        <b>{highCount} High · {mediumCount} Medium</b>
        <p>{ru?'Сначала закрыть критические риски, потом возвращаться к подписи.':'Close critical risks first, then return to signing.'}</p>
      </div>
      <div>
        <span>{ru?'NEXT MOVE':'NEXT MOVE'}</span>
        <b>{ru?'Запросить правки':'Request edits'}</b>
        <p>{ru?'Скопируйте сообщение второй стороне или задайте вопрос AI.':'Copy the counterparty message or ask AI.'}</p>
      </div>
    </section>

    <section className="glass professionalReportPack v611">
      <div className="reportPackHeader">
        <div><div className="eyebrow">PROFESSIONAL REPORT</div><h2>{ru?'Рабочий вывод по договору':'Working contract decision'}</h2><p>{ru?'Коротко: вердикт, топ-риски, что исправить, что спросить и что написать второй стороне.':'Short: verdict, top risks, what to fix, what to ask and what to write to the counterparty.'}</p></div>
        <button className="secondary" onClick={favoriteReport}>{ru?'В избранное':'Save favorite'}</button>
      </div>
      <div className="reportPackGrid">
        <article><span>{ru?'Вердикт':'Verdict'}</span><b>{reportQualityLabel}</b><p>{decisionHelper.action}</p></article>
        <article><span>{ru?'Топ-риски':'Top risks'}</span><ul>{topRisks.slice(0,3).map((r,i)=><li key={r.id || i}>{T(r.title, lang)} — {r.score || '—'}/100</li>)}</ul></article>
        <article><span>{ru?'Что исправить':'What to fix'}</span><ul>{topRisks.slice(0,3).map((r,i)=><li key={r.id || i}>{T(r.whatToDo, lang) || T(r.suggestedDraft, lang) || (ru?'Уточнить формулировку':'Clarify wording')}</li>)}</ul></article>
        <article><span>{ru?'Что проверить':'Verification questions'}</span><ul>{MavenLexQuestions.slice(0,3).map((x,i)=><li key={i}>{x}</li>)}</ul></article>
      </div>
    </section>

    <section className="glass negotiationWorkbench v611">
      <div><div className="eyebrow">NEGOTIATION MODE</div><h2>{ru?'Режим переговоров':'Negotiation mode'}</h2><p>{ru?'Выберите тон сообщения: мягко, нейтрально или жёстко. Можно скопировать и отправить контрагенту.':'Choose the message tone: soft, neutral or firm. Copy and send it to the counterparty.'}</p></div>
      <div className="toneButtons">
        <button className={negotiationTone==='soft'?'active':''} onClick={()=>setNegotiationTone('soft')}>{ru?'Мягко':'Soft'}</button>
        <button className={negotiationTone==='neutral'?'active':''} onClick={()=>setNegotiationTone('neutral')}>{ru?'Нейтрально':'Neutral'}</button>
        <button className={negotiationTone==='firm'?'active':''} onClick={()=>setNegotiationTone('firm')}>{ru?'Жёстко':'Firm'}</button>
      </div>
      <div className="copyMessageBox"><p>{activeCounterpartyMessage}</p><div><button className="primary" onClick={()=>{copyText(activeCounterpartyMessage); alert(ru?'Сообщение скопировано.':'Message copied.')}}>{ru?'Скопировать сообщение':'Copy message'}</button><button className="secondary" onClick={favoriteMessage}>{ru?'Сохранить в избранное':'Save favorite'}</button></div></div>
    </section>

    <section className="glass reportNotesPanel v611">
      <div><div className="eyebrow">PERSONAL NOTES</div><h2>{ru?'Заметки к договору':'Contract notes'}</h2><p>{ru?'Сохраните важные детали: что обещал контрагент, сроки, сумму, договорённости или свои мысли перед разговором в MavenLex.':'Save details: what the counterparty promised, deadlines, amount, agreements or thoughts before speaking with MavenLex.'}</p></div>
      <textarea value={personalNote} onChange={e=>setPersonalNote(e.target.value)} placeholder={ru?'Например: контрагент обещал оплатить до пятницы, есть переписка в Telegram...':'For example: counterparty promised to pay by Friday, Telegram messages exist...'} rows="4" />
      <div className="noteActions"><button className="primary" onClick={savePersonalNote}>{ru?'Сохранить заметку':'Save note'}</button>{reportSavedMessage && <span>{reportSavedMessage}</span>}</div>
    </section>

    <section className="reportToolbar glass">
      <div>
        <b>{ru ? 'Экспорт и объяснение' : 'Export and explanation'}</b>
        <p>{ru ? 'Скачайте отчёт, скопируйте краткое резюме, риски или чеклист для проверки/контрагента.' : 'Download the report or copy the summary, risks, checklist and verification points.'}</p><small className="exportLimitHint">{ru?'Экспортов осталось':'Exports left'}: {exportLimits.exports === 999 ? '∞' : exportLeft}</small>
      </div>
      <div className="actions reportExportActions">
        <button className="primary" onClick={()=>guardedExport('pdf')}>{ru ? 'PDF / печать' : 'PDF / print'}</button>
        <button className="secondary" onClick={()=>guardedExport('doc')}>Word</button>
        <button className="secondary" onClick={()=>guardedExport('html')}>{ru ? 'HTML отчёт' : 'HTML report'}</button>
        <button className="secondary" onClick={()=>guardedTextExport('md')}>Markdown</button>
        <button className="secondary" onClick={()=>guardedTextExport('txt')}>TXT</button>
        <button className="secondary" onClick={()=>guardedExport('json')}>JSON</button>
        <button className="secondary" onClick={()=>copyAndNotify('summary')}>{ru ? 'Скопировать резюме' : 'Copy summary'}</button>
        <button className="secondary" onClick={speak}>🎧 {ru ? 'Объяснить голосом' : 'Voice summary'}</button>
      </div>
    </section>

    <section className="reportKpis executiveReportKpis">
      <Metric label={ru ? 'Критичные риски' : 'High risks'} value={highCount} />
      <Metric label={ru ? 'Средние риски' : 'Medium risks'} value={mediumCount} />
      <Metric label={ru ? 'Решение' : 'Readiness'} value={readiness} />
      <Metric label={ru ? 'Формат' : 'Format'} value={report.meta?.fileType ? report.meta.fileType.toUpperCase() : 'DOCUMENT'} />
    </section>

    <section className="glass reportActionBoard">
      <div className="reportActionIntro">
        <div className="eyebrow">EXECUTIVE ACTION BOARD</div>
        <h2>{ru?'Самое важное перед решением':'The essentials before deciding'}</h2>
        <p>{ru?'Этот блок нужен, чтобы за 30 секунд понять: можно ли подписывать, какие пункты закрыть первыми и что отправить второй стороне.' : 'This board helps the user understand in 30 seconds whether to sign, which clauses to fix first, and what to send to the other side or MavenLex.'}</p>
      </div>
      <div className="reportActionCards">
        <article className={`reportActionCard ${riskTone}`}>
          <span>{ru?'Вердикт':'Verdict'}</span>
          <b>{readiness}</b>
          <p>{T(report.decisionRecommendation, lang)}</p>
        </article>
        <article className="reportActionCard">
          <span>{ru?'Первое действие':'First action'}</span>
          <b>{nextActions[0] || (ru?'Запросить правки':'Request edits')}</b>
          <p>{nextActions[1] || (ru?'Не подписывайте договор, пока критичные пункты не уточнены письменно.':'Do not sign until critical points are clarified in writing.')}</p>
        </article>
        <article className="reportActionCard">
          <span>{ru?'Пункт проверки':'Verification point'}</span>
          <b>{MavenLexQuestions[0] || (ru?'Какие пункты нужно изменить до подписания?':'Which clauses must be changed before signing?')}</b>
          <p>{ru?'Скопируйте вопросы из отчёта и используйте их для следующей проверки договора.':'Copy the questions from the report and send them to a specialist with the contract.'}</p>
        </article>
      </div>
    </section>

    <section className="glass advancedIntelligenceMemo">
      <div className="qualityMemoIntro">
        <div className="eyebrow">ADVANCED CONTRACT INTELLIGENCE</div>
        <h2>{ru ? 'Умная карта договора' : 'Smart contract map'}</h2>
        <p>{ru ? 'Тип договора, матрица рисков, найденные/слабые пункты и красные флаги.' : 'Contract type, risk matrix, detected/weak clauses and red flags.'}</p>
      </div>
      <div className="advancedTypeLine"><b>{ru?'Тип договора':'Contract type'}:</b> {detectedType} <span>· {report.contractIntelligence?.analysisDepth || 'standard'}</span> <span>· confidence: {report.contractIntelligence?.confidence || 'Medium'}</span></div>
      {matrixEntries.length > 0 && <div className="riskMatrixGrid">{matrixEntries.map(([key, item]) => <div key={key} className={`matrixCard ${String(item.level || '').toLowerCase()}`}><span>{key}</span><b>{item.score || 0}/100</b><small>{T(item.reason, lang)}</small></div>)}</div>}
      {redFlags.length > 0 && <div className="redFlagsBox"><b>{ru?'Красные флаги':'Red flags'}</b><ul>{redFlags.map((f,i)=><li key={i}><strong>{T(f.title, lang)} · {f.severity}</strong><span>{f.evidence}</span><small>{T(f.action, lang)}</small></li>)}</ul></div>}
      {clauseMap.length > 0 && <div className="clauseMapTable"><b>{ru?'Карта ключевых пунктов':'Key clause map'}</b><div className="clauseRows">{clauseMap.map((c,i)=><div key={c.key || i} className={`clauseRow ${String(c.status || '').toLowerCase()}`}><span>{T(c.title, lang)}</span><b>{c.status}</b><p>{c.excerpt || T(c.recommendation, lang)}</p></div>)}</div></div>}
      {missingClauses.length > 0 && <div className="missingClausesBox"><b>{ru?'Что добавить/усилить':'What to add or strengthen'}</b><ol>{missingClauses.map((m,i)=><li key={i}><strong>{T(m.title,lang)}</strong><p>{T(m.whyImportant,lang)}</p><small>{T(m.suggestedAddition,lang)}</small></li>)}</ol></div>}
    </section>

    <section className="glass reportQualityMemo">
      <div className="qualityMemoIntro">
        <div className="eyebrow">REPORT QUALITY</div>
        <h2>{ru ? 'Мини-аудит договора' : 'Contract mini-audit'}</h2>
        <p>{reportQualityLabel}</p>
      </div>
      <div className="qualityMemoGrid">
        <div>
          <b>{ru ? 'Топ-риски по приоритету' : 'Top risks by priority'}</b>
          <ol>{topRisks.map((r, i) => <li key={r.id || i}><span className={`riskBadge ${String(r.level || '').toLowerCase()}`}>{r.level || 'Risk'} · {r.score || '—'}/100</span><strong>{T(r.title, lang)}</strong><small>{T(r.whatToDo, lang)}</small></li>)}</ol>
        </div>
        <div>
          <b>{ru ? 'Следующие действия' : 'Next actions'}</b>
          <ol>{nextActions.map((x, i) => <li key={i}><strong>{x}</strong></li>)}</ol>
        </div>
        <div>
          <b>{ru ? 'Вопросы для проверки' : 'Questions to verify'}</b>
          <ul>{MavenLexQuestions.length ? MavenLexQuestions.map((x, i) => <li key={i}>{x}</li>) : topRisks.map((r, i) => <li key={i}>{T(r.questionForMavenLex, lang)}</li>)}</ul>
        </div>
      </div>
    </section>

    <section className="grid two reportDecisionShareGrid">
      <article className={`glass decisionHelperCard ${decisionHelper.tone}`}>
        <div className="eyebrow">DECISION HELPER</div>
        <h2>{decisionHelper.label}</h2>
        <p>{decisionHelper.reason}</p>
        <b>{decisionHelper.action}</b>
        <div className="accountActions"><button className="primary" onClick={()=>copyAndNotify('decision')}>{ru?'Скопировать решение':'Copy decision'}</button><button className="secondary" onClick={()=>copyAndNotify('risks')}>{ru?'Скопировать риски':'Copy risks'}</button></div>
      </article>
      <article className="glass signingChecklistCard">
        <div className="eyebrow">SIGNING CHECKLIST</div>
        <h2>{ru?'Чеклист перед подписанием':'Pre-signing checklist'}</h2>
        <ol>{signingChecklist.map((x,i)=><li key={i}>{x}</li>)}</ol>
        <div className="accountActions"><button className="secondary" onClick={()=>copyAndNotify('checklist')}>{ru?'Скопировать чеклист':'Copy checklist'}</button><button className="secondary" onClick={()=>copyAndNotify('questions')}>{ru?'Что проверить':'Verification questions'}</button></div>
      </article>
    </section>

    {report.meta?.warnings?.length ? <section className="warningBox reportWarning">{report.meta.warnings.map((w,i)=><p key={i}>⚠ {w}</p>)}</section> : null}
    {report.meta?.aiMode && <section className={`aiModeBanner ${report.meta.aiMode === 'live-yandexgpt' ? 'live' : 'fallback'}`}>
      <b>{report.meta.aiMode === 'live-yandexgpt' ? (ru ? 'Live AI активен' : 'Live AI is active') : (ru ? 'AI не работает' : 'AI is not working')}</b>
      <p>{report.meta.aiMode === 'live-yandexgpt' ? (ru ? 'Ответ сформирован live AI. Шаблонные локальные ответы отключены.' : 'The answer was generated by live AI. Local template answers are disabled.') : (ru ? 'Live AI не подключён или не ответил. MavenLex больше не подменяет это шаблоном.' : 'Live AI is not connected or did not respond. MavenLex no longer hides this with a template.')}</p>
    </section>}

    <section className="reportDecision glass">
      <div>
        <div className="eyebrow">DECISION</div>
        <h2>{ru ? 'Что делать перед подписанием' : 'What to do before signing'}</h2>
        <p>{T(report.decisionRecommendation, lang)}</p>
        {report.analysisNotes && <small className="analysisNotes">{T(report.analysisNotes, lang)}</small>}
      </div>
      <ol>
        {(T(report.actionPlan, lang) || []).slice(0, 4).map((x, i) => <li key={i}>{x}</li>)}
      </ol>
    </section>

    <section className="practicalActionBlock">
      <div className="sectionHeader practicalHeader">
        <div>
          <div className="eyebrow">PRACTICAL ACTION</div>
          <h2>{ru ? 'Что делать человеку прямо сейчас' : 'What the person should do now'}</h2>
        </div>
        <p>{ru ? 'Не просто анализ: конкретные действия, ошибки, документы для проверки и сообщения второй стороне.' : 'Not just analysis: concrete actions, mistakes to avoid, MavenLex package and counterparty messages.'}</p>
      </div>
      <div className="grid two practicalGrid">
        <Panel title={ru ? 'План на сегодня' : 'Today plan'}><ol>{(todayPlan.length ? todayPlan : T(report.actionPlan, lang) || []).slice(0,5).map((x,i)=><li key={i}>{x}</li>)}</ol></Panel>
        <Panel title={ru ? 'Что НЕ делать' : 'What not to do'}><ul className="dontList">{dontDo.slice(0,5).map((x,i)=><li key={i}>{x}</li>)}</ul></Panel>
        <Panel title={ru ? 'Если уже подписали' : 'If already signed'}><ol>{alreadySignedPlan.slice(0,5).map((x,i)=><li key={i}>{x}</li>)}</ol></Panel>
        <Panel title={ru ? 'Что сохранить для проверки' : 'What to keep for verification'}><ul>{MavenLexPackage.slice(0,5).map((x,i)=><li key={i}>{x}</li>)}</ul></Panel>
      </div>
      <div className="grid two practicalGrid">
        <Panel title={ru ? 'Риск в деньгах' : 'Money exposure'}><ul>{moneyRisk.slice(0,4).map((x,i)=><li key={i}>{x}</li>)}</ul></Panel>
        <Panel title={ru ? 'Рекомендации по роли' : 'Role-based advice'}>
          <div className="roleGrid">
            <div><b>{ru?'Если вы заказчик':'If you are the customer'}</b><ul>{customerRole.slice(0,3).map((x,i)=><li key={i}>{x}</li>)}</ul></div>
            <div><b>{ru?'Если вы исполнитель':'If you are the provider'}</b><ul>{providerRole.slice(0,3).map((x,i)=><li key={i}>{x}</li>)}</ul></div>
            <div><b>{ru?'Если роль неясна':'If role is unclear'}</b><ul>{unknownRole.slice(0,3).map((x,i)=><li key={i}>{x}</li>)}</ul></div>
          </div>
        </Panel>
      </div>
      <section className="glass messageToolkit">
        <div>
          <div className="eyebrow">MESSAGES</div>
          <h3>{ru ? 'Готовые сообщения второй стороне' : 'Ready messages to counterparty'}</h3>
          <p>{ru ? 'Пользователь может скопировать текст и отправить его в переговоры.' : 'The user can copy and send these during negotiation.'}</p>
        </div>
        <div className="messageGrid">
          {[[ru?'Мягко':'Soft', softMessage], [ru?'Нейтрально':'Neutral', neutralMessage], [ru?'Жёстко':'Firm', firmMessage]].map(([label,msg]) => <div className="messageBox" key={label}><b>{label}</b><p>{msg}</p><button className="copyMini" onClick={()=>copyText(msg)}>{ru?'Скопировать':'Copy'}</button></div>)}
        </div>
      </section>
    </section>

    <section className="grid two intelligenceGrid">
      <Panel title={ru ? 'Приоритеты AI' : 'AI Priorities'}>
        <ol>{(T(report.priorityPlan, lang) || T(report.actionPlan, lang) || []).slice(0, 4).map((x, i) => <li key={i}>{x}</li>)}</ol>
      </Panel>
      <Panel title={ru ? 'Если ситуация разная' : 'Decision paths'}>
        <ul>{(T(report.decisionTree, lang) || []).slice(0, 4).map((x, i) => <li key={i}>{x}</li>)}</ul>
        {report.clarifyingQuestions?.length ? <div className="clarifyBox"><b>{ru ? 'Что уточнить для точности' : 'Clarify for accuracy'}</b><ul>{report.clarifyingQuestions.slice(0,3).map((x,i)=><li key={i}>{T(x,lang)}</li>)}</ul></div> : null}
      </Panel>
    </section>

    <section className="reportRiskLayout">
      <aside className="glass reportRiskNav">
        <div className="riskNavHeader">
          <b>{ru ? 'Найденные пункты' : 'Detected clauses'}</b>
          <span>{risks.length} {ru ? 'пунктов' : 'items'}</span>
        </div>
        {risks.map((r,i)=><button key={r.id || i} onClick={()=>setActive(i)} className={i===active?'selected':''}>
          <span>{T(r.title,lang)}</span>
          <em className={r.level?.toLowerCase()}>{r.level}</em>
        </button>)}
      </aside>

      {risk && <article className="glass reportRiskDetail">
        <div className="riskDetailHeader">
          <div>
            <span className={`riskBadge ${risk.level?.toLowerCase()}`}>{risk.level} · {risk.score || '—'}/100</span>
            <h2>{T(risk.title,lang)}</h2>
          </div>
          <button className="secondary" onClick={() => ask(ru ? `Что делать с пунктом: ${T(risk.title, lang)}?` : `What should I do about: ${T(risk.title, lang)}?`)}>{ru ? 'Спросить AI' : 'Ask AI'}</button>
        </div>
        <div className="riskExcerpt"><b>{ru?'Фрагмент договора':'Contract excerpt'}</b><blockquote>{risk.source}</blockquote></div>
        {risk.confidence && <div className="confidenceLine"><b>{ru?'Уверенность AI':'AI confidence'}: {risk.confidence.level}</b><span>{T(risk.confidence.reason, lang)}</span></div>}
        <div className="riskExplainGrid">
          <Block title={ru?'Простыми словами':'Plain language'}>{T(risk.plainLanguage,lang)}</Block>
          <Block title={ru?'Почему это важно':'Why it matters'}>{T(risk.businessImpact,lang)}</Block>
          <Block title={ru?'Что сделать':'Recommended action'}>{T(risk.whatToDo,lang)}</Block>
          <Block title={ru?'Более безопасная формулировка':'Safer wording'}>{T(risk.suggestedDraft,lang)}</Block>
          <Block title={ru?'Пункт проверки':'Verification point'}>{T(risk.questionForMavenLex,lang)}</Block>
          <Block title={ru?'Худший сценарий':'Worst case'}>{T(risk.worstCaseScenario,lang)}</Block>
        </div>
      </article>}
    </section>

    <section className="grid three reportSupportGrid">
      <Panel title={ru ? 'Worst Case Scenario' : 'Worst Case Scenario'}>{report.worstCaseScenarios?.map((w,i)=><div className="miniPoint" key={i}><b>{T(w.title,lang)}</b><p>{T(w.scenario,lang)}</p><small>{ru?'Как снизить риск: ':'Prevention: '}{T(w.prevention,lang)}</small></div>)}</Panel>
      <Panel title={ru ? 'Сообщение второй стороне' : 'Negotiation Message'}><p>{T(report.negotiationMessage,lang)}</p></Panel>
      <Panel title={ru ? 'Что проверить' : 'Verification points'}><ul>{(report.MavenLexQuestions || []).map((x,i)=><li key={i}>{T(x,lang)}</li>)}</ul></Panel>
    </section>

    <section className="glass chat reportChat">
      <div className="chatHeader">
        <div><div className="chatLabel">{ru?'MAVENLEX LEGAL ASSISTANT':'MAVENLEX LEGAL ASSISTANT'}</div><h3>{ru?'AI-помощник по юридическим ситуациям':'AI legal situation assistant'}</h3><p>{ru ? 'Отвечает не только по договору: статьи РФ, последствия, план действий, переговоры, документы и что проверить.' : 'Not limited to the contract: statutes, consequences, action plan, negotiation, documents and verification points.'}</p></div>
        <button className="secondary" onClick={() => ask(ru ? 'Можно ли подписывать этот договор? Ответь прямо и объясни, что сделать дальше.' : 'Can I sign this contract? Be direct and explain what to do next.')}>{ru ? 'Можно подписывать?' : 'Can I sign?'}</button>
      </div>
      <div className="chatModes">
        {[['smart', ru?'Умный помощник':'Smart assistant'], ['quick', ru?'Коротко':'Quick'], ['deep', ru?'Глубокий разбор':'Deep review'], ['action', ru?'План действий':'Action plan']].map(([id,label]) => <button key={id} className={chatMode===id?'selected':''} onClick={()=>setChatMode(id)}>{label}</button>)}
      </div>
      <div className="promptChips">
        {[
          ru?'Какие 3 пункта самые опасные?':'Which 3 clauses are most dangerous?',
          ru?'Что попросить изменить перед подписью?':'What should I ask to change before signing?',
          ru?'Можно ли подписывать этот договор?':'Can I sign this contract?',
          ru?'Какие вопросы задать контрагенту?':'What questions should I ask the counterparty?',
          ru?'Напиши сообщение второй стороне':'Write a message to the other side',
          ru?'Если я уже подписал, что делать?':'If I already signed, what should I do?'
        ].map(x => <button key={x} onClick={()=>ask(x)} disabled={chatThinking}>{x}</button>)}
      </div>
      <div className="messages">{chat.length ? chat.map((m,i)=><p key={i} className={m.from}>{m.text}{m.mode && <small>{m.mode === 'live-yandexgpt' ? (ru ? ' · live AI' : ' · live AI') : (ru ? ' · local AI assistant' : ' · local AI assistant')}</small>}</p>) : <div className="emptyChat executiveEmpty"><b>{ru?'Спросите как у личного юридического помощника':'Ask like you would ask a personal legal assistant'}</b><span>{ru ? 'Можно спросить по договору, статье РФ, штрафам, спору, сообщению второй стороне или плану действий.' : 'You can ask about the contract, a statute, penalties, a dispute, a counterparty message, or an action plan.'}</span></div>}
        {chatThinking && <p className="ai thinking"><span className="thinkingDots">● ● ●</span>{thinkingLabels[thinkingStep]}</p>}</div>
      <div className="chatline"><input value={q} onChange={e=>setQ(e.target.value)} placeholder={ru?'Спроси про договор, статью, штраф, спор или что делать дальше':'Ask about the contract, statute, penalty, dispute, or next step'} /><button onClick={()=>ask()} disabled={chatThinking}>{chatThinking ? (ru?'Думаю...':'Thinking...') : (ru?'Отправить':'Send')}</button></div>
    </section>

    <p className="disclaimer reportDisclaimer">{ru?'MavenLex не является юридической консультацией и не заменяет проверки. Сервис помогает предварительно выявить риски и подготовить пункты для проверки.': 'MavenLex is not legal advice and does not replace checking facts, documents and current rules. The service helps pre-detect risks and prepare focused questions for a specialist.'}</p>
  </main>;
}
function Block({ title, children }) { return <div className="block"><b>{title}</b><p>{children}</p></div>; }
function Panel({ title, children }) { return <div className="glass panel"><h3>{title}</h3>{children}</div>; }


function Pricing({ ru, selectedPlan, choosePlan, go, serverSession, saveServerSession }) {
  const [billingPlans, setBillingPlans] = useState(null);
  const [checkoutBusy, setCheckoutBusy] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState('');
  useEffect(() => {
    apiJson('/api/billing/plans', undefined, undefined, 'GET').then(setBillingPlans).catch(() => {});
  }, []);
  const provider = billingPlans?.provider;
  const planDetails = billingPlans?.plans || {};
  const plans = [
    { id:'free', name:'Free', price:ru?'0 ₽':'$0', audience:ru?'Попробовать MavenLex':'Try MavenLex', cta:ru?'Начать бесплатно':'Start free', badge:ru?'Без оплаты':'No payment', features:ru?['3 анализа договоров в месяц','20 AI-вопросов в месяц','Базовый анализ рисков','Подходит для первого договора']:['3 contract reviews per month','20 AI questions per month','Basic risk analysis','Best for the first contract'] },
    { id:'pro', name:'Pro', price:ru?'990 ₽/мес':'$12/mo', audience:ru?'Для предпринимателей и малого бизнеса':'For founders and small business', cta:ru?'Перейти на Pro':'Upgrade to Pro', badge:ru?'Рекомендуем':'Recommended', features:ru?['30 анализов в месяц','300 AI-вопросов','PDF/HTML export','Расширенные рекомендации','Лучший вариант для регулярных договоров']:['30 reviews per month','300 AI questions','PDF/HTML export','Expanded recommendations','Best for regular contract work'] },
    { id:'business', name:'Business', price:ru?'4 990 ₽/мес':'$49/mo', audience:ru?'Для команд и постоянной договорной работы':'For teams and ongoing contract work', cta:ru?'Выбрать Business':'Choose Business', badge:ru?'Для команд':'For teams', features:ru?['200 анализов в месяц','2000 AI-вопросов','Бизнес-договоры и высокий usage','Командная модель подготовлена для следующих этапов','Подготовленная система оплаты']:['200 reviews per month','2000 AI questions','Business contract workflow and high usage','Team model prepared for next stages','Подготовленная система оплаты'] }
  ];
  async function startCheckout(planId) {
    trackPublicEvent('checkout_started', { planId });
    setCheckoutMessage('');
    if (planId === 'free') {
      choosePlan('free');
      setCheckoutMessage(ru ? 'Free выбран. Для платных тарифов войдите в кабинет и выберите подходящий план.' : 'Free selected. For paid plans, log in to Account and choose the plan you need.');
      return;
    }
    if (!serverSession?.user) {
      setCheckoutMessage(ru ? 'Сначала войдите или зарегистрируйтесь в Кабинете. После входа вернитесь сюда и выберите тариф.' : 'Log in or register in Account first. Then return here and choose a plan.');
      go('/account');
      return;
    }
    setCheckoutBusy(planId);
    try {
      const data = await apiJson('/api/billing/checkout', { planId }, undefined);
      if (data.safeCompletionRequired) {
        const completed = await apiJson('/api/billing/mock-complete', { paymentId: data.payment.id }, undefined);
        saveServerSession?.({ user: completed.user, session: serverSession.session, usage: completed.usage, usageLimits: completed.usageLimits });
        choosePlan(completed.plan || planId);
        setCheckoutMessage(ru ? `Тариф ${planId.toUpperCase()} активирован. Проверьте лимиты и статус в Кабинете.` : `Plan ${planId.toUpperCase()} is active. Check limits and status in Account.`);
      } else if (data.checkoutUrl) {
        setCheckoutMessage(ru ? 'Страница оплаты создана. Сейчас откроется безопасная страница оплаты.' : 'Checkout created. Redirecting to the secure payment page.');
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setCheckoutMessage(friendlyError(err, ru));
    } finally { setCheckoutBusy(''); }
  }
  return <main className="page pricingPage">
    <PageTitle label="MAVENLEX PLANS" title={ru?'Тарифы и лимиты':'Pricing and limits'} text={ru?'Выберите тариф под частоту работы с договорами. Лимиты и статус всегда видны в кабинете.':'Choose a plan based on your contract workload. Limits and status are always visible in Account.'}/>
    {provider && !provider.publicMode && <section className="glass billingModeBanner">
      <div><b>{ru?'Текущий платежный режим':'Current billing mode'}: {provider.provider}</b><span>{provider.note}</span></div>
      <em>{provider.mode} · {provider.currency} · {provider.liveReady ? (ru?'live ready':'live ready') : (ru?'live disabled':'live disabled')}</em>
    </section>}
    {provider?.publicNotice && <section className="glass billingModeBanner publicBillingNotice">
      <div><b>{ru?'Безопасное оформление тарифа':'Secure plan activation'}</b><span>{ru ? provider.publicNotice.ru : provider.publicNotice.en}</span></div>
      <em>{provider.currency}</em>
    </section>}
    {checkoutMessage && <section className="glass authMessage">{checkoutMessage}</section>}
    <section className="pricingGrid conversionPricingGrid">
      {plans.map(plan => {
        const backendPlan = planDetails[plan.id] || {};
        const limits = backendPlan.limits || PLAN_LIMITS[plan.id] || {};
        return <article className={`glass pricingCard conversionCard ${selectedPlan===plan.id?'selected':''}`} key={plan.id}>
          <div className="pricingCardTop"><span>{plan.badge}</span>{selectedPlan === plan.id && <small>{ru?'Текущий тариф':'Current plan'}</small>}</div>
          <h2>{plan.name}</h2>
          <p>{plan.audience}</p>
          <strong>{plan.price}</strong>
          <div className="planLimitChips"><i>{ru?'Анализы':'Reviews'}: {limits.reviews ?? '—'}</i><i>{ru?'AI-вопросы':'AI questions'}: {limits.questions ?? '—'}</i><i>Export: {limits.exports ?? '—'}</i></div>
          <ul>{plan.features.map(x=><li key={x}>{x}</li>)}</ul>
          <button className={selectedPlan===plan.id?'primary':'secondary'} disabled={checkoutBusy === plan.id} onClick={()=>startCheckout(plan.id)}>{checkoutBusy === plan.id ? (ru?'Оформляю...':'Starting...') : (selectedPlan===plan.id ? (ru?'Текущий тариф':'Current plan') : plan.cta)}</button>
        </article>;
      })}
    </section>
    <section className="glass billingFlowPanel">
      <div><div className="eyebrow">PLAN ACTIVATION</div><h2>{ru?'Как оформить тариф':'How plan activation works'}</h2><p>{ru?'Выберите тариф, войдите в кабинет и подтвердите оформление. После активации лимиты обновятся в кабинете.' : 'Choose a plan, log in to Account and confirm activation. After activation, limits update in Account.'}</p></div>
      <ol>
        <li>{ru?'Войти или зарегистрироваться в Кабинете.':'Log in or register in Account.'}</li>
        <li>{ru?'Выбрать Pro или Business на странице тарифов.':'Choose Pro or Business on Pricing.'}</li>
        <li>{ru?'После подтверждения тариф активируется, а лимиты обновляются в кабинете.':'After confirmation, the plan activates and Account limits update.'}</li>
        <li>{ru?'Кабинет показывает тариф, лимиты и историю действий.':'Account shows plan, limits and activity history.'}</li>
      </ol>
      <button className="secondary" onClick={()=>go('/account')}>{ru?'Проверить статус в Кабинете':'Check status in Account'}</button>
    </section>
    {['local_admin','admin','owner'].includes(serverSession?.user?.role) && <section className="glass livePaymentsChecklist adminOnlyBillingChecklist">
      <div className="eyebrow">YOOKASSA LIVE PAYMENTS</div>
      <h2>{ru?'Проверки перед продажами':'Checks before selling plans'}</h2>
      <div className="readinessGrid">
        <span>{ru?'Включить BILLING_PROVIDER=yookassa':'Set BILLING_PROVIDER=yookassa'}</span>
        <span>{ru?'Добавить YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY':'Add YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY'}</span>
        <span>{ru?'Добавить BILLING_WEBHOOK_SECRET':'Add BILLING_WEBHOOK_SECRET'}</span>
        <span>{ru?'Проверить webhook delivery':'Verify webhook delivery'}</span>
        <span>{ru?'Проверить безопасную оплату':'Verify safe payment flow'}</span>
        <span>{ru?'Проверить активацию/отмену тарифа':'Verify activation/cancellation'}</span>
      </div>
    </section>}
  </main>;
}


function BillingResult({ ru, serverSession, saveServerSession, choosePlan, go, kind }) {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const paymentId = billingQuery().get('payment') || billingQuery().get('paymentId') || '';
  const plan = billingQuery().get('plan') || '';
  async function confirm() {
    if (kind !== 'success') { setStatus('cancel'); return; }
    if (!serverSession?.user) { setStatus('login'); return; }
    if (!paymentId) { setStatus('manual'); return; }
    setStatus('loading');
    try {
      const data = await apiJson('/api/billing/confirm', { paymentId }, undefined);
      if (data.user) saveServerSession?.({ user: data.user, session: serverSession.session, usage: data.usage, usageLimits: data.usageLimits });
      if (data.billing?.plan || data.plan) choosePlan?.(data.billing?.plan || data.plan);
      setMessage(data.payment?.status === 'succeeded' ? (ru?'Оплата подтверждена, тариф активирован.':'Payment confirmed, plan is active.') : (ru?'Оплата проверяется. Если статус ещё не обновился, откройте Кабинет или нажмите «Проверить ещё раз».':'Payment is being verified. If the status has not updated yet, open Account or click Check again.'));
      setStatus(data.payment?.status === 'succeeded' ? 'success' : 'pending');
    } catch (err) { setMessage(friendlyError(err, ru)); setStatus('error'); }
  }
  useEffect(() => { confirm(); }, [kind, paymentId, serverSession?.user?.id]);
  const title = kind === 'success' ? (ru?'Оплата тарифа':'Plan payment') : (ru?'Оплата отменена':'Payment cancelled');
  const text = kind === 'success'
    ? (ru?'Проверяем статус оплаты и обновляем лимиты в кабинете.':'Checking payment status and updating Account limits.')
    : (ru?'Вы можете вернуться к тарифам и выбрать план позже.':'You can return to Pricing and choose a plan later.');
  return <main className="page billingResultPage">
    <PageTitle label="YOOKASSA BILLING" title={title} text={text}/>
    <section className="glass billingResultCard">
      <div className={`billingResultIcon ${status}`}>{kind === 'success' ? '✓' : '!'}</div>
      <h2>{status === 'loading' ? (ru?'Проверяем оплату...':'Checking payment...') : status === 'success' ? (ru?'Тариф активирован':'Plan activated') : status === 'pending' ? (ru?'Платёж обрабатывается':'Payment is processing') : status === 'login' ? (ru?'Войдите в кабинет':'Log in to Account') : kind === 'cancel' ? (ru?'Оплата не завершена':'Payment was not completed') : (ru?'Нужна проверка':'Action needed')}</h2>
      <p>{message || (kind === 'cancel' ? (ru?'Списание не выполнено. Тариф не изменён.':'No charge was completed. Your plan was not changed.') : (ru?'Если платёж прошёл, статус обновится после проверки платежа.':'If the payment has completed, status will update after payment verification.'))}</p>
      {plan && <p className="hint">{ru?'Выбранный тариф':'Selected plan'}: {plan}</p>}
      <div className="accountActions"><button className="primary" onClick={()=>go('/account')}>{ru?'Перейти в кабинет':'Go to Account'}</button><button className="secondary" onClick={()=>go('/pricing')}>{ru?'Вернуться к тарифам':'Back to Pricing'}</button>{kind === 'success' && <button className="secondary" onClick={confirm}>{ru?'Проверить ещё раз':'Check again'}</button>}</div>
    </section>
  </main>;
}



function DesignSystemPage({ ru, go }) {
  const tokens = [
    ['Ink', '#0f172a'], ['Muted', '#64748b'], ['Surface', '#ffffff'], ['Accent', '#2563eb'], ['Success', '#16a34a'], ['Warning', '#d97706'], ['Danger', '#dc2626']
  ];
  const components = [
    [ru?'Кнопки':'Buttons', ru?'Единая иерархия primary/secondary/danger для всего продукта.':'Single primary/secondary/danger hierarchy across the product.'],
    [ru?'Карточки':'Cards', ru?'Единые glass/panel-карточки для лендинга, отчётов и админки.':'Unified glass/panel cards for landing, reports and admin.'],
    [ru?'Статусы':'Statuses', ru?'Готовность, предупреждения, ошибки и успехи через одинаковые badges.':'Readiness, warnings, errors and success via consistent badges.'],
    [ru?'Пустые состояния':'Empty states', ru?'Пользователь всегда понимает следующий шаг.':'The user always understands the next step.'],
    [ru?'Таблицы':'Tables', ru?'Горизонтальный scroll на мобильном и читаемые строки в admin.':'Mobile horizontal scroll and readable admin rows.'],
    [ru?'Формы':'Forms', ru?'Единые поля, подсказки, ошибки и tap targets.':'Consistent fields, hints, errors and tap targets.']
  ];
  return <main className="page designSystemPage">
    <PageTitle label="BRAND UI SYSTEM v5.0.0" title={ru?'Дизайн-система MavenLex':'MavenLex Design System'} text={ru?'Единые UI-паттерны для публичного сайта, отчётов, кабинета и админки.':'Unified UI patterns for public pages, reports, personal cabinet and admin console.'}/>
    <section className="glass designHero">
      <div><h2>{ru?'Цель':'Goal'}</h2><p>{ru?'Сайт должен выглядеть как один цельный SaaS-продукт: одинаковые кнопки, карточки, статусы, ошибки, пустые состояния и админские панели.':'The site should feel like one coherent SaaS product: consistent buttons, cards, statuses, errors, empty states and admin panels.'}</p></div>
      <button className="primary" onClick={()=>go('/admin')}>{ru?'В админку':'Open Admin'}</button>
    </section>
    <section className="glass"><h2>{ru?'Цветовые токены':'Color tokens'}</h2><div className="tokenGrid">{tokens.map(([name,color]) => <article key={name}><span style={{background: color}}></span><b>{name}</b><small>{color}</small></article>)}</div></section>
    <section className="grid three">{components.map(([title,text]) => <article className="glass uiComponentCard" key={title}><h2>{title}</h2><p>{text}</p><div className="uiPreview"><button className="primary">Primary</button><button className="secondary">Secondary</button></div></article>)}</section>
    <section className="glass"><h2>{ru?'Состояния':'States'}</h2><div className="readinessGrid"><span className="ready">Ready</span><span className="warn">Warning</span><span className="dangerMini">Issue</span><span>Neutral</span></div></section>
  </main>;
}

function AdminMonitoring({ ru, serverSession, go, publicConfig, setPublicConfig, aiStatus }) {
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [consolePro, setConsolePro] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [userBusy, setUserBusy] = useState('');
  const [designSettings, setDesignSettings] = useState(publicConfig || null);
  const [designMessage, setDesignMessage] = useState('');
  const [emailRoleForm, setEmailRoleForm] = useState({ email: '', name: '', role: 'user', status: 'active', sendInvite: true, monthlyAiLimit: '', monthlyReviewLimit: '', allowedTools: '' });
  const [adminSection, setAdminSection] = useState('overview');
  const [rolePreview, setRolePreview] = useState('user');
  const [auditTrail, setAuditTrail] = useState({ events: [], adminAuditLogs: [] });
  const [aiPanel, setAiPanel] = useState(null);
  const isAdmin = ['local_admin','admin','owner'].includes(serverSession?.user?.role);
  const isOwner = serverSession?.user?.role === 'owner';

  async function loadOverview() {
    if (!serverSession?.user || !isAdmin) return;
    setLoading(true);
    setMessage('');
    try {
      const data = await apiJson('/api/admin/overview', undefined, undefined, 'GET');
      setOverview(data);
      try { setAnalytics(await apiJson('/api/admin/business-analytics', undefined, undefined, 'GET')); } catch (_) { setAnalytics(null); }
      try { setConsolePro(await apiJson('/api/admin/console-pro', undefined, undefined, 'GET')); } catch (_) { setConsolePro(null); }
      try { const userData = await apiJson('/api/admin/users', undefined, undefined, 'GET'); setUsers(userData.users || []); } catch (_) { setUsers([]); }
      try { const auditData = await apiJson('/api/admin/audit-events', undefined, undefined, 'GET'); setAuditTrail({ events: auditData.auditEvents || auditData.authEvents || [], adminAuditLogs: auditData.adminAuditLogs || [] }); } catch (_) { try { const auditData = await apiJson('/api/admin/auth-events', undefined, undefined, 'GET'); setAuditTrail({ events: auditData.events || [], adminAuditLogs: auditData.adminAuditLogs || [] }); } catch (_) { setAuditTrail({ events: [], adminAuditLogs: [] }); } }
      try { setAiPanel(await apiJson('/api/ai/status', undefined, undefined, 'GET')); } catch (_) { setAiPanel(null); }
      if (serverSession?.user?.role === 'owner') { try { const ds = await apiJson('/api/admin/design-settings', undefined, undefined, 'GET'); setDesignSettings(ds.designSettings); setPublicConfig?.(ds.designSettings); } catch (_) {} }
    } catch (err) {
      setMessage(friendlyError(err, ru));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOverview(); }, [serverSession?.user?.email, serverSession?.user?.role]);

  async function saveDesignSettings() {
    if (!isOwner) return;
    setDesignMessage('');
    try {
      const data = await apiJson('/api/admin/design-settings', designSettings, undefined, 'PATCH');
      setDesignSettings(data.designSettings);
      setPublicConfig?.(data.designSettings);
      setDesignMessage(ru ? 'Настройки сайта сохранены и сразу применены.' : 'Site settings saved and applied.');
    } catch (err) { setDesignMessage(friendlyError(err, ru)); }
  }
  function updateDesignDraft(updater) {
    setDesignSettings(prev => {
      const current = prev || publicConfig || {};
      const next = typeof updater === 'function' ? updater(current) : updater;
      setPublicConfig?.(next);
      return next;
    });
  }
  function patchCms(key, value) { updateDesignDraft(prev => ({ ...(prev || {}), cms: { ...((prev || {}).cms || {}), [key]: value } })); }
  function patchUi(key, value) { updateDesignDraft(prev => ({ ...(prev || {}), ui: { ...((prev || {}).ui || {}), [key]: value } })); }

  function patchColor(key, value) { updateDesignDraft(prev => ({ ...(prev || {}), ui: { ...((prev || {}).ui || {}), colors: { ...(((prev || {}).ui || {}).colors || {}), [key]: value } } })); }
  function patchEmphasis(key, value) { updateDesignDraft(prev => ({ ...(prev || {}), ui: { ...((prev || {}).ui || {}), textEmphasis: { ...(((prev || {}).ui || {}).textEmphasis || {}), [key]: value } } })); }
  function patchRolePanel(role, value) { updateDesignDraft(prev => ({ ...(prev || {}), rolePanels: { ...((prev || {}).rolePanels || {}), [role]: String(value || '').split(',').map(x=>x.trim()).filter(Boolean) } })); }
  const roleVisiblePages = role => Array.from(ROLE_ROUTE_ACCESS[role] || ROLE_ROUTE_ACCESS.user).filter(path => !['/privacy','/terms','/security','/reset-password','/verify-email','/billing/success','/billing/cancel'].includes(path)).slice(0, 18);
  const safeAdminAction = (label, role) => role === 'owner' ? confirm(ru ? `Подтвердите действие владельца: ${label}` : `Confirm owner action: ${label}`) : true;
  function applyDesignPreset(preset) {
    const presets = {
      executiveNavy: { buttonStyle:'premium-pill', frameStyle:'deep-border', textStyle:'high-contrast', underlineImportant:false, colors:{ primary:'#07172f', accent:'#7cc7ff', cta:'#d9b25f', ctaText:'#08111f', frame:'rgba(124,199,255,.28)', surface:'#ffffff', muted:'#6b7a90', navyBg:'#051527', navyCard:'rgba(7,30,58,.92)', navyText:'#edf8ff' } },
      calmIvory: { buttonStyle:'premium-pill', frameStyle:'soft-glass', textStyle:'calm', underlineImportant:false, colors:{ primary:'#15110c', accent:'#b8862f', cta:'#241609', ctaText:'#fff8ea', frame:'rgba(80,65,42,.16)', surface:'#fffdf8', muted:'#6b6458', navyBg:'#0a1a2e', navyCard:'rgba(12,35,64,.88)', navyText:'#edf8ff' } },
      strictLegal: { buttonStyle:'strong', frameStyle:'flat-clean', textStyle:'large-readable', underlineImportant:true, colors:{ primary:'#0b1220', accent:'#2563eb', cta:'#0b1220', ctaText:'#ffffff', frame:'rgba(15,23,42,.18)', surface:'#ffffff', muted:'#475569', navyBg:'#081426', navyCard:'rgba(8,20,38,.94)', navyText:'#f8fbff' } }
    };
    const next = presets[preset];
    if (!next) return;
    updateDesignDraft(prev => ({ ...(prev || {}), ui: { ...((prev || {}).ui || {}), ...next, colors: { ...(((prev || {}).ui || {}).colors || {}), ...(next.colors || {}) } } }));
    setDesignMessage(ru ? 'Пресет применён. Нажмите «Сохранить всё», чтобы закрепить.' : 'Preset applied. Click Save all to keep it.');
  }


  async function assignRoleByEmail(e) {
    e?.preventDefault?.();
    if (!isOwner) return;
    const email = String(emailRoleForm.email || '').trim();
    if (!email || !email.includes('@')) { setUserMessage(ru ? 'Введите email пользователя.' : 'Enter a user email.'); return; }
    if (['admin','owner'].includes(emailRoleForm.role) && !safeAdminAction(ru ? `Выдать роль ${emailRoleForm.role} для ${email}` : `Grant ${emailRoleForm.role} to ${email}`, emailRoleForm.role)) return;
    setUserBusy('email-role');
    setUserMessage('');
    try {
      const data = await apiJson('/api/admin/users/assign-role', { ...emailRoleForm, customLimits: { monthlyAiLimit: emailRoleForm.monthlyAiLimit, monthlyReviewLimit: emailRoleForm.monthlyReviewLimit, allowedTools: emailRoleForm.allowedTools } }, undefined, 'POST');
      setUsers(prev => {
        const exists = prev.some(u => u.id === data.user.id);
        return exists ? prev.map(u => u.id === data.user.id ? data.user : u) : [data.user, ...prev];
      });
      setEmailRoleForm(prev => ({ ...prev, email: '', name: '', monthlyAiLimit: '', monthlyReviewLimit: '', allowedTools: '' }));
      const sent = data.emailDelivery?.ok ? (ru ? ' Приглашение/сброс пароля отправлены на email.' : ' Invite/reset email sent.') : '';
      const dev = data.devResetLink ? ` ${ru ? 'Локальная ссылка:' : 'Local link:'} ${data.devResetLink}` : '';
      setUserMessage((data.created ? (ru ? 'Пользователь создан и роль назначена.' : 'User created and role assigned.') : (ru ? 'Роль пользователя обновлена.' : 'User role updated.')) + sent + dev);
    } catch (err) {
      setUserMessage(friendlyError(err, ru));
    } finally { setUserBusy(''); }
  }


  async function testLiveAi() {
    if (!isOwner) return;
    setDesignMessage('');
    setUserBusy('ai-test');
    try {
      const data = await apiJson('/api/admin/ai-test', {}, undefined, 'POST');
      setAiPanel(prev => ({ ...(prev || {}), liveAiConfigured: true, mode: data.mode, lastTest: data }));
      setDesignMessage(ru ? 'Live AI проверен: ответ получен.' : 'Live AI checked: response received.');
    } catch (err) {
      setAiPanel(prev => ({ ...(prev || {}), liveAiConfigured: false, lastError: friendlyError(err, ru) }));
      setDesignMessage(friendlyError(err, ru));
    } finally { setUserBusy(''); }
  }

  async function updateUserAccess(userId, patch) {
    setUserBusy(userId);
    setUserMessage('');
    try {
      const data = await apiJson(`/api/admin/users/${encodeURIComponent(userId)}`, patch, undefined, 'PATCH');
      setUsers(prev => prev.map(u => u.id === userId ? data.user : u));
      setUserMessage(ru ? 'Доступ пользователя обновлён.' : 'User access updated.');
    } catch (err) {
      setUserMessage(friendlyError(err, ru));
    } finally { setUserBusy(''); }
  }

  if (!serverSession?.user) {
    return <main className="page adminExecutivePage">
      <section className="glass adminAccessCard">
        <div className="eyebrow">ADMIN CONSOLE</div>
        <h1>{ru?'Войдите в аккаунт администратора':'Sign in as an administrator'}</h1>
        <p>{ru?'Админ-панель защищена. Сначала войдите в Кабинет под email, который указан в ADMIN_EMAILS внутри .env.':'The admin console is protected. Sign in from Account using the email listed in ADMIN_EMAILS in .env.'}</p>
        <button className="primary large" onClick={()=>go('/account')}>{ru?'Открыть кабинет':'Open account'}</button>
      </section>
    </main>;
  }

  if (!isAdmin) {
    return <main className="page adminExecutivePage">
      <section className="glass adminAccessCard dangerState">
        <div className="eyebrow">ADMIN ACCESS</div>
        <h1>{ru?'Нет прав администратора':'No administrator access'}</h1>
        <p>{ru?'Вы вошли в аккаунт, но эта почта не получила роль admin. Обратитесь к владельцу, чтобы он назначил вам роль admin или owner.':'You are signed in, but this email does not have the admin role. Ask the owner to assign you the admin or owner role.'}</p>
        <div className="adminAccessSteps">
          <span>ADMIN_EMAILS={serverSession.user.email}</span>
          <span>{ru?'Перезапустить сервер':'Restart server'}</span>
          <span>{ru?'Войти заново':'Sign in again'}</span>
        </div>
        <button className="secondary large" onClick={()=>go('/account')}>{ru?'Вернуться в кабинет':'Back to account'}</button>
      </section>
    </main>;
  }

  const stats = overview?.stats || {};
  const health = overview?.health || {};
  const usageByPlan = overview?.usageByPlan || {};
  const launch = overview?.launch || {};
  const blockers = launch.blockers || [];
  const warnings = launch.warnings || [];
  const consoleModules = consolePro?.modules || {};
  const ok = value => value ? (ru?'Готово':'Ready') : (ru?'Проверить':'Check');
  const healthLabel = item => item?.ok ? (ru?'Работает':'Online') : (ru?'Требует внимания':'Needs attention');

  return <main className="page adminExecutivePage">
    <section className="glass adminHeroPanel">
      <div>
        <div className="eyebrow">MAVENLEX ADMIN CONSOLE</div>
        <h1>{ru?'Панель управления MavenLex':'MavenLex control center'}</h1>
        <p>{ru?'Здесь собраны основные показатели MavenLex: пользователи, договоры, AI-запросы, тарифы и состояние сервиса. Без технического шума — только то, что нужно владельцу продукта.':'Key MavenLex metrics in one place: users, contracts, AI requests, plans and service health. No technical noise — only what the product owner needs.'}</p>
      </div>
      <div className="adminSessionCard">
        <span>{ru?'Администратор':'Administrator'}</span>
        <b>{serverSession?.user?.email}</b>
        <small>{ru?'Роль':'Role'}: {serverSession?.user?.role || 'admin'}</small>
        <button className="primary" onClick={loadOverview} disabled={loading}>{loading ? (ru?'Обновляю...':'Refreshing...') : (ru?'Обновить данные':'Refresh data')}</button>
      </div>
    </section>

    {message && <section className="glass adminNotice dangerMini"><b>{ru?'Нужно обновить вход':'Sign-in refresh needed'}</b><p>{message.includes('Войдите') || message.includes('Log in') || message.includes('Authentication') ? (ru?'Сессия могла устареть. Выйдите из кабинета, войдите снова под админской почтой и обновите админку.':'The session may be expired. Log out, sign in again with the admin email, and refresh the admin page.') : message}</p><button className="secondary" onClick={()=>go('/account')}>{ru?'Перейти в кабинет':'Open account'}</button></section>}


    
    {isOwner && <section className="glass professionalAdminSuite">
      <div className="adminSuiteHeader">
        <div><div className="eyebrow">PROFESSIONAL ADMIN</div><h2>{ru?'Профессиональный центр управления':'Professional control center'}</h2><p>{ru?'Админка разделена на понятные зоны: сайт, пользователи, безопасность, AI и история изменений. Так меньше риска случайно сломать продукт.':'Admin is split into clear areas: site, users, security, AI and change history. This reduces the risk of accidental changes.'}</p></div>
        <div className="adminTabBar">{[['overview',ru?'Обзор':'Overview'],['site',ru?'Сайт':'Site'],['users',ru?'Роли':'Roles'],['security',ru?'Безопасность':'Security'],['ai','AI'],['audit',ru?'История':'Audit']].map(([id,label]) => <button key={id} className={adminSection===id?'selected':''} onClick={()=>setAdminSection(id)}>{label}</button>)}</div>
      </div>
      {adminSection === 'overview' && <div className="adminSuiteGrid">
        <article><b>{ru?'Управление сайтом':'Site control'}</b><span>{ru?'Тексты, кнопки, цвета, рамки, карточки и выделения слов.':'Texts, buttons, colors, frames, cards and word emphasis.'}</span></article>
        <article><b>{ru?'Пользователи и роли':'Users and roles'}</b><span>{ru?'Назначение роли по email, приглашения, лимиты и предпросмотр доступа.':'Assign by email, invitations, limits and access preview.'}</span></article>
        <article><b>{ru?'Система и AI':'System and AI'}</b><span>{ru?'Проверка AI, email, аккаунтов, ошибок и последних событий.':'Check AI, email, accounts, errors and recent events.'}</span></article>
      </div>}
      {adminSection === 'site' && <div className="adminSuiteGrid wide">
        <article><b>{ru?'Черновик перед публикацией':'Draft before publishing'}</b><span>{ru?'Меняйте текст и дизайн в Owner Design Studio, смотрите превью и только потом нажимайте «Сохранить всё».':'Edit copy and design in Owner Design Studio, review preview, then click Save all.'}</span></article>
        <article><b>{ru?'Быстрый откат':'Safe reset'}</b><span>{ru?'Используйте пресеты бренда, если цвета или рамки стали выглядеть плохо.':'Use brand presets if colors or frames start looking wrong.'}</span></article>
      </div>}
      {adminSection === 'users' && <div className="rolePreviewBoard">
        <div className="rolePreviewControls"><b>{ru?'Предпросмотр роли':'Role preview'}</b><select value={rolePreview} onChange={e=>setRolePreview(e.target.value)}>{ROLE_OPTIONS.map(role => <option key={role.value} value={role.value}>{roleLabel(role.value, ru?'ru':'en')}</option>)}</select></div>
        <div className="rolePreviewPages">{roleVisiblePages(rolePreview).map(path => <span key={path}>{path.replace('/','') || 'home'}</span>)}</div>
        <p>{ru?'Так вы заранее видите, какие страницы будут доступны человеку с выбранной ролью.':'This shows which pages a person with the selected role will be able to open.'}</p>
      </div>}
      {adminSection === 'security' && <div className="adminSuiteGrid">
        <article><b>{ru?'Owner-only действия':'Owner-only actions'}</b><span>{ru?'Роли admin/owner, дизайн сайта и доступы изменяются только владельцем.':'Admin/owner roles, site design and access rules are changed only by the owner.'}</span></article>
        <article><b>{ru?'Защита от ошибок':'Mistake protection'}</b><span>{ru?'Перед выдачей admin/owner появляется подтверждение. Последнего владельца нельзя убирать вручную.':'Granting admin/owner requires confirmation. The last owner cannot be removed manually.'}</span></article>
        <article><b>{ru?'Восстановление доступа':'Account recovery'}</b><span>{ru?'Ссылки восстановления одноразовые, ограничены по времени и сбрасывают старые сессии после смены пароля.':'Recovery links are one-time, time-limited and revoke old sessions after password change.'}</span></article>
      </div>}
      {adminSection === 'ai' && <div className="aiHealthBoard">
        <div className={aiPanel?.liveAiConfigured ? 'aiOnline' : 'aiOffline'}><b>{aiPanel?.liveAiConfigured ? (ru?'AI работает':'AI online') : (ru?'AI не работает':'AI offline')}</b><span>{aiPanel?.lastError || aiPanel?.message || (ru?'Статус AI обновится после проверки.':'AI status will update after check.')}</span></div>
        <button className="primary" onClick={testLiveAi} disabled={userBusy==='ai-test'}>{userBusy==='ai-test' ? (ru?'Проверяю...':'Testing...') : (ru?'Проверить Live AI':'Test Live AI')}</button>
        <button className="secondary" onClick={loadOverview}>{ru?'Обновить сводку':'Refresh overview'}</button>
        <p>{ru?'MavenLex не подменяет Live AI шаблонами. Если провайдер не подключён, пользователь увидит честную ошибку.':'MavenLex does not replace Live AI with templates. If the provider is not configured, the user sees an honest error.'}</p>
      </div>}
      {adminSection === 'audit' && <div className="auditTimeline">
        {(auditTrail.adminAuditLogs || []).slice(0,8).map(event => <article key={event.id || event.createdAt}><b>{event.type || 'admin_event'}</b><span>{formatDateTime(event.createdAt, ru)} · {event.actorId || ''}</span><small>{JSON.stringify(event.details || {}).slice(0,180)}</small></article>)}
        {!(auditTrail.adminAuditLogs || []).length && <article><b>{ru?'История изменений пока пустая':'No admin changes yet'}</b><span>{ru?'Когда владелец изменит роль, дизайн или настройки, события появятся здесь.':'Owner changes to roles, design or settings will appear here.'}</span></article>}
      </div>}
    </section>}

{isOwner && <section className="glass ownerSystemStatus v611">
      <div><div className="eyebrow">OWNER SYSTEM STATUS</div><h3>{ru?'Состояние продукта':'Product status'}</h3><p>{ru?'Только владелец видит системные статусы. Обычным пользователям технические детали не показываются.':'Only the owner sees system statuses. Technical details are hidden from regular users.'}</p></div>
      <div className="systemStatusGrid">
        <span><b>AI</b>{aiStatus?.liveAiConfigured || aiPanel?.liveAiConfigured ? (ru?'подключён':'connected') : (ru?'не подключён':'not connected')}</span>
        <span><b>Email</b>{ru?'проверь provider':'check provider'}</span>
        <span><b>DB</b>{overview?.databaseProvider || 'json'}</span>
        <span><b>Deploy</b>{ru?'активен':'active'}</span>
      </div>
    </section>}

{isOwner && <section className="glass ownerControlCenter advancedOwnerStudio">
      <div className="serverAuthTop ownerStudioHeader"><div><div className="eyebrow">OWNER DESIGN STUDIO</div><h2>{ru?'Бренд-студия сайта':'Site brand studio'}</h2><p>{ru?'Важно: личную светлую или тёмно-синюю тему выбирает сам пользователь. Здесь владелец настраивает только бренд сайта: тексты, цвета кнопок, рамок, карточек, акценты, выделения и панели ролей.':'Important: each user chooses their own light or navy theme. Here the owner controls only the site brand: texts, button colors, frames, cards, accents, emphasis and role panels.'}</p></div><div className="ownerStudioActions"><button className="secondary" onClick={()=>applyDesignPreset('executiveNavy')}>{ru?'Премиальный бренд':'Premium brand'}</button><button className="secondary" onClick={()=>applyDesignPreset('calmIvory')}>{ru?'Спокойный бренд':'Calm brand'}</button><button className="secondary" onClick={()=>applyDesignPreset('strictLegal')}>{ru?'Строгий legal-бренд':'Strict legal brand'}</button><button className="primary" onClick={saveDesignSettings}>{ru?'Сохранить всё':'Save all'}</button></div></div>
      {designMessage && <p className="authMessage">{designMessage}</p>}
      <div className="ownerStudioGrid">
        <article className="adminPanel softPanel designStudioPanel"><div className="eyebrow">CONTENT</div><h3>{ru?'Главная страница — короткая суть':'Home page — short essence'}</h3>
          <label>{ru?'Заголовок RU':'Title RU'}<input maxLength="90" value={designSettings?.cms?.homeTitleRu || ''} onChange={e=>patchCms('homeTitleRu', e.target.value)} /></label>
          <label>{ru?'Описание RU':'Lead RU'}<textarea rows="3" maxLength="120" value={designSettings?.cms?.homeLeadRu || ''} onChange={e=>patchCms('homeLeadRu', e.target.value)} /></label>
          <label>{ru?'Заголовок EN':'Title EN'}<input maxLength="90" value={designSettings?.cms?.homeTitleEn || ''} onChange={e=>patchCms('homeTitleEn', e.target.value)} /></label>
          <label>{ru?'Описание EN':'Lead EN'}<textarea rows="3" maxLength="120" value={designSettings?.cms?.homeLeadEn || ''} onChange={e=>patchCms('homeLeadEn', e.target.value)} /></label>
          <div className="twoInlineControls"><label>{ru?'Главная кнопка RU':'Primary CTA RU'}<input value={designSettings?.cms?.primaryCtaRu || ''} onChange={e=>patchCms('primaryCtaRu', e.target.value)} /></label><label>{ru?'Вторая кнопка RU':'Secondary CTA RU'}<input value={designSettings?.cms?.secondaryCtaRu || ''} onChange={e=>patchCms('secondaryCtaRu', e.target.value)} /></label></div>
        </article>

        <article className="adminPanel softPanel designStudioPanel"><div className="eyebrow">BRAND COLORS</div><h3>{ru?'Цвета бренда, не личная тема':'Brand colors, not personal theme'}</h3><p className="hint">{ru?'Пользователь сам переключает Светлая / Тёмно-синяя. Здесь владелец задаёт общие цвета интерфейса: кнопки, рамки, карточки, акценты и читаемость текста.':'Users choose Light / Navy themselves. The owner controls global interface colors: buttons, frames, cards, accents and text readability.'}</p>
          <div className="colorControlGrid">
            {[['primary',ru?'Основной текст':'Primary text'],['accent',ru?'Акцент':'Accent'],['cta',ru?'Кнопка':'Button'],['ctaText',ru?'Текст кнопки':'Button text'],['frame',ru?'Рамки':'Frames'],['surface',ru?'Светлая карточка':'Light card'],['muted',ru?'Второстепенный текст':'Secondary text'],['navyBg',ru?'Фон тёмной темы':'Navy theme background'],['navyCard',ru?'Карточки тёмной темы':'Navy theme cards'],['navyText',ru?'Текст тёмной темы':'Navy theme text']].map(([key,label]) => <label key={key}>{label}<input type="color" value={(designSettings?.ui?.colors || {})[key] || (key==='ctaText'?'#ffffff':key==='surface'?'#ffffff':key==='navyBg'?'#06182f':key==='navyCard'?'#0d2a4a':key==='navyText'?'#eaf6ff':key==='accent'?'#2563eb':key==='cta'?'#1f1408':key==='frame'?'#64748b':key==='muted'?'#64748b':'#0f172a')} onChange={e=>patchColor(key, e.target.value)} /></label>)}
          </div>
        </article>

        <article className="adminPanel softPanel designStudioPanel"><div className="eyebrow">UI SYSTEM</div><h3>{ru?'Кнопки, рамки и текст':'Buttons, frames and text'}</h3>
          <label>{ru?'Вид кнопок':'Button style'}<select value={designSettings?.ui?.buttonStyle || 'premium-pill'} onChange={e=>patchUi('buttonStyle', e.target.value)}><option value="premium-pill">Premium pill</option><option value="minimal">Minimal clean</option><option value="strong">Strong contrast</option></select></label>
          <label>{ru?'Вид рамок':'Frame style'}<select value={designSettings?.ui?.frameStyle || 'soft-glass'} onChange={e=>patchUi('frameStyle', e.target.value)}><option value="soft-glass">Soft glass</option><option value="deep-border">Deep border</option><option value="flat-clean">Flat clean</option></select></label>
          <label>{ru?'Стиль текста':'Text style'}<select value={designSettings?.ui?.textStyle || 'high-contrast'} onChange={e=>patchUi('textStyle', e.target.value)}><option value="high-contrast">High contrast</option><option value="calm">Calm premium</option><option value="large-readable">Large readable</option></select></label>
          <label className="checkLine"><input type="checkbox" checked={designSettings?.ui?.underlineImportant === true} onChange={e=>patchUi('underlineImportant', e.target.checked)} /> {ru?'Подчёркивать важные слова':'Underline important words'}</label>
          <label className="checkLine"><input type="checkbox" checked={designSettings?.ui?.compactHero !== false} onChange={e=>patchUi('compactHero', e.target.checked)} /> {ru?'Компактный главный экран':'Compact hero screen'}</label>
          <div className="designPreviewCard"><span>{ru?'Превью':'Preview'}</span><b>{ru?'Кнопка, рамка, текст':'Button, frame, text'}</b><span className="primary buttonPreview">{ru?'Пример кнопки':'Button sample'}</span></div>
        </article>

        <article className="adminPanel softPanel designStudioPanel"><div className="eyebrow">TEXT EMPHASIS</div><h3>{ru?'Выделение слов по страницам':'Word emphasis by page'}</h3>
          <label>{ru?'Главная: слова через запятую':'Home: comma-separated words'}<input value={designSettings?.ui?.textEmphasis?.home || ''} onChange={e=>patchEmphasis('home', e.target.value)} placeholder="риски, действия, договор" /></label>
          <label>{ru?'Договор: слова через запятую':'Contract: comma-separated words'}<input value={designSettings?.ui?.textEmphasis?.contract || ''} onChange={e=>patchEmphasis('contract', e.target.value)} placeholder="штраф, срок, ответственность" /></label>
          <label>{ru?'Статьи: слова через запятую':'Articles: comma-separated words'}<input value={designSettings?.ui?.textEmphasis?.law || ''} onChange={e=>patchEmphasis('law', e.target.value)} placeholder="состав, последствия, доказательства" /></label>
          <div className="aiOwnerStatus"><b>AI</b><span>{aiStatus?.liveAiConfigured ? (ru?'Live AI подключён: ответы идут через провайдера':'Live AI connected: provider answers') : (ru?'AI не работает: подключите YandexGPT. Шаблоны не включаются.':'AI is not working: connect YandexGPT. Templates are disabled.')}</span></div>
        </article>
      </div>

      <div className="rolePanelPreview advancedRolePanels"><h3>{ru?'Панели по ролям':'Role panels'}</h3><p>{ru?'Остались только три уровня: пользователь, локальный админ и владелец. Owner-панель защищена от удаления и понижения.':'Only three levels remain: user, local admin and owner. Owner panel is protected from deletion and downgrade.'}</p>{Object.entries(designSettings?.rolePanels || {}).map(([role, panels]) => <article key={role}><b>{roleLabel(role, ru?'ru':'en')}</b><input value={Array.isArray(panels) ? panels.join(', ') : String(panels)} onChange={e=>patchRolePanel(role, e.target.value)} /></article>)}</div>
    </section>}

    <section className="adminMetricDeck">
      <article className="glass adminMetricCard"><span>{ru?'Пользователи':'Users'}</span><b>{stats.users ?? '—'}</b><small>{ru?'Всего аккаунтов в системе':'Total accounts'}</small></article>
      <article className="glass adminMetricCard"><span>{ru?'Анализы':'Analyses'}</span><b>{stats.analyses ?? '—'}</b><small>{ru?'Проверки договоров и истории':'Contract reviews and history'}</small></article>
      <article className="glass adminMetricCard"><span>{ru?'AI-вопросы':'AI questions'}</span><b>{stats.aiQuestions ?? '—'}</b><small>{ru?'Запросы к ассистенту':'Assistant requests'}</small></article>
      <article className="glass adminMetricCard"><span>{ru?'Ошибки':'Errors'}</span><b>{stats.serverErrors ?? '—'}</b><small>{ru?'Серверные события':'Server events'}</small></article>
    </section>

    <section className="glass adminRoleManager">
      <div className="serverAuthTop"><div><div className="eyebrow">ROLE ACCESS</div><h2>{ru?'Пользователи и роли':'Users and roles'}</h2><p>{ru?'Назначайте только локального админа или обычного пользователя. Owner защищён и выдаётся только через OWNER_EMAILS.':'Assign only local admin or regular user. Owner is protected and controlled through OWNER_EMAILS.'}</p></div><button className="secondary" onClick={loadOverview} disabled={loading}>{ru?'Обновить':'Refresh'}</button></div>
      {userMessage && <p className="authMessage adminLongMessage">{userMessage}</p>}
      {isOwner && <form className="adminAssignByEmail" onSubmit={assignRoleByEmail}>
        <div><b>{ru?'Назначить роль по email':'Assign role by email'}</b><span>{ru?'Введите почту человека. Если аккаунта ещё нет, MavenLex создаст запись и отправит ссылку для установки пароля.':'Enter a person’s email. If the account does not exist, MavenLex creates it and sends a set-password link.'}</span></div>
        <input value={emailRoleForm.email} onChange={e=>setEmailRoleForm({...emailRoleForm,email:e.target.value})} placeholder="user@example.com" />
        <input value={emailRoleForm.name} onChange={e=>setEmailRoleForm({...emailRoleForm,name:e.target.value})} placeholder={ru?'Имя, если нужно':'Name, optional'} />
        <select value={emailRoleForm.role} onChange={e=>setEmailRoleForm({...emailRoleForm,role:e.target.value})}>{ROLE_OPTIONS.map(role => <option key={role.value} value={role.value}>{roleLabel(role.value, ru?'ru':'en')}</option>)}</select>
        <select value={emailRoleForm.status} onChange={e=>setEmailRoleForm({...emailRoleForm,status:e.target.value})}><option value="active">{ru?'Активен':'Active'}</option><option value="suspended">{ru?'Заблокирован':'Suspended'}</option></select>
        <input value={emailRoleForm.monthlyAiLimit} onChange={e=>setEmailRoleForm({...emailRoleForm,monthlyAiLimit:e.target.value})} placeholder={ru?'AI-лимит в месяц, необязательно':'Monthly AI limit, optional'} />
        <input value={emailRoleForm.monthlyReviewLimit} onChange={e=>setEmailRoleForm({...emailRoleForm,monthlyReviewLimit:e.target.value})} placeholder={ru?'Лимит договоров в месяц, необязательно':'Monthly contract limit, optional'} />
        <input value={emailRoleForm.allowedTools} onChange={e=>setEmailRoleForm({...emailRoleForm,allowedTools:e.target.value})} placeholder={ru?'Доступные инструменты через запятую':'Allowed tools, comma-separated'} />
        <label className="checkLine"><input type="checkbox" checked={emailRoleForm.sendInvite} onChange={e=>setEmailRoleForm({...emailRoleForm,sendInvite:e.target.checked})} /> {ru?'Отправить ссылку для установки/восстановления пароля':'Send set/reset password link'}</label>
        <button className="primary" disabled={userBusy==='email-role'}>{userBusy==='email-role' ? (ru?'Сохраняю...':'Saving...') : (ru?'Назначить роль':'Assign role')}</button>
      </form>}
      <div className="roleLegend simplifiedRoles">{ROLE_OPTIONS.map(role => <article key={role.value}><b>{roleLabel(role.value, ru?'ru':'en')}</b><span>{ru ? role.noteRu : role.noteEn}</span></article>)}</div><p className="hint ownerProtectionHint">{ru?'Важно: владельца нельзя заблокировать, удалить или понизить из панели. Чтобы изменить владельца, сначала поменяйте OWNER_EMAILS в Environment.':'Important: owner cannot be blocked, deleted or downgraded from the panel. To change owner, update OWNER_EMAILS in Environment first.'}</p>
      <div className="adminUserTable">
        {(users.length ? users : overview?.recentUsers || []).slice(0, 30).map(u => <article key={u.id} className="adminUserRow">
          <div><b>{u.email}</b><span>{u.name || (ru?'Без имени':'No name')} · {u.plan || 'free'} · {u.status || 'active'}</span></div>
          <select value={u.role || 'user'} disabled={!isOwner || userBusy===u.id || u.id===serverSession?.user?.id} onChange={e=>updateUserAccess(u.id, { role: e.target.value })}>
            {ROLE_OPTIONS.map(role => <option key={role.value} value={role.value}>{roleLabel(role.value, ru?'ru':'en')}</option>)}
          </select>
          <select value={u.status || 'active'} disabled={!isOwner || userBusy===u.id || u.id===serverSession?.user?.id} onChange={e=>updateUserAccess(u.id, { status: e.target.value, forceLogout: e.target.value==='suspended' })}>
            <option value="active">{ru?'Активен':'Active'}</option>
            <option value="suspended">{ru?'Заблокирован':'Suspended'}</option>
          </select>
        </article>)}
      </div>
    </section>


    <section className="grid two adminExecutiveGrid">
      <article className="glass adminPanel executiveAdminPanel">
        <div className="eyebrow">SYSTEM HEALTH</div>
        <h2>{ru?'Состояние сервиса':'Service health'}</h2>
        <div className="adminStatusRows">
          <div><span>{ru?'Сервис':'Service'}</span><b>{healthLabel(health.backend)}</b><small>{health.backend?.uptimeSeconds ? (ru?'работает':'online') : (ru?'данные обновятся после входа':'data updates after sign-in')}</small></div>
          <div><span>{ru?'Хранилище':'Storage'}</span><b>{health.database?.productionReady ? (ru?'Готово':'Ready') : (ru?'Локально':'Local')}</b><small>{ru?'Данные аккаунтов и истории':'Accounts and history data'}</small></div>
          <div><span>AI</span><b>{healthLabel(health.yandexgpt)}</b><small>{health.yandexgpt?.configured ? (ru?'готов к ответам':'ready') : (ru?'работает в безопасном режиме':'safe mode')}</small></div>
          <div><span>{ru?'Оплата':'Payments'}</span><b>{health.billing?.paymentsEnabled ? (ru?'Включена':'Enabled') : (ru?'Выключена':'Disabled')}</b><small>{ru?'Статусы тарифов и подписок':'Plans and subscriptions'}</small></div>
        </div>
      </article>

      <article className="glass adminPanel executiveAdminPanel">
        <div className="eyebrow">LAUNCH READINESS</div>
        <h2>{ru?'Готовность к запуску':'Launch readiness'}</h2>
        <div className={blockers.length ? 'launchVerdict warn' : 'launchVerdict ready'}>
          <b>{blockers.length ? (ru?'Есть блокеры':'Blockers found') : (ru?'Критичных блокеров нет':'No critical blockers')}</b>
          <span>{blockers.length ? (ru?'Сначала закройте пункты ниже.':'Resolve the items below first.') : (ru?'Можно продолжать тестирование и готовить деплой.':'Continue testing and prepare deployment.')}</span>
        </div>
        <div className="adminChipList">
          <span className={health.backend?.ok?'ready':'warn'}>{ru?'Сервис':'Service'}: {ok(health.backend?.ok)}</span>
          <span className={health.database?.productionReady?'ready':'warn'}>{ru?'Хранилище':'Storage'}: {health.database?.productionReady ? (ru?'Готово':'Ready') : (ru?'Локально':'Local')}</span>
          <span className={health.billing?.paymentsEnabled?'ready':'warn'}>{ru?'Оплата':'Payments'}: {health.billing?.paymentsEnabled ? (ru?'Включена':'Enabled') : (ru?'Выключена':'Disabled')}</span>
          <span className={(launch.errors24h || 0) < 5 ? 'ready':'warn'}>{ru?'Ошибки 24ч':'Errors 24h'}: {launch.errors24h ?? 0}</span>
        </div>
      </article>
    </section>

    <section className="grid two adminExecutiveGrid">
      <article className="glass adminPanel executiveAdminPanel">
        <div className="eyebrow">BUSINESS</div>
        <h2>{ru?'Бизнес-показатели':'Business metrics'}</h2>
        <div className="adminStatusRows">
          <div><span>{ru?'Активные 7 дней':'Active 7d'}</span><b>{analytics?.summary?.activeUsers7 ?? '—'}</b><small>{ru?'пользователи':'users'}</small></div>
          <div><span>{ru?'Активные 30 дней':'Active 30d'}</span><b>{analytics?.summary?.activeUsers30 ?? '—'}</b><small>{ru?'пользователи':'users'}</small></div>
          <div><span>{ru?'Выручка 30 дней':'Revenue 30d'}</span><b>{analytics?.summary?.revenue30 ?? 0}</b><small>{analytics?.currency || 'RUB'}</small></div>
          <div><span>{ru?'Сравнения':'Comparisons'}</span><b>{analytics?.summary?.totalComparisons ?? '—'}</b><small>{ru?'всего':'total'}</small></div>
        </div>
      </article>

      <article className="glass adminPanel executiveAdminPanel">
        <div className="eyebrow">AI COST CONTROL</div>
        <h2>{ru?'Контроль AI-расходов':'AI cost control'}</h2>
        <div className="adminStatusRows">
          <div><span>{ru?'Расход за месяц':'Monthly spend'}</span><b>{overview?.aiCost?.totals?.spendMonth ?? 0}</b><small>{overview?.aiCost?.currency || 'RUB'}</small></div>
          <div><span>{ru?'Бюджет использован':'Budget used'}</span><b>{overview?.aiCost?.totals?.budgetPercent ?? 0}%</b><small>{ru?'от лимита':'of limit'}</small></div>
          <div><span>{ru?'AI-события 24ч':'AI events 24h'}</span><b>{overview?.aiCost?.totals?.last24h ?? 0}</b><small>{ru?'запросы':'requests'}</small></div>
          <div><span>{ru?'Расход 24ч':'Spend 24h'}</span><b>{overview?.aiCost?.totals?.spend24h ?? 0}</b><small>{overview?.aiCost?.currency || 'RUB'}</small></div>
        </div>
      </article>
    </section>

    <section className="glass adminPanel executiveAdminPanel">
      <div className="eyebrow">PRODUCT OPERATIONS</div>
      <h2>{ru?'Операционная сводка':'Operations overview'}</h2>
      <div className="adminProGrid cleanAdminGrid">
        <article><span>{ru?'Пользователи':'Users'}</span><b>{consoleModules.users?.total ?? stats.users ?? '—'}</b><small>{ru?'заблокировано':'suspended'}: {consoleModules.users?.suspended ?? 0}</small></article>
        <article><span>{ru?'Платежи':'Payments'}</span><b>{consoleModules.billing?.succeeded ?? overview?.billing?.paymentsSucceeded ?? '—'}</b><small>{ru?'активные подписки':'active subs'}: {consoleModules.billing?.activeSubscriptions ?? overview?.billing?.activeSubscriptions ?? 0}</small></article>
        <article><span>{ru?'Поддержка':'Support'}</span><b>{consoleModules.support?.open ?? '—'}</b><small>{ru?'high priority':'high priority'}: {consoleModules.support?.highPriority ?? 0}</small></article>
        <article><span>{ru?'Стабильность':'Stability'}</span><b>{consoleModules.system?.errors24h ?? launch.errors24h ?? '—'}</b><small>{ru?'ошибки за 24ч':'errors 24h'}</small></article>
      </div>
    </section>

    {(blockers.length || warnings.length) ? <section className="glass adminPanel executiveAdminPanel">
      <div className="eyebrow">ACTION ITEMS</div>
      <h2>{ru?'Что нужно проверить':'What needs attention'}</h2>
      <div className="launchBlockerList cleanActionItems">
        {blockers.map(item => <article key={item.code}><b>{ru?'Блокер':'Blocker'} · {item.title}</b><p>{item.fix}</p></article>)}
        {warnings.map(item => <article key={item.code}><b>{ru?'Предупреждение':'Warning'} · {item.title}</b><p>{item.fix}</p></article>)}
      </div>
    </section> : null}

    <section className="grid two adminExecutiveGrid">
      <article className="glass adminPanel executiveAdminPanel">
        <h2>{ru?'Последние пользователи':'Recent users'}</h2>
        {overview?.recentUsers?.length ? overview.recentUsers.slice(0,6).map(user => <div className="adminListRow" key={user.id}><b>{user.email}</b><span>{user.role || 'user'} · {user.plan || 'free'}</span></div>) : <p className="hint">{ru?'Пользователей пока нет.':'No users yet.'}</p>}
      </article>
      <article className="glass adminPanel executiveAdminPanel">
        <h2>{ru?'Последние ошибки':'Recent errors'}</h2>
        {overview?.recentErrors?.length ? overview.recentErrors.slice(0,6).map(err => <div className="adminListRow" key={err.id}><b>{err.status} · {err.method} {err.path}</b><span>{err.message}</span></div>) : <p className="hint">{ru?'Критичных ошибок пока нет.':'No critical errors yet.'}</p>}
      </article>
    </section>
  </main>;
}

function Account({ ru, lang, selectedPlan, choosePlan, go, report, builtContract, apiOk, user, saveUser, logoutUser, history, removeHistoryItem, clearHistory, usage, serverSession, saveServerSession, logoutServerSession }) {
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', company: user?.company || '' });
  const [authForm, setAuthForm] = useState({ name: user?.name || '', email: user?.email || '', password: '' });
  const [authMode, setAuthMode] = useState('login');
  const [authMessage, setAuthMessage] = useState('');
  const [serverHistory, setServerHistory] = useState([]);
  const [serverBusy, setServerBusy] = useState(false);
  const [billingStatus, setBillingStatus] = useState(null);
  const [securityStatus, setSecurityStatus] = useState(null);
  const [accessState, setAccessState] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [deleteForm, setDeleteForm] = useState({ password: '', confirm: '' });
  const [exportPreview, setExportPreview] = useState(null);
  const effectivePlan = billingStatus?.plan || serverSession?.user?.plan || selectedPlan;
  const planLabel = effectivePlan === 'business' ? 'Business' : effectivePlan === 'pro' ? 'Pro' : 'Free';
  const limits = billingStatus?.limits || PLAN_LIMITS[effectivePlan] || PLAN_LIMITS.free;
  const used = billingStatus?.usage || (usage?.month === monthKey() ? usage : { reviews: 0, questions: 0, exports: 0 });
  const remaining = billingStatus?.remaining || { reviews: Math.max(0, (limits.reviews || 0) - (used.reviews || 0)), questions: Math.max(0, (limits.questions || 0) - (used.questions || 0)), exports: Math.max(0, (limits.exports || 0) - (used.exports || 0)) };
  function submitAccount(e) {
    e.preventDefault();
    const email = form.email.trim();
    if (!email) return alert(ru ? 'Введите email для локального профиля.' : 'Enter an email for the local profile.');
    saveUser({ ...form, email, plan: selectedPlan });
  }
  function openHistory(item) {
    if (item.type === 'contract' && item.payload) {
      localStorage.lastReport = JSON.stringify(item.payload);
      location.href = '/report';
      return;
    }
    if (item.type === 'document' && item.payload) {
      localStorage.builtContract = JSON.stringify(item.payload);
      go('/builder');
      return;
    }
  }
  async function copyHistorySummary(item) {
    if (item?.type === 'contract' && item.payload) {
      await copyReportPart(item.payload, lang, 'summary');
      alert(ru ? 'Резюме отчёта скопировано.' : 'Report summary copied.');
    }
  }
  function downloadHistoryReport(item) {
    if (item?.type === 'contract' && item.payload) downloadReportFile(item.payload, lang, 'html', { plan: effectivePlan });
  }

  async function submitServerAuth(e) {
    e.preventDefault();
    setServerBusy(true);
    setAuthMessage('');
    try {
      const data = await apiJson(authMode === 'register' ? '/api/auth/register' : '/api/auth/login', authForm);
      saveServerSession(data);
      setAuthMessage(ru ? 'Вы вошли в аккаунт.' : 'Signed in successfully.');
    } catch (err) {
      setAuthMessage(friendlyError(err, ru));
    } finally { setServerBusy(false); }
  }
  async function loadServerHistory() {
    if (!serverSession?.user) return;
    setServerBusy(true);
    setAuthMessage('');
    try {
      const data = await apiJson('/api/user/history', undefined, undefined, 'GET');
      setServerHistory(data.items || []);
      setAuthMessage(ru ? 'История обновлена.' : 'History refreshed.');
    } catch (err) { setAuthMessage(friendlyError(err, ru)); }
    finally { setServerBusy(false); }
  }
  async function pushLocalHistoryToServer() {
    if (!serverSession?.user) return;
    setServerBusy(true);
    setAuthMessage('');
    try {
      for (const item of (history || []).slice().reverse()) await apiJson('/api/user/history', { item }, undefined);
      await loadServerHistory();
      setAuthMessage(ru ? 'История сохранена.' : 'History saved.');
    } catch (err) { setAuthMessage(friendlyError(err, ru)); }
    finally { setServerBusy(false); }
  }
  async function logoutBackend() {
    if (serverSession?.user) apiJson('/api/auth/logout', {}, undefined).catch(()=>{});
    logoutServerSession();
    setServerHistory([]);
    setAuthMessage(ru ? 'Вы вышли из аккаунта.' : 'Logged out.');
  }
  async function loadSecurityStatus() {
    if (!serverSession?.user) return;
    try {
      const status = await apiJson('/api/auth/security-status', undefined, undefined, 'GET');
      const sessionData = await apiJson('/api/auth/sessions', undefined, undefined, 'GET');
      setSecurityStatus(status.status);
      setSessions(sessionData.sessions || []);
    } catch (err) { setAuthMessage(friendlyError(err, ru)); }
  }
  async function loadAccessState() {
    if (!serverSession?.user) return;
    try {
      const data = await apiJson('/api/auth/access-state', undefined, undefined, 'GET');
      setAccessState(data);
    } catch (err) { setAuthMessage(friendlyError(err, ru)); }
  }
  async function saveServerProfile() {
    if (!serverSession?.user) return;
    setServerBusy(true);
    try {
      const data = await apiJson('/api/user/profile', { name: form.name, company: form.company, locale: lang, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '', supportEmail: form.email, productUpdatesConsent: true }, undefined, 'PATCH');
      saveServerSession({ ...serverSession, user: data.user, session: serverSession.session, usage: serverSession.usage });
      setAccessState(data.access);
      setAuthMessage(ru ? 'Серверный профиль обновлён.' : 'Server profile updated.');
    } catch (err) { setAuthMessage(friendlyError(err, ru)); }
    finally { setServerBusy(false); }
  }
  async function exportAccountData() {
    if (!serverSession?.user) return;
    setServerBusy(true);
    try {
      const res = await fetchWithTimeout(`${API}/api/user/export`, { method: 'GET', credentials: 'include' }, 18000);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Export failed');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mavenlex-account-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setAuthMessage(ru ? 'Экспорт данных подготовлен.' : 'Account data export prepared.');
    } catch (err) { setAuthMessage(friendlyError(err, ru)); }
    finally { setServerBusy(false); }
  }
  async function deleteAccountFlow() {
    if (!serverSession?.user) return;
    const password = prompt(ru ? 'Введите пароль, чтобы удалить аккаунт. Действие необратимо.' : 'Enter your password to delete the account. This cannot be undone.');
    if (!password) return;
    setServerBusy(true);
    try {
      await apiJson('/api/auth/delete-account', { password }, undefined, 'DELETE');
      logoutServerSession();
      setAuthMessage(ru ? 'Аккаунт удалён.' : 'Account deleted.');
    } catch (err) { setAuthMessage(friendlyError(err, ru)); }
    finally { setServerBusy(false); }
  }
  async function requestEmailVerification() {
    if (!serverSession?.user) return;
    setServerBusy(true);
    try {
      const data = await apiJson('/api/auth/email-verification/request', {}, undefined);
      setAuthMessage(data.devVerificationLink ? `${ru?'Ссылка подтверждения создана':'Verification link created'}: ${data.devVerificationLink}` : (ru?'Письмо подтверждения подготовлено.':'Verification instructions prepared.'));
    } catch (err) { setAuthMessage(friendlyError(err, ru)); }
    finally { setServerBusy(false); }
  }
  async function submitChangePassword(e) {
    e.preventDefault();
    if (!serverSession?.user) return;
    setServerBusy(true);
    try {
      await apiJson('/api/auth/change-password', passwordForm, undefined);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      logoutServerSession();
      setAuthMessage(ru?'Пароль изменён. Войдите заново.':'Password changed. Log in again.');
    } catch (err) { setAuthMessage(friendlyError(err, ru)); }
    finally { setServerBusy(false); }
  }
  async function requestPasswordReset(e) {
    e.preventDefault();
    setServerBusy(true);
    try {
      const data = await apiJson('/api/auth/password-reset/request', { email: resetEmail || authForm.email });
      setAuthMessage(data.devResetLink ? `${ru?'Ссылка сброса создана':'Reset link created'}: ${data.devResetLink}` : (ru?'Если email существует, инструкции подготовлены.':'If the email exists, instructions are prepared.'));
    } catch (err) { setAuthMessage(friendlyError(err, ru)); }
    finally { setServerBusy(false); }
  }
  async function revokeSession(id) {
    if (!serverSession?.user) return;
    setServerBusy(true);
    try { await apiJson(`/api/auth/sessions/${encodeURIComponent(id)}`, undefined, undefined, 'DELETE'); await loadSecurityStatus(); setAuthMessage(ru?'Сессия завершена.':'Session revoked.'); }
    catch (err) { setAuthMessage(friendlyError(err, ru)); }
    finally { setServerBusy(false); }
  }
  async function logoutAllDevices() {
    if (!serverSession?.user) return;
    setServerBusy(true);
    try { await apiJson('/api/auth/logout-all', {}, undefined); logoutServerSession(); setAuthMessage(ru?'Все сессии завершены.':'All sessions logged out.'); }
    catch (err) { setAuthMessage(friendlyError(err, ru)); }
    finally { setServerBusy(false); }
  }
  async function loadBillingStatus() {
    if (!serverSession?.user) {
      setBillingStatus(null);
      return;
    }
    setServerBusy(true);
    try {
      const data = await apiJson('/api/billing/status', undefined, undefined, 'GET');
      setBillingStatus(data);
      if (data.user) {
        saveServerSession({ ...serverSession, user: data.user, session: serverSession.session, usage: data.usage || serverSession.usage });
      }
      setAuthMessage(prev => prev || (ru ? 'Статус подписки загружен.' : 'Billing status loaded.'));
    } catch (err) {
      setBillingStatus(null);
      setAuthMessage(friendlyError(err, ru));
    } finally {
      setServerBusy(false);
    }
  }
  useEffect(() => { if (serverSession?.user) { loadBillingStatus(); loadServerHistory(); loadSecurityStatus(); loadAccessState(); } }, [serverSession?.user?.id]);


  async function changeSubscription(planId) {
    if (!serverSession?.user) return go('/pricing');
    setServerBusy(true);
    try {
      const data = await apiJson('/api/subscription/change', { planId }, undefined);
      if (data.user) saveServerSession({ ...serverSession, user: data.user, usage: data.subscription?.usage });
      await loadBillingStatus();
      setAuthMessage(ru ? 'Тариф обновлён.' : 'Plan updated.');
    } catch (err) { setAuthMessage(friendlyError(err, ru)); }
    finally { setServerBusy(false); }
  }
  async function cancelSubscription() {
    if (!serverSession?.user) return;
    if (!confirm(ru ? 'Отменить подписку и перейти на Free?' : 'Cancel subscription and switch to Free?')) return;
    setServerBusy(true);
    try {
      const data = await apiJson('/api/subscription/cancel', {}, undefined);
      if (data.user) saveServerSession({ ...serverSession, user: data.user, usage: data.subscription?.usage });
      await loadBillingStatus();
      setAuthMessage(ru ? 'Подписка отменена.' : 'Subscription cancelled.');
    } catch (err) { setAuthMessage(friendlyError(err, ru)); }
    finally { setServerBusy(false); }
  }
  async function sendReportReadyEmail() {
    if (!serverSession?.user) return;
    setServerBusy(true);
    try {
      await apiJson('/api/email/report-ready', { text: ru ? 'Ваш последний отчёт MavenLex готов в кабинете.' : 'Your latest MavenLex report is ready in Account.' }, undefined);
      setAuthMessage(ru ? 'Email-уведомление отправлено или залогировано провайдером.' : 'Email notification sent or logged by provider.');
    } catch (err) { setAuthMessage(friendlyError(err, ru)); }
    finally { setServerBusy(false); }
  }
  return <main className="page accountPage">
    <section className="glass userPlanSnapshot v611">
      <div><div className="eyebrow">ACCOUNT SNAPSHOT</div><h2>{ru?'Ваш тариф и лимиты':'Your plan and limits'}</h2><p>{ru?'Кабинет показывает только пользовательские вещи: тариф, историю, безопасность и данные. Без технического мусора.':'The account shows only user-facing items: plan, history, security and data. No technical clutter.'}</p></div>
      <div className="planSnapshotGrid">
        <span><b>{planLabel}</b>{ru?'Текущий тариф':'Current plan'}</span>
        <span><b>{remaining.reviews === Infinity ? '∞' : remaining.reviews}</b>{ru?'Проверок осталось':'Reviews left'}</span>
        <span><b>{remaining.questions === Infinity ? '∞' : remaining.questions}</b>{ru?'AI-вопросов осталось':'AI questions left'}</span>
        <span><b>{remaining.exports === Infinity ? '∞' : remaining.exports}</b>{ru?'Экспортов осталось':'Exports left'}</span>
      </div>
    </section>
    <PageTitle label="PERSONAL CABINET" title={ru?'Кабинет MavenLex':'MavenLex Account'} text={ru?'Здесь хранятся ваши отчёты, тариф, лимиты и настройки аккаунта. Всё собрано в одном спокойном интерфейсе.':'Your reports, plan, limits and account settings live here in one clean interface.'}/>

    <section className="accountOverviewGrid">
      <div className="glass accountSummaryCard"><span>{ru?'Текущий тариф':'Current plan'}</span><b>{planLabel}</b><p>{ru?'Лимиты обновляются после входа и выбора тарифа.':'Limits update after login and plan activation.'}</p></div>
      <div className="glass accountSummaryCard"><span>{ru?'История анализов':'Analysis history'}</span><b>{history?.filter(x=>x.type==='contract').length || 0}</b><p>{serverHistory.length ? (ru?'Серверная история загружена':'History loaded') : (ru?'Локальная история доступна':'Local history available')}</p></div>
      <div className="glass accountSummaryCard"><span>{ru?'Осталось анализов':'Reviews left'}</span><b>{limits.reviews === 999 ? '∞' : remaining.reviews}</b><p>{used.reviews || 0} / {limits.reviews === 999 ? '∞' : limits.reviews}</p></div>
      <div className="glass accountSummaryCard"><span>{ru?'Осталось AI-вопросов':'AI questions left'}</span><b>{limits.questions === 999 ? '∞' : remaining.questions}</b><p>{used.questions || 0} / {limits.questions === 999 ? '∞' : limits.questions}</p></div>
    </section>

    <section className="glass serverAuthPanel">
      <div className="serverAuthTop">
        <div>
          <div className="eyebrow">ACCOUNT ACCESS</div>
          <h2>{ru?'Вход в аккаунт':'Account access'}</h2>
          <p>{ru?'Войдите или создайте аккаунт, чтобы сохранять историю, управлять тарифом и открывать админ-панель, если ваша почта указана как админская.':'Sign in or create an account to save history, manage your plan and open the admin console if your email is marked as admin.'}</p>
        </div>
        {serverSession?.user && <button className="secondary" onClick={logoutBackend}>{ru?'Выйти':'Log out'}</button>}
      </div>
      {serverSession?.user ? <div className="serverAccountReady">
        <div><b>{serverSession.user.email}</b><span>{ru?'Аккаунт активен':'Account active'}</span></div>
        <div className="serverAuthActions"><button className="primary" onClick={loadServerHistory} disabled={serverBusy}>{ru?'Обновить историю':'Refresh history'}</button><button className="secondary" onClick={pushLocalHistoryToServer} disabled={serverBusy}>{ru?'Сохранить историю':'Save history'}</button>{['local_admin','admin','owner'].includes(serverSession?.user?.role) && <button className="secondary" onClick={()=>go('/admin')}>Admin</button>}</div>
      </div> : <form className="serverAuthForm" onSubmit={submitServerAuth}>
        <div className="miniPlanSwitch authSwitch"><button type="button" className={authMode==='login'?'selected':''} onClick={()=>setAuthMode('login')}>{ru?'Вход':'Login'}</button><button type="button" className={authMode==='register'?'selected':''} onClick={()=>setAuthMode('register')}>{ru?'Регистрация':'Register'}</button></div>
        {authMode === 'register' && <Field label={ru?'Имя':'Name'}><input value={authForm.name} onChange={e=>setAuthForm({...authForm, name:e.target.value})} placeholder="Makar" /></Field>}
        <Field label="Email"><input value={authForm.email} onChange={e=>setAuthForm({...authForm, email:e.target.value})} placeholder="you@example.com" /></Field>
        <Field label={ru?'Пароль':'Password'}><input type="password" value={authForm.password} onChange={e=>setAuthForm({...authForm, password:e.target.value})} placeholder={ru?'минимум 8 символов, буквы и цифры':'at least 8 characters, letters and numbers'} /></Field>
        <button className="primary" disabled={serverBusy}>{serverBusy ? (ru?'Подождите...':'Please wait...') : (authMode==='register' ? (ru?'Создать аккаунт':'Create account') : (ru?'Войти':'Login'))}</button>
      </form>}
      {!serverSession?.user && <form className="serverAuthForm compactAuthForm" onSubmit={requestPasswordReset}><Field label={ru?'Забыли пароль? Введите email':'Forgot password? Enter email'}><input value={resetEmail} onChange={e=>setResetEmail(e.target.value)} placeholder="you@example.com" /></Field><button className="secondary" disabled={serverBusy}>{ru?'Получить ссылку сброса':'Request reset link'}</button></form>}
      {authMessage && <p className="authMessage">{authMessage}</p>}
      {serverHistory.length > 0 && <div className="serverHistoryList richServerHistory"><b>{ru?'История аккаунта':'Account history'}</b>{serverHistory.slice(0,8).map(item => <article key={item.id}><span>{historyTitle(item, ru)}</span><small>{formatDateTime(item.createdAt, ru)} · {historyStatusLabel(item, ru)} · {item.summary || item.fileName || item.type}</small></article>)}</div>}
    </section>

    {serverSession?.user && <section className="glass accountSecurityPanel">
      <div className="serverAuthTop"><div><div className="eyebrow">ACCOUNT SECURITY</div><h2>{ru?'Безопасность аккаунта':'Account security'}</h2><p>{ru?'Email, пароль, активные сессии и выход со всех устройств.':'Email, password, active sessions and logout from all devices.'}</p></div><button className="secondary" onClick={loadSecurityStatus} disabled={serverBusy}>{ru?'Обновить':'Refresh'}</button></div>
      <div className="billingStatusGrid">
        <div><span>Email</span><b>{securityStatus?.emailVerified ? (ru?'Подтверждён':'Verified') : (ru?'Не подтверждён':'Not verified')}</b><small>{serverSession.user.email}</small></div>
        <div><span>{ru?'Роль':'Role'}</span><b>{securityStatus?.role || serverSession.user.role || 'user'}</b><small>{securityStatus?.accountStatus || serverSession.user.status || 'active'}</small></div>
        <div><span>{ru?'Сессии':'Sessions'}</span><b>{securityStatus?.activeSessions ?? sessions.length}</b><small>{ru?'Активные устройства':'Active devices'}</small></div>
        <div><span>{ru?'Последний вход':'Last login'}</span><b>{securityStatus?.lastLoginAt ? formatDateTime(securityStatus.lastLoginAt, ru) : '—'}</b><small>{ru?'По данным аккаунта':'Account data'}</small></div>
      </div>
      <div className="accountActions"><button className="secondary" onClick={requestEmailVerification} disabled={serverBusy || securityStatus?.emailVerified}>{ru?'Подтвердить email':'Verify email'}</button><button className="secondary" onClick={logoutAllDevices} disabled={serverBusy}>{ru?'Выйти со всех устройств':'Log out all devices'}</button><button className="secondary" onClick={()=>go('/reset-password')}>{ru?'Страница сброса пароля':'Reset password page'}</button></div>
      <form className="serverAuthForm" onSubmit={submitChangePassword}><Field label={ru?'Текущий пароль':'Current password'}><input type="password" value={passwordForm.currentPassword} onChange={e=>setPasswordForm({...passwordForm,currentPassword:e.target.value})}/></Field><Field label={ru?'Новый пароль':'New password'}><input type="password" value={passwordForm.newPassword} onChange={e=>setPasswordForm({...passwordForm,newPassword:e.target.value})} placeholder={ru?'минимум 8 символов, буквы и цифры':'at least 8 chars, letters and numbers'}/></Field><button className="primary" disabled={serverBusy}>{ru?'Сменить пароль':'Change password'}</button></form>
      {sessions.length > 0 && <div className="serverHistoryList richServerHistory"><b>{ru?'Активные сессии':'Active sessions'}</b>{sessions.slice(0,6).map(s => <article key={s.id}><span>{s.current ? (ru?'Текущая сессия':'Current session') : (ru?'Другое устройство':'Other device')}</span><small>{formatDateTime(s.createdAt, ru)} · {s.ip || 'IP'} · {(s.userAgent || '').slice(0,80)}</small>{!s.current && !s.revokedAt && <button className="secondary dangerMini" onClick={()=>revokeSession(s.id)}>{ru?'Завершить':'Revoke'}</button>}</article>)}</div>}
    </section>}
    {serverSession?.user && <section className="glass launchReadinessPanel accountManagementPanel">
      <div className="serverAuthTop"><div><div className="eyebrow">ACCOUNT CONTROL</div><h2>{ru?'Управление аккаунтом':'Account controls'}</h2><p>{ru?'Быстрые действия для профиля: настройки, экспорт данных, история и удаление аккаунта.':'Quick profile actions: settings, data export, history and account deletion.'}</p></div></div>
      <div className="accessStateGrid cleanAccessGrid">
        <article className="ready"><span>{ru?'Профиль':'Profile'}</span><b>{serverSession.user.email}</b><small>{ru?'Аккаунт активен':'Account active'}</small></article>
        <article className={['local_admin','admin','owner'].includes(serverSession?.user?.role) ? 'ready' : 'warn'}><span>{ru?'Роль':'Role'}</span><b>{serverSession.user.role || 'user'}</b><small>{['local_admin','admin','owner'].includes(serverSession?.user?.role) ? (ru?'Админ-доступ открыт':'Admin access enabled') : (ru?'Обычный пользователь':'Regular user')}</small></article>
        <article className="ready"><span>{ru?'Тариф':'Plan'}</span><b>{planLabel}</b><small>{ru?'Лимиты видны ниже':'Limits are shown below'}</small></article>
        <article className="ready"><span>{ru?'История':'History'}</span><b>{history?.length || 0}</b><small>{ru?'Сохранённых записей':'saved items'}</small></article>
      </div>
      <div className="accountActions"><button className="primary" onClick={()=>go('/settings')}>{ru?'Открыть настройки':'Open settings'}</button>{['local_admin','admin','owner'].includes(serverSession?.user?.role) && <button className="secondary" onClick={()=>go('/admin')}>{ru?'Открыть админку':'Open admin'}</button>}<button className="secondary" onClick={exportAccountData} disabled={serverBusy}>{ru?'Экспорт данных':'Export data'}</button><button className="secondary dangerMini" onClick={deleteAccountFlow} disabled={serverBusy}>{ru?'Удалить аккаунт':'Delete account'}</button></div>
    </section>}

    <section className="glass billingStatusPanel">
      <div>
        <div className="eyebrow">PLAN STATUS</div>
        <h2>{ru?'Тариф и лимиты':'Plan and limits'}</h2>
        <p>{serverSession?.user ? (ru?'Здесь видно текущий тариф, остаток анализов и доступные действия по подписке.':'Your current plan, remaining analyses and subscription actions are shown here.') : (ru?'Войдите в аккаунт, чтобы управлять тарифом и сохранять историю.':'Sign in to manage your plan and save history.')}</p>
      </div>
      <div className="billingStatusGrid">
        <span>{ru?'Ваш тариф':'Your plan'}: <b>{planLabel}</b></span>
        <span>{ru?'Статус':'Status'}: <b>{billingStatus?.billing?.billingStatus || serverSession?.user?.billingStatus || (effectivePlan === 'free' ? 'free' : 'active')}</b></span>
        <span>{ru?'Период до':'Period end'}: <b>{billingStatus?.billing?.subscription?.currentPeriodEnd ? new Date(billingStatus.billing.subscription.currentPeriodEnd).toLocaleDateString(ru?'ru-RU':'en-US') : '—'}</b></span>
      </div>
      <div className="billingUsageRows">
        <div><b>{ru?'Анализы договоров':'Contract reviews'}</b><span>{used.reviews || 0} / {limits.reviews === 999 ? '∞' : limits.reviews}</span><small>{ru?'Осталось':'Remaining'}: {limits.reviews === 999 ? '∞' : remaining.reviews}</small></div>
        <div><b>{ru?'AI-вопросы':'AI questions'}</b><span>{used.questions || 0} / {limits.questions === 999 ? '∞' : limits.questions}</span><small>{ru?'Осталось':'Remaining'}: {limits.questions === 999 ? '∞' : remaining.questions}</small></div>
        <div><b>Export</b><span>{used.exports || 0} / {limits.exports === 999 ? '∞' : limits.exports}</span><small>{ru?'Осталось':'Remaining'}: {limits.exports === 999 ? '∞' : remaining.exports}</small></div>
      </div>
      <div className="accountActions"><button className="primary" onClick={()=>go('/pricing')}>{ru?'Изменить тариф':'Change plan'}</button>{serverSession?.user && <button className="secondary" onClick={loadBillingStatus} disabled={serverBusy}>{ru?'Обновить статус':'Refresh status'}</button>}{serverSession?.user && effectivePlan !== 'free' && <button className="secondary dangerMini" onClick={cancelSubscription} disabled={serverBusy}>{ru?'Отменить подписку':'Cancel subscription'}</button>}</div>
      
      {billingStatus?.billing?.recentPayments?.length > 0 && <div className="paymentMiniList">{billingStatus.billing.recentPayments.slice(0,4).map(p => <span key={p.id}>{p.status} · {p.planId} · {p.amount} {p.currency}</span>)}</div>}
    </section>

    <section className="grid four">
      <Metric label={ru?'Тариф':'Plan'} value={planLabel}/>
      <Metric label={ru?'Анализы':'Reviews'} value={`${used.reviews || 0}/${limits.reviews === 999 ? '∞' : limits.reviews}`}/>
      <Metric label={ru?'AI вопросы':'AI questions'} value={`${used.questions || 0}/${limits.questions === 999 ? '∞' : limits.questions}`}/>
      <Metric label={ru?'API':'API'} value={apiOk}/>
    </section>

    <section className="grid two accountFoundationGrid">
      <form className="glass accountPanel authPanel" onSubmit={submitAccount}>
        <div className="authTop">
          <div><div className="eyebrow">PROFILE</div><h2>{user ? (ru?'Профиль сохранён':'Profile saved') : (ru?'Создать профиль':'Create profile')}</h2></div>
          {user && <button type="button" className="secondary" onClick={logoutUser}>{ru?'Выйти':'Log out'}</button>}
        </div>
        <div className="formGrid single">
          <Field label={ru?'Имя':'Name'}><input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder={ru?'Макар':'Makar'} /></Field>
          <Field label="Email"><input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="you@example.com" /></Field>
          <Field label={ru?'Компания — необязательно':'Company — optional'}><input value={form.company} onChange={e=>setForm({...form, company:e.target.value})} placeholder="MavenLex" /></Field>
        </div>
        <div className="accountActions"><button className="primary" type="submit">{user ? (ru?'Обновить профиль':'Update profile') : (ru?'Сохранить профиль':'Save profile')}</button>{serverSession?.user && <button type="button" className="secondary" onClick={saveServerProfile} disabled={serverBusy}>{ru?'Сохранить на сервер':'Save to server'}</button>}</div>
        <p className="hint">{ru?'Профиль нужен для истории, тарифа и персональных настроек. Секретные ключи здесь не отображаются.':'The profile is used for history, plan status and personal settings. Secret keys are never shown here.'}</p>
      </form>

      <div className="glass accountPanel">
        <h2>{ru?'Тариф и быстрые действия':'Plan and quick actions'}</h2>
        <div className="miniPlanSwitch">
          {['free','pro','business'].map(p => <button key={p} className={selectedPlan===p?'selected':''} onClick={()=>choosePlan(p)}>{p === 'free' ? 'Free' : p === 'pro' ? 'Pro' : 'Business'}</button>)}
        </div>
        <div className="accountActions"><button className="primary" onClick={()=>go('/analyze')}>{ru?'Проверить договор':'Review contract'}</button><button className="secondary" onClick={()=>go('/situation')}>{ru?'Разобрать ситуацию':'Analyze situation'}</button><button className="secondary" onClick={()=>go('/pricing')}>{ru?'Открыть тарифы':'Open pricing'}</button></div>
      </div>
    </section>

    <section className="glass historyPanel polishedHistoryPanel">
      <div className="historyPanelTop"><div><div className="eyebrow">SAVED HISTORY</div><h2>{ru?'История анализов и документов':'Analysis and document history'}</h2><p>{ru?'Можно вернуться к отчёту, увидеть дату, риск, краткое описание и быстро продолжить работу.':'Return to reports, see date, risk level, summary and continue work quickly.'}</p></div>{history?.length > 0 && <button className="secondary" onClick={clearHistory}>{ru?'Очистить':'Clear'}</button>}</div>
      {history?.length ? <div className="historyList richHistoryList">{history.map(item => <article className="historyItem richHistoryItem" key={item.id}>
        <div className="historyItemMain"><div><span className="historyKind">{historyKindLabel(item, ru)}</span><b>{historyTitle(item, ru)}</b><small>{formatDateTime(item.createdAt, ru)}</small></div><span className={`riskBadge ${String(historyStatusLabel(item, false)).toLowerCase().replace(/\s+/g,'-')}`}>{historyStatusLabel(item, ru)}</span></div>
        <p>{historySummary(item, ru)}</p>
        {item.type === 'contract' && <div className="historyMetaGrid"><span>{ru?'Risk score':'Risk score'}: <b>{item.riskScore || item.payload?.riskScore || '—'}/100</b></span><span>{ru?'Файл':'File'}: <b>{item.fileName || item.payload?.meta?.fileName || '—'}</b></span></div>}
        <div className="historyActions"><button className="primary" onClick={()=>openHistory(item)}>{ru?'Открыть отчёт':'Open report'}</button>{item.type === 'contract' && <button className="secondary" onClick={()=>downloadHistoryReport(item)}>{ru?'Скачать':'Download'}</button>}{item.type === 'contract' && <button className="secondary" onClick={()=>copyHistorySummary(item)}>{ru?'Скопировать':'Copy'}</button>}<button className="secondary dangerMini" onClick={()=>removeHistoryItem(item.id)}>{ru?'Удалить':'Delete'}</button></div>
      </article>)}</div> : <div className="emptyHistory polishedEmpty"><b>{ru?'У вас пока нет сохранённых анализов':'No saved analyses yet'}</b><span>{ru?'Загрузите первый договор — отчёт появится здесь, и к нему можно будет вернуться позже.':'Upload the first contract — the report will appear here and you can return to it later.'}</span><button className="primary" onClick={()=>go('/analyze')}>{ru?'Проверить договор':'Review contract'}</button></div>}
    </section>
  </main>;
}


function ResetPasswordPage({ ru, go }) {
  const [token, setToken] = useState(() => new URLSearchParams(location.search).get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMessage('');
    try {
      await apiJson('/api/auth/password-reset/confirm', { token, newPassword });
      setMessage(ru ? 'Пароль изменён. Теперь можно войти в кабинет.' : 'Password changed. You can now log in.');
    } catch (err) { setMessage(friendlyError(err, ru)); }
    finally { setBusy(false); }
  }
  return <main className="page accountPage"><PageTitle label="PASSWORD RESET" title={ru?'Восстановление доступа':'Account recovery'} text={ru?'Откройте ссылку из письма или вставьте токен, затем задайте новый пароль.':'Open the email link or paste the token, then set a new password.'}/><form className="glass serverAuthForm" onSubmit={submit}><Field label="Token"><input value={token} onChange={e=>setToken(e.target.value)} placeholder="reset token" /></Field><Field label={ru?'Новый пароль':'New password'}><input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder={ru?'минимум 8 символов, буквы и цифры':'at least 8 characters, letters and numbers'} /></Field><button className="primary" disabled={busy}>{busy ? (ru?'Подождите...':'Please wait...') : (ru?'Изменить пароль':'Change password')}</button>{message && <p className="authMessage">{message}</p>}<button type="button" className="secondary" onClick={()=>go('/account')}>{ru?'В кабинет':'Account'}</button></form></main>;
}

function VerifyEmailPage({ ru, go, serverSession, saveServerSession }) {
  const [token, setToken] = useState(() => new URLSearchParams(location.search).get('token') || '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMessage('');
    try {
      const data = await apiJson(`/api/auth/email-verification/confirm?token=${encodeURIComponent(token)}`, undefined, undefined, 'GET');
      if (serverSession?.session && data.user) saveServerSession({ ...serverSession, user: data.user, session: serverSession.session });
      setMessage(ru ? 'Email подтверждён.' : 'Email verified.');
    } catch (err) { setMessage(friendlyError(err, ru)); }
    finally { setBusy(false); }
  }
  return <main className="page accountPage"><PageTitle label="EMAIL VERIFICATION" title={ru?'Подтверждение email':'Verify email'} text={ru?'Подтвердите email, чтобы аккаунт был защищён и готов к работе.':'Verify email to keep the account secure and ready to use.'}/><form className="glass serverAuthForm" onSubmit={submit}><Field label="Token"><input value={token} onChange={e=>setToken(e.target.value)} placeholder="verification token" /></Field><button className="primary" disabled={busy}>{busy ? (ru?'Подождите...':'Please wait...') : (ru?'Подтвердить email':'Verify email')}</button>{message && <p className="authMessage">{message}</p>}<button type="button" className="secondary" onClick={()=>go('/account')}>{ru?'В кабинет':'Account'}</button></form></main>;
}


function LegalCenter({ ru }) {
  const docs = [
    {
      id: 'terms',
      title: ru ? 'Пользовательское соглашение' : 'Terms of Use',
      text: ru
        ? 'MavenLex предоставляет информационный AI-анализ, инструменты подготовки документов и навигацию по юридическим ситуациям. Сервис даёт AI-разбор рисков, действий и формулировок; пользователь сам принимает итоговое решение.'
        : 'MavenLex provides informational AI analysis, document preparation tools and navigation for legal situations. The service is not a law firm or official legal authority.',
      bullets: ru
        ? ['Пользователь сам принимает решения.', 'Высокорисковые ситуации нужно проверять по актуальным источникам и фактам.', 'Запрещено использовать сервис для незаконных действий.']
        : ['The user makes final decisions.', 'High-risk situations should be checked with MavenLex.', 'The service must not be used for illegal actions.']
    },
    {
      id: 'privacy',
      title: ru ? 'Политика конфиденциальности' : 'Privacy Policy',
      text: ru
        ? 'Документы и вопросы используются только для подготовки ответа внутри MavenLex. Не загружайте лишние персональные или особо чувствительные данные без необходимости.'
        : 'Documents and questions are used only to prepare an answer inside MavenLex. Avoid uploading unnecessary personal or highly sensitive data.',
      bullets: ru
        ? ['Секретные ключи не показываются пользователям.', 'Файл Технические настройки не публикуются на сайте.', 'Пользователь должен понимать, как удалить данные.']
        : ['Secret keys are never shown to users.', 'Technical settings are not published on the website.', 'Users should understand how to delete their data.']
    },
    {
      id: 'ai',
      title: ru ? 'Границы AI-анализа' : 'AI Analysis Limits',
      text: ru
        ? 'MavenLex помогает быстро увидеть риски и подготовить вопросы. Итоговые решения по суду, крупным сделкам и спорным ситуациям лучше подтверждать со MavenLex.'
        : 'MavenLex helps detect risks and prepare questions faster. Final decisions on court, major deals and disputes should be confirmed with a specialist.',
      bullets: ru
        ? ['Показывает риски и возможные действия.', 'Для суда, полиции и крупных сумм нужен особенно аккуратный разбор фактов и документов.', 'Помогает подготовиться к следующему действию.']
        : ['Shows risks and possible next steps.', 'Court, police and major financial exposure require a specialist.', 'Helps prepare for MavenLex analysis.']
    },
    {
      id: 'data',
      title: ru ? 'Обработка документов' : 'Document Processing',
      text: ru
        ? 'MavenLex работает с файлами аккуратно: загрузка договора, анализ, отчёт и история в кабинете.'
        : 'MavenLex handles files carefully: contract upload, analysis, report and account history.',
      bullets: ru
        ? ['Лимит файла: 15 MB.', 'Форматы: TXT, DOCX, PDF.', 'Для важных договоров можно заранее убрать лишние персональные данные.']
        : ['File limit: 15 MB.', 'Formats: TXT, DOCX, PDF.', 'For important contracts, remove unnecessary personal data before upload.']
    }
  ];
  return <main className="page legalPage">
    <PageTitle label="TRUST CENTER" title={ru?'Правила, безопасность и доверие':'Rules, security and trust'} text={ru?'Публичный центр доверия: конфиденциальность, условия, безопасность и границы AI-анализа.':'Public trust center: privacy, terms, security and AI-analysis boundaries.'}/>
    <section className="glass trustHero">
      <div><div className="eyebrow">PRODUCTION TRUST</div><h2>{ru?'Простые правила доверия':'Simple trust rules'}</h2><p>{ru?'MavenLex должен выглядеть не только умным, но и безопасным: честные ограничения AI, правила обработки документов и понятные юридические предупреждения.':'MavenLex should look not only smart, but safe: honest AI limits, document processing rules and clear legal warnings.'}</p></div>
      <div className="trustChecklist"><span>{ru?'AI-анализ MavenLex':'AI is not MavenLex'}</span><span>{ru?'Секреты не видны пользователю':'Secrets are not exposed'}</span><span>{ru?'High-risk → MavenLex':'High-risk → MavenLex'}</span></div>
    </section>
    <section className="grid two legalGrid">
      {docs.map(doc => <article className="glass legalCard" key={doc.id}>
        <h2>{doc.title}</h2>
        <p>{doc.text}</p>
        <ul>{doc.bullets.map((x,i)=><li key={i}>{x}</li>)}</ul>
      </article>)}
    </section>
    <section className="glass launchLegalNote"><b>{ru?'Важно':'Important'}</b><p>{ru?'MavenLex предоставляет AI-анализ. Для крупных сделок, споров и регулируемых вопросов используйте результат как основу для детальной проверки фактов, документов и актуальных норм.':'MavenLex provides informational AI analysis and does not replace checking facts, documents and current rules. For major deals, disputes and regulated matters, use the output as preparation for careful verification.'}</p></section>
  </main>;
}


function LegalPage({ ru, kind, go }) {
  const pages = {
    privacy: {
      label: 'PRIVACY POLICY',
      title: ru ? 'Политика конфиденциальности' : 'Privacy Policy',
      lead: ru ? 'Как MavenLex обрабатывает документы, аккаунт и технические данные при использовании сервиса.' : 'How MavenLex handles documents, account data and technical data when you use the service.',
      sections: [
        [ru?'Какие данные обрабатываются':'What data is processed', ru?'Документы, вопросы, результаты AI-анализа, email аккаунта, тариф, лимиты использования и технические события могут обрабатываться для работы сервиса.' : 'Documents, questions, AI-analysis results, account email, plan, usage limits and technical events may be processed to operate the service.'],
        [ru?'Как используются документы':'How documents are used', ru?'Загруженные документы используются для извлечения текста и генерации анализа. Они не используются для рекламы и не публикуются на сайте.' : 'Uploaded documents are used to extract text and generate analysis. They are not used for advertising and are not published on the site.'],
        [ru?'AI-провайдер':'AI provider', ru?'Текст документа используется для формирования анализа. Не загружайте лишние персональные или особо чувствительные данные.' : 'Document text is used to generate analysis. Avoid uploading unnecessary personal or highly sensitive data.'],
        [ru?'Удаление и минимизация':'Deletion and minimization', ru?'Для конфиденциальных договоров удалите персональные данные перед загрузкой, если они не нужны для анализа. Для production следует настроить понятную политику хранения и удаления данных.' : 'For confidential contracts, remove personal data before uploading if it is not needed for analysis. Production deployment should define clear retention and deletion rules.'],
        [ru?'Права пользователя':'User rights', ru?'В кабинете доступны экспорт данных и удаление аккаунта. В кабинете можно экспортировать данные и удалить аккаунт. По вопросам сервиса используйте раздел поддержки.' : 'Account includes data export and account deletion. Account includes data export and account deletion. Use the Support section for service questions.']
      ]
    },
    terms: {
      label: 'TERMS OF USE',
      title: ru ? 'Условия использования' : 'Terms of Use',
      lead: ru ? 'Правила использования MavenLex и границы ответственности сервиса.' : 'Rules for using MavenLex and service responsibility limits.',
      sections: [
        [ru?'Назначение сервиса':'Service purpose', ru?'MavenLex помогает предварительно анализировать договоры и юридические ситуации, находить риски и готовить пункты для проверки.' : 'MavenLex helps preliminarily analyze contracts and legal situations, identify risks and prepare points to verify.'],
        [ru?'Не юридическая консультация':'Not legal advice', ru?'Результаты MavenLex являются информационным AI-анализом. Они не являются юридической консультацией, MavenLexским заключением или гарантией исхода дела.' : 'MavenLex outputs are informational AI analysis. They are not legal advice, a legal opinion or a guarantee of outcome.'],
        [ru?'Ответственность пользователя':'User responsibility', ru?'Пользователь самостоятельно принимает решения. Для подписания важных договоров, судебных споров, полиции, налогов и крупных сумм нужна проверка фактов, документов и актуальных норм.' : 'The user makes final decisions. Important contracts, disputes, police matters, taxes and large financial exposure require verification of facts, documents and current rules.'],
        [ru?'Запрещённое использование':'Prohibited use', ru?'Нельзя использовать сервис для незаконных действий, обхода закона, нарушения прав других лиц или загрузки материалов, которые вы не вправе обрабатывать.' : 'Do not use the service for illegal actions, evasion of law, violating others rights or uploading materials you are not allowed to process.']
      ]
    },
    security: {
      label: 'SECURITY',
      title: ru ? 'Безопасность документов' : 'Document Security',
      lead: ru ? 'Практические правила безопасной загрузки договоров и контроля технической готовности.' : 'Practical rules for secure contract uploads and technical readiness.',
      sections: [
        [ru?'Перед загрузкой':'Before uploading', ru?'Проверьте файл, удалите лишние персональные данные и не загружайте секреты, пароли, приватные ключи или документы, которые вы не вправе передавать.' : 'Check the file, remove unnecessary personal data, and do not upload secrets, passwords, private keys or documents you are not allowed to share.'],
        [ru?'Хранение секретов':'Secret storage', ru?'Секретные ключи и внутренние настройки не должны быть видны пользователям или попадать в публичные файлы.' : 'Secret keys and internal settings must not be visible to users or exposed in public files.'],
        [ru?'Production database':'Production database', ru?'Для публичного продукта данные аккаунтов и истории должны храниться в надёжном защищённом хранилище.' : 'For a public product, account and history data should be stored in secure reliable storage.'],
        [ru?'Проверка готовности':'Readiness checks', ru?'Перед публикацией проверьте вход, анализ договора, отчёт, тарифы, кабинет и админ-панель. Технические предупреждения не должны мешать обычному пользователю.' : 'Before publishing, check sign-in, contract analysis, report, pricing, account and admin console. Technical warnings should not disturb regular users.']
      ]
    }
  };
  const page = pages[kind] || pages.security;
  return <main className="page legalDetailPage">
    <PageTitle label={page.label} title={page.title} text={page.lead}/>
    <section className="glass legalDetailHero">
      <div>
        <div className="eyebrow">PUBLIC TRUST PACK</div>
        <h2>{ru?'Прозрачные правила перед загрузкой документа':'Transparent rules before uploading a document'}</h2>
        <p>{ru?'Эти страницы помогают пользователю понять, как безопасно пользоваться MavenLex, какие ограничения есть у AI и как проверять факты, документы и актуальные нормы.':'These pages help users understand how to use MavenLex safely, where AI limits are, and why important decisions should be verified by a specialist.'}</p>
      </div>
      <div className="legalQuickLinks">
        <button className={kind==='privacy'?'selected':''} onClick={()=>go('/privacy')}>{ru?'Конфиденциальность':'Privacy'}</button>
        <button className={kind==='terms'?'selected':''} onClick={()=>go('/terms')}>{ru?'Условия':'Terms'}</button>
        <button className={kind==='security'?'selected':''} onClick={()=>go('/security')}>{ru?'Безопасность':'Security'}</button>
      </div>
    </section>
    <section className="legalSections">
      {page.sections.map(([title, text]) => <article className="glass legalSectionCard" key={title}>
        <h2>{title}</h2>
        <p>{text}</p>
      </article>)}
    </section>
    <section className="glass legalDisclaimerBox">
      <b>{ru?'Юридическое предупреждение':'Legal disclaimer'}</b>
      <p>{ru?'MavenLex даёт AI-разбор, риски, действия и готовые формулировки. Используйте результат как предварительную проверку, список рисков и подготовку списка рисков, действий и спорных мест.' : 'MavenLex provides AI analysis. Use the output as a preliminary review, risk list and preparation for checking facts and current rules.'}</p>
    </section>
  </main>;
}



function ClauseLibraryPage({ ru, serverSession }) {
  const [clauses, setClauses] = useState([]);
  const [query, setQuery] = useState('');
  const [recs, setRecs] = useState([]);
  const [status, setStatus] = useState('');
  useEffect(()=>{ apiJson('/api/clauses/library', undefined, undefined, 'GET').then(d=>setClauses(d.clauses||[])).catch(e=>setStatus(e.message)); },[]);
  async function recommend() { try { const d = await apiJson('/api/clauses/recommend', { text: query }); setRecs(d.recommendations || []); setStatus(''); } catch(e){ setStatus(e.message); } }
  async function fav(id) { try { await apiJson('/api/clauses/favorites', { clauseId:id }, serverSession); setStatus(ru?'Формулировка добавлена в избранное':'Clause added to favorites'); } catch(e){ setStatus(e.message); } }
  function clearFilters() { setQuery(''); setRecs([]); setStatus(''); }
  function copyClause(text) { navigator.clipboard?.writeText(text || ''); setStatus(ru?'Формулировка скопирована':'Clause copied'); }
  const riskLabel = risk => ({ high: ru ? 'Высокий риск' : 'High risk', medium: ru ? 'Средний риск' : 'Medium risk', low: ru ? 'Низкий риск' : 'Low risk' }[String(risk || '').toLowerCase()] || risk);
  const list = recs.length ? recs : clauses;
  return <main className="page clauseLibraryPage">
    <section className="glass clauseLibraryHero">
      <div>
        <div className="eyebrow">CLAUSE LIBRARY</div>
        <h1>{ru?'Библиотека юридических пунктов':'Clause Library'}</h1>
        <p>{ru?'Готовые ориентиры для переговоров: где в пункте риск, как переписать его безопаснее и что сказать второй стороне без лишней жёсткости.' : 'A practical clause library for negotiation: where the risk is, how to rewrite it more safely, and what to tell the other side.'}</p>
      </div>
      <div className="clauseLibraryIntroPills">
        <span>{ru?'Риски':'Risks'}</span>
        <span>{ru?'Безопасные формулировки':'Safer wording'}</span>
        <span>{ru?'Подсказки для переговоров':'Negotiation tips'}</span>
      </div>
    </section>

    <section className="glass clauseLibrarySearch">
      <div className="clauseSearchHeader"><b>{ru?'Подобрать полезные пункты':'Find relevant clauses'}</b><span>{ru?'Например: штраф, расторжение, оплата, ответственность, конфиденциальность.' : 'Try: penalty, termination, payment, liability, confidentiality.'}</span></div>
      <div className="clauseSearchBar">
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={ru?'Например: штраф, расторжение, оплата':'For example: penalty, termination, payment'} />
        <button className="primary" onClick={recommend}>{ru?'Подобрать':'Recommend'}</button>
        <button className="secondary" onClick={clearFilters}>{ru?'Показать все':'Show all'}</button>
      </div>
      {status && <div className="subtleStatus">{status}</div>}
    </section>

    <section className="riskGrid clauseRiskGrid">
      {list.map(c => <article className="glass riskCard clauseRiskCard" key={c.id}>
        <div className="riskCardTop"><span className={`riskPill ${String(c.risk || '').toLowerCase()}`}>{riskLabel(c.risk)}</span></div>
        <h3>{c.title}</h3>
        <div className="riskCardBody">
          <p><b>{ru?'Проблема':'Problem'}:</b> {c.problem}</p>
          <p><b>{ru?'Безопаснее':'Safer'}:</b> {c.safer}</p>
          <p><b>{ru?'Переговоры':'Negotiation'}:</b> {c.negotiation}</p>
        </div>
        <div className="riskCardActions">
          <button className="secondary" onClick={()=>copyClause(c.safer)}>{ru?'Скопировать формулировку':'Copy wording'}</button>
          <button className="primary" onClick={()=>fav(c.id)} disabled={!serverSession?.user}>{ru?'В избранное':'Favorite'}</button>
        </div>
      </article>)}
    </section>
  </main>;
}

function RewriteAssistantPage({ ru, serverSession }) {
  const [clause, setClause] = useState('');
  const [role, setRole] = useState('balanced');
  const [tone, setTone] = useState('neutral');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  async function rewrite() {
    setError(''); setResult(null);
    try { const d = await apiJson('/api/rewrite/clause', { clause, role, tone, direction:'safer' }, serverSession); setResult(d.result); } catch(e){ setError(humanError(e, ru)); }
  }
  return <main className="page rewritePage polishedRewritePage">
    <section className="glass rewriteHeroPanel">
      <div>
        <div className="eyebrow">CLAUSE REWRITE</div>
        <h1>{ru?'Переписать рискованный пункт договора':'Rewrite a risky contract clause'}</h1>
        <p>{ru?'Вставьте спорный пункт, выберите свою позицию и получите более безопасную редакцию: без грубости, с понятным объяснением и текстом для переговоров.' : 'Paste a risky clause, choose your side and receive safer wording with a clear explanation and a negotiation message.'}</p>
      </div>
      <div className="rewriteMiniCard"><b>{ru?'Что получится':'Output'}</b><span>{ru?'Новая формулировка · объяснение · сообщение контрагенту · чеклист':'Safer clause · explanation · counterparty message · checklist'}</span></div>
    </section>
    <section className="glass rewriteEditorPanel">
      <textarea rows="9" value={clause} onChange={e=>setClause(e.target.value)} placeholder={ru?'Вставьте пункт договора, который нужно сделать безопаснее':'Paste the clause you want to make safer'} />
      <div className="rewriteControls">
        <select value={role} onChange={e=>setRole(e.target.value)}><option value="balanced">{ru?'Сбалансированно':'Balanced'}</option><option value="customer">{ru?'В интересах заказчика':'Customer side'}</option><option value="provider">{ru?'В интересах исполнителя':'Provider side'}</option></select>
        <select value={tone} onChange={e=>setTone(e.target.value)}><option value="neutral">{ru?'Нейтрально':'Neutral'}</option><option value="soft">{ru?'Мягко':'Soft'}</option><option value="firm">{ru?'Уверенно':'Firm'}</option></select>
        <button className="primary" onClick={rewrite} disabled={!clause.trim()}>{ru?'Переписать пункт':'Rewrite clause'}</button>
      </div>
      {error && <div className="error strongError"><b>{ru?'Не удалось переписать пункт':'Could not rewrite the clause'}</b><p>{error}</p></div>}
    </section>
    {result && <section className="glass rewriteResultPanel">
      <div><div className="eyebrow">SAFER WORDING</div><h2>{ru?'Новая редакция':'Rewritten clause'}</h2><p>{result.rewrittenClause}</p></div>
      <div className="grid two"><article><b>{ru?'Почему так безопаснее':'Why this is safer'}</b><p>{result.explanation}</p></article><article><b>{ru?'Сообщение контрагенту':'Counterparty message'}</b><p>{result.negotiationMessage}</p></article></div>
      <div className="accountActions"><button className="primary" onClick={()=>navigator.clipboard?.writeText(result.rewrittenClause)}>{ru?'Скопировать пункт':'Copy clause'}</button><button className="secondary" onClick={()=>navigator.clipboard?.writeText(result.negotiationMessage)}>{ru?'Скопировать сообщение':'Copy message'}</button></div>
      {(result.checklist||[]).length > 0 && <ul className="rewriteChecklist">{result.checklist.map((x,i)=><li key={i}>{x}</li>)}</ul>}
      <small>{result.disclaimer}</small>
    </section>}
  </main>;
}

function OnboardingFlow({ ru, lang, go, serverSession, saveServerSession }) {
  const [state, setState] = useState({ completed:false, useCase:'', language: lang, firstRewriteDone:false });
  const [firstClause, setFirstClause] = useState(ru ? 'Исполнитель вправе расторгнуть договор без предварительного уведомления.' : 'The provider may terminate this agreement without prior notice.');
  const [firstResult, setFirstResult] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!serverSession?.user) return;
    apiJson('/api/user/onboarding', undefined, undefined, 'GET').then(d => setState(s => ({ ...s, ...(d.onboarding || {}) }))).catch(() => {});
  }, [serverSession?.user?.id]);
  async function savePatch(patch) {
    const next = { ...state, ...patch };
    setState(next);
    if (!serverSession?.user) { setMessage(ru ? 'Локально отмечено. Войдите, чтобы сохранить прогресс на сервере.' : 'Saved locally. Log in to persist progress on the server.'); return; }
    try {
      const d = await apiJson('/api/user/onboarding', patch, undefined, 'PATCH');
      setState(d.onboarding || next);
      if (d.user) saveServerSession({ ...serverSession, user: d.user });
      setMessage(ru ? 'Настройка сохранена.' : 'Setup saved.');
    } catch(e) { setMessage(friendlyError(e, ru)); }
  }
  async function runFirstRewrite() {
    setBusy(true); setMessage(''); setFirstResult(null);
    try {
      const d = await apiJson('/api/rewrite/clause', { clause: firstClause, role:'balanced', tone:'neutral', direction:'safer' }, undefined);
      setFirstResult(d.result);
      await savePatch({ firstRewriteDone:true });
    } catch(e) { setMessage(friendlyError(e, ru)); }
    finally { setBusy(false); }
  }
  const steps = [
    { key:'account', done: Boolean(serverSession?.user), title: ru?'Войти или создать аккаунт':'Log in or create account', text: ru?'Аккаунт нужен для сохранения истории, оплаты, лимитов и персональных настроек.':'Required for saved history, billing, limits and personal settings.', action: ru?'Открыть аккаунт':'Open Account', onClick:()=>go('/account') },
    { key:'usecase', done: Boolean(state.useCase), title: ru?'Выбрать сценарий':'Choose use case', text: ru?'Это поможет настроить подсказки, язык и стартовый экран под вашу задачу.':'This tunes prompts, language and the start experience for your needs.', action: ru?'Сохранить сценарий':'Save use case', onClick:()=>savePatch({ useCase: state.useCase || 'contract_review', language: lang }) },
    { key:'rewrite', done: state.firstRewriteDone, title: ru?'Сделать первую AI-правку':'Run first AI rewrite', text: ru?'Проверьте, как MavenLex переписывает рискованный пункт в безопасную формулировку.':'See how MavenLex rewrites a risky clause into safer wording.', action: ru?'Запустить правку':'Run rewrite', onClick:runFirstRewrite },
    { key:'upgrade', done: false, title: ru?'Выбрать подходящий тариф':'Choose the right plan', text: ru?'Когда будете готовы, выберите тариф под личную работу или бизнес-задачи.':'When ready, choose a plan for personal work or business needs.', action: ru?'Открыть тарифы':'Open pricing', onClick:()=>go('/pricing') }
  ];
  const completed = steps.filter(s=>s.done).length;
  return <main className="page onboardingPage">
    <PageTitle label={ru?"ПЕРСОНАЛЬНАЯ НАСТРОЙКА":"PERSONAL SETUP"} title={ru?'Быстрый запуск MavenLex':'MavenLex quick start'} text={ru?'Пошаговая настройка: аккаунт, сценарий, первая AI-правка и тариф — без лишних корпоративных шагов.':'Step-by-step setup: account, use case, first AI rewrite and plan — without unnecessary company setup.'}/>
    <section className="glass onboardingHero">
      <div><div className="eyebrow">MAVENLEX SETUP</div><h2>{ru?'Начните с юридического анализа сразу':'Start legal analysis immediately'}</h2><p>{ru?'Создайте аккаунт, выберите сценарий и получите первый AI-результат. Лишние настройки не мешают личному пользовательскому пути.':'Create an account, choose a use case and get the first AI result. Extra setup does not interrupt the personal user journey.'}</p></div>
      <div className="onboardingProgress"><b>{completed}/{steps.length - 1}</b><span>{ru?'шагов настройки выполнено':'setup steps completed'}</span></div>
    </section>
    <section className="onboardingGrid">
      <div className="glass onboardingSteps">{steps.map((s, i)=><article className={s.done?'done':''} key={s.key}><span>{s.done?'✓':i+1}</span><div><h3>{s.title}</h3><p>{s.text}</p>{s.key==='usecase' && <select value={state.useCase || ''} onChange={e=>setState({...state, useCase:e.target.value})}><option value="">{ru?'Выберите сценарий':'Choose use case'}</option><option value="contract_review">{ru?'Проверка договоров':'Contract review'}</option><option value="risk_review">{ru?'Поиск юридических рисков':'Legal risk review'}</option><option value="document_drafting">{ru?'Подготовка документов':'Document drafting'}</option><option value="clause_rewrite">{ru?'Переписывание пунктов':'Clause rewriting'}</option></select>}{s.key==='rewrite' && <textarea rows="4" value={firstClause} onChange={e=>setFirstClause(e.target.value)} />}</div><button className={s.done?'secondary':'primary'} onClick={s.onClick} disabled={busy}>{s.done ? (ru?'Готово':'Done') : s.action}</button></article>)}</div>
      <aside className="glass onboardingAside"><h2>{ru?'Статус':'Status'}</h2>{message && <p className="statusNote">{message}</p>}{!serverSession?.user && <div className="emptyState"><b>{ru?'Нужен вход':'Login required'}</b><span>{ru?'Настройку можно посмотреть без входа, но прогресс сохранится после авторизации.':'You can view setup without login, but progress is saved after authentication.'}</span></div>}{firstResult && <div className="reportBox"><h3>{ru?'Первая правка':'First rewrite'}</h3><p>{firstResult.rewrittenClause}</p><small>{firstResult.explanation}</small></div>}<button className="secondary" onClick={()=>go('/account')}>{ru?'Аккаунт и оплата':'Account and billing'}</button></aside>
    </section>
  </main>;
}


function LaunchReadinessPage({ ru, go }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { apiJson('/api/launch-readiness/v5-6').then(setData).catch(e=>setError(e.message)); }, []);
  const cards = ru ? [
    ['Браузерная проверка', 'Проверить все ключевые страницы руками: главная, старт, договор, отчёт, тарифы, кабинет, доверие и поддержка.'],
    ['Настоящая база', 'Подключить PostgreSQL через Supabase, Neon или свой сервер. Локальные данные оставить только для разработки.'],
    ['Оплата', 'Подключить живой платёжный провайдер, return URL, webhook secret и проверить успешную/неуспешную оплату.'],
    ['Премиальный сайт', 'Главная страница объясняет продукт сразу: AI-MavenLex, договоры, риски, безопасность, тарифы и доверие.'],
    ['Юридические сценарии', 'Договор, NDA, услуги, аренда, претензия, privacy policy и риск-мемо оформлены как понятные пользовательские задачи.'],
    ['Идеальный путь', 'Пользователь без лишних шагов проходит: язык → аккаунт → задача → AI-анализ → отчёт → тариф при необходимости.']
  ] : [
    ['Browser QA', 'Manually verify all key pages: home, start, contract, report, pricing, account, trust and support.'],
    ['Real database', 'Connect PostgreSQL through Supabase, Neon or your own server. Keep local storage for development only.'],
    ['Payments', 'Connect a live provider, return URL, webhook secret and test success/failure payment states.'],
    ['Premium website', 'The landing page explains the product immediately: AI counsel, contracts, risks, security, pricing and trust.'],
    ['Legal scenarios', 'Contract, NDA, services, lease, claim letter, privacy policy and risk memo are packaged as clear user tasks.'],
    ['Ideal flow', 'User reaches value without friction: language → account → task → AI analysis → report → billing when needed.']
  ];
  return <main className="page launchReadinessPage">
    <PageTitle label="EXECUTIVE QUALITY v5.7" title={ru?'MavenLex: премиальная готовность к запуску':'MavenLex executive quality readiness'} text={ru?'Усиленный центр качества: браузерная проверка, база, оплата, премиальная подача, юридические сценарии и путь пользователя без лишних шагов.':'An upgraded quality center for page QA, database, payments, premium presentation, legal scenarios and a frictionless user path.'}/>
    <section className="glass launchCommandCenter">
      <div><div className="eyebrow">STATUS</div><h2>{data?.ok ? (ru?'Блокеров не найдено':'No blockers detected') : (ru?'Нужны финальные настройки':'Final setup needed')}</h2><p>{error || data?.recommendation || (ru?'Проверка загружается...':'Loading readiness...')}</p></div>
      <div className="launchScore"><b>{data?.blockers?.length || 0}</b><span>{ru?'блокеров':'blockers'}</span></div>
    </section>
    <section className="grid three launchQualityGrid">{cards.map(([t,x])=><article className="glass qualityCard" key={t}><h2>{t}</h2><p>{x}</p></article>)}</section>
    <section className="glass launchFlowMap"><h2>{ru?'Идеальный пользовательский путь':'Ideal user path'}</h2><div>{(data?.userFlow || ['language','account','legal task','ai analysis','report','billing when needed','history/account']).map((x,i)=><span key={x}><b>{i+1}</b>{ru ? flowRu(x) : x}</span>)}</div><button className="primary" onClick={()=>go('/onboarding')}>{ru?'Пройти быстрый старт':'Open quick start'}</button><button className="secondary" onClick={()=>go('/qa')}>{ru?'Открыть QA-сценарии':'Open QA scenarios'}</button></section>
  </main>;
}
function flowRu(x) {
  return ({ language:'язык', account:'аккаунт', 'legal task':'юридическая задача', 'ai analysis':'AI-анализ', report:'отчёт', 'billing when needed':'оплата при необходимости', 'history/account':'история и кабинет' })[x] || x;
}
function BrowserQaPage({ ru, go }) {
  const [data, setData] = useState(null);
  useEffect(() => { apiJson('/api/qa/user-flow').then(setData).catch(()=>{}); }, []);
  const local = data?.scenarios || [];
  return <main className="page qaPage">
    <PageTitle label="BROWSER QA" title={ru?'Сценарии ручной проверки сайта':'Manual website QA scenarios'} text={ru?'Это понятный чеклист для финальной проверки в браузере перед показом заказчику или запуском.':'A clear checklist for final browser review before client demo or launch.'}/>
    <section className="grid two qaScenarioGrid">{local.map(sc=><article className="glass qaScenario" key={sc.id}><div className="eyebrow">{sc.id}</div><h2>{sc.title}</h2><ol>{sc.steps.map(step=><li key={step}>{ru ? qaRu(step) : step}</li>)}</ol></article>)}</section>
    <section className="glass qaFinalGate"><h2>{ru?'Финальное правило качества':'Final quality rule'}</h2><p>{ru?'Сайт считается готовым только когда пользователь может без подсказок пройти от главной страницы до первого отчёта, понять ограничения AI, увидеть тарифы и вернуться в кабинет без ошибок.':'The site is ready only when a user can move from home to first report without guidance, understand AI limits, see pricing and return to account without errors.'}</p><div><button className="primary" onClick={()=>go('/home')}>{ru?'Начать с главной':'Start from home'}</button><button className="secondary" onClick={()=>go('/analyze')}>{ru?'Проверить договор':'Review contract'}</button></div></section>
  </main>;
}
function qaRu(step) {
  return ({'Open home':'Открыть главную','Choose language':'Выбрать язык','Open Analyze':'Открыть анализ договора','Upload document':'Загрузить документ','Receive report':'Получить отчёт','Open history':'Открыть историю','Open Pricing':'Открыть тарифы','Select Pro':'Выбрать Pro','Start checkout':'Начать оплату','Return success':'Вернуться после оплаты','Open Account billing status':'Открыть статус оплаты в кабинете','Open Security':'Открыть безопасность','Open Privacy':'Открыть privacy','Open Terms':'Открыть terms','Contact support':'Связаться с поддержкой','Login/register':'Войти или зарегистрироваться','Update profile':'Обновить профиль','Export data':'Экспортировать данные','Review access state':'Проверить состояние доступа','Delete account only after confirmation':'Удалять аккаунт только после подтверждения'})[step] || step;
}

function HelpPage({ ru, go }) {
  const steps = ru ? [
    ['Как проверить договор', 'Откройте анализ, загрузите TXT/DOCX/PDF, выберите тип договора и глубину проверки.'],
    ['Если файл не читается', 'Попробуйте DOCX или текстовый PDF. Сканированные PDF без текстового слоя могут читаться хуже.'],
    ['Как понять отчёт', 'Смотрите risk score, красные флаги, чеклист и Decision Helper. High risk нужно разобрать глубже перед действием.'],
    ['Как сохранить результат', 'Откройте отчёт и используйте экспорт PDF/HTML/Word/Markdown/TXT.']
  ] : [
    ['How to review a contract', 'Open analysis, upload TXT/DOCX/PDF, choose contract type and review depth.'],
    ['If the file is not readable', 'Try DOCX or text-based PDF. Scanned PDFs without text layer may work poorly.'],
    ['How to read the report', 'Use risk score, red flags, checklist and Decision Helper. High risk should go to MavenLex.'],
    ['How to save results', 'Open the report and use PDF/HTML/Word/Markdown/TXT export.']
  ];
  return <main className="page helpPage"><PageTitle label="HELP" title={ru?'Помощь по MavenLex':'MavenLex Help'} text={ru?'Короткая инструкция по основным сценариям сервиса.':'Short guide for the main product flows.'}/><section className="grid two">{steps.map(([t,x])=><article className="glass" key={t}><h2>{t}</h2><p>{x}</p></article>)}</section><section className="glass supportCta"><h2>{ru?'Не нашли ответ?':'Still need help?'}</h2><p>{ru?'Оставьте обращение в поддержку, и владелец увидит его в админке.':'Create a support request and the owner will see it in Admin.'}</p><button className="primary" onClick={()=>go('/support')}>{ru?'Написать в поддержку':'Contact support'}</button></section></main>;
}

function SupportPage({ ru, serverSession }) {
  const [form, setForm] = useState({ category:'analysis', subject:'', message:'', email: serverSession?.user?.email || '' });
  const [state, setState] = useState({ loading:false, ok:'', error:'' });
  async function submit(e) {
    e.preventDefault();
    setState({ loading:true, ok:'', error:'' });
    try {
      const data = await apiJson('/api/support/tickets', form);
      setState({ loading:false, ok: ru ? `Обращение создано: ${data.ticket.id}` : `Ticket created: ${data.ticket.id}`, error:'' });
      setForm({ ...form, subject:'', message:'' });
    } catch (err) { setState({ loading:false, ok:'', error: friendlyError(err, ru) }); }
  }
  return <main className="page supportPage"><PageTitle label="SUPPORT" title={ru?'Поддержка MavenLex':'MavenLex Support'} text={ru?'Опишите проблему с анализом, оплатой, аккаунтом или загрузкой файла.':'Describe an issue with analysis, payment, account or upload.'}/><section className="glass formPanel"><form onSubmit={submit} className="formGrid"><Field label={ru?'Категория':'Category'}><select value={form.category} onChange={e=>setForm({...form, category:e.target.value})}><option value="analysis">{ru?'Анализ':'Analysis'}</option><option value="billing">{ru?'Оплата':'Billing'}</option><option value="account">{ru?'Аккаунт':'Account'}</option><option value="upload">{ru?'Загрузка':'Upload'}</option><option value="other">{ru?'Другое':'Other'}</option></select></Field><Field label="Email"><input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} placeholder="you@example.com" /></Field><Field label={ru?'Тема':'Subject'} wide><input value={form.subject} onChange={e=>setForm({...form, subject:e.target.value})} placeholder={ru?'Коротко о проблеме':'Short summary'} /></Field><Field label={ru?'Сообщение':'Message'} wide><textarea rows="7" value={form.message} onChange={e=>setForm({...form, message:e.target.value})} placeholder={ru?'Что произошло, на какой странице, какой файл/тариф, что ожидали увидеть?':'What happened, on which page, what file/plan, what did you expect?'} /></Field><div className="wide formActions"><button className="primary" disabled={state.loading}>{state.loading ? (ru?'Отправляю...':'Sending...') : (ru?'Отправить':'Send')}</button></div></form>{state.ok && <p className="okText">{state.ok}</p>}{state.error && <p className="errorText">{state.error}</p>}</section></main>;
}


function FavoritesPage({ ru, go }) {
  const [items, setItems] = useState(() => safeLocalArray('mavenlexFavorites'));
  function remove(id) { removeFavoriteItem(id); setItems(safeLocalArray('mavenlexFavorites')); }
  return <main className="page favoritesPage">
    <PageTitle label="FAVORITES" title={ru?'Избранное':'Favorites'} text={ru?'Сохранённые отчёты, сообщения контрагенту, статьи и полезные формулировки.':'Saved reports, counterparty messages, articles and useful wording.'}/>
    <section className="glass favoriteIntro v611"><div><h2>{ru?'Быстрый доступ к полезному':'Fast access to useful items'}</h2><p>{ru?'Добавляйте сюда отчёты и готовые сообщения из юридического разбора.':'Add reports and ready messages from legal reviews here.'}</p></div><button className="primary" onClick={()=>go('/analyze')}>{ru?'Проверить договор':'Review contract'}</button></section>
    {items.length ? <section className="favoriteGrid v611">{items.map(item => <article className="glass favoriteCard" key={item.id}><span>{item.type}</span><h2>{item.title}</h2><p>{item.text}</p><small>{item.createdAt ? new Date(item.createdAt).toLocaleString(ru?'ru-RU':'en-US') : ''}</small><div><button className="secondary" onClick={()=>navigator.clipboard?.writeText(item.text || item.title || '')}>{ru?'Копировать':'Copy'}</button><button className="secondary dangerMini" onClick={()=>remove(item.id)}>{ru?'Удалить':'Delete'}</button></div></article>)}</section> : <section className="glass emptyFavorites v611"><b>{ru?'Пока пусто':'No favorites yet'}</b><p>{ru?'Откройте отчёт и сохраните важное сообщение или весь отчёт в избранное.':'Open a report and save an important message or the full report to favorites.'}</p></section>}
  </main>;
}

function Settings({ ru, lang, setLang, theme, setTheme, jurisdiction, setJurisdiction }) { return <main className="page"><PageTitle label="SETTINGS" title={ru?'Настройки':'Settings'} text={ru?'Личные настройки пользователя: язык, тема и юрисдикция.':'Personal user settings: language, theme and jurisdiction.'}/><section className="glass formPanel"><div className="formGrid"><Field label={ru?'Язык':'Language'}><select value={lang} onChange={e=>setLang(e.target.value)}><option value="ru">Русский</option><option value="en">English</option></select></Field><Field label={ru?'Моя тема интерфейса':'My interface theme'}><select value={theme || 'ivory'} onChange={e=>setTheme(e.target.value)}><option value="ivory">{ru?'Светлая':'Light'}</option><option value="navy">{ru?'Тёмно-синяя':'Navy'}</option></select></Field><Field label={ru?'Юрисдикция по умолчанию':'Default jurisdiction'}><select value={jurisdiction} onChange={e=>setJurisdiction(e.target.value)}>{JURISDICTION_OPTIONS.map(option => <option key={option.value} value={option.value}>{jurisdictionLabel(option.value, lang)}</option>)}</select></Field></div><p className="hint">{ru?'Светлая или тёмно-синяя тема — личный выбор каждого пользователя. Админка меняет бренд-цвета сайта, но не переключает тему за всех людей.':'Light or navy theme is each user’s personal choice. The admin panel changes brand colors, but does not switch the theme for all users.'}</p></section></main>; }
function PageTitle({ label, title, text }) { return <section className="pageTitle"><div className="eyebrow">{label}</div><h1>{title}</h1><p>{text}</p></section>; }
function Field({ label, children, wide }) { return <label className={wide?'field wide':'field'}><span>{label}</span>{children}</label>; }

createRoot(document.getElementById('root')).render(<App />);
