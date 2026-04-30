import type {
  AnalyticsRecord,
  AnalyticsStatus,
  CaseItem,
  Employee,
  EmployeeRole,
  Question,
  Section,
  Training,
} from "./types";
import {
  emptyClientCard,
  emptyOnboarding,
  emptyTheory,
  uid,
} from "./factory";

function gradient(seed: string) {
  // deterministic muted corporate gradient as data URL svg
  const h1 = (hash(seed) % 360);
  const h2 = (h1 + 30) % 360;
  const svg = `<?xml version='1.0' encoding='UTF-8'?>
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0%' stop-color='hsl(${h1},35%,65%)'/>
        <stop offset='100%' stop-color='hsl(${h2},45%,40%)'/>
      </linearGradient>
      <radialGradient id='r' cx='25%' cy='30%' r='65%'>
        <stop offset='0%' stop-color='rgba(255,255,255,0.35)'/>
        <stop offset='100%' stop-color='rgba(255,255,255,0)'/>
      </radialGradient>
    </defs>
    <rect width='1600' height='900' fill='url(#g)'/>
    <rect width='1600' height='900' fill='url(#r)'/>
    <g fill='rgba(255,255,255,0.08)'>
      <circle cx='1300' cy='200' r='140'/>
      <circle cx='1450' cy='620' r='90'/>
      <rect x='80' y='720' width='340' height='12' rx='6'/>
      <rect x='80' y='760' width='220' height='12' rx='6'/>
    </g>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function makeQuestion(name: string, text: string, criteriaText: string[]): Question {
  return {
    id: uid("qs-"),
    name,
    text,
    aBookCategory: "Карточные продукты",
    aBookQueries: ["Условия по кредитной карте", "Беспроцентный период"],
    criteria: criteriaText.map((t, i) => ({
      id: uid("cr-"),
      text: t,
      score: [40, 30, 30][i] ?? 30,
    })),
    hints: [],
  };
}

function makeCase(name: string, desc: string, questions: Question[]): CaseItem {
  const cc = emptyClientCard();
  cc.creditCardDetails[0]!.value = "15 000 ₽ — 25 числа";
  cc.creditCardDetails[2]!.value = "187 400 ₽";
  cc.creditCardDetails[6]!.value = "62 600 ₽";
  cc.contractTerms[0]!.value = "250 000 ₽";
  cc.contractTerms[1]!.value = "Подписано 12.04.2024";
  cc.rates[0]!.value = "0% (грейс)";
  cc.rates[1]!.value = "29,9%";
  cc.cardInfo[0]!.value = "187 400 ₽";
  cc.cardInfo[1]!.value = "590 ₽ / год";
  return {
    id: uid("cs-"),
    name,
    description: desc,
    clientCard: cc,
    silenceSeconds: 30,
    silenceAction: "Дать подсказку",
    questions,
  };
}

function makeSection(name: string, cases: CaseItem[]): Section {
  return { id: uid("sc-"), name, cases };
}

const NOW = Date.now();
const DAY = 86_400_000;

function makeTraining(opts: Partial<Training> & Pick<Training, "name" | "type" | "status">): Training {
  const id = uid("tr-");
  const ob = emptyOnboarding();
  ob.items[0] = {
    id: uid("oi-"),
    title: "Добро пожаловать в обучение",
    text: "За 30 минут разберём, как уверенно консультировать клиентов по кредитной карте и работать с возражениями.",
  };
  const th1 = emptyTheory();
  th1.title = "Условия по кредитной карте";
  th1.text = "Грейс-период, ставки, лимиты — что важно проговорить клиенту в первые секунды разговора.";
  th1.aBookCategory = "Карточные продукты";
  th1.aBookQueries = ["Беспроцентный период", "Лимит снятия наличных"];
  th1.approved = true;
  th1.result = "Беспроцентный период действует 100 дней на покупки. Снятие наличных без комиссии — до 50 000 ₽ в месяц в банкоматах Альфа-Банка.";
  return {
    id,
    name: opts.name,
    type: opts.type,
    status: opts.status,
    category: opts.category ?? "Hard skills",
    topic: opts.topic ?? "Карточные продукты",
    factory: opts.factory ?? "Сервис",
    direction: opts.direction ?? "Обслуживание ФЛ",
    duration: opts.duration ?? "30 мин",
    description:
      opts.description ??
      "Обучение помогает консультанту уверенно работать с клиентом по кредитной карте: от условий до возражений.",
    cover: opts.cover ?? gradient(opts.name),
    visibility: opts.visibility ?? "Приватное",
    author: opts.author ?? "Анна Петрова",
    readiness: opts.readiness ?? 0,
    createdAt: opts.createdAt ?? NOW - 10 * DAY,
    updatedAt: opts.updatedAt ?? NOW - DAY,
    publishedAt: opts.publishedAt ?? null,
    structure: opts.structure ?? {
      onboarding: ob,
      theories: opts.type === "Тренажёр" ? [th1] : [],
      practice: {
        sections: [
          makeSection("Раздел 1. Базовая консультация", [
            makeCase(
              "Кейс 1. Запрос на повышение лимита",
              "Клиент звонит и просит увеличить кредитный лимит. Оцените риски и предложите решение.",
              [
                makeQuestion(
                  "Вопрос 1",
                  "Какие данные нужно проверить, прежде чем согласовать повышение лимита?",
                  ["Точность фактов", "Структура ответа", "Эмпатия"],
                ),
                makeQuestion(
                  "Вопрос 2",
                  "Сформулируйте ответ клиенту с обоснованием решения.",
                  ["Корректность аргументации", "Тон коммуникации", ""],
                ),
              ],
            ),
          ]),
          makeSection("Раздел 2. Возражения", [
            makeCase(
              "Кейс 1. Высокая ставка",
              "Клиент жалуется на высокую процентную ставку и хочет закрыть карту. Удержите клиента.",
              [
                makeQuestion(
                  "Вопрос 1",
                  "Как объяснить клиенту структуру ставки и беспроцентный период?",
                  ["Точность", "Понятность", "Доброжелательность"],
                ),
              ],
            ),
          ]),
        ],
      },
      finish: {
        title: "Готово, обучение завершено",
        text: "Спасибо за внимание. Используйте полученные знания в реальных диалогах с клиентами.",
      },
    },
  };
}

export function makeSeedTrainings(): Training[] {
  return [
    makeTraining({
      name: "Кредитные карты: базовый тренажёр",
      type: "Тренажёр",
      status: "Опубликовано",
      readiness: 100,
      publishedAt: NOW - 5 * DAY,
      author: "Анна Петрова",
      duration: "30 мин",
      topic: "Карточные продукты",
      factory: "Сервис",
      direction: "Обслуживание ФЛ",
    }),
    makeTraining({
      name: "Работа с возражениями по кредитам",
      type: "Тренажёр",
      status: "Опубликовано",
      readiness: 100,
      publishedAt: NOW - 14 * DAY,
      author: "Игорь Соколов",
      duration: "1 час",
      topic: "Работа с возражениями",
      factory: "Телемаркетинг",
      direction: "Кросс-продажи",
    }),
    makeTraining({
      name: "Soft collection: первый контакт",
      type: "Тренажёр",
      status: "Есть изменения",
      readiness: 78,
      publishedAt: NOW - 30 * DAY,
      author: "Мария Орлова",
      duration: "30 мин",
      topic: "Кредитование",
      factory: "Урегулирование",
      direction: "Soft collection",
    }),
    makeTraining({
      name: "Экзамен: продукты для ФЛ",
      type: "Экзамен",
      status: "Опубликовано",
      readiness: 100,
      publishedAt: NOW - 8 * DAY,
      author: "Дмитрий Нечаев",
      duration: "1.5 часа",
      topic: "Продукты банка",
      factory: "Сервис",
      direction: "Обслуживание ФЛ",
    }),
    makeTraining({
      name: "Кросс-продажи в исходящих звонках",
      type: "Тренажёр",
      status: "Черновик",
      readiness: 35,
      author: "Анна Петрова",
      duration: "1 час",
      topic: "Продажи",
      factory: "Телемаркетинг",
      direction: "Кросс-продажи",
    }),
    makeTraining({
      name: "Премиум сервис: тон и эмпатия",
      type: "Тренажёр",
      status: "Черновик",
      readiness: 12,
      author: "Игорь Соколов",
      duration: "30 мин",
      topic: "Коммуникации с клиентами",
      factory: "Сервис",
      direction: "Премиум сервис",
    }),
    makeTraining({
      name: "Комплаенс: проверка клиента",
      type: "Экзамен",
      status: "Есть ошибки",
      readiness: 64,
      author: "Мария Орлова",
      duration: "1 час",
      topic: "Комплаенс",
      factory: "Сервис",
      direction: "Обслуживание ЮЛ",
    }),
  ];
}

const FIRST_NAMES = [
  "Анна",
  "Игорь",
  "Мария",
  "Дмитрий",
  "Светлана",
  "Алексей",
  "Ольга",
  "Никита",
  "Юлия",
  "Сергей",
  "Екатерина",
  "Павел",
  "Татьяна",
  "Михаил",
  "Виктория",
  "Андрей",
  "Наталья",
  "Роман",
];
const LAST_NAMES = [
  "Петрова",
  "Соколов",
  "Орлова",
  "Нечаев",
  "Иванова",
  "Кузнецов",
  "Смирнова",
  "Васильев",
  "Попова",
  "Зайцев",
  "Морозова",
  "Новиков",
  "Волкова",
  "Лебедев",
  "Соловьёва",
  "Козлов",
  "Беляева",
  "Тихонов",
];

const ROLES: EmployeeRole[] = ["Администратор", "Редактор", "Просмотр"];

export function makeSeedEmployees(): Employee[] {
  const list: Employee[] = [];
  list.push({
    id: "system-owner",
    name: "Алексей Никитин",
    tabel: "00000001",
    role: "Администратор",
    status: "Активен",
    protected: true,
  });
  for (let i = 0; i < 22; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length]!;
    const ln = LAST_NAMES[i % LAST_NAMES.length]!;
    list.push({
      id: `emp-${i}`,
      name: `${fn} ${ln}`,
      tabel: String(100200 + i).padStart(8, "0"),
      role: ROLES[i % 3]!,
      status: i === 17 ? "Заблокирован" : "Активен",
    });
  }
  return list;
}

const ANALYTICS_STATUSES: AnalyticsStatus[] = ["Назначено", "В процессе", "Завершено"];

export function makeSeedAnalytics(trainings: Training[], employees: Employee[]): AnalyticsRecord[] {
  const list: AnalyticsRecord[] = [];
  const learners = employees.filter((e) => !e.protected);
  let i = 0;
  for (const tr of trainings) {
    for (const emp of learners) {
      i++;
      const status = ANALYTICS_STATUSES[i % 3]!;
      const completed = status === "Завершено";
      list.push({
        id: uid("an-"),
        employeeId: emp.id,
        trainingId: tr.id,
        status,
        score: completed ? 50 + ((i * 7) % 50) : status === "В процессе" ? null : null,
        attempts: completed ? 1 + (i % 3) : status === "В процессе" ? 1 : 0,
        timeMinutes: completed ? 18 + (i % 25) : status === "В процессе" ? 8 + (i % 15) : 0,
        lastActivity: NOW - (i % 30) * DAY - (i % 12) * 3600_000,
      });
    }
  }
  return list;
}
