# WebMCP: Making the web work for humans and AI agents

Complete text draft for a 25-minute MoscowJS talk.

This file is the working source of truth for the deck. It is not a documentation summary. The talk has one argument and one running example.

## Requirements lock

- Topic: WebMCP. MCP is only the necessary starting point.
- Story: MCP connects agents to configured servers -> people cannot install a server for every website -> browser agents already work beside people on chosen websites -> DOM automation and separate MCP servers both add friction -> WebMCP gives the open page a direct tool interface.
- Explain what MCP is, which problem it solves, who uses it, and why it matters to people.
- Explain the limitation: current page, session, selection, unsaved state, visible result, and human confirmation.
- Explain the browser automation cost: Playwright MCP and similar tools can operate almost any website, but the agent repeatedly receives tool schemas, accessibility snapshots, DOM-derived text, or screenshots and must infer the next low-level action.
- Explain token usage carefully: repeated observations and large generic tool contracts consume context; screenshots add image tokens. Do not invent universal token counts or claim that every Playwright workflow is expensive.
- Explain the separate MCP-server cost: build, deploy, connect, install, update, support, and trust.
- Sell WebMCP through human convenience, reduced repetitive work, active session reuse, visible control, and lower integration friction.
- Explain savings carefully: less duplicated infrastructure, less agent context, fewer model turns and retries, lower possible latency and cost. Do not invent universal percentages.
- Use one running example only: booking a doctor. Other examples stay in research links.
- Show current functionality: imperative JavaScript, declarative HTML forms, page registration, discovery, invocation, current browser context, DevTools inspection, and manual execution.
- State clearly: WebMCP is still in development, experimental, not universal, and its API, lifecycle, permissions, and tooling may change.
- Explain why it matters now for SEO and agentic browsing: Lighthouse has WebMCP audits and PageSpeed Insights is part of the same agentic-browsing direction. Do not call it a confirmed ranking factor.
- End with a concrete action: try the official demo or add one low-risk tool to a real page today.
- MoscowJS format: unnumbered title with name and contact, all other presentation slides numbered, short readable code, final slide with name, contact, and short materials link or QR code.
- Other talks, articles, demos, and research are listed separately after the slides.
- Every factual claim from research must be cited inside the relevant slide notes, not only in the research appendix.
- Every slide must have production guidance: visible content, visual treatment, optional joke, speaker notes, and a transition.
- The user story and the cost story are one narrative. Each alternative is evaluated by setup, infrastructure, model work, and risk.

## Narrative in one line

`MCP makes services callable. WebMCP makes the page in front of the person callable.`

## Narrative map

1. `MCP lets an agent call servers that already exist and are connected to its client.`
2. `That model works for a small set of regular integrations, but not for every website a person may visit.`
3. `A browser agent already works beside the person on the website they chose and opened.`
4. `Without a site-provided contract, Playwright MCP and similar tools make the agent reconstruct actions from snapshots, screenshots, and low-level controls.`
5. `That observation and action loop spends context and model turns before the actual business action happens.`
6. `A separate MCP server is possible, but it brings installation, authentication, update, infrastructure, and trust costs.`
7. `WebMCP lets the open page provide tools directly to the compatible browser agent.`
8. `One booking example shows the difference for a person.`
9. `Lighthouse and PageSpeed Insights make agentic readiness visible to website owners.`
10. `The audience can try the current experimental version today.`

## Timing

- 00:00-03:00 - MCP: what it solves and what a connection costs
- 03:00-06:00 - why separate integrations cannot cover the open web
- 06:00-09:30 - browser automation, Playwright, screenshots, model turns, and token cost
- 09:30-12:00 - separate MCP server: infrastructure, authorization, installation, updates, and trust
- 12:00-16:00 - WebMCP as the browser layer and its cost model
- 16:00-19:00 - one complete booking workflow
- 19:00-21:30 - honest advantages, disadvantages, security, and when MCP still wins
- 21:30-23:30 - current support, SEO, Lighthouse, and PageSpeed Insights
- 23:30-25:00 - try it today and call to action

## Visual system for the finished deck

- Format: 16:9, one idea per slide, large type, no paragraph text on screen.
- Language: EN and RU are parallel variants for production. Use one language in the delivered deck, not both on the same canvas.
- Main accent: one bright browser blue for WebMCP, neutral grey for MCP, warning orange for cost and risk.
- Recurring device: the same four-line cost card appears after each alternative: setup, infrastructure, model work, risk.
- Screenshots: use real Playwright output, Chrome flags, Lighthouse, the WebMCP DevTools panel, and the official booking demo.
- Code: no more than eight readable lines. Hide imports and unrelated application code.
- Sources: keep links in speaker notes. Show a short source label on screen only for experimental support and Lighthouse claims.
- Humor: five deliberate jokes across the talk. Do not add a joke to every technical slide.
- MoscowJS details: visible slide number on slides 1-89, title slide without a number, final slide with contact and QR.

## Title slide - unnumbered

EN: `WebMCP: Making the web work for humans and AI agents`

RU: `WebMCP: как заставить веб работать для людей и AI-агентов`

EN: `[Name] / [company or project] / [contact]`

RU: `[Имя] / [компания или проект] / [контакт]`

Что говорить: Сегодня я хочу показать не ещё один API, а изменение в отношениях между человеком, агентом и сайтом. Сначала разберём, что уже решил MCP, затем найдём задачу, для которой нужен WebMCP.

## Part 1. MCP solves service integration

### 1. Who has used MCP?

EN: `Who has already installed or used an MCP server?`

RU: `Кто уже устанавливал или использовал MCP-сервер?`

Визуал: крупный вопрос и лес поднятых рук на фотографии MoscowJS. Шутка: "Кто ставил MCP и с первого раза ничего не правил в JSON?" Переход: сначала выравниваем базовое понимание.

Что говорить: Сначала быстро сверимся с залом. Поднимите руку, если вы уже подключали MCP-сервер к ассистенту, IDE или coding agent. Опыт не обязателен, дальше мы разберём модель с нуля.

### 2. Agents need tools

EN: `A model can explain a task. A tool lets it perform the task.`

RU: `Модель может объяснить задачу. Инструмент позволяет её выполнить.`

Визуал: слева чат, справа выполненное действие в календаре. Ритм: два последовательных появления. Переход: для действия модели нужен внешний инструмент.

Что говорить: Сам диалог не меняет данные и не выполняет операции. Чтобы агент мог реально помочь человеку, ему нужны инструменты, которые связывают запрос с внешней системой.

### 3. Custom integrations do not scale

EN: `Every AI client needed a separate integration with every service.`

RU: `Каждому AI-клиенту требовалась отдельная интеграция с каждым сервисом.`

Визуал: схема N клиентов и N сервисов с перепутанными линиями. Шутка: "Архитектура в стиле макарон после code review". Переход: MCP убирает уникальный язык каждой связи.

Что говорить: Без общего протокола каждый клиент отдельно договаривается с каждым сервисом. Чем больше клиентов и сервисов, тем больше несовместимых интеграций приходится поддерживать.

### 4. Model Context Protocol

EN: `AI clients need one common way to connect to tools and data.`

EN: `MCP replaces many custom integrations with one shared protocol.`

RU: `AI-клиентам нужен единый способ подключаться к инструментам и данным.`

RU: `MCP заменяет множество отдельных интеграций одним общим протоколом.`

Визуал: один крупный разъём MCP между клиентом и сервером. Переход: стандарт начинается с общего контракта.

Что говорить: MCP вводит общий способ объявить возможности и вызвать их. Клиенту не нужно изучать уникальный интерфейс каждого сервиса.

