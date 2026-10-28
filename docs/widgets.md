# Home com widgets (Frame Home)

Layout **Widgets** do CleanFrame para a Samsung The Frame: uma faixa de widgets em duas linhas que desliza para o lado, uma dock de ícones quadrados e fundos em degradê. O foco imita o Apple TV (tvOS): o item escolhido cresce com sombra, inclina para o lado do movimento, balança devagar com um brilho, afunda ao apertar OK, mostra o nome embaixo, e os botões de vidro ficam brancos. Ao bater na borda ele dá um tranco, e há sons suaves de navegação (Personalizar → Sons). Em instalações novas ele é o layout padrão; quem já usava o CleanFrame encontra em Configurações → Layout → Widgets.

Feito para a QN43LS03BAGXZD (The Frame 2022, Tizen 6.5): só animações de posição e opacidade, sem desfoque em tempo real, dados em cache e atualizações apenas enquanto a home está visível.

## Usando com o controle

| Tecla | Na faixa de widgets | Na dock |
| --- | --- | --- |
| Setas | Movem o foco para o card mais próximo naquela direção; a faixa desliza sozinha | ◀ ▶ trocam de app; ▲ volta para a faixa |
| ▼ na última linha | Desce para a dock | — |
| OK | Ação do card (abaixo) | Abre o app |
| Voltar | Volta ao início da faixa; no início, pergunta se quer ir para a Home da Samsung | Volta para a faixa |

| Card | OK faz |
| --- | --- |
| YouTube, Globoplay, Netflix, Mercado Play | Abre o app |
| Clima | Atualiza a previsão |
| Spotify | Pausa/toca (com a conta conectada); sem conta, abre o Spotify |
| Stremio | Abre o Stremio (o card mostra onde você parou) |
| HBO Max | Abre a HBO Max (o card mostra títulos em alta no catálogo) |
| Volume | Entra no ajuste: ▲ ▼ mudam o volume, OK sai. Volume no zero = mudo |
| Brilho | Abre os ajustes de imagem da TV (a Samsung não libera brilho para apps) |
| Pluto TV | Abre o Pluto TV (o card mostra o que está passando) |
| Wi-Fi | Abre os ajustes de rede |
| Tema (◐) | Alterna cartões claros/escuros |
| Luz | Liga/desliga a luz pelo SmartThings |
| Central (4 bolinhas) | Modo Arte · Saída de áudio · Modo de imagem · Timer (os três últimos abrem os ajustes da TV) |
| Manchetes g1 | Abre o g1 no navegador da TV |
| Alexa, Navegador | Abrem o app |
| Personalizar | Fundos, cartões claros/escuros e mais opções |
| Todos os apps | Lista de apps instalados do CleanFrame |

**Personalizar:** escolha entre 8 degradês (Rubi, Oceano, Aurora, Entardecer, Lavanda, Floresta, Grafite, Meia-noite). Passar o foco mostra a prévia ao vivo; OK aplica e salva; Voltar fecha sem mudar.

## Visual Apple (só no seu pacote pessoal)

Fontes SF Pro, SF Symbols e os ícones dos apps (iPadOS/iOS) ficam em `.local/apple/`, fora do Git. O preview privado e o pacote pessoal geram `apple/apple.css` e `apple/manifest.js` a partir dessa pasta. A exportação pública usa os arquivos vazios de `app/apple/` e cai para Inter e os ícones próprios. Nunca publique o pacote pessoal.

Ordem dos ícones: ícone quadrado da Apple → ícone instalado na TV → marca provisória.

## De onde vêm os dados

| Widget | Fonte | Precisa de | Oficial? |
| --- | --- | --- | --- |
| Clima | Open-Meteo | nada | sim (gratuita) |
| Spotify | Spotify Web API | app de desenvolvedor + conta Premium | sim |
| HBO Max | TMDB (catálogo por streaming no Brasil) | chave gratuita do TMDB | sim (uso pessoal, com crédito ao TMDB) |
| Stremio | API da biblioteca do Stremio | chave de login | **não oficial** — pode parar sem aviso |
| Pluto TV | Guia de programação do Pluto | nada | **não oficial** — pode parar sem aviso |
| Manchetes | RSS do g1 | nada | sim (feed público) |
| Luz | SmartThings | token pessoal + ID do dispositivo | sim |
| Volume, Wi-Fi | APIs da própria TV | nada | sim |

