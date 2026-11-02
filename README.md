<div align="center">

<img src="assets/img/banner.jpg" alt="LuminSDK — mais de 1.100 jogos no navegador" width="100%">

# LuminSDK

**Mais de 1.100 jogos para jogar direto no navegador. Sem download. Sem cadastro. Sem instalação.**

[![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-8b5cf6?style=flat-square)](LICENSE)
[![Jogos](https://img.shields.io/badge/jogos-1.100%2B-22d3ee?style=flat-square)](https://suckinguptoessry.github.io/LuminSDK/)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-online-34d399?style=flat-square)](https://suckinguptoessry.github.io/LuminSDK/)
[![PRs](https://img.shields.io/badge/PRs-bem--vindos-f472b6?style=flat-square)](CONTRIBUTING.md)
[![Open Source](https://img.shields.io/badge/open--source-sim-6366f1?style=flat-square)](LICENSE)

[🌐 Site](https://suckinguptoessry.github.io/LuminSDK/) ·
[🐛 Issues](https://github.com/SuckingUpToesSry/LuminSDK/issues) ·
[📚 Documentação do LuminSDK](https://docs.luminsdk.com/) ·
[🇺🇸 English version](README.en.md)

</div>

---

## Sobre

O **LuminSDK** é um site open-source de jogos de navegador: um catálogo com mais de **1.100 jogos**
carregados pelo [LuminSDK](https://docs.luminsdk.com/) e apresentado com uma interface própria,
feita do zero para este projeto — busca instantânea, filtro por categoria, ordenação, seleção
aleatória, paginação e um player em tela cheia.

O objetivo é simples: **abrir a página e jogar**, sem contas, sem downloads e sem instalação.

| | |
|---|---|
| **Site** | https://suckinguptoessry.github.io/LuminSDK/ |
| **Autor** | Ryan Smith |
| **Licença** | MIT |
| **Tecnologias** | HTML, CSS e JavaScript puro (sem build, sem dependências) |
| **Catálogo** | LuminSDK (`cdn.jsdelivr.net/gh/luminsdk/script@latest`) |

> Este projeto **não** hospeda nem redistribui jogos. Ele é um cliente da API pública do LuminSDK;
> cada jogo pertence aos seus respectivos autores.

---

## Recursos

- 🎮 **Catálogo completo** — mais de 1.100 jogos servidos pelo LuminSDK, em grade densa de até **9 colunas**.
- ❤️ **Favoritos** — salve jogos com um clique no coração; eles ficam guardados no seu navegador.
- 🕘 **Continuar jogando** — histórico dos últimos jogos abertos, com um toque para voltar.
- 🎛️ **Grade sob medida** — sliders de **colunas** e **linhas** + botões de **tamanho do card** (P/M/G): escolha exatamente quantos jogos quer ver (a paginação se ajusta sozinha).
- 🖌️ **Cor por jogo** — cada jogo pode ter sua própria cor (borda, capa e destaque), salva no navegador.
- 🎛️ **Personalização (21 opções)** — tema, 16 cores prontas, fonte, cantos, densidade, velocidade das animações e 17 interruptores de efeitos (partículas, parallax, cursor, desfoques, hover, Y2K, cromado, vidro, neon, glow, estrelas, bolhas, grade, ruído e scanlines). Há detecção automática, modos **leve** / **completo** e uma **sugestão personalizada** montada a partir do seu aparelho e do seu histórico.
- ✦ **Para você** — trilho de recomendações montado a partir das categorias que você mais joga e dos favoritos; dá para trocar a seleção ou esconder por hoje.
- 🎯 **Desafios do dia** — três metas sorteadas pelo dia (partidas, minutos, variedade, categoria e sessão da noite), com progresso, sequência de dias e aviso ao concluir.
- 🏆 **Conquistas** — 17 medalhas locais (primeira partida, maratonas, sequências de dias, madrugada, favoritos…) com aviso na tela e progresso salvo no navegador.
- 📊 **Estatísticas do jogador** — partidas, tempo total, jogos diferentes, sequência de dias, últimos 7 dias em gráfico, categorias favoritas e os jogos mais jogados.
- ✨ **Visual Y2K** — títulos cromados, botões de vidro, bolhas subindo, campo de estrelas, scanlines e cantos de bolha — cada efeito pode ser desligado individualmente.
- 📦 **Backup** — exporte e importe favoritos, histórico, cores e grade em um JSON.
- 🎁 **Bônus** — central de ferramentas: testador de controle (pensado para o controle e o navegador do Xbox), monitor de conexão e gerenciador de cache.
- 🎨 **Paleta de cores** — 12 cores prontas + seletor livre e matiz: o site inteiro (botões, brilhos, partículas e cursor) muda na hora e fica salvo.
- ✨ **Atmosfera viva** — partículas em canvas na cor escolhida (com halo, cintilância e brilho que segue o mouse), fundo em parallax e cursor personalizado com anel luminoso. Vêm ligados por padrão — inclusive com "reduzir movimento" no sistema, que desliga a animação mas mantém os pontos reagindo ao mouse.
- 🔗 **Um endereço só** — `…/LuminSDK/` e nada mais: busca, categoria, página, favoritos e jogo aberto não mexem na URL.
- 🛟 **Resiliente** — tenta de novo automaticamente, avisa quando você está offline e oferece modo demonstração (`?demo`).
- 🔎 **Busca com debounce** — resultados enquanto você digita, com estado vazio inteligente.
- 🏷️ **Categorias dinâmicas** — carregadas do próprio SDK, em chips responsivos.
- 🔀 **Jogo aleatório** — botão para quem não quer escolher.
- 🖥️ **Player próprio** — tela cheia, reiniciar, abrir em outra aba e carregamento com skeleton.
- 🌗 **Tema claro e escuro** — preferência salva em `localStorage`, com respeito a `prefers-reduced-motion`.
- ⚡ **Zero dependências** — sem framework, sem bundler; só `index.html`, um CSS e dois scripts.
- ♿ **Acessível** — navegação por teclado, foco visível, `aria-live` nos resultados e textos alternativos.
- 📲 **Instalável (PWA)** — manifest, ícones e service worker: dá para instalar como app e abrir offline a casca do site.
- 🛟 **À prova de falhas** — se a interface própria não carregar, o site cai automaticamente
  para a interface original do LuminSDK; se nada carregar, há um modo demonstração (`?demo`).

---

## Uma URL só, oito abas e o LuminOS por perto

**Tudo acontece em `https://suckinguptoessry.github.io/LuminSDK/`** — nada depois da última barra.

Ao abrir, o site **já cai no portal de estudos** (o disfarce). Não existe mais tela de escolha:
quem quiser o catálogo de jogos clica em **Ryan Smith** no rodapé dos estudos, ou Shift + D / Alt + S.
O **LuminOS** não é uma aba: ele é um **site do acervo** (`dylanmc.site`), que abre no navegador do
site como qualquer outro. A escolha de modo fica só nesta sessão (`luminsdk:v1:mode`) e a URL
continua idêntica em tudo.

| Modo | O que é |
|---|---|
| **OS** | O **LuminOS**: área de trabalho escura com papel de parede, dock, janelas que arrastam, minimizam e maximizam, atalhos na mesa e apps de verdade (Central, Perfil, Jogos, Laboratório, Estúdio, Arcade, Cofre, Comunidade, Filmes, Navegador, Sites, Chat, Notas, Calculadora, Ajustes e Sobre). |
| **Normal** | O site como sempre foi: catálogo de jogos, abas na lateral e o portal de estudos. |
Trocar de aba, buscar, filtrar favoritos, abrir as configurações, jogar, abrir os estudos, nada disso
mexe no endereço: sem `/gn/`, sem `/sites/`, sem `#/algo`, sem `?cat=`. Se você copiar a URL no meio
de um jogo, ela continua sendo só `…/LuminSDK/`.

Como isso funciona (`assets/js/app.js`):

- cada aba é um bloco `.app-view` dentro do **mesmo** `index.html`;
- o clique numa aba (ou atalho) só troca qual bloco aparece — `history` nunca é tocado;
- a aba escolhida fica em `sessionStorage` (`luminsdk:v1:start`), então recarregar a página mantém a
  aba em que você estava, ainda com a mesma URL;
- CSS e JS de cada aba são baixados **na primeira vez** que ela abre, e só a folha da aba ativa fica
  ligada (a dos estudos é clara e não vaza para o resto).

São **oito abas** na barra da esquerda, cada uma no seu papel:

| Grupo | Aba | O que é |
|---|---|---|
| Catálogos | **Lumin** | O catálogo principal, servido pela API do LuminSDK — como sempre foi. |
| | **GN-Math** | Biblioteca paralela com o acervo público do GN-Math: visual, ajustes, cursor, favoritos e histórico próprios. |
| | **DuckMath** | Catálogo do DuckMath **aqui dentro**: os 8 endereços da coleção, com filtro por tipo, busca e modo minimal. |
| | **Astra** | Mesma coisa com os 25 endereços da coleção Astra. |
| Ferramentas | **Sites** | As 67 coleções que abrem **dentro** do LuminSDK, num visualizador próprio. |
| | **Nav** | O **navegador** do site: barra de endereço, home com o acervo e aba limpa. |
| | **Estudos** | O StudyDesk: portal de estudos (matérias, recursos, planejador, teste rápido e FAQ). Serve de **disfarce** e de ferramenta de estudo. É a aba que abre por padrão. |

### Catálogos de provedor (abas DuckMath e Astra)

As duas abas não jogam você para fora do site: elas montam o **próprio catálogo** com os endereços
daquela coleção em `assets/data/sites.json` (`assets/js/provider.js`).

- filtros por tipo — **Tudo, Jogos, Ports, Servidores, Cloud gaming, Visuais, Estudos** — com a
  contagem em cada chip; filtro sem nenhum item simplesmente não aparece;
- campo de busca por nome, endereço ou coleção;
- botão **Tudo / Minimal** para alternar entre grade de capas e lista compacta;
- ao clicar num item, ele abre **embutido** (`#pv-frame`), com recarregar, tela cheia, **aba limpa** e
  **Esc** para fechar. Se o site recusar o iframe, aparece o aviso honesto em 9 segundos — nada de
  fingir que abriu.

O tipo de cada item vem de um classificador por palavra-chave (nome, endereço e coleção), então pode
haver um ou outro jogo caindo em “Jogos” por padrão — é aproximado, não uma curadoria manual.

### Navegador (aba Nav)

O navegador abre sites **dentro** da página, com três tentativas honestas:

1. iframe direto, com `referrerpolicy="no-referrer"`;
2. recarga com cache-buster, para sair de um `about:blank` teimoso;
3. **aba limpa**: uma janela `about:blank` recebe uma tela de carregamento e quem navega é esta
   página (`location.replace`), com `opener` cortado e sem referrer.

Se o site continuar em branco, o aviso aparece com **“Abrir em aba limpa”** e **“Tentar aqui de novo”**.

> **Sobre Lightspeed, BlueCore, GoGuardian e afins:** quando o bloqueio vem de uma extensão ou da
> rede da escola, ele acontece **fora** da página — nenhum JavaScript do site consegue desligá-lo. O
> que o LuminSDK faz é o caminho limpo (aba solta, sem referrer, sem vínculo), que às vezes passa por
> filtros que só olham a origem, e avisa com clareza quando não deu. Nada de fingir sucesso.

As pastas `gn/`, `sites/` e `study/` continuam existindo apenas como **atalhos de compatibilidade**:
quem tiver o endereço antigo salvo é levado de volta para `…/LuminSDK/` já na aba certa.

### LuminOS (modo OS)

O modo OS é uma área de trabalho de verdade dentro da mesma página:

- **janelas** arrastáveis, com minimizar, maximizar, fechar, encaixar nas laterais e posição/tamanho
  lembrados por app (no celular abrem em tela cheia);
- **dock** com dezesseis apps (em duas linhas no celular, nunca escondidos atrás de rolagem) e **atalhos** na mesa;
- **Central**: busca global (apps, jogos, sites, notas e ajuda), lançador de apps com categorias,
  fixados e mais
  usados, gerenciador de janelas (encaixar nas laterais, centralizar, cascata, fechar todas), diagnóstico
  do navegador classificado em **compatível / limitado / indisponível / não testado**, áreas de
  trabalho e janelas (focar, encaixar, mover de área), monitor de
  desempenho medido na hora (FPS, tarefas longas, memória quando exposta), mapa de armazenamento e cache
  com confirmação, ajuda interna e a página de versão;
- **papéis de parede** (aurora, meia-noite, floresta, papel) e **cor de destaque** salvos em
  `luminsdk:v1:os`;
- **controle e teclado**: com um gamepad conectado, o direcional anda pelos controles da janela ativa,
  **A** ativa e **B** fecha a janela (desligado dentro do player, onde o controle é do jogo);
- **quatro áreas de trabalho**: cada janela vive numa área (`Alt`+`1`…`4` ou o botão *Área N* no topo),
  com contagem por área, mudança de área da janela ativa e tudo salvo em `luminsdk:v1:os:ws`;
- **alternador de janelas**: `Alt`+`` ` `` percorre as janelas da área com um HUD clicável;
- **dock configurável**: ordem, apps fora do dock e auto-hide no botão *Ajustar*, salvos em
  `luminsdk:v1:os:dock`, com “restaurar padrão”;
- **atalhos remapeáveis** em *Ajustes → Atalhos internos* (conflito é recusado, `Esc` cancela, nada é
  capturado dentro de campos de texto), salvos em `luminsdk:v1:os:keys`;
- **Jogos**: os 848 títulos do acervo GN-Math, com capa (quatro espelhos e monograma se falhar) e
  player embutido com volta ao acervo, recarregar e abrir em outra aba;
- **Navegador**: barra de endereço, home com as coleções principais e aviso honesto quando o site
  recusa ser embutido;
- **Sites**: as 67 coleções em lista pesquisável (abrem no Navegador);
- **Perfil**: XP, nível, conquistas, desafios diários, coleções, resenhas e retrospectiva, tudo em
  `luminsdk:player:v1` (veja `assets/js/player.js`);
- **Laboratório**: testa controle (analógicos, gatilhos, vibração), mapeia teclado e mouse, mede latência
  de entrada e faz o diagnóstico do navegador (tela, FPS, armazenamento, bateria, recursos);
- **Estúdio**: papel de parede, cor de destaque (inclusive personalizada), densidade, tipografia e os
  modos **Lite**, **Imersivo**, **sem animação** e **alto contraste**, além da **paleta de comandos**
  (`Ctrl/⌘ + K`) e da **central de avisos**;
- **avisos por categoria** no Estúdio: conquistas/XP e sistema podem ser desligados separadamente e
  categoria desligada não é gravada;
- **Arcade**: alvo rápido, roleta de jogo, desafio diário, bichinho virtual, quiz, soundboard com WebAudio
  (nada de arquivo de áudio), cronômetro, conversor de unidades e curiosidades;
- **Cofre**: backup completo em `.json` (exportar/importar), códigos por app (`LUM-PREF-…`, `LUM-PLAY-…`,
  `LUM-PET-…`), mapa de ocupação do armazenamento e o cantinho do desenvolvedor (novidades, status dos
  assets, registro de erros da sessão, preferências cruas e playground);
- **Comunidade**: coleções por código (`LUM-COLL-…`), pacotes prontos, recomendações que rodam na sua
  máquina e wishlist compartilhável — **sem** login, nuvem ou perfil público inventado;
- **Notas** (salvas no navegador), **Calculadora**, **Ajustes** e **Sobre**;
- o **chat** e a **presença** são os mesmos do resto do site.

Essas ferramentas também existem **fora do OS**: a aba **Hub** (no rail, ao lado de Sites, Nav e
Estudos) monta Central, Perfil, Laboratório, Estúdio, Arcade, Cofre e Comunidade numa moldura escura, sem
janelas nem dock — é o mesmo código (`assets/js/hub.js` chama o `render()` de cada app). A cor de
destaque, a densidade e a tipografia escolhidas no Estúdio aparecem aqui também; papel de parede e
modo imersivo continuam sendo só do desktop.

### Presença ao vivo e chat global

Duas peças flutuantes acompanham o site — e somem nos estudos, na tela de entrada e **enquanto um
jogo está aberto**, voltando quando ele fecha:

- **Contador de pessoas** no canto (`1 pessoa online`): cada aba anuncia presença a cada 15 s e o
  número conta quem apareceu nos últimos 75 s.
- **Chat global**: sem cadastro — a pessoa digita um nome e já fala. A lista guarda **100 mensagens**
  no navegador (`luminsdk:v1:chat`): quando a 101ª chega, a mais antiga sai, uma de cada vez. A
  conversa tenta viajar entre visitantes pelo relé público do `ntfy.sh`; se o relé não responder, o
  chat continua funcionando entre as abas do mesmo navegador (`BroadcastChannel`) e o painel avisa
  **“modo local”** — nunca finge que enviou.

> O site é estático (GitHub Pages), então **não existe servidor de banco de dados**: as mensagens
> ficam no navegador de quem lê e, quando o relé público está disponível, chegam a quem estiver online.
> O limite de 100 vale para essa lista.

### Aba Sites (site dentro de site)

A aba Sites reúne **67 coleções / 749 links** já limpos, sem duplicatas e com o nome certo em cada
um: **Jogos** (Eaglercraft, Frogies Arcade, GTA V Port, Subway Surfers, Super Mario 64), **Pacotes**
(Flight Academy com 34 subdomínios, C00lKid, Bagatz) e **Estudo** (Revault, Fern, Solara, Astra,
Aether, Opium, Galaxy, Duck Math, GN-Math, LuminalOS, N7x, Study do Petezah, CatClass/cat4z, Bull 33, Bonus, Aurora,
DogeUB, Tung Tung, Velara, Selenite, Cherri, Voya, Xylora, Interstellar, Utopia, Rook, Kite, mais os
espelhos agrupados por domínio: `tribeoftwo.com`, `streetdirectory.sg`, `solidaritysafaris.com`,
`rusticrivergear.com`, `nextcomm.com.ar`, `amazonaws.com`, `govt.hu`, `lirr.space` e outros).
Cada coleção tem uma **imagem própria**: arte local para LuminSDK, Links, LuminalOS, N7x, Aurora,
Solara, Galaxy V7, Revault e Petezah; logo oficial para Astra, Duck Math, Opium, Fern, Cherri e as
que já tinham — e, se a imagem não carregar, o monograma colorido assume.

Cada coleção é uma linha fechada — logo (ou monograma colorido), nome, quantidade de links e
categoria. Ao abrir, os links aparecem em grade compacta: clicar abre o site **ali dentro**, e o
botão `↗` abre em nova aba. Há busca instantânea (nome e endereço) e filtros **Tudo / Jogos /
Pacotes / Estudo** — tudo sem mexer na URL (o estado fica só na memória).

O visualizador tem barra de título, **recarregar**, **tela cheia**, **abrir em nova aba** e
**fechar** (`Esc`). As linhas só são construídas quando a coleção abre, então a página continua
leve mesmo com centenas de links.

Arte da aba: `assets/img/sites-hero.jpg` (1440 px) e `sites-hero-sm.jpg` (760 px, telas pequenas).

### Aba limpa: quando o site recusa abrir aqui dentro

Muitos desses endereços enviam `X-Frame-Options`/`Content-Security-Policy` e **recusam** ser
embutidos — o iframe fica em branco e não existe código no LuminSDK capaz de contornar isso (é o
navegador obedecendo o site hospedado).

O que o LuminSDK faz, então:

1. **Tenta aqui dentro** normalmente.
2. Se a página não carregar em 10 s (ou carregar instantaneamente em branco), o endereço é guardado
   no `localStorage` e o site passa a abrir numa **aba limpa**: uma aba `about:blank` na qual o
   LuminSDK escreve uma tela de carregamento e **quem navega é a página do LuminSDK**
   (`win.location.replace(url)`), não um script escrito dentro da aba em branco — assim o destino
   abre de verdade, com `referrer` desligado e `window.opener` cortado. É a mesma página, o mesmo
   estudo, só que numa aba sem vínculo com a anterior — o que faz vários filtros de escola/rede
   liberarem. Se o navegador bloquear pop-up, o link abre direto em outra aba (e, no pior caso,
   carrega na aba atual) — nunca fica sem resposta.
3. A nota do visualizador continua ali com **“Abrir em nova aba”** e **“Tentar aqui dentro”**
   (essa última limpa a marcação).
4. O botão **“Abrir em nova aba”** nos filtros liga esse modo para *todos* os sites, se você preferir
   sempre assim. O `↗` de cada linha também passa pela aba limpa.

> A lista de endereços que falharam fica só no seu navegador (`luminsdk:v1:sites:blocked`), nunca no
> repositório.

Para adicionar, renomear ou remover links, edite **`assets/data/sites.json`** — é a única fonte de
dados da aba e não precisa de build:

```json
{ "v": 2, "families": [
  { "id": "solara", "name": "Solara", "cat": "estudo", "logo": "https://…/logo.png",
    "sites": [ { "name": "solara", "url": "https://solara.polimont.com.br/" } ] }
] }
```

`cat` aceita `jogos`, `pacotes` ou `estudo`. `logo` é opcional (sem logo, a coleção ganha um monograma
com cor derivada do nome). Crédito aos links originais: **ByePassHub** (GitHub), citado no rodapé da aba.

### Aba Estudos (StudyDesk) e o disfarce

A aba Estudos é uma página **clara, de escola**, isolada do resto do site: matérias, recursos
com busca e filtro, planejador de tarefas com barra de progresso, **cronômetro de foco** (25/10/5
min), **teste rápido** de 5 perguntas com correção na hora e uma seção de **FAQ** com seis perguntas.
Nada ali puxa jogos — é só estudo mesmo, e funciona como ferramenta de verdade.

O layout segue uma grade só: cabeçalho fixo com navegação, capa com busca e um cartão de números,
seis matérias em cartões iguais (cada uma com os seus temas e um botão que já filtra o acervo),
biblioteca de recursos em lista, planejador em duas colunas com o cronômetro num cartão escuro,
teste rápido, dúvidas em duas colunas e um rodapé curto. Sem barras laterais, sem blocos soltos.

**O site abre SEMPRE nos estudos.** Quem digita `…/LuminSDK/` cai direto no StudyDesk (a URL continua
idêntica), mesmo com histórico, preferências ou “última aba” salvos — a aba anterior **não** é
restaurada. O catálogo de jogos aparece quando a pessoa:

- clica em **Ryan Smith** no rodapé do StudyDesk, ou
- aperta **`Shift` + `D`** (ou **`Alt` + `S`**), a *combinação de duas teclas* que alterna entre os
  estudos e o site em qualquer aba.

| Ação | O que acontece |
|---|---|
| abrir `…/LuminSDK/` | cai nos estudos |
| **`Shift` + `D`** / **`Alt` + `S`** | alterna estudos ⇄ site (funciona em qualquer aba, até dentro do jogo) |
| Aba **Estudos** na barra da esquerda | abre os estudos |
| clicar em **Ryan Smith** no rodapé dos estudos | abre o LuminSDK |
| aba **Lumin** na barra da esquerda | abre o LuminSDK |

A URL **nunca** muda ao trocar de aba. Endereços antigos (`/gn/`, `/sites/`, `/study/`) continuam
funcionando: eles redirecionam para `?view=…`, o app abre a aba pedida e limpa a barra de endereço na
mesma hora — reabrir o site depois cai, de novo, nos estudos.

A entrada é decidida por `assets/js/app.js` (o mesmo arquivo que troca de aba), o atalho de teclado
fica nele e a saída em `assets/js/study.js`. A versão de arquivo único (`single/index.html`) **não**
tem estudos — é sempre o catálogo de jogos. Cada arquivo é independente: nada do StudyDesk vaza para
o visual escuro do LuminSDK.

A aba **GN-Math** é uma página separada, não um tema, mas organizada como a biblioteca do LuminSDK:
cabeçalho com busca, filtros em chips, ordenação, grade responsiva de capas quadradas com nome
legível (nada de texto miúdo sobre imagem grande), favorito, “continuar jogando” e um player que abre
o jogo aqui dentro — abrir um jogo não mexe na URL. O visual é próprio: fundo de grafite com grade,
cursor desenhado e painel de ajustes só dela (cor de destaque, fundo, cursor, densidade, efeitos,
movimento).
As preferências ficam em `gnmath:v1:*`, separadas de `luminsdk:v1:*` — mudar uma aba não mexe na outra.

Os jogos do GN-Math são carregados do CDN público do projeto (`freebuisness/html`), com as capas de
`freebuisness/covers`. Para atualizar a lista:

```bash
python3 tools/gnmath-sync.py          # baixa o zones.json e regrava assets/data/gnmath-games.json
```

A página abre cada jogo dentro do player: baixa o HTML do arquivo, injeta um `<base>` com a pasta
certa (do mesmo jeito que o site do GN-Math faz) e escreve no iframe. Quando o arquivo é um
YouTube Playables, o player avisa e oferece “abrir em outra aba”.

O download tenta **quatro espelhos** em ordem — jsDelivr, `raw.githubusercontent.com`,
`raw.githack.com` e `cdn.statically.io` — porque o repositório é grande e às vezes o jsDelivr devolve
404/403. Se todos falharem, o iframe recebe o endereço direto do arquivo (o navegador pode conseguir
abrir mesmo assim) e o aviso continua na tela com **“Abrir em outra aba”**. As capas também têm
espelho: se a imagem falhar, a carta mostra o monograma do jogo.

No player do LuminSDK (aba **Lumin**), quando um jogo não carrega em 20 s aparece **Tentar novamente**
e **Abrir em nova aba** — esse último abre o endereço do jogo numa aba limpa, sem referrer.

---

## Como usar

### Jogar

Acesse **[suckinguptoessry.github.io/LuminSDK](https://suckinguptoessry.github.io/LuminSDK/)** e pronto. 🎮

### Rodar localmente

Não é preciso instalar nada — é HTML, CSS e JS estáticos.

```bash
git clone https://github.com/SuckingUpToesSry/LuminSDK.git
cd LuminSDK

# qualquer servidor estático funciona
python3 -m http.server 8080
# ou
npx serve .
```

Depois abra `http://localhost:8080`.

> Abrir o `index.html` direto pelo sistema de arquivos também funciona na maioria dos navegadores,
> mas usar um servidor local evita restrições de CORS do navegador.

### Usar como base para o seu projeto

1. Faça um **fork** do repositório.
2. Troque os textos, cores e o nome em `index.html` e `assets/css/styles.css`.
3. Ative o **GitHub Pages** em *Settings → Pages → Deploy from a branch → `main` / root*.
4. Publique — não há etapa de build.

### Exportar para outro repositório (pacote portátil)

Para levar o site inteiro para outro repositório — com **links, autor, nome e CDN já ajustados** —
use o empacotador:

```bash
# 1. edite os seus dados
#    (projectName, author, repoUrl, siteUrl, basePath, sdkUrl)
nano tools/package.config.json

# 2. gere a pasta + zip
./tools/package.sh            # ou: python3 tools/package.py

# resultado:
#   export/luminsdk-portable/       → conteúdo pronto para colar no outro repositório
#   export/luminsdk-portable.zip    → mesma coisa compactada
```

O script copia apenas o necessário, reescreve os links do projeto e ainda gera:

| Arquivo | O que faz |
|---|---|
| `README.md` | guia de instalação e personalização do pacote |
| `LICENSE` | MIT preservando o crédito original **e** o novo mantenedor |
| `manifest.webmanifest` | nome, `id` e `start_url` com o seu `basePath` |
| `robots.txt` / `sitemap.xml` | apontando para o seu `siteUrl` |
| `.nojekyll` | evita o processamento do Jekyll no GitHub Pages |
| `.gitignore` / `.editorconfig` | higiene do repositório novo |
| `PORTABLE-NOTE.txt` | resumo da origem do pacote |

Opções:

```bash
python3 tools/package.py --out ../meu-export     # outra pasta de saída
python3 tools/package.py --no-zip                # só a pasta
python3 tools/package.py --config meu.json       # outro arquivo de configuração
```

O pacote é **estático e independente**: não importa `tools/`, não tem dependências e funciona em
qualquer hospedagem. Só lembre de manter o `LICENSE` com o crédito de Ryan Smith.

### Versão de arquivo único (um HTML só)

Precisa do site inteiro num **único arquivo** — para colar num Gist, no CodePen, mandar por
e-mail ou publicar sem pasta nenhuma? O gerador junta HTML, CSS, JS e o ícone num só arquivo:

```bash
python3 tools/single-file.py             # gera single/index.html (~380 KB)
python3 tools/single-file.py --out /tmp/luminsdk.html
```

O resultado abre direto no navegador, sem servidor e sem build. O único item externo é o
script do LuminSDK no CDN (as fontes do Google são opcionais e têm fallback).

O arquivo único traz **só a aba Lumin** (o catálogo): a tela de entrada, o LuminOS, o rail de abas,
o chat e as views GN-Math/Sites/Estudos/Nav ficam de fora, porque dependem de CSS e JS carregados
por aba. Assim nada quebra e nenhuma aba fica sem estilo.

> **Sobre o Pastebin:** o raw do Pastebin é entregue como `text/plain`, então o navegador
> mostra o código em vez da página. Para ter uma URL que realmente abre o site, use Gist +
> `raw.githack.com`, CodePen, JSFiddle ou o próprio GitHub Pages.

A versão gerada fica publicada em [`single/`](single/) →
`https://suckinguptoessry.github.io/LuminSDK/single/`.

---

## Estrutura do projeto

```text
LuminSDK/
├── index.html                  # O SITE INTEIRO: todas as abas em uma página só
├── 404.html                    # Página de erro personalizada
├── assets/
│   ├── css/
│   │   └── styles.css          # Design system, tema claro/escuro e componentes
│   ├── js/
│   │   ├── library.js          # Interface de jogos, favoritos, histórico e cores por jogo
│   │   ├── settings.js         # Personalização (21 opções), perfis e sugestão
│   │   ├── progress.js         # Estatísticas do jogador e conquistas
│   │   ├── site.js             # Tema, animações, PWA e cópia do snippet
│   │   ├── atmosphere.js       # Paleta, partículas, parallax e cursor
│   │   ├── bonus.js            # Central de bônus: controle, rede, cache, estatísticas e conquistas
│   │   ├── app.js              # Aba única: rotas por sessionStorage, carrega cada aba sob demanda
│   │   ├── os.js               # LuminOS: janelas, dock e apps (jogos, navegador, sites, notas…)
│   │   ├── player.js           # LuminPlayer: XP, conquistas, coleções e sessões
│   │   ├── profile.js          # App Perfil (hub do jogador)
│   │   ├── lab.js              # App Laboratório (controle, teclado/mouse, latência, diagnóstico)
│   │   ├── studio.js           # App Estúdio (tema, modos, paleta Ctrl+K, avisos)
│   │   ├── arcade.js           # App Arcade (alvo, bichinho, quiz, sons, cronômetro, conversor)
│   │   ├── vault.js            # App Cofre (backup, códigos, dados e área do desenvolvedor)
│   │   ├── community.js        # App Comunidade (coleções por código, recomendações, wishlist)
│   │   ├── central.js          # App Central (busca, janelas, diagnóstico, desempenho, dados, ajuda)
│   │   ├── hub.js              # Aba Hub: monta os apps do OS dentro do site normal
│   │   ├── social.js           # Presença, chat global e canal de comandos (painel)
│   │   ├── browser.js          # Navegador: barra de endereço, home e aba limpa
│   │   ├── provider.js         # Catálogos DuckMath/Astra: filtros, busca, minimal e player
│   │   ├── gnmath.js           # Aba GN-Math (catálogo + player, com espelhos de CDN)
│   │   ├── sites.js            # Aba Sites (coleções + visualizador + aba limpa)
│   │   └── study.js            # Aba Estudos (busca, planejador, cronômetro, teste rápido)
│   ├── css/app.css             # Casca do app de aba única (mostra/esconde a view)
│   ├── css/hub.css             # Aba Hub: moldura, chips e palco dos apps do OS
│   ├── css/provider.css        # Catálogos DuckMath/Astra: chips, grade, lista minimal e player
│   ├── data/
│   │   └── sites.json          # Dados da aba Sites: 67 coleções / 749 links
│   └── img/                    # Marca, ícones do PWA, banner social e arte da aba Sites
├── gn/ · sites/ · study/       # Atalhos antigos: redirecionam para a URL única
├── single/                     # Versão de arquivo único, gerada por tools/single-file.py
├── manifest.webmanifest        # Instalação como aplicativo
├── sw.js                       # Service worker (offline da casca do site)
├── tools/
│   ├── package.py              # Empacotador portátil (pasta + zip)
│   ├── package.sh              # Atalho do empacotador
│   ├── package.config.json     # Seus dados: nome, autor, links e CDN
│   └── single-file.py          # Gera a versão de arquivo único (HTML+CSS+JS juntos)
├── CONTRIBUTING.md             # Guia de contribuição
├── LICENSE                     # MIT
└── README.md
```

---

## Como a integração funciona

O site usa o SDK em **modo headless** — o LuminSDK entrega os dados e o player, e a interface é
desenhada por este projeto:

```html
<script src="https://cdn.jsdelivr.net/gh/luminsdk/script@latest/lumin.min.js"></script>
<script>
  // 1. conecta sem renderizar a UI padrão
  await Lumin.init({ headless: true });

  // 2. busca os jogos
  const { games, total, pages } = await Lumin.getGames({ page: 1, limit: 24, q: 'puzzle' });

  // 3. resolve a capa de cada jogo
  const cover = await Lumin.getImageUrl(games[0].image_token);

  // 4. abre um jogo no player próprio
  const { url } = await Lumin.getGameUrl(games[0].id);
  iframe.src = url;
</script>
```

### Métodos usados

| Método | Para que serve neste site |
|---|---|
| `Lumin.init({ headless: true })` | Conecta ao catálogo sem renderizar a UI padrão |
| `Lumin.getGames({ page, limit, q })` | Grade paginada e busca |
| `Lumin.getRandomGames(n)` | Botão “Aleatório” |
| `Lumin.getCategories()` | Chips de categoria e contador de categorias |
| `Lumin.getImageUrl(token)` | Capas dos cards (carregadas sob demanda) |
| `Lumin.getGameUrl(id)` | URL do jogo para o player próprio |
| `Lumin.loadGame(id)` | Fallback quando o player próprio não está disponível |

### Jogos de outros sites (Endereços próprios)

Alguns títulos não rodam no player do LuminSDK e sim num site externo. Esses casos ficam em
`CONFIG.customSources`, no topo de `assets/js/library.js`:

```js
customSources: [
  {
    id: 'selenite/undertale',
    name: 'undertale',
    url: 'https://toby.booksforschool.online/index.html#z4x',
    label: 'Toby Web'
  }
]
```

O jogo é reconhecido pelo `id` do catálogo e, se ele mudar, pelo **nome exato** — por isso
`Undertale Yellow`, que tem id e nome diferentes, continua abrindo no player normal. Ao abrir um
desses títulos, o cabeçalho do player mostra um selo (ex.: “Toby Web”) com o domínio de destino na
dica de tela; se a página não carregar no iframe, o botão “abrir em outra aba” resolve.

> A documentação completa (configuração, eventos e todos os métodos) está em
> **[docs.luminsdk.com](https://docs.luminsdk.com/)**.

---

## Personalização

As cores e o espaçamento ficam em variáveis CSS no topo de `assets/css/styles.css`:

```css
html[data-theme="dark"] {
  --violet: #8b5cf6;   /* cor de destaque principal */
  --cyan:   #22d3ee;   /* gradientes e brilhos */
  --bg:     #07070c;   /* fundo */
  --text:   #f4f4fa;   /* texto */
}
```

Ajustes rápidos:

| O que mudar | Onde |
|---|---|
| Nome, textos e links | `index.html` |
| Cores, fontes e raios | `:root` em `assets/css/styles.css` |
| Jogos por página e colunas | `layoutInfo()` em `assets/js/library.js` (ou use os sliders do site) |
| Tamanhos de card (P/M/G) | `CONFIG.cardSizes` em `assets/js/library.js` |
| Detecção de dispositivo | `detectDevice()` em `assets/js/settings.js` |
| Presets de desempenho | `PRESETS` em `assets/js/settings.js` |
| Sugestão personalizada | `buildSuggestion()` em `assets/js/settings.js` |
| Conquistas e metas | `ACHIEVEMENTS` em `assets/js/progress.js` |
| Desafios diários | `dailyChallenges()` em `assets/js/progress.js` |
| Recomendações | `preferredCategories()` em `assets/js/library.js` |
| Cor padrão do site | `--accent` em `:root` (`assets/css/styles.css`) |
| Cores da paleta rápida | `PRESETS` em `assets/js/atmosphere.js` |
| Quantidade de partículas | `resize()` em `assets/js/atmosphere.js` |
| Velocidade do fundo | `parallax()` em `assets/js/atmosphere.js` |
| Máximo de categorias exibidas | `CONFIG.maxCategories` em `assets/js/library.js` |
| Tema inicial | `applyTheme()` em `assets/js/site.js` |

### Aparência

Os controles ficam na barra acima da grade:

- **Colunas / Linhas** — definem a grade e quantos jogos aparecem por página (o botão **Auto** volta ao tamanho calculado pela tela).
- **P / M / G** — tamanho dos cards; recalcula as colunas para caber mais ou menos jogos.
- **Cor** — painel com 12 cores prontas, seletor livre e matiz. Tudo é recalculado a partir dessa cor:
  destaque, gradientes, brilhos, partículas, cursor e até o glow do fundo.

Dentro do player há ainda **cor por jogo**, **compartilhar**, **outro jogo**, **reiniciar** e **tela cheia**.

### Teclado dentro do jogo (WASD, setas, espaço)

O jogo roda em um `<iframe>` de outro domínio. Para o teclado funcionar, **o foco precisa estar dentro
do iframe** — senão as teclas vão para a página e o personagem não se mexe. O site cuida disso:

- o player **não usa `<dialog>` modal**: em Firefox, Safari e alguns Chromium o iframe dentro de um
  diálogo modal recebe cliques do mouse mas nunca ganha foco de teclado. O overlay é uma `div` comum;
- assim que o jogo carrega, o iframe recebe o foco várias vezes (0, 120, 350, 800, 1600 e 2800 ms),
  porque alguns navegadores só entregam o foco depois que o documento interno termina de montar;
- o foco volta ao jogo quando a aba/janela é reativada, quando a tela cheia muda e sempre que uma
  tecla chega à página (sinal de que o iframe perdeu o foco);
- **não existe nenhum atalho de teclado no site** — nem `/`, nem `Ctrl`+`K`, nem `R`, nem `?`, nem `F`.
  WASD, setas, espaço, Enter, números e todas as outras teclas pertencem ao jogo;
- o botão **Abrir em outra aba** cobre os jogos que rodam dentro de outro iframe e bloqueiam o foco no
  clique (aí o jogo só aceita teclado como página principal);
- se o navegador recusar o foco, aparece a dica *“Clique no jogo para o teclado funcionar”*
  (que também pode ser clicada para devolver o foco).

### Bônus (ferramentas extras)

O botão **Bônus**, no cabeçalho, abre uma central de ferramentas que rodam 100% no navegador:

- **Testador de controle** — mostra em tempo real cada botão, gatilho e analógico do controle
  conectado (Gamepad API por *polling*), com zona morta ajustável, leitura bruta e teste de vibração
  quando o controle e o navegador oferecem suporte. Feito pensando no **navegador do Xbox (Edge)**:
  nada de Web Bluetooth, WebUSB, Keyboard Lock ou APIs experimentais.
- **Monitor de conexão** — estado online/offline, tipo de rede, velocidade e latência estimadas
  (quando o navegador informa) e um teste de latência real contra o próprio site.
- **Gerenciador de cache** — espaço usado, caches guardados, estado do service worker, botão para
  procurar atualização e limpeza segura (com recarga).
- **Desafios do dia** — três metas que mudam à meia-noite, com barra de progresso e a sequência de
  dias em que você fechou as três.
- **Estatísticas** — partidas, tempo total, jogos e categorias, sequência de dias, gráfico dos
  últimos 7 dias, mais jogados e um botão para zerar tudo.
- **Conquistas** — 17 medalhas com progresso, desbloqueio automático e um *toast* quando cai
  alguma (as secretas só revelam a dica depois de conquistadas).

O painel lista só o que já funciona. A próxima leva — coleções, início rápido, layout dos jogos,
modo imersivo e backup completo — entra nas próximas atualizações.

### O que fica no navegador

| Salvo pelo site | Detalhe |
|---|---|
| Favoritos | lista com nome, categoria e capa |
| Histórico | últimos 10 jogos abertos |
| Contagem de partidas | usada pela ordenação “Mais jogados” |
| Cores por jogo, grade, tema e paleta | preferências |
| Personalização (`luminsdk-settings`) | 21 opções de aparência e desempenho |
| Estatísticas, conquistas e desafios (`luminsdk:progress:v1`) | partidas, tempo, dias, categorias, medalhas e metas do dia |
| Recomendações ocultas (`luminsdk:v1:reco-hidden`) | lembra que você escondeu o trilho hoje |
| Backup | exporta/importa tudo em JSON |

O **progresso dentro do jogo** pertence ao jogo e roda em outro domínio: por segurança, o navegador
impede que o site leia ou grave esse estado. Quem salva é o próprio jogo (muitos fazem isso
automaticamente). O site não tem — e não finge ter — acesso a isso.

### Personalização e desempenho

O botão de engrenagem abre o painel **Personalizar**, com **21 opções**:

- **Sugestão para você** — o site lê o aparelho (núcleos, memória, economia de dados, tela pequena,
  `prefers-reduced-motion`) e o seu histórico local (partidas, jogos diferentes, sequência de dias) e
  propõe uma combinação com os motivos listados. Um clique aplica; outro ignora.
- **Tema e cor** — claro/escuro e 16 cores prontas (incluindo quatro Y2K: cromado, cyber, aqua e
  bubblegum); a cor recalcula destaque, gradientes, brilhos, partículas e cursor.
- **Estilo** — fonte (Inter, Grotesk ou Mono), cantos (retos, suaves ou bolha), densidade
  (confortável/compacta) e velocidade das animações (lentas/normais/rápidas).
- **Estilo Y2K** — pacote completo ou efeito por efeito: títulos cromados, botões de vidro, cantos de
  bolha, neon, glow, estrelas, bolhas e scanlines.
- **Desempenho** — partículas, parallax, cursor, animações, desfoques, hover, grade e ruído;
  **Detectar automático**, **Modo leve** e **Tudo ligado** em um clique.
- **Meus dados** — exportar backup, importar e apagar tudo, com o resumo do que está guardado.

As escolhas são aplicadas antes da página pintar (sem piscar) e ficam em `luminsdk-settings`.

As partículas também se ajustam sozinhas: limite de ~40 fps, menos pontos em máquinas fracas, pausa
quando a aba fica oculta e conexões calculadas por grade espacial (sem custo quadrático).

Efeitos e cursor ficam **ligados por padrão** em qualquer aparelho: quem quiser desliga no painel, um
por um. Com `prefers-reduced-motion`, o site para de animar sozinho mas continua respondendo ao
mouse (brilho, laços e cursor), sem transições. Preferências antigas (formato anterior) são
descartadas na primeira carga para ninguém ficar com efeitos desligados sem saber.

### Links e compartilhamento

O endereço do site é **um só** (`…/LuminSDK/`): busca, filtro, página, favoritos e jogo aberto **não**
vão para a URL. O botão **compartilhar** do player copia o endereço do site — quem abrir cai na mesma
porta de entrada (os estudos) e pode jogar pelo catálogo.

### Modo demonstração

Adicione `?demo` à URL (`.../LuminSDK/?demo`) para ver a interface com cards de exemplo, sem
depender do catálogo. Útil para desenvolver o layout offline.

### Atalhos de teclado

O site **não tem atalhos de teclado**. Nem `F` (tela cheia), nem `R` (jogo aleatório), nem `/` ou
`Ctrl`+`K` (busca), nem `?` (configurações). Tudo isso é feito pelos botões da interface, para que
nenhuma tecla seja roubada do jogo: com o player aberto, todas as teclas (WASD, setas, espaço,
Enter, F, números…) vão para o jogo.

---

## Acessibilidade e desempenho

- Estrutura semântica com landmarks, `aria-live` no status e nos resultados, e *skip link*.
- Navegação completa por teclado, com `:focus-visible` visível em todos os controles.
- Imagens de capa carregadas por `IntersectionObserver` (só o que está perto da tela).
- CSS e JS sem dependências: nenhum framework, nenhuma fonte bloqueante além do Google Fonts
  (com *fallback* para fontes do sistema).
- Respeito a `prefers-reduced-motion` e suporte nativo a tema claro/escuro.

### Leveza (mesmo visual, menos trabalho)

Nada aqui mudou a aparência: as otimizações foram feitas por baixo do capô.

| O que | Antes | Depois |
|---|---|---|
| Ícones do PWA e da marca | 292 KB | **87 KB** (PNG em 256 cores, erro médio ~2/255) |
| Primeira visita (HTML + CSS + JS + imagens) | ~647 KB | **~446 KB** |
| Pré-cache do service worker | ~700 KB baixados no `install` | **~330 KB** (só a casca essencial; o resto entra on-demand) |

- **Cards reaproveitados:** busca, filtro e paginação não reconstroem mais a grade inteira — os cards
  que continuam na lista são os mesmos nós do DOM, então não há nova requisição de capa nem “piscada”.
- **Cursor:** o laço de animação só roda enquanto o anel ainda está alcançando o ponteiro (parado,
  zero frames).
- **Partículas:** pausam automaticamente enquanto um jogo está aberto — a CPU fica com o jogo.
- **Player:** o desfoque de tela cheia é desligado durante o jogo, que é justamente quando a GPU é
  mais necessária.
- **Abaixo da dobra:** FAQ, open-source e rodapé usam `content-visibility: auto`, então não são
  medidos nem desenhados antes de chegarem perto da tela.

---

## Contribuindo

Contribuições são muito bem-vindas! Leia o [CONTRIBUTING.md](CONTRIBUTING.md) para o passo a passo.

Resumo:

1. Abra uma **issue** descrevendo o problema ou a ideia.
2. Faça um **fork** e crie uma branch (`feat/minha-melhoria`).
3. Envie um **pull request** explicando o que mudou (prints ajudam).
4. Mantenha o código simples, sem dependências e em português nos textos da interface.

---

## Licença

Distribuído sob a licença **MIT** — use, copie, modifique e publique, mantendo o aviso de copyright.
Veja [LICENSE](LICENSE).

```text
MIT License · Copyright (c) 2026 Ryan Smith
```

---

## Créditos

- **Ryan Smith** — criação e manutenção deste site.
- **[LuminSDK](https://docs.luminsdk.com/)** — catálogo, API e player dos jogos.
- **Tipografia** — [Inter](https://rsms.me/inter/) e [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk).
- **Todos os jogos e suas artes pertencem aos seus respectivos autores.**

<div align="center">

Feito com 💜 por **Ryan Smith**

</div>