Источник: [MCP introduction](https://www.anthropic.com/news/model-context-protocol)

### 5. The MCP contract

EN: `Name. Description. Input schema. Structured result.`

RU: `Имя. Описание. Схема входных данных. Структурированный результат.`

Визуал: четыре крупные строки контракта, без мелкого JSON. Переход: контракт уже используют реальные клиенты.

Что говорить: Агент получает контракт действия. Он знает его назначение, допустимые аргументы и формат результата, а не пытается угадать всё по интерфейсу.

Источник: [MCP tools](https://modelcontextprotocol.io/specification/draft/server/tools)

### 6. MCP users today

EN: `Desktop assistants, coding agents, IDEs, and internal automation use MCP.`

RU: `MCP используют десктопные ассистенты, coding agents, IDE и внутренняя автоматизация.`

Визуал: ассистент, IDE и внутренний портал вокруг одного MCP-сервера. Переход: однако клиент видит только подключенные серверы.

Что говорить: MCP уже работает там, где агент обращается к коду, файлам, задачам и корпоративным системам. Это практическая модель интеграции, а не только идея стандарта.

Источник: [MCP roadmap](https://blog.modelcontextprotocol.io/posts/mcp-roadmap/)

### 7. MCP requires a connected server

EN: `An agent can call only the MCP servers connected to its client.`

RU: `Агент может вызывать только MCP-серверы, подключенные к его клиенту.`

Визуал: список подключений, где один нужный сервис отсутствует. Переход: это нормально для постоянного рабочего набора.

Что говорить: Протокол не подключает агента ко всему интернету автоматически. Для сервиса кто-то создаёт сервер, а пользователь или администратор добавляет его в AI-клиент.

Источник: [MCP client and server architecture](https://modelcontextprotocol.io/specification/draft/architecture)

## Part 2. MCP cannot be installed for the whole web

### 8. Installed integrations cover regular services

EN: `MCP works well for services a person uses repeatedly.`

RU: `MCP хорошо работает для сервисов, которыми человек пользуется постоянно.`

Визуал: один сервер с отметкой "используется ежедневно". Переход: открытый веб устроен иначе.

Что говорить: Если команда ежедневно работает с одним набором систем, настройка интеграции оправданна. Сервер подключают один раз и используют много раз.

### 9. The web is much larger

EN: `People visit websites their AI client has never integrated with.`

RU: `Люди посещают сайты, с которыми их AI-клиент никогда не интегрировался.`

Визуал: длинная лента разных сайтов, уходящая за край экрана. Переход: заранее подключить их все невозможно.

Что говорить: В обычном вебе заранее известного списка сервисов нет. Сегодня человеку нужна клиника, завтра другой локальный сервис. У клиента не может быть заранее подключена интеграция с каждым сайтом.

### 10. One MCP server per website does not scale

EN: `A person cannot configure an integration before using every website.`

RU: `Человек не может настраивать интеграцию перед использованием каждого сайта.`

Визуал: окно установки поверх простого сайта. Шутка: "Чтобы записаться к врачу, сначала настройте OAuth". Переход: фиксируем первую стоимость.

Что говорить: Иначе посещение сайта превращается в установку софта. Нужно найти MCP-сервер, проверить издателя, установить пакет, настроить доступ и следить за обновлениями.

### 11. Cost checkpoint: MCP distribution

EN: `Setup grows with the number of services and clients.`

RU: `Настройка растёт вместе с количеством сервисов и клиентов.`

Визуал: первый cost card с четырьмя строками: setup, infrastructure, model work, risk. Подсветить setup. Переход: теперь посмотрим, почему агент вообще оказывается в браузере.

Что говорить: Первый вид стоимости уже виден. MCP стандартизирует протокол, но сервер всё равно нужно создать, распространить, подключить и авторизовать. Для постоянных сервисов цена оправданна. Для случайного сайта она возникает слишком рано.

Источник: [VS Code MCP server setup](https://code.visualstudio.com/docs/agent-customization/mcp-servers), [Official MCP Registry](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/)

### 12. Agents are moving into the browser

EN: `A browser agent works on the same page as the person.`

RU: `Браузерный агент работает на той же странице, что и человек.`

Визуал: браузер с боковой панелью агента и открытой страницей. Переход: человек уже находится на сайте.

Что говорить: Поэтому агент оказывается на сайте не случайно. Человек уже использует AI внутри браузера или встроенного web view и поручает ему часть работы на открытой странице.

Источник: [WebMCP terminology and browser agents](https://webmachinelearning.github.io/webmcp/)

### 13. The person chooses the website

EN: `The clinic is already open because the person chose and trusts it.`

RU: `Сайт клиники уже открыт, потому что человек выбрал эту клинику и доверяет ей.`

Визуал: реальная на вид страница клиники с активным профилем. Переход: выбор сайта сделал человек, а не модель.

Что говорить: Агент не решает сам пойти в неизвестную клинику. Человек выбрал поставщика услуги, открыл его сайт, изучил условия и вошёл в аккаунт.

### 14. The task starts inside the website

EN: `Find a dermatologist after 19:00 and prepare the earliest appointment here.`

RU: `Найди здесь дерматолога после 19:00 и подготовь запись на ближайшее время.`

Визуал: одна крупная реплика пользователя. Ритм: выделить слово `here` или `здесь`. Переход: это слово связывает задачу с текущей страницей.

Что говорить: Слово "здесь" задаёт границу задачи. Пользователь уже определил, какому сайту доверяет, и делегирует агенту рутинную часть работы внутри выбранного сервиса.

### 15. The page already contains useful context

EN: `The account, location, insurance, and current selection are already known.`

RU: `Аккаунт, местоположение, страховка и текущий выбор уже известны странице.`

Визуал: подсвеченные аккаунт, район, фильтр и введённые данные. Переход: агенту нужно воспользоваться этим состоянием.

Что говорить: Открытая страница знает пользователя, выбранную клинику, применённые фильтры и уже введённые данные. Этот контекст возник до обращения к агенту.

Источник: [WebMCP and MCP comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp)

## Part 3. The browser agent has two bad options

### 16. The website exposes no tool contract

EN: `Without WebMCP, the agent receives the rendered interface.`

RU: `Без WebMCP агент получает отрисованный интерфейс.`

Визуал: страница с вопросительным знаком вместо списка инструментов. Переход: без контракта остаётся управление интерфейсом.

Что говорить: Сайт создан для человека. Если он не объявил инструменты, браузерный агент видит DOM, текст, формы и визуальное состояние, но не получает явного контракта действий.

Источник: [WebMCP existing web actuation techniques](https://github.com/webmachinelearning/webmcp)

### 17. Option one: operate the interface

EN: `Read the page. Find a control. Click it. Wait. Check the result.`

RU: `Прочитать страницу. Найти элемент. Нажать. Подождать. Проверить результат.`

Визуал: пять кадров одного клика: посмотреть, найти, нажать, ждать, проверить. Переход: один пользовательский шаг превращается в цикл.

Что говорить: Агент может имитировать работу человека. После каждого действия он снова наблюдает страницу и решает, что делать дальше.

### 18. Interface automation is expensive and fragile

EN: `Every step consumes context and can break when the page changes.`

RU: `Каждый шаг расходует контекст и может сломаться после изменения страницы.`

Визуал: сломанный selector после небольшого редизайна. Шутка: кнопка переехала на восемь пикселей и агент начал новую жизнь. Переход: универсальные browser tools пытаются сделать этот цикл надёжнее.

Что говорить: Агент тратит модельные вызовы на распознавание интерфейса, ожидание и проверку. Редизайн, модальное окно или новое название кнопки могут нарушить сценарий.

### 19. Playwright MCP makes any page operable

EN: `It exposes navigation, snapshots, clicks, typing, and screenshots as tools.`

RU: `Он предоставляет навигацию, snapshots, клики, ввод и скриншоты как инструменты.`

Визуал: логотип Playwright рядом с коротким accessibility tree. Переход: разные инструменты наблюдают страницу по-разному.

Что говорить: Playwright MCP и похожие инструменты полезны своей универсальностью. Они позволяют агенту работать с сайтом, даже если разработчики сайта ничего специально для агентов не сделали.

Источник: [Official Playwright MCP repository](https://github.com/microsoft/playwright-mcp)

### 20. Generic browser tools observe different representations

EN: `Playwright reads accessibility. DevTools inspects the browser. Computer use reads pixels.`

RU: `Playwright читает accessibility. DevTools инспектирует браузер. Computer use читает пиксели.`

Визуал: три вертикальные области: accessibility, DevTools state, pixels. Переход: представление разное, цикл остаётся тем же.

Что говорить: Универсальные инструменты различаются способом наблюдения. Playwright MCP обычно возвращает accessibility snapshot, Chrome DevTools for agents даёт низкоуровневый доступ к браузеру, а computer use получает screenshot и отвечает действиями с координатами. Во всех трёх случаях модель сама переводит интерфейс в следующий низкоуровневый шаг.

Источники: [Chrome DevTools for agents](https://developer.chrome.com/docs/devtools/agents), [OpenAI computer tool API](https://platform.openai.com/docs/api-reference/responses-streaming/response/refusal?lang=python)

### 21. The agent works through an observation loop

EN: `Navigate. Read a snapshot. Choose a ref. Act. Read the next snapshot.`

RU: `Открыть страницу. Прочитать snapshot. Выбрать ref. Выполнить действие. Прочитать новый snapshot.`

Визуал: пять последовательных кадров без стрелок: Navigate, Snapshot, Ref, Action, Snapshot. Переход: каждое наблюдение попадает в модель.

Что говорить: В официальном workflow Playwright MCP действия связаны с accessibility snapshots. После изменения страницы старые refs могут устареть, поэтому агенту требуется новое наблюдение.

Источник: [Playwright MCP workflow](https://github.com/microsoft/playwright.dev/blob/main/mcp/installation.mdx)

### 22. Every observation enters the model context

EN: `A large accessibility tree can arrive after every action.`

RU: `Большое accessibility tree может поступать после каждого действия.`

Визуал: маленький запрос пользователя рядом с огромным деревом страницы. Шутка: "Запрос на одну строку, приложение на весь контекст". Переход: визуальный fallback стоит ещё дороже.

Что говорить: Snapshot экономнее скриншота, потому что это текст. Но на большой странице он всё равно может быть объёмным, а свежий snapshot часто возвращается после каждого шага. Эти данные конкурируют за контекст с задачей пользователя.

Источник: [Playwright accessibility snapshots](https://github.com/microsoft/playwright.dev/blob/main/mcp/snapshots.mdx)

### 23. Screenshots add image tokens

EN: `Visual fallback costs more context and requires coordinate reasoning.`

RU: `Визуальный fallback расходует больше контекста и требует работы с координатами.`

Визуал: screenshot с координатной сеткой и указателем мыши. Переход: кроме наблюдений модель получает ещё и универсальные инструменты.

Что говорить: Если элемента нет в accessibility tree, агенту может понадобиться screenshot и vision mode. Документация Playwright отмечает более высокую стоимость image tokens и менее точное взаимодействие по координатам.

Источник: [Playwright vision mode](https://github.com/microsoft/playwright.dev/blob/main/mcp/vision-mode.mdx)

### 24. Generic tool schemas also take space

EN: `The model receives browser tools before it can use the website.`

RU: `Модель получает инструменты браузера до начала работы с сайтом.`

Визуал: длинный список browser tools, уходящий вниз. Переход: ответы можно оптимизировать.

Что говорить: Универсальный browser MCP описывает навигацию, ввод, клики, вкладки, snapshots и другие операции. Microsoft отдельно указывает, что большие tool schemas и подробные accessibility trees увеличивают расход контекста.

Источник: [Playwright MCP repository](https://github.com/microsoft/playwright-mcp)

### 25. Optimization reduces the cost, not the abstraction

EN: `Targeted snapshots help, but the agent still operates the interface.`

RU: `Точечные snapshots помогают, но агент всё равно управляет интерфейсом.`

Визуал: полный snapshot сжимается до нужного subtree. Переход: оптимизация уменьшает объём, но не меняет задачу модели.

Что говорить: Можно ограничить глубину snapshot, найти только нужный фрагмент и отключить лишние ответы. Это полезно, но всё ещё не сообщает агенту бизнес-смысл операции.

### 26. Controls do not describe the user's goal

EN: `A button says "Continue". The website knows what continuing means.`

RU: `Кнопка говорит "Продолжить". Только сайт знает смысл этого действия.`

Визуал: огромная кнопка `Continue` и подпись `Continue what?`. Шутка уже находится в самом визуале. Переход: подводим стоимость browser automation.

Что говорить: Универсальный инструмент видит элементы управления. Разработчик сайта знает, какое продуктовое действие стоит за ними, какие параметры нужны и какой результат должен получить человек.

### 27. Cost checkpoint: browser automation

EN: `No site integration. More observation, reasoning, retries, and latency.`

RU: `Нет интеграции с сайтом. Больше наблюдений, рассуждений, повторов и задержки.`

Визуал: cost card, где подсвечены model work, latency и fragility. Переход: есть второй путь - дать агенту бизнес-инструменты через обычный MCP.

Что говорить: Browser automation экономит работу владельца сайта, потому что запускается без его участия. Цена переносится в агентский цикл: больше данных попадает в модель, больше шагов требуется для действия, а изменение интерфейса повышает риск повтора.

Источник: [Playwright MCP snapshots](https://github.com/microsoft/playwright.dev/blob/main/mcp/snapshots.mdx), [Playwright MCP repository](https://github.com/microsoft/playwright-mcp)

### 28. Option two: build a separate MCP server

EN: `The clinic can expose the same operations through a backend integration.`

RU: `Клиника может открыть те же операции через отдельную backend-интеграцию.`

Визуал: отдельный MCP-сервер клиники рядом с backend. Переход: технически контракт становится хорошим.

Что говорить: Технически обычный MCP тоже может решить задачу. Команда клиники создаёт сервер с поиском врачей и записью, а AI-клиент подключается к нему.

Источник: [WebMCP backend integration comparison](https://github.com/webmachinelearning/webmcp)

### 29. The connection still has to reach the user

EN: `The server must be discovered, trusted, installed, and configured.`

RU: `Сервер нужно найти, проверить, установить и настроить.`

Визуал: последовательность marketplace, install, config, trust. Переход: но соединение ещё нужно доставить пользователю.

Что говорить: Наличие сервера не помогает посетителю автоматически. Пользователь должен узнать о нём, найти правильный пакет, проверить издателя и добавить интеграцию в свой клиент.

Источник: [Official MCP Registry](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/), [VS Code MCP setup](https://code.visualstudio.com/docs/agent-customization/mcp-servers)

### 30. Authentication happens again

EN: `The active website session does not automatically authorize the MCP client.`

RU: `Активная сессия сайта не авторизует MCP-клиент автоматически.`

Визуал: две формы входа рядом: сайт и MCP OAuth. Шутка: "Вы уже вошли. Войдите ещё раз". Переход: двойная авторизация означает и двойное сопровождение.

Что говорить: Человек уже вошёл на сайт, но отдельной интеграции часто нужен собственный токен или OAuth. Для одной задачи возникают два канала доступа и два места управления разрешениями.

Источник: [MCP authorization](https://apps.extensions.modelcontextprotocol.io/api/documents/authorization.html), [WebMCP comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp)

### 31. The website team maintains two interfaces

EN: `The page and the MCP server must evolve together.`

RU: `Страница и MCP-сервер должны развиваться синхронно.`

Визуал: две параллельные release pipelines для страницы и MCP-сервера. Переход: сопровождение дополняется вопросом доверия.

Что говорить: Команда отдельно деплоит, мониторит и защищает сервер. Изменение правил записи приходится отражать и на сайте, и во внешнем контракте. Локальный пакет также может потребовать обновления.

Источник: [WebMCP proposal benefits](https://webmachinelearning.github.io/webmcp/docs/proposal.html)

### 32. Installation creates a trust decision

EN: `A marketplace package may execute code and access sensitive data.`

RU: `Пакет из marketplace может выполнять код и получать доступ к чувствительным данным.`

Визуал: системный trust dialog с названием неизвестного пакета. Переход: собираем стоимость отдельного MCP.

Что говорить: Marketplace упрощает поиск, но не гарантирует безопасность. Пользователь должен оценить издателя, код, обновления и запрошенные разрешения до посещения обычного сайта.

Источник: [VS Code MCP trust warning](https://code.visualstudio.com/docs/agent-customization/mcp-servers)

### 33. Cost checkpoint: separate MCP server

EN: `Reliable business tools. Separate infrastructure and user onboarding.`

RU: `Надёжные бизнес-инструменты. Отдельная инфраструктура и подключение пользователя.`

Визуал: cost card, где подсвечены infrastructure, setup и risk. Переход: нужен контракт без отдельной дистрибуции.

Что говорить: Обычный MCP даёт хороший контракт и не зависит от верстки. Его цена здесь состоит не в токенах UI, а в отдельном сервере, OAuth, дистрибуции, обновлениях и доверии к установленному коду.

Источник: [MCP authorization](https://apps.extensions.modelcontextprotocol.io/api/documents/authorization.html), [VS Code MCP trust](https://code.visualstudio.com/docs/agent-customization/mcp-servers)

### 34. The missing browser layer

EN: `The open page should expose actions to the agent already in the browser.`

RU: `Открытая страница должна предоставлять действия агенту, который уже находится в браузере.`

Визуал: пустое место между открытой вкладкой и агентом, оформленное как отсутствующий разъём. Переход: это место занимает WebMCP.

Что говорить: Теперь проблема сформулирована. Сайт должен сам сообщить совместимому браузерному агенту, что он умеет, используя текущую страницу, сессию и обычный интерфейс подтверждения.

## Part 4. WebMCP makes the page callable

### 35. Who is behind WebMCP?

EN: WebMCP is a community proposal, not a finished product from one company.

RU: WebMCP - общественное предложение, а не готовый продукт одной компании.

Визуал: короткая timeline: Microsoft + Google contributors -> Web Machine Learning Community Group -> experimental browser implementations. Переход: это не закрытый vendor API, а работающий draft веб-платформы.

Что говорить: WebMCP вырос из практической проблемы браузерных агентов и развивается как proposal в W3C Web Machine Learning Community Group. В первоначальном описании отмечены участники Microsoft и Google, а текущий draft редактируют Brandon Walderman, Khushal Sagar и Dominic Farolino. Поэтому корректно говорить: WebMCP развивают Microsoft, Google и сообщество Web Machine Learning, а не одна компания.

Источник: [WebMCP repository and acknowledgments](https://github.com/webmachinelearning/webmcp), [WebMCP draft specification](https://github.com/webmachinelearning/webmcp/blob/main/index.bs)

### 36. WebMCP

EN: `WebMCP lets a page expose actions as structured tools.`

RU: `WebMCP позволяет странице предоставлять действия как структурированные инструменты.`

Визуал: одно слово WebMCP и минимальная схема страница, браузер, агент. Ритм: короткая пауза после названия. Переход: WebMCP добавляет второй интерфейс к существующему продукту.

Что говорить: WebMCP добавляет недостающий интерфейс между открытой страницей и агентом браузера. Сайт сам описывает действия, которые готов выполнить.

Источник: [WebMCP specification](https://webmachinelearning.github.io/webmcp/)

### 37. A second interface for the same product

EN: `People keep the visual UI. Agents receive tool contracts.`

RU: `Люди сохраняют визуальный UI. Агенты получают контракты инструментов.`

Визуал: слева обычный UI, справа компактный tool contract. Переход: оба интерфейса живут в одной странице.

Что говорить: WebMCP не заменяет сайт чатом. Человек продолжает видеть привычный интерфейс, а агент получает более точный способ обращаться к тем же возможностям.

Источник: [WebMCP non-goals](https://github.com/webmachinelearning/webmcp)

### 38. No separate server is required

EN: `The page registers tools from its own JavaScript or HTML.`

RU: `Страница регистрирует инструменты через собственный JavaScript или HTML.`

Визуал: страница с JavaScript и HTML, отдельный сервер перечёркнут. Переход: сайт объявляет конкретное действие.

Что говорить: Для page-local сценария не обязательно поднимать отдельный MCP-сервер. Инструмент поставляется вместе со страницей и обновляется вместе с ней.

Источник: [WebMCP proposal](https://webmachinelearning.github.io/webmcp/docs/proposal.html)

### 39. The page defines the action

EN: `Name. Description. Input schema. Execute function.`

RU: `Имя. Описание. Схема входных данных. Функция выполнения.`

Визуал: короткий фрагмент `registerTool` размером не больше восьми строк. Переход: дальше браузер становится посредником.

Код для вставки в презу:

```js
await document.modelContext.registerTool({
  name: 'findDoctors',
  description: 'Find doctors by specialty and time.',
  inputSchema: { type: 'object', properties: {
    specialty: { type: 'string' }, afterTime: { type: 'string' },
  }, required: ['specialty'] },
  execute: async ({ specialty, afterTime }) => findDoctors({ specialty, afterTime }),
});
```

Что говорить: Разработчик явно указывает назначение действия и допустимые параметры. Вместо поиска подходящей кнопки агент выбирает функцию по её смыслу.

Источник: [WebMCP imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)

### 40. The browser exposes registered tools

EN: `The browser mediates discovery and invocation.`

RU: `Браузер управляет обнаружением и вызовом инструментов.`

Визуал: браузер в центре, страница и агент по сторонам. Переход: агент видит не кнопки, а доступные действия.

Что говорить: Страница не общается с моделью напрямую. Браузер находится между сайтом и совместимым агентом, обнаруживает инструменты и контролирует их вызов.

Источник: [WebMCP specification](https://webmachinelearning.github.io/webmcp/)

### 41. The agent chooses a business action

EN: `The model selects "findDoctors" instead of searching the DOM.`

RU: `Модель выбирает "findDoctors" вместо поиска по DOM.`

Визуал: запрос пользователя и выбранный `findDoctors`. Переход: инструмент вызывает код приложения.

Что говорить: Агент сопоставляет цель пользователя с описанием инструмента. Ему не нужно сначала восстанавливать структуру карточек, фильтров и кнопок.

### 42. The page executes its own logic

EN: `The tool calls the application code that already knows the workflow.`

RU: `Инструмент вызывает код приложения, который уже знает сценарий.`

Визуал: одна функция приложения с двумя входами: UI и WebMCP. Переход: результат возвращается в видимую страницу.

Что говорить: Выполнение остаётся внутри продукта. Сайт применяет свои правила, валидацию, состояние и обработку ошибок.

Источник: [WebMCP imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)

### 43. The visible interface updates

EN: `The person sees the result on the same page.`

RU: `Человек видит результат на той же странице.`

Визуал: обновившийся список врачей в обычном UI. Переход: всё происходит в текущей сессии.

Что говорить: WebMCP поддерживает совместную работу человека и агента. После вызова инструмента интерфейс показывает найденных врачей или подготовленную запись.

Источник: [WebMCP proposal](https://webmachinelearning.github.io/webmcp/docs/proposal.html)

### 44. The active session remains useful

EN: `The tool runs with the state available to the open page.`

RU: `Инструмент работает с состоянием, доступным открытой странице.`

Визуал: значки account, cookies и current state внутри вкладки. Переход: команда сохраняет один источник правил.

Что говорить: Страница уже знает текущего пользователя и его выбор. Не нужно создавать второй канал авторизации только для взаимодействия с агентом внутри вкладки.

Источник: [WebMCP and MCP comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp)

### 45. One product remains the source of truth

EN: `The UI and agent tool can share the same application functions.`

RU: `UI и инструмент агента могут использовать одни функции приложения.`

Визуал: одна функция в центре, которой пользуются форма и tool. Переход: при значимом действии человек остаётся в цикле.

Что говорить: Команда меньше дублирует логику. Если правила меняются в приложении, инструмент можно обновить в том же релизе.

Источник: [WebMCP proposal benefits](https://webmachinelearning.github.io/webmcp/docs/proposal.html)

### 46. The person keeps final control

EN: `The agent can prepare an action. The page can require confirmation.`

RU: `Агент может подготовить действие. Страница может потребовать подтверждение.`

Визуал: понятное окно подтверждения записи. Переход: теперь можно посчитать цену WebMCP.

Что говорить: Значимые действия не должны происходить незаметно. Сайт может показать результат и оставить человеку финальное подтверждение.

Источник: [WebMCP security guidance](https://developer.chrome.com/docs/agents/security)

### 47. Cost checkpoint: WebMCP

EN: `Small page integration. Less setup and less interface reconstruction.`

RU: `Небольшая интеграция в страницу. Меньше настройки и восстановления интерфейса.`

Визуал: cost card, где setup и model work ниже, а developer work остаётся. Переход: экономия не означает, что WebMCP заменяет MCP.

Что говорить: WebMCP переносит часть работы к разработчику сайта, который лучше всех знает смысл действий. Взамен посетителю не нужен отдельный пакет, а агенту не нужно многократно восстанавливать сценарий по DOM. Экономия зависит от конкретной страницы и требует измерения.

Источник: [WebMCP proposal benefits](https://webmachinelearning.github.io/webmcp/docs/proposal.html)

### 48. MCP and WebMCP solve different layers

EN: `MCP serves persistent backend access. WebMCP serves the active website.`

RU: `MCP даёт постоянный доступ к backend. WebMCP работает с активным сайтом.`

Визуал: два слоя без борьбы: backend MCP снизу, active page WebMCP сверху. Переход: сначала честно покажем сильную сторону MCP.

Что говорить: WebMCP не отменяет MCP. Backend-интеграция полезна для фоновых задач и постоянного доступа, а WebMCP нужен для взаимодействия с сайтом, который сейчас открыт у человека.

### 49. Where MCP wins

EN: `Persistent access. Background work. Cross-platform clients. Rich primitives.`

RU: `Постоянный доступ. Фоновые задачи. Разные платформы. Богатые примитивы.`

Визуал: крупные слова Background, Persistent, Cross-platform, Resources. Переход: WebMCP выигрывает в другом режиме.

Что говорить: MCP сильнее, когда агент должен работать без открытой страницы, обращаться к сервису из разных клиентов или использовать resources и prompts вместе с tools. Это базовый слой интеграции, а не проигравшая технология.

Источник: [MCP server primitives](https://modelcontextprotocol.io/specification/draft/server/index), [WebMCP and MCP comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp)

### 50. Where WebMCP wins

EN: `Active page state. Existing login. Visible collaboration. No site connector install.`

RU: `Состояние страницы. Текущий логин. Видимая совместная работа. Нет установки коннектора сайта.`

Визуал: крупные слова Session, UI, Human control, No install. Переход: у этой модели есть жёсткие ограничения.

Что говорить: WebMCP сильнее в коротком интерактивном сценарии внутри выбранного сайта. Он использует вкладку, интерфейс и продуктовую логику, которые уже присутствуют у человека.

Источник: [WebMCP and MCP comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp)

### 51. Where WebMCP loses

EN: `The page must be open. Support is limited. The API is experimental.`

RU: `Страница должна быть открыта. Поддержка ограничена. API экспериментальный.`

Визуал: закрытая вкладка, после которой инструменты исчезают. Переход: поэтому зрелый продукт может использовать оба подхода.

Что говорить: WebMCP плохо подходит для постоянных фоновых задач и чисто серверных процессов. Сайт должен добавить инструменты, браузер и агент должны их поддерживать, а спецификация пока меняется.

Источник: [WebMCP limitations](https://developer.chrome.com/docs/ai/webmcp/), [Implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md)

### 52. The strongest products can use both

EN: `MCP for persistent services. WebMCP for the active customer journey.`

RU: `MCP для постоянных сервисов. WebMCP для активного пользовательского сценария.`

Визуал: один продукт с backend MCP и WebMCP page tools. Шутка: "Наконец-то слайд, где технологии не обязаны убивать друг друга". Переход: проверим сочетание на одном сценарии.

Что говорить: Один продукт может поддерживать оба интерфейса. MCP обслуживает фоновые и межплатформенные сценарии, а WebMCP помогает человеку и агенту работать вместе на сайте.

Источник: [WebMCP and MCP comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp)

## Part 5. One booking workflow

### 53. The request

EN: `Find a dermatologist after 19:00 and prepare the earliest appointment here.`

RU: `Найди здесь дерматолога после 19:00 и подготовь запись на ближайшее время.`

Визуал: снова одна реплика про дерматолога, теперь без дополнительных объяснений. Переход: сначала путь без WebMCP.

Что говорить: Возвращаемся к единственному примеру. Человек выбрал клинику и делегирует поиск, но сохраняет за собой финальное решение.

### 54. Without WebMCP

EN: `The agent must understand the page before it can help.`

RU: `Агент должен понять страницу, прежде чем сможет помочь.`

Визуал: длинная плёнка из snapshots, кликов и проверок. Переход: с WebMCP задача превращается в несколько продуктовых действий.

Что говорить: Сначала агент получает snapshot или screenshot, находит фильтры, заполняет поля, открывает карточки и проверяет состояние после каждого шага.

### 55. With WebMCP

EN: `The page exposes the actions needed for the booking workflow.`

RU: `Страница предоставляет действия, необходимые для записи.`

Визуал: три последовательные карточки tools, раскрывать по одной. Переход: первый инструмент ищет врачей.

Код для вставки в презу:

```js
findDoctors({ specialty: 'dermatology', afterTime: '19:00' });
getAvailableSlots({ doctorId, dateRange: 'next 7 days' });
prepareAppointment({ doctorId, slotId, patient });
```

Что говорить: Сайт описывает тот же пользовательский сценарий через несколько осмысленных инструментов. Они составляют одну задачу, а не набор несвязанных демо.

### 56. Find doctors

EN: `findDoctors({ specialty, afterTime, location })`

RU: `findDoctors({ specialty, afterTime, location })`

Визуал: крупный вызов `findDoctors` и короткий структурированный ответ. Переход: затем агент запрашивает слоты конкретного врача.

Что говорить: Первый инструмент принимает смысловые параметры запроса. Агент получает подходящих врачей без чтения каждой карточки на странице.

### 57. Read available slots

EN: `getAvailableSlots({ doctorId, dateRange })`

RU: `getAvailableSlots({ doctorId, dateRange })`

Визуал: `getAvailableSlots` и три времени без календарной сетки. Переход: выбранный слот передаётся в подготовку записи.

Что говорить: Второй инструмент возвращает структурированные свободные слоты. Календарь остаётся удобным интерфейсом для человека, но перестаёт быть препятствием для агента.

### 58. Prepare the appointment

EN: `prepareAppointment({ doctorId, slotId, patient })`

RU: `prepareAppointment({ doctorId, slotId, patient })`

Визуал: `prepareAppointment` и статус `prepared`. Переход: сайт всё равно обязан проверить действие.

Что говорить: Третий инструмент заполняет данные и подготавливает запись. Он не завершает значимое действие без участия человека.

### 59. The application validates the action

EN: `The site checks availability, permissions, and patient data.`

RU: `Сайт проверяет доступность, права и данные пациента.`

Визуал: shield вокруг validation, permissions и availability. Переход: после проверки сайт обновляет привычный UI.

Что говорить: Схема помогает сформировать запрос, но не заменяет безопасность. Приложение повторно проверяет входные данные и право пользователя выполнить операцию.

### 60. The page shows the prepared result

EN: `The selected doctor and slot appear in the normal interface.`

RU: `Выбранные врач и время появляются в обычном интерфейсе.`

Визуал: заполненная карточка записи с врачом и временем. Переход: финальное решение остаётся у человека.

Что говорить: Человек видит результат работы агента на той же странице. Он может проверить или изменить выбор до подтверждения.

### 61. The person confirms

EN: `The agent handles the routine. The person makes the commitment.`

RU: `Агент выполняет рутину. Человек принимает окончательное решение.`

Визуал: палец над кнопкой Confirm. Ритм: короткая пауза перед нажатием. Переход: теперь отделим пользу для человека от пользы для команды.

Что говорить: Это полезная человеческая модель WebMCP. Агент сокращает путь, но человек сохраняет контроль над действием, которое влияет на его жизнь.

## Part 6. Why people and teams should care

### 62. People delegate interface work

EN: `The person states the goal instead of operating every control.`

RU: `Человек формулирует цель вместо работы с каждым элементом интерфейса.`

Визуал: одна цель пользователя вместо формы с множеством контролов. Переход: делегирование не должно требовать установки коннектора.

Что говорить: Польза начинается с человека. Ему не нужно проходить одинаковые фильтры, формы и промежуточные экраны вручную.

### 63. No connector for every website

EN: `The page provides its tools when the person opens it.`

RU: `Страница предоставляет инструменты, когда человек её открывает.`

Визуал: сайт сам приносит набор tools в открытую вкладку. Переход: исчезает шаг marketplace setup.

Что говорить: В целевой модели пользователь не ищет отдельный коннектор для каждой клиники или магазина. Возможности приходят вместе с выбранным сайтом.

Источник: [WebMCP and MCP comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp)

### 64. No marketplace setup before use

EN: `Page actions do not require a separate local package or config entry.`

RU: `Действия страницы не требуют отдельного локального пакета или записи в конфигурации.`

Визуал: зачёркнутые install, config и manual update. Переход: можно использовать уже существующий вход на сайт.

Что говорить: Это уменьшает ручную настройку и количество решений о доверии. Для человека сайт остаётся обычным сайтом.

### 65. The existing login remains useful

EN: `The agent works with the session already active in the tab.`

RU: `Агент работает с сессией, которая уже активна во вкладке.`

Визуал: один login badge внутри вкладки. Переход: разработчик тоже переиспользует существующее.

Что говорить: Человеку не нужно отдельно передавать API-ключ или проходить второй OAuth-поток для page-local действия.

Источник: [WebMCP proposal benefits](https://webmachinelearning.github.io/webmcp/docs/proposal.html)

### 66. Developers reuse product logic

EN: `The tool can call the same function as the visible interface.`

RU: `Инструмент может вызывать ту же функцию, что и видимый интерфейс.`

Визуал: один JavaScript handler, к которому обращаются UI и tool. Переход: обновление уходит вместе с релизом сайта.

Что говорить: Команда описывает существующую возможность, а не создаёт параллельный продукт. Это снижает риск расхождения правил.

Источник: [WebMCP proposal benefits](https://webmachinelearning.github.io/webmcp/docs/proposal.html)

### 67. Updates ship with the website

EN: `One release can contain the page, the UI, and its agent tools.`

RU: `Один релиз может содержать страницу, UI и инструменты для агента.`

Визуал: один deployment box вместо двух. Переход: агент получает меньше интерфейсного шума.

Что говорить: Инструмент обновляется вместе с приложением. Пользователям не приходится вручную обновлять отдельный пакет из marketplace.

Источник: [WebMCP proposal](https://webmachinelearning.github.io/webmcp/docs/proposal.html)

### 68. The agent receives less context

EN: `A business tool contract is smaller than repeated page observations.`

RU: `Контракт бизнес-инструмента компактнее повторных наблюдений страницы.`

Визуал: маленькая schema рядом с длинным accessibility tree. Переход: меньше наблюдений обычно означает меньше модельных шагов.

Что говорить: Вместо полного дерева страницы агент получает несколько действий и их параметры. Это потенциально оставляет больше контекста для самой задачи.

Источник: [Playwright snapshots](https://github.com/microsoft/playwright.dev/blob/main/mcp/snapshots.mdx), [Lighthouse tool warning](https://developer.chrome.com/docs/lighthouse/agentic-browsing/registered-webmcp-tools)

### 69. The workflow needs fewer model turns

EN: `Explicit actions reduce observation, retries, and verification loops.`

RU: `Явные действия сокращают наблюдение, повторы и циклы проверки.`

Визуал: пять серых model turns превращаются в два цветных. Не показывать выдуманные числа стоимости. Переход: это меняет роль сайта в агентском сценарии.

Что говорить: Меньше шагов обычно означает меньшую задержку и потенциально меньшую стоимость. Универсальные проценты обещать нельзя, результат зависит от сайта, модели и задачи.

Источник: [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/), [Playwright workflow](https://github.com/microsoft/playwright.dev/blob/main/mcp/installation.mdx)

### 70. The website becomes an action provider

EN: `Agents can use the site inside a larger user workflow.`

RU: `Агенты могут использовать сайт внутри более крупного пользовательского сценария.`

Визуал: сайт как один исполняемый этап внутри пользовательского workflow. Переход: новые возможности не отменяют безопасность.

Что говорить: Сайт конкурирует уже не только за просмотр страницы. Он может надёжно выполнить часть пользовательской задачи внутри агентского сценария.

### 71. Security still belongs to the product

EN: `The site must validate inputs, permissions, and consequential actions.`

RU: `Сайт должен проверять данные, права и значимые действия.`

Визуал: короткий checklist validation, authorization, confirmation. Переход: кроме обычной безопасности появляется риск недоверенного текста.

Что говорить: WebMCP уменьшает интеграционную сложность, но не отменяет безопасность. Серверная проверка, ограничения доступа и подтверждение важных действий остаются обязательными.

Источник: [WebMCP secure tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools)

### 72. Tool descriptions are untrusted input

EN: `A malicious page can hide instructions inside tool metadata or results.`

RU: `Вредоносная страница может спрятать инструкции в описании инструмента или результате.`

Визуал: нормальное описание tool, внутри которого красным спрятана вредоносная инструкция. Переход: чувствительность выше в авторизованном браузере.

Что говорить: WebMCP делает взаимодействие структурированным, но модель всё равно читает текст сайта. Tool poisoning и indirect prompt injection остаются возможными, поэтому агент должен маркировать недоверенный контент и ограничивать его объём.

Источник: [Agent security considerations for WebMCP](https://developer.chrome.com/docs/agents/security)

### 73. Browser context can contain sensitive data

EN: `Tools must not silently combine data from unrelated origins.`

RU: `Инструменты не должны незаметно объединять данные разных origins.`

Визуал: три origins как отдельные острова, между ними закрытые ворота. Переход: даже хороший набор tools может быть слишком большим.

Что говорить: Агент во вкладке может знать историю, местоположение и данные других задач. Спецификация отдельно рассматривает fingerprinting, утечки между origins и границы приватного режима. Браузер и агент должны ограничивать передачу такого контекста.

Источник: [WebMCP security and privacy](https://webmachinelearning.github.io/webmcp/#security-and-privacy-considerations)

### 74. More tools can make the agent worse

EN: `Lighthouse warns when a page registers more than 40 tools.`

RU: `Lighthouse предупреждает, если страница регистрирует больше 40 инструментов.`

Визуал: 40 компактных tool names и 41-й красным. Шутка: "Если у страницы 200 tools, агенту снова нужен поисковик". Переход: отсюда появляется новый вопрос для владельцев сайта.

Что говорить: WebMCP тоже может раздувать контекст. Lighthouse рекомендует показывать только инструменты, полезные для текущего состояния страницы, потому что лишние schemas добавляют токены, задержку и ошибки выбора.

Источник: [Registered WebMCP tools audit](https://developer.chrome.com/docs/lighthouse/agentic-browsing/registered-webmcp-tools)

## Part 7. Agentic SEO and current support

### 75. Agentic browsing changes the SEO question

EN: `A page must be findable and usable by an agent.`

RU: `Страница должна быть доступна для поиска и использования агентом.`

Визуал: два этапа Search finds, Agent acts. Переход: WebMCP описывает вторую половину.

Что говорить: Классическое SEO помогает найти страницу. В агентском вебе этого недостаточно, если агент не может понять и выполнить доступное действие.

Источник: [Chrome agent-ready toolkit](https://developer.chrome.com/blog/agent-ready-toolkit)

### 76. WebMCP describes what a page can do

EN: `The site exposes actions, not only content and links.`

RU: `Сайт предоставляет действия, а не только контент и ссылки.`

Визуал: рядом с title и links появляется блок actions. Переход: эту готовность уже начинают измерять инструменты разработчика.

Что говорить: Для агентского поиска становится важна операбельность. Сайт сообщает, можно ли найти врача, проверить доступность и подготовить запись.

Источник: [Chrome agent-friendly websites](https://developer.chrome.com/docs/ai/agents)

### 77. Lighthouse has Agentic Browsing audits

EN: `Lighthouse evaluates signals that matter to browser agents.`

RU: `Lighthouse проверяет сигналы, важные для браузерных агентов.`

Визуал: реальный screenshot категории Agentic Browsing в Lighthouse. Переход: один из аудитов показывает зарегистрированные tools.

Что говорить: WebMCP уже появился в привычном инструменте веб-разработчика. Экспериментальная категория Agentic Browsing рассматривает WebMCP вместе с доступностью и стабильностью страницы.

Источник: [Lighthouse Agentic Browsing](https://developer.chrome.com/docs/lighthouse/agentic-browsing/)

### 78. Lighthouse lists registered WebMCP tools

EN: `The audit detects imperative and declarative page tools.`

RU: `Аудит обнаруживает императивные и декларативные инструменты страницы.`

Визуал: screenshot списка registered WebMCP tools. Переход: тот же стек постепенно появляется в привычной диагностике сайтов.

Что говорить: Аудит Registered WebMCP tools показывает возможности, которые страница реально объявила. Интеграцию можно увидеть и проверить.

Источник: [Registered WebMCP tools audit](https://developer.chrome.com/docs/lighthouse/agentic-browsing/registered-webmcp-tools)

### 79. PageSpeed Insights shows the same direction

EN: `Agentic readiness is entering mainstream website diagnostics.`

RU: `Готовность к агентам входит в привычную диагностику сайтов.`

Визуал: PageSpeed Insights и Lighthouse рядом, без заявления о ranking. Переход: важно провести границу с классическим SEO.

Что говорить: PageSpeed Insights использует экосистему Lighthouse. Конкретные WebMCP-проверки пока требуют экспериментальной поддержки, но направление уже вошло в привычный контур анализа сайта.

Источник: [Lighthouse Agentic Browsing scoring](https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring), [PageSpeed Insights](https://pagespeed.web.dev/)

### 80. WebMCP is not a confirmed ranking factor

EN: `Treat it as agent readiness, not a promise of higher Google rankings.`

RU: `Это готовность к агентам, а не обещание более высокой позиции в Google.`

Визуал: большой штамп `Not a confirmed ranking factor`. Переход: ещё одна честная граница - зрелость технологии.

Что говорить: Не обещаем SEO-магии. Сегодня WebMCP означает, что сайт становится понятнее и полезнее для агентов. Публичного подтверждения влияния на ранжирование нет.

### 81. WebMCP is still experimental

EN: `The API and browser behavior may change.`

RU: `API и поведение браузеров могут измениться.`

Визуал: label Experimental поверх API. Переход: несмотря на это, инструменты для тестирования уже существуют.

Что говорить: Спецификация развивается и пока не является завершённым веб-стандартом. Могут измениться имена API, разрешения, жизненный цикл инструментов и браузерная интеграция.

Источник: [WebMCP specification status](https://webmachinelearning.github.io/webmcp/)

### 82. Current browser tooling

EN: `Chrome provides flags, Origin Trial, DevTools, and Lighthouse support.`

RU: `Chrome предоставляет флаги, Origin Trial, DevTools и поддержку Lighthouse.`

Визуал: Chrome flag, Origin Trial, DevTools и Lighthouse как четыре строки. Переход: поддержка агентов тоже уже не нулевая.

Что говорить: WebMCP уже можно тестировать в Chrome. Конкретные версии и способы включения нужно проверить перед выступлением, потому что проект быстро развивается.

Источник: [WebMCP implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md), [Chrome WebMCP](https://developer.chrome.com/docs/ai/webmcp/)

### 83. Current agent support

EN: `Compatible agents can discover and invoke tools from the active page.`

RU: `Совместимые агенты могут находить и вызывать инструменты активной страницы.`

Визуал: небольшая support matrix из ChatGPT Desktop, Chrome Origin Trial, Brave и Edge. Добавить дату проверки. Переход: разработчику доступны два способа объявить tool.

Что говорить: Поддержка зависит от клиента. OpenAI документирует WebMCP в своём in-app browser, а экспериментальные инструменты Chrome позволяют тестировать браузерные сценарии.

Источник: [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/)

## Part 8. Try WebMCP today

### 84. Two ways to expose a tool

EN: `JavaScript registration or annotated HTML forms.`

RU: `Регистрация через JavaScript или аннотированные HTML-формы.`

Визуал: слева JavaScript imperative API, справа annotated HTML form. Переход: попробуем это локально.

Код для вставки в презу - declarative API:

```html
<form toolname="checkAvailability"
      tooldescription="Check appointment availability">
  <input name="doctorId" required>
  <button type="submit">Check</button>
</form>
```

Что говорить: Императивный API подходит для действий приложения. Декларативный подход позволяет начать с существующей формы и сохранить участие человека.

Источник: [Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api), [Declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api)

### 85. Enable local testing

EN: `chrome://flags/#enable-webmcp-testing`

RU: `chrome://flags/#enable-webmcp-testing`

Визуал: настоящий screenshot флага `enable-webmcp-testing`. Переход: после включения не нужно сразу менять продукт.

Что говорить: Для локального эксперимента включаем поддержку WebMCP в Chrome. Это шаг разработчика во время тестирования, а не будущее требование к каждому посетителю сайта.

Источник: [Chrome WebMCP local testing](https://developer.chrome.com/docs/ai/webmcp/)

### 86. Open the official booking demo

EN: `Inspect the tools before changing your own product.`

RU: `Сначала изучите инструменты официального демо.`

Визуал: QR официального booking demo и его screenshot. Переход: следующий шаг - открыть DevTools.

Что говорить: В официальном демо виден полный цикл регистрации, обнаружения, вызова и изменения интерфейса. Это быстрый способ понять модель руками.

Источник: [Official booking demo](https://googlechromelabs.github.io/webmcp-tools/demos/explainer/)

### 87. Run a tool in DevTools

EN: `Review the schema, invoke the tool, and inspect the result.`

RU: `Проверьте схему, вызовите инструмент и изучите результат.`

Визуал: настоящий WebMCP panel с schema и invoke. Переход: после демо добавляем одно безопасное действие.

Что говорить: Панель WebMCP в DevTools позволяет проверить контракт без полноценного агента. Так проще отделить ошибки сайта от ошибок выбора модели.

Источник: [WebMCP DevTools panel](https://developer.chrome.com/docs/devtools/application/webmcp)

### 88. Add one safe action

EN: `Start with search, filtering, preview, or availability.`

RU: `Начните с поиска, фильтрации, предпросмотра или доступности.`

Визуал: одна read-only карточка `checkAvailability`. Переход: заканчиваем конкретным обещанием аудитории.

Код для вставки в презу:

```js
await document.modelContext.registerTool({
  name: 'checkAvailability',
  description: 'Check available appointment slots.',
  inputSchema: { type: 'object', properties: {
    doctorId: { type: 'string' }, date: { type: 'string' },
  } },
  execute: async ({ doctorId, date }) => getSlots({ doctorId, date }),
  annotations: { readOnlyHint: true },
});
```

Что говорить: Не начинаем с покупки или удаления. Один read-only инструмент даст команде опыт и не создаст высокий риск для пользователя.

### 89. Questions

EN: `Try one WebMCP tool this week`

RU: `Попробуйте один WebMCP-инструмент на этой неделе`

EN: `[Name] / [contact] / [short.link/webmcp]`

RU: `[Имя] / [контакт] / [короткая ссылка на материалы]`

Визуал: имя, контакт, QR материалов и одна фраза `Try one tool this week`. Шуток нет. Финал должен звучать как действие, а не как резюме документации.

Что говорить: Финальный призыв простой: не ждать стабильности всей платформы, а попробовать один безопасный инструмент на реальной странице. Оставляем контакты и ссылку на демо, документацию и исходный код.

## Appendix - copy-paste WebMCP demo

Этот пример можно показать отдельным code slide или разрезать на два слайда. Он намеренно короткий: функция приложения остаётся общей для UI и WebMCP, а форма сохраняет ручное подтверждение.

### Imperative API

```js
async function findDoctors({ specialty, afterTime }) {
  const params = new URLSearchParams({ specialty, afterTime });
  const response = await fetch(`/api/doctors?${params}`);
  return response.json();
}

if (document.modelContext) {
  await document.modelContext.registerTool({
    name: 'findDoctors',
    description: 'Find doctors by specialty after a given time.',
    inputSchema: {
      type: 'object',
      properties: {
        specialty: { type: 'string' },
        afterTime: { type: 'string' },
      },
      required: ['specialty', 'afterTime'],
    },
    execute: findDoctors,
  });
}
```

### Declarative API with human confirmation

```html
<form toolname="checkAvailability"
      tooldescription="Check appointment availability for a doctor.">
  <label>
    Doctor ID
    <input name="doctorId" required>
  </label>
  <label>
    Date
    <input name="date" type="date" required>
  </label>
  <button type="submit">Check availability</button>
</form>
```

Без `toolautosubmit` браузер заполнит форму, но финальный submit останется за человеком.

## Complete comparison - MCP, browser automation, and WebMCP

| Критерий | MCP | Browser automation | WebMCP | Источник |
|---|---|---|---|---|
| Главная задача | Постоянно подключать агентов к backend-сервисам, данным и workflows | Управлять сайтом без специальной поддержки со стороны разработчика | Дать агенту структурированные действия активной страницы | [Chrome comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp) |
| Лучший сценарий | Фоновые задачи, корпоративные системы, регулярные интеграции | Разовый доступ к сайту, который не предоставляет agent tools | Совместная работа человека и агента на выбранном сайте | [WebMCP explainer](https://github.com/webmachinelearning/webmcp) |
| Жизненный цикл | Persistent server или локальный процесс | Пока существует browser session | Ephemeral и tab-bound | [Chrome comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp) |
| Открытая страница | Не требуется | Обычно требуется browser context | Обязательна для основного сценария | [WebMCP limitations](https://developer.chrome.com/docs/ai/webmcp/) |
| Фоновая работа | Сильная сторона | Возможна в headless browser | Не основной сценарий | [WebMCP non-goals](https://github.com/webmachinelearning/webmcp) |
| Возможности протокола | Tools, resources, prompts и дополнительные protocol features | Низкоуровневые browser actions и наблюдения | Page tools с descriptions, schemas и execution | [MCP server primitives](https://modelcontextprotocol.io/specification/draft/server/index), [WebMCP spec](https://webmachinelearning.github.io/webmcp/) |
| Отдельный сервер | Требуется локальный или remote MCP server | Требуется browser tool, runtime или встроенная поддержка | Для page-local tool не требуется | [WebMCP proposal](https://webmachinelearning.github.io/webmcp/docs/proposal.html) |
| Установка пользователем | Сервер или подключение обычно нужно добавить в client | Инструмент автоматизации должен присутствовать в client | Инструменты появляются при открытии поддерживаемой страницы | [VS Code MCP setup](https://code.visualstudio.com/docs/agent-customization/mcp-servers), [Chrome comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp) |
| Discovery | Registry, marketplace, конфигурация или server discovery | URL и наблюдение страницы | После посещения страницы через browser mediation | [MCP Registry](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/), [WebMCP proposal limitations](https://webmachinelearning.github.io/webmcp/docs/proposal.html) |
| Авторизация | OAuth, bearer tokens или локальные credentials | Browser profile или отдельная сессия | Состояние и авторизация активной страницы | [MCP authorization](https://apps.extensions.modelcontextprotocol.io/api/documents/authorization.html), [Chrome comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp) |
| Текущее состояние UI | Автоматически недоступно | Восстанавливается из DOM, accessibility tree или pixels | Доступно коду открытой страницы | [WebMCP explainer](https://github.com/webmachinelearning/webmcp) |
| Видимый контроль человека | Зависит от MCP client и реализации | Человек может наблюдать browser actions | UI и human confirmation являются частью основной модели | [WebMCP proposal](https://webmachinelearning.github.io/webmcp/docs/proposal.html) |
| Расход контекста | Tool definitions и tool results | Tool schemas, повторные snapshots, screenshots и проверки | Набор tools текущей страницы и их результаты | [Playwright snapshots](https://github.com/microsoft/playwright.dev/blob/main/mcp/snapshots.mdx), [Lighthouse tool warning](https://developer.chrome.com/docs/lighthouse/agentic-browsing/registered-webmcp-tools) |
| Количество модельных шагов | Обычно близко к числу бизнес-вызовов | Может включать наблюдение и проверку каждого UI-шагa | Может приблизить сценарий к числу бизнес-действий | [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/), [Playwright workflow](https://github.com/microsoft/playwright.dev/blob/main/mcp/installation.mdx) |
| Устойчивость к редизайну | Высокая, если server contract стабилен | Селекторы, refs и координаты могут устареть | Tool связан с логикой приложения, а не с расположением кнопки | [Chrome comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp) |
| Повторное использование frontend-логики | Обычно нужен отдельный backend adapter | Разработчик сайта может не участвовать | Tool может вызывать существующую функцию приложения | [WebMCP proposal](https://webmachinelearning.github.io/webmcp/docs/proposal.html) |
| Обновление | Remote server обновляет владелец, local package может требовать обновления | Обновляется browser tool и иногда сценарий автоматизации | Tool обновляется вместе со страницей | [VS Code MCP management](https://code.visualstudio.com/docs/agent-customization/mcp-servers), [WebMCP proposal](https://webmachinelearning.github.io/webmcp/docs/proposal.html) |
| Инфраструктура владельца сайта | Deployment, monitoring, auth и support MCP server | Специальная server integration не обязательна | Интеграция находится в frontend, сложные actions всё равно обращаются к backend | [WebMCP proposal](https://webmachinelearning.github.io/webmcp/docs/proposal.html) |
| Риск локального кода | Local MCP server может выполнять произвольный код | Local browser tool также требует доверия | Отдельный пакет сайта не устанавливается | [VS Code MCP trust](https://code.visualstudio.com/docs/agent-customization/mcp-servers) |
| Prompt injection | Возможна через metadata, resources и tool results | Возможна через видимый и скрытый контент страницы | Возможна через tool metadata и outputs | [MCP skills security](https://skills.extensions.modelcontextprotocol.io/specification/stable/skills), [WebMCP agent security](https://developer.chrome.com/docs/agents/security) |
| Privacy risk | Зависит от server, client и передаваемых данных | Browser tool может видеть содержимое активной сессии | Особое внимание к origins, fingerprinting и cross-site data | [WebMCP security](https://webmachinelearning.github.io/webmcp/#security-and-privacy-considerations) |
| Масштаб tool list | Клиент может подключить много серверов и schemas | Универсальный browser server содержит много low-level tools | Lighthouse предупреждает при более чем 40 page tools | [MCP listTools](https://ts.sdk.modelcontextprotocol.io/v2/clients/calling), [Lighthouse audit](https://developer.chrome.com/docs/lighthouse/agentic-browsing/registered-webmcp-tools) |
| Поддержка платформ | Широкая и не привязана к браузеру | Широкая, зависит от выбранного инструмента | Пока ограниченная и экспериментальная | [WebMCP implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md) |
| Зрелость | Production use и развивающаяся спецификация | Зрелые browser automation frameworks, агентский слой развивается | Draft Community Group Report и Origin Trials | [MCP roadmap](https://blog.modelcontextprotocol.io/posts/mcp-roadmap/), [WebMCP status](https://webmachinelearning.github.io/webmcp/) |
| Основной плюс | Универсальный постоянный контракт между агентом и системой | Работает даже без участия владельца сайта | Удобство для человека плюс структурированный доступ к живой странице | Сводный вывод из источников выше |
| Основной минус | Setup, auth, infrastructure и trust для каждой integration boundary | Контекст, model turns, latency и хрупкость UI inference | Требует поддержки страницы, браузера и агента, не подходит для всего | Сводный вывод из источников выше |

## Research links - not presentation slides

### MoscowJS requirements

- [Official MoscowJS speaker checklist](https://moscowjs.org/cfp/)
- [MoscowJS event format](https://moscowjs.org/brief/)

### Other WebMCP presentations and talks

- [WebMCP - Making the Web AI-Agent Ready](https://speakerdeck.com/markusingvarsson/webmcp-making-the-web-ai-agent-ready)
- [Beyond the UI: Web Applications in the Age of Agents](https://slides.com/adrianfaciu/beyond-the-ui)
- [Introducing WebMCP: Agents in the Browser](https://aietalks.com/talks/introducing-webmcp-agents-in-the-browser)
- [W3C WebMCP presentation](https://www.w3.org/2024/01/webevolve-series-events/annual-2025/slides/lingyan-zhao.pdf)

### WebMCP primary sources

- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [WebMCP overview](https://developer.chrome.com/docs/ai/webmcp/)
- [WebMCP and MCP comparison](https://developer.chrome.com/docs/ai/webmcp/compare-mcp)
- [Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Declarative API](https://developer.chrome.com/docs/ai/webmcp/declarative-api)
- [WebMCP security](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [WebMCP implementation status](https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md)

### Browser automation and token context

- [Official Playwright MCP repository](https://github.com/microsoft/playwright-mcp)
- [Playwright MCP workflow](https://github.com/microsoft/playwright.dev/blob/main/mcp/installation.mdx)
- [Playwright accessibility snapshots](https://github.com/microsoft/playwright.dev/blob/main/mcp/snapshots.mdx)
- [Playwright vision mode](https://github.com/microsoft/playwright.dev/blob/main/mcp/vision-mode.mdx)
- [Chrome DevTools for agents](https://developer.chrome.com/docs/devtools/agents)
- [OpenAI computer tool API](https://platform.openai.com/docs/api-reference/responses-streaming/response/refusal?lang=python)

### SEO and agentic browsing sources

- [Lighthouse Agentic Browsing](https://developer.chrome.com/docs/lighthouse/agentic-browsing/)
- [Registered WebMCP tools audit](https://developer.chrome.com/docs/lighthouse/agentic-browsing/registered-webmcp-tools)
- [PageSpeed Insights](https://pagespeed.web.dev/)

### Current demos and evidence

- [Official WebMCP demos and inspector](https://github.com/GoogleChromeLabs/webmcp-tools)
- [Official booking demo](https://googlechromelabs.github.io/webmcp-tools/demos/explainer/)
- [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/)
- [GoogleChromeLabs WebMCP examples](https://github.com/GoogleChromeLabs/webmcp-tools/blob/main/AWESOME_WEBMCP.md)
- [WindTunnel benchmark](https://webmcp.com/benchmark)

### MCP context

- [MCP introduction](https://www.anthropic.com/news/model-context-protocol)
- [Official MCP Registry](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/)
- [Installing and trusting MCP servers in VS Code](https://code.visualstudio.com/docs/agent-customization/mcp-servers)

### Narrative source

- [WebMCP: второй интерфейс веба](./webmcp.md)