Sem a chave, cada card mostra um aviso curto na TV e continua funcionando como atalho. No navegador (preview) aparecem dados de exemplo.

> Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.

## Conectando as contas (uma vez, no computador)

As chaves ficam em `.local/` (fora do Git). Elas entram apenas no preview privado e no pacote pessoal da TV — nunca na exportação pública.

1. **Spotify**
   - Crie um app em <https://developer.spotify.com/dashboard> com o Redirect URI `http://127.0.0.1:8888/callback` e marque Web API.
   - Rode `npm run widgets:keys -- spotify SEU_CLIENT_ID`, abra o link que aparecer e autorize.
   - Desde fevereiro de 2026, apps em modo de desenvolvimento exigem que o dono tenha Spotify Premium.
2. **TMDB (HBO Max)**: crie uma conta, gere a chave em <https://www.themoviedb.org/settings/api> e rode `npm run widgets:keys -- set tmdb.apiKey SUA_CHAVE`.
3. **Stremio**: `npm run widgets:keys -- stremio` e informe e-mail e senha. A senha não é guardada; só a chave de sessão.
4. **Luz (opcional)**: gere um token em <https://account.smartthings.com/tokens> e rode:
   - `npm run widgets:keys -- set smartthings.token TOKEN`
   - `npm run widgets:keys -- set smartthings.lightId ID_DA_LAMPADA`
5. **Pluto TV (opcional)**: para seguir um canal, `npm run widgets:keys -- set pluto.channel "nome do canal"`.
6. **Foto de perfil**: salve uma foto quadrada como `.local/widgets-profile.jpg` e rode `npm run widgets:keys -- set profilePhoto widgets/profile.jpg`.

`npm run widgets:keys -- show` lista o que já está configurado (sem mostrar os valores). Nome, cidade e apps da dock ficam em `app/widgets/config.js`.

## Testar no computador

```sh
npm ci
npm run dev                      # http://localhost:4795/home/ — setas, Enter = OK, Esc = Voltar
npx playwright install chromium  # uma vez
CLEANFRAME_PUBLIC_FONTS=1 npm run check:widgets
```

`check:widgets` simula todas as APIs com respostas de teste e confere dados, navegação, dock, Personalizar e preferências salvas; os prints ficam em `dist/widgets-check/`.

## Instalar na TV (com o Claude no Mac)

O passo a passo completo está em [agent-tv-setup-guide.md](agent-tv-setup-guide.md). Em resumo:

1. Instale o **Tizen Studio / Samsung TV SDK** e crie seus certificados Samsung (o certificado de distribuidor precisa do DUID da TV).
2. Na TV: Apps → Configurações do app → digite `12345` → ative o **Developer Mode** com o IP do Mac. Reinicie a TV.
3. Copie `signing.example.json` para `.local/signing.json` e preencha com o seu perfil e IDs.
4. Crie `.local/device.json` com `{"host": "IP_DA_TV"}`.
5. Rode `npm run package` e `npm run tv:install`. Depois `npm run tv:launch` para abrir.
6. Fixe o CleanFrame em primeiro na fileira de apps da Samsung.
   - Trocar o botão Home é um passo separado e arriscado em modelos 2022: veja [tv-status.md](tv-status.md) e só faça com um ponto de recuperação salvo.

## O que ainda precisa ser confirmado na TV

- Volume pelo `tvaudiocontrol` e leitura do Wi-Fi pelo `systeminfo` no Tizen 6.5.
- Se a TV aceita as chamadas de rede do app para todas as fontes. O pacote declara `internet` e `access origin="*"`.
- Os nomes dos apps instalados na TV brasileira (Globoplay, Mercado Play, Pluto TV, Alexa). O app procura pelo ID e, se não achar, pelo nome. Se algum não abrir, ajuste `match` em `config.js`.
- Os ícones originais dos apps vêm da própria TV. No preview aparecem marcas e cores provisórias.

## Próximos passos possíveis

- Modo edição (mover e redimensionar widgets com o controle, como no iPhone).
- Controle real de saída de áudio, modo de imagem e timer via SmartThings.
- Tradução do restante das telas do CleanFrame (Configurações, Todos os apps) para português.
