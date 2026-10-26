# WebMCP для HackerNoon: анализ оригинальности и две версии статьи

Дата подготовки: 6 октября 2026 года

## Publish-ready metadata

### Recommended English title

WebMCP Gives Your Web App a Second Operator. Who Owns the State?

### English subtitle

A $1,200 payment race shows why agent-ready frontends need revisions, idempotency, reconciliation, and honest rollback semantics.

### English preview description

What happens when a WebMCP agent pays $1,200 while the user corrects the invoice to $120? The hard part is no longer tool discovery. It is shared state.

### English TL;DR

WebMCP tools run inside a live page while the person can still edit it. Treat every state-changing tool as a concurrent operation: freeze intent, version state, make retries idempotent, distinguish cancellation from reversal, and reconcile unknown outcomes.

### Recommended Russian title

WebMCP добавляет вашему сайту второго оператора. Кто владеет состоянием?

### Russian subtitle

Гонка между платежом на $1,200 и исправлением суммы до $120 показывает, зачем agent-ready frontend нужны версии, идемпотентность и reconciliation.

### Russian preview description

Что произойдет, если WebMCP-агент оплатит $1,200, пока пользователь исправляет счет до $120? Главная проблема уже не в поиске инструмента, а в общем состоянии.

### Russian TL;DR

WebMCP-инструмент работает внутри живой страницы, которую человек продолжает редактировать. Любое действие с побочным эффектом нужно проектировать как конкурентную операцию: фиксировать намерение, проверять версию, делать повторы идемпотентными, не путать отмену с возвратом и сверяться с сервером после неопределенного результата.

### Suggested slug

`webmcp-gives-your-web-app-a-second-operator`

### HackerNoon tags

```text
webmcp
ai-agents
frontend-development
fintech
distributed-systems
web-development
software-architecture
user-experience
```

### Cover concept

Платежная страница с двумя операторами. Слева человеческий курсор исправляет сумму с $1,200 на $120. Справа абстрактный AI-agent уже отправил старую сумму. В центре видны revision 41 и revision 42, а ниже - processor truth: payment succeeded for $1,200. Важно показать конфликт между намерением и уже совершенным денежным эффектом, без роботов и банковских клише.

### Cover generation prompt

```text
Editorial technology illustration for a HackerNoon article, 16:9 landscape. A modern invoice payment interface is controlled by a human and an AI agent at the same time. On the left, a human cursor corrects an amount from $1,200 to $120. On the right, an abstract geometric AI signal has already submitted the older $1,200 payment. In the center, shared application state splits into revision 41 and revision 42, while a payment processor status indicates that the older amount succeeded. Dark background, HackerNoon-inspired green accents, clean high-contrast UI, sophisticated engineering aesthetic, no humanoid robot, no credit card photo, no logos, no readable body text, leave safe space for a headline.
```

### Cover alt text

A human corrects an invoice to $120 while an AI agent completes the earlier $1,200 payment, creating a conflict between page state and processor truth.

### Demo placement in the article

Вставить запись после раздела о четырех гонках и до timeline. К этому моменту читатель уже понимает цену ошибки, но еще не видел архитектурное решение.

Подпись:

> A user corrects an invoice from $1,200 to $120 while the agent's WebMCP call is still running. The unsafe implementation leaves the corrected draft beside a completed $1,200 payment. The coordinated implementation preserves both facts and requires an explicit resolution.

CTA:

> [Try the interactive WebMCP payment-race demo](https://shmakovdima.github.io/webmcp-browser-benchmark/): change the amount while `payInvoice` is running, then compare an uncoordinated result with revision-aware reconciliation.

Demo URL уже установлен: https://shmakovdima.github.io/webmcp-browser-benchmark/

## 1. Что уже сказано в пяти статьях

### Introducing "Token Proof of Work"

[Статья](https://hackernoon.com/introducing-token-proof-of-work) предлагает экономическую защиту форм, комментариев и заявок от массового агентского спама. Центральная идея - одноразовая задача, которая требует вычислительного бюджета и делает злоупотребление дороже.

### Product-Led Growth Is Changing for the Age of AI Agents

[Статья](https://hackernoon.com/product-led-growth-is-changing-for-the-age-of-ai-agents) рассматривает агента как нового участника product-led growth: от обнаружения продукта до регистрации, онбординга, активации и передачи результата человеку.

### What If AI Agents Didn't Have to Click Through Your Website?

[Статья](https://hackernoon.com/what-if-ai-agents-didnt-have-to-click-through-your-website) противопоставляет хрупкую навигацию по UI явным контрактам действий. Она также затрагивает тестирование, наблюдаемость, версионирование, безопасность и browser automation как запасной путь.

### WebMCP Could Make AI Agents Much Better at Using the Web

[Статья](https://hackernoon.com/webmcp-could-make-ai-agents-much-better-at-using-the-web) дает практическое введение в WebMCP, показывает imperative и declarative API, сравнивает WebMCP с MCP и обсуждает подтверждения, динамическую регистрацию и телеметрию.

### What Exactly Is WebMCP?

[Статья](https://hackernoon.com/what-exactly-is-webmcp) уже выполняет роль подробного технического объяснения: API, аннотации, отличие от MCP, состояние браузерной поддержки и опыт реализации.

Эти материалы используются только как collision set. Новая статья не строит на них свой сюжет и не пересказывает их выводы.

## 2. Центральный тезис новой статьи

WebMCP добавляет в живую страницу второго автора изменений, поэтому frontend должен координировать действия человека и агента как конкурентные транзакции, особенно когда старое намерение может успеть превратиться в реальный денежный эффект.

## 3. Чем тезис отличается от опубликованных материалов

Пять статей в основном отвечают на вопрос, как агент находит и вызывает действие. Новая статья начинает там, где вызов уже произошел: человек продолжил работать, состояние страницы изменилось, а старое действие агента дошло до точки commit.

Основные новые вопросы:

- Что хранить отдельно: текущий draft, зафиксированное намерение и server truth?
- Почему `AbortSignal` не равен отмене платежа?
- Чем idempotency key отличается от проверки версии?
- Когда блокировать UI, когда использовать optimistic concurrency, а когда делить действие на prepare и commit?
- Как тестировать порядок событий без LLM?
- Что должен показать интерфейс, если локальный вызов остановлен, но итог платежа еще неизвестен?

Это не еще один текст про WebMCP вместо кликов. Это разбор control plane внутри одной вкладки.

## 4. Что сохранить, переработать и убрать

### Сохранить

- Связь WebMCP с живой страницей, текущей сессией и UI-состоянием.
- Актуальный imperative API через `document.modelContext`.
- `AbortSignal`, `consequentialHint`, подтверждение и серверную валидацию.
- Главный мотив доклада: структурированный вызов экономит токены, время и вычисления по сравнению с визуальной навигацией.

### Переработать

- Booking flow заменить на синтетический invoice payment: $1,200 исправляется до $120 во время вызова `payInvoice`.
- Экономию ресурсов оставить причиной перехода к tools, но не центральным тезисом статьи.
- Human-in-the-loop раскрыть как контроль над замороженным намерением, а не как модальное окно в конце.
- Отмену объяснить через три исхода: точно не выполнено, выполнено, результат неизвестен.

### Убрать

- Подробный tutorial по declarative и imperative API.
- Сравнение WebMCP, MCP и Playwright на несколько разделов.
- Product-led growth, агентский онбординг и Token Proof of Work.
- Утверждения о production-результатах, которых нет.
- Официальный booking demo как основную опору статьи.

## 5. Достаточно ли материала

Да. Текст является архитектурным разбором, а не рассказом о production-внедрении. Платежный сценарий явно помечен как синтетический. Технические свойства WebMCP подтверждаются документацией Chrome, а idempotency и жизненный цикл платежа - официальной документацией Stripe как конкретным примером платежного API.

---

# A. Редакторская оценка оригинальности

Угол заметно отличается от пяти исходных публикаций. Неизбежное пересечение осталось в коротком объяснении WebMCP, регистрации инструментов и необходимости контроля значимых действий. Это контекст, без которого новый читатель не поймет проблему.

Самостоятельный вклад статьи:

- WebMCP рассматривается как переход от single-author UI к shared-control system;
- draft, captured intent и processor truth разделены;
- idempotency и optimistic concurrency разведены как разные гарантии;
- остановка клиента отделена от отмены и возврата денег;
- предложены три модели координации и deterministic interleaving tests;
- конфликт показан на денежном эффекте, а не на безобидной навигации или выборе слота.

Оставшийся риск пересечения низкий: тезис "tools надежнее кликов" упоминается только как вход в тему и не несет аргумент статьи.

# B. Варианты заголовка

## На русском

1. WebMCP добавляет вашему сайту второго оператора. Кто владеет состоянием?
2. Агент оплатил $1,200, пока пользователь исправлял сумму до $120
3. WebMCP превращает frontend в систему конкурентных транзакций

## In English

1. WebMCP Gives Your Web App a Second Operator. Who Owns the State?
2. The Agent Paid $1,200 While the User Changed the Amount to $120
3. WebMCP Turns Frontend State Into a Concurrency Problem

---

# C. Финальная статья на русском

# WebMCP добавляет вашему сайту второго оператора. Кто владеет состоянием?

Пользователь просит браузерного агента оплатить счет на $1,200. Агент вызывает платежный инструмент. Пока запрос выполняется, пользователь замечает лишний ноль и исправляет сумму на $120.

Слишком поздно. Процессор уже подтвердил платеж на $1,200.

На экране теперь $120. В реальности ушло $1,200. Оба значения по-своему честные: первое описывает текущее намерение человека, второе - уже совершенный денежный эффект.

Какое из них должен показать интерфейс?

Этот вопрос важнее того, насколько хорошо агент умеет находить кнопку Pay. WebMCP как раз убирает значительную часть визуальной возни: вместо скриншотов, распознавания элементов, кликов и повторных проверок агент получает компактный структурированный контракт. Это экономит токены, время и вычисления. Но быстрый и точный вызов функции создает другую проблему. Теперь у одной страницы два оператора.

## WebMCP за 40 секунд

[WebMCP](https://developer.chrome.com/docs/ai/webmcp/imperative-api) - экспериментальный browser API, через который открытая страница публикует инструменты для AI-агента. Инструмент имеет имя, описание, JSON Schema аргументов и JavaScript-функцию выполнения.

Платежная страница, например, может зарегистрировать `payInvoice`:

```js
await document.modelContext.registerTool({
  name: 'payInvoice',
  description: 'Pay a reviewed invoice for an exact amount.',
  inputSchema: {
    type: 'object',
    properties: {
      invoiceId: { type: 'string' },
      amountCents: { type: 'integer', minimum: 1 },
      currency: { type: 'string', enum: ['USD'] },
    },
    required: ['invoiceId', 'amountCents', 'currency'],
  },
  annotations: {
    consequentialHint: true,
  },
  execute: payInvoice,
});
```

Совместимый агент может вызвать этот tool напрямую. Ему не нужно угадывать, где кнопка и что изменилось после очередного рендера. Инструмент при этом выполняется внутри живой страницы: видит текущую сессию, обращается к приложению и обновляет тот же UI, который открыт у человека.

`consequentialHint` сообщает клиенту, что действие имеет серьезные последствия, но не является механизмом безопасности. [Документация Chrome](https://developer.chrome.com/docs/ai/webmcp/secure-tools) прямо называет аннотации подсказками. Авторизация, подтверждение, валидация суммы и защита от повторов остаются обязанностью приложения и backend.

WebMCP пока не является повсеместно доступным веб-стандартом. Но архитектурный сдвиг уже понятен: человек может продолжать редактировать страницу, пока агент выполняет tool call.

## У формы больше нет одного автора

Большинство frontend-сценариев молча предполагает одного автора намерения. Пользователь меняет сумму, нажимает Pay, получает ответ. Внутри могут работать promises, кэш и optimistic updates, но смысловая последовательность одна.

WebMCP разрывает ее. Агент начинает действие, а человек тем временем меняет то же поле, уходит со страницы, выходит из аккаунта или вручную запускает ту же операцию.

Обычный frontend становится concurrent system. Причем второй автор находится не в другом браузере и не в отдельной headless-сессии. Он работает в той же вкладке, под той же сессией и с теми же бизнес-сущностями.

Назвать это обычной race condition технически верно, но недостаточно. Теперь конфликтуют не два callback. Конфликтуют два намерения.

## Первые четыре гонки

### 1. Устаревшее намерение

Агент прочитал $1,200 и начал платеж. Пользователь исправил сумму до $120 до завершения вызова. Результат агента корректен для revision 41 и неверен для текущего revision 42.

Если поздний результат безусловно записать в store, интерфейс откатится назад. Если его просто проигнорировать, страница скроет уже совершенный платеж.

### 2. Поздний ответ создает ложную картину

UI показывает исправленный draft на $120. Через секунду приходит success для старого платежа на $1,200. Компонент может отрисовать зеленое "Paid" рядом с текущей суммой, хотя processor truth относится к другой версии.

Проблема здесь не в том, что один ответ медленнее другого. Проблема в потере связи между ответом и намерением, которое его породило.

### 3. Один эффект выполняется дважды

Человек нажимает Pay, пока агент вызывает `payInvoice`. Оба запроса валидны. Блокировка кнопки после клика не спасает: агент не обязан использовать кнопку.

Backend должен понимать, что два запроса относятся к одной операции. Для этого нужен стабильный operation ID или idempotency key. Например, Stripe возвращает сохраненный результат при повторном запросе с тем же idempotency key, вместо создания нового эффекта. Это защита от дубля, а не от устаревшей суммы.

### 4. Stop приходит после commit

Пользователь останавливает агента. `AbortSignal` прерывает ожидание в JavaScript или отменяет `fetch`, но процессор уже принял платеж. Локально операция выглядит остановленной, на сервере она завершена.

Отмена ожидания не возвращает деньги. После успешного платежа обратное действие обычно является отдельной операцией refund с собственным статусом и рисками.

Все четыре гонки сводятся к одной недостающей информации: к какой версии человеческого намерения относится этот эффект?

## Посмотрите, как ломается правда

![A user corrects an invoice to $120 while a WebMCP tool completes the earlier $1,200 payment](webmcp-shared-state-demo/assets/webmcp-shared-state-demo.gif)

Синтетическое демо не отправляет деньги и не подключается к платежному провайдеру. Оно показывает ровно один interleaving: `payInvoice` фиксирует $1,200, человек меняет draft на $120, затем fake processor завершает старый платеж.

> [Открыть интерактивное WebMCP-демо](https://shmakovdima.github.io/webmcp-browser-benchmark/): измените сумму во время выполнения `payInvoice` и сравните отсутствие координации с revision-aware reconciliation.

Timeline короткий:

```text
T0  Agent reads: $1,200, revision 41
T1  Agent starts payInvoice($1,200)
T2  Human corrects the draft: $120, revision 42
T3  Processor commits: $1,200 succeeded
T4  Result reaches a page that now shows $120
```

В T4 нельзя выбрать между "показать последнее" и "показать сервер". Нужно сохранить оба факта: текущий draft равен $120, а платеж на $1,200 уже состоялся.

## Снимок намерения нужен до первого await

Tool не должен несколько раз читать mutable UI-state по ходу выполнения. Сумма может прийти из одной версии store, invoice ID - из другой, а выбранный счет уже успеет смениться.

Перед первым `await` зафиксируйте immutable intent:

```js
const intent = {
  operationId: crypto.randomUUID(),
  pageRevision: paymentStore.revision,
  serverRevision: paymentStore.serverRevision,
  invoiceId: paymentStore.invoiceId,
  amountCents: paymentStore.amountCents,
  currency: paymentStore.currency,
};
```

Снимок не заменяет серверную авторизацию и валидацию. Он отвечает на более узкий вопрос: какое состояние страницы породило этот запрос?

Полный WebMCP callback может выглядеть так:

```js
async function payInvoice(input, { signal }) {
  const intent = paymentStore.captureIntent(input);
  paymentStore.markPending(intent);

  try {
    const result = await paymentApi.pay({
      invoiceId: intent.invoiceId,
      amountCents: intent.amountCents,
      currency: intent.currency,
      operationId: intent.operationId,
      expectedRevision: intent.serverRevision,
    }, { signal });

    paymentStore.reconcile(intent, result);
    return result;
  } catch (error) {
    paymentStore.reconcileFailure(intent, error);
    throw error;
  }
}
```

Когда ответ вернется, `reconcile` сравнит captured revision с текущей. Если пользователь уже изменил сумму, callback не затрет новый draft. Он добавит server effect отдельно и откроет конфликт.

## Idempotency key и revision решают разные задачи

Их часто смешивают, потому что оба значения путешествуют рядом с запросом.

`operationId` отвечает на вопрос: "Мы уже выполняли это намерение?" Повтор после timeout должен вернуть прежний результат, а не списать деньги второй раз. [Stripe рекомендует idempotency keys](https://docs.stripe.com/api/idempotent_requests) именно для безопасных повторов.

`expectedRevision` отвечает на другой вопрос: "Это намерение все еще основано на актуальных данных?" Запрос с новым operation ID может быть совершенно уникальным и при этом устаревшим.

Нужны обе гарантии:

```text
same operationId + retry       -> return the existing payment
new operationId + old revision -> reject or surface a conflict
```

Idempotency без revision надежно повторит ошибочную сумму. Revision без idempotency позволит создать правильный платеж дважды.

## Три модели координации

Для платежей merge почти никогда не имеет смысла. $1,200 и $120 нельзя усреднить или склеить. Остаются три практичных модели.

### Короткий lock

После подтверждения суммы приложение временно блокирует ее редактирование и показывает, кто выполняет платеж. Модель проста и подходит для короткого commit. Если провайдер отвечает долго, страница начинает ощущаться захваченной агентом.

### Optimistic concurrency

Человек продолжает редактировать draft. Каждый state-changing вызов передает expected revision. Сервер или клиентский coordinator отклоняет stale write и показывает конфликт.

Это хороший default для редактируемых сущностей. Но optimistic concurrency не откатывает эффект, если внешняя система уже успела его выполнить. Тогда остается reconciliation.

### Prepare и commit

Агент сначала вызывает `preparePayment`. Сервер возвращает proposal с зафиксированными invoice ID, получателем, суммой, валютой и сроком действия. UI показывает человеку именно этот proposal. Затем отдельный `confirmPayment(proposalId)` создает денежный эффект.

Такой дизайн отделяет помощь от полномочия. Агент может искать счет, нормализовать данные и готовить платеж, не получая права незаметно изменить сумму в момент commit.

Для high-stakes action это обычно честнее одного огромного `payInvoice`.

## Confirmation dialog не исправляет stale intent

Модалка "Confirm payment?" бесполезна, если отображает текущий draft, а backend собирается выполнить captured intent.

Подтверждение должно показывать замороженную версию:

- invoice и получателя;
- точную сумму и валюту;
- источник платежа в безопасном маскированном виде;
- кто инициировал действие;
- срок действия proposal;
- что произойдет после нажатия Confirm.

И еще одна неприятная деталь: `consequentialHint: true` не гарантирует, что конкретный клиент покажет модалку именно так, как задумал продукт. Поэтому критический контроль должен жить в собственном UI и на серверной границе.

## Abort, cancel и refund - не синонимы

У платежного вызова есть как минимум три исхода:

1. Сервер точно не начал операцию.
2. Платеж завершен и результат известен.
3. Клиент перестал ждать и не знает, что произошло.

Третий исход нельзя маркировать как `failed`. Если сеть оборвалась после commit, слепой retry может создать новый эффект без корректной idempotency. Локальный rollback просто скроет проблему.

Покажите статус `unknown`, затем запросите processor truth по operation ID. Если платеж имеет статус `succeeded`, возвращать его назад нужно отдельным refund. В [жизненном цикле Stripe PaymentIntent](https://docs.stripe.com/payments/paymentintents/lifecycle) `succeeded` означает завершенный payment flow; после этого возврат оформляется отдельно. Это пример конкретного API, а не универсальная спецификация всех провайдеров.

Undo в интерфейсе может запускать refund. Оно не должно притворяться перемоткой времени.

## Тестируйте порядок событий без LLM

Для shared-state correctness модель не нужна. Управляйте promises и проверяйте разные interleavings:

```js
it('keeps the corrected draft after an older payment succeeds', async () => {
  const payment = tool.payInvoice({
    invoiceId: 'inv-2048',
    amountCents: 120000,
    currency: 'USD',
  });

  ui.changeAmount(12000);
  processor.resolve({ paymentId: 'pay-7', status: 'succeeded' });

  await payment;

  expect(ui.draft.amountCents).toBe(12000);
  expect(ui.serverPayment.amountCents).toBe(120000);
  expect(ui.conflict.type).toBe('revision-conflict');
});
```

Добавьте abort до commit, abort после commit, повтор одного operation ID, новый operation ID со старой revision, logout во время вызова и навигацию на другой invoice. LLM evals понадобятся для выбора инструмента и реакции агента на конфликт. Целостность состояния сначала должна пройти обычные deterministic tests.

## Метрики, которые покажут реальную цену агента

Количество tool calls почти ничего не говорит о качестве совместной работы. Полезнее считать:

- конфликты с более новым действием человека;
- поздние ответы, которые не применили к draft;
- повторы, поглощенные idempotency key;
- время в статусе `unknown`;
- платежи, после которых пользователь сразу запросил refund;
- случаи, где понадобилась полная сверка UI с processor state.

Эти числа не образуют универсальный benchmark. Они показывают, помогает агент человеку или просто быстрее создает дорогие расхождения.

## Production checklist

Перед публикацией state-changing WebMCP tool проверьте:

- intent фиксируется до первого `await`;
- operation имеет стабильный ID, а mutable entity - revision;
- сервер повторно проверяет авторизацию, сумму, валюту и состояние invoice;
- поздний результат не затирает более новый human draft;
- UI отдельно показывает draft, pending operation и server truth;
- Stop не обещает rollback уже совершенного эффекта;
- для `unknown` есть status lookup и reconciliation;
- повтор безопасен, но новое устаревшее намерение отклоняется;
- high-stakes flow при необходимости разделен на prepare и commit;
- тесты перебирают порядок действий человека, агента и сервера.

Если на один из пунктов нет ответа, tool пока не готов управлять деньгами.

## Вкладка стала shared workspace

WebMCP дает агенту более короткий путь к действию. Меньше скриншотов, меньше кликов, меньше токенов и потерянного времени. Это весомая причина публиковать структурированные tools.

Но efficiency не равна correctness.

Как только агент может менять данные внутри живой страницы, frontend получает второго автора. В платежном сценарии старое намерение не исчезает после нового рендера. Оно может уже находиться у процессора.

Поэтому state-changing WebMCP tool нужно проектировать не как удаленный клик, а как конкурентную транзакцию. И когда экран показывает $120 после платежа на $1,200, интерфейс обязан сохранить обе правды, пока человек явно не решит, что делать дальше.

---

# D. Final article in English

# WebMCP Gives Your Web App a Second Operator. Who Owns the State?

A user asks a browser agent to pay a $1,200 invoice. The agent calls a payment tool. While the request is in flight, the user spots an extra zero and corrects the amount to $120.

Too late. The processor has already accepted $1,200.

The screen now says $120. The real payment says $1,200. Both values are honest in their own way: one is the person's current intent; the other is money that has already moved.

Which one should the interface display?

That question matters more than whether the agent can find the Pay button. WebMCP removes much of that visual work in the first place. Instead of spending tokens and time on screenshots, element detection, clicks, and repeated checks, an agent receives a compact structured contract. Good. But a fast, precise function call creates a less obvious problem: the page now has two operators.

## WebMCP in 40 seconds

[WebMCP](https://developer.chrome.com/docs/ai/webmcp/imperative-api) is an experimental browser API through which an open page can publish tools for an AI agent. A tool has a name, a description, a JSON Schema for its arguments, and a JavaScript execution function.

An invoice page might register `payInvoice`:

```js
await document.modelContext.registerTool({
  name: 'payInvoice',
  description: 'Pay a reviewed invoice for an exact amount.',
  inputSchema: {
    type: 'object',
    properties: {
      invoiceId: { type: 'string' },
      amountCents: { type: 'integer', minimum: 1 },
      currency: { type: 'string', enum: ['USD'] },
    },
    required: ['invoiceId', 'amountCents', 'currency'],
  },
  annotations: {
    consequentialHint: true,
  },
  execute: payInvoice,
});
```

A compatible agent can invoke that tool directly. It does not have to infer what each button means or whether the latest render moved it. The tool still runs inside the live page, with access to the current session and application state, and it can update the same UI the person has open.

`consequentialHint` tells a client that an action carries serious consequences. It is not a security boundary. [Chrome's security guidance](https://developer.chrome.com/docs/ai/webmcp/secure-tools) describes annotations as hints, which leaves authorization, confirmation, amount validation, and duplicate protection with the application and its backend.

WebMCP is not a widely available web standard yet. Its architectural consequence is already clear, though: the person can keep editing while the agent's tool call is running.

## The form no longer has one author

Most frontend flows quietly assume a single author of intent. A user changes an amount, presses Pay, and receives a result. Promises, caches, and optimistic updates may run underneath, but the meaningful sequence still comes from one person.

WebMCP breaks that sequence. An agent can begin an action while the person edits the same field, navigates away, signs out, or manually launches the same operation.

The frontend has become a concurrent system. The second author is not in another browser or an isolated headless session. It is operating in the same tab, under the same session, against the same business objects.

Calling this a race condition is accurate but incomplete. Two callbacks are not merely racing. Two intentions are.

## The first four races

### 1. Stale intent

The agent reads $1,200 and begins the payment. The user corrects the amount to $120 before the call finishes. The result is valid for revision 41 and wrong for the current revision 42.

Apply the late result blindly and the interface rolls backward. Ignore it and the page hides a payment that actually happened.

### 2. A late response creates a false picture

The UI shows the corrected $120 draft. One second later, success arrives for the old $1,200 payment. A component may render a green "Paid" badge beside the current amount even though processor truth belongs to a different version.

The bug is not simply that one response was slow. The application lost the link between a result and the intent that produced it.

### 3. One effect happens twice

The person clicks Pay while the agent invokes `payInvoice`. Both requests are valid. Disabling the button after a click does not help because the agent never has to touch it.

The backend needs to recognize that both requests refer to one operation. That requires a stable operation ID or idempotency key. Stripe, for example, returns the stored result for a repeated request carrying the same idempotency key rather than performing the effect again. This prevents duplication. It does not detect that the amount is stale.

### 4. Stop arrives after commit

The user stops the agent. `AbortSignal` ends the JavaScript wait or aborts `fetch`, but the processor has already accepted the payment. The local operation looks stopped; the server-side operation is complete.

Stopping a wait does not return money. Once a payment succeeds, reversing it is usually a separate refund with its own status and failure modes.

All four races point to the same missing fact: which version of human intent does this effect belong to?

## Watch the truth split

![A user corrects an invoice to $120 while a WebMCP tool completes the earlier $1,200 payment](webmcp-shared-state-demo/assets/webmcp-shared-state-demo.gif)

The demo is synthetic. It sends no money and talks to no payment provider. It shows one controlled interleaving: `payInvoice` captures $1,200, the person changes the draft to $120, and a fake processor completes the older payment.

> [Try the interactive WebMCP payment-race demo](https://shmakovdima.github.io/webmcp-browser-benchmark/): change the amount while `payInvoice` is running, then compare an uncoordinated result with revision-aware reconciliation.

The timeline is short:

```text
T0  Agent reads: $1,200, revision 41
T1  Agent starts payInvoice($1,200)
T2  Human corrects the draft: $120, revision 42
T3  Processor commits: $1,200 succeeded
T4  Result reaches a page that now shows $120
```

At T4, "show the latest value" and "show the server value" are both wrong policies. The application must preserve two facts: the current draft is $120, and a $1,200 payment has succeeded.

## Capture intent before the first await

A tool should not keep reading mutable UI state while it runs. The amount might come from one store revision, the invoice ID from another, and the selected invoice may change before the request leaves the page.

Capture an immutable intent before the first `await`:

```js
const intent = {
  operationId: crypto.randomUUID(),
  pageRevision: paymentStore.revision,
  invoiceId: paymentStore.invoiceId,
  amountCents: paymentStore.amountCents,
  currency: paymentStore.currency,
};
```

This snapshot does not replace authorization or server-side validation. It answers a narrower question: which page state produced the request?

A complete WebMCP callback could look like this:

```js
async function payInvoice(input, { signal }) {
  const intent = paymentStore.captureIntent(input);
  paymentStore.markPending(intent);

  try {
    const result = await paymentApi.pay({
      invoiceId: intent.invoiceId,
      amountCents: intent.amountCents,
      currency: intent.currency,
      operationId: intent.operationId,
      expectedRevision: intent.serverRevision,
    }, { signal });

    paymentStore.reconcile(intent, result);
    return result;
  } catch (error) {
    paymentStore.reconcileFailure(intent, error);
    throw error;
  }
}
```

When the response returns, `reconcile` compares the captured revision with the current one. If the person changed the amount, the callback does not overwrite the new draft. It records the server effect separately and opens a conflict.

## Idempotency keys and revisions answer different questions

They are easy to conflate because both values travel with a write request.

`operationId` asks: "Have we already performed this intent?" A retry after a timeout should return the previous result, not move money again. [Stripe recommends idempotency keys](https://docs.stripe.com/api/idempotent_requests) for exactly this kind of safe retry.

`expectedRevision` asks: "Is this intent still based on current data?" A request can have a brand-new operation ID and still be stale.

You need both:

```text
same operationId + retry       -> return the existing payment
new operationId + old revision -> reject or surface a conflict
```

Idempotency without revision reliably repeats the wrong amount. Revision checking without idempotency can create the right payment twice.

## Three coordination models

Merge is almost never meaningful for a payment. You cannot average $1,200 and $120 or splice them together. That leaves three practical models.

### A short lock

Once the person confirms an amount, the application briefly locks editing and shows who is executing the payment. This is easy to reason about and works for a short commit. If the provider is slow, the agent appears to have seized the page.

### Optimistic concurrency

The person keeps editing. Every state-changing call includes the revision it was based on. The server or client coordinator rejects a stale write and surfaces a conflict.

This is a useful default for editable entities. It cannot reverse an effect that an external system has already completed, so reconciliation still matters.

### Prepare and commit

The agent calls `preparePayment` first. The server returns a proposal containing a frozen invoice ID, recipient, amount, currency, and expiration. The page shows that exact proposal to the person. A separate `confirmPayment(proposalId)` creates the financial effect.

This design separates assistance from authority. The agent can find an invoice, normalize fields, and prepare the payment without gaining room to mutate the amount at commit time.

For high-stakes actions, that is often more honest than one oversized `payInvoice`.

## A confirmation dialog does not repair stale intent

"Confirm payment?" is useless if the modal displays the current draft while the backend is about to execute a captured intent.

The confirmation must show the frozen version: invoice, recipient, exact amount and currency, masked payment source, initiator, proposal expiry, and the effect of pressing Confirm.

There is another awkward detail. `consequentialHint: true` does not guarantee that every client will present the confirmation your product needs. Critical review belongs in product-controlled UI and at the server boundary.

## Abort, cancel, and refund are different operations

A payment call has at least three possible outcomes:

1. The server definitely did not start it.
2. The payment completed and the client received the result.
3. The client stopped waiting and does not know what happened.

The third state is not `failed`. If the connection drops after commit, a blind retry can create another effect without correct idempotency. Rolling the local store back only hides the uncertainty.

Display `unknown`, then query processor truth by operation ID. If a payment is `succeeded`, returning the money requires a refund. In [Stripe's PaymentIntent lifecycle](https://docs.stripe.com/payments/paymentintents/lifecycle), `succeeded` means the payment flow is complete; refunds are handled separately. That is a concrete provider example, not a universal payment specification.

An Undo button may launch a refund. It should not pretend to rewind time.

## Test event order without an LLM

Shared-state correctness does not require a model. Control the promises and test different interleavings:

```js
it('keeps the corrected draft after an older payment succeeds', async () => {
  const payment = tool.payInvoice({
    invoiceId: 'inv-2048',
    amountCents: 120000,
    currency: 'USD',
  });

  ui.changeAmount(12000);
  processor.resolve({ paymentId: 'pay-7', status: 'succeeded' });

  await payment;

  expect(ui.draft.amountCents).toBe(12000);
  expect(ui.serverPayment.amountCents).toBe(120000);
  expect(ui.conflict.type).toBe('revision-conflict');
});
```

Add abort before commit, abort after commit, a repeated operation ID, a new operation ID with an old revision, logout during execution, and navigation to another invoice. LLM evals still matter for tool selection and conflict handling. State integrity should pass ordinary deterministic tests first.

## Measure the cost of collaboration

Tool-call volume says little about whether the agent is helping. Better signals include conflicts with newer human actions, late responses rejected from the draft, retries absorbed by idempotency, time spent in `unknown`, immediate refunds after agent payments, and full UI-to-processor reconciliations.

These numbers are not a universal benchmark. They tell you whether the agent is collaborating with the person or merely producing expensive divergence faster.

## Production checklist

Before publishing a state-changing WebMCP tool, verify that:

- intent is captured before the first `await`;
- the operation has a stable ID and the mutable entity has a revision;
- the server rechecks authorization, amount, currency, and invoice state;
- a late response cannot overwrite a newer human draft;
- the UI displays draft, pending operation, and server truth separately;
- Stop is not presented as rollback of a committed effect;
- an `unknown` outcome has a status lookup and reconciliation path;
- retries are safe while a fresh stale intent is rejected;
- a high-stakes flow is split into prepare and commit when review is required;
- tests permute human, agent, and server event order.

If one item has no answer, the tool is not ready to control money.

## The tab is now a shared workspace

WebMCP gives an agent a shorter path to action: fewer screenshots, fewer clicks, fewer tokens, and less time wasted on visual recovery. That is a solid reason to publish structured tools.

Efficiency is not correctness.

Once an agent can change data inside a live page, the frontend has a second author. In a payment flow, the old intent does not disappear after a new render. It may already be sitting at the processor.

Design every state-changing WebMCP tool as a concurrent transaction, not a remote click. When the screen says $120 after a $1,200 payment, the interface must preserve both truths until the person explicitly decides what happens next.

---

# E. Источники технических утверждений

## Первичные источники

1. [Chrome for Developers: Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api) - `document.modelContext.registerTool()`, descriptor инструмента, `execute` и `AbortSignal`.
2. [Chrome for Developers: WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices) - runtime validation, управление регистрацией, обновление UI и надежность.
3. [Chrome for Developers: WebMCP tool security](https://developer.chrome.com/docs/ai/webmcp/secure-tools) - `consequentialHint`, границы доверия, подтверждение и повторная проверка данных.
4. [WebMCP API Proposal](https://webmachinelearning.github.io/webmcp/docs/proposal.html) - работа в browsing context, синхронизация UI и чередование tool calls с human input. Код статьи использует актуальное имя `document.modelContext`.
5. [Stripe API: Idempotent requests](https://docs.stripe.com/api/idempotent_requests) - безопасные повторы state-changing запросов с idempotency key.
6. [Stripe: PaymentIntent lifecycle](https://docs.stripe.com/payments/paymentintents/lifecycle) - статусы платежа, ограничения отмены и отдельный refund после успешной оплаты.

## Материалы, использованные только для проверки пересечений

1. [Introducing "Token Proof of Work"](https://hackernoon.com/introducing-token-proof-of-work)
2. [Product-Led Growth Is Changing for the Age of AI Agents](https://hackernoon.com/product-led-growth-is-changing-for-the-age-of-ai-agents)
3. [What If AI Agents Didn't Have to Click Through Your Website?](https://hackernoon.com/what-if-ai-agents-didnt-have-to-click-through-your-website)
4. [WebMCP Could Make AI Agents Much Better at Using the Web](https://hackernoon.com/webmcp-could-make-ai-agents-much-better-at-using-the-web)
5. [What Exactly Is WebMCP?](https://hackernoon.com/what-exactly-is-webmcp)
